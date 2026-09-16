'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Star, Plus } from 'lucide-react';

import type { Product } from '@/types';
import { useWishlistStore } from '@/store/wishlist-store';
import { useCartStore } from '@/store/cart-store';
import { formatINR, discountPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({
  product,
  index = 0,
}: ProductCardProps) {
  const [imgIndex, setImgIndex] = useState(0);

  const wishlist = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);

  const isWishlisted = wishlist.has(product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
        ? 'Removed from wishlist'
        : 'Added to wishlist'
    );
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      size: 'M',
      color: product.colors[0],
      price: product.price,
      mrp: product.mrp,
    });

    toast.success(`${product.name} added to cart`);
  };

  const hasDiscount =
    discountPercent(product.mrp, product.price) > 0;

  return (
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
      className="group relative flex w-full flex-col bg-transparent"
    >
      <Link
        href={`/product/${product.slug}`}
        className="block w-full focus:outline-none"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-neutral-100">
          {/* Product Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              product.images[imgIndex] ||
              product.images[0]
            }
            alt={product.name}
            className="h-full w-full object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          />

          {/* Badges */}
          <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1">
            {hasDiscount && (
              <span className="rounded-[2px] bg-neutral-900/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                -{discountPercent(product.mrp, product.price)}%
              </span>
            )}

            {product.limitedEdition && (
              <span className="rounded-[2px] bg-stone-900/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-200 backdrop-blur-md">
                Limited Drop
              </span>
            )}

            {product.bestSeller && (
              <span className="rounded-[2px] border border-black/5 bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-neutral-900 backdrop-blur-md">
                Bestseller
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            aria-label="Toggle wishlist"
            className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-black/5 bg-white/80 shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white active:scale-95"
          >
            <Heart
              className={cn(
                'h-3.5 w-3.5 transition-all duration-300',
                isWishlisted
                  ? 'scale-110 fill-rose-600 text-rose-600'
                  : 'text-neutral-700'
              )}
            />
          </button>

          {/* Desktop Quick Add */}
          <div className="absolute inset-x-0 bottom-0 z-10 hidden translate-y-full bg-gradient-to-t from-black/40 via-black/10 to-transparent p-3 pt-6 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100 md:block">
            <button
              onClick={handleQuickAdd}
              className="flex w-full items-center justify-center gap-2 rounded bg-white/95 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-neutral-900 shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-neutral-900 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              Quick Add (M)
            </button>
          </div>

          {/* Mobile Add */}
          <button
            onClick={handleQuickAdd}
            aria-label="Add to cart"
            className="absolute bottom-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md transition-transform active:scale-90 md:hidden"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Product Information */}
        <div className="mt-3 space-y-1">
          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            </div>

            <span className="text-[11px] font-medium text-neutral-700">
              {product.rating}
            </span>

            <span className="font-mono text-[10px] text-neutral-400">
              ({product.reviewCount})
            </span>
          </div>

          {/* Name */}
          <h3 className="line-clamp-1 text-xs font-medium tracking-tight text-neutral-900 transition-colors group-hover:text-neutral-500 sm:text-sm">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex flex-wrap items-baseline gap-2 pt-0.5">
            <span className="text-xs font-semibold tracking-tight text-neutral-900 sm:text-sm">
              {formatINR(product.price)}
            </span>

            {hasDiscount && (
              <span className="font-mono text-[11px] font-normal text-neutral-400 line-through">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>

          {/* Best Price */}
          <p className="text-[10px] font-medium tracking-wide text-emerald-700">
            Best Price:{' '}
            <span className="font-semibold">
              {formatINR(product.bestPrice)}
            </span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}