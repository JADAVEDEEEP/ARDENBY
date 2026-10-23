'use client';

import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { Heart } from 'lucide-react';

import { WishlistLoginModal } from '@/components/product/product-card';
import { useFinePointer } from '@/hooks/use-fine-pointer';
import { useWishlistToggle } from '@/hooks/use-wishlist-toggle';
import { discountPercent, formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

import { PRODUCT_FALLBACK_IMAGE } from './home-assets';
import { ProductImage } from './ui/ProductImage';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

const ProductQuickView360 = dynamic(
  () => import('./ProductQuickView360').then((m) => m.ProductQuickView360),
  { ssr: false }
);

const MAX_TILT_DEG = 10;

function FeaturedCard({ product, raised }: { product: Product; raised: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const quickRef = useRef<HTMLButtonElement>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickLoaded, setQuickLoaded] = useState(false);
  const fine = useFinePointer();
  const { isWishlisted, toggle, loginModalOpen, closeLoginModal } =
    useWishlistToggle(product);

  const front = product.images?.[0] || PRODUCT_FALLBACK_IMAGE;
  const back = product.images?.[1] || front;
  const price = Number(product.price) || 0;
  const mrp = Number(product.mrp) || 0;
  const bestPrice = Number(product.bestPrice) || 0;
  const discount = mrp > price ? discountPercent(mrp, price) : 0;

  const handleMove = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!fine || !el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * MAX_TILT_DEG * 2}deg) rotateY(${(px - 0.5) * MAX_TILT_DEG * 2}deg)`;
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <article
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={cn(
        'group w-[78vw] max-w-[360px] shrink-0 snap-center transition-transform duration-200 ease-out sm:w-auto sm:max-w-none',
        raised && 'md:-mt-5'
      )}
    >
      <div className="chrome-glass relative aspect-[4/5] overflow-hidden rounded-2xl bg-[radial-gradient(70%_45%_at_50%_88%,rgba(255,255,255,0.14),transparent_70%)] transition-[border-color,box-shadow] duration-300 group-hover:border-white/60 group-hover:shadow-[0_34px_70px_-26px_rgba(255,255,255,0.22)]">
        {/* Cursor light + continuous sweep */}
        {fine && <span aria-hidden="true" className="kv-spot pointer-events-none absolute inset-0 z-[1]" />}
        <span
          aria-hidden="true"
          className="kv-card-sweep pointer-events-none absolute inset-y-0 -left-1/2 z-[2] w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)]"
        />

        {/* Dashed orbit + 360 hint */}
        <svg
          aria-hidden="true"
          viewBox="0 0 200 60"
          className="pointer-events-none absolute inset-x-[6%] bottom-[10%] w-[88%]"
          fill="none"
        >
          <ellipse
            cx="100"
            cy="30"
            rx="96"
            ry="22"
            stroke="rgba(255,255,255,0.35)"
            strokeDasharray="3 5"
          />
        </svg>
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
          className="chrome-focus absolute bottom-[6%] left-1/2 z-[6] min-h-[36px] -translate-x-1/2 whitespace-nowrap rounded-full border border-white/25 bg-black/50 px-4 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-kv-head backdrop-blur transition hover:border-white/70 hover:text-white"
        >
          Quick view · 360°
        </button>

        {/* Chrome floor plinth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[12%] bottom-[11%] h-[7%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.45),rgba(255,255,255,0.06)_65%,transparent)]"
        />

        {/* Front / back faces: flip on hover (fine pointers) */}
        <div className={cn('absolute inset-x-[4%] bottom-[16%] top-[8%]', fine && 'kv-flip')}>
          <div className="kv-flip-inner relative h-full w-full">
            <div className="kv-face">
              <ProductImage
                src={front}
                alt={product.name}
                sizes="(min-width: 640px) 30vw, 78vw"
              />
            </div>
            <div className={cn('kv-face', fine && 'kv-face-back')}>
              {fine && <ProductImage src={back} alt="" sizes="(min-width: 640px) 30vw, 78vw" />}
            </div>
          </div>
        </div>
        <Link
          href={`/product/${product.slug}`}
          aria-label={product.name}
          className="chrome-focus absolute inset-0 z-[3] block"
        />

        {discount > 0 && (
          <span className="pointer-events-none absolute left-3 top-3 z-[4] rounded-full border border-white/30 bg-gradient-to-b from-white/30 to-white/10 px-2.5 py-1 text-[10px] font-bold uppercase leading-none tracking-wider text-kv-head">
            {discount}% off
          </span>
        )}

        <button
          type="button"
          onClick={toggle}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
          className="chrome-focus chrome-glass absolute right-3 top-3 z-[5] flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-colors',
              isWishlisted ? 'fill-rose-400 text-rose-400' : 'text-kv-head'
            )}
          />
        </button>
      </div>

      <div className="px-1 pt-4">
        <Link href={`/product/${product.slug}`} className="chrome-focus block">
          <h3
            title={product.name}
            className="truncate text-[12px] font-semibold uppercase tracking-[0.06em] text-kv-head"
          >
            {product.name}
          </h3>
        </Link>
        <div className="mt-1.5 flex items-baseline gap-2.5">
          <span className="text-[18px] font-bold text-white">{formatINR(price)}</span>
          {mrp > price && (
            <span className="text-[12px] text-kv-muted line-through">{formatINR(mrp)}</span>
          )}
        </div>
        {bestPrice > 0 && bestPrice < price && (
          <p className="mt-1 text-[12px] text-kv-muted">
            Best Price <span className="font-semibold text-kv-head">{formatINR(bestPrice)}</span>
          </p>
        )}
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
    </article>
  );
}

/** Three large cards. Desktop: grid with a raised middle card. Mobile: snap carousel. */
export function FeaturedProducts({ featured }: { featured: Product[] }) {
  return (
    <section
      aria-label="Featured products"
      className="bg-kv-bg px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        <Reveal>
          <SectionHeading
            eyebrow="Handpicked for you"
            title="Our featured products"
            href="/shop"
          />
        </Reveal>

        <div className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0">
          {featured.map((product, index) => (
            <FeaturedCard key={product.id || index} product={product} raised={index === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
