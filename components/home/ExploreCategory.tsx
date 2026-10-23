'use client';

import { useEffect, useMemo, useState } from 'react';

import { apiUrl } from '@/lib/api-url';
import { categories as staticCategories } from '@/lib/data';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

import { GoldButton } from './ui/GoldButton';
import { HomeProductCard } from './ui/HomeProductCard';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

interface ExploreCategoryProps {
  products: Product[];
  loading: boolean;
  error: string;
}

const GRID_LIMIT = 6;

// Not shown as a tab here ("All Products" is the All tab; Top Wear lives on the category page only).
const HIDDEN_TABS = new Set(['all-products', 'top-wear']);

interface CategoryTab {
  slug: string;
  name: string;
}

// Live categories from the API (one shared request). Slugs are de-duplicated; where the
// storefront already has a display name for a slug it is kept (e.g. "Kovenik Premium").
let categoriesRequest: Promise<CategoryTab[]> | null = null;

function fetchLiveCategories(): Promise<CategoryTab[]> {
  if (categoriesRequest) return categoriesRequest;

  const request = (async () => {
    const response = await fetch(apiUrl('/api/categories'), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Categories API failed with status ${response.status}`);

    const data: unknown = await response.json();
    const payload = (data ?? {}) as { categories?: unknown; data?: unknown };
    const list = Array.isArray(payload.categories)
      ? payload.categories
      : Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(data)
          ? (data as unknown[])
          : [];

    const known = new Map<string, string>(staticCategories.map((c) => [c.slug, c.name]));
    const seen = new Set<string>();
    const result: CategoryTab[] = [];

    for (const item of list) {
      const record = (item ?? {}) as { slug?: unknown; name?: unknown };
      const slug = String(record.slug ?? '').trim();
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      result.push({ slug, name: known.get(slug) ?? String(record.name ?? slug) });
    }
    return result;
  })();

  request.catch(() => {
    if (categoriesRequest === request) categoriesRequest = null;
  });
  categoriesRequest = request;
  return request;
}

export function ExploreCategory({ products, loading, error }: ExploreCategoryProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [liveCategories, setLiveCategories] = useState<CategoryTab[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLiveCategories()
      .then((list) => {
        if (!cancelled) setLiveCategories(list);
      })
      .catch((err) => console.error('Categories API error:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter tabs: All / New In / Best Seller + every available category. The static list is only a fallback if the API fails.
  const filterTabs = useMemo(() => {
    const source: CategoryTab[] = liveCategories ?? staticCategories.map((c) => ({ slug: c.slug, name: c.name }));
    return [
      { id: 'all', label: 'All' },
      { id: 'new-in', label: 'New In' },
      { id: 'best-seller', label: 'Best Seller' },
      ...source.filter((c) => !HIDDEN_TABS.has(c.slug)).map((c) => ({ id: c.slug, label: c.name })),
    ];
  }, [liveCategories]);

  const gridProducts = useMemo(() => {
    const list =
      activeFilter === 'all'
        ? products
        : activeFilter === 'new-in'
          ? products.filter((p) => p.newArrival)
          : activeFilter === 'best-seller'
            ? products.filter((p) => p.bestSeller)
            : products.filter(
                (p) => p.category === activeFilter || p.tags?.includes(activeFilter)
              );
    return list.slice(0, GRID_LIMIT);
  }, [products, activeFilter]);

  return (
    <section
      aria-label="Explore our category"
      className="bg-kv-bg px-4 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <Reveal>
          <SectionHeading eyebrow="Fresh drops" title="Explore our category" href="/shop" />

          <div
            role="group"
            aria-label="Filter products"
            className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
          >
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  aria-pressed={isActive}
                  className={cn(
                    'chrome-focus min-h-[44px] shrink-0 rounded-full border px-5 text-[11px] font-semibold uppercase tracking-[0.14em] transition duration-300',
                    isActive
                      ? 'border-transparent bg-[linear-gradient(180deg,#ffffff,#c9ced5)] text-[#0b0c0e]'
                      : 'border-white/20 text-kv-body hover:border-white/60 hover:text-white'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {loading && (
            <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-kv-gold" role="status">
              Loading live collection...
            </p>
          )}
          {!loading && error && (
            <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-kv-muted" role="status">
              Showing the latest available collection.
            </p>
          )}
        </Reveal>

        {gridProducts.length > 0 ? (
          <div className={cn(
              'mt-8 grid w-full grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 md:grid-cols-3 lg:gap-x-6',
              // fill the full container width instead of leaving empty tracks
              gridProducts.length === 4 && 'lg:grid-cols-4',
              gridProducts.length >= 5 && 'lg:grid-cols-5 xl:grid-cols-6'
            )}>
            {gridProducts.map((product) => (
              <HomeProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="chrome-glass mt-8 flex min-h-[240px] flex-col items-center justify-center rounded-2xl px-5 text-center">
            <h3 className="chrome-text font-bodoni text-[26px]">No pieces found</h3>
            <p className="mt-2 max-w-xs text-[13px] leading-6 text-kv-muted">
              Nothing in this category yet.
            </p>
            <GoldButton className="mt-5" onClick={() => setActiveFilter('all')}>
              View all pieces
            </GoldButton>
          </div>
        )}
      </div>
    </section>
  );
}
