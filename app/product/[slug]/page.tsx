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
  'bg-[linear-gradient(135deg,#BFC0C6_0%,#F6F6F8_45%,#D2D2D7_70%,#FAFAFC_100%)]';

const FADE_CSS = `
@keyframes kvFade{from{opacity:0}to{opacity:1}}
.kv-fade{animation:kvFade .35s ease both}
body:has([data-kovenik-product]){background:#0C0C0E}

/* ---- ambient environment ---- */
.kv-ambient{background:
  repeating-linear-gradient(90deg,rgba(255,255,255,.016) 0 1px,transparent 1px 4px),
  radial-gradient(60% 40% at 25% 6%,rgba(255,255,255,.06),transparent 70%)}
.kv-panel{background:linear-gradient(180deg,#121315 0%,#0d0e10 100%);border:1px solid rgba(214,216,222,.2);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 30px 60px -30px rgba(0,0,0,.9)}
.kv-silver-title{background-image:linear-gradient(180deg,#fff 0%,#dfe3e8 45%,#9aa0a8 62%,#f1f3f5 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
.kv-hair{height:1px;background:linear-gradient(90deg,transparent,rgba(223,227,232,.28),transparent)}

/* ---- 2.5D stage ---- */
.kv-stage-env{background:
  radial-gradient(65% 55% at 50% 38%,rgba(223,227,232,.13),transparent 70%),
  radial-gradient(90% 60% at 50% 105%,rgba(210,210,215,.10),transparent 70%),
  linear-gradient(180deg,#2A2B2F,#17181A);
  border:1px solid rgba(255,255,255,.06)}
.kv-stage-in{animation:kvStageIn .9s cubic-bezier(.2,.8,.2,1) both}
@keyframes kvStageIn{from{opacity:0;transform:translateY(26px) scale(.975)}to{opacity:1;transform:none}}
.kv-card{transition:transform .28s cubic-bezier(.2,.8,.2,1),box-shadow .28s;will-change:transform;
  box-shadow:calc(var(--px,0)*-16px) calc(34px + var(--py,0)*-12px) 70px -18px rgba(0,0,0,.75),
  0 0 0 1px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.14)}
.kv-zoom-layer{transition:transform .35s cubic-bezier(.2,.8,.2,1);will-change:transform}
.kv-sheen-layer{opacity:0;transition:opacity .3s;mix-blend-mode:soft-light;
  background:radial-gradient(circle at var(--mx,50%) var(--my,30%),rgba(255,255,255,.55),transparent 42%)}
.kv-stage:hover .kv-sheen-layer{opacity:.55}
.kv-ring{position:absolute;border-radius:9999px;border:1px solid rgba(223,227,232,.13);transition:transform .35s ease-out}
.kv-ring-a{width:86%;aspect-ratio:1;left:-14%;top:-8%;transform:translate3d(calc(var(--px,0)*22px),calc(var(--py,0)*16px),0)}
.kv-ring-b{width:62%;aspect-ratio:1;right:-10%;bottom:-6%;border-color:rgba(210,210,215,.2);
  transform:translate3d(calc(var(--px,0)*-30px),calc(var(--py,0)*-20px),0)}
.kv-floor{height:34px;margin:-6px 6% 0;border-radius:50%;filter:blur(10px);
  background:radial-gradient(closest-side,rgba(0,0,0,.75),transparent)}
.kv-ctl{display:flex;height:2.75rem;width:2.75rem;align-items:center;justify-content:center;border-radius:9999px;
  border:1px solid rgba(255,255,255,.2);background:rgba(11,11,11,.72);color:#E6E3DB;
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:border-color .25s,color .25s,background .25s}
button.kv-ctl:hover{border-color:rgba(210,210,215,.8);color:#F6F6F8;background:rgba(31,26,15,.85)}
.kv-swiper{scrollbar-width:none;-webkit-overflow-scrolling:touch}
.kv-swiper::-webkit-scrollbar{display:none}

/* ---- controls ---- */
.kv-gold-btn{position:relative;isolation:isolate}
.kv-gold-btn::after{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.55) 50%,transparent 62%);
  transform:translateX(-130%);animation:kvBtnSheen 5s cubic-bezier(.2,.8,.2,1) infinite}
.kv-gold-btn:disabled::after{animation:none;opacity:0}
@keyframes kvBtnSheen{0%,60%{transform:translateX(-130%)}100%{transform:translateX(130%)}}
.kv-opt{transition:border-color .25s,background .25s,color .25s,transform .25s,box-shadow .25s}
.kv-opt:hover{transform:translateY(-1px)}

/* ---- tabs ---- */
.kv-tab{position:relative}
.kv-tab::after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:2px;
  background:linear-gradient(90deg,#8e939b,#f6f6f8 55%,#d9dbe0);transform:scaleX(0);transform-origin:left;
  transition:transform .4s cubic-bezier(.2,.8,.2,1)}
.kv-tab[aria-selected='true']::after{transform:scaleX(1)}
.kv-tab-panel{animation:kvTabIn .45s cubic-bezier(.2,.8,.2,1) both}
@keyframes kvTabIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

@media (prefers-reduced-motion:reduce){
  .kv-fade,.kv-stage-in,.kv-tab-panel{animation:none}
  .kv-gold-btn::after{animation:none;opacity:0}
  .kv-card,.kv-zoom-layer,.kv-ring,.kv-opt,.kv-tab::after{transition:none}
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
      <main className="min-h-screen bg-[#0C0C0E] px-4 py-12">
        <div className="mx-auto max-w-[1500px] animate-pulse">
          <div className="h-4 w-48 bg-[#1A1A1A]" />
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.72fr]">
            <div className="aspect-[4/5] bg-[#101113]" />
            <div className="space-y-4">
              <div className="h-4 w-24 bg-[#1A1A1A]" />
              <div className="h-12 w-3/4 bg-[#1A1A1A]" />
              <div className="h-8 w-32 bg-[#1A1A1A]" />
              <div className="h-24 bg-[#1A1A1A]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0C0C0E] px-6 text-center">
        <div>
          <p className="font-serif text-2xl tracking-[0.12em] text-[#D2D2D7]">KOVENIK</p>
          <h1 className="mt-3 text-3xl text-[#FFFFFF]">Product not found</h1>
          <p className="mt-2 text-sm text-[#A8A49B]">This piece may have been removed or the link is incorrect.</p>
          <Link
            href="/shop"
            className={`mt-6 inline-flex border border-[#D2D2D7]/60 px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#0C0C0E] ${GOLD_METAL}`}
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
      box: 'border-[#E0524A]/45 bg-[#E0524A]/10',
      text: 'text-[#E0524A]',
      sub: 'text-[#E0524A]/80',
      dot: 'bg-[#E0524A]',
    };
    switch (stockState) {
      case 'in':
        return {
          headline: 'In stock',
          detail: '',
          quantity: selectedVariantInventory,
          box: 'border-white/[0.12] bg-white/[0.03]',
          text: 'text-[#FFFFFF]',
          sub: 'text-[#A8A49B]',
          dot: 'bg-[#6FD3A0]',
          short: `In stock (${selectedVariantInventory})`,
        };
      case 'low':
        return {
          headline: `Only ${selectedVariantInventory} ${pluralItems(selectedVariantInventory ?? 0)} left`,
          detail: '',
          quantity: selectedVariantInventory,
          box: 'border-[#F59E42]/45 bg-[#F59E42]/10',
          text: 'text-[#F59E42]',
          sub: 'text-[#F59E42]/80',
          dot: 'bg-[#F59E42]',
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
          box: 'border-white/20 bg-white/[0.03]',
          text: 'text-[#D2D2D7]',
          sub: 'text-[#A8A49B]',
          dot: 'bg-[#A8A49B]',
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
          box: needSelection ? 'border-white/60 bg-white/[0.06]' : 'border-white/[0.12] bg-white/[0.03]',
          text: 'text-[#FFFFFF]',
          sub: 'text-[#A8A49B]',
          dot: 'bg-[#8D8A82]',
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
    product.bestSeller && { label: 'Bestseller', Icon: Crown, tone: 'border-[#F2B45A]/40 bg-[#F2B45A]/10 text-[#F2B45A]' },
    product.newArrival && { label: 'New arrival', Icon: Sparkles, tone: 'border-[#7DB7FF]/40 bg-[#7DB7FF]/10 text-[#7DB7FF]' },
    product.trending && { label: 'Trending', Icon: Sparkles, tone: 'border-[#6FD3A0]/40 bg-[#6FD3A0]/10 text-[#6FD3A0]' },
    product.limitedEdition && { label: 'Limited edition', Icon: Sparkles, tone: 'border-white/30 bg-white/10 text-[#D2D2D7]' },
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
                <strong className="font-semibold text-[#FFFFFF]">Fabric details:</strong> {product.fabricDetails}
              </p>
            )}
            {specRows.length > 0 && (
              <dl className="mt-4 grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-[#44454A] pt-4">
                {specRows.map(([term, value]) => (
                  <div key={term} className="contents">
                    <dt className="font-semibold text-[#D2D2D7]">{term}</dt>
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
                <strong className="font-semibold text-[#FFFFFF]">Available sizes:</strong> {sizes.join(', ')}
              </p>
            ) : (
              <p>Size information is not available for this product.</p>
            )}
            {product.fit && (
              <p className="mt-3">
                <strong className="font-semibold text-[#FFFFFF]">Fit:</strong> {product.fit}
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
      className="relative min-h-screen overflow-x-clip bg-[#090a0b] pb-28 text-[#FFFFFF] md:pb-24 lg:pb-16"
    >
      <style>{FADE_CSS}</style>
      <div aria-hidden="true" className="kv-ambient pointer-events-none absolute inset-0" />

      {/* BREADCRUMB */}
      <div className="border-b border-[#44454A]">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto flex max-w-[1500px] items-center gap-2 overflow-x-auto whitespace-nowrap px-4 py-3.5 text-sm text-[#A8A49B] sm:px-6 lg:px-10"
        >
          <Link href="/" className="transition-colors hover:text-[#D2D2D7]">Home</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-[#55534E]" />
          <Link href="/shop" className="transition-colors hover:text-[#D2D2D7]">Shop</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-[#55534E]" />
          <Link
            href={`/shop?category=${encodeURIComponent(product.category_slug ?? product.category ?? '')}`}
            className="transition-colors hover:text-[#D2D2D7]"
          >
            {product.categoryLabel || product.category || 'Products'}
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-[#55534E]" />
          <span className="truncate text-[#FFFFFF]">{product.name}</span>
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

            <h1 className="kv-silver-title font-bodoni text-[1.75rem] font-medium leading-[1.15] tracking-tight sm:text-[2.1rem] xl:text-[2.5rem]">
              {product.name}
            </h1>
            {(product.categoryLabel || product.category) && (
              <p className="mt-1.5 text-base text-[#A8A49B]">{product.categoryLabel || product.category}</p>
            )}
            {shortDescription && (
              <p className="mt-3 hidden max-w-[56ch] text-[15px] leading-7 text-[#A8A49B] lg:block">{shortDescription}</p>
            )}

            {hasRating && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-0.5 text-[#D2D2D7]" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className={`h-5 w-5 ${i < Math.round(rating) ? 'fill-current' : 'text-[#44444A]'}`} />
                  ))}
                </div>
                <span className="text-base text-[#D6D3CB]">
                  <span className="font-semibold text-[#FFFFFF]">{rating.toFixed(1)}</span> ({reviewCount} reviews)
                </span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-2">
              <span className="text-[1.9rem] font-semibold tracking-tight text-[#FFFFFF] sm:text-[2.25rem]">{formatINR(price)}</span>
              {mrp !== undefined && mrp > price && (
                <span className="pb-1 text-lg text-[#8D8A82] line-through">{formatINR(mrp)}</span>
              )}
              {discount > 0 && (
                <span className="mb-1 border border-[#E0524A]/70 bg-[#C23B31] text-white px-3 py-1 text-sm font-bold">
                  {discount}% OFF
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm text-[#A8A49B]">+ 5% GST at checkout</p>

            {featureChips.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {featureChips.map(({ Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 border border-[#44454A] bg-[#101113] px-3.5 py-2.5 text-[15px] text-[#E6E3DB]"
                  >
                    <Icon className="h-5 w-5 text-[#D2D2D7]" /> {label}
                  </span>
                ))}
              </div>
            )}

            {hasBestOffer && (
              <div className="mt-5 border border-white/[0.12] bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-[#D2D2D7] px-2.5 py-1 text-xs font-bold text-black">Best offer</span>
                    <span className="text-lg text-[#FFFFFF]">
                      Get it at <span className="font-bold text-[#D2D2D7]">{formatINR(bestPrice)}</span>
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[#D2D2D7]">Apply at checkout</span>
                </div>
                <p className="mt-2 text-base leading-7 text-[#B9B6AD]">
                  Applicable on select items, purchases &amp; checkout promos.
                </p>
              </div>
            )}

            {/* COLOR + SIZE */}
            <div ref={selectorsRef} className="mt-6 scroll-mt-24">
              {colors.length > 0 && (
                <div>
                  <p className="text-base text-[#A8A49B]">
                    Color: <span className="font-semibold text-[#FFFFFF]">{selectedColorLabel}</span>
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
                          className={`kv-opt relative flex h-14 w-14 items-center justify-center border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D2D2D7] ${active ? 'border-[#D2D2D7] shadow-[0_0_16px_rgba(210,210,215,.3)]' : 'border-[#44454A] hover:border-[#44444A]'} ${soldOut && !active ? 'cursor-not-allowed opacity-45' : ''}`}
                        >
                          <span className="h-9 w-9 rounded-full border border-white/20" style={{ backgroundColor: paint }} />
                          {soldOut && <span aria-hidden="true" className="absolute h-px w-10 rotate-45 bg-[#FFFFFF]/70" />}
                        </button>
                      ) : (
                        <button
                          key={color}
                          type="button"
                          aria-pressed={active}
                          disabled={soldOut && !active}
                          onClick={() => chooseColor(String(color))}
                          className={`kv-opt h-12 border px-4 text-base font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D2D2D7] ${
                            active
                              ? 'border-white/70 bg-[linear-gradient(135deg,#D2D2D7,#F6F6F8)] text-[#0C0C0E] shadow-[0_6px_18px_rgba(0,0,0,.45)]'
                              : `border-[#44454A] bg-[#101113] text-[#E6E3DB] hover:border-[#44444A] ${soldOut ? 'opacity-55 line-through' : ''}`
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
                    <p className="text-base text-[#A8A49B]">
                      Size: <span className="font-semibold text-[#FFFFFF]">{selectedSize ?? 'Choose your size'}</span>
                    </p>
                    <button
                      type="button"
                      onClick={openSizeGuide}
                      className="inline-flex items-center gap-2 text-base text-[#A8A49B] underline underline-offset-4 transition hover:text-[#D2D2D7]"
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
                          className={`kv-opt h-[52px] min-w-[60px] border px-4 text-base font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D2D2D7] disabled:cursor-not-allowed ${
                            active
                              ? 'border-white/70 bg-[linear-gradient(135deg,#D2D2D7,#F6F6F8)] text-[#0C0C0E] shadow-[0_6px_18px_rgba(0,0,0,.45)]'
                              : soldOut
                                ? 'border-white/10 bg-[#101113] text-[#8D8A82] line-through opacity-50'
                                : 'border-[#44454A] bg-[#101113] text-[#E6E3DB] hover:border-[#44444A]'
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
                <span className="text-base text-[#A8A49B]">Quantity</span>
                <div className="inline-flex items-center border border-white/[0.12] bg-[#101113]" role="group" aria-label="Quantity">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-11 w-11 items-center justify-center text-[#FFFFFF] transition hover:bg-white/10 disabled:opacity-35"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-base font-semibold tabular-nums text-[#FFFFFF]" aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={selectedVariantInventory === null || quantity >= selectedVariantInventory}
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-11 w-11 items-center justify-center text-[#FFFFFF] transition hover:bg-white/10 disabled:opacity-35"
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
                className={`kv-gold-btn relative flex h-14 min-w-0 flex-1 items-center justify-center gap-3 overflow-hidden border border-[#D2D2D7]/60 text-[15px] font-semibold uppercase tracking-[0.12em] text-[#0C0C0E] shadow-[0_0_24px_rgba(210,210,215,.28),0_6px_24px_rgba(0,0,0,.5)] transition-all [text-shadow:0_1px_0_rgba(255,255,255,.25)] hover:brightness-110 active:scale-[.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D2D2D7] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:brightness-100 ${GOLD_METAL}`}
              >
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/50" />
                <ShoppingBag className="h-5 w-5" />
                {cartBusy ? 'Adding…' : 'Add to Cart'}
              </button>
              <button
                type="button"
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={isWishlisted}
                onClick={handleWishlistToggle}
                disabled={wishlistBusy}
                className={`flex h-14 w-14 shrink-0 items-center justify-center border border-[#44454A] bg-[#101113] text-[#D2D2D7] transition hover:border-[#44444A] ${isWishlisted ? 'border-[#D2D2D7] shadow-[0_0_16px_rgba(210,210,215,.25)]' : ''} ${wishlistBusy ? 'opacity-60' : ''}`}
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
                  <Icon className="h-8 w-8 shrink-0 text-[#A8A49B]" strokeWidth={1.4} />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium leading-5 text-[#FFFFFF]">{label}</span>
                    {sub && <span className="mt-0.5 block text-sm leading-5 text-[#A8A49B]">{sub}</span>}
                  </span>
                </div>
              ))}
            </div>

            {displaySku && (
              <div className="mt-5 inline-flex max-w-full items-center gap-2 text-sm text-[#A8A49B]">
                <span>SKU</span>
                <span className="truncate font-semibold tracking-wide text-[#A8A49B]">{displaySku}</span>
                <button
                  type="button"
                  aria-label={skuCopied ? 'SKU copied' : 'Copy SKU'}
                  onClick={copySku}
                  className="shrink-0 transition hover:text-[#D2D2D7]"
                >
                  {skuCopied ? <Check className="h-3.5 w-3.5 text-[#F6F6F8]" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* KEY HIGHLIGHTS STRIP */}
      <section className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-10">
        <Reveal>
        <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10 lg:auto-cols-fr lg:grid-flow-col">
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
                className="flex items-center gap-3 bg-[linear-gradient(180deg,#121315,#0d0e10)] px-4 py-4 odd:last:col-span-2 sm:gap-4 sm:px-6 sm:py-5 lg:odd:last:col-span-1"
              >
                <Icon className="h-8 w-8 shrink-0 text-[#D2D2D7]" strokeWidth={1.3} />
                <span className="min-w-0">
                  <span className="block text-sm text-[#A8A49B]">{label}</span>
                  <span className={`block truncate text-base font-medium ${tone || 'text-[#FFFFFF]'}`}>{value}</span>
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
        <div id="kovenik-details-m" className="scroll-mt-24 border-t border-white/[0.12] lg:hidden">
          {tabs.map(({ key, label }) => {
            const open = openAccordion === key;
            return (
              <div key={key} className="border-b border-white/[0.12]">
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`acc-${key}`}
                    onClick={() => setOpenAccordion(open ? null : key)}
                    className="flex min-h-[52px] w-full items-center justify-between gap-4 py-3 text-left text-[13px] font-semibold uppercase tracking-[0.16em] text-[#FFFFFF]"
                  >
                    {label}
                    <ChevronDown className={`h-5 w-5 shrink-0 text-[#A8A49B] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                  </button>
                </h3>
                <div
                  id={`acc-${key}`}
                  role="region"
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <div className="pb-5 text-[15px] leading-[1.75] text-[#D6D3CB]">{renderTabBody(key)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: tabs */}
        <div className="hidden lg:block">
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A8A49B]">Product details</p>
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
          className="flex gap-7 overflow-x-auto border-b border-white/10"
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
                className={`kv-tab shrink-0 whitespace-nowrap pb-3.5 text-[13px] font-semibold uppercase tracking-[0.18em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D2D2D7] sm:text-sm ${active ? 'text-[#FFFFFF]' : 'text-[#8D8A82] hover:text-[#FFFFFF]'}`}
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
            className="kv-tab-panel max-w-[70ch] text-base leading-[1.75] text-[#D6D3CB]"
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
                  className="aspect-[4/5] overflow-hidden border border-[#44454A] bg-[#101113] transition hover:border-[#44444A]"
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
        <section ref={homeRef} className="border-t border-[#44454A] bg-[#101113]">
          <div className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
            <div className="flex items-end justify-between">
              <h2 className="text-xl font-semibold leading-none text-[#FFFFFF] sm:text-2xl">You may also like</h2>
              <Link
                href={`/shop?category=${encodeURIComponent(product.category_slug ?? product.category ?? '')}`}
                className="hidden items-center gap-2 text-sm font-semibold text-[#D2D2D7] transition-colors hover:text-white sm:flex"
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
                    <article className="flex h-full flex-col overflow-hidden border border-[#44454A] bg-[#0C0C0E] transition-all duration-300 hover:border-[#D2D2D7]/60 hover:shadow-[0_12px_32px_rgba(0,0,0,.45)]">
                      <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-[#101113]">
                        {itemImages[0] ? (
                          <img
                            src={itemImages[0]}
                            alt={item.name}
                            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                            loading={index > 0 ? 'lazy' : 'eager'}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-[#8D8A82]">No image available</div>
                        )}

                        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5 sm:left-3 sm:top-3">
                          {itemDiscount > 0 && (
                            <span className="border border-[#E0524A]/70 bg-[#C23B31] text-white px-2 py-0.5 text-[11px] font-bold leading-4">
                              -{itemDiscount}%
                            </span>
                          )}
                          {(item.bestSeller || item.best_seller) && (
                            <span className="bg-[#D2D2D7] px-2 py-0.5 text-[10px] font-bold uppercase leading-4 tracking-wide text-black">
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
                          className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-[#0C0C0E]/85 text-[#D2D2D7] backdrop-blur-sm transition hover:border-[#D2D2D7] hover:text-[#D2D2D7] sm:right-3 sm:top-3 sm:h-9 sm:w-9 ${itemWishlisted ? 'border-[#D2D2D7] text-[#D2D2D7]' : 'border-[#44454A]'}`}
                        >
                          <Heart className={`h-4 w-4 ${itemWishlisted ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div className="flex flex-1 flex-col px-3 pb-3.5 pt-3 sm:px-4 sm:pb-4">
                        <div className="flex h-5 items-center gap-1.5 text-[#D2D2D7]">
                          {(itemRating > 0 || itemReviews > 0) && (
                            <>
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span className="text-xs font-semibold text-white sm:text-sm">{itemRating.toFixed(1)}</span>
                              <span className="text-xs text-white/60 sm:text-sm">({itemReviews})</span>
                            </>
                          )}
                        </div>

                        <h3 className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-white sm:text-[15px]">{item.name}</h3>

                        <div className="mt-auto pt-2">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-base font-semibold tracking-tight text-white sm:text-lg">{formatINR(itemPrice)}</span>
                            {itemMrp !== undefined && itemMrp > itemPrice && (
                              <span className="text-xs text-white/45 line-through sm:text-sm">{formatINR(itemMrp)}</span>
                            )}
                          </div>
                          {itemBestPrice > 0 && itemBestPrice < itemPrice && (
                            <p className="mt-1 text-xs font-semibold text-[#D2D2D7] sm:text-sm">
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

      <MobileShopBar variant="silver" />

      {/* MOBILE STICKY BAR: appears only after the in-flow Add to Cart scrolls away */}
      {!addInView && !homeInView && (
        <div className="fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 border-t border-[#44454A] bg-[#0C0C0E]/95 p-2.5 shadow-[0_-10px_40px_rgba(0,0,0,.6)] backdrop-blur-xl md:bottom-0 md:pb-[calc(.625rem+env(safe-area-inset-bottom))] lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-xl font-semibold leading-none text-white">{formatINR(price)}</span>
              {mrp !== undefined && mrp > price && (
                <span className="text-xs text-[#8D8A82] line-through">{formatINR(mrp)}</span>
              )}
              {discount > 0 && (
                <span className="border border-[#E0524A]/70 bg-[#C23B31] text-white px-1.5 py-0.5 text-[11px] font-bold">{discount}% OFF</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={stockBlocked || cartBusy}
              className={`kv-gold-btn h-12 min-h-[44px] flex-1 border border-[#D2D2D7]/60 text-xs font-bold uppercase tracking-[0.16em] text-[#0C0C0E] shadow-[0_0_20px_rgba(210,210,215,.3)] [text-shadow:0_1px_0_rgba(255,255,255,.25)] transition-all active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-45 ${GOLD_METAL}`}
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
            className={`relative flex items-start gap-3 border bg-[#0C0C0E] px-4 py-3.5 text-[#FFFFFF] shadow-[0_18px_50px_rgba(0,0,0,.6)] ${notice.tone === 'error' ? 'border-red-500/60' : 'border-[#D2D2D7]/70'}`}
          >
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center ${notice.tone === 'error' ? 'text-red-300' : 'text-[#D2D2D7]'}`}>
              {notice.icon === 'heart' ? <Heart className="h-[18px] w-[18px] fill-current" /> : <ShoppingBag className="h-[18px] w-[18px]" />}
            </span>

            <div className="min-w-0 flex-1 pr-5">
              <p className="text-sm font-semibold leading-5">{notice.title}</p>
              {notice.body && <p className="mt-0.5 text-[13px] leading-5 text-[#A8A49B]">{notice.body}</p>}
            </div>

            <button
              type="button"
              onClick={() => setNotice(null)}
              className="absolute right-3 top-3 text-[#8D8A82] transition hover:text-white"
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
          className="pointer-events-auto fixed inset-0 z-[9999] flex h-dvh w-dvw items-center justify-center overscroll-none bg-black"
          role="dialog"
          aria-modal="true"
          aria-label="Product image viewer"
          onTouchStart={handleLightboxTouchStart}
          onTouchEnd={handleLightboxTouchEnd}
        >
          <button type="button" onClick={() => setLightboxOpen(false)} className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))] z-20 flex h-11 w-11 items-center justify-center border border-[#D2D2D7]/60 bg-[#0C0C0E]/90 text-[#D2D2D7] backdrop-blur" aria-label="Close image viewer">
            <X className="h-5 w-5" />
          </button>

          <div className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-20 border border-[#44454A] bg-[#0C0C0E]/90 px-3 py-1.5 text-xs font-semibold text-[#D6D3CB]">
            {lightboxImage + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <button type="button" onClick={() => goToLightboxImage(-1)} className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[#44444A] bg-[#0C0C0E]/85 text-[#D2D2D7]" aria-label="Previous image"><ChevronLeft className="h-5 w-5" /></button>
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
            <button type="button" onClick={() => goToLightboxImage(1)} className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[#44444A] bg-[#0C0C0E]/85 text-[#D2D2D7]" aria-label="Next image"><ChevronRight className="h-5 w-5" /></button>
          )}
        </div>
      )}
    </main>
    </MotionConfig>
  );
}