'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Banknote,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Ruler,
  ShoppingBag,
  Star,
  Truck,
  X,
} from 'lucide-react';
import { apiUrl } from '@/lib/api-url';
import { formatINR, discountPercent } from '@/lib/format';
import { useWishlistStore } from '@/store/wishlist-store';
import { useCartStore } from '@/store/cart-store';
import { MobileShopBar } from '@/components/home/MobileShopBar';
import { useHeaderHeight } from '@/components/shop/use-header-height';
import { ProductStage } from './product-stage';
import { ProductReviews } from '@/components/product/product-reviews';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Variant = {
  id?: string;
  product_id?: string;
  size?: string;
  color?: string;
  inventory?: number | string | null;
  sku?: string;
};

type ProductData = {
  id: string;
  slug: string;
  name: string;
  category?: string;
  category_slug?: string;
  categoryLabel?: string;
  category_label?: string;
  sku?: string;
  fit?: string;
  fabric?: string;
  coverage?: string;
  price?: number;
  mrp?: number;
  bestPrice?: number;
  best_price?: number;
  rating?: number;
  reviewCount?: number;
  review_count?: number;
  description?: string;
  fabricDetails?: string;
  fabric_details?: string;
  washCare?: string;
  wash_care?: string;
  bestSeller?: boolean;
  best_seller?: boolean;
  newArrival?: boolean;
  new_arrival?: boolean;
  trending?: boolean;
  limitedEdition?: boolean;
  limited_edition?: boolean;
  inventory?: number;
  images?: string[];
  variants?: Variant[];
  sizes?: string[];
  colors?: string[];
};

type StockState =
  | 'none' // product has no variants at all - nothing to verify, nothing to block
  | 'select' // size and/or color not chosen yet
  | 'unavailable' // chosen size/color combination has no matching variant
  | 'unknown' // matching variant found but its inventory is missing/invalid
  | 'out'
  | 'low'
  | 'in';

type Notice = {
  title: string;
  body?: string;
  tone: 'success' | 'error';
  icon: 'heart' | 'bag';
};

type TabKey = 'description' | 'wash' | 'size' | 'returns';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const sizeRank = (size: string) => {
  const index = SIZE_ORDER.indexOf(size.trim().toUpperCase());
  return index === -1 ? SIZE_ORDER.length : index;
};

// Strip stray quotes/whitespace that sometimes wrap the stored description.
const cleanDescription = (value: string) =>
  value
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^["'‘’\s]+/, '')
    .replace(/["'‘’\s]+$/, '')
    .trim();

async function fetchProductBySlug(slug: string): Promise<ProductData | null> {
  const response = await fetch(apiUrl(`/api/products/${encodeURIComponent(slug)}`), { cache: 'no-store' });
  if (!response.ok) return null;
  const data = await response.json();
  const backendProduct = data?.product ?? data?.data ?? data;
  return backendProduct && typeof backendProduct === 'object' && backendProduct.slug
    ? normalizeProduct(backendProduct)
    : null;
}

const LOW_STOCK_THRESHOLD = 5;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type Raw = Record<string, unknown>;

const asRecord = (value: unknown): Raw =>
  value && typeof value === 'object' ? (value as Raw) : {};

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toText = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : value == null ? fallback : String(value);

const pickImages = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((image) => (typeof image === 'string' ? image : asRecord(image).image_url))
        .filter((url): url is string => typeof url === 'string' && url.length > 0)
    : [];

const uniqueStrings = (values: (string | undefined)[]): string[] =>
  Array.from(new Set(values.filter((v): v is string => Boolean(v))));

const normalizeText = (value: unknown) => String(value ?? '').trim().toLowerCase();

// Returns a non-negative whole number, or null when the value is missing/invalid.
const parseInventory = (raw: unknown): number | null => {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string' && raw.trim() === '') return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed);
};

// Only returns a colour when the browser can actually paint the name.
const swatchColor = (name: string): string | null => {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return null;
  const compact = name.replace(/\s+/g, '').toLowerCase();
  return CSS.supports('color', compact) ? compact : null;
};

function normalizeProduct(input: unknown): ProductData {
  const raw = asRecord(input);
  const variants: Variant[] = Array.isArray(raw.variants) ? (raw.variants as Variant[]) : [];

  const rawSizes = Array.isArray(raw.sizes) ? (raw.sizes as string[]) : [];
  const rawColors = Array.isArray(raw.colors) ? (raw.colors as string[]) : [];

  const category = toText(raw.category ?? raw.category_slug);

  return {
    ...raw,
    id: toText(raw.id),
    slug: toText(raw.slug),
    name: toText(raw.name),
    category,
    category_slug: toText(raw.category_slug ?? raw.category),
    categoryLabel: toText(raw.categoryLabel ?? raw.category_label ?? raw.category),
    category_label: toText(raw.category_label ?? raw.categoryLabel ?? raw.category),
    fit: toText(raw.fit),
    fabric: toText(raw.fabric),
    coverage: toText(raw.coverage),
    price: toNumber(raw.price),
    mrp: raw.mrp == null ? undefined : toNumber(raw.mrp),
    bestPrice: toNumber(raw.bestPrice ?? raw.best_price),
    best_price: toNumber(raw.best_price ?? raw.bestPrice),
    rating: toNumber(raw.rating),
    reviewCount: toNumber(raw.reviewCount ?? raw.review_count),
    review_count: toNumber(raw.review_count ?? raw.reviewCount),
    description: cleanDescription(toText(raw.description)),
    fabricDetails: toText(raw.fabricDetails ?? raw.fabric_details),
    washCare: toText(raw.washCare ?? raw.wash_care),
    bestSeller: Boolean(raw.bestSeller ?? raw.best_seller),
    newArrival: Boolean(raw.newArrival ?? raw.new_arrival),
    trending: Boolean(raw.trending),
    limitedEdition: Boolean(raw.limitedEdition ?? raw.limited_edition),
    inventory: toNumber(raw.inventory),
    images: pickImages(raw.images),
    variants,
    sizes: (rawSizes.length ? rawSizes : uniqueStrings(variants.map((v) => v.size))).slice().sort((a, b) => sizeRank(a) - sizeRank(b)),
    colors: rawColors.length ? rawColors : uniqueStrings(variants.map((v) => v.color)),
  } as ProductData;
}

/* -------------------------------------------------------------------------- */
/* Shared class strings                                                       */
/* -------------------------------------------------------------------------- */

const FADE_CSS = `
@keyframes kvFade{from{opacity:0}to{opacity:1}}
.kv-fade{animation:kvFade .35s ease both}
body:has([data-kovenik-product]){background:#F7F7F7}

[data-kovenik-product]{--ivory:#F7F7F7;--ivory-2:#E5E5E5;--ink:#111111;--charcoal:#222222;--gold:#E53935;
  --line:#D2D2D2;--line-2:#E5E5E5;--muted:#5A5A5A;--soft:#828282;--ok:#3E7B4F}
[data-kovenik-product] *:focus-visible{outline:2px solid var(--ink);outline-offset:2px}

.kv-zoom-layer{transition:transform .35s cubic-bezier(.2,.8,.2,1);will-change:transform}
.kv-swiper{scrollbar-width:none;-webkit-overflow-scrolling:touch}
.kv-swiper::-webkit-scrollbar{display:none}
.kv-opt{transition:border-color .2s,background .2s,color .2s,opacity .2s,box-shadow .2s}
.kv-tab-panel{animation:kvTabIn .3s cubic-bezier(.2,.8,.2,1) both}
@keyframes kvTabIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

@media (prefers-reduced-motion:reduce){
  .kv-fade,.kv-tab-panel{animation:none}
  .kv-zoom-layer,.kv-opt{transition:none}
}
`;


export default function ProductPage() {
  const params = useParams<{ slug?: string }>();
  const slug = params?.slug ?? '';

  // Publishes the site header's height as --header-h (used by the sticky panel).
  useHeaderHeight();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [related, setRelated] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<TabKey | null>('description');
  const [footerInView, setFooterInView] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [stickyTop, setStickyTop] = useState('calc(var(--header-h, 96px) + 24px)');
  const addCartItem = useCartStore((state) => state.addItem);
  const router = useRouter();
  const [needSelection, setNeedSelection] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>('description');
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const [skuCopied, setSkuCopied] = useState(false);
  const [addInView, setAddInView] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  const wishlistToggle = useWishlistStore((state) => state.toggle);
  const wishlistSync = useWishlistStore((state) => state.syncFromApi);
  const wishlistHas = useWishlistStore((state) => state.has);
  // Subscribe to the actual wishlist items so related-product hearts rerender
  // immediately after the real API add/remove operation completes.
  const wishlistItems = useWishlistStore((state) => state.items);

  const lightboxTouchStartX = useRef<number | null>(null);
  const selectorsRef = useRef<HTMLDivElement | null>(null);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const noticeTimer = useRef<number | null>(null);

  const isRelatedWishlisted = (productId: string) =>
    wishlistItems.some((item) => item.productId === String(productId));

  const showNotice = (next: Notice) => {
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    setNotice(next);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 3200);
  };

  const showWishlistSuccess = (added: boolean) =>
    showNotice({
      title: added ? 'Added to your favourites.' : 'Removed from your favourites.',
      body: added
        ? 'This piece has been saved to your wishlist.'
        : 'This piece has been removed from your saved favourites.',
      tone: 'success',
      icon: 'heart',
    });

  const showWishlistError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unable to update wishlist.';
    if (message === 'AUTH_REQUIRED') {
      // Reuse the site's sign-in modal (owned by the navbar) instead of a toast.
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
      setNotice(null);
      window.dispatchEvent(new Event('ardenby-open-auth'));
    } else {
      showNotice({ title: message, tone: 'error', icon: 'heart' });
    }
  };

  const buildWishlistItem = (item: ProductData) => ({
    productId: String(item.id ?? '').trim(),
    slug: String(item.slug ?? ''),
    name: String(item.name ?? 'KOVENIK Product'),
    image: String(item.images?.[0] ?? ''),
    price: Number(item.price ?? 0),
    mrp: Number(item.mrp ?? item.price ?? 0),
  });

  const handleWishlistToggle = async () => {
    if (!product?.id || wishlistBusy) return;

    setWishlistBusy(true);

    try {
      const wasWishlisted = wishlistHas(String(product.id));
      await wishlistToggle(buildWishlistItem(product));
      const nextWishlisted = !wasWishlisted;
      setIsWishlisted(nextWishlisted);
      showWishlistSuccess(nextWishlisted);
    } catch (error) {
      showWishlistError(error);
      setIsWishlisted(wishlistHas(String(product.id)));
    } finally {
      setWishlistBusy(false);
    }
  };

  const toggleRelatedWishlist = async (item: ProductData) => {
    try {
      const wasWishlisted = isRelatedWishlisted(String(item.id));
      await wishlistToggle(buildWishlistItem(item));
      // Backend is the source of truth; refresh after the mutation.
      await wishlistSync();
      showWishlistSuccess(!wasWishlisted);
    } catch (error) {
      showWishlistError(error);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Data loading (unchanged behaviour)                                       */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      if (!slug) return;

      setLoading(true);

      let loadedProduct: ProductData | null = null;

      try {
        loadedProduct = await fetchProductBySlug(slug);
      } catch (error) {
        console.error('Product API error:', error);
      }

      if (cancelled) return;

      setProduct(loadedProduct);

      if (!loadedProduct) {
        setLoading(false);
        return;
      }

      // Related products: live category endpoint first, static source as fallback.
      try {
        const category =
          loadedProduct.category_slug ?? loadedProduct.category ?? '';

        let apiRelated: ProductData[] = [];

        if (category) {
          const response = await fetch(
            apiUrl(
              `/api/products?page=1&limit=20&category=${encodeURIComponent(category)}`
            ),
            { cache: 'no-store' }
          );

          if (response.ok) {
            const data = await response.json();
            const list: unknown[] = Array.isArray(data?.products) ? data.products : [];

            apiRelated = list
              .filter((item) => {
                const record = asRecord(item);
                return (
                  record.id !== loadedProduct!.id &&
                  record.slug !== loadedProduct!.slug
                );
              })
              .slice(0, 4)
              .map(normalizeProduct);
          }
        }

        if (!cancelled) setRelated(apiRelated);
      } catch (error) {
        console.error('Related products API error:', error);
        if (!cancelled) setRelated([]);
      }

      if (!cancelled) setLoading(false);
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    setLightboxOpen(false);
    setLightboxImage(0);
    setActiveTab('description');
    setNeedSelection(false);
    // A different product has different variants: never carry a selection over.
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    const syncWishlistState = async () => {
      if (!product?.id) {
        if (!cancelled) setIsWishlisted(false);
        return;
      }

      try {
        await wishlistSync();
      } catch (error) {
        console.error('Wishlist sync failed:', error);
      }

      if (!cancelled) {
        setIsWishlisted(wishlistHas(String(product.id)));
      }
    };

    syncWishlistState();

    return () => {
      cancelled = true;
    };
  }, [product?.id, wishlistSync, wishlistHas]);

  // Show the mobile sticky bar only once the in-flow Add to Cart button has
  // scrolled out of view, so there is never a redundant second button on screen.
  useEffect(() => {
    const element = addButtonRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(([entry]) => {
      setAddInView(entry.isIntersecting);
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [loading, product?.id]);

  // Hide the mobile sticky bar once the site footer is on screen.
  useEffect(() => {
    const element = document.querySelector('footer');
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setFooterInView(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [loading, product?.id]);

  // Desktop sticky panel: below the header, unless it is taller than the viewport,
  // in which case it pins by its bottom edge so it is never cut off.
  useEffect(() => {
    const element = panelRef.current;
    if (!element) return;
    const update = () => {
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 96;
      const height = element.offsetHeight;
      setStickyTop(
        height + header + 48 > window.innerHeight
          ? `calc(100vh - ${height}px - 24px)`
          : 'calc(var(--header-h, 96px) + 24px)'
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [loading, product?.id]);

  const imageCount = product?.images?.length ?? 0;

  useEffect(() => {
    if (!lightboxOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false);
      if (imageCount < 2) return;
      if (event.key === 'ArrowRight') setLightboxImage((c) => (c + 1) % imageCount);
      if (event.key === 'ArrowLeft') setLightboxImage((c) => (c - 1 + imageCount) % imageCount);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, imageCount]);

  useEffect(
    () => () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    },
    []
  );

  /* ------------------------------------------------------------------------ */
  /* VARIANT + STOCK RESOLUTION                                               */
  /* One calculation, used by the desktop and mobile layouts alike.           */
  /* Stock is read ONLY from the variant matching the selected size AND color */
  /* (product-level `inventory` is never used, nothing is hardcoded).         */
  /* ------------------------------------------------------------------------ */

  const variants: Variant[] = product?.variants ?? [];
  const sizes: string[] = product?.sizes ?? [];
  const colors: string[] = product?.colors ?? [];

  const needsColor = colors.length > 0;
  const hasVariantSelection = Boolean(selectedSize && (!needsColor || selectedColor));

  const findVariant = (size: string | null, color: string | null) =>
    variants.find(
      (variant) =>
        normalizeText(variant.size) === normalizeText(size) &&
        (!needsColor || normalizeText(variant.color) === normalizeText(color))
    );

  const selectedVariant = hasVariantSelection ? findVariant(selectedSize, selectedColor) : undefined;
  const selectedVariantInventory = parseInventory(selectedVariant?.inventory);

  let stockState: StockState;
  if (variants.length === 0) stockState = 'none';
  else if (!hasVariantSelection) stockState = 'select';
  else if (!selectedVariant) stockState = 'unavailable';
  else if (selectedVariantInventory === null) stockState = 'unknown';
  else if (selectedVariantInventory === 0) stockState = 'out';
  else if (selectedVariantInventory <= LOW_STOCK_THRESHOLD) stockState = 'low';
  else stockState = 'in';

  // Add to Cart is blocked unless the exact variant is verified in stock.
  const stockBlocked =
    stockState === 'unavailable' || stockState === 'unknown' || stockState === 'out';

  const inStock = (variant?: Variant) => (parseInventory(variant?.inventory) ?? 0) > 0;

  // A size is disabled when the chosen color has no in-stock variant of it.
  const sizeSoldOut = (size: string) =>
    needsColor && !selectedColor
      ? !variants.some((v) => normalizeText(v.size) === normalizeText(size) && inStock(v))
      : !inStock(findVariant(size, selectedColor));
  // A color is disabled only when none of its variants has stock.
  const colorSoldOut = (color: string) =>
    !variants.some((v) => normalizeText(v.color) === normalizeText(color) && inStock(v));

  const firstInStockSize = (color: string | null) =>
    sizes.find((size) => inStock(findVariant(size, color))) ?? null;

  // Auto-select the first in-stock color + size once the product is loaded.
  useEffect(() => {
    if (!product || variants.length === 0 || selectedSize || selectedColor) return;
    const color = needsColor ? colors.find((c) => !colorSoldOut(c)) ?? null : null;
    if (needsColor && !color) return;
    const size = firstInStockSize(color);
    if (color) setSelectedColor(color);
    if (size) setSelectedSize(size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Keep the quantity within the verified stock of the selected variant.
  useEffect(() => {
    if (selectedVariantInventory !== null && selectedVariantInventory > 0) {
      setQuantity((q) => Math.min(Math.max(1, q), selectedVariantInventory));
    } else {
      setQuantity(1);
    }
  }, [selectedVariantInventory, selectedVariant?.id]);

  /* ------------------------------------------------------------------------ */
  /* Early returns                                                            */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F7F7] px-4 py-12">
        <div className="mx-auto max-w-[1500px] animate-pulse">
          <div className="grid gap-8 lg:grid-cols-[1fr_452px] lg:gap-16">
            <div className="aspect-[4/5] bg-[#E5E5E5]" />
            <div className="space-y-4">
              <div className="h-4 w-48 bg-[#E5E5E5]" />
              <div className="h-12 w-3/4 bg-[#E5E5E5]" />
              <div className="h-8 w-32 bg-[#E5E5E5]" />
              <div className="h-24 bg-[#E5E5E5]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F7F7] px-6 text-center">
        <div>
          <p className="font-serif text-2xl tracking-[0.12em] text-[#111111]">KOVENIK</p>
          <h1 className="mt-3 text-3xl text-[#111111]">Product not found</h1>
          <p className="mt-2 text-sm text-[#5A5A5A]">This piece may have been removed or the link is incorrect.</p>
          <Link
            href="/shop"
            className="mt-6 inline-flex bg-[#111111] px-6 py-3 text-[14px] font-semibold uppercase tracking-[0.16em] text-[#F7F7F7]"
          >
            Back to shop
          </Link>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Derived display values                                                   */
  /* ------------------------------------------------------------------------ */

  const price = Number(product.price ?? 0);
  const mrp = product.mrp == null ? undefined : Number(product.mrp);
  const bestPrice = Number(product.bestPrice ?? product.best_price ?? 0);
  const discount = mrp !== undefined ? discountPercent(mrp, price) : 0;
  const images: string[] = product.images ?? [];
  const hasBestOffer = bestPrice > 0 && bestPrice < price;

  const stockView = (() => {
    const pluralItems = (n: number) => (n === 1 ? 'item' : 'items');
    const red = { text: 'text-[#B3261E]', sub: 'text-[#B3261E]/80', dot: 'bg-[#B3261E]' };
    switch (stockState) {
      case 'in':
        return {
          headline: 'In stock',
          detail: `· ${selectedVariantInventory} available in ${selectedSize}`,
          text: 'text-[var(--ink)]',
          sub: 'text-[var(--muted)]',
          dot: 'bg-[var(--ok)]',
          short: `In stock (${selectedVariantInventory})`,
        };
      case 'low':
        return {
          headline: `Only ${selectedVariantInventory} ${pluralItems(selectedVariantInventory ?? 0)} left`,
          detail: selectedSize ? `· in ${selectedSize}` : '',
          text: 'text-[var(--ink)]',
          sub: 'text-[var(--muted)]',
          dot: 'bg-[var(--gold)]',
          short: `Only ${selectedVariantInventory} left`,
        };
      case 'out':
        return { headline: 'Out of stock', detail: '· Please choose another size or colour.', ...red, short: 'Out of stock' };
      case 'unavailable':
        return { headline: 'This size and colour is unavailable', detail: '· Please choose another combination.', ...red, short: 'Unavailable' };
      case 'unknown':
        return {
          headline: 'Stock status unavailable',
          detail: '· Availability could not be confirmed for this variant.',
          text: 'text-[var(--charcoal)]',
          sub: 'text-[var(--muted)]',
          dot: 'bg-[var(--soft)]',
          short: 'Unknown',
        };
      case 'select': {
        const missing =
          !selectedSize && needsColor && !selectedColor
            ? 'a size and colour'
            : !selectedSize
              ? 'a size'
              : 'a colour';
        return {
          headline: `Select ${missing} to check availability`,
          detail: '',
          text: needSelection ? 'text-[#B3261E]' : 'text-[var(--ink)]',
          sub: 'text-[var(--muted)]',
          dot: 'bg-[var(--line)]',
          short: 'Select variant',
        };
      }
      default:
        return null;
    }
  })();

  /* ------------------------------------------------------------------------ */
  /* Selection handlers                                                       */
  /* ------------------------------------------------------------------------ */

  const chooseSize = (size: string) => {
    setSelectedSize(size);
    setNeedSelection(false);
  };

  const chooseColor = (color: string) => {
    setSelectedColor(color);
    setNeedSelection(false);
    // Never keep a size that this color does not have in stock.
    if (selectedSize && !inStock(findVariant(selectedSize, color))) {
      setSelectedSize(firstInStockSize(color));
    }
  };

  const openSizeGuide = () => {
    setActiveTab('size');
    setOpenAccordion('size');
    const desktop = window.matchMedia('(min-width: 1024px)').matches;
    window.requestAnimationFrame(() =>
      document
        .getElementById(desktop ? 'kovenik-details' : 'kovenik-details-m')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Add to Cart                                                              */
  /* Stock is re-checked against the live API on every press; the real cart  */
  /* store (guest + authenticated sync) performs the add with the quantity.   */
  /* ------------------------------------------------------------------------ */

  const handleAddToCart = async () => {
    if (cartBusy || !product) return;

    if (variants.length > 0 && !hasVariantSelection) {
      setNeedSelection(true);
      selectorsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (variants.length === 0 || !selectedSize) {
      showNotice({ title: 'Unable to add to cart', body: 'This product has no purchasable variant.', tone: 'error', icon: 'bag' });
      return;
    }

    setCartBusy(true);
    let navigating = false;
    try {
      let latest: ProductData | null = null;
      try {
        latest = await fetchProductBySlug(product.slug);
      } catch (error) {
        console.error('Stock re-check failed:', error);
      }
      if (!latest) {
        showNotice({ title: 'Could not verify stock', body: 'Please check your connection and try again.', tone: 'error', icon: 'bag' });
        return;
      }
      setProduct(latest);

      const latestVariants = latest.variants ?? [];
      const variant = latestVariants.find(
        (v) =>
          normalizeText(v.size) === normalizeText(selectedSize) &&
          (!needsColor || normalizeText(v.color) === normalizeText(selectedColor))
      );
      const available = parseInventory(variant?.inventory);

      if (!variant?.id || available === null || available <= 0) {
        showNotice({ title: 'Out of stock', body: 'This size and color just sold out. Please choose another.', tone: 'error', icon: 'bag' });
        return;
      }
      if (quantity > available) {
        setQuantity(available);
        showNotice({ title: `Only ${available} ${available === 1 ? 'item' : 'items'} left`, body: 'Quantity adjusted to what is in stock.', tone: 'error', icon: 'bag' });
        return;
      }

      const added = await addCartItem(
        {
          productId: latest.id,
          variantId: variant.id,
          slug: latest.slug,
          name: latest.name,
          image: latest.images?.[0] ?? '',
          size: variant.size,
          color: variant.color,
          price: Number(latest.price ?? 0),
          mrp: latest.mrp == null ? undefined : Number(latest.mrp),
        } as unknown as Parameters<typeof addCartItem>[0],
        quantity
      );
      if (added) {
        // Keep the button locked while the /cart navigation is in flight.
        navigating = true;
        router.push('/cart');
      }
    } finally {
      if (!navigating) setCartBusy(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Gallery handlers                                                         */
  /* ------------------------------------------------------------------------ */

  const openLightbox = (index: number) => {
    setLightboxImage(index);
    setLightboxOpen(true);
  };

  const goToLightboxImage = (direction: number) => {
    if (images.length < 2) return;

    setLightboxImage((current) => {
      const next = current + direction;
      if (next < 0) return images.length - 1;
      if (next >= images.length) return 0;
      return next;
    });
  };

  const handleLightboxTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    lightboxTouchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleLightboxTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (lightboxTouchStartX.current == null) return;

    const endX = event.changedTouches[0]?.clientX ?? lightboxTouchStartX.current;
    const distance = endX - lightboxTouchStartX.current;

    if (Math.abs(distance) > 45) {
      goToLightboxImage(distance < 0 ? 1 : -1);
    }

    lightboxTouchStartX.current = null;
  };

  /* ------------------------------------------------------------------------ */
  /* Render helpers                                                           */
  /* ------------------------------------------------------------------------ */

  const renderStockIndicator = () =>
    stockView ? (
      <div
        role="status"
        aria-live="polite"
        data-stock-state={stockState}
        className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[14px] leading-6"
      >
        <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${stockView.dot}`} />
        <span className={`font-semibold ${stockView.text}`}>{stockView.headline}</span>
        {stockView.detail && <span className={stockView.sub}>{stockView.detail}</span>}
      </div>
    ) : null;

  const selectedColorLabel = selectedColor ? selectedColor : needsColor ? 'Choose a colour' : '';

  // Visible SKU: the selected variant's SKU, otherwise the product's own SKU if the API provides one.
  const displaySku = (selectedVariant?.sku || product.sku || '').trim();

  const copySku = async () => {
    try {
      await navigator.clipboard.writeText(displaySku);
      setSkuCopied(true);
      window.setTimeout(() => setSkuCopied(false), 1600);
    } catch {
      setSkuCopied(false);
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'description', label: 'Description' },
    { key: 'wash', label: 'Fabric & Care' },
    { key: 'size', label: 'Size & Fit' },
    { key: 'returns', label: 'Shipping & Returns' },
  ];

  const collectionName = product.categoryLabel || product.category || '';

  // Specs strip: only attributes the product data really carries.
  const stripCols = (
    [
      ['Fabric', product.fabric],
      ['Fit', product.fit],
      ['Print', product.coverage],
    ] as [string, string | undefined][]
  ).filter((col): col is [string, string] => Boolean(col[1]));

  const specRows: [string, string][] = [];
  const addSpec = (label: string, value?: string) => {
    if (value) specRows.push([label, value]);
  };
  addSpec('Fit', product.fit);
  addSpec('Fabric', product.fabric);
  addSpec('Print / Coverage', product.coverage);
  addSpec('Collection', collectionName);
  addSpec('SKU', displaySku);

  // At most two badges, only from flags the product really carries.
  const badges = [
    product.bestSeller && 'Bestseller',
    product.limitedEdition && 'Limited edition',
    product.newArrival && 'New arrival',
    product.trending && 'Trending',
  ]
    .filter((label): label is string => Boolean(label))
    .slice(0, 2);

  const shortDescription = (() => {
    const text = product.description ?? '';
    if (text.length <= 170) return text;
    const cut = text.slice(0, 170);
    const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' '));
    return `${cut.slice(0, stop > 80 ? stop : 170).replace(/[.,;:\s]+$/, '')}…`;
  })();

  const specTable =
    specRows.length > 0 ? (
      <dl className="border-t border-[var(--line-2)]">
        {specRows.map(([term, value]) => (
          <div key={term} className="grid grid-cols-[40%_minmax(0,1fr)] gap-x-4 border-b border-[var(--line-2)] py-3.5 text-[14px] lg:text-[15px]">
            <dt className="text-[var(--soft)]">{term}</dt>
            <dd className="break-words text-[var(--ink)]">{value}</dd>
          </div>
        ))}
      </dl>
    ) : null;

  const renderTabBody = (key: TabKey) => {
    switch (key) {
      case 'description':
        return (
          <>
            <p>{product.description || 'No specific description provided for this style.'}</p>
            {product.fabricDetails && (
              <p className="mt-3">
                <strong className="font-semibold text-[var(--ink)]">Fabric details:</strong> {product.fabricDetails}
              </p>
            )}
          </>
        );
      case 'wash':
        return <p>{product.washCare || 'Wash care details are not available for this product.'}</p>;
      case 'size':
        return (
          <>
            {sizes.length > 0 ? (
              <p>
                <strong className="font-semibold text-[var(--ink)]">Available sizes:</strong> {sizes.join(', ')}
              </p>
            ) : (
              <p>Size information is not available for this product.</p>
            )}
            {product.fit && (
              <p className="mt-3">
                <strong className="font-semibold text-[var(--ink)]">Fit:</strong> {product.fit}
              </p>
            )}
          </>
        );
      default:
        return (
          <>
            <p>
              Hassle-free 7-day returns and exchanges from the date of delivery. Items must be
              unused, unwashed, and with all original tags intact.
            </p>
            <p className="mt-3">Cash on delivery is available. Shipping is free on orders above ₹999.</p>
          </>
        );
    }
  };

  const categoryHref = `/shop?category=${encodeURIComponent(product.category_slug ?? product.category ?? '')}`;
  const stickyVariantLabel = [selectedColor, selectedSize ? `Size ${selectedSize}` : null].filter(Boolean).join(' · ');

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <main
      data-kovenik-product
      style={{ fontFamily: 'Inter, Manrope, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
      className="relative min-h-screen overflow-x-clip bg-[var(--ivory)] pb-[calc(10rem+env(safe-area-inset-bottom))] text-[var(--ink)] md:pb-28 lg:pb-16"
    >
      <style>{FADE_CSS}</style>

      <section className="mx-auto w-full max-w-[1500px] lg:px-12 lg:pt-10">
        <div className="grid items-start lg:grid-cols-[minmax(0,1fr)_452px] lg:gap-x-16">
          {/* GALLERY */}
          <ProductStage key={product.id} images={images} name={product.name} onOpenFullscreen={openLightbox} />

          {/* PURCHASE PANEL: sits directly on the page, sticky on desktop */}
          <div
            ref={panelRef}
            style={{ top: stickyTop }}
            className="min-w-0 px-4 pb-8 pt-5 sm:px-6 lg:sticky lg:self-start lg:p-0"
          >
            <div className="flex flex-col gap-[22px]">
              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="text-[12px] text-[var(--soft)] lg:hidden">
                <Link href="/shop" className="hover:text-[var(--ink)]">Shop</Link>
                <span className="mx-1.5">/</span>
                <Link href={categoryHref} className="hover:text-[var(--ink)]">{collectionName || 'Products'}</Link>
              </nav>
              <nav aria-label="Breadcrumb" className="hidden flex-wrap items-center gap-x-2 text-[13px] text-[var(--soft)] lg:flex">
                <Link href="/" className="hover:text-[var(--ink)]">Home</Link>
                <span>/</span>
                <Link href="/shop" className="hover:text-[var(--ink)]">Shop</Link>
                <span>/</span>
                <Link href={categoryHref} className="hover:text-[var(--ink)]">{collectionName || 'Products'}</Link>
                <span>/</span>
                <span className="text-[var(--ink)]">{product.name}</span>
              </nav>

              {/* Badges */}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {badges.map((label, index) => (
                    <span
                      key={label}
                      className={`border border-[var(--ink)] px-3 py-1.5 text-[10px] font-semibold uppercase leading-none tracking-[0.14em] lg:text-[11px] ${
                        index === 0 ? 'bg-[var(--ink)] text-[var(--ivory)]' : 'text-[var(--ink)]'
                      }`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {/* Title + collection */}
              <div>
                <h1 className="text-[28px] font-bold leading-[1.05] tracking-[-0.02em] text-[var(--ink)] lg:text-[40px]">
                  {product.name}
                </h1>
                {Number(product.review_count) > 0 && Number(product.rating) > 0 && (
                  <a
                    href="#reviews"
                    onClick={(event) => {
                      event.preventDefault();
                      document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      window.history.replaceState(null, '', '#reviews');
                    }}
                    aria-label={`Rated ${Number(product.rating).toFixed(1)} out of 5 from ${product.review_count} reviews. Read reviews`}
                    className="mt-3 inline-flex items-center gap-2 text-[14px] text-[var(--ink)] hover:underline"
                  >
                    <span className="flex items-center" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-4 w-4 ${n <= Math.round(Number(product.rating)) ? 'fill-[#E53935] text-[#E53935]' : 'text-[#D2D2D2]'}`}
                        />
                      ))}
                    </span>
                    <span className="font-medium">{Number(product.rating).toFixed(1)}</span>
                    <span className="text-[var(--muted)]">({product.review_count} {Number(product.review_count) === 1 ? 'review' : 'reviews'})</span>
                  </a>
                )}
                {collectionName && (
                  <p className="mt-2 text-[13.5px] text-[var(--muted)] lg:text-[14px]">{collectionName}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[26px] font-semibold leading-none tracking-tight text-[var(--ink)] lg:text-[30px]">{formatINR(price)}</span>
                  {mrp !== undefined && mrp > price && (
                    <span className="text-[14px] text-[var(--soft)] line-through lg:text-[16px]">{formatINR(mrp)}</span>
                  )}
                  {discount > 0 && (
                    <span className="text-[14px] font-semibold text-[var(--gold)] lg:text-[16px]">{discount}% OFF</span>
                  )}
                </div>
                <p className="mt-2 text-[12px] text-[var(--soft)] lg:text-[13px]">+ 5% GST at checkout</p>
              </div>

              {shortDescription && (
                <p className="text-[14.5px] leading-[1.6] text-[var(--charcoal)] lg:text-[15px]">{shortDescription}</p>
              )}

              {/* Specs strip */}
              {stripCols.length > 0 && (
                <div
                  className="grid border-y border-[var(--line)]"
                  style={{ gridTemplateColumns: `repeat(${stripCols.length}, minmax(0, 1fr))` }}
                >
                  {stripCols.map(([label, value], index) => (
                    <div
                      key={label}
                      className={`min-w-0 py-3.5 ${index === 0 ? 'pr-3' : 'border-l border-[var(--line)] px-3 sm:px-4'}`}
                    >
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--soft)]">{label}</p>
                      <p className="mt-1 truncate text-[14px] font-semibold text-[var(--ink)]">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Offer line */}
              {hasBestOffer && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-y border-dashed border-[var(--line)] py-3.5 text-[14px] text-[var(--charcoal)]">
                  <span className="border border-[var(--gold)] px-2 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.14em] text-[var(--gold)]">
                    Best offer
                  </span>
                  <span>
                    Get it at <span className="font-semibold text-[var(--ink)]">{formatINR(bestPrice)}</span>
                  </span>
                  <span className="text-[13px] text-[var(--muted)] sm:ml-auto">Apply at checkout</span>
                </div>
              )}

              {/* COLOUR + SIZE */}
              <div ref={selectorsRef} className="scroll-mt-[calc(var(--header-h,96px)+16px)] space-y-[22px]">
                {colors.length > 0 && (
                  <div>
                    <p className="text-[14px] text-[var(--muted)]">
                      Colour: <span className="font-semibold text-[var(--ink)]">{selectedColorLabel}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3 px-1.5 pb-1 pt-1.5" role="group" aria-label="Select colour">
                      {colors.map((color) => {
                        const active = normalizeText(selectedColor) === normalizeText(color);
                        const soldOut = colorSoldOut(String(color));
                        const paint = swatchColor(String(color));

                        return paint ? (
                          <button
                            key={color}
                            type="button"
                            title={String(color)}
                            aria-label={String(color)}
                            aria-pressed={active}
                            disabled={soldOut && !active}
                            onClick={() => chooseColor(String(color))}
                            className={`kv-opt flex flex-col items-center gap-2 ${soldOut && !active ? 'cursor-not-allowed opacity-45' : ''}`}
                          >
                            <span
                              className="relative block h-[38px] w-[38px] rounded-full border border-black/15 lg:h-10 lg:w-10"
                              style={{
                                backgroundColor: paint,
                                boxShadow: active ? '0 0 0 3px var(--ivory), 0 0 0 4.5px var(--ink)' : undefined,
                              }}
                            >
                              {soldOut && (
                                <span aria-hidden="true" className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-[var(--ink)]/70" />
                              )}
                            </span>
                            <span className={`text-[12px] leading-none ${active ? 'font-bold text-[var(--ink)]' : 'text-[var(--muted)]'}`}>
                              {color}
                            </span>
                          </button>
                        ) : (
                          <button
                            key={color}
                            type="button"
                            aria-pressed={active}
                            disabled={soldOut && !active}
                            onClick={() => chooseColor(String(color))}
                            className={`kv-opt h-10 border px-4 text-[14px] font-semibold ${
                              active
                                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--ivory)]'
                                : `border-[#C3C3C3] bg-white text-[var(--ink)] hover:border-[var(--ink)] ${soldOut ? 'opacity-55 line-through' : ''}`
                            }`}
                          >
                            {color}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sizes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[14px] text-[var(--muted)]">
                        Size: <span className="font-semibold text-[var(--ink)]">{selectedSize ?? 'Choose your size'}</span>
                      </p>
                      <button
                        type="button"
                        onClick={openSizeGuide}
                        className="inline-flex items-center gap-1.5 text-[14px] text-[var(--ink)] underline underline-offset-4"
                      >
                        <Ruler className="h-4 w-4" /> Size guide
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-5 gap-[7px] lg:gap-2" role="group" aria-label="Select size">
                      {sizes.map((size) => {
                        const active = normalizeText(selectedSize) === normalizeText(size);
                        const soldOut = sizeSoldOut(String(size));
                        return (
                          <button
                            key={size}
                            type="button"
                            aria-pressed={active}
                            aria-label={soldOut ? `${size}, unavailable` : String(size)}
                            disabled={soldOut}
                            onClick={() => chooseSize(String(size))}
                            className={`kv-opt relative h-[46px] overflow-hidden border text-[14px] font-semibold disabled:cursor-not-allowed lg:h-12 ${
                              active
                                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--ivory)]'
                                : soldOut
                                  ? 'border-[var(--line-2)] bg-transparent text-[#B0B0B0]'
                                  : 'border-[#C3C3C3] bg-white text-[var(--ink)] hover:border-[var(--ink)]'
                            }`}
                          >
                            {size}
                            {soldOut && !active && (
                              <span
                                aria-hidden="true"
                                className="absolute inset-0"
                                style={{
                                  background:
                                    'linear-gradient(to top right, transparent calc(50% - 0.5px), #B0B0B0 calc(50% - 0.5px), #B0B0B0 calc(50% + 0.5px), transparent calc(50% + 0.5px))',
                                }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Stock */}
              {stockView && renderStockIndicator()}

              {/* BUY ROW: qty + wishlist on one line (mobile), full-width ADD TO CART below. Desktop: one row. */}
              <div className="flex flex-wrap gap-3 lg:flex-nowrap">
                {variants.length > 0 && (
                  <div
                    className="order-1 inline-flex h-[50px] flex-1 items-center justify-between border border-[#C3C3C3] bg-white lg:h-[54px] lg:flex-none"
                    role="group"
                    aria-label="Quantity"
                  >
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-full w-11 items-center justify-center text-[var(--ink)] transition hover:bg-[var(--ivory-2)] disabled:opacity-35"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-8 text-center text-[15px] font-semibold tabular-nums" aria-live="polite">{quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={selectedVariantInventory === null || quantity >= selectedVariantInventory}
                      onClick={() => setQuantity((q) => q + 1)}
                      className="flex h-full w-11 items-center justify-center text-[var(--ink)] transition hover:bg-[var(--ivory-2)] disabled:opacity-35"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <button
                  ref={addButtonRef}
                  type="button"
                  onClick={handleAddToCart}
                  disabled={stockBlocked || cartBusy}
                  aria-busy={cartBusy}
                  className="order-3 flex h-[52px] w-full items-center justify-center gap-3 bg-[var(--ink)] text-[14px] font-semibold uppercase tracking-[0.16em] text-[var(--ivory)] transition-colors hover:bg-[var(--charcoal)] disabled:cursor-not-allowed disabled:opacity-45 lg:order-2 lg:h-[54px] lg:min-w-0 lg:flex-1 lg:w-auto"
                >
                  <ShoppingBag className="h-[18px] w-[18px]" />
                  {cartBusy ? 'Adding…' : 'Add to Cart'}
                </button>

                <button
                  type="button"
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  aria-pressed={isWishlisted}
                  onClick={handleWishlistToggle}
                  disabled={wishlistBusy}
                  className={`order-2 flex h-[50px] w-[50px] shrink-0 items-center justify-center border border-[#C3C3C3] bg-white text-[var(--ink)] transition hover:border-[var(--ink)] lg:order-3 lg:h-[54px] lg:w-[54px] ${wishlistBusy ? 'opacity-60' : ''}`}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* TRUST */}
              <div className="grid grid-cols-3 border-y border-[var(--line)]">
                {[
                  { Icon: Banknote, label: 'COD available', sub: 'Pay on delivery' },
                  { Icon: Truck, label: 'Free shipping', sub: 'Above ₹999' },
                  { Icon: RotateCcw, label: 'Easy returns', sub: '7-day returns' },
                ].map(({ Icon, label, sub }, index) => (
                  <div
                    key={label}
                    className={`flex min-w-0 items-start gap-2 py-3.5 ${index === 0 ? 'pr-2' : 'border-l border-[var(--line)] px-2 sm:px-3'}`}
                  >
                    <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--charcoal)]" strokeWidth={1.5} />
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold leading-4 text-[var(--ink)] lg:text-[13px]">{label}</span>
                      <span className="mt-0.5 block text-[12px] leading-4 text-[var(--soft)]">{sub}</span>
                    </span>
                  </div>
                ))}
              </div>

              {displaySku && (
                <div className="inline-flex max-w-full items-center gap-2 text-[12px] text-[var(--soft)]">
                  <span>SKU</span>
                  <span className="truncate font-medium tracking-wide">{displaySku}</span>
                  <button
                    type="button"
                    aria-label={skuCopied ? 'SKU copied' : 'Copy SKU'}
                    onClick={copySku}
                    className="shrink-0 transition hover:text-[var(--ink)]"
                  >
                    {skuCopied ? <Check className="h-3.5 w-3.5 text-[var(--ink)]" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT DETAILS */}
      <section
        id="kovenik-details"
        className="mx-auto mt-4 w-full max-w-[1500px] scroll-mt-[calc(var(--header-h,96px)+16px)] px-4 sm:px-6 lg:mt-[88px] lg:px-12"
      >
        {/* Mobile / tablet: accordions */}
        <div id="kovenik-details-m" className="scroll-mt-[calc(var(--header-h,96px)+16px)] border-t border-[var(--line)] lg:hidden">
          {tabs.map(({ key, label }) => {
            const open = openAccordion === key;
            return (
              <div key={key} className="border-b border-[var(--line)]">
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`acc-${key}`}
                    onClick={() => setOpenAccordion(open ? null : key)}
                    className="flex min-h-[56px] w-full items-center justify-between gap-4 text-left text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--ink)]"
                  >
                    {label}
                    {open ? <Minus className="h-[18px] w-[18px] shrink-0" /> : <Plus className="h-[18px] w-[18px] shrink-0" />}
                  </button>
                </h3>
                <div
                  id={`acc-${key}`}
                  role="region"
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <div className="pb-6 text-[14px] leading-[1.7] text-[var(--charcoal)]">
                      {renderTabBody(key)}
                      {key === 'description' && specTable && <div className="mt-5">{specTable}</div>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: tabs */}
        <div className="hidden border-t border-[var(--line)] pt-10 lg:block">
          <div
            role="tablist"
            aria-label="Product details"
            onKeyDown={(event) => {
              if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
              event.preventDefault();
              const current = tabs.findIndex((tab) => tab.key === activeTab);
              const next = (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
              setActiveTab(tabs[next].key);
              document.getElementById(`tab-${tabs[next].key}`)?.focus();
            }}
            className="flex flex-wrap gap-x-10 gap-y-2 border-b border-[var(--line)]"
          >
            {tabs.map(({ key, label }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  id={`tab-${key}`}
                  role="tab"
                  type="button"
                  tabIndex={active ? 0 : -1}
                  aria-selected={active}
                  aria-controls={`panel-${key}`}
                  onClick={() => setActiveTab(key)}
                  className={`-mb-px whitespace-nowrap border-b-2 pb-4 text-[13px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                    active
                      ? 'border-[var(--ink)] text-[var(--ink)]'
                      : 'border-transparent text-[var(--soft)] hover:text-[var(--ink)]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className={`mt-10 grid gap-20 ${specTable ? 'grid-cols-[1.2fr_1fr]' : ''}`}>
            <div
              key={activeTab}
              id={`panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className="kv-tab-panel max-w-[70ch] text-[15.5px] leading-[1.7] text-[var(--charcoal)]"
            >
              {renderTabBody(activeTab)}
            </div>
            {specTable && <div>{specTable}</div>}
          </div>
        </div>
      </section>

      {/* CUSTOMER REVIEWS */}
      <ProductReviews
        slug={product.slug || slug}
        productName={product.name}
        productImage={images[0]}
        variantLabel={[selectedSize, selectedColor].filter(Boolean).join(' / ')}
      />

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <section className="mx-auto mt-14 w-full max-w-[1500px] px-4 sm:px-6 lg:mt-[88px] lg:px-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">Complete the look</p>
              <h2 className="mt-1.5 text-[22px] font-bold leading-tight tracking-[-0.01em] text-[var(--ink)] lg:text-[26px]">You may also like</h2>
            </div>
            <Link href={categoryHref} className="shrink-0 text-[14px] text-[var(--ink)] underline underline-offset-4">
              View all
            </Link>
          </div>

          <div className="kv-swiper -mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-4 lg:gap-6">
            {related.slice(0, 4).map((item, index) => {
              const itemPrice = Number(item.price ?? 0);
              const itemMrp = item.mrp == null ? undefined : Number(item.mrp);
              const itemDiscount = itemMrp !== undefined ? discountPercent(itemMrp, itemPrice) : 0;
              const itemImage = item.images?.[0];
              const itemWishlisted = isRelatedWishlisted(String(item.id));
              const href = `/product/${item.slug}`;

              return (
                <article key={item.id || item.slug} className="group relative w-[168px] min-w-0 shrink-0 snap-start md:w-auto">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[var(--ivory-2)]">
                    <Link href={href} aria-label={item.name} className="absolute inset-0 block">
                      {itemImage ? (
                        <img
                          src={itemImage}
                          alt={item.name}
                          className="h-full w-full object-cover object-center transition-transform duration-500 lg:group-hover:scale-[1.03]"
                          loading={index > 0 ? 'lazy' : 'eager'}
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center px-2 text-center text-[12px] text-[var(--soft)]">No image available</span>
                      )}
                    </Link>

                    {(item.bestSeller || item.best_seller) && (
                      <span className="pointer-events-none absolute left-0 top-3.5 bg-[var(--ink)] px-2.5 py-[5px] text-[10px] font-semibold uppercase leading-none tracking-[0.14em] text-white lg:text-[11px]">
                        Bestseller
                      </span>
                    )}

                    <button
                      type="button"
                      aria-label={itemWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                      aria-pressed={itemWishlisted}
                      onClick={() => toggleRelatedWishlist(item)}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ivory)]/[0.94] text-[var(--ink)] transition active:scale-95 lg:h-[34px] lg:w-[34px]"
                    >
                      <Heart className={`h-4 w-4 ${itemWishlisted ? 'fill-[var(--ink)]' : ''}`} strokeWidth={1.6} />
                    </button>
                  </div>

                  <div className="flex min-w-0 flex-col gap-1.5 pt-3.5">
                    <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--soft)]">Kovenik</p>
                    <Link
                      href={href}
                      title={item.name}
                      className="line-clamp-2 text-[14px] font-medium leading-[1.3] text-[var(--ink)] lg:line-clamp-1 lg:text-[16px]"
                    >
                      {item.name}
                    </Link>
                    <p className="flex flex-wrap items-baseline gap-x-2 text-[15px] lg:text-[17px]">
                      <span className="font-semibold text-[var(--ink)]">{formatINR(itemPrice)}</span>
                      {itemMrp !== undefined && itemMrp > itemPrice && (
                        <span className="text-[12px] text-[var(--soft)] line-through lg:text-[14px]">{formatINR(itemMrp)}</span>
                      )}
                      {itemDiscount > 0 && (
                        <span className="text-[12px] font-semibold text-[var(--gold)] lg:text-[14px]">{itemDiscount}% OFF</span>
                      )}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <MobileShopBar />

      {/* MOBILE STICKY BAR: appears only after the in-flow Add to Cart scrolls away; hides at the footer */}
      {!addInView && !footerInView && (
        <div className="fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 border-t border-[var(--line)] bg-white px-4 py-3 md:bottom-0 md:pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[17px] font-semibold leading-6 text-[var(--ink)]">{formatINR(price)}</span>
                {mrp !== undefined && mrp > price && (
                  <span className="text-[12px] text-[var(--soft)] line-through">{formatINR(mrp)}</span>
                )}
              </div>
              {stickyVariantLabel && (
                <p className="truncate text-[12px] leading-4 text-[var(--muted)]">{stickyVariantLabel}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={stockBlocked || cartBusy}
              className="h-12 shrink-0 bg-[var(--ink)] px-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-[var(--ivory)] transition-colors disabled:cursor-not-allowed disabled:opacity-45"
            >
              {cartBusy ? 'Adding…' : 'Add to Cart'}
            </button>
          </div>
        </div>
      )}

      {/* NOTICE (wishlist + cart feedback) */}
      {notice && (
        <div
          className="fixed left-1/2 top-5 z-[10000] w-[calc(100%-2rem)] max-w-[380px] -translate-x-1/2"
          role="status"
          aria-live="polite"
        >
          <div
            className={`relative flex items-start gap-3 border bg-white px-4 py-3.5 text-[var(--ink)] ${notice.tone === 'error' ? 'border-red-500/60' : 'border-[var(--ink)]/70'}`}
          >
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center ${notice.tone === 'error' ? 'text-red-600' : 'text-[var(--charcoal)]'}`}>
              {notice.icon === 'heart' ? <Heart className="h-[18px] w-[18px] fill-current" /> : <ShoppingBag className="h-[18px] w-[18px]" />}
            </span>

            <div className="min-w-0 flex-1 pr-5">
              <p className="text-[14px] font-semibold leading-5">{notice.title}</p>
              {notice.body && <p className="mt-0.5 text-[13px] leading-5 text-[var(--muted)]">{notice.body}</p>}
            </div>

            <button
              type="button"
              onClick={() => setNotice(null)}
              className="absolute right-3 top-3 text-[var(--muted)] transition hover:text-[var(--ink)]"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* FULL SCREEN IMAGE VIEWER */}
      {lightboxOpen && images.length > 0 && (
        <div
          className="pointer-events-auto fixed inset-0 z-[9999] flex h-dvh w-dvw items-center justify-center overscroll-none bg-[var(--ivory)]"
          role="dialog"
          aria-modal="true"
          aria-label="Product image viewer"
          onTouchStart={handleLightboxTouchStart}
          onTouchEnd={handleLightboxTouchEnd}
        >
          <button type="button" onClick={() => setLightboxOpen(false)} className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))] z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.92] text-[var(--ink)]" aria-label="Close image viewer">
            <X className="h-5 w-5" />
          </button>

          <div className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-20 rounded-full bg-white/[0.92] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink)]">
            {lightboxImage + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <button type="button" onClick={() => goToLightboxImage(-1)} className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.92] text-[var(--ink)]" aria-label="Previous image"><ChevronLeft className="h-5 w-5" /></button>
          )}

          <div className="flex h-dvh w-full items-center justify-center p-0">
            <img
              src={images[lightboxImage]}
              alt={`${product.name} fullscreen`}
              className="block h-auto max-h-[calc(100dvh-5rem)] w-auto max-w-[calc(100vw-1rem)] select-none object-contain"
              draggable={false}
            />
          </div>

          {images.length > 1 && (
            <button type="button" onClick={() => goToLightboxImage(1)} className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.92] text-[var(--ink)]" aria-label="Next image"><ChevronRight className="h-5 w-5" /></button>
          )}
        </div>
      )}
    </main>
  );
}
