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

const CARD = 'border border-[#E2E0DB] bg-[#F4F0E8]';

const silverLink =
  'text-[#4A4A4A] underline underline-offset-2 transition-colors hover:text-[#171717]';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]';

const lineKey = (item: CartItem) =>
  `${item.productId}-${item.variantId}-${item.size}-${item.color}`;

// Same key the store uses to identify a cart line.
const stockKey = (item: CartItem) =>
  `${item.productId}-${item.size}-${item.color}`;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#4A4A4A]">
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
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E2E0DB] text-[#4A4A4A]">
          {unlocked ? (
            <Check className="h-4 w-4" strokeWidth={2} />
          ) : (
            <Truck className="h-4 w-4" strokeWidth={1.5} />
          )}
        </span>
        <p className="min-w-0 text-sm text-[#4A4A4A]">
          {unlocked ? (
            <>
              <span className="font-semibold text-[#171717]">Free shipping unlocked.</span>{' '}
              Your order ships on us.
            </>
          ) : (
            <>
              Add{' '}
              <span className="font-semibold text-[#171717]">{formatINR(remaining)}</span>{' '}
              more to unlock{' '}
              <span className="font-semibold text-[#171717]">free shipping</span>
            </>
          )}
        </p>
      </div>
      <div
        className="mt-3 h-1 overflow-hidden bg-[#EAE5DA]"
        role="progressbar"
        aria-label="Progress to free shipping"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div
          className="h-full bg-[#222222] transition-[width] duration-500 ease-out motion-reduce:transition-none"
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
    <div className="aspect-square w-[96px] overflow-hidden border border-[#E2E0DB] bg-[#FFFFFF] sm:w-[140px]">
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
    'flex h-10 w-10 items-center justify-center bg-[#F4F0E8] text-[#4A4A4A] transition-colors hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:text-[#4A4A4A]';

  const actionBtn = `flex flex-1 flex-col items-center justify-center gap-1.5 px-4 py-3 text-[11px] text-[#4A4A4A] transition-colors hover:bg-[#F4F0E8] hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#4A4A4A] ${focusRing}`;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.22 }}
      className="border-b border-[#E2E0DB]"
    >
      <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {href ? (
            <Link
              href={href}
              className={`line-clamp-2 text-base font-semibold leading-snug text-[#171717] underline-offset-2 hover:underline sm:text-lg ${focusRing}`}
            >
              {item.name}
            </Link>
          ) : (
            <span className="line-clamp-2 text-base font-semibold text-[#171717] sm:text-lg">
              {item.name}
            </span>
          )}
          <p className="mt-1 text-xs text-[#4A4A4A]">
            Size: {item.size} · {item.color}
          </p>
        </div>

        <div className="flex items-center justify-between gap-6 sm:justify-end sm:gap-8">
          <div className="flex flex-col items-start gap-1.5">
            <div
              className="flex items-center border border-[#E2E0DB]"
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
                className="flex h-10 w-12 items-center justify-center border-x border-[#E2E0DB] bg-[#FFFFFF] text-sm font-semibold tabular-nums text-[#171717]"
                aria-live="polite"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#4A4A4A]" />
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
                className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#171717]"
              >
                {stockLimit! > 0 ? `Only ${stockLimit} in stock` : 'Out of stock'}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-sm tabular-nums text-[#4A4A4A]">{formatINR(item.price)}</p>
            {off > 0 && (
              <p className="text-[11px] tabular-nums text-[#4A4A4A]/70">
                <span className="line-through">{formatINR(item.mrp)}</span> · {off}% off
              </p>
            )}
            <p className="mt-1 text-lg font-bold tabular-nums text-[#171717] sm:text-xl">
              {formatINR(item.price * item.quantity)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 flex border border-[#E2E0DB]">
        <div className="shrink-0 border-r border-[#E2E0DB] p-3">
          {href ? (
            <Link href={href} className={`block ${focusRing}`} aria-label={item.name}>
              {imageBox}
            </Link>
          ) : (
            imageBox
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-3 text-xs text-[#4A4A4A] sm:text-sm">
          <p className="flex items-center gap-2 text-[#171717]">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#222222]">
              <span className="h-2 w-2 rounded-full bg-[#222222]" />
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
        <div className="flex w-[96px] shrink-0 flex-col divide-y divide-[#E2E0DB] border-l border-[#E2E0DB] sm:w-[128px]">
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
    <div className="border-t border-[#E2E0DB] pt-5">
      <p className="text-sm font-semibold text-[#171717]">Apply a Promotion Code</p>
      <p className="mb-3 mt-0.5 text-xs text-[#4A4A4A]/70">
        Remove any spaces or dashes before hitting apply.
      </p>

      {couponCode && (
        <div className="mb-2 flex items-center justify-between gap-2 border border-[#E2E0DB] bg-[#FFFFFF] px-3 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#222222] text-[#FFFFFF]">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold uppercase tracking-[0.12em] text-[#171717]">
                {couponCode}
              </span>
              <span className="block text-[11px] text-[#4A4A4A]">
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
            className={`flex h-11 w-11 shrink-0 items-center justify-center text-[#4A4A4A] transition-colors hover:text-[#171717] ${focusRing}`}
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
            className="h-11 min-w-0 flex-1 border border-[#E2E0DB] bg-[#FFFFFF] px-3 text-sm uppercase text-[#171717] placeholder:normal-case placeholder:text-[#4A4A4A]/50 focus:border-[#222222] focus:outline-none focus:ring-1 focus:ring-[#171717]/60 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={applying || !input.trim()}
            className={`flex h-11 min-w-[88px] shrink-0 items-center justify-center border border-[#222222] px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#171717] transition-colors hover:bg-[#222222] hover:text-[#FFFFFF] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#171717] ${focusRing}`}
          >
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('ardenby-open-auth'))}
          className={`flex min-h-[44px] w-full items-center justify-center border border-[#E2E0DB] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#4A4A4A] transition-colors hover:border-[#222222] hover:text-[#171717] ${focusRing}`}
        >
          Sign in to use a coupon
        </button>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs leading-relaxed text-[#171717]">
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
      <h2 id="also-like" className="mt-2 font-oswald text-2xl text-[#171717] sm:text-3xl">
        You may also like
      </h2>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {picks.map((p) => (
          <li key={p.id}>
            <Link
              href={`/product/${p.slug}`}
              className={`group block overflow-hidden ${CARD} transition-colors hover:border-[#E2E0DB] ${focusRing}`}
            >
              <div className="aspect-[4/5] overflow-hidden bg-[#FFFFFF]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.images[0]}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                />
              </div>
              <div className="p-3 sm:p-4">
                <p className="line-clamp-1 text-sm font-medium text-[#171717]">{p.name}</p>
                <p className="mt-1 flex items-center gap-2 text-sm tabular-nums">
                  <span className="font-semibold text-[#171717]">{formatINR(p.price)}</span>
                  {p.mrp > p.price && (
                    <span className="text-xs text-[#4A4A4A]/70 line-through">
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

  const checkoutClass = `group flex min-h-[52px] w-full items-center justify-center gap-2 bg-[#222222] text-xs font-bold uppercase tracking-[0.18em] text-[#FFFFFF] transition-colors duration-200 hover:bg-[#222222] active:scale-[0.99] sm:text-sm ${focusRing}`;

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-8 text-[#4A4A4A] lg:py-12">
      <div
        className={`mx-auto max-w-[1280px] px-4 sm:px-8 lg:px-12 ${
          safeItems.length > 0 ? 'pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-0' : ''
        }`}
      >
        {!mounted ? (
          <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
            <Loader2 className="h-6 w-6 animate-spin text-[#4A4A4A]" />
          </div>
        ) : safeItems.length === 0 ? (
          <>
            <h1 className="mb-8 border-b border-[#E2E0DB] pb-5 font-oswald text-3xl text-[#171717] sm:text-4xl">
              Cart
            </h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex flex-col items-center px-6 py-20 text-center sm:py-24 ${CARD}`}
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#E2E0DB]">
                <ShoppingBag className="h-7 w-7 text-[#4A4A4A]" strokeWidth={1.5} />
              </div>
              <h2 className="mb-2 font-oswald text-2xl text-[#171717] sm:text-3xl">
                Your shopping bag is empty
              </h2>
              <p className="mb-8 max-w-sm text-sm text-[#4A4A4A]">
                Your next statement piece is waiting.
              </p>
              <Link
                href="/shop"
                className={`inline-flex min-h-[48px] items-center gap-2 bg-[#222222] px-8 text-xs font-bold uppercase tracking-[0.18em] text-[#FFFFFF] transition-colors hover:bg-[#222222] ${focusRing}`}
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
                  <h1 className="text-3xl font-light text-[#171717] sm:text-4xl">
                    Cart:{' '}
                    <span className="text-[#4A4A4A]">
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

                <ul aria-label="Cart items" className="border-t border-[#E2E0DB]">
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

                <ul className="mt-12 grid grid-cols-3 gap-2 border-t border-[#E2E0DB] pt-6 text-center">
                  {[
                    { Icon: ShieldCheck, label: 'Secure checkout' },
                    {
                      Icon: Truck,
                      label: `Free shipping ${formatINR(FREE_SHIPPING_THRESHOLD)}+`,
                    },
                    { Icon: RotateCcw, label: '7-day returns' },
                  ].map(({ Icon, label }) => (
                    <li key={label} className="flex flex-col items-center gap-2 px-1">
                      <Icon className="h-5 w-5 text-[#4A4A4A]" strokeWidth={1.25} />
                      <span className="text-[10px] uppercase leading-snug tracking-[0.14em] text-[#4A4A4A]">
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <aside
                aria-label="Order summary"
                className={`p-5 sm:p-6 lg:sticky lg:top-28 ${CARD} border-[#E2E0DB]`}
              >
                <h2 className="flex items-center gap-2 text-lg text-[#171717]">
                  <Lock className="h-4 w-4 text-[#4A4A4A]" strokeWidth={1.5} />
                  Cart Summary
                </h2>

                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[#4A4A4A]">Subtotal</dt>
                    <dd className="font-semibold tabular-nums text-[#171717]">{formatINR(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#4A4A4A]">Shipping</dt>
                    <dd className="tabular-nums text-[#171717]">
                      {shipping === 0 ? 'FREE' : formatINR(shipping)}
                    </dd>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-[#4A4A4A]">
                        Discount{coupon.couponCode ? ` (${coupon.couponCode})` : ''}
                      </dt>
                      <dd className="tabular-nums text-[#171717]">−{formatINR(discount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-[#4A4A4A]">GST ({Math.round(GST_RATE * 100)}%)</dt>
                    <dd className="tabular-nums text-[#171717]">{formatINR(gst)}</dd>
                  </div>
                  {totalSavings > 0 && (
                    <div className="flex justify-between border border-[#E2E0DB] bg-[#FFFFFF] px-3 py-2.5 text-[#171717]">
                      <dt>You save</dt>
                      <dd className="font-semibold tabular-nums">{formatINR(totalSavings)}</dd>
                    </div>
                  )}
                </dl>

                <div className="mt-5 flex items-end justify-between border-t border-[#E2E0DB] pt-5">
                  <div>
                    <span className="text-base font-bold text-[#171717]">Order Total</span>
                    <p className="mt-1 text-[10px] text-[#4A4A4A]/70">Inclusive of GST and shipping</p>
                  </div>
                  <strong className="text-2xl font-bold tabular-nums tracking-tight text-[#171717] sm:text-3xl">
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
                  <p className="text-center text-[11px] text-[#4A4A4A]/70">
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
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E2E0DB] bg-[#FFFFFF]/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-[640px] items-center justify-between gap-4 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
            <div className="min-w-0">
              <p className="text-[11px] text-[#4A4A4A]">Total</p>
              <p className="truncate text-xl font-semibold tabular-nums text-[#171717]">
                {formatINR(total)}
              </p>
            </div>
            <Link
              href="/checkout"
              onClick={handleCheckout}
              className={`flex min-h-[48px] shrink-0 items-center gap-2 bg-[#222222] px-6 text-xs font-bold uppercase tracking-[0.16em] text-[#FFFFFF] transition-colors hover:bg-[#222222] active:scale-[0.98] ${focusRing}`}
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
