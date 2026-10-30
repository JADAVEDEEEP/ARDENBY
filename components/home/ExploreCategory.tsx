'use client';

import { useMemo, useState } from 'react';

import type { Product } from '@/types';

import { FilterChips } from './FilterChips';
import type { ChipOption } from './FilterChips';
import { ProductCard } from './ProductCard';
import { ProductSkeletonCard } from './ProductRail';
import { SectionHeader } from './ui/SectionHeader';

interface ExploreCategoryProps {
  products: Product[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}

const GRID_LIMIT = 8;

const CHIPS: readonly ChipOption[] = [
  { id: 'all', label: 'All' },
  { id: 'new-in', label: 'New In' },
  { id: 'best-seller', label: 'Best Seller' },
  { id: 'ardenby-premium', label: 'Kovenik Premium' },
  { id: 'bottom-wear', label: 'Bottom Wear' },
  { id: 'epic-thread', label: 'Epic Thread' },
  { id: 'plus-size', label: 'Plus Size' },
  { id: 'supreme-edition', label: 'Supreme Edition' },
];

function matches(product: Product, filter: string): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'new-in':
      return product.newArrival;
    case 'best-seller':
      return product.bestSeller;
    case 'plus-size':
      return product.sizes.includes('XXL');
    default:
      return product.category === filter;
  }
}

export function ExploreCategory({ products, loading, error, onRetry }: ExploreCategoryProps) {
  const [active, setActive] = useState('all');

  const visible = useMemo(
    () => products.filter((p) => matches(p, active)).slice(0, GRID_LIMIT),
    [products, active]
  );

  return (
    <section aria-labelledby="home-explore" className="w-full bg-kv-bg py-10 md:py-14">
      <div className="kv-gutter mx-auto w-full max-w-[1600px]">
        <SectionHeader id="home-explore" title="Explore our category" href="/shop" />
        <FilterChips options={CHIPS} active={active} onChange={setActive} label="Filter products" />

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
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-6 min-[1600px]:grid-cols-5">
            {Array.from({ length: GRID_LIMIT }).map((_, i) => (
              <ProductSkeletonCard key={i} />
            ))}
          </div>
        ) : visible.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-6 md:gap-y-10 min-[1600px]:grid-cols-5">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} variant="grid" />
            ))}
          </div>
        ) : (
          <div role="status" className="flex min-h-[200px] flex-col items-center justify-center bg-kv-band px-4 text-center">
            <p className="font-oswald text-[22px] font-semibold uppercase tracking-[0.06em] text-kv-ink">No pieces found</p>
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
    </section>
  );
}
