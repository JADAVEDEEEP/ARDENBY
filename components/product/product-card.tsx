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

export function ProductCard({ product, index = 0 }: ProductCardProps) {
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
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
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

  const hasDiscount = discountPercent(product.mrp, product.price) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: (index % 4) * 0.04, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setImgIndex(1)}
      onMouseLeave={() => setImgIndex(0)}
      className="group relative flex flex-col w-full bg-transparent"
    >
      <Link href={`/product/${product.slug}`} className="block w-full focus:outline-none">
        {/* 4:5 Aspect Ratio Image Container */}
        <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-neutral-100">
          {/* Main Image Swap with micro-zoom */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[imgIndex] || product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          />

          {/* Luxury Minimal Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1 z-10 pointer-events-none">
            {hasDiscount && (
              <span className="px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase bg-neutral-900/90 text-white backdrop-blur-md rounded-[2px]">
                -{discountPercent(product.mrp, product.price)}%
              </span>
            )}
            {product.limitedEdition && (
              <span className="px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase bg-stone-900/80 text-amber-200 backdrop-blur-md rounded-[2px]">
                Limited Drop
              </span>
            )}
            {product.bestSeller && (
              <span className="px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase bg-white/90 text-neutral-900 backdrop-blur-md border border-black/5 rounded-[2px]">
                Bestseller
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            aria-label="Toggle wishlist"
            className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md border border-black/5 flex items-center justify-center transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 shadow-sm"
          >
            <Heart
              className={cn(
                'h-3.5 w-3.5 transition-all duration-300',
                isWishlisted
                  ? 'fill-rose-600 text-rose-600 scale-110'
                  : 'text-neutral-700 group-hover/btn:text-black'
              )}
            />
          </button>

          {/* Quick Add Overlay (Desktop Hover) */}
          <div className="hidden md:block absolute inset-x-0 bottom-0 p-3 z-10 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] bg-gradient-to-t from-black/40 via-black/10 to-transparent pt-6">
            <button
              onClick={handleQuickAdd}
              className="w-full py-2.5 px-4 bg-white/95 backdrop-blur-md text-neutral-900 hover:bg-neutral-900 hover:text-white rounded text-xs font-semibold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              Quick Add (M)
            </button>
          </div>

          {/* Mobile Direct Action Button */}
          <button
            onClick={handleQuickAdd}
            aria-label="Add to cart"
            className="md:hidden absolute bottom-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Editorial Product Information */}
        <div className="mt-3 space-y-1">
          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            </div>
            <span className="text-[11px] font-medium text-neutral-700">{product.rating}</span>
            <span className="text-[10px] text-neutral-400 font-mono">({product.reviewCount})</span>
          </div>

          {/* Title */}
          <h3 className="text-xs sm:text-sm font-medium tracking-tight text-neutral-900 line-clamp-1 group-hover:text-neutral-500 transition-colors">
            {product.name}
          </h3>

          {/* Price Layout */}
          <div className="flex items-baseline gap-2 flex-wrap pt-0.5">
            <span className="text-xs sm:text-sm font-semibold text-neutral-900 tracking-tight">
              {formatINR(product.price)}
            </span>

            {hasDiscount && (
              <span className="text-[11px] font-normal text-neutral-400 line-through font-mono">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>

          {/* Best Price Callout */}
          <p className="text-[10px] text-emerald-700 font-medium tracking-wide">
            Best Price: <span className="font-semibold">{formatINR(product.bestPrice)}</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}