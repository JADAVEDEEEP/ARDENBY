'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Grid,
  Check,
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
  { value: 'featured', label: 'Featured Drops' },
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

// Dynamic Collapsible Component
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
    <div className="border-b border-stone-200/80 pb-5 pt-2 transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left font-serif text-sm font-medium tracking-wide text-neutral-900 group"
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden pt-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ShopClient() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') as string | null;
  const fitParam = searchParams.get('fit') as string | null;

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState('featured');
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
  }, [categoryParam, selectedSizes, selectedColors, selectedFabrics, selectedCoverages, selectedFits, priceRange, sort]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  const FilterContent = () => (
    <div className="space-y-1">
      {/* Size Filter */}
      <DynamicFilterSection title="SIZES">
        <div className="flex flex-wrap gap-2">
          {allSizes.map((s) => (
            <button
              key={s}
              onClick={() => toggleSize(s)}
              className={cn(
                'min-w-[38px] h-9 px-2.5 rounded-md text-xs font-semibold tracking-wider transition-all duration-200 border',
                selectedSizes.includes(s)
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-white text-neutral-700 border-stone-300 hover:border-neutral-900'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </DynamicFilterSection>

      {/* Price Filter */}
      <DynamicFilterSection title="PRICE RANGE">
        <div className="px-1 pt-2">
          <Slider
            value={priceRange}
            onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
            min={0}
            max={2000}
            step={100}
            className="mb-4"
          />
          <div className="flex items-center justify-between font-mono text-xs text-neutral-600 bg-stone-100 px-3 py-1.5 rounded-md">
            <span>{formatINR(priceRange[0])}</span>
            <span className="text-neutral-400">—</span>
            <span>{formatINR(priceRange[1])}</span>
          </div>
        </div>
      </DynamicFilterSection>

      {/* Color Filter */}
      <DynamicFilterSection title="COLORS">
        <div className="flex flex-wrap gap-2.5">
          {allColors.map((c) => (
            <button
              key={c.name}
              onClick={() => toggleColor(c.name)}
              title={c.name}
              className={cn(
                'relative w-7 h-7 rounded-full border transition-transform duration-200 flex items-center justify-center',
                selectedColors.includes(c.name) ? 'scale-110 ring-2 ring-neutral-900 ring-offset-2' : 'hover:scale-105 border-black/10'
              )}
              style={{ backgroundColor: c.hex }}
            >
              {selectedColors.includes(c.name) && (
                <Check
                  className={cn(
                    'h-3.5 w-3.5',
                    c.name === 'White' || c.name === 'Beige' ? 'text-black' : 'text-white'
                  )}
                />
              )}
            </button>
          ))}
        </div>
      </DynamicFilterSection>

      {/* Fabric Filter */}
      <DynamicFilterSection title="FABRIC TYPE">
        <div className="space-y-2">
          {allFabrics.map((f) => (
            <button
              key={f}
              onClick={() => toggleFabric(f)}
              className="flex items-center justify-between w-full text-left py-1 group"
            >
              <span className="text-xs text-neutral-700 group-hover:text-neutral-900">{f}</span>
              <div
                className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                  selectedFabrics.includes(f) ? 'bg-neutral-900 border-neutral-900' : 'border-stone-300'
                )}
              >
                {selectedFabrics.includes(f) && <Check className="h-3 w-3 text-white" />}
              </div>
            </button>
          ))}
        </div>
      </DynamicFilterSection>

      {/* Coverage Filter */}
      <DynamicFilterSection title="PRINT COVERAGE">
        <div className="flex flex-wrap gap-2">
          {allCoverages.map((c) => (
            <button
              key={c}
              onClick={() => toggleCoverage(c)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-full border transition-all duration-200',
                selectedCoverages.includes(c)
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-700 border-stone-300 hover:border-neutral-900'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </DynamicFilterSection>

      {/* Fit / Silhouette Filter */}
      <DynamicFilterSection title="FIT & CATEGORY">
        <div className="flex flex-wrap gap-2">
          {allFits.map((f) => (
            <button
              key={f}
              onClick={() => toggleFit(f)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-full border transition-all duration-200',
                selectedFits.includes(f)
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-700 border-stone-300 hover:border-neutral-900'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </DynamicFilterSection>

      {activeFilterCount > 0 && (
        <div className="pt-4">
          <Button
            onClick={clearAll}
            variant="outline"
            className="w-full text-xs uppercase tracking-widest border-stone-300 hover:bg-neutral-900 hover:text-white transition-all duration-300 gap-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters ({activeFilterCount})
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-[1480px] mx-auto px-5 sm:px-8 lg:px-12 py-8 lg:py-14 bg-[#FAF9F6]">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-stone-200 pb-8 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-3">
            <Sparkles className="h-3 w-3 text-amber-500" /> Catalog Lookbook
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-neutral-900 tracking-tight">
            {activeCategory ? activeCategory.name : 'All Collections'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 font-light max-w-lg">
            {activeCategory ? activeCategory.desc : 'Explore our range of oversized heavyweights and essentials.'}
          </p>
        </div>

        <div className="mt-6 md:mt-0 flex items-center gap-4">
          {/* Desktop Sort Dropdown */}
          <div className="relative hidden lg:block">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none bg-white border border-stone-300 text-neutral-900 text-xs font-semibold uppercase tracking-wider rounded-lg pl-4 pr-10 py-3 cursor-pointer focus:outline-none focus:ring-1 focus:ring-black transition-all"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-neutral-500" />
          </div>

          <div className="text-xs text-neutral-400 font-mono">
            Showing <span className="font-bold text-neutral-900">{filtered.length}</span> pieces
          </div>
        </div>
      </div>

      {/* Dynamic Active Filters Bar */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8 p-3 bg-stone-100/70 rounded-lg border border-stone-200">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mr-2">Active Filters:</span>
          {selectedSizes.map((s) => (
            <button
              key={s}
              onClick={() => toggleSize(s)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-stone-300 rounded-full text-[11px] font-medium text-neutral-800 hover:border-black transition-all"
            >
              Size: {s} <X className="h-3 w-3 text-neutral-400" />
            </button>
          ))}
          {selectedColors.map((c) => (
            <button
              key={c}
              onClick={() => toggleColor(c)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-stone-300 rounded-full text-[11px] font-medium text-neutral-800 hover:border-black transition-all"
            >
              Color: {c} <X className="h-3 w-3 text-neutral-400" />
            </button>
          ))}
          {selectedFabrics.map((f) => (
            <button
              key={f}
              onClick={() => toggleFabric(f)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-stone-300 rounded-full text-[11px] font-medium text-neutral-800 hover:border-black transition-all"
            >
              Fabric: {f} <X className="h-3 w-3 text-neutral-400" />
            </button>
          ))}
          {selectedFits.map((f) => (
            <button
              key={f}
              onClick={() => toggleFit(f)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-stone-300 rounded-full text-[11px] font-medium text-neutral-800 hover:border-black transition-all"
            >
              Fit: {f} <X className="h-3 w-3 text-neutral-400" />
            </button>
          ))}
          <button
            onClick={clearAll}
            className="text-[11px] font-semibold uppercase tracking-wider text-red-600 hover:underline ml-auto"
          >
            Clear All
          </button>
        </div>
      )}

      <div className="flex gap-10">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-28 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 pb-2 border-b border-stone-200">
              Filter Options
            </h2>
            <FilterContent />
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Mobile Filter & Sort Controls Bar */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs uppercase tracking-wider">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter Selection
                  {activeFilterCount > 0 && (
                    <span className="bg-neutral-900 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[310px] overflow-y-auto bg-[#FAF9F6]">
                <SheetHeader>
                  <SheetTitle className="font-serif text-lg font-normal">Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>

            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none bg-white border border-stone-300 text-neutral-900 text-xs font-semibold uppercase tracking-wider rounded-lg pl-3 pr-8 py-2 focus:outline-none"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-neutral-500" />
            </div>
          </div>

          {/* Dynamic Grid Layout */}
          {!isLoading && paged.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-stone-300 rounded-2xl bg-white/50"
            >
              <Grid className="h-10 w-10 text-neutral-300 mb-4 stroke-[1.2]" />
              <p className="font-serif text-xl font-normal text-neutral-900 mb-1">No products found</p>
              <p className="text-xs text-neutral-500 mb-6 max-w-xs">
                We couldn't find any items matching your selected criteria.
              </p>
              <Button
                onClick={clearAll}
                className="bg-neutral-900 text-white hover:bg-neutral-800 text-xs uppercase tracking-widest px-6 py-2.5 rounded-full"
              >
                Clear All Filters
              </Button>
            </motion.div>
          ) : isLoading ? (
            <div className="min-h-[300px]" />
          ) : (
            <motion.div layout className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              <AnimatePresence>
                {paged.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-16 pt-8 border-t border-stone-200">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-medium uppercase tracking-wider"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </Button>
              <div className="flex items-center gap-1.5 px-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      'w-8 h-8 rounded-full text-xs font-semibold transition-all duration-200',
                      currentPage === i + 1
                        ? 'bg-neutral-900 text-white shadow-md'
                        : 'text-neutral-600 hover:bg-stone-200'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-medium uppercase tracking-wider"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}