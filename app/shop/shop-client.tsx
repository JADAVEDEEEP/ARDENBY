'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  RotateCcw,
  Grid,
  Check,
  Heart,
  ShoppingCart,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useWishlistStore } from '@/store/wishlist-store';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';
import { WishlistLoginModal } from '@/components/product/product-card';
import { products as staticProducts } from '@/lib/data';
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

/* Total sellable quantity: sum of variant inventory when variants carry it,
   otherwise the product-level inventory. Read-only helper for filtering. */
function getStockQty(p: any): number {
  const variants = Array.isArray(p.variants) ? p.variants : [];
  const withInventory = variants.filter(
    (v: any) => v && v.inventory !== undefined && v.inventory !== null && v.inventory !== ''
  );
  if (withInventory.length > 0) {
    return withInventory.reduce((sum: number, v: any) => sum + Number(v.inventory || 0), 0);
  }
  return Number(p.inventory || 0);
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
   Design tokens (Tailwind arbitrary values below)
   page      #031A13   panel    #05221A   panel-2 #072C21   line  #164E3E
   emerald   #064E3B   dark     #022C22   bright  #34C48B   (counts / links)
   gold      #C6A75E   gold-hi  #E7D3A0   text    #F3F0E6   muted #9FB3A8
   Metallic emerald (primary): from-[#0B6B50] via-[#064E3B] to-[#022C22]
------------------------------------------------------------------- */
const emeraldGradient = 'bg-gradient-to-b from-[#0B6B50] via-[#064E3B] to-[#022C22]';

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
    <div className="border-t border-[#164E3E] py-3.5">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="group flex min-h-[28px] w-full items-center justify-between text-left text-[15px] font-semibold text-[#E7D3A0]"
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-[#9FB3A8] transition-colors group-hover:text-[#C6A75E]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#9FB3A8] transition-colors group-hover:text-[#C6A75E]" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden pt-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Square checkbox row (availability / collection / fabric / fit) */
function CheckRow({
  label,
  count,
  checked,
  onClick,
  role = 'checkbox',
}: {
  label: string;
  count?: number;
  checked: boolean;
  onClick: () => void;
  role?: 'checkbox' | 'radio';
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      onClick={onClick}
      className="group flex min-h-[36px] w-full items-center gap-3 py-1 text-left"
    >
      <span
        className={cn(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[3px] border transition-colors',
          checked
            ? 'border-[#C6A75E] bg-[#C6A75E]'
            : 'border-[#3F6A5A] bg-transparent group-hover:border-[#C6A75E]'
        )}
      >
        {checked && <Check className="h-3 w-3 stroke-[3] text-[#031A13]" />}
      </span>
      <span className="text-[14px] text-[#D5DDD6] transition-colors group-hover:text-white">
        {label}
        {typeof count === 'number' && (
          <span className="ml-1 text-[13px] text-[#9FB3A8]">({count})</span>
        )}
      </span>
    </button>
  );
}

/* Shop-grid product card: edge-to-edge image, name + prices, Wishlist + Add to Cart only.
   Everything else (sizes, colours, rating, stock detail) lives on the product page. */
function ShopProductCard({ product }: { product: any }) {
  const wishlist = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const isWishlisted = wishlist.has(product.id);
  const [loginOpen, setLoginOpen] = useState(false);

  const price: number = product.price;
  const mrp: number | undefined = product.mrp && product.mrp > price ? product.mrp : undefined;
  const bestPrice = Number(product.bestPrice || 0);
  const showBestPrice = bestPrice > 0 && bestPrice < price;

  const variants: any[] = Array.isArray(product.variants) ? product.variants : [];
  const purchasable = variants.filter((v) => v?.id && Number(v.inventory || 0) > 0);
  const inStock = variants.length > 0 ? purchasable.length > 0 : Number(product.inventory || 0) > 0;
  const productHref = `/product/${product.slug}`;

  const handleWishlist = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ardenby_token') : null;
    if (!token) {
      setLoginOpen(true);
      return;
    }
    wishlist.toggle({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images?.[0],
      price: product.price,
      mrp: product.mrp,
    });
    toast.success(isWishlisted ? 'Removed from your favourites' : 'Added to your favourites');
  };

  const handleAddToCart = () => {
    // Always add directly (first purchasable option); never navigate to the product page.
    const v = purchasable[0];
    addItem({
      productId: product.id,
      variantId: v?.id,
      slug: product.slug,
      name: product.name,
      image: product.images?.[0],
      size: v?.size,
      color: v?.color,
      price,
      mrp: product.mrp,
    });
    toast.success('Added to cart', { description: product.name });
  };

  return (
    <div className="group relative flex min-w-0 flex-col">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[6px]">
        <Link href={productHref} aria-label={product.name} className="block h-full w-full">
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className={cn(
                'h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]',
                !inStock && 'opacity-60'
              )}
            />
          )}
        </Link>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/60 shadow-md backdrop-blur-sm transition hover:border-[#C6A75E] hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C6A75E] active:scale-95"
        >
          <Heart className={cn('h-4 w-4', isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-white')} />
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock}
          aria-label={inStock ? 'Add to cart' : 'Out of stock'}
          title={inStock ? 'Add to cart' : 'Out of stock'}
          className="absolute bottom-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#C6A75E] bg-black/65 text-[#E7D3A0] shadow-md backdrop-blur-sm transition hover:bg-[#C6A75E] hover:text-[#031A13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E7D3A0] active:scale-95 disabled:cursor-not-allowed disabled:border-white/20 disabled:text-white/40 disabled:hover:bg-black/55 disabled:hover:text-white/40"
        >
          <ShoppingCart className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-0.5 pt-2">
        <Link href={productHref} title={product.name} className="line-clamp-1 text-[13px] font-medium text-[#F3F0E6] hover:text-[#E7D3A0] sm:text-[14px]">
          {product.name}
        </Link>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[15px] font-semibold text-white">{formatINR(price)}</span>
          {mrp && <span className="text-[12px] text-[#9FB3A8] line-through">{formatINR(mrp)}</span>}
        </div>
        {showBestPrice && (
          <p className="text-[12px] font-medium text-[#E7D3A0]">
            Best Price: <span className="font-semibold">{formatINR(bestPrice)}</span>
          </p>
        )}
      </div>
      <WishlistLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}

export function ShopClient() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
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
  const [currentPage, setCurrentPage] = useState(1);
  const [apiCategories, setApiCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const itemsPerPage = 12;

  // Fetch backend-managed categories once on mount.
  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        const response = await fetch(apiUrl('/api/categories'), {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          console.error(
            `Categories API error: ${response.status} ${response.statusText}`
          );
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
          console.error(
            'Categories API returned an unexpected response shape:',
            data
          );
          return;
        }

        setApiCategories(
          list.filter(
            (c: any) => c && typeof c.slug === 'string' && c.slug.length > 0
          )
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Categories API error:', error);
      } finally {
        if (!controller.signal.aborted) {
          setCategoriesLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      controller.abort();
    };
  }, []);

  // Backend categories only - no static fallback.
  const shopCategories = apiCategories;

  useEffect(() => {
    if (fitParam) {
      setSelectedFits([fitParam as FitType]);
    }
  }, [fitParam]);

  const activeCategory = shopCategories.find(
    (c: any) => c.slug === categoryParam
  );

  // True while a specific category is requested but categories haven't loaded yet,
  // so the heading doesn't flash "All Products".
  const awaitingCategory =
    Boolean(categoryParam) &&
    categoryParam !== 'all-products' &&
    categoriesLoading;

  // Keep the active category chip visible in the horizontally scrolling row.
  useEffect(() => {
    document
      .querySelectorAll('[data-active-pill="true"]')
      .forEach((el) => el.scrollIntoView({ inline: 'center', block: 'nearest' }));
  }, [categoryParam, categoriesLoading]);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '1000',
        });

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

          const staticProductsForCategory = staticProducts.map(normalizeStaticProduct);

          const seenIds = new Set<string>();
          const seenSlugs = new Set<string>();
          const merged = [...liveProducts, ...staticProductsForCategory].filter(
            (product: any) => {
              const id = String(product.id ?? '');
              const slug = String(product.slug ?? '');
              if ((id && seenIds.has(id)) || (slug && seenSlugs.has(slug))) return false;
              if (id) seenIds.add(id);
              if (slug) seenSlugs.add(slug);
              return true;
            }
          );

          setProducts(merged);
        }
      } catch (error) {
        console.error('Shop products API error:', error);
        if (!cancelled) {
          const staticProductsForCategory = staticProducts.map(normalizeStaticProduct);

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
  }, []);

  // `products` is the full catalogue; this narrows it to the selected category.
  const categoryProducts = useMemo(() => {
    if (!categoryParam || categoryParam === 'all-products') return products;
    if (categoryParam === 'plus-size') return products.filter((p) => p.sizes.includes('XXL'));
    return products.filter((p) => p.category === categoryParam);
  }, [products, categoryParam]);

  const filtered = useMemo(() => {
    let result = [...categoryProducts];

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
    if (selectedCollections.length > 0) {
      result = result.filter((p) => selectedCollections.some((key) => Boolean(p[key])));
    }
    if (inStockOnly) {
      result = result.filter((p) => getStockQty(p) > 0);
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
      case 'discount':
        result.sort((a, b) => getDiscountPct(b) - getDiscountPct(a));
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
    priceRange,
    sort,
  ]);

  // Facet counts come from the loaded product set (real data).
  const facetCounts = useMemo(() => {
    const byFabric: Record<string, number> = {};
    const byFit: Record<string, number> = {};
    let inStock = 0;
    const collections: Record<CollectionKey, number> = {
      newArrival: 0,
      bestSeller: 0,
      limitedEdition: 0,
    };

    for (const p of categoryProducts) {
      if (p.fabric) byFabric[p.fabric] = (byFabric[p.fabric] || 0) + 1;
      if (p.fit) byFit[p.fit] = (byFit[p.fit] || 0) + 1;
      if (getStockQty(p) > 0) inStock += 1;
      for (const option of collectionOptions) {
        if (p[option.key]) collections[option.key] += 1;
      }
    }

    return { byFabric, byFit, inStock, collections };
  }, [categoryProducts]);

  // Category counts are derived from the full catalogue, never hardcoded.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'all-products': products.length,
      'plus-size': products.filter((p) => p.sizes.includes('XXL')).length,
    };
    for (const p of products) {
      // 'all-products' / 'plus-size' are views, not real assignments: totals are set above.
      if (p.category && p.category !== 'plus-size' && p.category !== 'all-products') {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    }
    return counts;
  }, [products]);
  const getCategoryCount = (slug: string) => (isLoading ? undefined : categoryCounts[slug] ?? 0);

  // Upper price bound follows the catalogue so the default range hides nothing.
  const PRICE_MAX = useMemo(
    () => Math.max(PRICE_MIN_CAP, Math.ceil(Math.max(0, ...products.map((p) => p.price || 0)) / 100) * 100),
    [products]
  );
  useEffect(() => {
    setPriceRange([0, PRICE_MAX]);
  }, [PRICE_MAX]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const rangeEnd = Math.min(currentPage * itemsPerPage, filtered.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    categoryParam,
    selectedSizes,
    selectedColors,
    selectedFabrics,
    selectedCoverages,
    selectedFits,
    selectedCollections,
    inStockOnly,
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

  const clearAll = () => {
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
    (priceActive ? 1 : 0);

  const setMinPrice = (value: string) => {
    const n = Math.max(0, Math.min(Number(value) || 0, priceRange[1]));
    setPriceRange([n, priceRange[1]]);
  };
  const setMaxPrice = (value: string) => {
    const n = Math.min(PRICE_MAX, Math.max(Number(value) || 0, priceRange[0]));
    setPriceRange([priceRange[0], n]);
  };

  const pillClass = (active: boolean, round = 'rounded-[3px]') =>
    cn(
      'min-h-[36px] border px-3.5 py-1.5 text-[13px] transition-all duration-200',
      round,
      active
        ? 'border-[#C6A75E] bg-[#C6A75E]/10 font-semibold text-[#E7D3A0]'
        : 'border-[#2C5A4A] bg-transparent text-[#D5DDD6] hover:border-[#C6A75E] hover:text-white'
    );

  const categoryLinkRow = (checked: boolean, label: string, count: number | undefined, href: string, key?: string) => (
    <Link
      key={key}
      href={href}
      className="group flex min-h-[36px] w-full items-center gap-3 py-1 text-left"
    >
      <span
        className={cn(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[3px] border transition-colors',
          checked
            ? 'border-[#C6A75E] bg-[#C6A75E]'
            : 'border-[#3F6A5A] group-hover:border-[#C6A75E]'
        )}
      >
        {checked && <Check className="h-3 w-3 stroke-[3] text-[#031A13]" />}
      </span>
      <span className="text-[14px] text-[#D5DDD6] group-hover:text-white">
        {label}
        {typeof count === 'number' && (
          <span className="ml-1 text-[13px] text-[#9FB3A8]">({count})</span>
        )}
      </span>
    </Link>
  );

  // NOTE: kept as a plain JSX value (not an inner component) so that
  // collapsible sections keep their open/closed state when a filter is clicked.
  const categoryFilter = (
    <>
      {shopCategories.length > 0 && (
        <DynamicFilterSection title="Category">
          <div role="radiogroup" aria-label="Category">
            {categoryLinkRow(
              !categoryParam || categoryParam === 'all-products',
              'All Categories',
              getCategoryCount('all-products'),
              '/shop?category=all-products'
            )}
            {shopCategories.map((c: any) =>
              categoryLinkRow(
                categoryParam === c.slug,
                c.name,
                getCategoryCount(c.slug),
                `/shop?category=${encodeURIComponent(c.slug)}`,
                c.slug
              )
            )}
          </div>
        </DynamicFilterSection>
      )}
    </>
  );

  const filterSections = (
    <>
      {/* Price */}
      <DynamicFilterSection title="Price Range">
        <div className="px-1 pt-1">
          <Slider
            value={priceRange}
            onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
            min={0}
            max={PRICE_MAX}
            step={100}
            className="mb-4 [&_[class*='bg-primary']]:bg-[#C6A75E] [&_[class*='bg-secondary']]:bg-[#1D4A3C] [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-[#E7D3A0] [&_[role=slider]]:bg-[#C6A75E]"
          />
          <div className="flex items-center gap-2">
            <label className="flex h-10 min-w-0 flex-1 items-center gap-1 rounded-[3px] border border-[#2C5A4A] bg-[#031A13] px-2.5 text-[14px] text-[#F3F0E6] focus-within:border-[#C6A75E]">
              <span className="text-[#9FB3A8]">₹</span>
              <input
                type="number"
                inputMode="numeric"
                aria-label="Minimum price"
                min={0}
                max={PRICE_MAX}
                value={priceRange[0]}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full min-w-0 bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </label>
            <label className="flex h-10 min-w-0 flex-1 items-center gap-1 rounded-[3px] border border-[#2C5A4A] bg-[#031A13] px-2.5 text-[14px] text-[#F3F0E6] focus-within:border-[#C6A75E]">
              <span className="text-[#9FB3A8]">₹</span>
              <input
                type="number"
                inputMode="numeric"
                aria-label="Maximum price"
                min={0}
                max={PRICE_MAX}
                value={priceRange[1]}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full min-w-0 bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </label>
          </div>
        </div>
      </DynamicFilterSection>

      {/* Sizes */}
      <DynamicFilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {allSizes.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={selectedSizes.includes(s)}
              onClick={() => toggleSize(s)}
              className={cn(
                'h-9 min-w-[48px] rounded-[3px] border px-3 text-[13px] font-medium transition-all duration-200',
                selectedSizes.includes(s)
                  ? 'border-[#C6A75E] bg-[#C6A75E]/10 font-semibold text-[#E7D3A0]'
                  : 'border-[#2C5A4A] bg-transparent text-[#D5DDD6] hover:border-[#C6A75E]'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </DynamicFilterSection>

      {/* Colors */}
      <DynamicFilterSection title="Color">
        <div className="flex flex-wrap gap-3">
          {allColors.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => toggleColor(c.name)}
              title={c.name}
              aria-label={c.name}
              aria-pressed={selectedColors.includes(c.name)}
              className={cn(
                'relative flex h-7 w-7 items-center justify-center rounded-full border border-white/25 transition-transform duration-200',
                selectedColors.includes(c.name)
                  ? 'scale-110 ring-2 ring-[#C6A75E] ring-offset-2 ring-offset-[#05221A]'
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
      <DynamicFilterSection title="Fabric" defaultOpen={false}>
        <div>
          {allFabrics.map((f) => (
            <CheckRow
              key={f}
              label={f}
              count={facetCounts.byFabric[f] ?? 0}
              checked={selectedFabrics.includes(f)}
              onClick={() => toggleFabric(f)}
            />
          ))}
        </div>
      </DynamicFilterSection>

      {/* Fit */}
      <DynamicFilterSection title="Fit Type" defaultOpen={false}>
        <div>
          {allFits.map((f) => (
            <CheckRow
              key={f}
              label={f}
              count={facetCounts.byFit[f] ?? 0}
              checked={selectedFits.includes(f)}
              onClick={() => toggleFit(f)}
            />
          ))}
        </div>
      </DynamicFilterSection>

      {/* Coverage */}
      <DynamicFilterSection title="Print Coverage" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {allCoverages.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={selectedCoverages.includes(c)}
              onClick={() => toggleCoverage(c)}
              className={pillClass(selectedCoverages.includes(c))}
            >
              {c}
            </button>
          ))}
        </div>
      </DynamicFilterSection>

      {/* Availability */}
      <DynamicFilterSection title="Availability" defaultOpen={false}>
        <CheckRow
          label="In Stock Only"
          count={facetCounts.inStock}
          checked={inStockOnly}
          onClick={() => setInStockOnly((v) => !v)}
        />
      </DynamicFilterSection>

      {/* Collection */}
      <DynamicFilterSection title="Collection" defaultOpen={false}>
        <div>
          {collectionOptions.map((option) => (
            <CheckRow
              key={option.key}
              label={option.label}
              count={facetCounts.collections[option.key]}
              checked={selectedCollections.includes(option.key)}
              onClick={() => toggleCollection(option.key)}
            />
          ))}
        </div>
      </DynamicFilterSection>
    </>
  );

  const filterContent = (
    <div>
      {categoryFilter}
      {filterSections}
    </div>
  );

  // Desktop sidebar categories: thumbnail rows with live counts.
  const desktopCategoryRow = (
    active: boolean,
    label: string,
    count: number | undefined,
    href: string,
    img?: string,
    key?: string
  ) => (
    <Link
      key={key}
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-[6px] border p-1 pr-3 transition-colors',
        active
          ? 'border-[#C6A75E]/70 bg-gradient-to-b from-[#0B6B50] via-[#064E3B] to-[#022C22]'
          : 'border-transparent hover:border-[#164E3E] hover:bg-[#072C21]'
      )}
    >
      <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-[#164E3E] bg-[#072C21] text-[16px] font-semibold text-[#E7D3A0]">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="h-full w-full object-cover" />
        ) : (
          label.charAt(0)
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-[14px] text-[#F3F0E6]">{label}</span>
      {typeof count === 'number' && (
        <span className={cn('text-[13px]', active ? 'text-[#E7D3A0]' : 'text-[#34C48B]')}>
          {count}
        </span>
      )}
    </Link>
  );

  const sortSelect = (compact = false) => (
    <div className={cn('relative', compact && 'min-w-0 flex-1')}>
      <select
        aria-label="Sort products"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className={cn(
          'cursor-pointer appearance-none rounded-[3px] border border-[#2C5A4A] bg-[#05221A] text-[#F3F0E6] outline-none transition hover:border-[#C6A75E] focus:border-[#C6A75E]',
          compact ? 'h-10 w-full pl-3 pr-8 text-[13px]' : 'h-10 min-w-[210px] pl-3 pr-9 text-[14px]'
        )}
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#05221A] text-white">
            {compact ? opt.label : `Sort by: ${opt.label}`}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F3F0E6]" />
    </div>
  );

  // Chips (shared by desktop + mobile)
  const chips = [
    ...selectedSizes.map((v) => ({ key: `s-${v}`, label: `Size: ${v}`, remove: () => toggleSize(v) })),
    ...selectedColors.map((v) => ({ key: `c-${v}`, label: `Color: ${v}`, remove: () => toggleColor(v) })),
    ...selectedFabrics.map((v) => ({ key: `f-${v}`, label: v, remove: () => toggleFabric(v) })),
    ...selectedCoverages.map((v) => ({ key: `cv-${v}`, label: `Coverage: ${v}`, remove: () => toggleCoverage(v) })),
    ...selectedFits.map((v) => ({ key: `fit-${v}`, label: v, remove: () => toggleFit(v) })),
    ...selectedCollections.map((k) => ({
      key: `col-${k}`,
      label: collectionOptions.find((o) => o.key === k)?.label || k,
      remove: () => toggleCollection(k),
    })),
    ...(inStockOnly ? [{ key: 'stock', label: 'In Stock', remove: () => setInStockOnly(false) }] : []),
    ...(priceActive
      ? [
          {
            key: 'price',
            label: `${formatINR(priceRange[0])} - ${formatINR(priceRange[1])}`,
            remove: () => setPriceRange([0, PRICE_MAX]),
          },
        ]
      : []),
  ] as { key: string; label: string; remove: () => void }[];

  // Current category label (heading + breadcrumb). Falls back to a readable
  // label for the special "plus-size" view, which is not a backend category.
  const allCategory = shopCategories.find((c: any) => c.slug === 'all-products');
  const categoryName: string = activeCategory
    ? activeCategory.name
    : awaitingCategory
      ? '\u00A0'
      : categoryParam && categoryParam !== 'all-products'
        ? humanize(categoryParam)
        : allCategory?.name || humanize('all-products');

  // Breadcrumb trail comes from the real route + the selected category.
  const routeCrumbs = (pathname || '/shop')
    .split('/')
    .filter(Boolean)
    .map((segment, i, all) => ({
      label: humanize(decodeURIComponent(segment)),
      href: `/${all.slice(0, i + 1).join('/')}`,
    }));

  // Category cards (shared by mobile + desktop)
  const cardCategories: any[] = shopCategories.some((c: any) => c.slug === 'all-products')
    ? shopCategories
    : [{ slug: 'all-products', name: 'All' }, ...shopCategories];

  const categoryCards = cardCategories.length > 1 && (
    <div className="-mx-3 flex snap-x snap-proximity scroll-px-3 gap-2 overflow-x-auto px-3 pb-2 pt-0.5 [scrollbar-width:none] sm:-mx-5 sm:scroll-px-5 sm:px-5 lg:mx-0 lg:scroll-px-0 lg:gap-3 lg:px-0 [&::-webkit-scrollbar]:hidden">
      {cardCategories.map((c: any) => {
        const active =
          categoryParam === c.slug ||
          (c.slug === 'all-products' && (!categoryParam || categoryParam === 'all-products'));
        const img = getCategoryImage(c);
        return (
          <Link
            key={c.slug}
            href={`/shop?category=${encodeURIComponent(c.slug)}`}
            data-active-pill={active ? 'true' : undefined}
            aria-current={active ? 'page' : undefined}
            title={c.name}
            className={cn(
              'group flex w-[76px] shrink-0 snap-start flex-col items-center gap-1 rounded-[8px] border p-1 pb-1.5 transition-colors lg:w-[112px] xl:w-[124px]',
              active
                ? 'border-[#C6A75E] bg-[#072C21] shadow-[0_0_0_1px_#C6A75E]'
                : 'border-[#164E3E] bg-[#05221A] hover:border-[#C6A75E]/60'
            )}
          >
            <span
              className={cn(
                'flex h-[64px] w-full items-center justify-center overflow-hidden rounded-[6px] bg-[#072C21] text-[18px] font-semibold text-[#E7D3A0] lg:h-[96px] xl:h-[104px]',
                !active && 'opacity-80 group-hover:opacity-100'
              )}
            >
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={c.name} className="h-full w-full object-cover" />
              ) : (
                String(c.name || '?').charAt(0)
              )}
            </span>
            <span
              className={cn(
                'w-full truncate text-center text-[12px] lg:text-[13px]',
                active ? 'font-semibold text-[#E7D3A0]' : 'text-[#D5DDD6]'
              )}
            >
              {c.name}
            </span>
          </Link>
        );
      })}
    </div>
  );

  const chipClass =
    'inline-flex min-h-[32px] items-center gap-1.5 rounded-[3px] border border-[#C6A75E]/50 bg-[#C6A75E]/10 px-2.5 py-1 text-[12px] text-[#E7D3A0] transition hover:border-[#C6A75E]';

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0B2B1B] text-[#F3F0E6]">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex w-full max-w-[1920px] flex-wrap items-center gap-2 px-3 pt-4 text-[13px] text-[#D5DDD6] sm:px-5 lg:px-6 xl:px-8"
      >
        <Link href="/" className="transition hover:text-[#E7D3A0]">Home</Link>
        {routeCrumbs.map((crumb) => (
          <span key={crumb.href} className="flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-[#9FB3A8]" />
            <Link href={crumb.href} className="transition hover:text-[#E7D3A0]">
              {crumb.label}
            </Link>
          </span>
        ))}
        {categoryName.trim() && (
          <span className="flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-[#9FB3A8]" />
            <span aria-current="page" className="text-[#E7D3A0]">{categoryName}</span>
          </span>
        )}
      </nav>

      {/* Mobile product count + category cards */}
      <div className="px-3 pt-3 sm:px-5 lg:hidden">
        <h1 className="sr-only">{categoryName}</h1>
        <div className="flex justify-end">
          <span className="text-[13px] text-[#E7D3A0]" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? 'Product' : 'Products'}
          </span>
        </div>
        <div className="mt-2">{categoryCards}</div>
      </div>

      {/* ============================================================
          MOBILE TOOLBAR: Filters + Sort
          ============================================================ */}
      <div className="px-3 pt-3 sm:px-5 lg:hidden">
        <div className="flex items-center gap-2">
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 flex-1 justify-center rounded-[3px] border-[#C6A75E]/60 bg-[#05221A] px-3 text-[13px] font-medium text-[#F3F0E6] hover:bg-[#072C21] hover:text-[#E7D3A0]"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4 text-[#C6A75E]" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C6A75E] px-1 text-[11px] font-bold text-[#031A13]">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>

            <SheetContent
              side="bottom"
              className="flex h-[90vh] max-h-[90vh] flex-col gap-0 rounded-t-2xl border-t border-[#164E3E] bg-[#05221A] p-0 text-[#F3F0E6]"
            >
              <SheetHeader className="shrink-0 border-b border-[#164E3E] px-5 py-3 text-left">
                <div className="flex items-center justify-between pr-8">
                  <SheetTitle className="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.18em] text-[#F3F0E6]">
                    <SlidersHorizontal className="h-4 w-4 text-[#C6A75E]" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C6A75E] px-1 text-[11px] font-bold normal-case tracking-normal text-[#031A13]">
                        {activeFilterCount}
                      </span>
                    )}
                  </SheetTitle>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="flex min-h-[44px] items-center gap-1.5 text-[14px] font-medium text-[#34C48B]"
                    >
                      Clear All
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </SheetHeader>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
                {filterContent}
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-[#164E3E] bg-[#05221A] px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearAll}
                  disabled={activeFilterCount === 0}
                  className="h-11 rounded-[3px] border-[#2C5A4A] bg-transparent text-[13px] font-semibold tracking-wide text-[#F3F0E6] hover:bg-[#072C21] hover:text-white disabled:opacity-40"
                >
                  Clear All
                </Button>
                <Button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className={cn(
                    'h-11 rounded-[3px] border border-[#C6A75E]/70 text-[13px] font-semibold tracking-wide text-white hover:brightness-110',
                    emeraldGradient
                  )}
                >
                  Apply Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {sortSelect(true)}
        </div>

      </div>

      {/* ============================================================
          SIDEBAR + PRODUCT AREA
          ============================================================ */}
      <div className="mx-auto flex w-full max-w-[1920px] items-start gap-5 px-3 py-4 sm:px-5 lg:px-6 lg:py-6 xl:px-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-[240px] shrink-0 flex-col gap-4 lg:flex xl:w-[270px]">
          {shopCategories.length > 0 && (
            <div className="rounded-[6px] border border-[#C6A75E]/30 bg-[#05221A] px-3.5 pb-3">
              <DynamicFilterSection title="Categories">
                <div className="flex flex-col gap-1.5">
                  {desktopCategoryRow(
                    !categoryParam || categoryParam === 'all-products',
                    'All Categories',
                    getCategoryCount('all-products'),
                    '/shop?category=all-products',
                    getCategoryImage({ slug: 'all-products' })
                  )}
                  {shopCategories.map((c: any) =>
                    desktopCategoryRow(
                      categoryParam === c.slug,
                      c.name,
                      getCategoryCount(c.slug),
                      `/shop?category=${encodeURIComponent(c.slug)}`,
                      getCategoryImage(c),
                      c.slug
                    )
                  )}
                </div>
              </DynamicFilterSection>
            </div>
          )}

          <div className="rounded-[6px] border border-[#C6A75E]/30 bg-[#05221A] px-3.5 pb-3">
            <div className="flex items-center justify-between pb-1 pt-4">
              <h2 className="text-[15px] font-semibold text-[#E7D3A0]">Filters</h2>
              <button
                type="button"
                onClick={clearAll}
                disabled={activeFilterCount === 0}
                className="text-[13px] font-medium text-[#F3F0E6] underline-offset-4 transition hover:text-[#E7D3A0] hover:underline disabled:opacity-50"
              >
                Clear All
              </button>
            </div>
            {filterSections}
          </div>
        </aside>

        {/* Products */}
        <main className="min-w-0 flex-1">
          {/* Desktop category cards + toolbar */}
          <h1 className="sr-only">{categoryName}</h1>
          <div className="mb-4 hidden lg:block">{categoryCards}</div>

          <div className="mb-4 hidden items-center justify-end gap-3 lg:flex">
            <span className="mr-auto text-[14px] text-[#E7D3A0]" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? 'Product' : 'Products'}
            </span>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-[3px] border transition',
                viewMode === 'grid'
                  ? 'border-[#C6A75E] bg-[#C6A75E]/10 text-[#C6A75E]'
                  : 'border-[#2C5A4A] text-[#D5DDD6] hover:border-[#C6A75E]'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-[3px] border transition',
                viewMode === 'list'
                  ? 'border-[#C6A75E] bg-[#C6A75E]/10 text-[#C6A75E]'
                  : 'border-[#2C5A4A] text-[#D5DDD6] hover:border-[#C6A75E]'
              )}
            >
              <List className="h-4 w-4" />
            </button>
            {sortSelect()}
          </div>

          {/* Active filter chips */}
          {chips.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.remove}
                  aria-label={`Remove filter ${chip.label}`}
                  className={chipClass}
                >
                  {chip.label}
                  <X className="h-3.5 w-3.5 text-[#9FB3A8]" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAll}
                className="ml-auto min-h-[32px] text-[12px] font-semibold text-[#34C48B] lg:hidden"
              >
                Clear All
              </button>
            </div>
          )}

          {!isLoading && paged.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex min-h-[380px] flex-col items-center justify-center rounded-[4px] border border-dashed border-[#2C5A4A] bg-[#05221A] px-6 text-center"
            >
              <Grid className="mb-4 h-9 w-9 stroke-[1] text-[#C6A75E]" />

              <p className="font-serif text-2xl text-[#F3F0E6]">No products found</p>

              <p className="mb-6 mt-2 max-w-xs text-sm text-[#9FB3A8]">
                We couldn&apos;t find any items matching your selected criteria.
              </p>

              <Button
                onClick={clearAll}
                className={cn(
                  'rounded-[3px] border border-[#C6A75E]/70 px-7 text-[12px] font-semibold uppercase tracking-[0.12em] text-white hover:brightness-110',
                  emeraldGradient
                )}
              >
                Clear All Filters
              </Button>
            </motion.div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 lg:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[0.8] animate-pulse rounded-[4px] border border-[#164E3E] bg-[#05221A]"
                />
              ))}
            </div>
          ) : (
            <motion.div
              layout
              className={cn(
                'grid items-start gap-x-3 gap-y-5 lg:gap-x-4 lg:gap-y-6',
                viewMode === 'grid'
                  ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
              )}
            >
              <AnimatePresence>
                {paged.map((p) => (
                  <ShopProductCard key={p.id} product={p} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-[#164E3E] pt-6">
              <Button
                variant="outline"
                size="sm"
                className="h-10 rounded-[3px] border-[#2C5A4A] bg-transparent px-4 text-[13px] font-medium text-[#F3F0E6] hover:border-[#C6A75E] hover:bg-[#072C21] hover:text-[#E7D3A0] disabled:opacity-40"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-current={currentPage === i + 1 ? 'page' : undefined}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-[3px] text-[13px] font-semibold transition-all',
                      currentPage === i + 1
                        ? 'border border-[#C6A75E] bg-[#C6A75E]/10 text-[#E7D3A0]'
                        : 'text-[#9FB3A8] hover:bg-[#072C21] hover:text-[#E7D3A0]'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-10 rounded-[3px] border-[#2C5A4A] bg-transparent px-4 text-[13px] font-medium text-[#F3F0E6] hover:border-[#C6A75E] hover:bg-[#072C21] hover:text-[#E7D3A0] disabled:opacity-40"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}

          {/* range hint (desktop) */}
          {filtered.length > 0 && (
            <p className="mt-4 hidden text-center text-[13px] text-[#9FB3A8] lg:block">
              Showing {rangeStart}–{rangeEnd} of {filtered.length}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}