'use client';

import { cn } from '@/lib/utils';
import type { ToastPush } from '@/app/shop/shop-ui';

import { ProductCard, type ColorStatus } from './ProductCard';

export type GridDensity = 3 | 4;

export function ProductGrid({
  products,
  density,
  focusSizes,
  colorStatusOf,
  onRetryColors,
  onRefresh,
  onToast,
}: {
  products: any[];
  density: GridDensity;
  focusSizes: string[];
  colorStatusOf: (p: any) => ColorStatus;
  onRetryColors: (p: any) => void;
  onRefresh: (p: any) => Promise<any | null>;
  onToast: ToastPush;
}) {
  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-5 md:grid-cols-3',
        density === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
      )}
    >
      {products.map((p, i) => (
        <li key={p.id} className="min-w-0">
          <ProductCard
            product={p}
            priority={i < 4}
            focusSizes={focusSizes}
            colorStatus={colorStatusOf(p)}
            onRetryColors={onRetryColors}
            onRefresh={onRefresh}
            onToast={onToast}
          />
        </li>
      ))}
    </ul>
  );
}

/** Skeleton cards in the 4:5 image ratio. */
export function ProductGridSkeleton({ density }: { density: GridDensity }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading products"
      className={cn(
        'grid grid-cols-2 gap-5 md:grid-cols-3',
        density === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
      )}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}>
          <div className="kvl-skeleton aspect-[4/5]" />
          <div className="kvl-skeleton mt-3.5 h-3 w-1/3" />
          <div className="kvl-skeleton mt-2.5 h-3.5 w-3/4" />
          <div className="kvl-skeleton mt-2.5 h-3.5 w-1/2" />
        </div>
      ))}
    </div>
  );
}
