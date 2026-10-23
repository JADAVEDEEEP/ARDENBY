'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { createPortal } from 'react-dom';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { motion } from 'framer-motion';

import { Heart, Star, ShoppingCart, X } from 'lucide-react';

import type { Product } from '@/types';

import { useWishlistStore } from '@/store/wishlist-store';

import { useCartStore } from '@/store/cart-store';

import { formatINR, discountPercent } from '@/lib/format';

import { cn } from '@/lib/utils';

import { toast } from 'sonner';

/* ------------------------------------------------------------------
   CONFIG
   - LOGIN_ROUTE / REGISTER_ROUTE: set these to your real auth routes.
   - LOW_STOCK_THRESHOLD: a variant with 1..THRESHOLD units shows
     "Only X left in stock". The quantity itself always comes from data.
------------------------------------------------------------------- */
const LOGIN_ROUTE = '/login';
const REGISTER_ROUTE = '/register';
const LOW_STOCK_THRESHOLD = 10;

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

/* Swatch colours for display only. Unknown colours fall back to a neutral
   swatch (the colour name is still shown via title / aria-label). */
const COLOR_HEX: Record<string, string> = {
  black: '#111111',
  white: '#FFFFFF',
  beige: '#D8C3A5',
  olive: '#6B705C',
  navy: '#1a2540',
  'royal blue': '#1e40d4',
  'sky blue': '#87CEEB',
  lilac: '#C8A2C8',
  red: '#DC2626',
  green: '#16a34a',
  'dark green': '#0f4d33',
  emerald: '#0e6d4c',
  grey: '#6b7280',
  gray: '#6b7280',
  brown: '#6f4e37',
  cream: '#F2E8D5',
  maroon: '#6d1f2c',
};

type VariantOf = NonNullable<Product['variants']>[number];

/* Optional extra fields a variant MAY carry. All are read defensively. */
type VariantExtras = {
  price?: number | string | null;
  image?: string | null;
  image_url?: string | null;
  images?: (string | { image_url?: string | null })[] | null;
};

interface ProductCardProps {
  product: Product;
  index?: number;
  /** Flat, editorial layout used on the homepage grids. */
  compact?: boolean;
}

/* ---------------------------- helpers ---------------------------- */

function toQty(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function getVariantImage(variant?: VariantOf): string | undefined {
  if (!variant) return undefined;
  const extra = variant as unknown as VariantExtras;
  if (extra.image_url) return extra.image_url;
  if (extra.image) return extra.image;
  const first = Array.isArray(extra.images) ? extra.images[0] : undefined;
  if (typeof first === 'string' && first) return first;
  if (first && typeof first === 'object' && first.image_url) {
    return first.image_url;
  }
  return undefined;
}

function getVariantPrice(variant: VariantOf | undefined, fallback: number) {
  if (!variant) return fallback;
  const n = Number((variant as unknown as VariantExtras).price);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function colorToHex(name: string): string {
  return COLOR_HEX[name.trim().toLowerCase()] ?? '#4b5b52';
}

/* ------------------- login-required wishlist modal ------------------- */

export function WishlistLoginModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descId = useId();

  onCloseRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !mounted) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const getFocusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        ) ?? []
      );

    getFocusable()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab') {
        const items = getFocusable();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, mounted]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-[420px] overflow-hidden rounded-2xl border border-[#C9A24B]/30 bg-[linear-gradient(145deg,#1b1b1b_0%,#070707_38%,#161616_62%,#050505_100%)] px-6 pb-8 pt-10 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.12)] sm:px-8"
      >
        {/* animated cosmos: stars, planet, orbital rings (decorative only) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div
            className="kv-twinkle absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                'radial-gradient(1px 1px at 12% 18%,#fff 50%,transparent 51%),radial-gradient(1.5px 1.5px at 30% 70%,#fff 50%,transparent 51%),radial-gradient(1px 1px at 58% 14%,rgba(255,255,255,.8) 50%,transparent 51%),radial-gradient(1px 1px at 78% 62%,#fff 50%,transparent 51%),radial-gradient(1.5px 1.5px at 90% 28%,rgba(255,255,255,.8) 50%,transparent 51%),radial-gradient(1px 1px at 20% 92%,rgba(255,255,255,.7) 50%,transparent 51%)',
            }}
          />
          <div className="absolute -right-16 -top-16 h-44 w-44">
            <div className="absolute inset-[22%] rounded-full bg-[radial-gradient(circle_at_32%_28%,#7d7d7d,#2a2a2a_55%,#0a0a0a_100%)] shadow-[0_0_30px_rgba(201,162,75,0.18)]" />
            <div className="absolute inset-0 rotate-[-18deg]">
              <div
                className="kv-orbit h-full w-full rounded-full border border-[#F0DC9A]/45"
                style={{ ['--kv-d' as string]: '28s', transform: 'scaleY(0.38)' }}
              />
            </div>
            <div className="absolute inset-[-12%] rotate-[14deg]">
              <div
                className="kv-orbit h-full w-full rounded-[50%] border border-white/20"
                style={{ ['--kv-d' as string]: '44s' }}
              >
                <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F0DC9A] shadow-[0_0_10px_3px_rgba(240,220,154,0.7)]" />
              </div>
            </div>
          </div>
          <div className="kv-float absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_35%_30%,#5a5a5a,#161616_60%,#050505)] opacity-80" />
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent" />
        </div>

        <div className="relative">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#C9A24B]/60 bg-black shadow-[0_0_24px_rgba(201,162,75,0.2)]">
            <Heart className="h-6 w-6 text-[#E3C673]" />
          </span>

          <h2
            id={titleId}
            className="font-serif text-[24px] font-bold leading-tight text-white sm:text-[26px]"
          >
            Sign in to save your favourites
          </h2>

          <p
            id={descId}
            className="mx-auto mt-3 max-w-[320px] text-[15px] leading-relaxed text-white/80"
          >
            Keep the pieces you love in one place, come back to them on any
            device, and never lose track of a drop you want.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C9A24B]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>,
    document.body
  );
}

/* ----------------------------- card ----------------------------- */

export function ProductCard({
  product,
  index = 0,
  compact = false,
}: ProductCardProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const wishlist = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const [addStatus, setAddStatus] = useState<'idle' | 'adding' | 'added'>('idle');

  const isWishlisted = wishlist.has(product.id);

  const closeLoginModal = useCallback(() => setLoginModalOpen(false), []);

  /* ---------- variants (real data only) ---------- */
  const variants = useMemo<VariantOf[]>(
    () => (Array.isArray(product.variants) ? product.variants : []),
    [product.variants]
  );

  const colors = useMemo(
    () =>
      Array.from(
        new Set(
          variants
            .map((v) => v.color as string | undefined)
            .filter((c): c is string => Boolean(c))
        )
      ),
    [variants]
  );

  const sizes = useMemo(() => {
    const list = Array.from(
      new Set(
        variants
          .map((v) => v.size as string | undefined)
          .filter((s): s is string => Boolean(s))
      )
    );
    return list.sort((a, b) => {
      const ai = SIZE_ORDER.indexOf(a);
      const bi = SIZE_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [variants]);

  const initialVariant =
    variants.find((v) => toQty(v.inventory) > 0) ?? variants[0];

  const [selectedColor, setSelectedColor] = useState<string | null>(
    (initialVariant?.color as string | undefined) ?? null
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    (initialVariant?.size as string | undefined) ?? null
  );

  const selectedVariant = variants.find(
    (v) =>
      ((v.color as string | undefined) ?? null) === selectedColor &&
      ((v.size as string | undefined) ?? null) === selectedSize
  );

  const isColorAvailable = (color: string) =>
    variants.some((v) => v.color === color && toQty(v.inventory) > 0);

  const isSizeAvailable = (size: string) =>
    variants.some(
      (v) =>
        v.size === size &&
        (colors.length === 0 || v.color === selectedColor) &&
        toQty(v.inventory) > 0
    );

  const handleSelectColor = (color: string) => {
    if (!isColorAvailable(color)) return;

    const forColor = variants.filter((v) => v.color === color);
    const keepSize = forColor.find(
      (v) => v.size === selectedSize && toQty(v.inventory) > 0
    );
    const nextVariant =
      keepSize ?? forColor.find((v) => toQty(v.inventory) > 0) ?? forColor[0];

    setSelectedColor(color);
    setSelectedSize((nextVariant?.size as string | undefined) ?? null);
  };

  const handleSelectSize = (size: string) => {
    if (!isSizeAvailable(size)) return;
    setSelectedSize(size);
  };

  /* ---------- stock ---------- */
  const hasVariants = variants.length > 0;

  const qty = hasVariants
    ? toQty(selectedVariant?.inventory)
    : toQty((product as unknown as { inventory?: unknown }).inventory);

  const productInStock = hasVariants
    ? variants.some((v) => toQty(v.inventory) > 0)
    : qty > 0;

  const stockState: 'out' | 'low' | 'in' =
    !productInStock || qty <= 0
      ? 'out'
      : qty <= LOW_STOCK_THRESHOLD
        ? 'low'
        : 'in';

  const canAddToCart = Boolean(selectedVariant?.id) && qty > 0;

  /* ---------- pricing ---------- */
  const price = getVariantPrice(selectedVariant, product.price);
  const discountPct = discountPercent(product.mrp, price);
  const hasDiscount = discountPct > 0;
  const bestPrice = Number(product.bestPrice || 0);
  const showBestPrice = bestPrice > 0 && bestPrice < price;

  /* ---------- images ---------- */
  const images: string[] = Array.isArray(product.images)
    ? product.images
    : [];
  const variantImage = getVariantImage(selectedVariant);
  const imageSrc =
    imgIndex === 0
      ? variantImage || images[0]
      : images[imgIndex] || variantImage || images[0];

  /* ---------- one primary badge ---------- */
  const productFlags = product as unknown as { newArrival?: boolean };
  const primaryBadge = product.limitedEdition
    ? { label: 'Limited', tone: 'gold' as const }
    : product.bestSeller
      ? { label: 'Bestseller', tone: 'gold' as const }
      : productFlags.newArrival
        ? { label: 'New', tone: 'emerald' as const }
        : null;

  const hasRating = Number(product.rating) > 0;

  /* ---------- handlers ---------- */
  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('ardenby_token')
        : null;

    // User is not logged in -> premium login-required modal
    if (!token) {
      setLoginModalOpen(true);
      return;
    }

    // User is logged in -> toggle wishlist (unchanged behaviour)
    wishlist.toggle({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      price: product.price,
      mrp: product.mrp,
    });

    toast.success(
      isWishlisted
        ? 'Removed from your favourites'
        : 'Added to your favourites ❤️',
      {
        duration: 2500,
      }
    );
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (addStatus !== 'idle') return;

    if (!selectedVariant?.id || qty <= 0) {
      toast.error('This option is currently unavailable.', {
        duration: 2500,
      });
      return;
    }

    setAddStatus('adding');
    const added = await addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      slug: product.slug,
      name: product.name,
      image: variantImage || product.images[0],
      size: selectedVariant.size,
      color: selectedVariant.color,
      price,
      mrp: product.mrp,
    });

    if (!added) {
      setAddStatus('idle');
      return;
    }

    setAddStatus('added');
    router.push('/cart');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{
          duration: 0.45,
          delay: (index % 4) * 0.04,
          ease: [0.16, 1, 0.3, 1],
        }}
        onMouseEnter={() => setImgIndex(1)}
        onMouseLeave={() => setImgIndex(0)}
        className={cn(
          'group relative flex w-full min-w-0 flex-col',
          compact
            ? 'h-auto rounded-2xl'
            : 'h-full overflow-hidden rounded-md border border-[#1b4a38] bg-gradient-to-b from-[#0a1812] to-[#07100b] shadow-[0_10px_30px_-18px_rgba(47,191,138,0.35)] transition-[border-color,box-shadow] duration-200 hover:border-[#2fbf8a] hover:shadow-[0_14px_34px_-16px_rgba(47,191,138,0.55)]'
        )}
      >
        {/* Image + overlays (wishlist is a sibling of the link, not nested) */}
        <div className="relative">
          <Link
            href={`/product/${product.slug}`}
            aria-label={product.name}
            className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2fbf8a]"
          >
            <div
              className={cn(
                'relative w-full overflow-hidden bg-[#0b1510]',
                compact ? 'aspect-[4/5] rounded-2xl' : 'aspect-[10/9]'
              )}
            >
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc}
                  alt={product.name}
                  className={cn(
                    'h-full w-full object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]',
                    stockState === 'out' && 'opacity-60 grayscale-[30%]'
                  )}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[#0b1510] to-[#102418]" />
              )}
            </div>
          </Link>

          {/* Single primary badge */}
          {compact && hasDiscount ? (
            <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-[#07180D]/75 px-2.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-wider text-[#F4F0E6] backdrop-blur-sm">
              {discountPct}% off
            </span>
          ) : primaryBadge && (
            <span
              className={cn(
                'pointer-events-none absolute left-1.5 top-1.5 z-10 max-w-[calc(100%-3rem)] truncate rounded-[3px] px-1.5 py-1 text-[10px] font-bold uppercase leading-none tracking-wider',
                primaryBadge.tone === 'gold'
                  ? 'bg-[#d8bd86] text-black'
                  : 'border border-[#5fe0ae] bg-[#0e6d4c] text-white'
              )}
            >
              {primaryBadge.label}
            </span>
          )}

          {/* Wishlist */}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={
              isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
            }
            aria-pressed={isWishlisted}
            className="absolute right-1.5 top-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#050a07]/70 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-[#d8bd86]/70 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d8bd86]"
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-all duration-300',
                isWishlisted
                  ? 'fill-rose-500 text-rose-500'
                  : 'text-[#f1f5f1]'
              )}
            />
          </button>
        </div>

        {/* Product information */}
        <div
          className={cn(
            'flex flex-1 flex-col',
            compact ? 'gap-1 px-0.5 pb-1 pt-3' : 'gap-1.5 p-2.5'
          )}
        >
          {/* Name */}
          <Link
            href={`/product/${product.slug}`}
            className="block focus:outline-none focus-visible:underline"
          >
            <h3
              title={product.name}
              className={cn(
                'line-clamp-1 text-[14px] font-medium leading-snug tracking-tight text-[#f1f5f1] transition-colors group-hover:text-[#6fe3b4] sm:text-[15px]',
                compact &&
                  'font-semibold uppercase tracking-[0.02em] group-hover:text-[#d8bd86]'
              )}
            >
              {product.name}
            </h3>
          </Link>

          {/* Price + cart button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="text-[16px] font-semibold leading-none tracking-tight text-white sm:text-[17px]">
                {formatINR(price)}
              </span>

              {hasDiscount && (
                <>
                  <span className="text-[12px] leading-none text-[#7f8d85] line-through">
                    {formatINR(product.mrp)}
                  </span>
                  {!compact && (
                    <span className="rounded-[3px] border border-[#2fbf8a]/50 bg-[#2fbf8a]/10 px-1.5 py-1 text-[11px] font-bold uppercase leading-none tracking-wide text-[#6fe3b4]">
                      {discountPct}% off
                    </span>
                  )}
                </>
              )}
            </div>

          </div>

          {showBestPrice && (
            <p className="text-[12px] font-medium text-[#d8bd86]">
              Best Price:{' '}
              <span className="font-semibold">{formatINR(bestPrice)}</span>
            </p>
          )}

          {/* Rating (only with real data) */}
          {hasRating && !compact && (
            <div className="flex items-center gap-1">
              <span className="flex items-center" aria-label={`Rated ${Number(product.rating).toFixed(1)} out of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn(
                      'h-3.5 w-3.5',
                      n <= Math.round(Number(product.rating))
                        ? 'fill-[#d8bd86] text-[#d8bd86]'
                        : 'text-[#d8bd86]/60'
                    )}
                  />
                ))}
              </span>
              {Number(product.reviewCount) > 0 && (
                <span className="text-[12px] text-[#98a69d]">
                  ({product.reviewCount})
                </span>
              )}
            </div>
          )}

          {/* Colour swatches (real variant colours only) */}
          {colors.length > 0 && (
            <div
              role="group"
              aria-label="Colour"
              className="-mx-0.5 flex flex-wrap items-center"
            >
              {colors.map((color) => {
                const available = isColorAvailable(color);
                const active = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectColor(color);
                    }}
                    disabled={!available}
                    title={available ? color : `${color} (sold out)`}
                    aria-label={available ? color : `${color}, sold out`}
                    aria-pressed={active}
                    className="flex h-6 w-6 items-center justify-center disabled:cursor-not-allowed"
                  >
                    <span
                      className={cn(
                        'relative block h-4 w-4 overflow-hidden rounded-full border border-white/25 transition-all',
                        active &&
                          'ring-2 ring-[#2fbf8a] ring-offset-1 ring-offset-[#0a1812]',
                        !available && 'opacity-40'
                      )}
                      style={{ backgroundColor: colorToHex(color) }}
                    >
                      {!available && (
                        <span className="absolute left-1/2 top-1/2 h-px w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white/80" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Sizes (real variant sizes only) + cart button */}
          <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-1.5 pt-1">
          {sizes.length > 0 ? (
            <div
              role="group"
              aria-label="Size"
              className="flex flex-wrap gap-1"
            >
              {sizes.map((size) => {
                const available = isSizeAvailable(size);
                const active = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectSize(size);
                    }}
                    disabled={!available}
                    aria-pressed={active}
                    aria-label={available ? `Size ${size}` : `Size ${size}, sold out`}
                    className={cn(
                      'h-7 min-w-[30px] rounded-[4px] border px-1.5 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed',
                      active
                        ? 'border-[#2fbf8a] bg-[#2fbf8a]/15 text-white'
                        : 'border-[#2c4a3d] text-[#d3dcd5] hover:border-[#2fbf8a]',
                      !available &&
                        'border-[#1f3329] text-[#5d6c63] line-through hover:border-[#1f3329]'
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          ) : (
            <span />
          )}
          {stockState === 'out' ? (
              <button
                type="button"
                disabled
                aria-label="Out of stock"
                title="Out of stock"
                className="flex h-9 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded-[5px] border border-[#2c4a3d] bg-[#0b1a12] text-[#7f8d85]"
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
            ) : canAddToCart ? (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addStatus !== 'idle'}
                aria-busy={addStatus === 'adding'}
                aria-label={addStatus === 'added' ? 'Added to cart' : 'Add to cart'}
                title={addStatus === 'added' ? 'Added' : 'Add to cart'}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] border border-[#d8bd86] bg-[#0a1812] text-[#d8bd86] transition hover:bg-[#d8bd86]/15 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8bd86]"
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
            ) : (
              /* In stock but no purchasable variant id (e.g. no variants):
                 send the shopper to the product page instead of failing. */
              <Link
                href={`/product/${product.slug}`}
                aria-label="View details"
                title="View details"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] border border-[#d8bd86]/70 text-[#e9d7ae] transition hover:bg-[#d8bd86]/10"
              >
                <ShoppingCart className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Stock status (only when it needs attention) */}
          {stockState !== 'in' && (
            <p
              className={cn(
                'flex items-center gap-1.5 text-[12px] font-medium leading-tight',
                stockState === 'out' && 'text-[#ff8a7a]',
                stockState === 'low' && 'text-[#ffb36b]'
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full',
                  stockState === 'out' && 'bg-[#ff5d4a]',
                  stockState === 'low' && 'bg-[#ff9a3c]'
                )}
              />
              <span>
                {stockState === 'out' ? 'Out of Stock' : `Only ${qty} left in stock`}
              </span>
            </p>
          )}
        </div>
      </motion.div>

      <WishlistLoginModal open={loginModalOpen} onClose={closeLoginModal} />
    </>
  );
}