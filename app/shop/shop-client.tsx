'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronRight,
  Check,
  Grid,
  LayoutGrid,
  List,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { products as staticProducts } from '@/lib/data';
import { apiUrl } from '@/lib/api-url';
import type { ProductColor, ProductSize, FabricType, CoverageType, FitType } from '@/types';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MobileShopBar } from '@/components/home/MobileShopBar';
import { HERO_PRODUCT_IMAGE } from '@/components/home/home-assets';
import { getStockQty, pickFeaturedDrop } from '@/lib/featured-drop';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeroTee,
  PriceSlider,
  ShopProductCard,
  ToastStack,
  useMediaQuery,
  useToasts,
  type ColorStatus,
} from './shop-ui';
import {
  LOW_STOCK_THRESHOLD,
  canonicalColorName,
  carriesSize,
  colorsFailFlag,
  focusQty,
  normalizeProductColors,
  reportShopError,
  saveNotify,
  sizeQty,
  stateOfQty,
  totalStock,
  type StockState,
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

function normalizeStaticProduct(product: any) {
  const variants = Array.isArray(product.variants) ? product.variants : [];

  const images = Array.isArray(product.images)
    ? product.images.map((image: any) =>
        typeof image === 'string' ? image : image?.image_url
      ).filter(Boolean)
    : [];

  return {
    ...product,
    category: product.category || product.category_slug || '',
    categoryLabel:
      product.categoryLabel || product.category_label || '',
    price: Number(product.price || 0),
    mrp: product.mrp == null ? undefined : Number(product.mrp),
    bestPrice: Number(product.bestPrice ?? product.best_price ?? 0),
    rating: Number(product.rating || 0),
    reviewCount: Number(product.reviewCount ?? product.review_count ?? 0),
    fabric: product.fabric || '',
    coverage: product.coverage || '',
    fit: product.fit || '',
    description: product.description || '',
    fabricDetails:
      product.fabricDetails || product.fabric_details || '',
    washCare: product.washCare || product.wash_care || '',
    tags: product.tags || '',
    bestSeller: Boolean(product.bestSeller ?? product.best_seller),
    newArrival: Boolean(product.newArrival ?? product.new_arrival),
    trending: Boolean(product.trending),
    limitedEdition: Boolean(
      product.limitedEdition ?? product.limited_edition
    ),
    inventory: Number(product.inventory || 0),
    images,
    variants,
    sizes:
      Array.isArray(product.sizes) && product.sizes.length > 0
        ? product.sizes
        : Array.from(
            new Set(
              variants
                .map((variant: any) => variant.size)
                .filter(Boolean)
            )
          ),
    // Canonical names ("BLACK" -> "Black") so colour filters + dots match.
    colors: normalizeProductColors({ colors: product.colors, variants }).map((c) => c.name),
  };
}

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

/* Category artwork saved locally in /public/images/categories (one file per
   category slug). A backend-provided image always wins. */
const LOCAL_CATEGORY_IMAGES = new Set([
  'all-products',
  'supreme-edition',
  'epic-thread',
  'ardenby-premium',
  'the-print-club',
  'top-wear',
  'plus-size',
  'bottom-wear',
]);

function getCategoryImage(c: any): string | undefined {
  const own = c?.image_url || c?.image || c?.imageUrl;
  if (own) return own;
  return LOCAL_CATEGORY_IMAGES.has(c?.slug) ? `/images/categories/${c.slug}.jpg` : undefined;
}

/* "plus-size" -> "Plus Size" (used for route / slug based labels) */
function humanize(value: string): string {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getDiscountPct(p: any): number {
  if (!p.mrp || p.mrp <= 0 || p.price >= p.mrp) return 0;
  return Math.round(((p.mrp - p.price) / p.mrp) * 100);
}

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'discount', label: 'Highest Discount' },
  { value: 'availability', label: 'Availability' },
];

const PRICE_MIN_CAP = 2000;

const allSizes: ProductSize[] = ['S', 'M', 'L', 'XL', 'XXL'];
const allColors: { name: ProductColor; hex: string }[] = [
  { name: 'Black', hex: '#111111' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Beige', hex: '#D8C3A5' },
  { name: 'Olive', hex: '#6B705C' },
  { name: 'Navy', hex: '#1a2540' },
  { name: 'Royal Blue', hex: '#1e40d4' },
  { name: 'Sky Blue', hex: '#87CEEB' },
  { name: 'Lilac', hex: '#C8A2C8' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Green', hex: '#16a34a' },
];
const allFabrics: FabricType[] = ['100% Cotton', 'Textured', 'Pattern', 'Printed', 'Puff Print'];
const allCoverages: CoverageType[] = ['Front', 'Back', 'All Over'];
const allFits: FitType[] = ['Oversized', 'Regular', 'Cargo', 'Hoodie', 'Jogger'];

type CollectionKey = 'newArrival' | 'bestSeller' | 'limitedEdition';
const collectionOptions: { key: CollectionKey; label: string }[] = [
  { key: 'newArrival', label: 'New Arrivals' },
  { key: 'bestSeller', label: 'Bestsellers' },
  { key: 'limitedEdition', label: 'Limited Edition' },
];

/* ------------------------------------------------------------------
   KÖVENIK category page — black metallic surface, silver chrome accents.
   Surfaces/tokens live in globals.css (.kv-shop, .kv-panel, .kv-chrome-*).
------------------------------------------------------------------- */
const PER_PAGE = 8;
const AVAIL_LABEL: Record<StockState, string> = { in: 'In stock', low: 'Low stock', out: 'Out of stock' };
const AVAIL_RANK: Record<StockState, number> = { in: 0, low: 1, out: 2 };

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-white/[0.07] py-3.5 first:border-t-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-[32px] w-full items-center justify-between text-left text-[13px] font-extrabold text-[#f4f2ec]"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn('h-4 w-4 text-[#BDB9B0] transition-transform duration-300', open && 'rotate-180')}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden pt-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onClick,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onClick}
      className="group flex min-h-[40px] w-full items-center gap-3 text-left"
    >
      <span
        className={cn(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors',
          checked ? 'border-[#d2d2d7] bg-[#d2d2d7]' : 'border-white/30 group-hover:border-[#d2d2d7]'
        )}
      >
        {checked && <Check className="h-3 w-3 stroke-[3] text-[#121214]" />}
      </span>
      <span className="text-[13px] text-[#f4f2ec]">
        {label}
        {typeof count === 'number' && <span className="ml-1 text-[12px] text-[#A8A49B]">({count})</span>}
      </span>
    </button>
  );
}

export function ShopClient() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') as string | null;
  const fitParam = searchParams.get('fit') as string | null;

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSizes, setSelectedSizes] = useState<ProductSize[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, PRICE_MIN_CAP]);
  const [selectedColors, setSelectedColors] = useState<ProductColor[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<FabricType[]>([]);
  const [selectedCoverages, setSelectedCoverages] = useState<CoverageType[]>([]);
  const [selectedFits, setSelectedFits] = useState<FitType[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<CollectionKey[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedAvail, setSelectedAvail] = useState<StockState[]>([]);
  const [colorState, setColorState] = useState<Record<string, ColorStatus>>({});
  const [failFlag] = useState(colorsFailFlag);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileCount, setMobileCount] = useState(PER_PAGE);
  const [apiCategories, setApiCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [teePaused, setTeePaused] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { toasts, push, dismiss } = useToasts();

  // Respect reduced motion: start the tee paused.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setTeePaused(true);
  }, []);

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

  const shopCategories = apiCategories;

  useEffect(() => {
    if (fitParam) setSelectedFits([fitParam as FitType]);
  }, [fitParam]);

  const activeCategory = shopCategories.find((c: any) => c.slug === categoryParam);
  const awaitingCategory =
    Boolean(categoryParam) && categoryParam !== 'all-products' && categoriesLoading;

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

  const categoryProducts = useMemo(() => {
    if (!categoryParam || categoryParam === 'all-products') return products;
    if (categoryParam === 'plus-size') return products.filter((p) => p.sizes.includes('XXL'));
    return products.filter((p) => p.category === categoryParam);
  }, [products, categoryParam]);

  const filtered = useMemo(() => {
    let result = [...categoryProducts];

    if (selectedSizes.length > 0) result = result.filter((p) => selectedSizes.some((s) => carriesSize(p, s)));
    if (selectedColors.length > 0) result = result.filter((p) => selectedColors.some((c) => p.colors.includes(c)));
    if (selectedFabrics.length > 0) result = result.filter((p) => selectedFabrics.includes(p.fabric));
    if (selectedCoverages.length > 0) result = result.filter((p) => selectedCoverages.includes(p.coverage));
    if (selectedFits.length > 0) result = result.filter((p) => selectedFits.includes(p.fit));
    if (selectedCollections.length > 0) {
      result = result.filter((p) => selectedCollections.some((key) => Boolean(p[key])));
    }
    // Stock is judged in the selected size(s) when any are selected.
    if (selectedAvail.length > 0) {
      result = result.filter((p) => selectedAvail.includes(stateOfQty(focusQty(p, selectedSizes))));
    }
    if (inStockOnly) result = result.filter((p) => focusQty(p, selectedSizes) > 0);

    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sort) {
      case 'best-selling':
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'newest':
        result.sort((a, b) => Number(b.newArrival) - Number(a.newArrival));
        break;
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'discount':
        result.sort((a, b) => getDiscountPct(b) - getDiscountPct(a));
        break;
      case 'availability':
        result.sort(
          (a, b) =>
            AVAIL_RANK[stateOfQty(focusQty(a, selectedSizes))] - AVAIL_RANK[stateOfQty(focusQty(b, selectedSizes))]
        );
        break;
      default:
        result.sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller));
    }
    return result;
  }, [
    categoryProducts,
    selectedSizes,
    selectedColors,
    selectedFabrics,
    selectedCoverages,
    selectedFits,
    selectedCollections,
    inStockOnly,
    selectedAvail,
    priceRange,
    sort,
  ]);

  const facetCounts = useMemo(() => {
    const byFabric: Record<string, number> = {};
    const byFit: Record<string, number> = {};
    let inStock = 0;
    const collections: Record<CollectionKey, number> = { newArrival: 0, bestSeller: 0, limitedEdition: 0 };
    for (const p of categoryProducts) {
      if (p.fabric) byFabric[p.fabric] = (byFabric[p.fabric] || 0) + 1;
      if (p.fit) byFit[p.fit] = (byFit[p.fit] || 0) + 1;
      if (getStockQty(p) > 0) inStock += 1;
      for (const option of collectionOptions) if (p[option.key]) collections[option.key] += 1;
    }
    return { byFabric, byFit, inStock, collections };
  }, [categoryProducts]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'all-products': products.length,
      'plus-size': products.filter((p) => p.sizes.includes('XXL')).length,
    };
    for (const p of products) {
      if (p.category && p.category !== 'plus-size' && p.category !== 'all-products') {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    }
    return counts;
  }, [products]);
  const getCategoryCount = (slug: string) => (isLoading ? undefined : categoryCounts[slug] ?? 0);

  const PRICE_MAX = useMemo(
    () => Math.max(PRICE_MIN_CAP, Math.ceil(Math.max(0, ...products.map((p) => p.price || 0)) / 100) * 100),
    [products]
  );
  useEffect(() => {
    setPriceRange([0, PRICE_MAX]);
  }, [PRICE_MAX]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const visible = isDesktop ? paged : filtered.slice(0, mobileCount);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const rangeEnd = Math.min(currentPage * PER_PAGE, filtered.length);
  const progress = filtered.length === 0 ? 0 : (isDesktop ? rangeEnd : visible.length) / filtered.length;

  useEffect(() => {
    setCurrentPage(1);
    setMobileCount(PER_PAGE);
  }, [
    categoryParam,
    selectedSizes,
    selectedColors,
    selectedFabrics,
    selectedCoverages,
    selectedFits,
    selectedCollections,
    inStockOnly,
    selectedAvail,
    priceRange,
    sort,
  ]);

  const toggleSize = (s: ProductSize) =>
    setSelectedSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const toggleColor = (c: ProductColor) =>
    setSelectedColors((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const toggleFabric = (f: FabricType) =>
    setSelectedFabrics((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  const toggleCoverage = (c: CoverageType) =>
    setSelectedCoverages((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const toggleFit = (f: FitType) =>
    setSelectedFits((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  const toggleCollection = (k: CollectionKey) =>
    setSelectedCollections((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const toggleAvail = (k: StockState) =>
    setSelectedAvail((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  /* ---------- stock: per-size stats for the category + availability counts ---------- */
  const sizeStats = useMemo(() => {
    const out = {} as Record<string, { state: StockState; pieces: number; inStock: number; out: number; carrying: number }>;
    for (const s of allSizes) {
      const carrying = categoryProducts.filter((p) => carriesSize(p, s));
      const qtys = carrying.map((p) => sizeQty(p, s));
      const pieces = qtys.reduce((n, q) => n + q, 0);
      const lowN = qtys.filter((q) => stateOfQty(q) === 'low').length;
      out[s] = {
        state: pieces === 0 ? 'out' : lowN > 0 || pieces <= LOW_STOCK_THRESHOLD ? 'low' : 'in',
        pieces,
        inStock: qtys.filter((q) => q > 0).length,
        out: qtys.filter((q) => q <= 0).length,
        carrying: carrying.length,
      };
    }
    return out;
  }, [categoryProducts]);

  const availCounts = useMemo(() => {
    const c: Record<StockState, number> = { in: 0, low: 0, out: 0 };
    for (const p of categoryProducts) c[stateOfQty(focusQty(p, selectedSizes))] += 1;
    return c;
  }, [categoryProducts, selectedSizes]);

  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const sizeMessage = (s: string) => {
    const st = sizeStats[s];
    if (st.carrying === 0) return `No products carry ${s} in this category.`;
    if (st.state === 'out') return `${s} is sold out in this category.`;
    const soldOut = st.out > 0 ? ` ${plural(st.out, 'product')} sold out in ${s}.` : '';
    return st.state === 'low'
      ? `Low stock in ${s} — ${plural(st.pieces, 'piece')} left across ${plural(st.inStock, 'product')}.${soldOut}`
      : `${s} in stock — ${plural(st.pieces, 'piece')} across ${plural(st.inStock, 'product')}.${soldOut}`;
  };

  const onSizeClick = (s: ProductSize) => {
    const adding = !selectedSizes.includes(s);
    toggleSize(s);
    if (adding && sizeStats[s].state === 'low') {
      push({ variant: 'low', title: 'Low stock', message: sizeMessage(s) }, { replace: true });
    }
  };

  const clearAll = () => {
    setSelectedAvail([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedFabrics([]);
    setSelectedCoverages([]);
    setSelectedFits([]);
    setSelectedCollections([]);
    setInStockOnly(false);
    setPriceRange([0, PRICE_MAX]);
  };

  const priceActive = priceRange[0] !== 0 || priceRange[1] !== PRICE_MAX;
  const activeFilterCount =
    selectedSizes.length +
    selectedColors.length +
    selectedFabrics.length +
    selectedCoverages.length +
    selectedFits.length +
    selectedCollections.length +
    (inStockOnly ? 1 : 0) +
    selectedAvail.length +
    (priceActive ? 1 : 0);

  const setMinPrice = (value: string) => {
    const n = Math.max(0, Math.min(Number(value) || 0, priceRange[1]));
    setPriceRange([n, priceRange[1]]);
  };
  const setMaxPrice = (value: string) => {
    const n = Math.min(PRICE_MAX, Math.max(Number(value) || 0, priceRange[0]));
    setPriceRange([priceRange[0], n]);
  };

  /* ---------- toasts: FILTER APPLIED + OUT OF STOCK ---------- */
  const filterSig = `${activeFilterCount}|${filtered.length}`;
  const firstSig = useRef(true);
  useEffect(() => {
    if (isLoading) return;
    if (firstSig.current) {
      firstSig.current = false;
      return;
    }
    if (activeFilterCount === 0) return;
    const t = window.setTimeout(() => {
      push(
        {
          variant: 'filter',
          title: 'Filter applied',
          message: `${activeFilterCount} ${activeFilterCount === 1 ? 'filter' : 'filters'} active · ${filtered.length} ${filtered.length === 1 ? 'product' : 'products'} match.`,
          duration: 3200,
        },
        { replace: true }
      );
    }, 700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSig, isLoading]);

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
          { label: 'Try size M', onClick: () => setSelectedSizes(['M']) },
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
      otherwise returns null when the product isn't on the server (static data). */
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

  /* ---------- derived hero data ---------- */
  const featured = useMemo(() => pickFeaturedDrop(products), [products]);
  const teeFront: string = featured?.images?.[0] ?? HERO_PRODUCT_IMAGE;
  const teeBack: string = featured?.images?.[1] ?? teeFront;
  const printLabel = featured && /trapslayer/i.test(featured.name) ? 'TRAPSLAYER' : 'KOVENIK';

  const allCategory = shopCategories.find((c: any) => c.slug === 'all-products');
  const categoryName: string = activeCategory
    ? activeCategory.name
    : awaitingCategory
      ? ' '
      : categoryParam && categoryParam !== 'all-products'
        ? humanize(categoryParam)
        : allCategory?.name || humanize('all-products');

  const titleWords = categoryName.trim().split(/\s+/).filter(Boolean);
  const titleHead = titleWords.length > 1 ? titleWords[0] : '';
  const titleTail = titleWords.length > 1 ? titleWords.slice(1).join(' ') : titleWords[0] || '';

  // Rail: "All Products" first, then every backend category.
  const railItems = useMemo(
    () => [
      {
        slug: 'all-products',
        name: allCategory?.name || 'All Products',
        img: getCategoryImage(allCategory || { slug: 'all-products' }),
      },
      ...shopCategories
        .filter((c: any) => c.slug !== 'all-products')
        .map((c: any) => ({ slug: c.slug as string, name: c.name as string, img: getCategoryImage(c) })),
    ],
    [shopCategories, allCategory]
  );
  const isActiveSlug = (slug: string) =>
    slug === 'all-products' ? !categoryParam || categoryParam === 'all-products' : categoryParam === slug;

  /* ---------- filter tags ---------- */
  const chips = [
    ...selectedSizes.map((v) => ({ key: `s-${v}`, label: `Size: ${v}`, remove: () => toggleSize(v) })),
    ...selectedColors.map((v) => ({ key: `c-${v}`, label: v, remove: () => toggleColor(v) })),
    ...selectedFabrics.map((v) => ({ key: `f-${v}`, label: v, remove: () => toggleFabric(v) })),
    ...selectedCoverages.map((v) => ({ key: `cv-${v}`, label: `Coverage: ${v}`, remove: () => toggleCoverage(v) })),
    ...selectedFits.map((v) => ({ key: `fit-${v}`, label: v, remove: () => toggleFit(v) })),
    ...selectedCollections.map((k) => ({
      key: `col-${k}`,
      label: collectionOptions.find((o) => o.key === k)?.label || k,
      remove: () => toggleCollection(k),
    })),
    ...(inStockOnly ? [{ key: 'stock', label: 'In stock only', remove: () => setInStockOnly(false) }] : []),
    ...selectedAvail.map((k) => ({ key: `av-${k}`, label: AVAIL_LABEL[k], remove: () => toggleAvail(k) })),
    ...(priceActive
      ? [
          {
            key: 'price',
            label: `${formatINR(priceRange[0])} – ${formatINR(priceRange[1])}`,
            remove: () => setPriceRange([0, PRICE_MAX]),
          },
        ]
      : []),
  ] as { key: string; label: string; remove: () => void }[];

  const chipClass =
    'inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border border-[#d2d2d7]/45 bg-[#d2d2d7]/10 px-3 text-[12px] font-semibold text-[#f4f2ec] transition hover:border-[#d2d2d7]';

  /* ---------- shared filter pieces ---------- */
  const priceBlock = (
    <FilterSection title="Price range">
      <div className="px-1.5 pt-3">
        <PriceSlider value={priceRange} min={0} max={PRICE_MAX} onChange={setPriceRange} />
        <div className="mt-3 flex items-center gap-2">
          {(['Minimum', 'Maximum'] as const).map((which) => (
            <label
              key={which}
              className="flex h-11 min-w-0 flex-1 items-center gap-1 rounded-[10px] border border-white/10 bg-black/40 px-3 text-[13px] text-[#f4f2ec] focus-within:border-[#d2d2d7]"
            >
              <span className="text-[#BDB9B0]">₹</span>
              <input
                type="number"
                inputMode="numeric"
                aria-label={`${which} price`}
                min={0}
                max={PRICE_MAX}
                value={which === 'Minimum' ? priceRange[0] : priceRange[1]}
                onChange={(e) => (which === 'Minimum' ? setMinPrice(e.target.value) : setMaxPrice(e.target.value))}
                className="w-full min-w-0 bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </label>
          ))}
        </div>
      </div>
    </FilterSection>
  );

  const sizeBlock = (
    <FilterSection title="Size">
      <div className="flex flex-wrap gap-2">
        {allSizes.map((s) => {
          const st = sizeStats[s].state;
          const on = selectedSizes.includes(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              aria-label={`${s}, ${st === 'out' ? 'sold out' : st === 'low' ? 'low stock' : 'in stock'}`}
              onClick={() => onSizeClick(s)}
              className={cn(
                'relative h-11 min-w-[48px] rounded-[10px] border px-3 text-[13px] font-bold transition-all duration-200',
                on
                  ? 'border-white bg-white text-[#121214] ring-2 ring-[#E7C873] ring-offset-2 ring-offset-[#121214]'
                  : st === 'low'
                    ? 'border-amber-400/70 text-[#f4f2ec] hover:border-amber-300'
                    : st === 'out'
                      ? 'border-dashed border-white/25 text-white/55 hover:border-white/50'
                      : 'border-white/15 text-[#f4f2ec] hover:border-[#d2d2d7]',
                st === 'out' && 'line-through'
              )}
            >
              {s}
              {st === 'low' && <span aria-hidden className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />}
            </button>
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#BDB9B0]" aria-label="Size stock legend">
        <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-[3px] border border-white/40" />In stock</li>
        <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-[3px] border border-amber-400/80 bg-amber-400/30" />Low</li>
        <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-[3px] border border-dashed border-white/40" />Sold out</li>
      </ul>
      <div aria-live="polite" className="mt-2 space-y-1.5">
        {selectedSizes.map((s) => (
          <p
            key={s}
            className={cn(
              'text-[12px] leading-snug',
              sizeStats[s].state === 'low' ? 'text-[#fcd28a]' : sizeStats[s].state === 'out' ? 'text-[#ffb1a6]' : 'text-[#BDB9B0]'
            )}
          >
            {sizeMessage(s)}
          </p>
        ))}
      </div>
    </FilterSection>
  );

  const colorBlock = (
    <FilterSection title="Color">
      <div className="flex flex-wrap gap-2">
        {allColors.map((c) => {
          const on = selectedColors.includes(c.name);
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => toggleColor(c.name)}
              title={c.name}
              aria-label={c.name}
              aria-pressed={on}
              className="flex h-11 w-11 items-center justify-center"
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border border-white/30 transition-transform duration-200',
                  on ? 'scale-110 ring-2 ring-[#E7C873] ring-offset-2 ring-offset-[#121214]' : 'hover:scale-110'
                )}
                style={{ backgroundColor: c.hex }}
              >
                {on && (
                  <Check
                    className={cn(
                      'h-3.5 w-3.5 stroke-[3]',
                      c.name === 'White' || c.name === 'Beige' ? 'text-black' : 'text-white'
                    )}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </FilterSection>
  );

  const fitBlock = (
    <FilterSection title="Fit type">
      {allFits.map((f) => (
        <CheckRow
          key={f}
          label={f}
          count={facetCounts.byFit[f] ?? 0}
          checked={selectedFits.includes(f)}
          onClick={() => toggleFit(f)}
        />
      ))}
    </FilterSection>
  );

  const stockBlock = (
    <div className="flex min-h-[44px] items-center justify-between border-t border-white/[0.07] py-2">
      <span className="text-[13px] font-extrabold text-[#f4f2ec]" id="kv-stock-label">
        In stock only
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={inStockOnly}
        aria-labelledby="kv-stock-label"
        onClick={() => setInStockOnly((v) => !v)}
        className="flex h-11 w-14 items-center justify-center"
      >
        <span
          className={cn(
            'relative h-6 w-11 rounded-full border transition-colors',
            inStockOnly ? 'border-[#f6f6f8]/60' : 'border-white/20 bg-white/10'
          )}
          style={inStockOnly ? { background: 'var(--kv-chrome-metal)' } : undefined}
        >
          <span
            className={cn(
              'absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-all duration-300',
              inStockOnly ? 'left-[22px]' : 'left-0.5'
            )}
          />
        </span>
      </button>
    </div>
  );

  const availBlock = (
    <FilterSection title="Availability">
      {(['in', 'low', 'out'] as StockState[]).map((k) => (
        <CheckRow
          key={k}
          label={AVAIL_LABEL[k]}
          count={availCounts[k]}
          checked={selectedAvail.includes(k)}
          onClick={() => toggleAvail(k)}
        />
      ))}
    </FilterSection>
  );

  const extraBlocks = (
    <>
      <FilterSection title="Fabric" defaultOpen={false}>
        {allFabrics.map((f) => (
          <CheckRow
            key={f}
            label={f}
            count={facetCounts.byFabric[f] ?? 0}
            checked={selectedFabrics.includes(f)}
            onClick={() => toggleFabric(f)}
          />
        ))}
      </FilterSection>
      <FilterSection title="Print coverage" defaultOpen={false}>
        {allCoverages.map((c) => (
          <CheckRow key={c} label={c} checked={selectedCoverages.includes(c)} onClick={() => toggleCoverage(c)} />
        ))}
      </FilterSection>
      <FilterSection title="Collection" defaultOpen={false}>
        {collectionOptions.map((o) => (
          <CheckRow
            key={o.key}
            label={o.label}
            count={facetCounts.collections[o.key]}
            checked={selectedCollections.includes(o.key)}
            onClick={() => toggleCollection(o.key)}
          />
        ))}
      </FilterSection>
    </>
  );

  /* ---------- category chip (desktop rail) ---------- */
  const railChip = (c: { slug: string; name: string; img?: string }, i: number) => {
    const active = isActiveSlug(c.slug);
    const count = getCategoryCount(c.slug);
    return (
      <Link
        key={c.slug}
        href={`/shop?category=${encodeURIComponent(c.slug)}`}
        aria-current={active ? 'page' : undefined}
        style={{ ['--i' as string]: i }}
        className={cn(
          'kv-rise group inline-flex min-h-[48px] items-center gap-2.5 rounded-full border p-1 pr-3.5 transition-all duration-300 [transition-timing-function:var(--kv-ease)] hover:-translate-y-1',
          active
            ? 'kv-chrome-bg border-[#E7C873] text-[#0c0c0e] shadow-[0_0_0_1px_#E7C873]'
            : 'kv-panel text-[#f4f2ec] hover:border-[#d2d2d7]/50'
        )}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[#0d0d0f] text-[13px] font-bold text-[#d2d2d7]">
          {c.img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.img} alt="" className="h-full w-full object-cover" />
          ) : (
            c.name.charAt(0)
          )}
        </span>
        <span className="text-[13px] font-bold">{c.name}</span>
        {typeof count === 'number' && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-extrabold',
              active ? 'bg-black/80 text-[#d2d2d7]' : 'bg-white/10 text-[#d2d2d7]'
            )}
          >
            {count}
          </span>
        )}
      </Link>
    );
  };

  const sortSelect = (
    <div className="relative">
      <select
        aria-label="Sort products"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="h-11 min-w-[190px] cursor-pointer appearance-none rounded-[12px] border border-white/10 bg-[#161618] pl-3.5 pr-9 text-[13px] font-semibold text-[#f4f2ec] outline-none transition hover:border-[#d2d2d7] focus:border-[#d2d2d7]"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#161618] text-white">
            Sort by: {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#f4f2ec]" />
    </div>
  );

  const chromeBtn =
    'kv-chrome-bg kv-sheen inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-7 text-[11px] font-extrabold uppercase tracking-[0.18em] transition hover:brightness-110';
  const productHref = featured ? `/product/${featured.slug}` : '/shop';
  const featPrice = featured?.price as number | undefined;

  return (
    <div className="kv-shop relative min-h-screen w-full overflow-x-hidden pb-24 lg:pb-0">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {/* ============================ HERO ============================ */}
      <section aria-labelledby="kv-hero-title" className="relative isolate overflow-hidden">
        <span
          aria-hidden
          className="chrome-outline pointer-events-none absolute -top-4 left-1/2 -z-10 -translate-x-1/2 select-none whitespace-nowrap font-[family-name:var(--font-serif)] text-[clamp(120px,22vw,340px)] leading-none opacity-40"
        >
          KOVENIK
        </span>

        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-6 px-4 pb-14 pt-5 sm:px-8 lg:min-h-[560px] lg:grid-cols-[1fr_1fr] lg:gap-10 lg:px-12 lg:pb-16">
          <div>
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[12px] text-[#BDB9B0]">
              <Link href="/" className="transition hover:text-[#d2d2d7]">Home</Link>
              <ChevronRight className="h-3 w-3" aria-hidden />
              <Link href="/shop" className="transition hover:text-[#d2d2d7]">Shop</Link>
              {categoryName.trim() && (
                <>
                  <ChevronRight className="h-3 w-3" aria-hidden />
                  <span aria-current="page" className="font-semibold text-[#d2d2d7]">{categoryName}</span>
                </>
              )}
            </nav>

            <p className="mt-6 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#d2d2d7] sm:text-[11px]">
              <span className="h-px w-8 bg-[#d2d2d7]/70" aria-hidden />
              KÖVENIK · The category
            </p>

            <h1
              id="kv-hero-title"
              className="mt-3 font-[family-name:var(--font-unbounded)] text-[clamp(40px,9.5vw,104px)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em]"
            >
              {titleHead && <span className="block text-[#F4F2EC]">{titleHead}</span>}
              <span className="kv-chrome-text block">{titleTail}</span>
            </h1>

            <p className="mt-4 max-w-[430px] text-[14px] leading-relaxed text-[#BDB9B0] sm:text-[15px]">
              Premium men&apos;s clothing crafted for the bold. High-density fabrics, relaxed cuts, and minimalist
              luxury aesthetics.
            </p>

            {featured && (
              <Link
                href={productHref}
                className="mt-6 hidden max-w-[440px] items-center gap-4 rounded-[16px] border border-white/15 bg-white/[0.05] p-3 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,.14)] transition hover:border-[#d2d2d7]/50 lg:flex"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featured.images[0]} alt="" className="h-14 w-14 rounded-[10px] object-cover" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#d2d2d7]">
                    Featured drop
                  </span>
                  <span className="block truncate text-[14px] font-bold text-[#f4f2ec]">{featured.name}</span>
                  <span className="mt-0.5 block text-[13px] text-[#f4f2ec]">
                    {formatINR(featPrice || 0)}
                    {featured.mrp > featured.price && (
                      <span className="ml-2 text-[12px] text-[#A8A49B] line-through">{formatINR(featured.mrp)}</span>
                    )}
                    {featured.bestPrice > 0 && featured.bestPrice < featured.price && (
                      <span className="ml-2 text-[12px] font-semibold text-[#E7C873]">
                        Best {formatINR(featured.bestPrice)}
                      </span>
                    )}
                  </span>
                </span>
              </Link>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={productHref} className={chromeBtn}>
                Shop the drop <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setTeePaused(false)}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-white/20 px-6 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#f4f2ec] transition hover:border-[#d2d2d7] hover:text-[#d2d2d7]"
              >
                View in 360°
              </button>
            </div>

            <dl className="mt-8 hidden gap-10 lg:flex">
              {[
                [String(products.length || 24), 'Products'],
                [String(railItems.length), 'Categories'],
                ['2026', 'Est. India'],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="kv-chrome-text font-[family-name:var(--font-unbounded)] text-[26px] font-extrabold">{n}</dd>
                  <p aria-hidden className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#BDB9B0]">{l}</p>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative pb-6">
            <HeroTee
              front={teeFront}
              back={teeBack}
              printLabel={printLabel}
              paused={teePaused}
              onTogglePause={() => setTeePaused((p) => !p)}
            />
          </div>

          {featured && (
            <Link
              href={productHref}
              className="kv-panel flex items-center gap-3 rounded-[14px] p-2.5 lg:hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featured.images[0]} alt="" className="h-12 w-12 rounded-[8px] object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#d2d2d7]">
                  Featured drop
                </span>
                <span className="block truncate text-[13px] font-bold">{featured.name}</span>
                <span className="text-[12px] text-[#BDB9B0]">{formatINR(featPrice || 0)}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-[#d2d2d7]" aria-hidden />
            </Link>
          )}
        </div>
      </section>

      {/* ======================= CATEGORY RAIL ======================= */}
      <section aria-labelledby="kv-cat-title" className="mx-auto w-full max-w-[1440px] px-4 pb-8 sm:px-8 lg:px-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="kv-cat-title" className="font-[family-name:var(--font-serif)] text-[26px] font-semibold text-[#f4f2ec] sm:text-[30px]">
            Shop by category
          </h2>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#BDB9B0]" aria-live="polite">
            <span className="lg:hidden">{filtered.length} items</span>
            <span className="hidden lg:inline">
              Showing <span className="text-[#d2d2d7]">{categoryName.trim() || 'All Products'}</span>
            </span>
          </p>
        </div>

        {/* desktop chips */}
        <div className="kv-panel hidden flex-wrap gap-2.5 rounded-[20px] p-3 lg:flex">
          {railItems.map((c, i) => railChip(c, i))}
        </div>

        {/* mobile swipeable tiles */}
        <div className="kv-noscroll -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:hidden">
          {railItems.map((c, i) => {
            const active = isActiveSlug(c.slug);
            const count = getCategoryCount(c.slug);
            return (
              <Link
                key={c.slug}
                href={`/shop?category=${encodeURIComponent(c.slug)}`}
                aria-current={active ? 'page' : undefined}
                style={{ ['--i' as string]: i }}
                className={cn(
                  'kv-rise flex min-h-[44px] w-[92px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-[18px] border p-2.5 text-center transition',
                  active
                    ? 'kv-chrome-bg border-[#E7C873] shadow-[0_0_0_1px_#E7C873]'
                    : 'kv-panel text-[#f4f2ec]'
                )}
              >
                <span className="flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-[14px] border border-white/15 bg-[#0d0d0f] text-[18px] font-bold text-[#d2d2d7]">
                  {c.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.img} alt="" className="h-full w-full object-cover" />
                  ) : (
                    c.name.charAt(0)
                  )}
                </span>
                <span className="line-clamp-2 text-[11px] font-bold leading-tight">{c.name}</span>
                {typeof count === 'number' && (
                  <span
                    className={cn(
                      'rounded-full px-2 text-[10px] font-extrabold',
                      active ? 'bg-black/80 text-[#d2d2d7]' : 'bg-white/10 text-[#d2d2d7]'
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============== MOBILE TOOLBAR (filter + sort + tags) ============== */}
      <div className="px-4 sm:px-8 lg:hidden">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#d2d2d7]" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? 'Product' : 'Products'}
          {activeFilterCount > 0 && <span className="ml-2 text-[#BDB9B0]">{activeFilterCount} filters active</span>}
        </p>
        <div className="flex items-center gap-2">
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="kv-panel flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] text-[13px] font-bold text-[#f4f2ec]"
              >
                <SlidersHorizontal className="h-4 w-4 text-[#d2d2d7]" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="kv-chrome-bg flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-extrabold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="kv-shop flex max-h-[calc(100dvh-200px)] flex-col gap-0 rounded-t-[26px] border border-white/15 p-0 text-[#f4f2ec] backdrop-blur-2xl max-md:bottom-[88px]"
              style={{ background: 'linear-gradient(180deg, rgba(34,34,38,.94), rgba(14,14,16,.96))' }}
            >
              <SheetHeader className="shrink-0 border-b border-white/10 px-5 py-3 text-left">
                <SheetTitle className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#f4f2ec]">
                  <SlidersHorizontal className="h-4 w-4 text-[#d2d2d7]" />
                  Filters
                </SheetTitle>
              </SheetHeader>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-3">
                <p className="mb-2 text-[13px] font-extrabold">Category</p>
                <div className="kv-noscroll -mx-5 flex gap-2 overflow-x-auto px-5 pb-3">
                  {railItems.map((c, i) => {
                    const active = isActiveSlug(c.slug);
                    return (
                      <Link
                        key={c.slug}
                        href={`/shop?category=${encodeURIComponent(c.slug)}`}
                        onClick={() => setMobileFiltersOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        style={{ ['--i' as string]: i }}
                        className={cn(
                          'kv-rise inline-flex min-h-[44px] shrink-0 items-center rounded-full border px-4 text-[12px] font-bold',
                          active ? 'kv-chrome-bg border-[#E7C873]' : 'border-white/15 text-[#f4f2ec]'
                        )}
                      >
                        {c.name}
                      </Link>
                    );
                  })}
                </div>
                {priceBlock}
                {sizeBlock}
                {colorBlock}
                {fitBlock}
                {stockBlock}
                {availBlock}
              </div>

              <div className="grid shrink-0 grid-cols-[1fr_1.6fr] gap-3 border-t border-white/10 px-5 py-3">
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={activeFilterCount === 0}
                  className="flex h-12 items-center justify-center gap-1.5 rounded-full border border-white/20 text-[11px] font-extrabold uppercase tracking-[0.16em] disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="kv-chrome-bg kv-sheen h-12 rounded-full text-[11px] font-extrabold uppercase tracking-[0.16em]"
                >
                  Show {filtered.length} products
                </button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="relative flex-1">
            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="kv-panel h-12 w-full appearance-none rounded-[14px] pl-4 pr-9 text-[13px] font-bold text-[#f4f2ec] outline-none"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value} className="bg-[#161618]">
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          </div>
        </div>

        {chips.length > 0 && (
          <div className="kv-noscroll -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.remove}
                aria-label={`Remove filter ${chip.label}`}
                className={chipClass}
              >
                {chip.label}
                <X className="h-3.5 w-3.5 text-[#BDB9B0]" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="min-h-[36px] shrink-0 px-2 text-[12px] font-bold text-[#d2d2d7]"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ==================== SIDEBAR + PRODUCT AREA ==================== */}
      <div className="mx-auto flex w-full max-w-[1440px] items-start gap-6 px-4 py-6 sm:px-8 lg:gap-8 lg:px-12 lg:py-8">
        {/* Desktop sidebar */}
        <aside
          aria-label="Filters"
          className="kv-panel hidden w-[250px] shrink-0 rounded-[20px] px-4 pb-3 lg:sticky lg:top-[150px] lg:block xl:w-[270px]"
        >
          <div className="flex items-center justify-between pb-2 pt-4">
            <h2 className="flex items-center gap-2 text-[14px] font-extrabold text-[#f4f2ec]">
              <SlidersHorizontal className="h-4 w-4 text-[#d2d2d7]" />
              Filters
              {activeFilterCount > 0 && (
                <span className="kv-chrome-bg flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-extrabold">
                  {activeFilterCount}
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={clearAll}
              disabled={activeFilterCount === 0}
              className="min-h-[44px] px-1 text-[12px] font-semibold text-[#BDB9B0] transition hover:text-[#d2d2d7] disabled:opacity-50"
            >
              Clear all
            </button>
          </div>
          {priceBlock}
          {sizeBlock}
          {colorBlock}
          {fitBlock}
          {stockBlock}
          {availBlock}
          {extraBlocks}
        </aside>

        {/* Products */}
        <main className="min-w-0 flex-1" id="kv-products">
          <div className="mb-4 hidden flex-wrap items-center gap-3 lg:flex">
            <span className="mr-1 text-[13px] font-extrabold text-[#f4f2ec]" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? 'Product' : 'Products'}
            </span>
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.remove}
                aria-label={`Remove filter ${chip.label}`}
                className={chipClass}
              >
                {chip.label}
                <X className="h-3.5 w-3.5 text-[#BDB9B0]" />
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              {(['grid', 'list'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setViewMode(m)}
                  aria-label={m === 'grid' ? 'Grid view' : 'List view'}
                  aria-pressed={viewMode === m}
                  className={cn(
                    'inline-flex h-11 w-11 items-center justify-center rounded-[12px] border transition',
                    viewMode === m
                      ? 'border-[#d2d2d7] bg-[#d2d2d7]/10 text-[#d2d2d7]'
                      : 'border-white/10 text-[#f4f2ec] hover:border-[#d2d2d7]'
                  )}
                >
                  {m === 'grid' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                </button>
              ))}
              {sortSelect}
            </div>
          </div>

          {!isLoading && filtered.length === 0 ? (
            <div className="kv-panel flex min-h-[380px] flex-col items-center justify-center rounded-[20px] px-6 text-center">
              <Grid className="mb-4 h-9 w-9 stroke-[1] text-[#d2d2d7]" />
              <p className="font-[family-name:var(--font-serif)] text-2xl text-[#f4f2ec]">No products found</p>
              <p className="mb-6 mt-2 max-w-xs text-sm text-[#BDB9B0]">
                We couldn&apos;t find any items matching your selected criteria.
              </p>
              <button type="button" onClick={clearAll} className={chromeBtn}>
                Clear all filters
              </button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 lg:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="kv-panel aspect-[0.78] animate-pulse rounded-[18px]" />
              ))}
            </div>
          ) : (
            <div
              className={cn(
                'grid items-start gap-3 sm:gap-4 lg:gap-5',
                viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 xl:grid-cols-2'
              )}
            >
              {visible.map((p, i) => (
                <ShopProductCard
                  key={p.id}
                  product={p}
                  view={isDesktop ? viewMode : 'grid'}
                  index={i}
                  focusSizes={selectedSizes}
                  colorStatus={colorStatusOf(p)}
                  onRetryColors={retryColors}
                  onRefresh={(prod) => fetchFresh(prod)}
                  onToast={push}
                />
              ))}
            </div>
          )}

          {/* Progress + pagination */}
          {filtered.length > 0 && (
            <div className="mt-10 flex flex-col items-center gap-4">
              <div className="h-[3px] w-32 overflow-hidden rounded-full bg-white/10" aria-hidden>
                <div
                  className="h-full rounded-full transition-[width] duration-500 [transition-timing-function:var(--kv-ease)]"
                  style={{ width: `${progress * 100}%`, background: 'var(--kv-chrome-metal)' }}
                />
              </div>
              <p className="text-[12px] text-[#BDB9B0]">
                {isDesktop ? (
                  <>
                    Showing <b className="text-[#f4f2ec]">{rangeStart}–{rangeEnd}</b> of {filtered.length}
                  </>
                ) : (
                  <>
                    Showing <b className="text-[#f4f2ec]">{visible.length}</b> of {filtered.length}
                  </>
                )}
              </p>

              {isDesktop && totalPages > 1 && (
                <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-11 rounded-[12px] border border-white/10 px-5 text-[12px] font-bold text-[#f4f2ec] transition hover:border-[#d2d2d7] disabled:opacity-40"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Page ${i + 1}`}
                      aria-current={currentPage === i + 1 ? 'page' : undefined}
                      onClick={() => setCurrentPage(i + 1)}
                      className={cn(
                        'h-11 w-11 rounded-[12px] border text-[13px] font-extrabold transition',
                        currentPage === i + 1
                          ? 'kv-chrome-bg border-[#f6f6f8]/60'
                          : 'border-white/10 text-[#f4f2ec] hover:border-[#d2d2d7]'
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-11 rounded-[12px] border border-white/10 px-5 text-[12px] font-bold text-[#f4f2ec] transition hover:border-[#d2d2d7] disabled:opacity-40"
                  >
                    Next
                  </button>
                </nav>
              )}

              {!isDesktop && visible.length < filtered.length && (
                <button
                  type="button"
                  onClick={() => setMobileCount((c) => c + PER_PAGE)}
                  className="kv-panel h-[52px] w-full rounded-full border-[#d2d2d7]/50 text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#d2d2d7] transition hover:bg-[#d2d2d7]/10"
                >
                  Load more
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      <MobileShopBar variant="silver" />
    </div>
  );
}
