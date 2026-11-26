'use client';

import { useMemo, useState } from 'react';

import type { Product } from '@/types';

import { FilterChips } from './FilterChips';
import type { ChipOption } from './FilterChips';
import { inCategory } from '@/components/shop/shop-filters';
import { usePlusSizeAvailable } from '@/hooks/use-plus-size';
import { prioritizeNewCollection } from '@/lib/new-collection';

import { ProductCard } from './ProductCard';
import { ProductSkeletonCard } from './ProductRail';
import { SectionHeader } from './ui/SectionHeader';

interface ExploreCategoryProps {
  products: Product[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}

// Only the loading skeleton uses a fixed count; the real grid is not limited.
const GRID_LIMIT = 8;

const CHIPS: readonly ChipOption[] = [
  { id: 'all', label: 'All' },
  { id: 'top-wear', label: 'Top Wear' },
  { id: 'bottom-wear', label: 'Bottom Wear' },
  { id: 'plus-size', label: 'Plus Size' },
  { id: 'best-seller', label: 'Best Seller' },
  { id: 'apex-edition', label: 'Apex Edition' },
  { id: 'ardenby-premium', label: 'Kovenik Premium' },
  { id: 'epic-thread', label: 'Epic Thread' },
  { id: 'the-print-club', label: 'The Print Club' },
];

function matches(product: Product, filter: string): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'best-seller':
      return product.bestSeller;
    default:
      // Same rule as the shop page: a product's category slug OR a slug token in its tags (a product has one
      // category but can also belong to a collection), and Plus Size also covers 3XL and above.
      return inCategory([product], filter).length > 0;
  }
}

export function ExploreCategory({ products, loading, error, onRetry }: ExploreCategoryProps) {
  const [active, setActive] = useState('all');
  const plusSize = usePlusSizeAvailable();
  const chips = useMemo(() => CHIPS.filter((c) => c.id !== 'plus-size' || plusSize), [plusSize]);

  const visible = useMemo(() => {
    // Every tab lists ALL of its products, the imported catalogue products first, then the older ones.
    return prioritizeNewCollection(products.filter((p) => matches(p, active)));
  }, [products, active]);

  return (
    <section aria-labelledby="home-explore" className="w-full bg-kv-bg py-8 md:py-10">
      <div className="mx-auto w-full">
        <SectionHeader id="home-explore" title="Shop by category" href="/shop" className="kv-gutter" />
        {/* Chip bar stays under the header while the grid scrolls (desktop). */}
        <div className="z-30 border-b border-kv-line bg-kv-bg lg:sticky lg:top-[68px]">
          <FilterChips options={chips}active={active} onChange={setActive} label="Filter products" />
        </div>
        <div className="px-3 pt-5 md:px-0 md:pt-6">

        {error && !loading ? (
          <div role="status" className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-[16px] text-kv-sub">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-[48px] items-center border-2 border-kv-ink px-6 text-[14px] font-bold uppercase tracking-[0.1em] text-kv-ink hover:bg-kv-ink hover:text-white"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-4 md:gap-y-10 lg:grid-cols-4 min-[1600px]:grid-cols-5">
            {Array.from({ length: GRID_LIMIT }).map((_, i) => (
              <ProductSkeletonCard key={i} />
            ))}
          </div>
        ) : visible.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-4 md:gap-y-10 lg:grid-cols-4 min-[1600px]:grid-cols-5">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} variant="catalog" textClassName="px-3" />
            ))}
          </div>
        ) : (
          <div role="status" className="flex min-h-[200px] flex-col items-center justify-center bg-kv-band px-4 text-center">
            <p className="font-oswald text-[22px] font-semibold uppercase tracking-[0.06em] text-kv-ink">No products found</p>
            <p className="mt-1 text-[16px] text-kv-sub">Nothing in this category yet.</p>
            <button
              type="button"
              onClick={() => setActive('all')}
              className="mt-4 inline-flex min-h-[48px] items-center bg-kv-ink px-6 text-[14px] font-bold uppercase tracking-[0.1em] text-white hover:bg-black"
            >
              View all pieces
            </button>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
