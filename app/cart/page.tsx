'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { useCartStore } from '@/store/cart-store';
import { useCartCoupon } from '@/features/cart/use-cart-coupon';
import { useHomeProducts } from '@/hooks/use-home-products';
import {
  calculateCartPricing,
  FREE_SHIPPING_THRESHOLD,
  GST_RATE,
} from '@/lib/pricing';
import { formatINR } from '@/lib/format';
import type { CartItem } from '@/types';

const CARD = 'border border-[#2A2A2A] bg-[#111111]';

const silverLink =
  'text-[#C0C0C0] underline underline-offset-2 transition-colors hover:text-white';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0C0C0]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]';

const lineKey = (item: CartItem) =>
  `${item.productId}-${item.variantId}-${item.size}-${item.color}`;

// Same key the store uses to identify a cart line.
const stockKey = (item: CartItem) =>
  `${item.productId}-${item.size}-${item.color}`;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#C0C0C0]">
      {children}
    </p>
  );
}

function ShippingProgress({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const unlocked = remaining === 0;
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className={`px-4 py-4 sm:px-5 ${CARD}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#3A3A3A] text-[#C0C0C0]">
          {unlocked ? (
            <Check className="h-4 w-4" strokeWidth={2} />
          ) : (
            <Truck className="h-4 w-4" strokeWidth={1.5} />
          )}
        </span>
        <p className="min-w-0 text-sm text-[#C0C0C0]">
          {unlocked ? (
            <>
              <span className="font-semibold text-white">Free shipping unlocked.</span>{' '}
              Your order ships on us.
            </>
          ) : (
            <>
              Add{' '}
              <span className="font-semibold text-white">{formatINR(remaining)}</span>{' '}
              more to unlock{' '}
              <span className="font-semibold text-white">free shipping</span>
            </>
          )}
        </p>
      </div>
      <div
        className="mt-3 h-1 overflow-hidden bg-[#2A2A2A]"
        role="progressbar"
        aria-label="Progress to free shipping"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div
          className="h-full bg-[#C0C0C0] transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

type LineProps = {
  item: CartItem;
  busy: boolean;
  stockLimit?: number;
  onQuantity: (item: CartItem, quantity: number) => void;
  onRemove: (item: CartItem) => void;
};

function CartLine({ item, busy, stockLimit, onQuantity, onRemove }: LineProps) {
  const atLimit = stockLimit !== undefined && item.quantity >= stockLimit;
  const off =
    item.mrp > item.price ? Math.round((1 - item.price / item.mrp) * 100) : 0;
  const href = item.slug ? `/product/${item.slug}` : undefined;

  const imageBox = (
    <div className="aspect-square w-[96px] overflow-hidden border border-[#2A2A2A] bg-black sm:w-[140px]">
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover object-center"
        />
      ) : null}
    </div>
  );

  const stepper =
    'flex h-10 w-10 items-center justify-center bg-[#1A1A1A] text-[#C0C0C0] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:text-[#C0C0C0]';

  const actionBtn = `flex flex-1 flex-col items-center justify-center gap-1.5 px-4 py-3 text-[11px] text-[#C0C0C0] transition-colors hover:bg-[#1A1A1A] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#C0C0C0] ${focusRing}`;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.22 }}
      className="border-b border-[#2A2A2A]"
    >
      <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {href ? (
            <Link
              href={href}
              className={`line-clamp-2 text-base font-semibold leading-snug text-white underline-offset-2 hover:underline sm:text-lg ${focusRing}`}
            >
              {item.name}
            </Link>
          ) : (
            <span className="line-clamp-2 text-base font-semibold text-white sm:text-lg">
              {item.name}
            </span>
          )}
          <p className="mt-1 text-xs text-[#C0C0C0]">
            Size: {item.size} · {item.color}
          </p>
        </div>

        <div className="flex items-center justify-between gap-6 sm:justify-end sm:gap-8">
          <div className="flex flex-col items-start gap-1.5">
            <div
              className="flex items-center border border-[#3A3A3A]"
              role="group"
              aria-label={`Quantity for ${item.name}`}
            >
              <button
                type="button"
                onClick={() => onQuantity(item, item.quantity - 1)}
                disabled={busy || item.quantity <= 1}
                aria-label="Decrease quantity"
                className={`${stepper} ${focusRing}`}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span
                className="flex h-10 w-12 items-center justify-center border-x border-[#3A3A3A] bg-[#0A0A0A] text-sm font-semibold tabular-nums text-white"
                aria-live="polite"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#C0C0C0]" />
                ) : (
                  item.quantity
                )}
              </span>
              <button
                type="button"
                onClick={() => onQuantity(item, item.quantity + 1)}
                disabled={busy || atLimit}
                aria-label="Increase quantity"
                className={`${stepper} ${focusRing}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {atLimit && (
              <p
                role="alert"
                className="text-[10px] font-bold uppercase tracking-[0.16em] text-white"
              >
                {stockLimit! > 0 ? `Only ${stockLimit} in stock` : 'Out of stock'}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-sm tabular-nums text-[#C0C0C0]">{formatINR(item.price)}</p>
            {off > 0 && (
              <p className="text-[11px] tabular-nums text-[#C0C0C0]/70">
                <span className="line-through">{formatINR(item.mrp)}</span> · {off}% off
              </p>
            )}
            <p className="mt-1 text-lg font-bold tabular-nums text-white sm:text-xl">
              {formatINR(item.price * item.quantity)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 flex border border-[#2A2A2A]">
        <div className="shrink-0 border-r border-[#2A2A2A] p-3">
          {href ? (
            <Link href={href} className={`block ${focusRing}`} aria-label={item.name}>
              {imageBox}
            </Link>
          ) : (
            imageBox
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-3 text-xs text-[#C0C0C0] sm:text-sm">
          <p className="flex items-center gap-2 text-white">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#C0C0C0]">
              <span className="h-2 w-2 rounded-full bg-[#C0C0C0]" />
            </span>
            Ship Only
          </p>
          <p>In stock and ready to ship</p>
          {item.quantity > 1 && (
            <p className="tabular-nums">
              {item.quantity} × {formatINR(item.price)}
            </p>
          )}
        </div>
        <div className="flex w-[96px] shrink-0 flex-col divide-y divide-[#2A2A2A] border-l border-[#2A2A2A] sm:w-[128px]">
          <button
            type="button"
            onClick={() => onRemove(item)}
            aria-label={`Remove ${item.name} from bag`}
            className={actionBtn}
          >
            <Trash2 className="h-5 w-5" strokeWidth={1.5} />
            Remove
          </button>
          <button
            type="button"
            disabled
            title="Save for later is coming soon"
            aria-label={`Save ${item.name} for later (coming soon)`}
            className={actionBtn}
          >
            <Tag className="h-5 w-5" strokeWidth={1.5} />
            Save for Later
          </button>
        </div>
      </div>
    </motion.li>
  );
}

function CouponPanel({
  coupon,
  minOrderShortfall,
  discount,
  signedIn,
}: {
  coupon: ReturnType<typeof useCartCoupon>;
  minOrderShortfall: number;
  discount: number;
  signedIn: boolean;
}) {
  const [input, setInput] = useState('');
  const { couponCode, applying, error, apply, remove, clearError } = coupon;

  const submit = async () => {
    if (await apply(input)) setInput('');
  };

  return (
    <div className="border-t border-[#2A2A2A] pt-5">
      <p className="text-sm font-semibold text-white">Apply a Promotion Code</p>
      <p className="mb-3 mt-0.5 text-xs text-[#C0C0C0]/70">
        Remove any spaces or dashes before hitting apply.
      </p>

      {couponCode && (
        <div className="mb-2 flex items-center justify-between gap-2 border border-[#3A3A3A] bg-[#0A0A0A] px-3 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C0C0C0] text-[#0A0A0A]">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold uppercase tracking-[0.12em] text-white">
                {couponCode}
              </span>
              <span className="block text-[11px] text-[#C0C0C0]">
                {minOrderShortfall > 0
                  ? `Add ${formatINR(minOrderShortfall)} more to use this coupon`
                  : discount > 0
                    ? `Applied · you save ${formatINR(discount)}`
                    : 'Applied'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={remove}
            aria-label={`Remove coupon ${couponCode}`}
            className={`flex h-11 w-11 shrink-0 items-center justify-center text-[#C0C0C0] transition-colors hover:text-white ${focusRing}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {signedIn ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) clearError();
            }}
            aria-label="Coupon code"
            aria-invalid={error ? true : undefined}
            autoCapitalize="characters"
            autoComplete="off"
            disabled={applying}
            className="h-11 min-w-0 flex-1 border border-[#3A3A3A] bg-[#0A0A0A] px-3 text-sm uppercase text-white placeholder:normal-case placeholder:text-[#C0C0C0]/50 focus:border-[#C0C0C0] focus:outline-none focus:ring-1 focus:ring-[#C0C0C0]/60 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={applying || !input.trim()}
            className={`flex h-11 min-w-[88px] shrink-0 items-center justify-center border border-[#C0C0C0] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#C0C0C0] hover:text-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white ${focusRing}`}
          >
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('ardenby-open-auth'))}
          className={`flex min-h-[44px] w-full items-center justify-center border border-[#3A3A3A] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#C0C0C0] transition-colors hover:border-[#C0C0C0] hover:text-white ${focusRing}`}
        >
          Sign in to use a coupon
        </button>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs leading-relaxed text-white">
          {error}
        </p>
      )}
    </div>
  );
}

function Recommendations({ exclude }: { exclude: Set<string> }) {
  const { products, loading } = useHomeProducts();

  const picks = useMemo(
    () =>
      products
        .filter((p) => !exclude.has(p.id) && p.images?.[0] && p.price > 0)
        .slice(0, 4),
    [products, exclude]
  );

  if (loading || picks.length === 0) return null;

  return (
    <section aria-labelledby="also-like" className="mt-12 lg:mt-16">
      <Eyebrow>Complete the look</Eyebrow>
      <h2 id="also-like" className="mt-2 font-bodoni text-2xl text-white sm:text-3xl">
        You may also like
      </h2>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {picks.map((p) => (
          <li key={p.id}>
            <Link
              href={`/product/${p.slug}`}
              className={`group block overflow-hidden ${CARD} transition-colors hover:border-[#3A3A3A] ${focusRing}`}
            >
              <div className="aspect-[4/5] overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.images[0]}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                />
              </div>
              <div className="p-3 sm:p-4">
                <p className="line-clamp-1 text-sm font-medium text-white">{p.name}</p>
                <p className="mt-1 flex items-center gap-2 text-sm tabular-nums">
                  <span className="font-semibold text-white">{formatINR(p.price)}</span>
                  {p.mrp > p.price && (
                    <span className="text-xs text-[#C0C0C0]/70 line-through">
                      {formatINR(p.mrp)}
                    </span>
                  )}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  // The persisted cart only exists on the client; render a neutral shell first
  // so server and first client render match.
  const [mounted, setMounted] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [busyLines, setBusyLines] = useState<Set<string>>(new Set());
  // Max quantity per line, learned from the server's stock validation.
  const [stockLimits, setStockLimits] = useState<Record<string, number>>({});
  const pending = useRef<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
    const syncAuth = () => setSignedIn(Boolean(localStorage.getItem('ardenby_token')));
    syncAuth();
    window.addEventListener('storage', syncAuth);
    window.addEventListener('focus', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('focus', syncAuth);
    };
  }, []);

  const safeItems = useMemo(() => (mounted ? items : []), [mounted, items]);
  const itemCount = safeItems.reduce((n, i) => n + i.quantity, 0);
  const rawSubtotal = calculateCartPricing(safeItems).subtotal;

  const coupon = useCartCoupon(rawSubtotal);
  const pricing = calculateCartPricing(safeItems, coupon.pricingCoupon);
  const { subtotal, discount, shipping, gst, total, totalSavings } = pricing;

  const minOrderShortfall =
    coupon.couponCode && coupon.rule && subtotal < coupon.rule.minOrder
      ? coupon.rule.minOrder - subtotal
      : 0;

  const handleQuantity = async (item: CartItem, quantity: number) => {
    const key = lineKey(item);
    if (pending.current.has(key) || quantity < 1) return;

    pending.current.add(key);
    setBusyLines(new Set(pending.current));

    try {
      await updateQuantity(item.productId, item.size, item.color, quantity);
      setStockLimits((prev) => {
        const k = stockKey(item);
        if (prev[k] === undefined || quantity <= prev[k]) return prev;
        const { [k]: _dropped, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update quantity.';
      if (/stock|inventory|insufficient/i.test(message)) {
        // The quantity before a rejected increase is the maximum available.
        if (quantity > item.quantity) {
          setStockLimits((prev) => ({ ...prev, [stockKey(item)]: item.quantity }));
        }
      } else {
        toast.error(message, { position: 'top-right' });
      }
    } finally {
      pending.current.delete(key);
      setBusyLines(new Set(pending.current));
    }
  };

  const handleRemove = (item: CartItem) => {
    removeItem(item.productId, item.size, item.color);
  };

  const handleCheckout = (e: MouseEvent<HTMLAnchorElement>) => {
    if (localStorage.getItem('ardenby_token')) return;
    e.preventDefault();
    toast.message('Please sign in to your account before checkout.', {
      position: 'top-right',
    });
    window.dispatchEvent(new Event('ardenby-open-auth'));
  };

  const inBag = useMemo(
    () => new Set(safeItems.map((i) => i.productId)),
    [safeItems]
  );

  const checkoutClass = `group flex min-h-[52px] w-full items-center justify-center gap-2 bg-white text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors duration-200 hover:bg-[#C0C0C0] active:scale-[0.99] sm:text-sm ${focusRing}`;

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-8 text-[#C0C0C0] lg:py-12">
      <div
        className={`mx-auto max-w-[1280px] px-4 sm:px-8 lg:px-12 ${
          safeItems.length > 0 ? 'pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-0' : ''
        }`}
      >
        {!mounted ? (
          <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
            <Loader2 className="h-6 w-6 animate-spin text-[#C0C0C0]" />
          </div>
        ) : safeItems.length === 0 ? (
          <>
            <h1 className="mb-8 border-b border-[#2A2A2A] pb-5 font-bodoni text-3xl text-white sm:text-4xl">
              Cart
            </h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex flex-col items-center px-6 py-20 text-center sm:py-24 ${CARD}`}
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#3A3A3A]">
                <ShoppingBag className="h-7 w-7 text-[#C0C0C0]" strokeWidth={1.5} />
              </div>
              <h2 className="mb-2 font-bodoni text-2xl text-white sm:text-3xl">
                Your shopping bag is empty
              </h2>
              <p className="mb-8 max-w-sm text-sm text-[#C0C0C0]">
                Your next statement piece is waiting.
              </p>
              <Link
                href="/shop"
                className={`inline-flex min-h-[48px] items-center gap-2 bg-white px-8 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-[#C0C0C0] ${focusRing}`}
              >
                Explore Collections
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </>
        ) : (
          <>
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] lg:gap-10">
              <div className="min-w-0">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                  <h1 className="text-3xl font-light text-white sm:text-4xl">
                    Cart:{' '}
                    <span className="text-[#C0C0C0]">
                      ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                    </span>
                  </h1>
                  <Link
                    href="/shop"
                    className={`hidden items-center gap-2 text-xs sm:inline-flex ${silverLink} ${focusRing}`}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Continue Shopping
                  </Link>
                </div>

                <div className="mb-6">
                  <ShippingProgress subtotal={rawSubtotal} />
                </div>

                <ul aria-label="Cart items" className="border-t border-[#2A2A2A]">
                  <AnimatePresence initial={false}>
                    {safeItems.map((item) => (
                      <CartLine
                        key={lineKey(item)}
                        item={item}
                        busy={busyLines.has(lineKey(item))}
                        stockLimit={stockLimits[stockKey(item)]}
                        onQuantity={(it, q) => void handleQuantity(it, q)}
                        onRemove={handleRemove}
                      />
                    ))}
                  </AnimatePresence>
                </ul>

                <Recommendations exclude={inBag} />

                <ul className="mt-12 grid grid-cols-3 gap-2 border-t border-[#2A2A2A] pt-6 text-center">
                  {[
                    { Icon: ShieldCheck, label: 'Secure checkout' },
                    {
                      Icon: Truck,
                      label: `Free shipping ${formatINR(FREE_SHIPPING_THRESHOLD)}+`,
                    },
                    { Icon: RotateCcw, label: '7-day returns' },
                  ].map(({ Icon, label }) => (
                    <li key={label} className="flex flex-col items-center gap-2 px-1">
                      <Icon className="h-5 w-5 text-[#C0C0C0]" strokeWidth={1.25} />
                      <span className="text-[10px] uppercase leading-snug tracking-[0.14em] text-[#C0C0C0]">
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <aside
                aria-label="Order summary"
                className={`p-5 sm:p-6 lg:sticky lg:top-28 ${CARD} border-[#3A3A3A]`}
              >
                <h2 className="flex items-center gap-2 text-lg text-white">
                  <Lock className="h-4 w-4 text-[#C0C0C0]" strokeWidth={1.5} />
                  Cart Summary
                </h2>

                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[#C0C0C0]">Subtotal</dt>
                    <dd className="font-semibold tabular-nums text-white">{formatINR(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#C0C0C0]">Shipping</dt>
                    <dd className="tabular-nums text-white">
                      {shipping === 0 ? 'FREE' : formatINR(shipping)}
                    </dd>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-[#C0C0C0]">
                        Discount{coupon.couponCode ? ` (${coupon.couponCode})` : ''}
                      </dt>
                      <dd className="tabular-nums text-white">−{formatINR(discount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-[#C0C0C0]">GST ({Math.round(GST_RATE * 100)}%)</dt>
                    <dd className="tabular-nums text-white">{formatINR(gst)}</dd>
                  </div>
                  {totalSavings > 0 && (
                    <div className="flex justify-between border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2.5 text-white">
                      <dt>You save</dt>
                      <dd className="font-semibold tabular-nums">{formatINR(totalSavings)}</dd>
                    </div>
                  )}
                </dl>

                <div className="mt-5 flex items-end justify-between border-t border-[#3A3A3A] pt-5">
                  <div>
                    <span className="text-base font-bold text-white">Order Total</span>
                    <p className="mt-1 text-[10px] text-[#C0C0C0]/70">Inclusive of GST and shipping</p>
                  </div>
                  <strong className="text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
                    {formatINR(total)}
                  </strong>
                </div>

                <div className="mt-6">
                  <CouponPanel
                    coupon={coupon}
                    minOrderShortfall={minOrderShortfall}
                    discount={discount}
                    signedIn={signedIn}
                  />
                </div>

                <div className="mt-6 space-y-3">
                  <Link
                    href="/checkout"
                    onClick={handleCheckout}
                    className={checkoutClass}
                  >
                    Checkout Now
                  </Link>
                  <p className="text-center text-[11px] text-[#C0C0C0]/70">
                    Secure checkout · 7-day returns
                  </p>
                  <Link
                    href="/shop"
                    className={`block text-center text-xs ${silverLink} ${focusRing}`}
                  >
                    Continue Shopping
                  </Link>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>

      {mounted && safeItems.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#3A3A3A] bg-[#0A0A0A]/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-[640px] items-center justify-between gap-4 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
            <div className="min-w-0">
              <p className="text-[11px] text-[#C0C0C0]">Total</p>
              <p className="truncate text-xl font-semibold tabular-nums text-white">
                {formatINR(total)}
              </p>
            </div>
            <Link
              href="/checkout"
              onClick={handleCheckout}
              className={`flex min-h-[48px] shrink-0 items-center gap-2 bg-white px-6 text-xs font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#C0C0C0] active:scale-[0.98] ${focusRing}`}
            >
              Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
