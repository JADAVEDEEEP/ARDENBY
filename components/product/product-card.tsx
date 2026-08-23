'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Star, ShoppingBag, Zap } from 'lucide-react';
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
  const [hovered, setHovered] = useState(false);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.05 }}
      onMouseEnter={() => {
        setHovered(true);
        setImgIndex(1);
      }}
      onMouseLeave={() => {
        setHovered(false);
        setImgIndex(0);
      }}
      className="group"
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative zoom-container product-aspect rounded-2xl overflow-hidden bg-muted">
          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[imgIndex] || product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover zoom-img"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discountPercent(product.mrp, product.price) > 0 && (
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-ink text-cream rounded-full">
                {discountPercent(product.mrp, product.price)}% OFF
              </span>
            )}
            {product.limitedEdition && (
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-olive text-cream rounded-full">
                Limited
              </span>
            )}
            {product.bestSeller && (
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-sand text-ink rounded-full">
                Bestseller
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-cream/90 backdrop-blur flex items-center justify-center hover:bg-cream transition-all shadow-sm"
            aria-label="Toggle wishlist"
          >
            <Heart
              className={cn('h-4 w-4 transition-all', isWishlisted ? 'fill-destructive text-destructive scale-110' : 'text-ink')}
            />
          </button>

          {/* Quick add */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 p-3 transition-all duration-300',
              hovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
            )}
          >
            <button
              onClick={handleQuickAdd}
              className="w-full py-3 bg-ink text-cream rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-ink-soft transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              Add To Cart
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <Star className="h-3 w-3 fill-sand text-sand" />
            <span className="text-xs font-medium text-ink-soft">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
          </div>
          <h3 className="text-sm font-medium text-ink line-clamp-1 group-hover:text-olive transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-ink">{formatINR(product.price)}</span>
            <span className="text-xs text-muted-foreground line-through">{formatINR(product.mrp)}</span>
            <span className="text-xs font-semibold text-destructive">
              {discountPercent(product.mrp, product.price)}% OFF
            </span>
          </div>
          <p className="text-xs text-olive font-medium">
            Best Price {formatINR(product.bestPrice)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
