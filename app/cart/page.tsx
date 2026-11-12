'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  Loader2,
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
import { useMemberCartItems } from '@/hooks/use-member-pricing';
import { MemberBadge } from '@/components/membership/member-badge';
import { MemberLineSaving } from '@/components/membership/member-price-tag';
import { useCartCoupon } from '@/features/cart/use-cart-coupon';
import { useHomeProducts } from '@/hooks/use-home-products';
import {
  calculateCartPricing,
  GST_RATE,
  SHIPPING_FEE,
} from '@/lib/pricing';
import { formatINR } from '@/lib/format';
import type { CartItem } from '@/types';

const PANEL = 'bg-[#F4F4F4]';
const RED = 'text-[#D7261E]';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

const lineKey = (item: CartItem) =>
  `${item.productId}-${item.variantId}-${item.size}-${item.color}`;

// Same key the store uses to identify a cart line.
const stockKey = (item: CartItem) =>
  `${item.productId}-${item.size}-${item.color}`;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#5C5C5C]">
      {children}
    </p>
  );
}

/** Temporary shipping rule: flat fee for everyone, free for an active member (decided by the server). */
function ShippingNote({ free }: { free: boolean }) {
  return (
    <div className={`px-4 py-4 sm:px-5 ${PANEL}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111111] text-white">
          {free ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Truck className="h-4 w-4" strokeWidth={1.75} />}
        </span>
        <p className="min-w-0 text-sm text-[#5C5C5C]">
          {free ? (
            <>
              <span className="font-bold text-[#111111]">Free shipping on this order.</span> KOVENIK MEMBER benefit.
            </>
          ) : (
            <>
              <span className="font-bold text-[#111111]">Flat {formatINR(SHIPPING_FEE)} shipping</span> on this order.{' '}
              <Link href="/membership" className="font-bold text-[#111111] underline underline-offset-2">
                KOVENIK members ship free
              </Link>
              .
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/** Members: what the membership saves on this bag. Everyone else: what joining would save. */
function MemberSavingsBanner({
  tier,
  memberSavings,
  joinSavings,
}: {
  tier: string | null;
  memberSavings: number;
  joinSavings: number;
}) {
  const shell = 'flex items-center gap-3 bg-gradient-to-r from-[#EADCF5] via-[#D9ECFA] to-[#F6E1EE] px-4 py-3 sm:px-5';

  if (tier) {
    if (memberSavings <= 0) return null;
    return (
      <div className={shell}>
        <MemberBadge size={26} />
        <p className="text-sm text-[#111111]">
          <span className="font-bold text-[#C8211F]">Member Savings</span> on this order are{' '}
          <strong className="tabular-nums">{formatINR(memberSavings)}</strong>
          <span className="text-[#5C5C5C]"> · {tier}</span>
        </p>
      </div>
    );
  }

  if (joinSavings <= 0) return null;
  return (
    <div className={shell}>
      <MemberBadge size={26} />
      <p className="min-w-0 text-sm text-[#111111]">
        Join KOVENIK Membership and save{' '}
        <strong className="tabular-nums text-[#C8211F]">{formatINR(joinSavings)}</strong> on this order.{' '}
        <Link href="/membership" className="font-semibold underline underline-offset-2">
          View plans
        </Link>
      </p>
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
  const regularPrice = (item as CartItem & { regularPrice?: number }).regularPrice;

  const imageBox = (
    <div className="aspect-[4/5] w-[88px] overflow-hidden bg-[#F4F4F4] sm:w-[112px] lg:w-[128px]">
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

  const stepBtn =
    'flex h-11 w-11 items-center justify-center bg-white text-[#111111] transition-colors hover:bg-[#F4F4F4] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white';

  const textBtn = `items-center gap-1.5 text-xs font-medium text-[#5C5C5C] underline-offset-2 transition-colors hover:text-[#111111] hover:underline disabled:cursor-not-allowed disabled:opacity-45 disabled:no-underline disabled:hover:text-[#5C5C5C] ${focusRing}`;

  const saveBtn = (extra: string) => (
    <button
      type="button"
      disabled
      title="Save for later is coming soon"
      aria-label={`Save ${item.name} for later (coming soon)`}
      className={`${textBtn} ${extra}`}
    >
      <Bookmark className="h-3.5 w-3.5" strokeWidth={1.75} />
      Save for later
    </button>
  );

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.22 }}
      className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-4 gap-y-4 border-b border-[#E5E5E5] py-5 sm:grid-cols-[112px_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_170px_120px] lg:items-start lg:gap-x-6 lg:py-6"
    >
      {/* Product: image + details */}
      <div className="contents lg:flex lg:min-w-0 lg:gap-5">
        <div className="shrink-0">
          {href ? (
            <Link href={href} className={`block ${focusRing}`} aria-label={item.name}>
              {imageBox}
            </Link>
          ) : (
            imageBox
          )}
        </div>

        <div className="relative min-w-0 pr-9 lg:flex-1 lg:pr-0">
          {href ? (
            <Link
              href={href}
              className={`line-clamp-2 block font-oswald text-base font-semibold uppercase leading-snug tracking-wide text-[#111111] hover:underline sm:text-lg ${focusRing}`}
            >
              {item.name}
            </Link>
          ) : (
            <span className="line-clamp-2 block font-oswald text-base font-semibold uppercase leading-snug tracking-wide text-[#111111] sm:text-lg">
              {item.name}
            </span>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-[#111111]">
            <span className="border border-[#111111] px-2 py-0.5">Size {item.size}</span>
            <span className="border border-[#111111] px-2 py-0.5">Colour {item.color}</span>
          </div>

          <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2 text-sm tabular-nums">
            <span className="font-bold text-[#111111]">{formatINR(item.price)}</span>
            {off > 0 && (
              <>
                <span className="text-xs text-[#5C5C5C] line-through">{formatINR(item.mrp)}</span>
                <span className={`text-xs font-bold ${RED}`}>{off}% OFF</span>
              </>
            )}
          </p>
          {regularPrice !== undefined && regularPrice > item.price && (
            <div className="mt-1.5 space-y-1">
              <p className="text-xs tabular-nums text-[#5C5C5C]">
                Regular price {formatINR(regularPrice)} · Member price{' '}
                <span className="font-semibold text-[#111111]">{formatINR(item.price)}</span>
              </p>
              <MemberLineSaving saving={(regularPrice - item.price) * item.quantity} />
            </div>
          )}

          <p className="mt-1.5 text-xs text-[#5C5C5C]">In stock · Ready to ship · Ship only</p>

          <div className="mt-3 hidden items-center gap-5 lg:flex">
            {saveBtn('inline-flex')}
            <button
              type="button"
              onClick={() => onRemove(item)}
              aria-label={`Remove ${item.name} from bag`}
              className={`${textBtn} inline-flex`}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              Remove
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item)}
            aria-label={`Remove ${item.name} from bag`}
            className={`absolute right-0 top-0 flex h-9 w-9 items-center justify-center text-[#5C5C5C] hover:text-[#111111] lg:hidden ${focusRing}`}
          >
            <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Quantity + total: own row on mobile, centre/right columns on desktop */}
      <div className="col-span-2 flex items-center justify-between gap-3 lg:contents">
        <div className="flex flex-col items-start gap-1.5 lg:items-center lg:justify-self-center">
          <div
            className="flex items-center border border-[#111111]"
            role="group"
            aria-label={`Quantity for ${item.name}`}
          >
            <button
              type="button"
              onClick={() => onQuantity(item, item.quantity - 1)}
              disabled={busy || item.quantity <= 1}
              aria-label="Decrease quantity"
              className={`${stepBtn} ${focusRing}`}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span
              className="flex h-11 w-10 items-center justify-center text-sm font-bold tabular-nums text-[#111111]"
              aria-live="polite"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#5C5C5C]" />
              ) : (
                item.quantity
              )}
            </span>
            <button
              type="button"
              onClick={() => onQuantity(item, item.quantity + 1)}
              disabled={busy || atLimit}
              aria-label="Increase quantity"
              className={`${stepBtn} ${focusRing}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {atLimit && (
            <p
              role="alert"
              className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#111111]"
            >
              {stockLimit! > 0 ? `Only ${stockLimit} in stock` : 'Out of stock'}
            </p>
          )}
        </div>

        {saveBtn('inline-flex lg:hidden')}

        <div className="text-right lg:pt-2">
          <p className="text-lg font-bold tabular-nums text-[#111111] lg:text-xl">
            {formatINR(item.price * item.quantity)}
          </p>
          {item.quantity > 1 && (
            <p className="text-xs tabular-nums text-[#5C5C5C]">
              {item.quantity} × {formatINR(item.price)}
            </p>
          )}
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
    <div className="border-t border-[#E5E5E5] pt-5">
      <p className="text-sm font-bold text-[#111111]">Promotion code</p>
      <p className="mb-3 mt-0.5 text-xs text-[#5C5C5C]">
        Remove any spaces or dashes before applying.
      </p>

      {couponCode && (
        <div className="mb-2 flex items-center justify-between gap-2 border border-[#E5E5E5] bg-white px-3 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#111111] text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <span className="block truncate text-sm font-bold uppercase tracking-[0.12em] text-[#111111]">
                {couponCode}
              </span>
              <span className="block text-[11px] text-[#5C5C5C]">
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
            className={`flex h-11 w-11 shrink-0 items-center justify-center text-[#5C5C5C] transition-colors hover:text-[#111111] ${focusRing}`}
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
            placeholder="ENTER CODE"
            autoCapitalize="characters"
            autoComplete="off"
            disabled={applying}
            className="h-11 min-w-0 flex-1 border border-[#DADADA] bg-white px-3 text-sm uppercase tracking-wider text-[#111111] placeholder:text-[#5C5C5C]/60 focus:border-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]/60 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={applying || !input.trim()}
            className={`flex h-11 min-w-[88px] shrink-0 items-center justify-center border border-[#111111] bg-white px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#111111] transition-colors hover:bg-[#111111] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-[#111111] ${focusRing}`}
          >
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('ardenby-open-auth'))}
          className={`flex min-h-[44px] w-full items-center justify-center border border-[#DADADA] bg-white px-4 text-xs font-bold uppercase tracking-[0.16em] text-[#5C5C5C] transition-colors hover:border-[#111111] hover:text-[#111111] ${focusRing}`}
        >
          Sign in to use a coupon
        </button>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs leading-relaxed text-[#111111]">
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
      <div className="flex items-end justify-between gap-4">
        <div>
          <Eyebrow>Complete the look</Eyebrow>
          <h2
            id="also-like"
            className="mt-2 font-oswald text-2xl font-bold uppercase tracking-wide text-[#111111] sm:text-3xl"
          >
            You may also like
          </h2>
        </div>
        <Link
          href="/shop"
          className={`shrink-0 pb-1 text-xs font-semibold text-[#111111] underline underline-offset-4 hover:text-[#5C5C5C] ${focusRing}`}
        >
          View all
        </Link>
      </div>

      {/* Swipe row on phones/tablets, 4-up grid on desktop */}
      <ul className="-mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:gap-5 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0">
        {picks.map((p) => {
          const off =
            p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
          return (
            <li
              key={p.id}
              className="w-[44vw] max-w-[220px] shrink-0 snap-start lg:w-auto lg:max-w-none"
            >
              <Link href={`/product/${p.slug}`} className={`group block ${focusRing}`}>
                <div className="relative aspect-[4/5] overflow-hidden bg-[#F4F4F4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                  />
                  {off > 0 && (
                    <span className="absolute left-2 top-2 bg-[#D7261E] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      {off}% OFF
                    </span>
                  )}
                </div>
                <div className="pt-3">
                  <p className="line-clamp-1 text-sm font-semibold text-[#111111]">{p.name}</p>
                  <p className="mt-1 flex items-center gap-2 text-sm tabular-nums">
                    <span className="font-bold text-[#111111]">{formatINR(p.price)}</span>
                    {p.mrp > p.price && (
                      <span className="text-xs text-[#5C5C5C] line-through">
                        {formatINR(p.mrp)}
                      </span>
                    )}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SummaryRow({
  label,
  children,
  strong,
  red,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  strong?: boolean;
  red?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={strong ? 'font-bold text-[#111111]' : 'text-[#5C5C5C]'}>{label}</dt>
      <dd
        className={`tabular-nums ${
          red ? `font-semibold ${RED}` : strong ? 'font-bold text-[#111111]' : 'text-[#111111]'
        }`}
      >
        {children}
      </dd>
    </div>
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
  const [summaryOpen, setSummaryOpen] = useState(false);
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

  const baseItems = useMemo(() => (mounted ? items : []), [mounted, items]);
  // Member prices (display; the server recomputes them at checkout).
  const memberCart = useMemberCartItems(baseItems);
  const safeItems = memberCart.items;
  const itemCount = safeItems.reduce((n, i) => n + i.quantity, 0);
  const rawSubtotal = calculateCartPricing(safeItems).subtotal;

  const coupon = useCartCoupon(rawSubtotal);
  const pricing = calculateCartPricing(safeItems, coupon.pricingCoupon, { freeShipping: memberCart.freeShipping });
  const { subtotal, productSavings, discount, shipping, gst, total, totalSavings } = pricing;
  const bagTotalMrp = subtotal + productSavings;
  // productSavings (MRP - payable) already contains the member saving; show them separately.
  const memberSavings = Math.min(Math.round(memberCart.memberSavings * 100) / 100, productSavings);
  const saleSavings = Math.round((productSavings - memberSavings) * 100) / 100;
  const itemsLabel = itemCount === 1 ? 'item' : 'items';

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

  const checkoutClass = `group flex min-h-[56px] w-full items-center justify-center gap-3 bg-[#111111] text-sm font-bold uppercase tracking-[0.18em] text-white transition-colors duration-200 hover:bg-[#2A2A2A] active:scale-[0.99] ${focusRing}`;

  return (
    <div className="min-h-screen bg-white py-8 text-[#5C5C5C] lg:py-12">
      <div
        className={`mx-auto max-w-[1280px] px-4 sm:px-8 lg:px-12 ${
          safeItems.length > 0 ? 'pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-0' : ''
        }`}
      >
        {!mounted ? (
          <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
            <Loader2 className="h-6 w-6 animate-spin text-[#5C5C5C]" />
          </div>
        ) : safeItems.length === 0 ? (
          <>
            <h1 className="mb-8 border-b border-[#E5E5E5] pb-5 font-oswald text-3xl font-bold uppercase tracking-wide text-[#111111] sm:text-4xl">
              Your shopping bag
            </h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex flex-col items-center px-6 py-20 text-center sm:py-24 ${PANEL}`}
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#DADADA] bg-white">
                <ShoppingBag className="h-7 w-7 text-[#5C5C5C]" strokeWidth={1.5} />
              </div>
              <h2 className="mb-2 font-oswald text-2xl font-bold uppercase tracking-wide text-[#111111] sm:text-3xl">
                Your shopping bag is empty
              </h2>
              <p className="mb-8 max-w-sm text-sm text-[#5C5C5C]">
                Your next statement piece is waiting.
              </p>
              <Link
                href="/shop"
                className={`inline-flex min-h-[48px] items-center gap-2 bg-[#111111] px-8 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#2A2A2A] ${focusRing}`}
              >
                Explore Collections
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(340px,1fr)] lg:gap-12">
            <div className="min-w-0">
              <div className="mb-6 flex items-end justify-between gap-x-4 gap-y-2">
                <h1 className="font-oswald text-3xl font-bold uppercase leading-none tracking-wide text-[#111111] sm:text-4xl lg:text-5xl">
                  Your shopping bag{' '}
                  <span className="whitespace-nowrap text-base font-semibold text-[#5C5C5C] sm:text-xl">
                    ({itemCount} {itemsLabel})
                  </span>
                </h1>
                <Link
                  href="/shop"
                  className={`hidden shrink-0 items-center gap-2 pb-1 text-xs font-semibold text-[#111111] underline-offset-4 hover:underline sm:inline-flex ${focusRing}`}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Continue shopping
                </Link>
              </div>

              <div className="mb-6 space-y-3">
                <ShippingNote free={memberCart.freeShipping} />
                <MemberSavingsBanner
                  tier={memberCart.member?.planName ?? null}
                  memberSavings={memberCart.memberSavings}
                  joinSavings={memberCart.joinSavings}
                />
              </div>

              <div
                aria-hidden="true"
                className="hidden grid-cols-[minmax(0,1fr)_170px_120px] gap-x-6 border-b border-[#E5E5E5] pb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#5C5C5C] lg:grid"
              >
                <span>Product</span>
                <span className="text-center">Quantity</span>
                <span className="text-right">Total</span>
              </div>

              <ul aria-label="Cart items" className="border-t border-[#E5E5E5] lg:border-t-0">
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

              <Link
                href="/shop"
                className={`mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#111111] underline-offset-4 hover:underline sm:hidden ${focusRing}`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Continue shopping
              </Link>

              <Recommendations exclude={inBag} />

              <ul className="mt-12 grid grid-cols-3 divide-x divide-[#E5E5E5] border-y border-[#E5E5E5]">
                {[
                  { Icon: ShieldCheck, label: 'Secure checkout' },
                  {
                    Icon: Truck,
                    label: memberCart.freeShipping ? 'Free member shipping' : `Flat ${formatINR(SHIPPING_FEE)} shipping`,
                  },
                  { Icon: RotateCcw, label: '7-day returns' },
                ].map(({ Icon, label }) => (
                  <li
                    key={label}
                    className="flex flex-col items-center justify-center gap-2 px-2 py-5 text-center sm:flex-row sm:gap-3"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-[#111111]" strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase leading-snug tracking-[0.16em] text-[#111111] sm:text-xs">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <aside
              aria-label="Order summary"
              className={`${PANEL} lg:sticky lg:top-28`}
            >
              {/* Phones: collapsible header that always shows the total */}
              <button
                type="button"
                onClick={() => setSummaryOpen((o) => !o)}
                aria-expanded={summaryOpen}
                aria-controls="order-summary-body"
                className={`flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5 lg:hidden ${focusRing}`}
              >
                <span className="font-oswald text-lg font-bold uppercase tracking-wide text-[#111111]">
                  Order summary
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-lg font-bold tabular-nums text-[#111111]">
                    {formatINR(total)}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-[#111111] transition-transform ${
                      summaryOpen ? 'rotate-180' : ''
                    }`}
                  />
                </span>
              </button>

              <div
                id="order-summary-body"
                className={`${summaryOpen ? 'block' : 'hidden'} px-4 pb-5 sm:px-5 lg:block lg:p-6`}
              >
                <div className="mb-5 hidden items-baseline justify-between lg:flex">
                  <h2 className="font-oswald text-2xl font-bold uppercase tracking-wide text-[#111111]">
                    Order summary
                  </h2>
                  <span className="text-xs text-[#5C5C5C]">
                    {itemCount} {itemsLabel}
                  </span>
                </div>

                <dl className="space-y-3 text-sm">
                  <SummaryRow label="Bag total (MRP)">{formatINR(bagTotalMrp)}</SummaryRow>
                  {saleSavings > 0 && (
                    <SummaryRow label="Discount on MRP" red>
                      −{formatINR(saleSavings)}
                    </SummaryRow>
                  )}
                  {memberSavings > 0 && (
                    <SummaryRow label="Member Savings" red>
                      −{formatINR(memberSavings)}
                    </SummaryRow>
                  )}
                  {discount > 0 && (
                    <SummaryRow
                      label={`Coupon${coupon.couponCode ? ` (${coupon.couponCode})` : ''}`}
                      red
                    >
                      −{formatINR(discount)}
                    </SummaryRow>
                  )}
                  <div className="border-t border-[#DADADA] pt-3">
                    <SummaryRow label="Subtotal" strong>
                      {formatINR(subtotal)}
                    </SummaryRow>
                  </div>
                  <SummaryRow label="Shipping">
                    {shipping === 0 ? 'FREE' : formatINR(shipping)}
                  </SummaryRow>
                  <SummaryRow label={`GST (${Math.round(GST_RATE * 100)}%)`}>
                    {formatINR(gst)}
                  </SummaryRow>
                </dl>

                <div className="mt-5">
                  <CouponPanel
                    coupon={coupon}
                    minOrderShortfall={minOrderShortfall}
                    discount={discount}
                    signedIn={signedIn}
                  />
                </div>

                <div className="mt-5 border-t border-[#111111] pt-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <span className="text-base font-bold text-[#111111]">Total payable</span>
                      <p className="mt-0.5 text-xs text-[#5C5C5C]">Inclusive of GST and shipping</p>
                    </div>
                    <strong className="text-3xl font-bold tabular-nums tracking-tight text-[#111111] sm:text-4xl">
                      {formatINR(total)}
                    </strong>
                  </div>
                  {totalSavings > 0 && (
                    <p className={`mt-3 flex items-center gap-2 text-sm font-semibold ${RED}`}>
                      <Tag className="h-4 w-4" strokeWidth={1.75} />
                      You&apos;re saving {formatINR(totalSavings)} on this order
                    </p>
                  )}
                </div>

                <div className="mt-6 hidden space-y-3 lg:block">
                  <Link href="/checkout" onClick={handleCheckout} className={checkoutClass}>
                    Proceed to checkout
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <p className="text-center text-xs text-[#5C5C5C]">
                    Secure checkout · 7-day returns
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {mounted && safeItems.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E5E5] bg-white lg:hidden">
          <div className="mx-auto flex max-w-[640px] items-center justify-between gap-4 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
            <div className="min-w-0">
              <p className="text-[11px] text-[#5C5C5C]">
                Total · {itemCount} {itemsLabel}
              </p>
              <p className="truncate text-xl font-bold tabular-nums text-[#111111]">
                {formatINR(total)}
              </p>
            </div>
            <Link
              href="/checkout"
              onClick={handleCheckout}
              className={`flex min-h-[48px] shrink-0 items-center bg-[#111111] px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#2A2A2A] active:scale-[0.98] ${focusRing}`}
            >
              Proceed to checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
