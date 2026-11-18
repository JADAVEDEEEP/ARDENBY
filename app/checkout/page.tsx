'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Zap,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore, waitForPendingCartUpdates } from '@/store/cart-store';
import { startRazorpayPayment } from '@/lib/razorpay-checkout';
import { calculateCartPricing, SHIPPING_FEE, COD_LIMIT_MESSAGE } from '@/lib/pricing';
import { useMemberCartItems } from '@/hooks/use-member-pricing';
import { formatINR } from '@/lib/format';
import { useCartCoupon } from '@/features/cart/use-cart-coupon';

import './checkout.css';
import { AddressManager } from './_components/address-manager';
import { PaymentSection } from './_components/payment-section';
import {
  DesktopSummary,
  MobilePriceDetails,
  MobileSummaryBar,
  PlaceOrderButton,
} from './_components/order-summary';
import { SegmentedProgress, StepProgress } from './_components/progress';
import { AcceptedRow } from './_components/payment-logos';
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
  done,
  title,
  sub,
  badge,
  children,
  id,
}: {
  index: string;
  /** Shows a tick instead of the step number once the step is complete. */
  done?: boolean;
  title: string;
  sub: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <section className="ck-panel p-4 sm:p-6" aria-labelledby={id}>
      <header className="mb-5 flex items-center justify-between gap-3 border-b border-[#EDEDED] pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="ck-step">
            {done ? <Check className="h-4 w-4" strokeWidth={3} /> : index}
          </span>
          <div className="min-w-0">
            <h2 id={id} className="ck-h">
              {title}
            </h2>
            <p className="mt-0.5 text-[14px] leading-5 text-[#666666]">{sub}</p>
          </div>
        </div>
        <span className="hidden sm:block">{badge}</span>
      </header>
      {children}
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#666666]">{children}</span>;
}

type PendingOrder = { id: string; number: string; addressId: string };

const BUSY_LABEL: Partial<Record<Phase, string>> = {
  creating: 'Creating order…',
  opening: 'Opening Razorpay…',
  awaiting: 'Awaiting payment…',
  verifying: 'Verifying…',
};

function CheckoutPageView() {
  const storeItems = useCartStore((state) => state.items);
  // Member prices for display; the server recomputes the payable amount when the order is placed.
  const memberCart = useMemberCartItems(storeItems);
  const items = memberCart.items;
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

    if (selectedPayment === 'cod' && !codAvailable) {
      lock.current = false;
      setSelectedPayment('online');
      toast.error(COD_LIMIT_MESSAGE);
      return;
    }

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
  const baseOptions = { freeShipping: memberCart.freeShipping };
  const { codAvailable } = calculateCartPricing(items, coupon.pricingCoupon, baseOptions);
  const codSelected = selectedPayment === 'cod' && codAvailable;
  const { subtotal, discount, shipping, gst, codFee, codFeeTax, total, totalSavings } = calculateCartPricing(
    items,
    coupon.pricingCoupon,
    { ...baseOptions, cod: codSelected }
  );
  // COD switches itself off when the goods value goes over the limit (and the server
  // refuses it too); the customer is moved to online payment.
  useEffect(() => {
    if (!codAvailable && selectedPayment === 'cod') setSelectedPayment('online');
  }, [codAvailable, selectedPayment]);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const pricing = {
    subtotal,
    discount,
    shipping,
    gst,
    codFee: codFee + codFeeTax,
    total,
    itemCount,
    totalSavings,
    memberSavings: memberCart.memberSavings,
    memberTier: memberCart.member?.planName ?? null,
  };

  const step: 1 | 2 | 3 = placed ? 3 : selectedAddress ? 2 : 1;
  const isOnline = selectedPayment === 'online';
  const ctaLabel =
    BUSY_LABEL[phase] ??
    (phase === 'failed' ? 'Try again' : isOnline ? 'Place order' : 'Place COD order');
  const resumable = Boolean(pendingOrder);

  // All hooks are declared above, so these early returns are safe.
  if (!mounted) {
    return (
      <Shell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#4A4A4A]" aria-label="Loading checkout" />
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
            <p className="mb-8 mt-5 text-center text-sm leading-relaxed text-[#4A4A4A]">
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
            <h1 className="mb-2 text-2xl font-semibold text-[#111111]">Your cart is empty</h1>
            <p className="mb-6 text-sm text-[#4A4A4A]">
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
      <div className="mx-auto max-w-[1280px] px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-8 lg:px-12 lg:pb-20 lg:pt-10">
        {/* ---------- header ---------- */}
        <Link
          href="/cart"
          className="inline-flex min-h-[44px] items-center gap-2 text-[16px] text-[#444444] transition-colors hover:text-[#111111]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to bag
        </Link>

        {/* desktop / tablet-landscape header */}
        <header className="mb-8 mt-2 hidden items-end justify-between gap-8 lg:flex">
          <div>
            <h1 className="ck-display text-[40px]">Checkout</h1>
            <p className="mt-2.5 flex items-center gap-2 text-[16px] text-[#555555]">
              <Lock className="h-4 w-4 shrink-0" aria-hidden /> Complete your order in a few simple steps.
            </p>
          </div>
          <StepProgress step={step} />
        </header>

        {/* mobile / tablet header */}
        <header className="mb-5 mt-1 lg:hidden">
          <h1 className="ck-display text-[30px]">Checkout</h1>
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
              index="1"
              done={Boolean(selectedAddress)}
              title="Delivery address"
              sub="Where should we send your KOVENIK drop?"
              badge={
                <Badge>
                  <Truck className="h-4 w-4" /> Pan-India delivery
                </Badge>
              }
            >
              <AddressManager selectedAddressId={selectedAddress?.id || null} onSelect={setSelectedAddress} />

              <div className="mt-6 border-t border-[#EDEDED] pt-6">
                <h3 className="mb-3 flex items-center gap-2 text-[16px] font-bold leading-6 text-[#111111]">
                  <Truck className="h-5 w-5" aria-hidden /> Delivery options
                </h3>
                <div className="space-y-2.5">
                  <div className="ck-tile flex min-h-[72px] items-center gap-3.5 p-4" data-on="true">
                    <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#111111]">
                      <span className="h-3 w-3 rounded-full bg-[#111111]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-bold leading-6 text-[#111111]">Standard delivery</span>
                      <span className="block text-[14px] leading-5 text-[#666666]">{memberCart.freeShipping ? 'Free for KOVENIK members' : `Flat ₹${SHIPPING_FEE} per order · free for members`}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-[#111111] px-2.5 py-1 text-[12px] font-bold tracking-[0.06em] text-white">
                      {shipping === 0 ? 'FREE' : formatINR(shipping)}
                    </span>
                  </div>

                  <p className="flex items-center gap-2 text-[13px] text-[#666666]">
                    <Zap className="h-4 w-4 shrink-0" aria-hidden /> Express delivery is coming soon.
                  </p>
                </div>

                {selectedAddress && (
                  <p className="mt-4 flex items-start gap-2 text-[14px] leading-5 text-[#444444] sm:text-[15px]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      Delivering to pincode <strong className="font-semibold text-[#111111]">{selectedAddress.pincode}</strong> ·{' '}
                      {selectedAddress.city}, {selectedAddress.state}
                    </span>
                  </p>
                )}
              </div>
            </SectionCard>

            <SectionCard
              id="payment-heading"
              index="2"
              title="Payment"
              sub="Choose how you’d like to pay"
              badge={
                <Badge>
                  <ShieldCheck className="h-4 w-4" /> 256-bit encrypted
                </Badge>
              }
            >
              <PaymentSection value={selectedPayment} onChange={setSelectedPayment} disabled={busy} codAvailable={codAvailable} />
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

            <div className="space-y-4 lg:hidden">
              <MobilePriceDetails pricing={pricing} couponCode={coupon.couponCode} />
              <div className="ck-panel p-4">
                <p className="text-center text-[15px] text-[#666666]">{paymentNote}</p>
                <AcceptedRow />
              </div>
            </div>
          </div>

          {/* desktop summary */}
          <aside className="hidden min-w-0 lg:sticky lg:top-[148px] lg:block">
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
      <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t border-[#E5E5E5] bg-white shadow-[0_-10px_30px_-12px_rgba(17,17,17,.18)] lg:hidden">
        <div className="mx-auto flex max-w-[640px] items-center gap-4 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
          <div className="shrink-0">
            <p className="text-[13px] text-[#666666]">Total payable</p>
            <strong className="text-[24px] font-bold leading-none tabular-nums text-[#111111]">{formatINR(total)}</strong>
            {totalSavings > 0 && (
              <p className="mt-1 text-[12px] font-semibold text-[#111111]">You save {formatINR(totalSavings)}</p>
            )}
          </div>
          <PlaceOrderButton label={ctaLabel} busy={busy} total={total} showTotal={false} className="!min-h-[52px] min-w-0 flex-1 !px-3" />
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
