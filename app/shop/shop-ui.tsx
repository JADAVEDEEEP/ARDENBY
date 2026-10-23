'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { AlertTriangle, BellOff, Check, Heart, Pause, Play, ShoppingBag, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/format';
import {
  focusQty,
  normalizeProductColors,
  saveNotify,
  sizeQty,
  stateOfQty,
  totalStock,
  type ProductColorDot,
} from './shop-stock';
import { useWishlistStore } from '@/store/wishlist-store';
import { useCartStore } from '@/store/cart-store';
import { WishlistLoginModal } from '@/components/product/product-card';
import { TeeSpinner } from '@/components/product/TeeSpinner';

/* ------------------------------------------------------------------ */
/*  Shared constants                                                  */
/* ------------------------------------------------------------------ */

export const COLOR_HEX: Record<string, string> = {
  Black: '#111111',
  White: '#FFFFFF',
  Beige: '#D8C3A5',
  Olive: '#6B705C',
  Navy: '#1a2540',
  'Royal Blue': '#1e40d4',
  'Sky Blue': '#87CEEB',
  Lilac: '#C8A2C8',
  Red: '#DC2626',
  Green: '#16a34a',
};

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return matches;
}

/* ------------------------------------------------------------------ */
/*  Glass-metallic toasts                                             */
/* ------------------------------------------------------------------ */

export type ToastVariant = 'stock' | 'low' | 'bag' | 'wish' | 'filter';

export type KvToast = {
  id: number;
  variant: ToastVariant;
  title: string;
  message: string;
  thumb?: string;
  duration?: number;
  actions?: { label: string; onClick?: () => void; href?: string; primary?: boolean }[];
};

const TOAST_STYLE: Record<
  ToastVariant,
  { bg: string; border: string; accent: string; bar: string }
> = {
  stock: {
    bg: 'linear-gradient(135deg, rgba(150,40,38,.55), rgba(52,12,14,.78) 60%, rgba(30,8,10,.85))',
    border: 'rgba(255,110,96,.42)',
    accent: '#ffb1a6',
    bar: 'linear-gradient(90deg,#ff6a5a,#b3261e)',
  },
  low: {
    bg: 'linear-gradient(135deg, rgba(245,158,11,.30), rgba(84,48,8,.74) 60%, rgba(34,20,6,.86))',
    border: 'rgba(251,167,38,.5)',
    accent: '#fcd28a',
    bar: 'linear-gradient(90deg,#b45309,#fbbf24)',
  },
  bag: {
    bg: 'linear-gradient(135deg, rgba(210,210,215,.26), rgba(60,60,66,.72) 60%, rgba(20,20,24,.85))',
    border: 'rgba(210,210,215,.5)',
    accent: '#eceef2',
    bar: 'linear-gradient(90deg,#8e939b,#f6f6f8)',
  },
  filter: {
    bg: 'linear-gradient(135deg, rgba(210,210,215,.22), rgba(60,60,66,.72) 60%, rgba(20,20,24,.85))',
    border: 'rgba(210,210,215,.45)',
    accent: '#eceef2',
    bar: 'linear-gradient(90deg,#8e939b,#f6f6f8)',
  },
  wish: {
    bg: 'linear-gradient(135deg, rgba(255,255,255,.2), rgba(120,122,130,.34) 55%, rgba(48,49,54,.7))',
    border: 'rgba(255,255,255,.38)',
    accent: '#eceef2',
    bar: 'linear-gradient(90deg,#8e939b,#ffffff)',
  },
};

export function useToasts() {
  const [toasts, setToasts] = useState<KvToast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((toast: Omit<KvToast, 'id'>, opts?: { replace?: boolean }) => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((t) => {
      const base = opts?.replace ? t.filter((x) => x.variant !== toast.variant) : t;
      return [...base, { ...toast, id }].slice(-3);
    });
    return id;
  }, []);

  return { toasts, push, dismiss };
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const cls = 'h-4 w-4';
  if (variant === 'stock') return <BellOff className={cls} aria-hidden />;
  if (variant === 'low') return <AlertTriangle className={cls} aria-hidden />;
  if (variant === 'bag') return <ShoppingBag className={cls} aria-hidden />;
  if (variant === 'wish') return <Heart className={cls} aria-hidden />;
  return <Check className={cls} aria-hidden />;
}

const TOAST_LABEL: Record<ToastVariant, string> = {
  stock: 'Out of stock',
  low: 'Low stock',
  bag: 'Added to bag',
  wish: 'Saved to wishlist',
  filter: 'Filter applied',
};

function ToastItem({ toast, onDismiss }: { toast: KvToast; onDismiss: (id: number) => void }) {
  const s = TOAST_STYLE[toast.variant];
  const duration = toast.duration ?? 6000;

  useEffect(() => {
    const t = window.setTimeout(() => onDismiss(toast.id), duration);
    return () => window.clearTimeout(t);
  }, [toast.id, duration, onDismiss]);

  return (
    <div
      role="status"
      className="kv-toast pointer-events-auto w-full p-3.5 pr-11 text-[#f4f2ec]"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      <div className="flex items-start gap-3">
        {toast.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={toast.thumb}
            alt=""
            className="h-11 w-11 shrink-0 rounded-[10px] border border-white/20 object-cover"
          />
        ) : (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
            style={{ borderColor: s.border, color: s.accent, background: 'rgba(0,0,0,.28)' }}
          >
            <ToastIcon variant={toast.variant} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p
            className="text-[10px] font-extrabold uppercase tracking-[0.2em]"
            style={{ color: s.accent }}
          >
            {TOAST_LABEL[toast.variant]}
          </p>
          <p className="mt-1 text-[13px] leading-snug text-[#f4f2ec]">{toast.message}</p>
          {toast.actions && toast.actions.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {toast.actions.map((a) => {
                const cls = cn(
                  'inline-flex min-h-[32px] items-center rounded-full border px-3.5 text-[10px] font-extrabold uppercase tracking-[0.14em] transition hover:brightness-125',
                  a.primary
                    ? 'border-transparent bg-white/15 text-white'
                    : 'border-white/25 bg-black/25 text-[#f4f2ec]'
                );
                return a.href ? (
                  <Link key={a.label} href={a.href} className={cls} onClick={() => onDismiss(toast.id)}>
                    {a.label}
                  </Link>
                ) : (
                  <button
                    key={a.label}
                    type="button"
                    className={cls}
                    onClick={() => {
                      a.onClick?.();
                      onDismiss(toast.id);
                    }}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
      <span
        aria-hidden
        className="kv-toast-bar"
        style={{ background: s.bar, ['--dur' as string]: `${duration}ms` }}
      />
    </div>
  );
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: KvToast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 top-[172px] z-[200] flex flex-col gap-3 sm:left-auto sm:right-4 sm:w-[380px] lg:right-6 lg:top-[140px]"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  3D rotating hero tee                                              */
/* ------------------------------------------------------------------ */

export function HeroTee({
  front,
  back,
  printLabel,
  paused,
  onTogglePause,
}: {
  front: string;
  back: string;
  printLabel: string;
  paused: boolean;
  onTogglePause: () => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={cn(
        'relative mx-auto aspect-[4/5] w-[min(76vw,440px)] lg:w-[min(36vw,520px)]',
        (paused || dragging) && 'kv-tee-paused'
      )}
    >
      {/* spotlight cone */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[88%] w-[78%] -translate-x-1/2"
        style={{
          clipPath: 'polygon(38% 0, 62% 0, 100% 100%, 0 100%)',
          background:
            'linear-gradient(180deg, rgba(246,246,248,.20), rgba(210,210,215,.05) 65%, transparent)',
        }}
      />
      {/* floor glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[8%] bottom-0 h-[26%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(210,210,215,.38),transparent)] blur-xl"
      />
      {/* orbit ring */}
      <div
        aria-hidden
        className="kv-orbit-ring pointer-events-none absolute inset-[4%] rounded-full border border-[#d2d2d7]/35"
      >
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f6f6f8] shadow-[0_0_12px_#d2d2d7]" />
      </div>

      {/* tee */}
      <TeeSpinner front={front} back={back} printLabel={printLabel} onDraggingChange={setDragging} />

      {/* pedestal */}
      <div
        aria-hidden
        className="absolute bottom-[3%] left-1/2 h-[9%] w-[64%] -translate-x-1/2 rounded-[50%] border border-[#f6f6f8]/50 shadow-[0_0_40px_rgba(210,210,215,.45),inset_0_2px_6px_rgba(255,255,255,.4)]"
        style={{ background: 'var(--kv-chrome-metal)' }}
      />

      {/* glass labels */}
      <div className="kv-panel absolute left-0 top-[34%] hidden rounded-[10px] px-3 py-2 backdrop-blur-md sm:block">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#f4f2ec]">360° View</p>
        <p className="text-[10px] text-[#BDB9B0]">Drag to rotate</p>
      </div>
      <div className="kv-panel absolute bottom-[14%] right-0 rounded-[10px] px-3 py-2 backdrop-blur-md">
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#BDB9B0]">Print</p>
        <p className="font-[family-name:var(--font-unbounded)] text-[12px] font-extrabold uppercase text-[#f4f2ec]">
          {printLabel}
        </p>
      </div>

      <button
        type="button"
        onClick={onTogglePause}
        aria-label={paused ? 'Play rotation' : 'Pause rotation'}
        aria-pressed={paused}
        className="absolute bottom-0 left-1/2 flex h-11 w-11 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#161618]/90 text-[#d2d2d7] shadow-lg backdrop-blur transition hover:border-[#d2d2d7]"
      >
        {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dual-thumb silver price slider                                      */
/* ------------------------------------------------------------------ */

export function PriceSlider({
  value,
  min,
  max,
  onChange,
}: {
  value: [number, number];
  min: number;
  max: number;
  onChange: (v: [number, number]) => void;
}) {
  const thumb =
    'group relative block h-5 w-5 rounded-full border-2 border-[#E7C873] bg-[#f6f6f8] shadow-[0_0_0_4px_rgba(231,200,115,.18)] outline-none transition focus-visible:ring-2 focus-visible:ring-white';
  const tip =
    'pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#d2d2d7] px-1.5 py-0.5 text-[10px] font-extrabold text-[#0c0c0e] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100';
  return (
    <SliderPrimitive.Root
      value={value}
      min={min}
      max={max}
      step={50}
      minStepsBetweenThumbs={1}
      onValueChange={(v) => onChange([v[0], v[1]])}
      className="relative flex h-8 w-full touch-none select-none items-center"
    >
      <SliderPrimitive.Track className="relative h-[3px] w-full grow overflow-hidden rounded-full bg-white/15">
        <SliderPrimitive.Range className="absolute h-full bg-[#E7C873]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb aria-label="Minimum price" className={thumb}>
        <span className={tip}>{formatINR(value[0])}</span>
      </SliderPrimitive.Thumb>
      <SliderPrimitive.Thumb aria-label="Maximum price" className={thumb}>
        <span className={tip}>{formatINR(value[1])}</span>
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  );
}

/* ------------------------------------------------------------------ */
/*  Colour dots: loading / ok / error (+ retry) / empty               */
/* ------------------------------------------------------------------ */

export type ColorStatus = 'ok' | 'loading' | 'error';

function ColorDots({
  colors,
  status,
  onRetry,
}: {
  colors: ProductColorDot[];
  status: ColorStatus;
  onRetry: () => void;
}) {
  if (status === 'loading') {
    return (
      <span className="flex items-center gap-1" aria-label="Loading colors" role="status">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-3 w-3 animate-pulse rounded-full bg-white/20" />
        ))}
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span
        role="alert"
        className="inline-flex items-center gap-1.5 rounded-full border border-[#ff6e60]/40 px-2 py-0.5 text-[10px] font-semibold text-[#ffb1a6] backdrop-blur-md"
        style={{ background: 'linear-gradient(135deg, rgba(150,40,38,.5), rgba(40,10,12,.75))' }}
      >
        Colors couldn&apos;t load ·
        <button
          type="button"
          onClick={onRetry}
          className="-my-2 min-h-[44px] px-1 font-extrabold uppercase tracking-[0.1em] text-white underline-offset-2 hover:underline"
        >
          Retry
        </button>
      </span>
    );
  }
  if (colors.length === 0) {
    return <span className="text-[10px] text-[#A8A49B]">Color unavailable</span>;
  }
  const shown = colors.slice(0, 4);
  const extra = colors.length - shown.length;
  return (
    <span className="flex items-center gap-1" aria-label={`Colors: ${colors.map((c) => c.name).join(', ')}`}>
      {shown.map((c) => (
        <span
          key={c.name}
          title={c.name}
          aria-hidden
          className="h-3 w-3 rounded-full border border-white/35"
          style={{ backgroundColor: c.hex }}
        />
      ))}
      {extra > 0 && <span className="text-[10px] font-bold text-[#BDB9B0]">+{extra}</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Product card                                                      */
/* ------------------------------------------------------------------ */

function discountPct(p: any): number {
  if (!p.mrp || p.mrp <= 0 || p.price >= p.mrp) return 0;
  return Math.round(((p.mrp - p.price) / p.mrp) * 100);
}

const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export type ToastPush = (t: Omit<KvToast, 'id'>, opts?: { replace?: boolean }) => void;

export function ShopProductCard({
  product,
  view,
  index,
  focusSizes,
  colorStatus,
  onRetryColors,
  onRefresh,
  onToast,
}: {
  product: any;
  view: 'grid' | 'list';
  index: number;
  /** sizes currently selected in the sidebar filter */
  focusSizes: string[];
  colorStatus: ColorStatus;
  onRetryColors: (product: any) => void;
  /** fetch fresh variants from the server; resolves null if unavailable */
  onRefresh: (product: any) => Promise<any | null>;
  onToast: ToastPush;
}) {
  const wishlist = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const isWishlisted = wishlist.has(product.id);
  const [loginOpen, setLoginOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const price: number = product.price;
  const mrp: number | undefined = product.mrp && product.mrp > price ? product.mrp : undefined;
  const bestPrice = Number(product.bestPrice || 0);
  const showBestPrice = bestPrice > 0 && bestPrice < price;
  const pct = discountPct(product);
  const href = `/product/${product.slug}`;

  const carried = ((product.sizes as string[]) || []).map((x) => String(x).toUpperCase());
  const sizes: string[] = carried.length ? ALL_SIZES.filter((s) => carried.includes(s)) : ALL_SIZES;
  const total = totalStock(product);
  const fullySoldOut = total <= 0;
  const focusQ = focusQty(product, focusSizes);
  const soldOutInFocus = !fullySoldOut && focusSizes.length > 0 && focusQ <= 0;
  const unavailable = fullySoldOut || soldOutInFocus;
  const basisQty = focusSizes.length > 0 ? focusQ : total;
  const lowBadge = !unavailable && stateOfQty(basisQty) === 'low';

  const firstAvailable = sizes.find((s) => sizeQty(product, s) > 0) ?? sizes[0];
  const [size, setSize] = useState<string>(
    focusSizes[0] && sizes.includes(focusSizes[0]) ? focusSizes[0] : firstAvailable
  );
  const focusKey = focusSizes.join(',');
  useEffect(() => {
    if (focusSizes[0] && sizes.includes(focusSizes[0])) setSize(focusSizes[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  const colors = normalizeProductColors(product);

  const tag = /trapslayer/i.test(product.name)
    ? 'TRAPSLAYER'
    : product.newArrival
      ? 'NEW DROP'
      : product.bestSeller
        ? 'BESTSELLER'
        : null;

  const soldOutSizes = sizes.filter((s) => sizeQty(product, s) <= 0);
  const chosenQty = sizeQty(product, size);
  const hint = [
    stateOfQty(chosenQty) === 'low' ? `Only ${chosenQty} left in ${size}` : null,
    soldOutSizes.length > 0 ? `${soldOutSizes.join(', ')} sold out` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const notify = (forSize?: string) => {
    saveNotify(product.id, forSize);
    onToast({
      variant: 'wish',
      title: 'Noted',
      message: `We'll flag ${product.name}${forSize ? ` in ${forSize}` : ''} for you.`,
    });
  };

  const soldOutToast = (p: any, s: string) => {
    const next = ALL_SIZES.find((x) => x !== s && sizeQty(p, x) > 0);
    onToast(
      {
        variant: 'stock',
        title: 'Out of stock',
        message: `${p.name} in size ${s} just sold out.`,
        thumb: p.images?.[0],
        actions: [
          { label: 'Notify me', primary: true, onClick: () => notify(s) },
          ...(next
            ? [
                {
                  label: `Try size ${next}`,
                  onClick: () => {
                    setSize(next);
                    setPanelOpen(true);
                  },
                },
              ]
            : []),
        ],
      },
      { replace: true }
    );
  };

  const pickSize = (s: string) => {
    setSize(s);
    const q = sizeQty(product, s);
    if (stateOfQty(q) === 'low') {
      onToast(
        { variant: 'low', title: 'Low stock', message: `${product.name} — only ${q} left in ${s}.` },
        { replace: true }
      );
    }
  };

  const handleWishlist = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ardenby_token') : null;
    if (!token) {
      setLoginOpen(true);
      return;
    }
    wishlist.toggle({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images?.[0],
      price: product.price,
      mrp: product.mrp,
    });
    if (!isWishlisted) {
      onToast({ variant: 'wish', title: 'Saved', message: `${product.name} saved to your wishlist.` });
    }
  };

  /** Re-checks stock with the server first; never adds a sold-out size. */
  const handleAdd = async () => {
    if (adding) return;
    setAdding(true);
    let navigating = false;
    try {
      const fresh = (await onRefresh(product)) ?? product;
      if (sizeQty(fresh, size) <= 0) {
        soldOutToast(fresh, size);
        return;
      }
      const rawVariants: any[] = Array.isArray(fresh.variants) ? fresh.variants : [];
      const v = rawVariants.find(
        (x) =>
          String(x.size ?? '').trim().toUpperCase() === size &&
          Number(x.inventory ?? x.stock ?? 0) > 0 &&
          x.id
      );
      if (!v && rawVariants.length > 0) {
        soldOutToast(fresh, size);
        return;
      }
      const added = await addItem({
        productId: fresh.id,
        variantId: v?.id,
        slug: fresh.slug,
        name: fresh.name,
        image: fresh.images?.[0],
        size: v?.size ?? size,
        color: v?.color,
        price: fresh.price,
        mrp: fresh.mrp,
      });
      if (!added) return;
      setPanelOpen(false);
      // Keep `adding` set while navigating so the button can't fire twice.
      navigating = true;
      router.push('/cart');
    } finally {
      if (!navigating) setAdding(false);
    }
  };

  return (
    <article
      className={cn(
        'kv-rise group relative flex min-w-0 rounded-[18px] p-2 transition-all duration-500 [transition-timing-function:var(--kv-ease)] kv-panel',
        'hover:-translate-y-1.5 hover:border-[#d2d2d7]/50 hover:shadow-[0_0_0_1px_rgba(210,210,215,.35),0_26px_50px_-20px_rgba(210,210,215,.28)] focus-within:border-[#d2d2d7]/50',
        view === 'list' ? 'flex-row gap-4 sm:gap-5' : 'flex-col'
      )}
      style={{ ['--i' as string]: Math.min(index, 8) }}
    >
      <div
        className={cn(
          'relative aspect-[4/5] overflow-hidden rounded-[14px] bg-[#0d0d0f]',
          view === 'list' ? 'w-[42%] max-w-[260px] shrink-0' : 'w-full'
        )}
      >
        <Link href={href} aria-label={product.name} className="block h-full w-full">
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className={cn(
                'h-full w-full object-cover transition-transform duration-700 [transition-timing-function:var(--kv-ease)] group-hover:scale-[1.05]',
                unavailable && 'opacity-45 grayscale'
              )}
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col items-start gap-1.5">
          {pct > 0 && (
            <span className="rounded-md border border-[#6FD3A0]/45 bg-[#06150e]/80 px-1.5 py-0.5 text-[10px] font-extrabold text-[#6FD3A0] backdrop-blur-sm">
              −{pct}%
            </span>
          )}
          {tag && (
            <span
              className={cn(
                'rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] backdrop-blur-sm',
                tag === 'NEW DROP'
                  ? 'border-[#7DB7FF]/45 bg-[#07111f]/80 text-[#7DB7FF]'
                  : tag === 'BESTSELLER'
                    ? 'border-[#F2B45A]/45 bg-[#1c1204]/80 text-[#F2B45A]'
                    : 'border-white/25 bg-black/65 text-[#f4f2ec]'
              )}
            >
              {tag}
            </span>
          )}
          {lowBadge && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-400/45 bg-[#1c0e04]/85 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#fdba74] backdrop-blur-sm">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              Only {basisQty} left
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
          className="absolute right-1.5 top-1.5 z-20 flex h-11 w-11 items-center justify-center rounded-full transition active:scale-95"
        >
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition',
              isWishlisted
                ? 'border-white bg-white/20 text-white'
                : 'border-white/25 bg-black/45 text-white hover:border-[#d2d2d7]'
            )}
          >
            <Heart className={cn('h-4 w-4', isWishlisted && 'fill-white')} />
          </span>
        </button>

        {unavailable && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <span
              className="rounded-[10px] border border-[#E0524A]/50 px-3.5 py-2 text-center text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#f08a83] backdrop-blur-md"
              style={{
                background: 'linear-gradient(135deg, rgba(224,82,74,.28), rgba(36,10,10,.82))',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.2)',
              }}
            >
              Out of stock
              {soldOutInFocus && (
                <span className="mt-0.5 block text-[9px] tracking-[0.16em]">in {focusSizes.join(', ')}</span>
              )}
            </span>
          </div>
        )}

        {fullySoldOut ? (
          <button
            type="button"
            onClick={() => notify()}
            className="absolute inset-x-2 bottom-2 z-20 h-11 rounded-full border border-white/25 bg-black/60 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#f4f2ec] backdrop-blur-md transition hover:border-[#d2d2d7] hover:text-[#d2d2d7]"
          >
            Notify me
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setPanelOpen((o) => !o)}
              aria-expanded={panelOpen}
              aria-label={`Quick add ${product.name} to bag`}
              className="absolute bottom-1.5 right-1.5 z-10 flex h-11 w-11 items-center justify-center rounded-full transition active:scale-95"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/45 text-[#d2d2d7] backdrop-blur-md transition hover:bg-[#d2d2d7] hover:text-[#0c0c0e]">
                <ShoppingBag className="h-4 w-4" />
              </span>
            </button>

            {/* quick-add panel: hover/focus on desktop, tap on mobile */}
            {view === 'grid' && (
              <div
                className={cn(
                  'absolute inset-x-2 bottom-2 z-30 rounded-[12px] border border-white/20 bg-black/70 p-2.5 backdrop-blur-xl transition duration-300 [transition-timing-function:var(--kv-ease)]',
                  panelOpen
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-3 opacity-0 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 lg:group-hover:pointer-events-auto lg:group-hover:translate-y-0 lg:group-hover:opacity-100'
                )}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#BDB9B0]">Quick add</p>
                  <button
                    type="button"
                    aria-label="Close quick add"
                    onClick={() => setPanelOpen(false)}
                    className="-m-3 flex h-11 w-11 items-center justify-center text-[#BDB9B0] lg:hidden"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mb-1.5 flex flex-wrap justify-center gap-1.5" role="group" aria-label="Choose size">
                  {sizes.map((s) => {
                    const q = sizeQty(product, s);
                    const st = stateOfQty(q);
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={size === s}
                        aria-disabled={st === 'out'}
                        aria-label={st === 'out' ? `${s}, sold out` : st === 'low' ? `${s}, low stock, ${q} left` : s}
                        onClick={() => pickSize(s)}
                        className={cn(
                          'relative h-11 min-w-[44px] rounded-md border px-1.5 text-[11px] font-bold transition lg:h-9 lg:min-w-[36px]',
                          size === s
                            ? 'border-white bg-white text-[#121214]'
                            : st === 'low'
                              ? 'border-amber-400/70 text-[#f4f2ec] hover:border-amber-300'
                              : 'border-white/25 text-[#f4f2ec] hover:border-[#d2d2d7]',
                          st === 'out' && size !== s && 'border-dashed text-white/55 line-through'
                        )}
                      >
                        {s}
                        {st === 'low' && (
                          <span aria-hidden className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="mb-2 min-h-[14px] text-center text-[10px] leading-tight text-[#f2d5a0]" aria-live="polite">
                  {hint || 'All sizes in stock'}
                </p>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={adding}
                  className="kv-chrome-bg kv-sheen h-11 w-full rounded-full text-[11px] font-extrabold uppercase tracking-[0.16em] transition hover:brightness-110 disabled:opacity-70"
                >
                  {adding ? 'Checking stock…' : 'Add to bag'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className={cn('flex min-w-0 flex-col gap-1 px-1 pb-1 pt-2.5', view === 'list' && 'justify-center')}>
        <Link
          href={href}
          title={product.name}
          className="line-clamp-1 text-[13px] font-semibold text-[#f4f2ec] transition hover:text-[#d2d2d7] sm:text-[14px]"
        >
          {product.name}
        </Link>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className={cn('text-[16px] font-extrabold', unavailable ? 'text-[#A8A49B]' : 'text-[#f4f2ec]')}>
            {formatINR(price)}
          </span>
          {mrp && <span className="text-[12px] text-[#A8A49B] line-through">{formatINR(mrp)}</span>}
        </div>
        <div className="flex min-h-[20px] flex-wrap items-center justify-between gap-x-2 gap-y-1">
          {showBestPrice ? (
            <p className="text-[12px] font-semibold text-[#E7C873]">Best Price: {formatINR(bestPrice)}</p>
          ) : (
            <span />
          )}
          <ColorDots colors={colors} status={colorStatus} onRetry={() => onRetryColors(product)} />
        </div>
        {view === 'list' && product.description && (
          <p className="mt-1 line-clamp-3 hidden text-[13px] leading-relaxed text-[#BDB9B0] sm:block">
            {product.description}
          </p>
        )}
      </div>
      <WishlistLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </article>
  );
}
