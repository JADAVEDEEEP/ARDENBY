'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { apiUrl } from '@/lib/api-url';
import { formatINR } from '@/lib/format';
import { getStockQty } from '@/lib/featured-drop';
import { FilterSidebar } from '@/components/shop/FilterSidebar';
import { MobileFilterSheet } from '@/components/shop/MobileFilterSheet';
import { MobileSortSheet } from '@/components/shop/MobileSortSheet';
import { ProductGrid, ProductGridSkeleton, type GridDensity } from '@/components/shop/ProductGrid';
import type { ColorStatus } from '@/components/shop/ProductCard';
import type { CategoryOption } from '@/components/shop/FilterGroups';
import {
  ActiveFilterRow,
  ChipRow,
  ListingToolbarRow,
  MobileFilterBar,
  type FilterChip,
} from '@/components/shop/ListingToolbar';
import {
  ALL_CATEGORY,
  COLLECTION_OPTIONS,
  EMPTY_FILTERS,
  applyFilters,
  buildFacets,
  countActive,
  filtersToQuery,
  humanize,
  inCategory,
  parseFilters,
  toggleIn,
  type ShopFilters,
} from '@/components/shop/shop-filters';
import { useHeaderHeight } from '@/components/shop/use-header-height';
import { ToastStack, useToasts } from './shop-ui';
import {
  colorsFailFlag,
  normalizeProductColors,
  reportShopError,
  saveNotify,
} from './shop-stock';

type ApiProduct = {
  id: string;
  slug: string;
  name: string;
  category_slug?: string | null;
  category_label?: string | null;
  fit?: string | null;
  fabric?: string | null;
  coverage?: string | null;
  price?: number | string | null;
  mrp?: number | string | null;
  best_price?: number | string | null;
  rating?: number | string | null;
  review_count?: number | string | null;
  description?: string | null;
  fabric_details?: string | null;
  wash_care?: string | null;
  tags?: string | null;
  best_seller?: boolean;
  new_arrival?: boolean;
  trending?: boolean;
  limited_edition?: boolean;
  inventory?: number | string | null;
  created_at?: string | null;
  images?: { image_url?: string }[];
  variants?: {
    id?: string;
    size?: string;
    color?: string;
    inventory?: number | string;
    sku?: string;
  }[];
};

function normalizeProduct(product: ApiProduct) {
  const variants = Array.isArray(product.variants) ? product.variants : [];

  return {
    ...product,
    category: product.category_slug || '',
    categoryLabel: product.category_label || '',
    price: Number(product.price || 0),
    mrp: product.mrp == null ? undefined : Number(product.mrp),
    bestPrice: Number(product.best_price || 0),
    rating: Number(product.rating || 0),
    reviewCount: Number(product.review_count || 0),
    fabric: product.fabric || '',
    coverage: product.coverage || '',
    fit: product.fit || '',
    description: product.description || '',
    fabricDetails: product.fabric_details || '',
    washCare: product.wash_care || '',
    tags: product.tags || '',
    bestSeller: Boolean(product.best_seller),
    newArrival: Boolean(product.new_arrival),
    trending: Boolean(product.trending),
    limitedEdition: Boolean(product.limited_edition),
    inventory: Number(product.inventory || 0),
    images: (product.images || [])
      .map((image) => image?.image_url)
      .filter(Boolean),
    variants,
    sizes: Array.from(
      new Set(variants.map((variant) => variant.size).filter(Boolean))
    ),
    // Canonical names ("BLACK" -> "Black") so colour filters + dots match.
    colors: normalizeProductColors({ variants }).map((c) => c.name),
  };
}

const PAGE_SIZE = 12;
const DEFAULT_DESCRIPTION = 'Oversized tees, graphic prints and everyday essentials.';

export function ShopClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filters and sort live in the URL, so links are shareable and Back works.
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const query = filtersToQuery(filters);

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiCategories, setApiCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [density, setDensity] = useState<GridDensity>(4);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [colorState, setColorState] = useState<Record<string, ColorStatus>>({});
  const [failFlag] = useState(colorsFailFlag);

  const { toasts, push, dismiss } = useToasts();
  useHeaderHeight();

  const setFilters = (next: ShopFilters, opts?: { replace?: boolean }) => {
    const q = filtersToQuery(next);
    const url = q ? `${pathname}?${q}` : (pathname as string);
    if (opts?.replace) router.replace(url, { scroll: false });
    else router.push(url, { scroll: false });
  };
  const patch = (p: Partial<ShopFilters>) =>
    setFilters({ ...filters, ...p }, { replace: 'min' in p || 'max' in p });
  const clearAll = () => setFilters({ ...EMPTY_FILTERS, category: filters.category, sort: filters.sort });

  // Backend-managed categories.
  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        const response = await fetch(apiUrl('/api/categories'), {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) {
          console.error(`Categories API error: ${response.status} ${response.statusText}`);
          return;
        }
        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.categories)
            ? data.categories
            : Array.isArray(data?.data?.categories)
              ? data.data.categories
              : null;
        if (!list) {
          console.error('Categories API returned an unexpected response shape:', data);
          return;
        }
        setApiCategories(list.filter((c: any) => c && typeof c.slug === 'string' && c.slug.length > 0));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Categories API error:', error);
      } finally {
        if (!controller.signal.aborted) setCategoriesLoading(false);
      }
    }

    void loadCategories();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: '1', limit: '1000' });
        const response = await fetch(apiUrl(`/api/products?${params.toString()}`), {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to load products');

        const data = await response.json();
        const apiProducts: ApiProduct[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data?.data?.products)
              ? data.data.products
              : [];

        if (!cancelled) {
          // Only database products can be bought, so only they are listed.
          const merged = apiProducts.map(normalizeProduct);
          if (process.env.NODE_ENV !== 'production') {
            // Dev diagnostics: raw variants for any product that ends up with no colours.
            merged
              .filter((p: any) => p.colors.length === 0)
              .forEach((p: any) => console.warn('[shop] product has no colors', p.id, p.slug, p.variants));
          }
          setProducts(merged);
        }
      } catch (error) {
        console.error('Shop products API error:', error);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- derived data ---------- */
  const filtered = useMemo(() => applyFilters(products, filters), [products, filters]);
  const facets = useMemo(() => buildFacets(products, filters.category), [products, filters.category]);
  const activeCount = countActive(filters);
  const visible = filtered.slice(0, visibleCount);

  // New query (filter / sort / category change) starts again from the first page.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  const categories: CategoryOption[] = useMemo(() => {
    const counts: Record<string, number> = { [ALL_CATEGORY]: products.length };
    for (const c of apiCategories) {
      if (c.slug !== ALL_CATEGORY) counts[c.slug] = inCategory(products, c.slug).length;
    }
    const count = (slug: string) => (isLoading ? undefined : counts[slug] ?? 0);
    return [
      // Fixed casing: the stored category name's capitalisation isn't relied on for this label.
      { slug: ALL_CATEGORY, name: 'All Products', count: count(ALL_CATEGORY) },
      ...apiCategories
        .filter((c: any) => c.slug !== ALL_CATEGORY)
        .map((c: any) => ({ slug: c.slug as string, name: c.name as string, count: count(c.slug) })),
    ];
  }, [apiCategories, products, isLoading]);

  const activeCategory = apiCategories.find((c: any) => c.slug === filters.category);
  const awaitingCategory = filters.category !== ALL_CATEGORY && categoriesLoading;
  const categoryName: string = filters.category === ALL_CATEGORY
    ? 'All Products' // the stored name's capitalisation ("All PRODUCTS") is not shown
    : activeCategory
    ? activeCategory.name
    : awaitingCategory
      ? ''
      : filters.category !== ALL_CATEGORY
        ? humanize(filters.category)
        : categories[0].name;
  const description: string = activeCategory?.description || DEFAULT_DESCRIPTION;

  /* ---------- active filter chips ---------- */
  const labelOf = (list: { key: string; label: string }[], key: string) =>
    list.find((o) => o.key === key)?.label ?? humanize(key);

  const chips: FilterChip[] = [
    ...filters.sizes.map((v) => ({
      key: `s-${v}`,
      label: `Size: ${v}`,
      remove: () => patch({ sizes: toggleIn(filters.sizes, v) }),
    })),
    ...filters.colors.map((v) => ({
      key: `c-${v}`,
      label: labelOf(facets.colors, v),
      remove: () => patch({ colors: toggleIn(filters.colors, v) }),
    })),
    ...filters.fits.map((v) => ({
      key: `fit-${v}`,
      label: labelOf(facets.fits, v),
      remove: () => patch({ fits: toggleIn(filters.fits, v) }),
    })),
    ...filters.fabrics.map((v) => ({
      key: `f-${v}`,
      label: labelOf(facets.fabrics, v),
      remove: () => patch({ fabrics: toggleIn(filters.fabrics, v) }),
    })),
    ...filters.coverages.map((v) => ({
      key: `cv-${v}`,
      label: labelOf(facets.coverages, v),
      remove: () => patch({ coverages: toggleIn(filters.coverages, v) }),
    })),
    ...filters.collections.map((k) => ({
      key: `col-${k}`,
      label: COLLECTION_OPTIONS.find((o) => o.key === k)?.label ?? k,
      remove: () => patch({ collections: toggleIn(filters.collections, k) }),
    })),
    ...(filters.min !== null || filters.max !== null
      ? [
          {
            key: 'price',
            label: `${formatINR(filters.min ?? 0)} – ${formatINR(filters.max ?? facets.priceMax)}`,
            remove: () => patch({ min: null, max: null }),
          },
        ]
      : []),
    ...(filters.inStock ? [{ key: 'stock', label: 'In stock', remove: () => patch({ inStock: false }) }] : []),
    ...(filters.onSale ? [{ key: 'sale', label: 'On sale', remove: () => patch({ onSale: false }) }] : []),
  ];

  /* ---------- one-time "sold out" nudge ---------- */
  const oosShown = useRef(false);
  useEffect(() => {
    if (isLoading || oosShown.current) return;
    const soldOut = products.find((p) => getStockQty(p) <= 0 && p.images?.length);
    if (!soldOut) return;
    oosShown.current = true;
    try {
      if (sessionStorage.getItem('kv-oos-toast')) return;
      sessionStorage.setItem('kv-oos-toast', '1');
    } catch {
      /* storage unavailable: still show once per mount */
    }
    const t = window.setTimeout(() => {
      push({
        variant: 'stock',
        title: 'Out of stock',
        message: `${soldOut.name} is currently sold out.`,
        actions: [
          {
            label: 'Notify me',
            primary: true,
            onClick: () => {
              saveNotify(soldOut.id);
              push({
                variant: 'wish',
                title: 'Noted',
                message: `We'll flag ${soldOut.name} for you.`,
                duration: 3500,
              });
            },
          },
          { label: 'Try size M', onClick: () => patch({ sizes: ['M'] }) },
        ],
      });
    }, 1400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, products]);

  /* ---------- fresh stock + colours from the server ---------- */
  const applyFresh = (fresh: any) =>
    setProducts((prev) => prev.map((x) => (x.id === fresh.id ? { ...x, ...fresh } : x)));

  /** GET /api/products/:slug. strict=true throws (used by colour RETRY);
      otherwise returns null when the product isn't on the server. */
  const fetchFresh = async (p: any, strict = false): Promise<any | null> => {
    try {
      const res = await fetch(apiUrl(`/api/products/${encodeURIComponent(p.slug)}`), { cache: 'no-store' });
      if (!res.ok) {
        const err: any = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      const data = await res.json();
      const raw = data?.product ?? data?.data?.product ?? null;
      if (!raw?.id) throw new Error('Unexpected product response shape');
      const fresh = normalizeProduct(raw);
      applyFresh(fresh);
      return fresh;
    } catch (e: any) {
      if (strict) throw e;
      if (e?.status !== 404) reportShopError('stock re-check failed', { productId: p.id, status: e?.status, error: e });
      return null;
    }
  };

  const retryColors = async (p: any) => {
    setColorState((s) => ({ ...s, [p.id]: 'loading' }));
    try {
      if (failFlag === 'hard') throw Object.assign(new Error('Forced colors failure'), { status: 503 });
      await fetchFresh(p, true);
      setColorState((s) => ({ ...s, [p.id]: 'ok' }));
    } catch (e: any) {
      reportShopError('colors fetch failed', { productId: p.id, status: e?.status, error: e });
      setColorState((s) => ({ ...s, [p.id]: 'error' }));
    }
  };

  const colorStatusOf = (p: any): ColorStatus =>
    colorState[p.id] ?? (failFlag !== 'off' || normalizeProductColors(p).length === 0 ? 'error' : 'ok');

  /* ---------- render ---------- */
  return (
    <div className="kvl min-h-screen bg-[var(--ivory)] text-[var(--charcoal)]">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <div className="lg:grid lg:grid-cols-[265px_minmax(0,1fr)]">
        <FilterSidebar
          filters={filters}
          facets={facets}
          categories={categories}
          onChange={patch}
          onClear={clearAll}
          hasActive={activeCount > 0}
        />

        <section aria-label="Products" className="min-w-0">
          <h1 className="sr-only">{categoryName || 'All Products'}</h1>

          <div className="px-4 pt-3 lg:pl-10 lg:pr-12 lg:pt-[30px]">
            <ListingToolbarRow
              current={categoryName}
              shown={visible.length}
              total={filtered.length}
              density={density}
              onDensity={setDensity}
              sort={filters.sort}
              onSort={(sort) => patch({ sort })}
            />
          </div>

          <div className="mt-3 lg:hidden">
            <MobileFilterBar
              activeCount={activeCount}
              sort={filters.sort}
              onOpenFilters={() => setFiltersOpen(true)}
              onOpenSort={() => setSortOpen(true)}
            />
            <div className="px-4">
              <ChipRow chips={chips} />
            </div>
          </div>

          {chips.length > 0 && (
            <div className="hidden pt-4 lg:block lg:pl-10 lg:pr-12">
              <ActiveFilterRow chips={chips} onClear={clearAll} />
            </div>
          )}

          <div className="px-4 pb-[60px] pt-4 lg:pl-10 lg:pr-12 lg:pt-6">
            {isLoading ? (
              <ProductGridSkeleton density={density} />
            ) : filtered.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <p className="text-[20px] font-semibold text-[var(--ink)]">No products match these filters</p>
                <p className="mt-2 max-w-sm text-[14px] text-[var(--muted)]">
                  Try removing a filter or two to see more of the collection.
                </p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-6 h-12 bg-[var(--ink)] px-8 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--ivory)]"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <ProductGrid
                  products={visible}
                  density={density}
                  focusSizes={filters.sizes}
                  colorStatusOf={colorStatusOf}
                  onRetryColors={retryColors}
                  onRefresh={(p) => fetchFresh(p)}
                  onToast={push}
                />

                <div className="mt-14 flex flex-col items-center gap-4 text-center">
                  <p className="text-[14px] text-[var(--muted)]" aria-live="polite">
                    You&apos;ve viewed {visible.length} of {filtered.length} products
                  </p>
                  <div className="h-[2px] w-[240px] max-w-full bg-[var(--line)]" aria-hidden>
                    <div
                      className="h-full bg-[var(--ink)] transition-[width] duration-500"
                      style={{ width: `${(visible.length / filtered.length) * 100}%` }}
                    />
                  </div>
                  {visible.length < filtered.length && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="mt-2 h-12 border border-[var(--ink)] px-14 text-[14px] font-semibold uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--ivory)]"
                    >
                      Load more
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <MobileFilterSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        products={products}
        applied={filters}
        categories={categories}
        onApply={(next) => setFilters(next)}
      />
      <MobileSortSheet open={sortOpen} onOpenChange={setSortOpen} value={filters.sort} onSelect={(sort) => patch({ sort })} />
    </div>
  );
}
