'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Grid,
  Check,
  LayoutGrid,
  List,
} from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { categories, products as staticProducts } from '@/lib/data';
import { apiUrl } from '@/lib/api-url';
import type { ProductColor, ProductSize, FabricType, CoverageType, FitType } from '@/types';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';

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
    colors:
      Array.isArray(product.colors) && product.colors.length > 0
        ? product.colors
        : Array.from(
            new Set(
              variants
                .map((variant: any) => variant.color)
                .filter(Boolean)
            )
          ),
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
    colors: Array.from(
      new Set(variants.map((variant) => variant.color).filter(Boolean))
    ),
  };
}

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

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

/* ------------------------------------------------------------------
   Design tokens (used as Tailwind arbitrary values below)
   bg page      #0a0a0a     panel      #111111     line   #262626
   gold         #f0b845     gold-soft  #c9962f     text   #f3ede2
   muted        #9a948a
------------------------------------------------------------------- */

function DynamicFilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#262626] py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-center justify-between text-left text-[12px] font-bold uppercase tracking-[0.06em] text-[#f3ede2]"
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-[#9a948a] transition-colors group-hover:text-[#f0b845]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#9a948a] transition-colors group-hover:text-[#f0b845]" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden pt-3.5"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Square checkbox used by Category + Fabric rows */
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
    <button onClick={onClick} className="group flex w-full items-center gap-3 py-1.5 text-left">
      <span
        className={cn(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[3px] border transition-colors',
          checked
            ? 'border-[#f0b845] bg-[#f0b845]'
            : 'border-[#4a4a46] bg-transparent group-hover:border-[#f0b845]'
        )}
      >
        {checked && <Check className="h-3 w-3 stroke-[3] text-black" />}
      </span>
      <span className="text-[13px] text-[#cfc9be] transition-colors group-hover:text-white">
        {label}
        {typeof count === 'number' && <span className="ml-1 text-[#9a948a]">({count})</span>}
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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [selectedColors, setSelectedColors] = useState<ProductColor[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<FabricType[]>([]);
  const [selectedCoverages, setSelectedCoverages] = useState<CoverageType[]>([]);
  const [selectedFits, setSelectedFits] = useState<FitType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const itemsPerPage = 12;

  useEffect(() => {
    if (fitParam) {
      setSelectedFits([fitParam as FitType]);
    }
  }, [fitParam]);

  const activeCategory = categories.find((c) => c.slug === categoryParam);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '1000',
        });

        if (categoryParam && categoryParam !== 'all-products' && categoryParam !== 'plus-size') {
          params.set('category', categoryParam);
        }

        const response = await fetch(apiUrl(`/api/products?${params.toString()}`), {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to load products');
        }

        const data = await response.json();
        const apiProducts: ApiProduct[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data?.data?.products)
              ? data.data.products
              : [];

        if (!cancelled) {
          const liveProducts = apiProducts.map(normalizeProduct);

          const staticProductsForCategory =
            categoryParam &&
            categoryParam !== 'all-products' &&
            categoryParam !== 'plus-size'
              ? staticProducts
                  .filter(
                    (product: any) =>
                      (product.category || product.category_slug) ===
                      categoryParam
                  )
                  .map(normalizeStaticProduct)
              : staticProducts.map(normalizeStaticProduct);

          const liveKeys = new Set(
            liveProducts.map(
              (product) => `${product.id}::${product.slug}`
            )
          );

          const fallbackProducts = staticProductsForCategory.filter(
            (product: any) =>
              !liveKeys.has(`${product.id}::${product.slug}`)
          );

          setProducts([...liveProducts, ...fallbackProducts]);
        }
      } catch (error) {
        console.error('Shop products API error:', error);
        if (!cancelled) {
          const staticProductsForCategory =
            categoryParam &&
            categoryParam !== 'all-products' &&
            categoryParam !== 'plus-size'
              ? staticProducts
                  .filter(
                    (product: any) =>
                      (product.category || product.category_slug) ===
                      categoryParam
                  )
                  .map(normalizeStaticProduct)
              : staticProducts.map(normalizeStaticProduct);

          setProducts(staticProductsForCategory);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [categoryParam]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (categoryParam === 'plus-size') {
      result = result.filter((p) => p.sizes.includes('XXL'));
    }

    if (selectedSizes.length > 0) {
      result = result.filter((p) => selectedSizes.some((s) => p.sizes.includes(s)));
    }
    if (selectedColors.length > 0) {
      result = result.filter((p) => selectedColors.some((c) => p.colors.includes(c)));
    }
    if (selectedFabrics.length > 0) {
      result = result.filter((p) => selectedFabrics.includes(p.fabric));
    }
    if (selectedCoverages.length > 0) {
      result = result.filter((p) => selectedCoverages.includes(p.coverage));
    }
    if (selectedFits.length > 0) {
      result = result.filter((p) => selectedFits.includes(p.fit));
    }

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
      default:
        result.sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller));
    }

    return result;
  }, [
    products,
    categoryParam,
    selectedSizes,
    selectedColors,
    selectedFabrics,
    selectedCoverages,
    selectedFits,
    priceRange,
    sort,
  ]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const rangeEnd = Math.min(currentPage * itemsPerPage, filtered.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryParam, selectedSizes, selectedColors, selectedFabrics, selectedCoverages, selectedFits, priceRange, sort]);

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

  const clearAll = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedFabrics([]);
    setSelectedCoverages([]);
    setSelectedFits([]);
    setPriceRange([0, 2000]);
  };

  const activeFilterCount =
    selectedSizes.length +
    selectedColors.length +
    selectedFabrics.length +
    selectedCoverages.length +
    selectedFits.length +
    (priceRange[0] !== 0 || priceRange[1] !== 2000 ? 1 : 0);

  const pillClass = (active: boolean, round = 'rounded-md') =>
    cn(
      'border px-3.5 py-1.5 text-[12px] transition-all duration-200',
      round,
      active
        ? 'border-[#f0b845] bg-[#f0b845] font-semibold text-black'
        : 'border-[#3a3a37] bg-transparent text-[#d8d2c7] hover:border-[#f0b845] hover:text-white'
    );

  // NOTE: kept as a plain JSX value (not an inner component) so that
  // collapsible sections keep their open/closed state when a filter is clicked.
  const filterContent = (
    <div>
      {/* Sizes */}
      <DynamicFilterSection title="Sizes">
        <div className="flex flex-wrap gap-2">
          {allSizes.map((s) => (
            <button
              key={s}
              onClick={() => toggleSize(s)}
              className={cn(
                'h-9 min-w-[40px] rounded-[4px] border px-2.5 text-[12px] font-semibold transition-all duration-200',
                selectedSizes.includes(s)
                  ? 'border-[#f0b845] bg-[#f0b845] text-black'
                  : 'border-[#3a3a37] bg-transparent text-[#d8d2c7] hover:border-[#f0b845]'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </DynamicFilterSection>

      {/* Price */}
      <DynamicFilterSection title="Price Range">
        <div className="px-1 pt-1">
          <Slider
            value={priceRange}
            onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
            min={0}
            max={2000}
            step={100}
            className="mb-4 [&_[class*='bg-primary']]:bg-[#f0b845] [&_[class*='bg-secondary']]:bg-[#34342f] [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-[#f0b845] [&_[role=slider]]:bg-[#f0b845]"
          />
          <div className="flex items-center justify-between text-[12px] text-[#cfc9be]">
            <span>{formatINR(priceRange[0])}</span>
            <span>{formatINR(priceRange[1])}</span>
          </div>
        </div>
      </DynamicFilterSection>

      {/* Colors */}
      <DynamicFilterSection title="Colors">
        <div className="flex flex-wrap gap-3">
          {allColors.map((c) => (
            <button
              key={c.name}
              onClick={() => toggleColor(c.name)}
              title={c.name}
              aria-label={c.name}
              className={cn(
                'relative flex h-[26px] w-[26px] items-center justify-center rounded-full border border-white/20 transition-transform duration-200',
                selectedColors.includes(c.name)
                  ? 'scale-110 ring-2 ring-[#f0b845] ring-offset-2 ring-offset-[#0a0a0a]'
                  : 'hover:scale-110'
              )}
              style={{ backgroundColor: c.hex }}
            >
              {selectedColors.includes(c.name) && (
                <Check
                  className={cn(
                    'h-3.5 w-3.5 stroke-[3]',
                    c.name === 'White' || c.name === 'Beige' ? 'text-black' : 'text-white'
                  )}
                />
              )}
            </button>
          ))}
        </div>
      </DynamicFilterSection>

      {/* Fabric */}
      <DynamicFilterSection title="Fabric Type">
        <div>
          {allFabrics.map((f) => (
            <CheckRow
              key={f}
              label={f}
              checked={selectedFabrics.includes(f)}
              onClick={() => toggleFabric(f)}
            />
          ))}
        </div>
      </DynamicFilterSection>

      {/* Coverage */}
      <DynamicFilterSection title="Print Coverage">
        <div className="flex flex-wrap gap-2">
          {allCoverages.map((c) => (
            <button
              key={c}
              onClick={() => toggleCoverage(c)}
              className={pillClass(selectedCoverages.includes(c), 'rounded-md')}
            >
              {c}
            </button>
          ))}
        </div>
      </DynamicFilterSection>

      {/* Fit */}
      <DynamicFilterSection title="Fit Type">
        <div className="flex flex-wrap gap-2">
          {allFits.map((f) => (
            <button
              key={f}
              onClick={() => toggleFit(f)}
              className={pillClass(selectedFits.includes(f), 'rounded-full')}
            >
              {f}
            </button>
          ))}
        </div>
      </DynamicFilterSection>

      {activeFilterCount > 0 && (
        <div className="pt-5">
          <Button
            onClick={clearAll}
            variant="outline"
            className="w-full gap-2 rounded-md border-[#f0b845]/60 bg-transparent text-[12px] font-semibold uppercase tracking-wider text-[#f0b845] transition-all hover:bg-[#f0b845] hover:text-black"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters ({activeFilterCount})
          </Button>
        </div>
      )}
    </div>
  );

  const sortSelect = (compact = false) => (
    <div className={cn('relative', compact && 'min-w-0 flex-1')}>
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className={cn(
          'cursor-pointer appearance-none rounded-md border border-[#3a3a37] bg-[#111111] text-[#f3ede2] outline-none transition hover:border-[#f0b845] focus:border-[#f0b845]',
          compact ? 'h-11 w-full pl-3.5 pr-9 text-[14px]' : 'h-10 min-w-[150px] pl-3 pr-9 text-[13px]'
        )}
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#111111] text-white">
            {compact ? `Sort: ${opt.label}` : opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#f3ede2]" />
    </div>
  );

  const navPill = (active: boolean) =>
    cn(
      'shrink-0 rounded-md border px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] transition-all',
      active
        ? 'border-[#f0b845] bg-[#f0b845] text-black'
        : 'border-[#34342f] bg-[#101010]/80 text-[#e9e3d8] hover:border-[#f0b845] hover:text-[#f0b845]'
    );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0a0a0a] text-[#f3ede2]">
      {/* ============================================================
          PRODUCT-CARD VISUAL SYSTEM
          ProductCard component / data / actions are NOT replaced.
          These styles only restyle its rendered output inside this grid.
      ============================================================ */}
      <style jsx global>{`
        [data-kevonik-product-grid] > * {
          min-width: 0 !important;
          background: #111111 !important;
          border: 1px solid #262626 !important;
          border-radius: 6px !important;
          box-shadow: none !important;
          overflow: hidden !important;
          padding-bottom: 14px !important;
        }

        /* text area: breathing room inside the card border (image stays full-bleed) */
        [data-kevonik-product-grid] > *
          > :not(:has([class*='aspect-'])):not([class*='aspect-']):not([class*='absolute']),
        [data-kevonik-product-grid] > * > a
          > :not(:has([class*='aspect-'])):not([class*='aspect-']):not([class*='absolute']) {
          padding: 12px 14px 0 !important;
        }

        /* readable text on dark */
        [data-kevonik-product-grid] > * h1,
        [data-kevonik-product-grid] > * h2,
        [data-kevonik-product-grid] > * h3,
        [data-kevonik-product-grid] > * h4 {
          color: #f3ede2 !important;
          opacity: 1 !important;
          font-size: 14px !important;
          line-height: 1.35 !important;
          font-weight: 400 !important;
        }
        [data-kevonik-product-grid] > * p,
        [data-kevonik-product-grid] > * span,
        [data-kevonik-product-grid] > * div {
          color: #e6e0d4;
          opacity: 1 !important;
        }
        [data-kevonik-product-grid] > * [class*='line-through'] {
          color: #8d877c !important;
        }
        [data-kevonik-product-grid] > * [class*='text-green'],
        [data-kevonik-product-grid] > * [class*='text-emerald'] {
          color: #22c55e !important;
        }
        [data-kevonik-product-grid] > * a {
          color: inherit !important;
          text-decoration: none !important;
        }

        /* image: fill the card's own image box (no white gap) */
        [data-kevonik-product-grid] > * [class*='aspect-'] {
          background: #161614 !important;
          border-radius: 0 !important;
        }
        [data-kevonik-product-grid] > * img {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0 !important;
        }

        /* white badges (BESTSELLER etc.) -> gold with black text */
        [data-kevonik-product-grid] > * span[class*='bg-white'],
        [data-kevonik-product-grid] > * div[class*='bg-white']:not([class*='aspect-']) {
          background: #f0b845 !important;
          border-radius: 3px !important;
        }
        [data-kevonik-product-grid] > * span[class*='bg-white'],
        [data-kevonik-product-grid] > * span[class*='bg-white'] * {
          color: #000 !important;
        }

        /* Add to cart -> outlined gold */
        [data-kevonik-product-grid] > * button[class*='bg-neutral'],
        [data-kevonik-product-grid] > * button[class*='bg-black'],
        [data-kevonik-product-grid] > * button[class*='bg-primary'],
        [data-kevonik-product-grid] > * button[class*='bg-stone'] {
          color: #f0b845 !important;
          border: 1px solid #b98b3f !important;
          background: #1a1508 !important;
          border-radius: 4px !important;
          font-weight: 600 !important;
        }
        [data-kevonik-product-grid] > * button[class*='bg-neutral'] *,
        [data-kevonik-product-grid] > * button[class*='bg-black'] * {
          color: inherit !important;
        }
        [data-kevonik-product-grid] > * button[class*='bg-neutral']:hover,
        [data-kevonik-product-grid] > * button[class*='bg-black']:hover,
        [data-kevonik-product-grid] > * button[class*='bg-primary']:hover {
          background: #f0b845 !important;
          color: #000 !important;
        }

        @media (max-width: 767px) {
          [data-kevonik-product-grid] > * h1,
          [data-kevonik-product-grid] > * h2,
          [data-kevonik-product-grid] > * h3,
          [data-kevonik-product-grid] > * h4 {
            font-size: 14px !important;
            line-height: 1.3 !important;
            font-weight: 500 !important;
          }
          /* rating / best-price / small meta text: bump up from tiny sizes */
          [data-kevonik-product-grid] > * [class*='text-xs']:not([class*='uppercase']),
          [data-kevonik-product-grid] > * [class*='text-[10px]']:not([class*='uppercase']),
          [data-kevonik-product-grid] > * [class*='text-[11px]']:not([class*='uppercase']),
          [data-kevonik-product-grid] > * [class*='text-[9px]']:not([class*='uppercase']) {
            font-size: 13px !important;
          }
          [data-kevonik-product-grid] > * [class*='line-through'] {
            font-size: 13px !important;
          }
          [data-kevonik-product-grid] > * button[class*='bg-neutral'],
          [data-kevonik-product-grid] > * button[class*='bg-black'] {
            min-height: 42px !important;
            font-size: 13px !important;
          }
          [data-kevonik-product-grid] > *
            > :not(:has([class*='aspect-'])):not([class*='aspect-']):not([class*='absolute']),
          [data-kevonik-product-grid] > * > a
            > :not(:has([class*='aspect-'])):not([class*='aspect-']):not([class*='absolute']) {
            padding: 14px 12px 0 !important;
          }
        }
      `}</style>

      {/* ============================================================
          COLLECTION HEADER
          ============================================================ */}
      <section className="relative overflow-hidden border-b border-[#262626] bg-[#0a0a0a]">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-[position:70%_20%] opacity-60"
          style={{
            backgroundImage: paged[0]?.images?.[0]
              ? `linear-gradient(90deg,rgba(10,10,10,1) 0%,rgba(10,10,10,.82) 38%,rgba(10,10,10,.25) 100%), url("${paged[0].images[0]}")`
              : 'linear-gradient(90deg,#0a0a0a,#1a1408)',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(240,184,69,0.18),transparent_40%)]" />

        <div className="relative mx-auto w-full max-w-[1920px] px-4 pb-5 pt-6 sm:px-6 lg:px-8 lg:pb-8 lg:pt-10 xl:px-10">
          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.42em] text-[#e9e3d8]/80 md:mb-4 md:text-[13px] md:tracking-[0.5em]">
                Luxury Streetwear
              </div>

              <h1 className="font-serif text-[32px] font-bold leading-[1.05] tracking-[-0.01em] text-[#f6f0e4] sm:text-5xl md:uppercase lg:text-[64px] lg:tracking-[0.01em]">
                {activeCategory ? activeCategory.name : 'All Products'}
              </h1>

              <p className="mt-2 max-w-xl text-[12px] text-[#e9e3d8]/80 sm:text-sm md:mt-3 md:text-base">
                {activeCategory ? activeCategory.desc : 'Premium essentials for a bolder you.'}
              </p>
            </div>

            <div
              aria-hidden
              className="mr-6 hidden shrink-0 flex-col gap-1.5 text-[12px] font-medium uppercase tracking-[0.6em] text-[#e9e3d8]/70 xl:flex"
            >
              <span>Wear</span>
              <span>Your</span>
              <span>Essence</span>
            </div>
          </div>

          {/* Collection navigation */}
          <div className="mt-6 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] md:mt-8 [&::-webkit-scrollbar]:hidden">
            <a
              href="/shop?category=all-products"
              className={navPill(!categoryParam || categoryParam === 'all-products')}
            >
              All
            </a>

            {categories.map((category: any) => (
              <a
                key={category.slug}
                href={`/shop?category=${category.slug}`}
                className={navPill(categoryParam === category.slug)}
              >
                {category.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          MOBILE FILTER + SORT BAR
          ============================================================ */}
      <div className="border-b border-[#262626] bg-[#0a0a0a] lg:hidden">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6">
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-11 flex-1 justify-center rounded-md border-[#f0b845]/70 bg-transparent px-4 text-[14px] font-medium text-[#f3ede2] hover:bg-[#1a1508] hover:text-[#f0b845]"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4 text-[#f0b845]" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f0b845] px-1 text-[10px] font-bold text-black">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-[86vw] max-w-[360px] overflow-y-auto border-r border-[#262626] bg-[#0a0a0a] text-[#f3ede2]"
            >
              <SheetHeader className="border-b border-[#262626] pb-4">
                <div className="flex items-center justify-between pr-6">
                  <SheetTitle className="text-sm font-bold uppercase tracking-[0.08em] text-[#f3ede2]">
                    Filters
                  </SheetTitle>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAll}
                      className="flex items-center gap-1.5 text-[12px] font-medium text-[#f0b845]"
                    >
                      Clear All
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </SheetHeader>

              <div className="mt-1">{filterContent}</div>
            </SheetContent>
          </Sheet>

          {sortSelect(true)}
        </div>
      </div>

      {/* ============================================================
          ACTIVE FILTER CHIPS
          ============================================================ */}
      {activeFilterCount > 0 && (
        <div className="border-b border-[#262626] bg-[#0a0a0a]">
          <div className="mx-auto flex max-w-[1920px] flex-wrap items-center gap-2 px-4 py-3 sm:px-6 lg:px-8 xl:px-10">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9a948a]">
              Filters
            </span>

            {(
              [
                ...selectedSizes.map((v) => ({ key: `s-${v}`, label: `Size: ${v}`, remove: () => toggleSize(v) })),
                ...selectedColors.map((v) => ({ key: `c-${v}`, label: `Color: ${v}`, remove: () => toggleColor(v) })),
                ...selectedFabrics.map((v) => ({ key: `f-${v}`, label: `Fabric: ${v}`, remove: () => toggleFabric(v) })),
                ...selectedCoverages.map((v) => ({ key: `cv-${v}`, label: `Coverage: ${v}`, remove: () => toggleCoverage(v) })),
                ...selectedFits.map((v) => ({ key: `fit-${v}`, label: `Fit: ${v}`, remove: () => toggleFit(v) })),
              ] as { key: string; label: string; remove: () => void }[]
            ).map((chip) => (
              <button
                key={chip.key}
                onClick={chip.remove}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#4a3d20] bg-[#14110a] px-3 py-1.5 text-[12px] text-[#f0b845] transition hover:border-[#f0b845]"
              >
                {chip.label}
                <X className="h-3 w-3 text-[#9a948a]" />
              </button>
            ))}

            {(priceRange[0] !== 0 || priceRange[1] !== 2000) && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#4a3d20] bg-[#14110a] px-3 py-1.5 text-[12px] text-[#f0b845]">
                Price: {formatINR(priceRange[0])} - {formatINR(priceRange[1])}
              </span>
            )}

            <button
              onClick={clearAll}
              className="ml-auto text-[12px] font-semibold text-[#f0b845] hover:text-[#ffd27a]"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          SHOP BODY
          ============================================================ */}
      <div className="mx-auto flex w-full max-w-[1920px] items-stretch">
        {/* Desktop filter sidebar */}
        <aside className="hidden w-[270px] shrink-0 border-r border-[#262626] lg:block xl:w-[285px]">
          <div className="px-6 pb-10 pt-6">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#f3ede2]">
                Filters
              </h2>

              <button
                onClick={clearAll}
                disabled={activeFilterCount === 0}
                className="flex items-center gap-1.5 text-[12px] font-medium italic text-[#f0b845] transition hover:text-[#ffd27a] disabled:opacity-40"
              >
                Clear All
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>

            {filterContent}
          </div>
        </aside>

        {/* Products */}
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-6 lg:py-6 xl:px-8">
          <p className="mb-4 whitespace-nowrap text-[13px] text-[#cfc9be] lg:hidden">
            <span className="font-semibold text-[#f3ede2]">{filtered.length}</span> products
          </p>

          {/* Desktop result toolbar */}
          <div className="mb-5 hidden items-center justify-between lg:flex">
            <p className="text-[13px] text-[#e9e3d8]">
              Showing {rangeStart}–{rangeEnd} of {filtered.length} products
            </p>

            <div className="flex items-center gap-3">
              <span className="text-[13px] text-[#cfc9be]">Sort by:</span>
              {sortSelect()}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-md border transition',
                    viewMode === 'grid'
                      ? 'border-[#f0b845] bg-[#f0b845] text-black'
                      : 'border-[#3a3a37] text-[#cfc9be] hover:border-[#f0b845]'
                  )}
                >
                  <LayoutGrid className="h-[18px] w-[18px]" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-md border transition',
                    viewMode === 'list'
                      ? 'border-[#f0b845] bg-[#f0b845] text-black'
                      : 'border-[#3a3a37] text-[#cfc9be] hover:border-[#f0b845]'
                  )}
                >
                  <List className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>
          </div>

          {!isLoading && paged.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex min-h-[430px] flex-col items-center justify-center rounded-md border border-dashed border-[#3a3a37] bg-[#111111] px-6 text-center"
            >
              <Grid className="mb-5 h-10 w-10 stroke-[1] text-[#f0b845]" />

              <p className="font-serif text-2xl text-[#f3ede2]">No products found</p>

              <p className="mb-7 mt-2 max-w-xs text-sm text-[#9a948a]">
                We couldn't find any items matching your selected criteria.
              </p>

              <Button
                onClick={clearAll}
                className="rounded-md bg-[#f0b845] px-7 text-[12px] font-semibold uppercase tracking-[0.12em] text-black hover:bg-[#ffd27a]"
              >
                Clear All Filters
              </Button>
            </motion.div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[0.7] animate-pulse rounded-md border border-[#262626] bg-[#111111]"
                />
              ))}
            </div>
          ) : (
            <motion.div
              layout
              data-kevonik-product-grid
              className={cn(
                'grid gap-3 sm:gap-4 xl:gap-5',
                viewMode === 'grid'
                  ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
              )}
            >
              <AnimatePresence>
                {paged.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2 border-t border-[#262626] pt-7">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-md border-[#3a3a37] bg-transparent px-4 text-[12px] font-medium text-[#e9e3d8] hover:bg-[#f0b845] hover:text-black disabled:opacity-40"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-md text-[12px] font-semibold transition-all',
                      currentPage === i + 1
                        ? 'bg-[#f0b845] text-black'
                        : 'text-[#9a948a] hover:bg-[#1a1a18] hover:text-[#f0b845]'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-md border-[#3a3a37] bg-transparent px-4 text-[12px] font-medium text-[#e9e3d8] hover:bg-[#f0b845] hover:text-black disabled:opacity-40"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}