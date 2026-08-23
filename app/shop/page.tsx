'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X, ChevronDown, Star } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { products, categories } from '@/lib/data';
import type { ProductColor, ProductSize, FabricType, CoverageType, FitType } from '@/types';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { motion } from 'framer-motion';

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'newest', label: 'Newest' },
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

export default function ShopPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') as string | null;
  const fitParam = searchParams.get('fit') as string | null;

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

  const filtered = useMemo(() => {
    let result = [...products];

    if (categoryParam && categoryParam !== 'all-products') {
      if (categoryParam === 'plus-size') {
        result = result.filter((p) => p.sizes.includes('XXL'));
      } else {
        result = result.filter((p) => p.category === categoryParam);
      }
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
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Sort By</h3>
        <div className="space-y-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={cn(
                'block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
                sort === opt.value ? 'bg-ink text-cream' : 'hover:bg-muted',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Size</h3>
        <div className="flex flex-wrap gap-2">
          {allSizes.map((s) => (
            <button
              key={s}
              onClick={() => toggleSize(s)}
              className={cn(
                'w-10 h-10 rounded-lg text-sm font-medium border transition-all',
                selectedSizes.includes(s)
                  ? 'bg-ink text-cream border-ink'
                  : 'border-border hover:border-ink',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
            min={0}
            max={2000}
            step={100}
            className="mb-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatINR(priceRange[0])}</span>
            <span>{formatINR(priceRange[1])}</span>
          </div>
        </div>
      </div>

      {/* Color */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Color</h3>
        <div className="flex flex-wrap gap-2">
          {allColors.map((c) => (
            <button
              key={c.name}
              onClick={() => toggleColor(c.name)}
              title={c.name}
              className={cn(
                'w-8 h-8 rounded-full border-2 transition-all',
                selectedColors.includes(c.name) ? 'border-ink scale-110' : 'border-border',
              )}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      {/* Fabric */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Fabric</h3>
        <div className="space-y-1.5">
          {allFabrics.map((f) => (
            <label key={f} className="flex items-center gap-2 cursor-pointer">
              <button
                onClick={() => toggleFabric(f)}
                className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                  selectedFabrics.includes(f) ? 'bg-ink border-ink' : 'border-border',
                )}
              >
                {selectedFabrics.includes(f) && (
                  <svg className="w-3 h-3 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className="text-sm">{f}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Coverage */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Coverage</h3>
        <div className="flex flex-wrap gap-2">
          {allCoverages.map((c) => (
            <button
              key={c}
              onClick={() => toggleCoverage(c)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full border transition-all',
                selectedCoverages.includes(c)
                  ? 'bg-ink text-cream border-ink'
                  : 'border-border hover:border-ink',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Category/Fit */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Category</h3>
        <div className="flex flex-wrap gap-2">
          {allFits.map((f) => (
            <button
              key={f}
              onClick={() => toggleFit(f)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full border transition-all',
                selectedFits.includes(f)
                  ? 'bg-ink text-cream border-ink'
                  : 'border-border hover:border-ink',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button onClick={clearAll} variant="outline" className="w-full">
          Clear All ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="container-ardenby py-6 lg:py-10">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="font-display text-3xl lg:text-4xl font-bold">
          {activeCategory ? activeCategory.name : 'All Products'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {activeCategory ? activeCategory.desc : 'Browse the full collection'} · {filtered.length} products
        </p>
      </div>

      <div className="flex gap-8">
        {/* Desktop filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <FilterContent />
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter bar */}
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-ink text-cream text-[10px] rounded-full px-1.5 py-0.5">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
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
                className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
            </div>
          </div>

          {/* Grid */}
          {paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-lg font-medium mb-2">No products found</p>
              <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters</p>
              <Button onClick={clearAll} variant="outline">Clear Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {paged.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                    currentPage === i + 1 ? 'bg-ink text-cream' : 'hover:bg-muted',
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
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
