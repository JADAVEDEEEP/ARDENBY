'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crown,
  Layers,
  Heart,
  Minus,
  Plus,
  Package,
  RotateCcw,
  Ruler,
  Shirt,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  X,
} from 'lucide-react';
import { apiUrl } from '@/lib/api-url';
import { formatINR, discountPercent } from '@/lib/format';
import { useWishlistStore } from '@/store/wishlist-store';
import { useCartStore } from '@/store/cart-store';
import { MobileShopBar } from '@/components/home/MobileShopBar';
import { MotionConfig } from 'framer-motion';
import { Reveal } from '@/components/home/ui/Reveal';
import { ProductStage } from './product-stage';

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

// Brushed metallic gold: dark edges, bright reflective band through the middle.
const GOLD_METAL =
  'bg-[#222222]';

const FADE_CSS = `
@keyframes kvFade{from{opacity:0}to{opacity:1}}
.kv-fade{animation:kvFade .35s ease both}
body:has([data-kovenik-product]){background:#FFFFFF}

/* ---- surfaces (flat: no ambient glow, rings or floor shadow) ---- */
.kv-ambient{background:none}
.kv-panel{background:#F4F0E8;border:1px solid #E2E0DB;box-shadow:none}
.kv-silver-title{color:#171717;background:none;-webkit-text-fill-color:currentColor}
.kv-hair{height:1px;background:#E2E0DB}

/* ---- image stage ---- */
.kv-stage-env{background:#E8E6E1;border:1px solid #E2E0DB}
.kv-stage-in{animation:kvStageIn .6s cubic-bezier(.2,.8,.2,1) both}
@keyframes kvStageIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.kv-card{box-shadow:none}
.kv-zoom-layer{transition:transform .35s cubic-bezier(.2,.8,.2,1);will-change:transform}
.kv-sheen-layer{display:none}
.kv-ring{display:none}
.kv-floor{display:none}
.kv-ctl{display:flex;height:2.75rem;width:2.75rem;align-items:center;justify-content:center;border-radius:9999px;
  border:1px solid #E2E0DB;background:#FFFFFF;color:#171717;transition:border-color .25s,background .25s}
button.kv-ctl:hover{border-color:#222222;background:#F4F0E8}
.kv-swiper{scrollbar-width:none;-webkit-overflow-scrolling:touch}
.kv-swiper::-webkit-scrollbar{display:none}

/* ---- controls ---- */
.kv-gold-btn{position:relative;isolation:isolate}
.kv-gold-btn::after{display:none}
.kv-opt{transition:border-color .25s,background .25s,color .25s}

/* ---- tabs ---- */
.kv-tab{position:relative}
.kv-tab::after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:3px;background:#B08D57;
  transform:scaleX(0);transform-origin:left;transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.kv-tab[aria-selected='true']::after{transform:scaleX(1)}
.kv-tab-panel{animation:kvTabIn .35s cubic-bezier(.2,.8,.2,1) both}
@keyframes kvTabIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

@media (prefers-reduced-motion:reduce){
  .kv-fade,.kv-stage-in,.kv-tab-panel{animation:none}
  .kv-zoom-layer,.kv-opt,.kv-tab::after{transition:none}
}
`;


export default function ProductPage() {
  const params = useParams<{ slug?: string }>();
  const slug = params?.slug ?? '';

  const [product, setProduct] = useState<ProductData | null>(null);
  const [related, setRelated] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<TabKey | null>('description');
  const [homeInView, setHomeInView] = useState(false);
  const homeRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    const element = homeRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setHomeInView(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [loading, product?.id, related.length]);

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
      <main className="min-h-screen bg-[#FFFFFF] px-4 py-12">
        <div className="mx-auto max-w-[1500px] animate-pulse">
          <div className="h-4 w-48 bg-[#F4F0E8]" />
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.72fr]">
            <div className="aspect-[4/5] bg-[#F4F0E8]" />
            <div className="space-y-4">
              <div className="h-4 w-24 bg-[#F4F0E8]" />
              <div className="h-12 w-3/4 bg-[#F4F0E8]" />
              <div className="h-8 w-32 bg-[#F4F0E8]" />
              <div className="h-24 bg-[#F4F0E8]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FFFFFF] px-6 text-center">
        <div>
          <p className="font-serif text-2xl tracking-[0.12em] text-[#4A4A4A]">KOVENIK</p>
          <h1 className="mt-3 text-3xl text-[#171717]">Product not found</h1>
          <p className="mt-2 text-sm text-[#5C5C5C]">This piece may have been removed or the link is incorrect.</p>
          <Link
            href="/shop"
            className={`mt-6 inline-flex border border-[#171717]/60 px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#FFFFFF] ${GOLD_METAL}`}
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
  const rating = Number(product.rating ?? 0);
  const reviewCount = Number(product.reviewCount ?? product.review_count ?? 0);
  const discount = mrp !== undefined ? discountPercent(mrp, price) : 0;
  const images: string[] = product.images ?? [];
  const hasRating = rating > 0 || reviewCount > 0;
  const hasBestOffer = bestPrice > 0 && bestPrice < price;

  const stockView = (() => {
    const pluralItems = (n: number) => (n === 1 ? 'item' : 'items');
    const red = {
      box: 'border-[#B3261E]/45 bg-[#B3261E]/10',
      text: 'text-[#B3261E]',
      sub: 'text-[#B3261E]/80',
      dot: 'bg-[#B3261E]',
    };
    switch (stockState) {
      case 'in':
        return {
          headline: 'In stock',
          detail: '',
          quantity: selectedVariantInventory,
          box: 'border-[#171717]/[0.12] bg-[#171717]/[0.03]',
          text: 'text-[#171717]',
          sub: 'text-[#5C5C5C]',
          dot: 'bg-[#1B7A43]',
          short: `In stock (${selectedVariantInventory})`,
        };
      case 'low':
        return {
          headline: `Only ${selectedVariantInventory} ${pluralItems(selectedVariantInventory ?? 0)} left`,
          detail: '',
          quantity: selectedVariantInventory,
          box: 'border-[#B08D57]/45 bg-[#B08D57]/10',
          text: 'text-[#8C6D3A]',
          sub: 'text-[#8C6D3A]/80',
          dot: 'bg-[#B08D57]',
          short: `Only ${selectedVariantInventory} left`,
        };
      case 'out':
        return { headline: 'Out of stock', detail: 'Please choose another size or color.', quantity: null, ...red, short: 'Out of stock' };
      case 'unavailable':
        return { headline: 'This size and color is unavailable', detail: 'Please choose another combination.', quantity: null, ...red, short: 'Unavailable' };
      case 'unknown':
        return {
          headline: 'Stock status unavailable',
          detail: 'Availability could not be confirmed for this variant.',
          quantity: null,
          box: 'border-[#171717]/20 bg-[#171717]/[0.03]',
          text: 'text-[#4A4A4A]',
          sub: 'text-[#5C5C5C]',
          dot: 'bg-[#222222]',
          short: 'Unknown',
        };
      case 'select': {
        const missing =
          !selectedSize && needsColor && !selectedColor
            ? 'a size and color'
            : !selectedSize
              ? 'a size'
              : 'a color';
        return {
          headline: `Select ${missing} to check availability`,
          detail: '',
          quantity: null,
          box: needSelection ? 'border-[#171717]/60 bg-[#171717]/[0.06]' : 'border-[#171717]/[0.12] bg-[#171717]/[0.03]',
          text: 'text-[#171717]',
          sub: 'text-[#5C5C5C]',
          dot: 'bg-[#E2DDD0]',
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
        className={`flex w-full flex-wrap items-center gap-x-4 gap-y-1 border px-4 py-3 ${stockView.box}`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${stockView.dot}`} />
          <span className={`text-base font-semibold leading-6 ${stockView.text}`}>{stockView.headline}</span>
        </div>
        {stockView.quantity !== null && (
          <span className={`text-base leading-6 sm:ml-auto ${stockView.sub}`}>
            Available: <span className={`font-bold ${stockView.text}`}>{stockView.quantity}</span>
          </span>
        )}
        {stockView.detail && (
          <span className={`w-full text-base leading-6 ${stockView.sub}`}>{stockView.detail}</span>
        )}
      </div>
    ) : null;

  const selectedColorLabel = selectedColor ? selectedColor : needsColor ? 'Choose a color' : '';

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

  const specRows = [
    product.fit && ['Fit', product.fit],
    product.fabric && ['Fabric', product.fabric],
    product.coverage && ['Coverage', product.coverage],
  ].filter((row): row is string[] => Boolean(row));

  // Product badges: only flags the product data really carries.
  const badges = [
    product.bestSeller && { label: 'Bestseller', Icon: Crown, tone: 'border-[#B08D57]/40 bg-[#B08D57]/10 text-[#8C6D3A]' },
    product.newArrival && { label: 'New arrival', Icon: Sparkles, tone: 'border-[#2B5BA8]/40 bg-[#2B5BA8]/10 text-[#2B5BA8]' },
    product.trending && { label: 'Trending', Icon: Sparkles, tone: 'border-[#1B7A43]/40 bg-[#1B7A43]/10 text-[#1B7A43]' },
    product.limitedEdition && { label: 'Limited edition', Icon: Sparkles, tone: 'border-[#171717]/30 bg-[#171717]/10 text-[#4A4A4A]' },
  ].filter((badge): badge is { label: string; Icon: typeof Crown; tone: string } => Boolean(badge));

  // Feature chips under the price: real product attributes only.
  const featureChips = [
    product.fabric ? { Icon: Layers, label: product.fabric } : null,
    product.fit ? { Icon: Ruler, label: product.fit } : null,
    product.coverage ? { Icon: Shirt, label: product.coverage } : null,
  ].filter((chip): chip is { Icon: typeof Layers; label: string } => Boolean(chip));

  const detailImages = images.slice(1, 4);

  const shortDescription = (() => {
    const text = product.description ?? '';
    if (text.length <= 170) return text;
    const cut = text.slice(0, 170);
    const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' '));
    return `${cut.slice(0, stop > 80 ? stop : 170).replace(/[.,;:\s]+$/, '')}…`;
  })();

  const renderTabBody = (key: TabKey) => {
    switch (key) {
      case 'description':
        return (
          <>
            <p>{product.description || 'No specific description provided for this style.'}</p>
            {product.fabricDetails && (
              <p className="mt-3">
                <strong className="font-semibold text-[#171717]">Fabric details:</strong> {product.fabricDetails}
              </p>
            )}
            {specRows.length > 0 && (
              <dl className="mt-4 grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-[#D6D0C2] pt-4">
                {specRows.map(([term, value]) => (
                  <div key={term} className="contents">
                    <dt className="font-semibold text-[#4A4A4A]">{term}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
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
                <strong className="font-semibold text-[#171717]">Available sizes:</strong> {sizes.join(', ')}
              </p>
            ) : (
              <p>Size information is not available for this product.</p>
            )}
            {product.fit && (
              <p className="mt-3">
                <strong className="font-semibold text-[#171717]">Fit:</strong> {product.fit}
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

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <MotionConfig reducedMotion="user">
    <main
      data-kovenik-product
      style={{ fontFamily: 'Inter, Manrope, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
      className="relative min-h-screen overflow-x-clip bg-[#FFFFFF] pb-28 text-[#171717] md:pb-24 lg:pb-16"
    >
      <style>{FADE_CSS}</style>
      <div aria-hidden="true" className="kv-ambient pointer-events-none absolute inset-0" />

      {/* BREADCRUMB */}
      <div className="border-b border-[#D6D0C2]">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto flex max-w-[1500px] items-center gap-2 overflow-x-auto whitespace-nowrap px-4 py-3.5 text-sm text-[#5C5C5C] sm:px-6 lg:px-10"
        >
          <Link href="/" className="transition-colors hover:text-[#4A4A4A]">Home</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-[#5C5C5C]" />
          <Link href="/shop" className="transition-colors hover:text-[#4A4A4A]">Shop</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-[#5C5C5C]" />
          <Link
            href={`/shop?category=${encodeURIComponent(product.category_slug ?? product.category ?? '')}`}
            className="transition-colors hover:text-[#4A4A4A]"
          >
            {product.categoryLabel || product.category || 'Products'}
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-[#5C5C5C]" />
          <span className="truncate text-[#171717]">{product.name}</span>
        </nav>
      </div>

      <section className="relative mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <div className="grid items-start gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] xl:gap-x-12">
          {/* GALLERY: layered 2.5D stage (desktop) / swipe gallery (mobile) */}
          <ProductStage
            key={product.id}
            images={images}
            name={product.name}
            onOpenFullscreen={openLightbox}
          />

          {/* PRODUCT INFO */}
          <div className="kv-panel min-w-0 p-5 sm:p-6 lg:p-8 xl:p-10">
            {badges.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {badges.map(({ label, Icon, tone }) => (
                  <span
                    key={label}
                    className={`inline-flex items-center gap-2 border px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] backdrop-blur ${tone}`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </span>
                ))}
              </div>
            )}

            <h1 className="kv-silver-title font-oswald text-[1.75rem] font-medium leading-[1.15] tracking-tight sm:text-[2.1rem] xl:text-[2.5rem]">
              {product.name}
            </h1>
            {(product.categoryLabel || product.category) && (
              <p className="mt-1.5 text-base text-[#5C5C5C]">{product.categoryLabel || product.category}</p>
            )}
            {shortDescription && (
              <p className="mt-3 hidden max-w-[56ch] text-[15px] leading-7 text-[#5C5C5C] lg:block">{shortDescription}</p>
            )}

            {hasRating && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-0.5 text-[#4A4A4A]" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className={`h-5 w-5 ${i < Math.round(rating) ? 'fill-current' : 'text-[#5C5C5C]'}`} />
                  ))}
                </div>
                <span className="text-base text-[#4A4A4A]">
                  <span className="font-semibold text-[#171717]">{rating.toFixed(1)}</span> ({reviewCount} reviews)
                </span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-2">
              <span className="text-[1.9rem] font-semibold tracking-tight text-[#171717] sm:text-[2.25rem]">{formatINR(price)}</span>
              {mrp !== undefined && mrp > price && (
                <span className="pb-1 text-lg text-[#5C5C5C] line-through">{formatINR(mrp)}</span>
              )}
              {discount > 0 && (
                <span className="mb-1 border border-[#B3261E]/70 bg-[#B3261E] text-[#FFFFFF] px-3 py-1 text-sm font-bold">
                  {discount}% OFF
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm text-[#5C5C5C]">+ 5% GST at checkout</p>

            {featureChips.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {featureChips.map(({ Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 border border-[#D6D0C2] bg-[#F4F0E8] px-3.5 py-2.5 text-[15px] text-[#4A4A4A]"
                  >
                    <Icon className="h-5 w-5 text-[#4A4A4A]" /> {label}
                  </span>
                ))}
              </div>
            )}

            {hasBestOffer && (
              <div className="mt-5 border border-[#171717]/[0.12] bg-[#171717]/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-[#222222] px-2.5 py-1 text-xs font-bold text-[#FFFFFF]">Best offer</span>
                    <span className="text-lg text-[#171717]">
                      Get it at <span className="font-bold text-[#4A4A4A]">{formatINR(bestPrice)}</span>
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[#4A4A4A]">Apply at checkout</span>
                </div>
                <p className="mt-2 text-base leading-7 text-[#4A4A4A]">
                  Applicable on select items, purchases &amp; checkout promos.
                </p>
              </div>
            )}

            {/* COLOR + SIZE */}
            <div ref={selectorsRef} className="mt-6 scroll-mt-24">
              {colors.length > 0 && (
                <div>
                  <p className="text-base text-[#5C5C5C]">
                    Color: <span className="font-semibold text-[#171717]">{selectedColorLabel}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3" role="group" aria-label="Select color">
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
                          className={`kv-opt relative flex h-14 w-14 items-center justify-center border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#222222] ${active ? 'border-[#222222] ' : 'border-[#D6D0C2] hover:border-[#D6D0C2]'} ${soldOut && !active ? 'cursor-not-allowed opacity-45' : ''}`}
                        >
                          <span className="h-9 w-9 rounded-full border border-[#171717]/20" style={{ backgroundColor: paint }} />
                          {soldOut && <span aria-hidden="true" className="absolute h-px w-10 rotate-45 bg-[#171717]/70" />}
                        </button>
                      ) : (
                        <button
                          key={color}
                          type="button"
                          aria-pressed={active}
                          disabled={soldOut && !active}
                          onClick={() => chooseColor(String(color))}
                          className={`kv-opt h-12 border px-4 text-base font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#222222] ${
                            active
                              ? 'border-[#171717]/70 bg-[#222222] text-[#FFFFFF] '
                              : `border-[#D6D0C2] bg-[#F4F0E8] text-[#4A4A4A] hover:border-[#D6D0C2] ${soldOut ? 'opacity-55 line-through' : ''}`
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
                <div className={colors.length > 0 ? 'mt-6' : ''}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base text-[#5C5C5C]">
                      Size: <span className="font-semibold text-[#171717]">{selectedSize ?? 'Choose your size'}</span>
                    </p>
                    <button
                      type="button"
                      onClick={openSizeGuide}
                      className="inline-flex items-center gap-2 text-base text-[#5C5C5C] underline underline-offset-4 transition hover:text-[#4A4A4A]"
                    >
                      <Ruler className="h-4 w-4" /> Size guide
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2.5" role="group" aria-label="Select size">
                    {sizes.map((size) => {
                      const active = normalizeText(selectedSize) === normalizeText(size);
                      const soldOut = sizeSoldOut(String(size));
                      return (
                        <button
                          key={size}
                          type="button"
                          aria-pressed={active}
                          disabled={soldOut}
                          onClick={() => chooseSize(String(size))}
                          className={`kv-opt h-[52px] min-w-[60px] border px-4 text-base font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#222222] disabled:cursor-not-allowed ${
                            active
                              ? 'border-[#171717]/70 bg-[#222222] text-[#FFFFFF] '
                              : soldOut
                                ? 'border-[#171717]/10 bg-[#F4F0E8] text-[#5C5C5C] line-through opacity-50'
                                : 'border-[#D6D0C2] bg-[#F4F0E8] text-[#4A4A4A] hover:border-[#D6D0C2]'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* STOCK: one indicator, one calculation, same on every breakpoint. */}
            {stockView && <div className="mt-5">{renderStockIndicator()}</div>}

            {/* QUANTITY */}
            {variants.length > 0 && (
              <div className="mt-5 flex items-center justify-between gap-4">
                <span className="text-base text-[#5C5C5C]">Quantity</span>
                <div className="inline-flex items-center border border-[#171717]/[0.12] bg-[#F4F0E8]" role="group" aria-label="Quantity">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-11 w-11 items-center justify-center text-[#171717] transition hover:bg-[#171717]/10 disabled:opacity-35"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-base font-semibold tabular-nums text-[#171717]" aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={selectedVariantInventory === null || quantity >= selectedVariantInventory}
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-11 w-11 items-center justify-center text-[#171717] transition hover:bg-[#171717]/10 disabled:opacity-35"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ADD TO CART + WISHLIST */}
            <div className="mt-4 flex gap-3">
              <button
                ref={addButtonRef}
                type="button"
                onClick={handleAddToCart}
                disabled={stockBlocked || cartBusy}
                aria-busy={cartBusy}
                className={`kv-gold-btn relative flex h-14 min-w-0 flex-1 items-center justify-center gap-3 overflow-hidden border border-[#171717]/60 text-[15px] font-semibold uppercase tracking-[0.12em] text-[#FFFFFF]  transition-all [text-shadow:0_1px_0_rgba(255,255,255,.25)] hover:brightness-110 active:scale-[.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#222222] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:brightness-100 ${GOLD_METAL}`}
              >
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#171717]/50" />
                <ShoppingBag className="h-5 w-5" />
                {cartBusy ? 'Adding…' : 'Add to Cart'}
              </button>
              <button
                type="button"
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={isWishlisted}
                onClick={handleWishlistToggle}
                disabled={wishlistBusy}
                className={`flex h-14 w-14 shrink-0 items-center justify-center border border-[#D6D0C2] bg-[#F4F0E8] text-[#4A4A4A] transition hover:border-[#D6D0C2] ${isWishlisted ? 'border-[#222222] ' : ''} ${wishlistBusy ? 'opacity-60' : ''}`}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* TRUST */}
            <div className="kv-hair mt-7" />
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
              {[
                { Icon: Truck, label: 'COD available', sub: 'Pay on delivery' },
                { Icon: ShieldCheck, label: 'Free shipping', sub: 'On orders above ₹999' },
                { Icon: RotateCcw, label: 'Easy returns', sub: '7 days hassle free' },
              ].map(({ Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="h-8 w-8 shrink-0 text-[#5C5C5C]" strokeWidth={1.4} />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium leading-5 text-[#171717]">{label}</span>
                    {sub && <span className="mt-0.5 block text-sm leading-5 text-[#5C5C5C]">{sub}</span>}
                  </span>
                </div>
              ))}
            </div>

            {displaySku && (
              <div className="mt-5 inline-flex max-w-full items-center gap-2 text-sm text-[#5C5C5C]">
                <span>SKU</span>
                <span className="truncate font-semibold tracking-wide text-[#5C5C5C]">{displaySku}</span>
                <button
                  type="button"
                  aria-label={skuCopied ? 'SKU copied' : 'Copy SKU'}
                  onClick={copySku}
                  className="shrink-0 transition hover:text-[#4A4A4A]"
                >
                  {skuCopied ? <Check className="h-3.5 w-3.5 text-[#171717]" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* KEY HIGHLIGHTS STRIP */}
      <section className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-10">
        <Reveal>
        <div className="grid grid-cols-2 gap-px border border-[#171717]/10 bg-[#171717]/10 lg:auto-cols-fr lg:grid-flow-col">
          {[
            product.fabric ? { Icon: Layers, label: 'Fabric', value: product.fabric, tone: '' } : null,
            product.fit ? { Icon: Ruler, label: 'Fit', value: product.fit, tone: '' } : null,
            product.coverage ? { Icon: Shirt, label: 'Coverage', value: product.coverage, tone: '' } : null,
            {
              Icon: Package,
              label: 'Availability',
              value: stockView
                ? stockView.quantity !== null
                  ? `${stockView.quantity} available`
                  : stockView.short
                : '—',
              tone: stockView ? stockView.text : '',
            },
          ]
            .filter((tile): tile is { Icon: typeof Ruler; label: string; value: string; tone: string } => Boolean(tile))
            .map(({ Icon, label, value, tone }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-[#F4F0E8] px-4 py-4 odd:last:col-span-2 sm:gap-4 sm:px-6 sm:py-5 lg:odd:last:col-span-1"
              >
                <Icon className="h-8 w-8 shrink-0 text-[#4A4A4A]" strokeWidth={1.3} />
                <span className="min-w-0">
                  <span className="block text-sm text-[#5C5C5C]">{label}</span>
                  <span className={`block truncate text-base font-medium ${tone || 'text-[#171717]'}`}>{value}</span>
                </span>
              </div>
            ))}
        </div>
        </Reveal>
      </section>

      {/* DETAILS TABS */}
      <section id="kovenik-details" className="mx-auto w-full max-w-[1500px] scroll-mt-6 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <Reveal>
        <div className="kv-hair mb-8 hidden lg:block" />
        {/* Mobile: accordions */}
        <div id="kovenik-details-m" className="scroll-mt-24 border-t border-[#171717]/[0.12] lg:hidden">
          {tabs.map(({ key, label }) => {
            const open = openAccordion === key;
            return (
              <div key={key} className="border-b border-[#171717]/[0.12]">
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`acc-${key}`}
                    onClick={() => setOpenAccordion(open ? null : key)}
                    className="flex min-h-[52px] w-full items-center justify-between gap-4 py-3 text-left text-[13px] font-semibold uppercase tracking-[0.16em] text-[#171717]"
                  >
                    {label}
                    <ChevronDown className={`h-5 w-5 shrink-0 text-[#5C5C5C] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                  </button>
                </h3>
                <div
                  id={`acc-${key}`}
                  role="region"
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <div className="pb-5 text-[15px] leading-[1.75] text-[#4A4A4A]">{renderTabBody(key)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: tabs */}
        <div className="hidden lg:block">
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#5C5C5C]">Product details</p>
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
          className="flex gap-7 overflow-x-auto border-b border-[#171717]/10"
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
                className={`kv-tab shrink-0 whitespace-nowrap pb-3.5 text-[13px] font-semibold uppercase tracking-[0.18em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#222222] sm:text-sm ${active ? 'text-[#171717]' : 'text-[#5C5C5C] hover:text-[#171717]'}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className={`mt-8 grid gap-10 ${detailImages.length > 0 ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]' : ''}`}>
          <div
            key={activeTab}
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="kv-tab-panel max-w-[70ch] text-base leading-[1.75] text-[#4A4A4A]"
          >
            {renderTabBody(activeTab)}
          </div>

          {detailImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {detailImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  aria-label={`Open image ${index + 2} fullscreen`}
                  onClick={() => openLightbox(index + 1)}
                  className="aspect-[4/5] overflow-hidden border border-[#D6D0C2] bg-[#F4F0E8] transition hover:border-[#D6D0C2]"
                >
                  <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
        </Reveal>
      </section>

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <section ref={homeRef} className="border-t border-[#D6D0C2] bg-[#F4F0E8]">
          <div className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
            <div className="flex items-end justify-between">
              <h2 className="text-xl font-semibold leading-none text-[#171717] sm:text-2xl">You may also like</h2>
              <Link
                href={`/shop?category=${encodeURIComponent(product.category_slug ?? product.category ?? '')}`}
                className="hidden items-center gap-2 text-sm font-semibold text-[#4A4A4A] transition-colors hover:text-[#171717] sm:flex"
              >
                View all <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </div>

            <div className="kv-swiper -mx-4 mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 lg:gap-8 xl:gap-10">
              {related.slice(0, 4).map((item, index) => {
                const itemPrice = Number(item.price ?? 0);
                const itemMrp = item.mrp == null ? undefined : Number(item.mrp);
                const itemBestPrice = Number(item.bestPrice ?? item.best_price ?? 0);
                const itemRating = Number(item.rating ?? 0);
                const itemReviews = Number(item.reviewCount ?? item.review_count ?? 0);
                const itemDiscount = itemMrp !== undefined ? discountPercent(itemMrp, itemPrice) : 0;
                const itemImages = item.images ?? [];
                const itemWishlisted = isRelatedWishlisted(String(item.id));

                return (
                  <Link key={item.id || item.slug} href={`/product/${item.slug}`} className="group block h-full w-[68%] min-w-0 shrink-0 snap-start sm:w-auto">
                    <article className="flex h-full flex-col overflow-hidden border border-[#D6D0C2] bg-[#FFFFFF] transition-all duration-300 hover:border-[#171717]/60 ">
                      <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-[#F4F0E8]">
                        {itemImages[0] ? (
                          <img
                            src={itemImages[0]}
                            alt={item.name}
                            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                            loading={index > 0 ? 'lazy' : 'eager'}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-[#5C5C5C]">No image available</div>
                        )}

                        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5 sm:left-3 sm:top-3">
                          {itemDiscount > 0 && (
                            <span className="border border-[#B3261E]/70 bg-[#B3261E] text-[#FFFFFF] px-2 py-0.5 text-[11px] font-bold leading-4">
                              -{itemDiscount}%
                            </span>
                          )}
                          {(item.bestSeller || item.best_seller) && (
                            <span className="bg-[#222222] px-2 py-0.5 text-[10px] font-bold uppercase leading-4 tracking-wide text-[#FFFFFF]">
                              Bestseller
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          aria-label={itemWishlisted ? 'Remove from wishlist' : 'Add product to wishlist'}
                          aria-pressed={itemWishlisted}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleRelatedWishlist(item);
                          }}
                          className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-[#FFFFFF]/85 text-[#4A4A4A] backdrop-blur-sm transition hover:border-[#222222] hover:text-[#4A4A4A] sm:right-3 sm:top-3 sm:h-9 sm:w-9 ${itemWishlisted ? 'border-[#222222] text-[#4A4A4A]' : 'border-[#D6D0C2]'}`}
                        >
                          <Heart className={`h-4 w-4 ${itemWishlisted ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div className="flex flex-1 flex-col px-3 pb-3.5 pt-3 sm:px-4 sm:pb-4">
                        <div className="flex h-5 items-center gap-1.5 text-[#4A4A4A]">
                          {(itemRating > 0 || itemReviews > 0) && (
                            <>
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span className="text-xs font-semibold text-[#171717] sm:text-sm">{itemRating.toFixed(1)}</span>
                              <span className="text-xs text-[#171717]/60 sm:text-sm">({itemReviews})</span>
                            </>
                          )}
                        </div>

                        <h3 className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-[#171717] sm:text-[15px]">{item.name}</h3>

                        <div className="mt-auto pt-2">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-base font-semibold tracking-tight text-[#171717] sm:text-lg">{formatINR(itemPrice)}</span>
                            {itemMrp !== undefined && itemMrp > itemPrice && (
                              <span className="text-xs text-[#171717]/45 line-through sm:text-sm">{formatINR(itemMrp)}</span>
                            )}
                          </div>
                          {itemBestPrice > 0 && itemBestPrice < itemPrice && (
                            <p className="mt-1 text-xs font-semibold text-[#4A4A4A] sm:text-sm">
                              Best price: {formatINR(itemBestPrice)}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <MobileShopBar />

      {/* MOBILE STICKY BAR: appears only after the in-flow Add to Cart scrolls away */}
      {!addInView && !homeInView && (
        <div className="fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 border-t border-[#D6D0C2] bg-[#FFFFFF]/95 p-2.5  backdrop-blur-xl md:bottom-0 md:pb-[calc(.625rem+env(safe-area-inset-bottom))] lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-xl font-semibold leading-none text-[#171717]">{formatINR(price)}</span>
              {mrp !== undefined && mrp > price && (
                <span className="text-xs text-[#5C5C5C] line-through">{formatINR(mrp)}</span>
              )}
              {discount > 0 && (
                <span className="border border-[#B3261E]/70 bg-[#B3261E] text-[#FFFFFF] px-1.5 py-0.5 text-[11px] font-bold">{discount}% OFF</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={stockBlocked || cartBusy}
              className={`kv-gold-btn h-12 min-h-[44px] flex-1 border border-[#171717]/60 text-xs font-bold uppercase tracking-[0.16em] text-[#FFFFFF]  [text-shadow:0_1px_0_rgba(255,255,255,.25)] transition-all active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-45 ${GOLD_METAL}`}
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
            className={`relative flex items-start gap-3 border bg-[#FFFFFF] px-4 py-3.5 text-[#171717]  ${notice.tone === 'error' ? 'border-red-500/60' : 'border-[#171717]/70'}`}
          >
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center ${notice.tone === 'error' ? 'text-red-300' : 'text-[#4A4A4A]'}`}>
              {notice.icon === 'heart' ? <Heart className="h-[18px] w-[18px] fill-current" /> : <ShoppingBag className="h-[18px] w-[18px]" />}
            </span>

            <div className="min-w-0 flex-1 pr-5">
              <p className="text-sm font-semibold leading-5">{notice.title}</p>
              {notice.body && <p className="mt-0.5 text-[13px] leading-5 text-[#5C5C5C]">{notice.body}</p>}
            </div>

            <button
              type="button"
              onClick={() => setNotice(null)}
              className="absolute right-3 top-3 text-[#5C5C5C] transition hover:text-[#171717]"
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
          className="pointer-events-auto fixed inset-0 z-[9999] flex h-dvh w-dvw items-center justify-center overscroll-none bg-[#FFFFFF]"
          role="dialog"
          aria-modal="true"
          aria-label="Product image viewer"
          onTouchStart={handleLightboxTouchStart}
          onTouchEnd={handleLightboxTouchEnd}
        >
          <button type="button" onClick={() => setLightboxOpen(false)} className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))] z-20 flex h-11 w-11 items-center justify-center border border-[#171717]/60 bg-[#FFFFFF]/90 text-[#4A4A4A] backdrop-blur" aria-label="Close image viewer">
            <X className="h-5 w-5" />
          </button>

          <div className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-20 border border-[#D6D0C2] bg-[#FFFFFF]/90 px-3 py-1.5 text-xs font-semibold text-[#4A4A4A]">
            {lightboxImage + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <button type="button" onClick={() => goToLightboxImage(-1)} className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[#D6D0C2] bg-[#FFFFFF]/85 text-[#4A4A4A]" aria-label="Previous image"><ChevronLeft className="h-5 w-5" /></button>
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
            <button type="button" onClick={() => goToLightboxImage(1)} className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[#D6D0C2] bg-[#FFFFFF]/85 text-[#4A4A4A]" aria-label="Next image"><ChevronRight className="h-5 w-5" /></button>
          )}
        </div>
      )}
    </main>
    </MotionConfig>
  );
}