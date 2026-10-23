'use client';

import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { Heart } from 'lucide-react';

import { WishlistLoginModal } from '@/components/product/product-card';
import { useFinePointer } from '@/hooks/use-fine-pointer';
import { useWishlistToggle } from '@/hooks/use-wishlist-toggle';
import { cn } from '@/lib/utils';

import { ProductImage } from './ProductImage';
import { discountPercent, formatINR } from '@/lib/format';
import type { Product } from '@/types';

const ProductQuickView360 = dynamic(
  () => import('../ProductQuickView360').then((m) => m.ProductQuickView360),
  { ssr: false }
);

const MAX_TILT_DEG = 10;

interface HomeProductCardProps {
  product: Product;
  /** Responsive `sizes` hint for next/image. */
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/** Chrome-theme product card: plinth background, silver chip, glass wishlist,
 *  and (fine pointers only) 3D tilt + light sweep + QUICK VIEW bar. */
export function HomeProductCard({
  product,
  sizes = '(min-width: 1280px) 16vw, (min-width: 768px) 33vw, 50vw',
  priority = false,
  className,
}: HomeProductCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLButtonElement>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickLoaded, setQuickLoaded] = useState(false);
  const fine = useFinePointer();
  const { isWishlisted, toggle, loginModalOpen, closeLoginModal } =
    useWishlistToggle(product);

  const image = product.images?.[0];
  const price = Number(product.price) || 0;
  const mrp = Number(product.mrp) || 0;
  const bestPrice = Number(product.bestPrice) || 0;
  const discount = mrp > price ? discountPercent(mrp, price) : 0;
  const showBestPrice = bestPrice > 0 && bestPrice < price;

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!fine || !el) return;

    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * MAX_TILT_DEG * 2}deg) rotateY(${(px - 0.5) * MAX_TILT_DEG * 2}deg) translateZ(0)`;
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <>
      <div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        className={cn(
          'group relative flex min-w-0 flex-col transition-transform duration-200 ease-out',
          className
        )}
      >
        <div className="relative aspect-[4/4.6] overflow-hidden rounded-[14px] border border-white/[0.14] bg-[radial-gradient(70%_50%_at_50%_92%,rgba(255,255,255,0.1),transparent_70%),linear-gradient(180deg,#1c1e22_0%,#0b0c0e_100%)] shadow-[0_20px_40px_-24px_rgba(0,0,0,0.9)] transition-[border-color,box-shadow] duration-300 group-hover:border-white/60 group-hover:shadow-[0_30px_60px_-24px_rgba(255,255,255,0.18)]">
          {/* Soft white floor glow + plinth edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[8%] bottom-[5%] h-[16%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.4),rgba(255,255,255,0.08)_60%,transparent)]"
          />

          {/* Cursor-following light */}
          {fine && (
            <span aria-hidden="true" className="kv-spot pointer-events-none absolute inset-0 z-[1]" />
          )}

          <Link
            href={`/product/${product.slug}`}
            aria-label={product.name}
            className="chrome-focus absolute inset-0 block"
          >
            {image ? (
              <ProductImage
                src={image}
                alt={product.name}
                sizes={sizes}
                priority={priority}
                className="transition-transform duration-700 group-hover:scale-[1.06]"
              />
            ) : null}
          </Link>

          {/* Light sweep (fine pointers) */}
          {fine && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 z-[2] -left-1/2 w-1/2 -translate-x-full skew-x-[-18deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] transition-transform [transition-duration:900ms] ease-out group-hover:translate-x-[320%]"
            />
          )}

          {discount > 0 && (
            <span className="pointer-events-none absolute left-2 top-2 rounded-full border border-white/30 bg-gradient-to-b from-white/30 to-white/10 px-2 py-1 text-[9px] font-bold uppercase leading-none tracking-wider text-kv-head backdrop-blur-sm">
              {discount}% off
            </span>
          )}

          {/* 44px hit area (visual 32px) so a near-miss never falls through to the card link */}
          <button
            type="button"
            onClick={toggle}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={isWishlisted}
            className="chrome-focus group/heart absolute right-0 top-0 z-10 flex h-11 w-11 items-center justify-center rounded-full"
          >
            <span className="chrome-glass flex h-8 w-8 items-center justify-center rounded-full transition-transform group-hover/heart:scale-105 group-active/heart:scale-95">
              <Heart
                className={cn(
                  'h-3.5 w-3.5 transition-colors',
                  isWishlisted ? 'fill-rose-400 text-rose-400' : 'text-kv-head'
                )}
              />
            </span>
          </button>

          {/* Opens the 360 quick view. A real button: never navigates. */}
          <button
            ref={quickRef}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickLoaded(true);
              setQuickOpen(true);
            }}
            aria-haspopup="dialog"
            aria-label={`Quick view 360 degrees: ${product.name}`}
            className={cn(
              'chrome-focus chrome-glass absolute inset-x-2 bottom-2 z-[6] min-h-[30px] rounded-full py-1.5 text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-kv-head transition-all duration-300 focus-visible:translate-y-0 focus-visible:opacity-100 hover:border-white/60 hover:text-white',
              fine
                ? 'translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
                : 'opacity-90'
            )}
          >
            Quick view · 360°
          </button>
        </div>

        <div className="px-0.5 pt-3">
          <Link
            href={`/product/${product.slug}`}
            className="chrome-focus block"
          >
            <h3
              title={product.name}
              className="truncate text-[11px] font-semibold uppercase tracking-[0.04em] text-kv-head sm:text-[12px]"
            >
              {product.name}
            </h3>
          </Link>

          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[15px] font-bold leading-none text-white">
              {formatINR(price)}
            </span>
            {mrp > price && (
              <span className="text-[11px] leading-none text-kv-muted line-through">
                {formatINR(mrp)}
              </span>
            )}
          </div>

          {showBestPrice && (
            <p className="mt-1 text-[11px] text-kv-muted">
              Best Price{' '}
              <span className="font-semibold text-kv-head">
                {formatINR(bestPrice)}
              </span>
            </p>
          )}
        </div>
      </div>

      {quickLoaded && (
        <ProductQuickView360
          product={product}
          open={quickOpen}
          onClose={() => setQuickOpen(false)}
          returnFocusRef={quickRef}
        />
      )}
      <WishlistLoginModal open={loginModalOpen} onClose={closeLoginModal} />
    </>
  );
}
