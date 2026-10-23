'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore, waitForPendingCartUpdates } from '@/store/cart-store';
import { startRazorpayPayment } from '@/lib/razorpay-checkout';
import { calculateCartPricing } from '@/lib/pricing';
import { formatINR } from '@/lib/format';
import { useCartCoupon } from '@/features/cart/use-cart-coupon';

import './checkout.css';
import { AddressManager } from './_components/address-manager';
import { PaymentSection } from './_components/payment-section';
import {
  DesktopSummary,
  MobileSummaryBar,
  PlaceOrderButton,
  TrustRow,
} from './_components/order-summary';
import { SegmentedProgress, StepProgress } from './_components/progress';
import { ConfirmedCard, StatusPanel } from './_components/status-panel';
import {
  apiRequest,
  friendlyError,
  type Address,
  type PaymentId,
  type Phase,
} from './_components/shared';
import { CustomerAuthGate } from '@/components/auth/customer-auth-gate';

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="ck min-h-screen">{children}</div>;
}

function SectionCard({
  index,
  title,
  sub,
  badge,
  children,
  id,
}: {
  index: string;
  title: string;
  sub: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <section className="ck-panel p-4 sm:p-6" aria-labelledby={id}>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <span className="ck-chip-chrome flex h-11 w-11 shrink-0 items-center justify-center  text-sm font-semibold">
            {index}
          </span>
          <div>
            <h2 id={id} className="text-lg font-semibold leading-tight text-[#ffffff]">
              {title}
            </h2>
            <p className="mt-0.5 hidden text-xs text-[#C0C0C0]/70 sm:block">{sub}</p>
          </div>
        </div>
        {badge}
      </header>
      {children}
    </section>
  );
}

function Badge({ children, tone = 'cyan' }: { children: React.ReactNode; tone?: 'cyan' | 'green' }) {
  const cls =
    tone === 'green'
      ? 'border-[#3A3A3A] text-[#C0C0C0]'
      : 'border-[#3A3A3A] text-[#C0C0C0]';
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${cls}`}>
      {children}
    </span>
  );
}

type PendingOrder = { id: string; number: string; addressId: string };

const BUSY_LABEL: Partial<Record<Phase, string>> = {
  creating: 'Creating order…',
  opening: 'Opening Razorpay…',
  awaiting: 'Awaiting payment…',
  verifying: 'Verifying…',
};

function CheckoutPageView() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  // Hydration fix: the persisted cart only exists on the client, so the server
  // and the first client render must output the same neutral markup. We switch
  // to the real checkout UI only after mount.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initializeCart = async () => {
      try {
        const token = window.localStorage.getItem('ardenby_token');
        const cartState = useCartStore.getState();

        if (token) {
          // Keep the current in-memory cart (including the latest optimistic
          // quantity changes). Only fetch the server cart when the store is empty.
          if (cartState.items.length === 0) {
            await cartState.loadUserCart();
          }
        } else {
          cartState.loadGuestCart();
        }
      } catch (error) {
        console.error('Unable to initialize checkout cart:', error);
      } finally {
        if (!cancelled) setMounted(true);
      }
    };

    void initializeCart();

    return () => {
      cancelled = true;
    };
  }, []);

  // Coupon state is shared with the cart drawer / cart page (same validate
  // endpoint, server sync and localStorage record).
  const rawSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const coupon = useCartCoupon(rawSubtotal);

  const [placed, setPlaced] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [failure, setFailure] = useState('');
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentId>('online');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // A ref (not state) so a double click can never start two orders before
  // React re-renders with the disabled button.
  const lock = useRef(false);
  const statusRef = useRef<HTMLDivElement>(null);

  const busy = phase === 'creating' || phase === 'opening' || phase === 'awaiting' || phase === 'verifying';

  useEffect(() => {
    if (phase === 'failed') {
      statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [phase]);

  const fail = (message: string) => {
    setFailure(message);
    setPhase('failed');
  };

  // Opens Razorpay for an order that is waiting for payment. Resolves once the
  // flow reached a final state; the caller owns the lock.
  const payPendingOrder = async (
    id: string,
    number: string,
    prefill?: { name?: string; contact?: string }
  ) => {
    setPhase('opening');

    const result = await startRazorpayPayment(id, prefill, (p) =>
      setPhase(p === 'opened' ? 'awaiting' : 'verifying')
    );

    if (result.status === 'paid') {
      setOrderNumber(result.orderNumber);
      setPendingOrder(null);
      clearCart();
      setPhase('confirmed');
      setPlaced(true);
      return;
    }

    if (result.status === 'failed') {
      fail(result.message);
    } else {
      fail(`Payment for order ${number} was not completed. Your cart is safe, so you can try again.`);
    }
  };

  const retryPayment = async () => {
    if (!pendingOrder || lock.current) return;
    lock.current = true;
    try {
      await payPendingOrder(
        pendingOrder.id,
        pendingOrder.number,
        selectedAddress ? { name: selectedAddress.name, contact: selectedAddress.phone } : undefined
      );
    } catch (error) {
      fail(friendlyError(error, 'Unable to start payment. Please try again.'));
    } finally {
      lock.current = false;
    }
  };

  // Creates the real order on the server. The server prices it from the
  // account's server cart, so wait for any in-flight cart edits first.
  const placeOrder = async () => {
    if (lock.current || !selectedAddress) return;
    lock.current = true;

    const isOnline = selectedPayment === 'online';
    const { id: addressId, name, phone, pincode, address, city, state } = selectedAddress;

    try {
      // An unpaid online order for this same address is resumed, not duplicated.
      if (isOnline && pendingOrder && pendingOrder.addressId === addressId) {
        await payPendingOrder(pendingOrder.id, pendingOrder.number, { name, contact: phone });
        return;
      }

      setFailure('');
      setPendingOrder(null);
      setPhase('creating');

      await waitForPendingCartUpdates();

      const data = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          paymentMethod: isOnline ? 'online' : 'cod',
          shippingAddress: { name, phone, pincode, address, city, state },
        }),
      });

      const order = data?.order;
      setOrderNumber(order?.orderNumber ?? null);

      if (!isOnline) {
        clearCart();
        setPhase('confirmed');
        setPlaced(true);
        return;
      }

      // Online: the cart is kept until the payment is verified, so a failed or
      // cancelled payment loses nothing.
      setPendingOrder({ id: order.id, number: order.orderNumber, addressId });
      await payPendingOrder(order.id, order.orderNumber, { name, contact: phone });
    } catch (error) {
      fail(
        error instanceof Error && error.message === 'AUTH_REQUIRED'
          ? 'Please sign in to place your order.'
          : friendlyError(error, 'Unable to place your order. Please try again.')
      );
    } finally {
      lock.current = false;
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Guard against React portal events bubbling from the address modal.
    if (e.currentTarget !== e.target) return;
    e.preventDefault();

    if (lock.current) return;

    const signedIn = Boolean(localStorage.getItem('ardenby_token'));

    if (!selectedAddress) {
      toast.error(
        signedIn
          ? 'Please add or select a delivery address first.'
          : 'Please sign in and choose a delivery address to place your order.'
      );
      if (!signedIn) window.dispatchEvent(new Event('ardenby-open-auth'));
      return;
    }

    void placeOrder();
  };

  // Shared with the cart and the order API (lib/pricing.ts).
  const { subtotal, discount, shipping, gst, total, totalSavings } = calculateCartPricing(items, coupon.pricingCoupon);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const pricing = { subtotal, discount, shipping, gst, total, itemCount, totalSavings };

  const step: 1 | 2 | 3 = placed ? 3 : selectedAddress ? 2 : 1;
  const isOnline = selectedPayment === 'online';
  const ctaLabel = BUSY_LABEL[phase] ?? (phase === 'failed' ? 'Try again' : 'Place order');
  const resumable = Boolean(pendingOrder);

  // All hooks are declared above, so these early returns are safe.
  if (!mounted) {
    return (
      <Shell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#C0C0C0]" aria-label="Loading checkout" />
        </div>
      </Shell>
    );
  }

  if (placed) {
    return (
      <Shell>
        <div className="flex min-h-[70vh] items-center justify-center px-5 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="ck-panel w-full max-w-md p-8 sm:p-12"
          >
            <div className="mb-8 flex justify-center">
              <div className="w-full max-w-[240px]">
                <SegmentedProgress step={3} />
              </div>
            </div>
            <ConfirmedCard orderNumber={orderNumber} />
            <p className="mb-8 mt-5 text-center text-sm leading-relaxed text-[#C0C0C0]">
              Thank you for shopping with KÖVENIK. Your order is confirmed. You can track it anytime from My Orders.
            </p>
            <div className="grid gap-3">
              <Link href="/shop" className="ck-cta">
                Continue shopping <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/orders" className="ck-ghost !py-3.5">
                View my orders
              </Link>
            </div>
          </motion.div>
        </div>
      </Shell>
    );
  }

  if (!items.length) {
    return (
      <Shell>
        <div className="flex min-h-[70vh] items-center justify-center px-5 py-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="ck-panel w-full max-w-md p-10 text-center"
          >
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ck-ico">
              <ShoppingBag className="h-6 w-6" />
            </span>
            <h1 className="mb-2 text-2xl font-semibold text-[#ffffff]">Your cart is empty</h1>
            <p className="mb-6 text-sm text-[#C0C0C0]">
              Please add items to your shopping bag before proceeding to checkout.
            </p>
            <Link href="/shop" className="ck-cta">
              Shop now
            </Link>
          </motion.div>
        </div>
      </Shell>
    );
  }

  const paymentNote = isOnline
    ? 'Razorpay opens securely · verified on our server'
    : 'Pay when your order arrives · no advance payment';

  const cta = (
    <PlaceOrderButton
      label={ctaLabel}
      busy={busy}
      total={total}
    />
  );

  return (
    <Shell>
      <div className="mx-auto max-w-[1280px] px-4 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-8 lg:px-12 lg:pb-20 lg:pt-10">
        {/* ---------- header ---------- */}
        <Link
          href="/cart"
          className="hidden items-center gap-2 text-xs text-[#C0C0C0] underline underline-offset-2 transition-colors hover:text-white lg:inline-flex"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> <span className="ck-chrome-link">Back to cart</span>
        </Link>

        {/* desktop / tablet-landscape header */}
        <header className="mb-8 mt-5 hidden items-center justify-between gap-8 lg:flex">
          <div>
            <h1 className="ck-heading text-3xl sm:text-4xl">Checkout</h1>
            <p className="mt-4 flex items-center gap-3 text-base text-[#C0C0C0]">
              <Badge>
                <Lock className="h-3 w-3" /> SECURE
              </Badge>
              Complete your order and <strong className="font-semibold text-white">wear beyond ordinary.</strong>
            </p>
          </div>
          <StepProgress step={step} />
        </header>

        {/* mobile / tablet header */}
        <header className="mb-5 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/cart"
                aria-label="Back to cart"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#3A3A3A] bg-white/5 text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="ck-heading text-2xl sm:text-4xl">Checkout</h1>
            </div>
            <div className="text-right">
              <Badge>
                <Lock className="h-3 w-3" /> SECURE
              </Badge>
              <p className="mt-1.5 text-[11px] font-medium tracking-[0.14em] text-[#C0C0C0]/70">
                STEP <span className="text-[#C0C0C0]">{step}</span> / 3
              </p>
            </div>
          </div>
          <div className="mt-4">
            <SegmentedProgress step={step} />
          </div>
        </header>

        {/* ---------- body ---------- */}
        <form
          id="checkout-form"
          onSubmit={onSubmit}
          className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_420px]"
        >
          <div className="min-w-0 space-y-5 lg:space-y-6">
            <div className="lg:hidden">
              <MobileSummaryBar
                items={items}
                pricing={pricing}
                couponCode={coupon.couponCode}
                promo={coupon}
              />
            </div>

            <SectionCard
              id="delivery-heading"
              index="01"
              title="Delivery"
              sub="Where should we send your KOVENIK drop?"
              badge={
                <Badge>
                  <Truck className="h-3 w-3" /> Pan-India delivery
                </Badge>
              }
            >
              <AddressManager selectedAddressId={selectedAddress?.id || null} onSelect={setSelectedAddress} />

              <div className="mt-5">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[#C0C0C0]/70">
                  Delivery speed
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="ck-tile flex items-center gap-3 p-3 sm:p-4" data-on="true">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center  ck-ico ck-ico-blue">
                      <Truck className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#ffffff]">Standard</span>
                      <span className="hidden truncate sm:block text-[11px] text-[#C0C0C0]">
                        Free above ₹999
                      </span>
                    </span>
                    <span className="text-xs font-semibold tracking-wider text-[#C0C0C0]">
                      {shipping === 0 ? 'FREE' : formatINR(shipping)}
                    </span>
                  </div>

                  <div
                    className="ck-tile flex items-center gap-3 p-3 sm:p-4"
                    data-disabled="true"
                    aria-disabled="true"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center  ck-ico ck-ico-pink">
                      <Zap className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#ffffff]">Express</span>
                      <span className="block truncate text-[11px] text-[#C0C0C0]">Coming soon</span>
                    </span>
                  </div>
                </div>

                {selectedAddress && (
                  <p className="mt-3 flex items-center gap-2 text-xs text-[#C0C0C0]">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[#C0C0C0]" />
                    Delivering to pincode{' '}
                    <strong className="font-medium text-[#ffffff]">{selectedAddress.pincode}</strong> ·{' '}
                    {selectedAddress.city}, {selectedAddress.state}
                  </p>
                )}
              </div>
            </SectionCard>

            <SectionCard
              id="payment-heading"
              index="02"
              title="Payment"
              sub="Choose how you’d like to pay"
              badge={
                <Badge tone="green">
                  <ShieldCheck className="h-3 w-3" /> <span className="hidden sm:inline">256-bit </span>encrypted
                </Badge>
              }
            >
              <PaymentSection value={selectedPayment} onChange={setSelectedPayment} disabled={busy} />
            </SectionCard>

            <div ref={statusRef} className="scroll-mt-28">
              <StatusPanel
                phase={phase}
                message={failure}
                orderNumber={pendingOrder?.number ?? orderNumber}
                retryLabel={resumable && isOnline ? 'Retry payment' : 'Retry'}
                onRetry={() => (resumable && isOnline ? void retryPayment() : void placeOrder())}
                onReset={() => {
                  setPhase('idle');
                  setFailure('');
                }}
              />
            </div>

            <div className="lg:hidden">
              <TrustRow compact />
            </div>
          </div>

          {/* desktop summary */}
          <aside className="hidden min-w-0 lg:sticky lg:top-6 lg:block">
            <DesktopSummary
              items={items}
              pricing={pricing}
              couponCode={coupon.couponCode}
              promo={coupon}
              cta={cta}
              paymentNote={paymentNote}
            />
          </aside>
        </form>
      </div>

      {/* mobile dock */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#3A3A3A] bg-[#0A0A0A]/95 backdrop-blur lg:hidden">
        <div className="mx-auto max-w-[640px] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
          <div className="mb-2.5 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#C0C0C0]/70">Total payable</p>
              <p className="text-[11px] text-[#C0C0C0]/70">
                Incl. GST {formatINR(gst)} · {shipping === 0 ? 'Free shipping' : `Shipping ${formatINR(shipping)}`}
              </p>
            </div>
            <strong className="ck-chrome-text text-3xl font-semibold tabular-nums">{formatINR(total)}</strong>
          </div>
          <PlaceOrderButton label={ctaLabel} busy={busy} total={total} />
        </div>
      </div>
    </Shell>
  );
}

// Customer-only page: signed-out visitors are asked to sign in and brought back here.
export default function CheckoutPage() {
  return (
    <CustomerAuthGate title="Sign in to check out">
      <CheckoutPageView />
    </CustomerAuthGate>
  );
}
