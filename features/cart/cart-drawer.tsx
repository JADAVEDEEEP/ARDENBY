'use client';

import { motion, AnimatePresence } from 'framer-motion';

import {

  X,

  Minus,

  Plus,

  ShoppingBag,

  Trash2,

  Tag,

  ArrowRight,

  ShieldCheck,

  AlertTriangle,

  Info,

  Check,

} from 'lucide-react';

import Link from 'next/link';

import {

  useCartStore,

  getCartSubtotal,

  getCartSavings,

} from '@/store/cart-store';

import { apiUrl } from '@/lib/api-url';

import { formatINR } from '@/lib/format';

import { useEffect, useState, type MouseEvent } from 'react';

import { toast } from 'sonner';

const FREE_SHIP_THRESHOLD = 999;

const TIER_THRESHOLD = 3450;

const TIER_DISCOUNT = 10;

const GOLD_GRADIENT =

  'linear-gradient(135deg,#A9812F 0%,#E3C673 48%,#C9A24B 100%)';

const COUPON_STORAGE_KEY = 'kovenik_applied_coupon';

type StoredCoupon = { code: string; discount: number; subtotal?: number };

function readStoredCoupon(): StoredCoupon | null {

  if (typeof window === 'undefined') return null;

  try {

    const raw = localStorage.getItem(COUPON_STORAGE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    const code =

      typeof parsed?.code === 'string'

        ? parsed.code.trim().toUpperCase()

        : '';

    const discount = Number(parsed?.discount);

    if (!code || !Number.isFinite(discount) || discount < 0) {

      return null;

    }

    const storedSubtotal = Number(parsed?.subtotal);

    return {
      code,
      discount,
      subtotal:
        Number.isFinite(storedSubtotal) && storedSubtotal > 0
          ? storedSubtotal
          : undefined,
    };

  } catch {

    return null;

  }

}

const TABS_KEY = 'kovenik_open_tabs';

const REOPEN_RESET_MS = 5000;

const SESSION_KEY = 'kovenik_session_alive';

type TabsState = { ids: string[]; closedAt: number };

function readTabs(): TabsState {

  try {

    const parsed = JSON.parse(

      localStorage.getItem(TABS_KEY) || 'null'

    );

    return {

      ids: Array.isArray(parsed?.ids) ? parsed.ids : [],

      closedAt: Number(parsed?.closedAt) || 0,

    };

  } catch {

    return { ids: [], closedAt: 0 };

  }

}

function writeTabs(state: TabsState) {

  try {

    localStorage.setItem(TABS_KEY, JSON.stringify(state));

  } catch {

    // ignore 

  }

}

function writeStoredCoupon(value: StoredCoupon | null) {

  if (typeof window === 'undefined') return;

  try {

    if (value) {

      localStorage.setItem(

        COUPON_STORAGE_KEY,

        JSON.stringify(value)

      );

    } else {

      localStorage.removeItem(COUPON_STORAGE_KEY);

    }
      window.dispatchEvent(new Event('kovenik:coupon-change'));
  } catch {

    // storage unavailable - ignore 

  }

}

function extractCouponDiscount(data: any, subtotal: number): number {
  const raw = Number(
    data?.discount ??
      data?.data?.discount ??
      data?.coupon?.discount ??
      data?.discountAmount ??
      data?.data?.discountAmount ??
      data?.coupon?.discountAmount ??
      0
  );

  return Math.max(0, Math.min(Number.isFinite(raw) ? raw : 0, subtotal));
}

type NotifyKind = 'success' | 'error' | 'info';

const NOTIFY_THEME: Record<
  NotifyKind,
  { card: string; icon: string; label: string; bar: string }
> = {
  success: {
    card: 'border-emerald-500/60 shadow-[0_14px_40px_rgba(0,0,0,0.5),0_0_24px_rgba(16,185,129,0.14)]',
    icon: 'border-emerald-500/50 text-emerald-400',
    label: 'text-emerald-400',
    bar: 'bg-emerald-500',
  },
  error: {
    card: 'border-red-500/60 shadow-[0_14px_40px_rgba(0,0,0,0.5),0_0_24px_rgba(239,68,68,0.14)]',
    icon: 'border-red-500/50 text-red-400',
    label: 'text-red-400',
    bar: 'bg-red-500',
  },
  info: {
    card: 'border-[#C9A24B]/70 shadow-[0_14px_40px_rgba(0,0,0,0.5),0_0_24px_rgba(201,162,75,0.16)]',
    icon: 'border-[#C9A24B]/60 text-[#E8D3A0]',
    label: 'text-[#C9A24B]',
    bar: 'bg-[#C9A24B]',
  },
};

function showToast(
  kind: NotifyKind,
  title: string,
  message: string,
  options: { duration: number; icon?: 'shield' }
) {
  const theme = NOTIFY_THEME[kind];
  const Icon =
    options.icon === 'shield'
      ? ShieldCheck
      : kind === 'success'
        ? Check
        : kind === 'error'
          ? AlertTriangle
          : Info;

  // Same id => sonner updates the visible toast instead of stacking a duplicate.
  toast.custom(
    (toastId) => (
      <div
        role={kind === 'error' ? 'alert' : 'status'}
        className={`relative flex w-[min(92vw,420px)] items-start gap-3 overflow-hidden rounded-xl border bg-[#12100D] px-4 py-3.5 text-[#F4EEDD] backdrop-blur-md ${theme.card}`}
      >
        <span
          className={`absolute inset-y-0 left-0 w-[3px] ${theme.bar}`}
          aria-hidden="true"
        />
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-[#0A0908] ${theme.icon}`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p
            className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${theme.label}`}
          >
            {title}
          </p>
          <p className="mt-1 break-words text-sm leading-relaxed text-[#F4EEDD]">
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(toastId)}
          aria-label="Dismiss notification"
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8F8878] transition-colors hover:bg-[#C9A24B]/10 hover:text-[#E8D3A0]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ),
    {
      id: `kovenik-cart-${kind}-${title}-${message}`,
      duration: options.duration,
      position: 'top-right',
    }
  );
}

const notify = {
  success(message: string) {
    showToast(
      'success',
      /coupon/i.test(message) ? 'Coupon applied' : 'Success',
      message,
      { duration: 3500 }
    );
  },
  error(message: string) {
    const title = /stock|inventory|insufficient/i.test(message)
      ? 'Out of stock'
      : /login/i.test(message)
        ? 'Login required'
        : /coupon/i.test(message)
          ? 'Coupon error'
          : 'Something went wrong';
    showToast('error', title, message, { duration: 4500 });
  },
  info(message: string) {
    showToast(
      'info',
      /coupon/i.test(message) ? 'Coupon removed' : 'Notice',
      /^coupon removed$/i.test(message) ? 'Coupon removed from your order.' : message,
      { duration: 3000 }
    );
  },
  loginRequired() {
    showToast(
      'info',
      'Login required',
      'Please login to your account before checkout.',
      { duration: 3500, icon: 'shield' }
    );
  },
};

export function CartDrawer() {

  const {

    isOpen,

    closeCart,

    items,

    removeItem,

    updateQuantity,

    couponCode,

    applyCoupon,

    removeCoupon,

  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');

  const [couponDiscount, setCouponDiscount] = useState(0);

  const [isApplyingCoupon, setIsApplyingCoupon] =

    useState(false);

  const [couponError, setCouponError] = useState('');

  // Max quantity per cart line, learned from the server's stock validation.
  const [stockLimits, setStockLimits] = useState<Record<string, number>>({});

  // Coupon feedback is shown right under the coupon section, not as a floating toast.
  const [couponNotice, setCouponNotice] = useState<{
    kind: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const showCouponNotice = (
    kind: 'success' | 'error' | 'info',
    text: string
  ) => setCouponNotice({ kind, text });

  useEffect(() => {
    if (!couponNotice) return;
    const timer = setTimeout(() => setCouponNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [couponNotice]);

  // Reset coupon if the whole site was closed and then opened again

  useEffect(() => {

    const tabId = `${Date.now()}-${Math.random()

      .toString(36)

      .slice(2)}`;

    const register = () => {

      const state = readTabs();

      if (!state.ids.includes(tabId)) state.ids.push(tabId);

      writeTabs(state);

    };

    const unregister = () => {

      const state = readTabs();

      state.ids = state.ids.filter((id) => id !== tabId);

      if (state.ids.length === 0) state.closedAt = Date.now();

      writeTabs(state);

    };

    // sessionStorage survives a reload / in-tab navigation but not a closed
    // browser, so a refresh must never be mistaken for "site closed and reopened".
    let isSameSession = false;

    try {
      isSameSession = sessionStorage.getItem(SESSION_KEY) === '1';
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // ignore
    }

    const initial = readTabs();

    if (

      !isSameSession &&

      initial.ids.length === 0 &&

      initial.closedAt > 0 &&

      Date.now() - initial.closedAt > REOPEN_RESET_MS

    ) {

      writeStoredCoupon(null);

    }

    register();

    const onPageShow = (e: PageTransitionEvent) => {

      if (e.persisted) register();

    };

    window.addEventListener('pagehide', unregister);

    window.addEventListener('pageshow', onPageShow);

    return () => {

      window.removeEventListener('pagehide', unregister);

      window.removeEventListener('pageshow', onPageShow);

      unregister();

    };

  }, []);

  // Restore coupon on mount / tab focus and sync across tabs

  useEffect(() => {

    const syncFromStorage = () => {

      const stored = readStoredCoupon();

      const state = useCartStore.getState();

      const current = (state.couponCode ?? '')

        .trim()

        .toUpperCase();

      if (stored) {

        if (current !== stored.code) {

          state.applyCoupon(stored.code);

        }

        setCouponDiscount(stored.discount);

      } else {

        if (state.couponCode) {

          state.removeCoupon();

        }

        setCouponDiscount(0);

        setCouponInput('');

        setCouponError('');

      }

    };

    syncFromStorage();

    const onStorage = (e: StorageEvent) => {

      if (e.key === null || e.key === COUPON_STORAGE_KEY) {

        syncFromStorage();

      }

    };

    const onVisible = () => {

      if (document.visibilityState === 'visible') {

        syncFromStorage();

      }

    };

    window.addEventListener('storage', onStorage);

    document.addEventListener('visibilitychange', onVisible);

    return () => {

      window.removeEventListener('storage', onStorage);

      document.removeEventListener(

        'visibilitychange',

        onVisible

      );

    };

    // Re-sync every time the drawer opens/closes so the discount never resets

  }, [isOpen]);

  const subtotal = getCartSubtotal(items);

  const savings = getCartSavings(items);

  const handleQuantityChange = async (
    item: (typeof items)[number],
    quantity: number
  ) => {
    const limitKey = `${item.productId}-${item.size}-${item.color}`;
    try {
      await updateQuantity(
        item.productId,
        item.size,
        item.color,
        quantity
      );
      // A successful increase past a remembered limit means stock changed.
      setStockLimits((prev) =>
        prev[limitKey] !== undefined && quantity > prev[limitKey]
          ? Object.fromEntries(
              Object.entries(prev).filter(([key]) => key !== limitKey)
            )
          : prev
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update quantity.';
      const normalized = message.toLowerCase();
      if (
        normalized.includes('inventory') ||
        normalized.includes('stock') ||
        normalized.includes('insufficient')
      ) {
        // The server rejected an increase: the quantity before the attempt is the maximum.
        if (quantity > item.quantity) {
          setStockLimits((prev) => ({ ...prev, [limitKey]: item.quantity }));
        }
      } else {
        notify.error(message || 'Unable to update quantity. Please try again.');
      }
    }
  };

const discount = Math.min(couponDiscount, subtotal);

  const shipping =

    subtotal >= FREE_SHIP_THRESHOLD || subtotal === 0

      ? 0

      : 79;

  const taxableAmount = Math.max(

    0,

    subtotal - discount

  );

  const gst = Math.round(taxableAmount * 0.05);

  const total =

    taxableAmount + shipping + gst;

  const tierProgress = Math.min(

    100,

    (subtotal / TIER_THRESHOLD) * 100

  );

  const remaining = Math.max(

    0,

    TIER_THRESHOLD - subtotal

  );

  // The stored discount was validated against one subtotal. Re-validate when
  // the cart changes so the drawer, cart and checkout never show a stale amount.
  useEffect(() => {
    if (!couponCode || subtotal <= 0) return;

    const stored = readStoredCoupon();
    const code = couponCode.trim().toUpperCase();

    if (!stored || stored.code !== code || stored.subtotal === subtotal) return;

    const token = localStorage.getItem('ardenby_token');
    if (!token) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(apiUrl('/api/coupons/validate'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code, subtotal }),
        });

        const data = await response.json().catch(() => ({}));
        if (cancelled) return;

        if (!response.ok) {
          // Only drop the coupon when the server says it no longer applies.
          if (
            response.status >= 400 &&
            response.status < 500 &&
            response.status !== 401 &&
            response.status !== 429
          ) {
            writeStoredCoupon(null);
            removeCoupon();
            setCouponDiscount(0);
            showCouponNotice(
              'error',
              data?.message || data?.error || 'Coupon is no longer valid for this cart.'
            );
          }
          return;
        }

        const nextDiscount = extractCouponDiscount(data, subtotal);
        writeStoredCoupon({ code, discount: nextDiscount, subtotal });
        setCouponDiscount(nextDiscount);
      } catch {
        // Network problem: keep the last known discount.
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponCode, subtotal]);

  const handleApplyCoupon = async () => {

    const code = couponInput

      .trim()

      .toUpperCase();

    if (!code) {

      showCouponNotice('error', 'Please enter a coupon code');

      return;

    }

    // Duplicate detection: same coupon already applied.

    // No API call, no discount change, no toast.

    if (

      couponCode &&

      couponCode.trim().toUpperCase() === code

    ) {

      setCouponError(

        'Already Applied — This coupon is already applied to your cart.'

      );

      return;

    }

    setCouponError('');

    const token =

      typeof window !== 'undefined'

        ? localStorage.getItem('ardenby_token')

        : null;

    if (!token) {

      showCouponNotice('error', 

        'Please login to apply a coupon'

      );

      return;

    }

    if (subtotal <= 0) {

      showCouponNotice('error', 

        'Add products to your cart first'

      );

      return;

    }

    setIsApplyingCoupon(true);

    try {

      const response = await fetch(

        apiUrl('/api/coupons/validate'),

        {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json',

            Authorization: `Bearer ${token}`,

          },

          body: JSON.stringify({

            code,

            subtotal,

          }),

        }

      );

      const data = await response

        .json()

        .catch(() => ({}));

      if (!response.ok) {

        showCouponNotice('error', 

          data?.message ||

            data?.error ||

            'Invalid coupon code'

        );

        // Keep the existing discount if a coupon is already applied

        if (!couponCode) setCouponDiscount(0);

        return;

      }

      const backendDiscount = Number(

        data?.discount ??

          data?.data?.discount ??

          data?.coupon?.discount ??

          data?.discountAmount ??

          data?.data?.discountAmount ??

          data?.coupon?.discountAmount ??

          0

      );

      const safeDiscount = Math.max(

        0,

        Math.min(

          Number.isFinite(backendDiscount)

            ? backendDiscount

            : 0,

          subtotal

        )

      );

      writeStoredCoupon({ code, discount: safeDiscount, subtotal });

      setCouponDiscount(safeDiscount);

      applyCoupon(code);

      setCouponInput('');

      showCouponNotice('success', 

        safeDiscount > 0

          ? `Coupon ${code} applied! You save ${formatINR(

              safeDiscount

            )}`

          : `Coupon ${code} applied!`

      );

    } catch (error) {

      console.error(

        'Coupon validation error:',

        error

      );

      showCouponNotice('error', 

        'Unable to validate coupon. Please try again.'

      );

    } finally {

      setIsApplyingCoupon(false);

    }

  };

  const handleRemoveCoupon = () => {

    writeStoredCoupon(null);

    removeCoupon();

    setCouponDiscount(0);

    setCouponInput('');

    setCouponError('');

    showCouponNotice('info', 'Coupon removed');

  };

  const focusRing =

    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E8D3A0] focus-visible:ring-offset-0';

  const handleCheckoutClick = (

    e: MouseEvent<HTMLAnchorElement>

  ) => {

    const token =

      typeof window !== 'undefined'

        ? localStorage.getItem('ardenby_token')

        : null;

    if (token) {

      closeCart();

      return;

    }

    e.preventDefault();

    notify.loginRequired();

  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[120] overflow-y-auto overscroll-contain bg-[#0A0908] text-[#F4EEDD] [scrollbar-color:#C9A24B55_transparent] [scrollbar-width:thin]"
          role="main"
          aria-label="Shopping cart"
        >
          <div className="mx-auto max-w-[1280px] px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-8 lg:px-12 lg:pt-10">
            {/* Page heading */}
            <header className="mb-8 border-b border-[#C9A24B]/50 pb-5 lg:mb-10">
              <div className="flex items-end justify-between gap-4">
                <h1 className="font-display text-3xl font-normal uppercase tracking-[0.12em] text-[#F4EEDD] sm:text-4xl lg:text-5xl">
                  Shopping Bag{' '}
                  <span className="align-middle text-xl text-[#C9A24B] sm:text-2xl">
                    ✦
                  </span>
                </h1>
                <div className="flex shrink-0 items-center gap-3 pb-1">
                  {items.length > 0 && (
                    <span className="hidden whitespace-nowrap text-[11px] uppercase tracking-[0.25em] text-[#F4EEDD] sm:block">
                      {String(items.length).padStart(2, '0')}{' '}
                      {items.length === 1 ? 'Item' : 'Items'}
                    </span>
                  )}
                  <button
                    onClick={closeCart}
                    className={`flex h-11 items-center gap-2 rounded-lg border border-[#C9A24B]/50 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F4EEDD] transition-colors duration-200 hover:border-[#E8D3A0] hover:text-[#E8D3A0] ${focusRing}`}
                    aria-label="Close cart"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                    <span className="hidden sm:inline">Close</span>
                  </button>
                </div>
              </div>
              <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-[#C9A24B] sm:text-xs">
                Review your pieces before they become yours
              </p>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-[#C9A24B]/30 bg-[#12100D] px-6 py-20 text-center sm:py-28">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#C9A24B]/60 bg-[#0A0908] shadow-[0_0_40px_-8px_rgba(201,162,75,0.35)]">
                  <ShoppingBag
                    className="h-9 w-9 text-[#C9A24B]"
                    strokeWidth={1.25}
                  />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold uppercase tracking-[0.2em] text-[#F4EEDD]">
                    Your cart is empty
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#8F8878]">
                    Nothing here yet.
                    <br />
                    Discover pieces made for your essence.
                  </p>
                </div>
                <Link
                  href="/shop"
                  onClick={closeCart}
                  className={`group inline-flex min-h-[48px] items-center gap-2 rounded-lg px-8 text-xs font-bold uppercase tracking-[0.2em] text-[#0A0908] shadow-[0_0_28px_-6px_rgba(227,198,115,0.55)] transition-[filter,box-shadow] duration-200 hover:brightness-110 ${focusRing}`}
                  style={{ background: GOLD_GRADIENT }}
                >
                  Shop Now
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            ) : (
              <>
                {/* Progress */}
                {remaining > 0 && (
                  <div className="mb-6 rounded-xl border border-[#C9A24B]/40 bg-[#12100D] px-4 py-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C9A24B]">
                      Unlock your next benefit
                    </p>
                    <p className="mt-1.5 text-[13px] text-[#F4EEDD]">
                      Spend{' '}
                      <span className="font-semibold">
                        {formatINR(remaining)}
                      </span>{' '}
                      more to unlock{' '}
                      <span className="font-semibold">
                        {TIER_DISCOUNT}% OFF
                      </span>
                    </p>
                    <div className="mt-2.5 flex items-center gap-3">
                      <div
                        className="h-[5px] flex-1 overflow-hidden rounded-full border border-[#C9A24B]/25 bg-black"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(tierProgress)}
                      >
                        <div
                          className="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                          style={{
                            width: `${tierProgress}%`,
                            background: GOLD_GRADIENT,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-medium tabular-nums text-[#E8D3A0]">
                        {Math.round(tierProgress)}%
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-[#8F8878]">
                      <span>{formatINR(remaining)} to go</span>
                      <span className="truncate">
                        {TIER_DISCOUNT}% off on {formatINR(TIER_THRESHOLD)}+
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid items-start gap-8 lg:grid-cols-[1.7fr_1fr] lg:gap-12">
                  {/* Products */}
                  <section aria-label="Cart items" className="space-y-4">
                    {items.map((item) => {
                      const offPercent =
                        item.mrp > item.price
                          ? Math.round((1 - item.price / item.mrp) * 100)
                          : 0;
                      const stockLimit =
                        stockLimits[`${item.productId}-${item.size}-${item.color}`];
                      const atStockLimit =
                        stockLimit !== undefined && item.quantity >= stockLimit;

                      return (
                        <div
                          key={`${item.productId}-${item.size}-${item.color}`}
                          className="flex gap-4 rounded-2xl border border-[#C9A24B]/25 bg-gradient-to-b from-[#14110D] to-[#0F0D0A] p-3 transition-all duration-300 hover:border-[#C9A24B]/55 hover:shadow-[0_0_28px_-8px_rgba(201,162,75,0.25)] sm:gap-6 sm:p-5"
                        >
                          <Link
                            href={`/product/${item.slug}`}
                            onClick={closeCart}
                            className="shrink-0"
                          >
                            <div className="aspect-[4/5] w-[88px] overflow-hidden rounded-xl border border-[#C9A24B]/50 bg-black sm:w-[140px]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover object-center"
                              />
                            </div>
                          </Link>

                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={`/product/${item.slug}`}
                                onClick={closeCart}
                                className="line-clamp-2 text-[15px] font-medium leading-snug text-[#F4EEDD] transition-colors hover:text-[#E8D3A0] sm:text-lg"
                              >
                                {item.name}
                              </Link>
                              <button
                                onClick={() =>
                                  removeItem(
                                    item.productId,
                                    item.size,
                                    item.color
                                  )
                                }
                                className={`-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#8F8878] transition-colors duration-200 hover:text-[#E8D3A0] ${focusRing}`}
                                aria-label={`Remove ${item.name}`}
                              >
                                <Trash2
                                  className="h-[18px] w-[18px]"
                                  strokeWidth={1.5}
                                />
                              </button>
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#8F8878]">
                              <span className="rounded-md border border-[#C9A24B]/25 bg-black px-2 py-0.5">
                                Size: {item.size}
                              </span>
                              <span className="h-1 w-1 rounded-full bg-[#C9A24B]" />
                              <span className="rounded-md border border-[#C9A24B]/25 bg-black px-2 py-0.5">
                                {item.color}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-[15px] font-semibold tabular-nums text-[#E3C673]">
                                {formatINR(item.price)}
                              </span>
                              {item.mrp > item.price && (
                                <span className="text-xs tabular-nums text-[#6F6a5d] line-through">
                                  {formatINR(item.mrp)}
                                </span>
                              )}
                              {offPercent > 0 && (
                                <span
                                  className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0A0908]"
                                  style={{ background: GOLD_GRADIENT }}
                                >
                                  {offPercent}% off
                                </span>
                              )}
                            </div>

                            <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-4">
                              <div className="flex flex-col items-start gap-1.5">
                                <div className="flex items-center rounded-full border border-[#C9A24B] bg-black">
                                  <button
                                    onClick={() => void handleQuantityChange(item, item.quantity - 1)}
                                    className={`flex h-11 w-11 items-center justify-center rounded-full text-[#C9A24B] transition-colors duration-150 hover:text-[#E8D3A0] active:scale-90 sm:h-10 sm:w-10 ${focusRing}`}
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="w-8 text-center text-sm font-semibold tabular-nums text-[#F4EEDD]">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => void handleQuantityChange(item, item.quantity + 1)}
                                    disabled={atStockLimit}
                                    className={`flex h-11 w-11 items-center justify-center rounded-full text-[#C9A24B] transition-colors duration-150 hover:text-[#E8D3A0] active:scale-90 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:text-[#C9A24B] disabled:active:scale-100 sm:h-10 sm:w-10 ${focusRing}`}
                                    aria-label="Increase quantity"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                                {atStockLimit && (
                                  <p
                                    role="alert"
                                    className="pl-1 text-[10px] font-bold uppercase tracking-[0.18em] text-red-500"
                                  >
                                    Out of stock
                                  </p>
                                )}
                              </div>
                              <span className="text-lg font-bold tabular-nums tracking-tight text-[#E3C673] sm:text-xl">
                                {formatINR(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </section>

                  {/* Order summary */}
                  <aside className="rounded-3xl border border-[#C9A24B]/60 bg-[#12100D] p-5 shadow-[0_0_40px_rgba(201,162,75,0.10)] sm:p-8 lg:sticky lg:top-6">
                    <h2 className="font-display text-2xl font-normal uppercase tracking-[0.12em] text-[#F4EEDD] sm:text-3xl">
                      Order Summary{' '}
                      <span className="align-middle text-lg text-[#C9A24B]">
                        ✦
                      </span>
                    </h2>
                    <p className="mt-2 border-b border-[#C9A24B]/30 pb-5 text-[10px] uppercase tracking-[0.22em] text-[#8F8878] sm:text-[11px]">
                      Final step to wear your essence
                    </p>

                    <div className="mt-6 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#8F8878]">Subtotal</span>
                        <span className="font-semibold tabular-nums text-[#F4EEDD]">
                          {formatINR(subtotal)}
                        </span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-emerald-300/90">
                            Discount{couponCode ? ` (${couponCode})` : ''}
                          </span>
                          <span className="tabular-nums text-emerald-300/90">
                            −{formatINR(discount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-[#8F8878]">Shipping</span>
                        <span className="tabular-nums text-[#F4EEDD]">
                          {shipping === 0 ? 'FREE' : formatINR(shipping)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8F8878]">GST (5%)</span>
                        <span className="tabular-nums text-[#F4EEDD]">
                          {formatINR(gst)}
                        </span>
                      </div>
                      {savings > 0 && (
                        <div className="flex justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-emerald-300/90">
                          <span>You Save</span>
                          <span className="font-semibold tabular-nums">
                            {formatINR(savings)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex items-end justify-between border-t border-[#C9A24B]/40 pt-5">
                      <div>
                        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F4EEDD]">
                          Total
                        </span>
                        <p className="mt-1 text-[10px] text-[#8F8878]">
                          Includes all applicable taxes
                        </p>
                      </div>
                      <strong className="font-display text-3xl font-bold tabular-nums tracking-tight text-[#E3C673] sm:text-4xl">
                        {formatINR(total)}
                      </strong>
                    </div>

                    {/* Coupon */}
                    <div className="mt-6 border-t border-[#C9A24B]/20 pt-5">
                      <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E3C673]">
                        <Tag className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Coupon code
                      </p>
                      {couponCode && (
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-3 py-2.5">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/90 text-[#0A0908]">
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </span>
                            <div className="min-w-0">
                              <span className="block truncate text-sm font-semibold uppercase tracking-[0.12em] text-[#F4EEDD]">
                                {couponCode}
                              </span>
                              <span className="block text-[11px] text-emerald-300/90">
                                Applied · you save {formatINR(discount)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={handleRemoveCoupon}
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#8F8878] transition-colors hover:text-[#E8D3A0] ${focusRing}`}
                            aria-label="Remove coupon"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <div className={couponCode ? 'mt-2' : ''}>
                        <div className="flex gap-2">
                          <input
                            value={couponInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              setCouponInput(value);
                              if (
                                couponError &&
                                value
                                  .trim()
                                  .toUpperCase() !==
                                  (couponCode ?? '')
                                    .trim()
                                    .toUpperCase()
                              ) {
                                setCouponError('');
                              }
                            }}
                            onKeyDown={(e) => {
                              if (
                                e.key === 'Enter' &&
                                !isApplyingCoupon
                              ) {
                                void handleApplyCoupon();
                              }
                            }}
                            placeholder="Enter coupon code"
                            disabled={isApplyingCoupon}
                            aria-invalid={couponError ? true : undefined}
                            className="h-12 min-w-0 flex-1 rounded-lg border border-[#C9A24B]/40 bg-black px-4 text-sm text-[#F4EEDD] transition-colors duration-200 placeholder:text-[#8F8878] focus:border-[#E8D3A0] focus:outline-none focus:ring-1 focus:ring-[#E8D3A0]/60 disabled:cursor-not-allowed disabled:opacity-60"
                          />
                          <button
                            type="button"
                            onClick={() => void handleApplyCoupon()}
                            disabled={isApplyingCoupon}
                            className={`h-12 shrink-0 rounded-lg px-5 text-xs font-bold uppercase tracking-[0.18em] text-[#0A0908] transition-[filter] duration-200 hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
                            style={{ background: GOLD_GRADIENT }}
                          >
                            {isApplyingCoupon ? '...' : 'Apply'}
                          </button>
                        </div>
                        {couponError && (
                          <p
                            role="alert"
                            className="mt-2 text-xs leading-relaxed text-red-500"
                          >
                            {couponError}
                          </p>
                        )}
                        {couponNotice && (
                          <p
                            role={couponNotice.kind === 'error' ? 'alert' : 'status'}
                            className={`mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed ${
                              couponNotice.kind === 'success'
                                ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300'
                                : couponNotice.kind === 'error'
                                  ? 'border-red-500/40 bg-red-500/5 text-red-400'
                                  : 'border-[#C9A24B]/40 bg-[#C9A24B]/5 text-[#E8D3A0]'
                            }`}
                          >
                            {couponNotice.text}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-7 space-y-3">
                      <Link
                        href="/checkout"
                        onClick={handleCheckoutClick}
                        className={`group flex min-h-[52px] items-center justify-center gap-2 rounded-xl text-center text-xs font-bold uppercase tracking-[0.18em] text-[#0A0908] shadow-[0_0_28px_rgba(201,162,75,0.28)] transition-[filter,box-shadow] duration-300 hover:brightness-110 hover:shadow-[0_0_36px_rgba(201,162,75,0.4)] active:scale-[0.99] sm:text-sm ${focusRing}`}
                        style={{ background: GOLD_GRADIENT }}
                      >
                        Checkout
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </aside>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
