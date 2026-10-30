'use client';

import Link from 'next/link';

import { Heart } from 'lucide-react';

import { WishlistLoginModal } from '@/components/product/product-card';
import { RatingLink } from '@/components/product/rating-link';
import { useWishlistToggle } from '@/hooks/use-wishlist-toggle';
import { discountPercent, formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

import { PRODUCT_FALLBACK_IMAGE } from './home-assets';
import { SafeImage } from './ui/SafeImage';

interface ProductCardProps {
  product: Product;
  /** `arrival`: fit label + ribbon. `grid`: gold % OFF badge + best price. */
  variant?: 'arrival' | 'grid';
  priority?: boolean;
  className?: string;
}

/** Only fits a shopper would recognise as a label are shown. */
const FIT_LABEL: Record<string, string> = {
  Oversized: 'Oversized fit',
  Regular: 'Regular fit',
};

/** Ribbon text comes from the product itself: the limited flag, else the fabric. */
function ribbonText(product: Product): string {
  if (product.limitedEdition) return 'Limited drop';
  return String(product.fabric || '').trim();
}

export function ProductCard({ product, variant = 'arrival', priority = false, className }: ProductCardProps) {
  const { isWishlisted, toggle, loginModalOpen, closeLoginModal } = useWishlistToggle(product);

  const image = product.images?.[0] || PRODUCT_FALLBACK_IMAGE;
  const hoverImage = product.images?.[1];
  const price = Number(product.price) || 0;
  const mrp = Number(product.mrp) || 0;
  const bestPrice = Number(product.bestPrice) || 0;
  const onSale = mrp > price && price > 0;
  const discount = onSale ? discountPercent(mrp, price) : 0;
  const fit = FIT_LABEL[product.fit];
  const ribbon = ribbonText(product);
  const grid = variant === 'grid';

  return (
    <>
      <article className={cn('group relative flex h-full min-w-0 flex-col', className)}>
        <div className="relative aspect-[3/4] overflow-hidden bg-kv-img">
          <Link href={`/product/${product.slug}`} aria-label={product.name} className="absolute inset-0 block">
            <SafeImage
              src={image}
              fallback={PRODUCT_FALLBACK_IMAGE}
              alt={product.name}
              fill
              sizes="(min-width: 1600px) 20vw, (min-width: 768px) 25vw, 160px"
              priority={priority}
              draggable={false}
              className={cn(
                'object-cover object-top transition duration-300',
                hoverImage ? 'md:group-hover:opacity-0' : 'md:group-hover:scale-105'
              )}
            />
            {hoverImage && (
              <SafeImage
                src={hoverImage}
                fallback={image}
                alt=""
                fill
                sizes="(min-width: 1600px) 20vw, 25vw"
                draggable={false}
                className="hidden object-cover object-top opacity-0 transition duration-300 md:block md:group-hover:opacity-100"
              />
            )}
          </Link>

          {grid && discount > 0 && (
            <span className="pointer-events-none absolute left-0 top-3 bg-kv-gold px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.06em] text-white">
              {discount}% off
            </span>
          )}
          {!grid && fit && (
            <span className="pointer-events-none absolute left-0 top-3 bg-kv-bg px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-kv-ink">
              {fit}
            </span>
          )}

          <button
            type="button"
            onClick={toggle}
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={isWishlisted}
            className="absolute right-0 top-0 z-10 flex h-12 w-12 items-center justify-center"
          >
            <Heart
              className={cn('h-6 w-6 transition-colors', isWishlisted ? 'fill-kv-gold text-kv-gold' : 'text-kv-ink')}
              strokeWidth={1.8}
            />
          </button>

          {!grid && ribbon && (
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-kv-ink px-2 py-2 text-center text-[12px] font-bold uppercase tracking-[0.1em] text-white">
              {ribbon}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col pt-3.5">
          <p className="mb-1 text-[12px] font-bold uppercase tracking-[0.24em] text-kv-gold-text">Kovenik</p>
          <Link href={`/product/${product.slug}`} className="block transition-colors hover:text-kv-gold-text">
            <h3 title={product.name} className="line-clamp-2 text-[14px] font-semibold leading-[1.35] text-kv-ink md:text-[16px]">
              {product.name}
            </h3>
          </Link>
          {product.categoryLabel && (
            <p className="mt-1 line-clamp-1 text-[13px] leading-5 text-kv-sub md:text-[14px]">{product.categoryLabel}</p>
          )}

          <RatingLink slug={product.slug} rating={product.rating} reviewCount={product.reviewCount} className="mt-1" />

          <div className="mt-auto flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 pt-2 md:gap-x-2.5">
            <span className="text-[16px] font-bold leading-6 text-kv-ink md:text-[18px]">{formatINR(price)}</span>
            {onSale && (
              <>
                <span className="text-[12px] leading-6 text-kv-sub line-through md:text-[14px]">{formatINR(mrp)}</span>
                {!grid && <span className="text-[12px] font-bold uppercase leading-6 text-kv-gold-text md:text-[14px]">{discount}% off</span>}
              </>
            )}
          </div>

          {grid && bestPrice > 0 && bestPrice < price && (
            <p className="mt-1 text-[14px] font-bold text-kv-gold-text">Best price {formatINR(bestPrice)}</p>
          )}
        </div>
      </article>

      <WishlistLoginModal open={loginModalOpen} onClose={closeLoginModal} />
    </>
  );
}
