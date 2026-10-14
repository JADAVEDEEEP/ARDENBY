'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crown,
  Layers,
  Heart,
  Maximize2,
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
import {
  getProductBySlug,
  getRelatedProducts,
} from '@/lib/data';
import { apiUrl } from '@/lib/api-url';
import { formatINR, discountPercent } from '@/lib/format';
import { useWishlistStore } from '@/store/wishlist-store';
import { AddToCart } from './add-to-cart';

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

type CartProduct = ComponentProps<typeof AddToCart>['product'];

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

const LOW_STOCK_THRESHOLD = 5;
const ADD_TO_CART_PATTERN = /add to (cart|bag)/i;

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
    description: toText(raw.description),
    fabricDetails: toText(raw.fabricDetails ?? raw.fabric_details),
    washCare: toText(raw.washCare ?? raw.wash_care),
    bestSeller: Boolean(raw.bestSeller ?? raw.best_seller),
    newArrival: Boolean(raw.newArrival ?? raw.new_arrival),
    trending: Boolean(raw.trending),
    limitedEdition: Boolean(raw.limitedEdition ?? raw.limited_edition),
    inventory: toNumber(raw.inventory),
    images: pickImages(raw.images),
    variants,
    sizes: rawSizes.length ? rawSizes : uniqueStrings(variants.map((v) => v.size)),
    colors: rawColors.length ? rawColors : uniqueStrings(variants.map((v) => v.color)),
  } as ProductData;
}

/* -------------------------------------------------------------------------- */
/* Shared class strings                                                       */
/* -------------------------------------------------------------------------- */

// Brushed emerald metal: dark edges, bright reflective band through the middle.
const EMERALD_METAL =
  'bg-[linear-gradient(100deg,#0d3a22_0%,#1f7a47_28%,#74cf98_50%,#1f7a47_72%,#0d3a22_100%)]';

const FADE_CSS = `
@keyframes kvFade{from{opacity:0}to{opacity:1}}
.kv-fade{animation:kvFade .35s ease both}
body:has([data-kovenik-product]){background:#0c2217}
@media (prefers-reduced-motion:reduce){.kv-fade{animation:none}}
`;

export default function ProductPage() {
  const params = useParams<{ slug?: string }>();
  const slug = params?.slug ?? '';

  const [product, setProduct] = useState<ProductData | null>(null);
  const [related, setRelated] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileImage, setMobileImage] = useState(0);
  const [desktopImage, setDesktopImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
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

  const touchStartX = useRef<number | null>(null);
  const lightboxTouchStartX = useRef<number | null>(null);
  const cartBridgeRef = useRef<HTMLDivElement | null>(null);
  const selectorsRef = useRef<HTMLDivElement | null>(null);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const cartWatch = useRef<{ stop: () => void } | null>(null);

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
        const response = await fetch(
          apiUrl(`/api/products/${encodeURIComponent(slug)}`),
          { cache: 'no-store' }
        );

        if (response.ok) {
          const data = await response.json();
          const backendProduct = data?.product ?? data?.data ?? data;

          if (
            backendProduct &&
            typeof backendProduct === 'object' &&
            backendProduct.slug
          ) {
            loadedProduct = normalizeProduct(backendProduct);
          }
        }
      } catch (error) {
        console.error('Product API error:', error);
      }

      if (!loadedProduct) {
        const staticProduct = getProductBySlug(slug);

        if (staticProduct) {
          loadedProduct = normalizeProduct(staticProduct);
        }
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

        if (!cancelled) {
          if (apiRelated.length > 0) {
            setRelated(apiRelated);
          } else {
            const staticProduct = getProductBySlug(slug);

            setRelated(
              staticProduct
                ? getRelatedProducts(staticProduct, 4).map(normalizeProduct)
                : []
            );
          }
        }
      } catch (error) {
        console.error('Related products API error:', error);

        const staticProduct = getProductBySlug(slug);

        if (!cancelled) {
          setRelated(
            staticProduct
              ? getRelatedProducts(staticProduct, 4).map(normalizeProduct)
              : []
          );
        }
      }

      if (!cancelled) setLoading(false);
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    setMobileImage(0);
    setDesktopImage(0);
    setLightboxOpen(false);
    setLightboxImage(0);
    setActiveTab('description');
    setNeedSelection(false);
    // A different product has different variants: never carry a selection over.
    setSelectedSize(null);
    setSelectedColor(null);
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
      cartWatch.current?.stop();
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

  // Strikethrough hint on options that are sold out for the other chosen option.
  const sizeSoldOut = (size: string) => {
    if (needsColor && !selectedColor) return false;
    const variant = findVariant(size, selectedColor);
    return !variant || parseInventory(variant.inventory) === 0;
  };
  const colorSoldOut = (color: string) => {
    if (!selectedSize) return false;
    const variant = findVariant(selectedSize, color);
    return !variant || parseInventory(variant.inventory) === 0;
  };

  /* ------------------------------------------------------------------------ */
  /* Early returns                                                            */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0c2217] px-4 py-12">
        <div className="mx-auto max-w-[1500px] animate-pulse">
          <div className="h-4 w-48 bg-[#123022]" />
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.72fr]">
            <div className="aspect-[4/5] bg-[#0a1c13]" />
            <div className="space-y-4">
              <div className="h-4 w-24 bg-[#123022]" />
              <div className="h-12 w-3/4 bg-[#123022]" />
              <div className="h-8 w-32 bg-[#123022]" />
              <div className="h-24 bg-[#123022]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0c2217] px-6 text-center">
        <div>
          <p className="font-serif text-2xl tracking-[0.12em] text-[#d9b45f]">KOVENIK</p>
          <h1 className="mt-3 text-3xl text-[#f2f5f3]">Product not found</h1>
          <p className="mt-2 text-sm text-[#a8b5ad]">This piece may have been removed or the link is incorrect.</p>
          <Link
            href="/shop"
            className={`mt-6 inline-flex border border-[#74cf98]/60 px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white ${EMERALD_METAL}`}
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

  const bridgeProduct = {
    ...product,
    price,
    mrp,
    bestPrice,
    rating,
    reviewCount,
    images,
    variants,
    sizes,
    colors,
  } as unknown as CartProduct;

  const stockView = (() => {
    const pluralItems = (n: number) => (n === 1 ? 'item' : 'items');
    switch (stockState) {
      case 'in':
        return {
          headline: 'In stock',
          detail: '',
          quantity: selectedVariantInventory,
          box: 'border-[#2b5a41] bg-[#133827]',
          text: 'text-[#6fd39a]',
          sub: 'text-[#9fc9b0]',
          dot: 'bg-[#46c586]',
          short: `In stock (${selectedVariantInventory})`,
        };
      case 'low':
        return {
          headline: `Only ${selectedVariantInventory} ${pluralItems(selectedVariantInventory ?? 0)} left — order soon`,
          detail: '',
          quantity: selectedVariantInventory,
          box: 'border-[#a8452f]/70 bg-[#1a0d09]',
          text: 'text-[#ff9c7d]',
          sub: 'text-[#e0b3a5]',
          dot: 'bg-[#ff7a55]',
          short: `Only ${selectedVariantInventory} left`,
        };
      case 'out':
        return {
          headline: 'Out of stock',
          detail: 'Please choose another size or color.',
          quantity: selectedVariantInventory,
          box: 'border-red-500/60 bg-[#1a0a0a]',
          text: 'text-red-300',
          sub: 'text-red-200/80',
          dot: 'bg-red-400',
          short: 'Out of stock',
        };
      case 'unavailable':
        return {
          headline: 'This size and color is unavailable',
          detail: 'Please choose another combination.',
          quantity: null,
          box: 'border-red-500/60 bg-[#1a0a0a]',
          text: 'text-red-300',
          sub: 'text-red-200/80',
          dot: 'bg-red-400',
          short: 'Unavailable',
        };
      case 'unknown':
        return {
          headline: 'Stock status unavailable',
          detail: 'Availability could not be confirmed for this variant.',
          quantity: null,
          box: 'border-[#d9b45f]/50 bg-[#15110a]',
          text: 'text-[#e6c776]',
          sub: 'text-[#c9b17a]',
          dot: 'bg-[#e6c776]',
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
          box: needSelection ? 'border-[#74cf98] bg-[#133827]' : 'border-[#1f4231] bg-[#0a1c13]',
          text: needSelection ? 'text-[#9fe0bb]' : 'text-[#c3cec8]',
          sub: 'text-[#a8b5ad]',
          dot: 'bg-[#74847a]',
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
  };

  const openSizeGuide = () => {
    setActiveTab('size');
    window.requestAnimationFrame(() =>
      document.getElementById('kovenik-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Add to Cart                                                              */
  /* The visible controls here are page-owned (single source of truth for the */
  /* selection). The existing <AddToCart/> component stays mounted, hidden,   */
  /* and is driven through its own buttons, so the cart API call, payload,    */
  /* guest/auth handling and its quantity default are exactly what they were. */
  /* ------------------------------------------------------------------------ */

  const bridgeButtons = () =>
    Array.from(cartBridgeRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);

  const cleanLabel = (value: string | null | undefined) =>
    (value ?? '').replace(/[✓✔]/g, '').trim().toLowerCase();

  const buttonMatches = (button: HTMLButtonElement, value: string) =>
    [
      button.textContent,
      button.getAttribute('aria-label'),
      button.getAttribute('title'),
      button.getAttribute('data-value'),
    ].some((label) => cleanLabel(label) === cleanLabel(value));

  const isButtonOn = (button: HTMLButtonElement) =>
    button.getAttribute('aria-pressed') === 'true' ||
    button.getAttribute('data-selected') === 'true';

  const selectInBridge = (value: string) => {
    const match = bridgeButtons().find(
      (button) => !ADD_TO_CART_PATTERN.test(button.textContent ?? '') && buttonMatches(button, value)
    );
    if (!match) return false;
    if (!isButtonOn(match)) match.click();
    return true;
  };

  // Text the existing component renders outside its buttons (messages/toasts).
  const readFeedbackTexts = (root: HTMLElement) =>
    Array.from(root.querySelectorAll<HTMLElement>('*'))
      .filter((element) => element.children.length === 0 && !element.closest('button'))
      .map((element) => (element.textContent ?? '').trim())
      .filter((text) => text.length > 0 && !/^[+−–-]?\d*$/.test(text));

  const handleAddToCart = () => {
    if (cartBusy) return;

    if (variants.length > 0) {
      if (!hasVariantSelection) {
        setNeedSelection(true);
        selectorsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      // Never send a cart request for a missing, sold-out or unverified variant.
      if (stockBlocked || !selectedVariant) return;
    }

    const root = cartBridgeRef.current;
    if (!root) {
      showNotice({ title: 'Unable to add to cart', body: 'Please refresh the page and try again.', tone: 'error', icon: 'bag' });
      return;
    }

    if (variants.length > 0) {
      const sizeOk = selectedSize ? selectInBridge(selectedSize) : false;
      const colorOk = !needsColor || (selectedColor ? selectInBridge(selectedColor) : false);
      if (!sizeOk || !colorOk) {
        showNotice({
          title: 'Could not select this variant',
          body: 'Nothing was added to your cart. Please try again.',
          tone: 'error',
          icon: 'bag',
        });
        return;
      }
    }

    setCartBusy(true);
    const baseline = new Set(readFeedbackTexts(root));

    // Let the hidden component commit the size/color clicks before adding.
    window.setTimeout(() => {
      const addButton = bridgeButtons().find((button) => ADD_TO_CART_PATTERN.test(button.textContent ?? ''));
      if (!addButton) {
        setCartBusy(false);
        showNotice({ title: 'Unable to add to cart', body: 'Please refresh the page and try again.', tone: 'error', icon: 'bag' });
        return;
      }

      cartWatch.current?.stop();

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        observer.disconnect();
        window.clearTimeout(timer);
        setCartBusy(false);
      };

      const observer = new MutationObserver(() => {
        const fresh = readFeedbackTexts(root).find(
          (text) => !baseline.has(text) && !/…|\.{3}|^adding/i.test(text)
        );
        if (!fresh) return;
        const isError = /(error|fail|unable|could not|couldn't|log in|login|sign in|out of stock|please|select|choose)/i.test(fresh);
        showNotice({ title: fresh, tone: isError ? 'error' : 'success', icon: 'bag' });
        finish();
      });
      const timer = window.setTimeout(finish, 2500);

      observer.observe(root, { subtree: true, childList: true, characterData: true });
      cartWatch.current = { stop: finish };

      addButton.click();
    }, 80);
  };

  /* ------------------------------------------------------------------------ */
  /* Gallery handlers                                                         */
  /* ------------------------------------------------------------------------ */

  const goToMobileImage = (direction: number) => {
    if (images.length < 2) return;

    setMobileImage((current) => {
      const next = current + direction;
      if (next < 0) return images.length - 1;
      if (next >= images.length) return 0;
      return next;
    });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current == null) return;

    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const distance = endX - touchStartX.current;

    if (Math.abs(distance) > 45) {
      goToMobileImage(distance < 0 ? 1 : -1);
    }

    touchStartX.current = null;
  };

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
    product.bestSeller && { label: 'Bestseller', Icon: Crown },
    product.newArrival && { label: 'New arrival', Icon: Sparkles },
    product.trending && { label: 'Trending', Icon: Sparkles },
    product.limitedEdition && { label: 'Limited edition', Icon: Sparkles },
  ].filter((badge): badge is { label: string; Icon: typeof Crown } => Boolean(badge));

  // Feature chips under the price: real product attributes only.
  const featureChips = [
    product.fabric ? { Icon: Layers, label: product.fabric } : null,
    product.fit ? { Icon: Ruler, label: product.fit } : null,
    product.coverage ? { Icon: Shirt, label: product.coverage } : null,
  ].filter((chip): chip is { Icon: typeof Layers; label: string } => Boolean(chip));

  const detailImages = images.slice(1, 4);

  const renderTabBody = (key: TabKey) => {
    switch (key) {
      case 'description':
        return (
          <>
            <p>{product.description || 'No specific description provided for this style.'}</p>
            {product.fabricDetails && (
              <p className="mt-3">
                <strong className="font-semibold text-[#f2f5f3]">Fabric details:</strong> {product.fabricDetails}
              </p>
            )}
            {specRows.length > 0 && (
              <dl className="mt-4 grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-[#1f4231] pt-4">
                {specRows.map(([term, value]) => (
                  <div key={term} className="contents">
                    <dt className="font-semibold text-[#74cf98]">{term}</dt>
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
                <strong className="font-semibold text-[#f2f5f3]">Available sizes:</strong> {sizes.join(', ')}
              </p>
            ) : (
              <p>Size information is not available for this product.</p>
            )}
            {product.fit && (
              <p className="mt-3">
                <strong className="font-semibold text-[#f2f5f3]">Fit:</strong> {product.fit}
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
            <p className="mt-3">Cash on delivery and free shipping are available.</p>
          </>
        );
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <main
      data-kovenik-product
      style={{ fontFamily: 'Inter, Manrope, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
      className="min-h-screen bg-[#0c2217] pb-24 text-[#f2f5f3] lg:pb-0"
    >
      <style>{FADE_CSS}</style>

      {/* BREADCRUMB */}
      <div className="border-b border-[#1a3828]">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto flex max-w-[1500px] items-center gap-2 overflow-x-auto whitespace-nowrap px-4 py-3.5 text-sm text-[#a8b5ad] sm:px-6 lg:px-10"
        >
          <Link href="/" className="transition-colors hover:text-[#74cf98]">Home</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-[#4a5a51]" />
          <Link href="/shop" className="transition-colors hover:text-[#74cf98]">Shop</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-[#4a5a51]" />
          <Link
            href={`/shop?category=${encodeURIComponent(product.category_slug ?? product.category ?? '')}`}
            className="transition-colors hover:text-[#74cf98]"
          >
            {product.categoryLabel || product.category || 'Products'}
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-[#4a5a51]" />
          <span className="truncate text-[#f2f5f3]">{product.name}</span>
        </nav>
      </div>

      <section className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <div className="grid items-start gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:gap-x-12">
          {/* GALLERY */}
          <div className="min-w-0">
            {/* Desktop gallery */}
            <div className="hidden items-start lg:grid lg:grid-cols-[80px_minmax(0,1fr)] lg:gap-4">
              <div className="sticky top-5 flex max-h-[calc(100vh-2.5rem)] flex-col gap-3 overflow-y-auto pr-1">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    aria-label={`View image ${index + 1}`}
                    aria-current={desktopImage === index}
                    onClick={() => setDesktopImage(index)}
                    className={`relative aspect-[4/5] shrink-0 overflow-hidden border bg-[#0a1c13] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#74cf98] ${desktopImage === index ? 'border-[#46c586] shadow-[0_0_0_1px_rgba(70,197,134,.35)]' : 'border-[#1f4231] hover:border-[#2b5a41]'}`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>

              <div className="relative w-full overflow-hidden border border-[#1f4231] bg-[#0a1c13] shadow-[0_24px_70px_rgba(0,0,0,.55)]">
                {images[desktopImage] ? (
                  <img
                    key={desktopImage}
                    src={images[desktopImage]}
                    alt={product.name}
                    className="kv-fade block h-auto w-full"
                  />
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center text-base text-[#74847a]">No image available</div>
                )}
                {images.length > 0 && (
                  <button
                    type="button"
                    aria-label="Open product image fullscreen"
                    onClick={() => openLightbox(desktopImage)}
                    className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#46c586]/60 bg-[#0c2217]/80 text-[#74cf98] backdrop-blur-sm transition hover:bg-[#133827]"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile gallery */}
            <div className="lg:hidden">
              <div
                className="relative overflow-hidden border border-[#1f4231] bg-[#0a1c13]"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {images.length > 0 ? (
                  <div className="relative w-full">
                    <button
                      type="button"
                      aria-label="Open product image fullscreen"
                      onClick={() => openLightbox(mobileImage)}
                      className="relative z-0 block w-full cursor-zoom-in touch-manipulation"
                    >
                      <img
                        key={mobileImage}
                        src={images[mobileImage]}
                        alt={`${product.name} ${mobileImage + 1}`}
                        className="kv-fade block h-auto w-full"
                        draggable={false}
                      />
                    </button>
                    <span className="pointer-events-none absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#46c586]/60 bg-[#0c2217]/80 text-[#74cf98]">
                      <Maximize2 className="h-4 w-4" />
                    </span>
                    {images.length > 1 && (
                      <>
                        <button type="button" aria-label="Previous image" onClick={(e) => { e.stopPropagation(); goToMobileImage(-1); }} className="absolute left-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#46c586]/50 bg-[#0c2217]/80 text-[#74cf98]"><ChevronLeft className="h-5 w-5" /></button>
                        <button type="button" aria-label="Next image" onClick={(e) => { e.stopPropagation(); goToMobileImage(1); }} className="absolute right-2 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#46c586]/50 bg-[#0c2217]/80 text-[#74cf98]"><ChevronRight className="h-5 w-5" /></button>
                        <span className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full border border-[#1f4231] bg-[#0c2217]/85 px-3 py-1 text-xs font-semibold text-[#f2f5f3]">
                          {mobileImage + 1}/{images.length}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center text-sm text-[#74847a]">No image available</div>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      aria-label={`View image ${index + 1}`}
                      onClick={() => setMobileImage(index)}
                      className={`h-[72px] w-14 shrink-0 overflow-hidden border ${mobileImage === index ? 'border-[#46c586] shadow-[0_0_0_1px_rgba(70,197,134,.35)]' : 'border-[#1f4231]'}`}
                    >
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div className="min-w-0">
            {badges.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {badges.map(({ label, Icon }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 border border-[#d9b45f]/60 bg-[#1a150a] px-2.5 py-1 text-sm font-semibold text-[#e6c776]"
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-[1.65rem] font-semibold leading-[1.25] tracking-tight text-[#f2f5f3] sm:text-[1.9rem] xl:text-[2.15rem]">
              {product.name}
            </h1>
            {(product.categoryLabel || product.category) && (
              <p className="mt-1.5 text-base text-[#a8b5ad]">{product.categoryLabel || product.category}</p>
            )}

            {hasRating && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-0.5 text-[#e6c776]" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className={`h-5 w-5 ${i < Math.round(rating) ? 'fill-current' : 'text-[#3a4640]'}`} />
                  ))}
                </div>
                <span className="text-base text-[#c3cec8]">
                  <span className="font-semibold text-[#f2f5f3]">{rating.toFixed(1)}</span> ({reviewCount} reviews)
                </span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-2">
              <span className="text-[1.9rem] font-semibold tracking-tight text-[#f2f5f3] sm:text-[2.25rem]">{formatINR(price)}</span>
              {mrp !== undefined && mrp > price && (
                <span className="pb-1 text-lg text-[#8a998f] line-through">{formatINR(mrp)}</span>
              )}
              {discount > 0 && (
                <span className="mb-1 border border-[#46c586]/70 bg-[#133827] px-3 py-1 text-sm font-bold text-[#6fd39a]">
                  {discount}% OFF
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm text-[#a8b5ad]">Inclusive of all taxes</p>

            {featureChips.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {featureChips.map(({ Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 border border-[#1f4231] bg-[#0a1c13] px-3.5 py-2.5 text-[15px] text-[#e3e9e5]"
                  >
                    <Icon className="h-5 w-5 text-[#74cf98]" /> {label}
                  </span>
                ))}
              </div>
            )}

            {hasBestOffer && (
              <div className="mt-5 border border-[#d9b45f]/50 bg-[#14110a] p-4">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-[#d9b45f] px-2.5 py-1 text-xs font-bold text-black">Best offer</span>
                    <span className="text-lg text-[#f2f5f3]">
                      Get it at <span className="font-bold text-[#e6c776]">{formatINR(bestPrice)}</span>
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[#e6c776]">Apply at checkout</span>
                </div>
                <p className="mt-2 text-base leading-7 text-[#b4c0b8]">
                  Applicable on select items, purchases &amp; checkout promos.
                </p>
              </div>
            )}

            {/* COLOR + SIZE */}
            <div ref={selectorsRef} className="mt-6 scroll-mt-24">
              {colors.length > 0 && (
                <div>
                  <p className="text-base text-[#a8b5ad]">
                    Color: <span className="font-semibold text-[#f2f5f3]">{selectedColorLabel}</span>
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
                          onClick={() => chooseColor(String(color))}
                          className={`relative flex h-14 w-14 items-center justify-center border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#74cf98] ${active ? 'border-[#46c586] shadow-[0_0_16px_rgba(70,197,134,.3)]' : 'border-[#1f4231] hover:border-[#2b5a41]'} ${soldOut && !active ? 'opacity-45' : ''}`}
                        >
                          <span className="h-9 w-9 rounded-full border border-white/20" style={{ backgroundColor: paint }} />
                          {soldOut && <span aria-hidden="true" className="absolute h-px w-10 rotate-45 bg-[#f2f5f3]/70" />}
                        </button>
                      ) : (
                        <button
                          key={color}
                          type="button"
                          aria-pressed={active}
                          onClick={() => chooseColor(String(color))}
                          className={`h-12 border px-4 text-base font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#74cf98] ${
                            active
                              ? 'border-[#46c586] bg-[#133827] text-[#9fe0bb] shadow-[0_0_16px_rgba(70,197,134,.25)]'
                              : `border-[#1f4231] bg-[#0a1c13] text-[#e3e9e5] hover:border-[#2b5a41] ${soldOut ? 'opacity-55 line-through' : ''}`
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
                    <p className="text-base text-[#a8b5ad]">
                      Size: <span className="font-semibold text-[#f2f5f3]">{selectedSize ?? 'Choose your size'}</span>
                    </p>
                    <button
                      type="button"
                      onClick={openSizeGuide}
                      className="inline-flex items-center gap-2 text-base text-[#a8b5ad] underline underline-offset-4 transition hover:text-[#74cf98]"
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
                          onClick={() => chooseSize(String(size))}
                          className={`h-[52px] min-w-[60px] border px-4 text-base font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#74cf98] ${
                            active
                              ? 'border-[#46c586] bg-[#133827] text-[#9fe0bb] shadow-[0_0_16px_rgba(70,197,134,.25)]'
                              : `border-[#1f4231] bg-[#0a1c13] text-[#e3e9e5] hover:border-[#2b5a41] ${soldOut ? 'opacity-55 line-through' : ''}`
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

            {/* ADD TO CART + WISHLIST (the only purchase action; no quantity control) */}
            <div className="mt-3 flex gap-3">
              <button
                ref={addButtonRef}
                type="button"
                onClick={handleAddToCart}
                disabled={stockBlocked || cartBusy}
                aria-busy={cartBusy}
                className={`relative flex h-14 min-w-0 flex-1 items-center justify-center gap-3 overflow-hidden border border-[#74cf98]/60 text-[15px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_0_24px_rgba(47,143,85,.28),0_6px_24px_rgba(0,0,0,.5)] transition-all [text-shadow:0_1px_2px_rgba(0,0,0,.6)] hover:brightness-110 active:scale-[.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#74cf98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:brightness-100 ${EMERALD_METAL}`}
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
                className={`flex h-14 w-14 shrink-0 items-center justify-center border border-[#1f4231] bg-[#0a1c13] text-[#74cf98] transition hover:border-[#2b5a41] ${isWishlisted ? 'border-[#46c586] shadow-[0_0_16px_rgba(70,197,134,.25)]' : ''} ${wishlistBusy ? 'opacity-60' : ''}`}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* TRUST */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
              {[
                { Icon: Truck, label: 'COD available', sub: 'Pay on delivery' },
                { Icon: ShieldCheck, label: 'Free shipping', sub: '' },
                { Icon: RotateCcw, label: 'Easy returns', sub: '7 days hassle free' },
              ].map(({ Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="h-8 w-8 shrink-0 text-[#a8b5ad]" strokeWidth={1.4} />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium leading-5 text-[#f2f5f3]">{label}</span>
                    {sub && <span className="mt-0.5 block text-sm leading-5 text-[#a8b5ad]">{sub}</span>}
                  </span>
                </div>
              ))}
            </div>

            {displaySku && (
              <div className="mt-5 inline-flex max-w-full items-center gap-2 text-sm text-[#a8b5ad]">
                <span>SKU</span>
                <span className="truncate font-semibold tracking-wide text-[#a8b5ad]">{displaySku}</span>
                <button
                  type="button"
                  aria-label={skuCopied ? 'SKU copied' : 'Copy SKU'}
                  onClick={copySku}
                  className="shrink-0 transition hover:text-[#74cf98]"
                >
                  {skuCopied ? <Check className="h-3.5 w-3.5 text-[#6fd39a]" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* KEY HIGHLIGHTS STRIP */}
      <section className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-px border border-[#1f4231] bg-[#1f4231] lg:auto-cols-fr lg:grid-flow-col">
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
                className="flex items-center gap-3 bg-[#0a1c13] px-4 py-4 odd:last:col-span-2 sm:gap-4 sm:px-6 sm:py-5 lg:odd:last:col-span-1"
              >
                <Icon className="h-8 w-8 shrink-0 text-[#46c586]" strokeWidth={1.3} />
                <span className="min-w-0">
                  <span className="block text-sm text-[#a8b5ad]">{label}</span>
                  <span className={`block truncate text-base font-medium ${tone || 'text-[#f2f5f3]'}`}>{value}</span>
                </span>
              </div>
            ))}
        </div>
      </section>

      {/* DETAILS TABS */}
      <section id="kovenik-details" className="mx-auto w-full max-w-[1500px] scroll-mt-6 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div role="tablist" aria-label="Product details" className="flex gap-7 overflow-x-auto border-b border-[#1f4231]">
          {tabs.map(({ key, label }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                id={`tab-${key}`}
                role="tab"
                type="button"
                aria-selected={active}
                aria-controls={`panel-${key}`}
                onClick={() => setActiveTab(key)}
                className={`-mb-px shrink-0 whitespace-nowrap border-b-2 pb-3 text-[17px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#74cf98] ${active ? 'border-[#46c586] font-semibold text-[#f2f5f3]' : 'border-transparent text-[#a8b5ad] hover:text-[#f2f5f3]'}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className={`mt-8 grid gap-10 ${detailImages.length > 0 ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]' : ''}`}>
          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="max-w-[70ch] text-base leading-[1.65] text-[#d5ded8]"
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
                  className="aspect-[4/5] overflow-hidden border border-[#1f4231] bg-[#0a1c13] transition hover:border-[#2b5a41]"
                >
                  <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <section className="border-t border-[#1a3828] bg-[#0a1c13]">
          <div className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
            <div className="flex items-end justify-between">
              <h2 className="text-xl font-semibold leading-none text-[#f2f5f3] sm:text-2xl">You may also like</h2>
              <Link
                href={`/shop?category=${encodeURIComponent(product.category_slug ?? product.category ?? '')}`}
                className="hidden items-center gap-2 text-sm font-semibold text-[#74cf98] transition-colors hover:text-white sm:flex"
              >
                View all <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
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
                  <Link key={item.id || item.slug} href={`/product/${item.slug}`} className="group block h-full min-w-0">
                    <article className="flex h-full flex-col overflow-hidden border border-[#1f4231] bg-[#0c2217] transition-all duration-300 hover:border-[#d9b45f]/60 hover:shadow-[0_12px_32px_rgba(0,0,0,.45)]">
                      <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-[#0a1c13]">
                        {itemImages[0] ? (
                          <img
                            src={itemImages[0]}
                            alt={item.name}
                            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                            loading={index > 0 ? 'lazy' : 'eager'}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-[#74847a]">No image available</div>
                        )}

                        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5 sm:left-3 sm:top-3">
                          {itemDiscount > 0 && (
                            <span className="border border-[#46c586]/70 bg-[#133827] px-2 py-0.5 text-[11px] font-bold leading-4 text-[#6fd39a]">
                              -{itemDiscount}%
                            </span>
                          )}
                          {(item.bestSeller || item.best_seller) && (
                            <span className="bg-[#d9b45f] px-2 py-0.5 text-[10px] font-bold uppercase leading-4 tracking-wide text-black">
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
                          className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-[#0c2217]/85 text-[#74cf98] backdrop-blur-sm transition hover:border-[#d9b45f] hover:text-[#e6c776] sm:right-3 sm:top-3 sm:h-9 sm:w-9 ${itemWishlisted ? 'border-[#d9b45f] text-[#e6c776]' : 'border-[#1f4231]'}`}
                        >
                          <Heart className={`h-4 w-4 ${itemWishlisted ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div className="flex flex-1 flex-col px-3 pb-3.5 pt-3 sm:px-4 sm:pb-4">
                        <div className="flex h-5 items-center gap-1.5 text-[#e6c776]">
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
                            <p className="mt-1 text-xs font-semibold text-[#e6c776] sm:text-sm">
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

      {/* MOBILE STICKY BAR: appears only after the in-flow Add to Cart scrolls away */}
      {!addInView && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1f4231] bg-[#0c2217]/95 p-2.5 pb-[calc(.625rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,.6)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-xl font-semibold leading-none text-white">{formatINR(price)}</span>
              {mrp !== undefined && mrp > price && (
                <span className="text-xs text-[#74847a] line-through">{formatINR(mrp)}</span>
              )}
              {discount > 0 && (
                <span className="border border-[#46c586]/70 bg-[#133827] px-1.5 py-0.5 text-[11px] font-bold text-[#6fd39a]">{discount}% OFF</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={stockBlocked || cartBusy}
              className={`h-12 flex-1 border border-[#74cf98]/60 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-[0_0_20px_rgba(47,143,85,.3)] [text-shadow:0_1px_2px_rgba(0,0,0,.6)] transition-all active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-45 ${EMERALD_METAL}`}
            >
              {cartBusy ? 'Adding…' : 'Add to Cart'}
            </button>
          </div>
        </div>
      )}

      {/* Hidden bridge: the existing AddToCart component/API logic, driven by the buttons above.
          Its own size/color/quantity controls are never shown, so no +/- selector appears. */}
      <div
        ref={cartBridgeRef}
        className="invisible pointer-events-none absolute -left-[10000px] top-0 h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <AddToCart product={bridgeProduct} />
      </div>

      {/* NOTICE (wishlist + cart feedback) */}
      {notice && (
        <div
          className="fixed left-1/2 top-5 z-[10000] w-[calc(100%-2rem)] max-w-[380px] -translate-x-1/2"
          role="status"
          aria-live="polite"
        >
          <div
            className={`relative flex items-start gap-3 border bg-[#0c2217] px-4 py-3.5 text-[#f2f5f3] shadow-[0_18px_50px_rgba(0,0,0,.6)] ${notice.tone === 'error' ? 'border-red-500/60' : 'border-[#46c586]/70'}`}
          >
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center ${notice.tone === 'error' ? 'text-red-300' : 'text-[#74cf98]'}`}>
              {notice.icon === 'heart' ? <Heart className="h-[18px] w-[18px] fill-current" /> : <ShoppingBag className="h-[18px] w-[18px]" />}
            </span>

            <div className="min-w-0 flex-1 pr-5">
              <p className="text-sm font-semibold leading-5">{notice.title}</p>
              {notice.body && <p className="mt-0.5 text-[13px] leading-5 text-[#a8b5ad]">{notice.body}</p>}
            </div>

            <button
              type="button"
              onClick={() => setNotice(null)}
              className="absolute right-3 top-3 text-[#74847a] transition hover:text-white"
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
          <button type="button" onClick={() => setLightboxOpen(false)} className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))] z-20 flex h-11 w-11 items-center justify-center border border-[#46c586]/60 bg-[#0c2217]/90 text-[#74cf98] backdrop-blur" aria-label="Close image viewer">
            <X className="h-5 w-5" />
          </button>

          <div className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-20 border border-[#1f4231] bg-[#0c2217]/90 px-3 py-1.5 text-xs font-semibold text-[#c3cec8]">
            {lightboxImage + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <button type="button" onClick={() => goToLightboxImage(-1)} className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[#2b5a41] bg-[#0c2217]/85 text-[#74cf98]" aria-label="Previous image"><ChevronLeft className="h-5 w-5" /></button>
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
            <button type="button" onClick={() => goToLightboxImage(1)} className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[#2b5a41] bg-[#0c2217]/85 text-[#74cf98]" aria-label="Next image"><ChevronRight className="h-5 w-5" /></button>
          )}
        </div>
      )}
    </main>
  );
}