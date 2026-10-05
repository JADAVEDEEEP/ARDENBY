'use client';



import Link from 'next/link';

import { useParams } from 'next/navigation';

import { useEffect, useRef, useState } from 'react';

import {
  ArrowLeft,
  ChevronRight,
  Heart,
  Maximize2,
  Star,
  Truck,
  RotateCcw,
  ShieldCheck,
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



type Variant = {

  id?: string;

  product_id?: string;

  size?: string;

  color?: string;

  inventory?: number | string;

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



  fit?: string;

  fabric?: string;

  coverage?: string;



  price?: number | string;

  mrp?: number | string;

  bestPrice?: number | string;

  best_price?: number | string;



  rating?: number | string;

  reviewCount?: number | string;

  review_count?: number | string;



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



  inventory?: number | string;



  images?: { image_url?: string }[] | string[];

  variants?: Variant[];

  sizes?: string[];

  colors?: string[];

};



function normalizeProduct(product: any): ProductData {

  const variants: Variant[] = Array.isArray(product?.variants)

    ? product.variants

    : [];



  const images = Array.isArray(product?.images)

    ? product.images

        .map((image: any) =>

          typeof image === 'string' ? image : image?.image_url

        )

        .filter(Boolean)

    : [];



  const sizes =

    Array.isArray(product?.sizes) && product.sizes.length

      ? product.sizes

      : Array.from(

          new Set(

            variants.map((variant) => variant.size).filter(Boolean)

          )

        );



  const colors =

    Array.isArray(product?.colors) && product.colors.length

      ? product.colors

      : Array.from(

          new Set(

            variants.map((variant) => variant.color).filter(Boolean)

          )

        );



  return {

    ...product,

    category: product?.category ?? product?.category_slug ?? '',

    category_slug: product?.category_slug ?? product?.category ?? '',

    categoryLabel:

      product?.categoryLabel ??

      product?.category_label ??

      product?.category ??

      '',

    category_label:

      product?.category_label ??

      product?.categoryLabel ??

      product?.category ??

      '',

    fit: product?.fit ?? '',

    fabric: product?.fabric ?? '',

    coverage: product?.coverage ?? '',

    price: Number(product?.price ?? 0),

    mrp: product?.mrp == null ? undefined : Number(product.mrp),

    bestPrice: Number(product?.bestPrice ?? product?.best_price ?? 0),

    best_price: Number(product?.best_price ?? product?.bestPrice ?? 0),

    rating: Number(product?.rating ?? 0),

    reviewCount: Number(product?.reviewCount ?? product?.review_count ?? 0),

    review_count: Number(product?.review_count ?? product?.reviewCount ?? 0),

    description: product?.description ?? '',

    fabricDetails: product?.fabricDetails ?? product?.fabric_details ?? '',

    washCare: product?.washCare ?? product?.wash_care ?? '',

    bestSeller: Boolean(product?.bestSeller ?? product?.best_seller),

    newArrival: Boolean(product?.newArrival ?? product?.new_arrival),

    trending: Boolean(product?.trending),

    limitedEdition: Boolean(product?.limitedEdition ?? product?.limited_edition),

    inventory: Number(product?.inventory ?? 0),

    images,

    variants,

    sizes,

    colors,

  };

}



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

  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(0);

  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistToast, setWishlistToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const wishlistToggle = useWishlistStore((state) => state.toggle);
  const wishlistSync = useWishlistStore((state) => state.syncFromApi);
  const wishlistHas = useWishlistStore((state) => state.has);
  // Subscribe to the actual wishlist items so related-product hearts rerender
  // immediately after the real API add/remove operation completes.
  const wishlistItems = useWishlistStore((state) => state.items);
  const isRelatedWishlisted = (productId: string) =>
    wishlistItems.some((item) => item.productId === String(productId));

  const showWishlistToast = (message: string, type: 'success' | 'error' = 'success') => {
    setWishlistToast({ message, type });
    window.setTimeout(() => setWishlistToast(null), 2600);
  };


  const touchStartX = useRef<number | null>(null);
  const mobileCartBridgeRef = useRef<HTMLDivElement | null>(null);
  const lightboxTouchStartX = useRef<number | null>(null);



  const toggleAccordion = (section: string) => {

    setOpenAccordion((current) => (current === section ? null : section));

  };


  const buildWishlistItem = (item: ProductData) => {
    const itemImages = Array.isArray(item.images)
      ? item.images
          .map((image: any) =>
            typeof image === 'string' ? image : image?.image_url
          )
          .filter(Boolean)
      : [];

    return {
      productId: String(item.id ?? '').trim(),
      slug: String(item.slug ?? ''),
      name: String(item.name ?? 'ARDENBY Product'),
      image: String(itemImages[0] ?? ''),
      price: Number(item.price ?? 0),
      mrp: Number(item.mrp ?? item.price ?? 0),
    };
  };

  const handleWishlistToggle = async () => {
    if (!product?.id || wishlistBusy) return;

    setWishlistBusy(true);

    try {
      const wasWishlisted = wishlistHas(String(product.id));
      await wishlistToggle(buildWishlistItem(product));
      const nextWishlisted = !wasWishlisted;
      setIsWishlisted(nextWishlisted);
      showWishlistToast(
        nextWishlisted ? 'Added to your wishlist' : 'Removed from your wishlist',
        'success'
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update wishlist.';

      showWishlistToast(
        message === 'AUTH_REQUIRED'
          ? 'Please login to use your wishlist.'
          : message,
        'error'
      );

      setIsWishlisted(wishlistHas(String(product.id)));
    } finally {
      setWishlistBusy(false);
    }
  };



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



      // Load related products. If the live category endpoint returns no matches,
      // fall back to the existing static related-products source.
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
            apiRelated = (
              Array.isArray(data?.products) ? data.products : []
            )
              .filter(
                (item: any) =>
                  item.id !== loadedProduct!.id &&
                  item.slug !== loadedProduct!.slug
              )
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

    setSizeSheetOpen(false);
    setLightboxOpen(false);
    setLightboxImage(0);
    setOpenAccordion(null);

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



  if (loading) {

    return (

      <main className="min-h-screen bg-white px-4 py-12">

        <div className="mx-auto max-w-7xl animate-pulse">

          <div className="h-4 w-32 rounded bg-neutral-200" />

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.72fr]">

            <div className="aspect-[4/5] bg-neutral-200" />

            <div className="space-y-4">

              <div className="h-4 w-24 rounded bg-neutral-200" />

              <div className="h-12 w-3/4 rounded bg-neutral-200" />

              <div className="h-8 w-32 rounded bg-neutral-200" />

              <div className="h-24 rounded bg-neutral-200" />

            </div>

          </div>

        </div>

      </main>

    );

  }



  if (!product) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center">

        <div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400">

            ARDENBY

          </p>

          <h1 className="mt-3 font-serif text-3xl text-neutral-950">

            Product not found

          </h1>

          <Link

            href="/shop"

            className="mt-6 inline-flex border border-black bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white"

          >

            Back to shop

          </Link>

        </div>

      </main>

    );

  }



  const price = Number(product.price ?? 0);

  const mrp = product.mrp == null ? undefined : Number(product.mrp);

  const bestPrice = Number(product.bestPrice ?? product.best_price ?? 0);

  const rating = Number(product.rating ?? 0);

  const reviewCount = Number(product.reviewCount ?? product.review_count ?? 0);

  const discount = mrp !== undefined ? discountPercent(mrp, price) : 0;



  const images = Array.isArray(product.images)

    ? product.images

        .map((image: any) =>

          typeof image === 'string' ? image : image?.image_url

        )

        .filter(Boolean)

    : [];



  const variants = Array.isArray(product.variants) ? product.variants : [];

  const sizes = product.sizes?.length

    ? product.sizes

    : Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));

  const colors = product.colors?.length

    ? product.colors

    : Array.from(new Set(variants.map((v) => v.color).filter(Boolean)));



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



  const openMobileLightbox = (index: number) => {
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

  const clickExistingCartButton = () => {
    const root = mobileCartBridgeRef.current;
    if (!root) return false;

    const buttons = Array.from(root.querySelectorAll('button'));
    const addButton = buttons.find((button) =>
      button.textContent?.trim().toLowerCase().includes('add to cart')
    );

    if (!addButton) return false;
    addButton.click();
    return true;
  };

  const syncExistingCartSize = (size: string) => {
    const root = mobileCartBridgeRef.current;
    if (!root) return false;

    const buttons = Array.from(root.querySelectorAll('button'));
    const sizeButton = buttons.find(
      (button) => button.textContent?.trim().toLowerCase() === size.trim().toLowerCase()
    );

    if (!sizeButton) return false;
    sizeButton.click();
    return true;
  };

  const syncExistingCartColor = (color: string) => {
    const root = mobileCartBridgeRef.current;
    if (!root) return false;

    const buttons = Array.from(root.querySelectorAll('button'));
    const colorButton = buttons.find(
      (button) => button.textContent?.trim().toLowerCase() === color.trim().toLowerCase()
    );

    if (!colorButton) return false;
    colorButton.click();
    return true;
  };

  const selectMobileSize = (size: string) => {
    setSelectedSize(size);
    syncExistingCartSize(size);
  };

  const selectMobileColor = (color: string) => {
    setSelectedColor(color);
    syncExistingCartColor(color);
  };

  const handleMobileAddToCart = () => {
    if (!selectedSize) {
      setSizeSheetOpen(true);
      return;
    }

    if (!clickExistingCartButton()) {
      setSizeSheetOpen(true);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#f5f0e7] pb-24 lg:pb-0">
      {/* PREMIUM HEADER / BREADCRUMB */}
      <div className="border-b border-[#2c2417] bg-[#070707]">
        <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[#9d9384] sm:px-6 lg:px-10">
          <Link href="/shop" className="transition-colors hover:text-[#e6b85c]">Shop</Link>
          <ChevronRight className="h-3 w-3 text-[#5c4a2b]" />
          <Link href={`/shop?category=${encodeURIComponent(product.category_slug ?? product.category ?? '')}`} className="transition-colors hover:text-[#e6b85c]">
            {product.categoryLabel || product.category || 'Products'}
          </Link>
          <ChevronRight className="h-3 w-3 text-[#5c4a2b]" />
          <span className="truncate text-[#d6c6a9]">{product.name}</span>
        </div>
      </div>

      <section className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.22fr)_minmax(400px,0.70fr)] xl:gap-12">
          {/* GALLERY */}
          <div className="min-w-0">
            <div className="hidden lg:grid lg:grid-cols-[86px_minmax(0,1fr)] lg:gap-4">
              <div className="flex max-h-[720px] flex-col gap-3 overflow-y-auto pr-1">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setDesktopImage(index)}
                    className={`relative aspect-[4/5] overflow-hidden border bg-[#0b0b0b] transition-all ${desktopImage === index ? 'border-[#e8bb63] shadow-[0_0_0_1px_rgba(232,187,99,.25)]' : 'border-[#30281c] hover:border-[#806331]'}`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>

              <div
                className="group relative aspect-[4/5] w-full overflow-hidden border border-[#332918] bg-[#0b0b0b] text-left shadow-[0_18px_60px_rgba(0,0,0,.35)]"
              >
                {images[desktopImage] ? <img src={images[desktopImage]} alt={product.name} className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.01]" /> : <div className="flex h-full items-center justify-center text-sm text-[#766b5d]">No image available</div>}
                {product.bestSeller && <span className="absolute left-4 top-4 border border-[#f1c86b]/50 bg-[#e8b95e] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-black">Bestseller</span>}
                <button
                  type="button"
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  onClick={handleWishlistToggle}
                  disabled={wishlistBusy}
                  className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center border border-[#d7ad5d] bg-black/55 backdrop-blur-sm transition ${isWishlisted ? 'text-[#f1c86b] shadow-[0_0_18px_rgba(231,184,78,.28)]' : 'text-[#f1c86b]'} ${wishlistBusy ? 'opacity-60' : 'hover:bg-black/75'}`}
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            </div>

            <div className="lg:hidden">
              <div
                className="relative overflow-hidden border border-[#4a3820] bg-[#090909] shadow-[0_14px_45px_rgba(0,0,0,.45)]"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {images.length > 0 ? (
                  <div className="relative aspect-[4/5] w-full max-h-[72svh]">
                    <button
                      type="button"
                      aria-label="Open product image fullscreen"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openMobileLightbox(mobileImage);
                      }}
                      className="absolute inset-0 z-0 block h-full w-full cursor-zoom-in touch-manipulation"
                    >
                      <img
                        src={images[mobileImage]}
                        alt={`${product.name} ${mobileImage + 1}`}
                        className="h-full w-full object-contain bg-[#090909]"
                        draggable={false}
                      />
                    </button>
                    {product.bestSeller && mobileImage === 0 && <span className="pointer-events-none absolute left-3 top-3 z-10 border border-[#f1c86b]/50 bg-[#e8b95e] px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-black">Bestseller</span>}
                    <button
                        type="button"
                        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWishlistToggle();
                        }}
                        disabled={wishlistBusy}
                        className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center border border-[#d7ad5d] bg-black/60 text-[#f1c86b] transition ${isWishlisted ? 'shadow-[0_0_18px_rgba(231,184,78,.28)]' : ''}`}
                      >
                        <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                      </button>
                    <span className="pointer-events-none absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center border border-[#d7ad5d] bg-black/65 text-[#f1c86b]"><Maximize2 className="h-4 w-4" /></span>
                    {images.length > 1 && <>
                      <button type="button" onClick={(e) => { e.stopPropagation(); goToMobileImage(-1); }} className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-[#d7ad5d] bg-black/65 text-xl text-[#f1c86b]">‹</button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); goToMobileImage(1); }} className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-[#d7ad5d] bg-black/65 text-xl text-[#f1c86b]">›</button>
                    </>}
                  </div>
                ) : <div className="flex aspect-[4/5] items-center justify-center text-sm text-[#766b5d]">No image available</div>}
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => setMobileImage(index)} className={`h-16 w-12 shrink-0 overflow-hidden border ${mobileImage === index ? 'border-[#e8bb63]' : 'border-[#30281c]'}`}><img src={image} alt="" className="h-full w-full object-cover" /></button>)}
              </div>
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div className="min-w-0 lg:sticky lg:top-5">
            <div className="border-b border-[#30281c] pb-5">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.3em] text-[#d5a94f]">ARDENBY / {product.categoryLabel || product.category || 'Collection'}</p>
              <h1 className="font-serif text-3xl leading-tight text-[#f7f0e4] sm:text-4xl">{product.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-[#f1c04e]">{[0,1,2,3,4].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                <span className="text-sm font-semibold text-[#d0c5b5]">{rating.toFixed(1)} ({reviewCount} reviews)</span>
              </div>
              <div className="mt-5 flex flex-wrap items-end gap-3">
                <span className="text-3xl font-semibold tracking-tight text-white">{formatINR(price)}</span>
                {mrp !== undefined && mrp > price && <span className="text-base font-semibold text-[#817768] line-through">{formatINR(mrp)}</span>}
                {discount > 0 && <span className="border border-[#0d6b4e] bg-[#063d2e] px-2 py-1 text-[10px] font-bold text-[#48d3a4]">{discount}% OFF</span>}
              </div>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-[#817768]">Inclusive of all taxes</p>
            </div>

            <div className="mt-5 border border-[#c99943] bg-gradient-to-r from-[#0d0c09] to-[#17120a] p-4 shadow-[0_0_24px_rgba(190,140,45,.08)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2"><span className="bg-[#e8b95e] px-2 py-1 text-[9px] font-black uppercase text-black">Best Offer</span><span className="text-base font-semibold text-[#e8dfd0]">Get it at <strong className="text-[#45d4a5]">{formatINR(bestPrice > 0 ? bestPrice : price * 0.9)}</strong></span></div>
                <span className="text-sm font-bold text-[#e8b95e]">Apply at checkout</span>
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#a79d90]">Applicable on select items, purchases & checkout promos.</p>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#cfc5b8]"><ShieldCheck className="h-4 w-4 text-[#e8b95e]" /><span>Trusted by verified fashion enthusiasts across India.</span></div>

            {/* SINGLE EXISTING SIZE / COLOR / CART COMPONENT — NO DUPLICATE SELECTORS */}
            <div
              data-existing-add-to-cart="true"
              className="mt-6 hidden border border-[#4a3922] bg-[#090909] p-3 lg:block
                [&_p]:!text-white [&_span]:!text-white [&_label]:!text-white [&_strong]:!text-white [&_div]:!text-white [&_small]:!text-white
                [&_button]:!rounded-none [&_button]:!font-black [&_button]:!uppercase [&_button]:!tracking-[0.12em]
                [&_button]:!border-[#d9ad4e] [&_button]:!text-white
                [&_button[aria-pressed='true']]:!border-[#f3d57b]
                [&_button[aria-pressed='true']]:!bg-gradient-to-r [&_button[aria-pressed='true']]:!from-[#a87820] [&_button[aria-pressed='true']]:!via-[#f0c65c] [&_button[aria-pressed='true']]:!to-[#b88424]
                [&_button[aria-pressed='true']]:!text-black
                [&_button[aria-pressed='true']]:!shadow-[0_0_18px_rgba(231,184,78,.30),0_6px_28px_rgba(0,0,0,.35)]
                [&_button[data-selected='true']]:!border-[#f3d57b]
                [&_button[data-selected='true']]:!bg-gradient-to-r [&_button[data-selected='true']]:!from-[#a87820] [&_button[data-selected='true']]:!via-[#f0c65c] [&_button[data-selected='true']]:!to-[#b88424]
                [&_button[data-selected='true']]:!text-black
                [&_button[data-selected='true']]:!shadow-[0_0_18px_rgba(231,184,78,.30),0_6px_28px_rgba(0,0,0,.35)]">
              <AddToCart product={{ ...product, price, mrp, bestPrice, rating, reviewCount, images, variants, sizes, colors } as any} />
            </div>

            <div className="mt-4 flex items-center justify-between border border-[#30281c] bg-[#090909] px-3 py-3 lg:hidden">
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#8e8374]">Selected size</p>
                <p className="mt-1 truncate text-sm font-bold text-[#f1e8da]">{selectedSize || 'Choose a size'}</p>
              </div>
              <button type="button" onClick={() => setSizeSheetOpen(true)} className="text-sm font-bold uppercase tracking-[0.16em] text-[#e8b95e]">Change</button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="border border-[#30281c] bg-[#0b0b0b] p-3 text-center"><Truck className="mx-auto mb-2 h-4 w-4 text-[#e8b95e]" /><span className="text-sm font-bold uppercase tracking-wider text-[#d0c5b8]">COD Available</span></div>
              <div className="border border-[#30281c] bg-[#0b0b0b] p-3 text-center"><ShieldCheck className="mx-auto mb-2 h-4 w-4 text-[#e8b95e]" /><span className="text-sm font-bold uppercase tracking-wider text-[#d0c5b8]">Free Shipping</span></div>
              <div className="border border-[#30281c] bg-[#0b0b0b] p-3 text-center"><RotateCcw className="mx-auto mb-2 h-4 w-4 text-[#e8b95e]" /><span className="text-sm font-bold uppercase tracking-wider text-[#d0c5b8]">Easy Returns</span></div>
            </div>

            <div className="mt-6 border-y border-[#30281c]">
              {[
                ['description', 'Product Description & Details'],
                ['wash', 'Fabric & Wash Care'],
                ['returns', 'Easy Returns & Exchange Policy'],
              ].map(([key, label]) => <div key={key} className="border-b border-[#30281c] last:border-b-0"><button type="button" onClick={() => toggleAccordion(key)} className="flex w-full items-center justify-between py-4 text-left text-sm font-bold uppercase tracking-wider text-[#f0e8dc]"><span>{label}</span><ChevronRight className={`h-4 w-4 text-[#e8b95e] transition-transform ${openAccordion === key ? 'rotate-90' : ''}`} /></button>{openAccordion === key && <div className="pb-4 text-sm font-semibold leading-7 text-[#b9afa1]">{key === 'description' && <><p>{product.description || 'No specific description provided for this style.'}</p>{product.fabricDetails && <p className="mt-2"><strong className="text-[#d9cfbf]">Fabric Details:</strong> {product.fabricDetails}</p>}</>}{key === 'wash' && <p>{product.washCare || 'Machine wash cold with similar colors. Do not bleach. Tumble dry low.'}</p>}{key === 'returns' && <p>Hassle-free 7-day returns and exchanges from the date of delivery. Items must be unused, unwashed, and with all original tags intact.</p>}</div>}</div>)}
            </div>

            <div className="mt-6 border-t border-[#30281c] pt-5"><p className="text-sm font-black uppercase tracking-[0.25em] text-[#e8b95e]">Key Highlights</p><div className="mt-3 grid grid-cols-3 gap-2">{product.fit && <div className="border border-[#30281c] bg-[#0b0b0b] p-3 text-center"><span className="block text-sm font-bold uppercase text-[#9d9182]">Fit</span><span className="mt-1 block text-sm font-bold text-[#eee5d8]">{product.fit}</span></div>}{product.fabric && <div className="border border-[#30281c] bg-[#0b0b0b] p-3 text-center"><span className="block text-sm font-bold uppercase text-[#9d9182]">Fabric</span><span className="mt-1 block text-sm font-bold text-[#eee5d8]">{product.fabric}</span></div>}<div className="border border-[#30281c] bg-[#0b0b0b] p-3 text-center"><span className="block text-sm font-bold uppercase text-[#9d9182]">Stock</span><span className={`mt-1 block text-xs font-bold ${Number(product.inventory) > 0 ? 'text-[#45d4a5]' : 'text-red-400'}`}>{Number(product.inventory) > 0 ? 'In Stock' : 'Sold Out'}</span></div></div></div>
          </div>
        </div>
      </section>

      {/* RELATED PRODUCTS SECTION */}
      {related.length > 0 && (
        <section className="bg-[#090909]">
          <div className="mx-auto w-full max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-px w-8 bg-[#d4af37]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#e8b95e]">
                    Similar Products
                  </p>
                </div>
                <h2 className="mt-2 font-serif text-3xl leading-none text-[#d4af37] sm:text-4xl">
                  You May Also Like
                </h2>
              </div>

              <Link
                href={`/shop?category=${encodeURIComponent(
                  product.category_slug ?? product.category ?? ''
                )}`}
                className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#e8b95e] transition-colors hover:text-white sm:flex"
              >
                View all <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5 lg:gap-6">
              {related.slice(0, 2).map((item, index) => {
                const itemPrice = Number(item.price ?? 0);
                const itemMrp = item.mrp == null ? undefined : Number(item.mrp);
                const itemBestPrice = Number(item.bestPrice ?? item.best_price ?? 0);
                const itemRating = Number(item.rating ?? 0);
                const itemReviews = Number(item.reviewCount ?? item.review_count ?? 0);
                const itemDiscount = itemMrp !== undefined
                  ? discountPercent(itemMrp, itemPrice)
                  : 0;
                const itemImages = Array.isArray(item.images)
                  ? item.images
                      .map((image: any) =>
                        typeof image === 'string' ? image : image?.image_url
                      )
                      .filter(Boolean)
                  : [];

                return (
                  <Link
                    key={item.id ?? item.slug}
                    href={`/product/${item.slug}`}
                    className="group block min-w-0"
                  >
                    <article className="overflow-hidden border border-[#2d271d] bg-[#090909] shadow-[0_18px_55px_rgba(0,0,0,.28)] transition-all duration-300 hover:-translate-y-1 hover:border-[#806331]">
                      {/* IMAGE — fills the complete card width with no empty side area */}
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#111]">
                        {itemImages[0] ? (
                          <img
                            src={itemImages[0]}
                            alt={item.name}
                            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.015]"
                            loading={index > 0 ? 'lazy' : 'eager'}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-[#766b5d]">
                            No product image available
                          </div>
                        )}

                        {itemDiscount > 0 && (
                          <span className="absolute left-3 top-3 border border-white/10 bg-[#111] px-2 py-1 text-[9px] font-black tracking-[0.04em] text-white shadow-lg">
                            -{itemDiscount}%
                          </span>
                        )}

                        {(item.bestSeller || item.best_seller) && (
                          <span className="absolute left-3 top-11 border border-[#d9ad4e]/40 bg-[#e8b95e] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-black shadow-lg">
                            Bestseller
                          </span>
                        )}

                        <button
                      type="button"
                      aria-label={isRelatedWishlisted(String(item.id)) ? 'Remove from wishlist' : 'Add product to wishlist'}
                      onClick={async (event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        try {
                          const wasWishlisted = isRelatedWishlisted(String(item.id));
                          await wishlistToggle(buildWishlistItem(item));
                          // Backend is the source of truth; refresh after the mutation.
                          await wishlistSync();
                          showWishlistToast(
                            wasWishlisted
                              ? 'Removed from your wishlist'
                              : 'Added to your wishlist',
                            'success'
                          );
                        } catch (error) {
                          const message =
                            error instanceof Error
                              ? error.message
                              : 'Unable to update wishlist.';

                          showWishlistToast(
                            message === 'AUTH_REQUIRED'
                              ? 'Please login to use your wishlist.'
                              : message,
                            'error'
                          );
                        }
                      }}
                      className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/90 text-[#111] shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-105 ${isRelatedWishlisted(String(item.id)) ? 'text-[#d4a63f]' : ''}`}
                    >
                      <Heart className={`h-5 w-5 ${isRelatedWishlisted(String(item.id)) ? 'fill-current' : ''}`} />
                    </button>
                      </div>

                      {/* PRODUCT CONTENT — white, larger and always visible */}
                      <div className="px-3 pb-4 pt-3 sm:px-4 sm:pb-5 sm:pt-4">
                        <div className="flex items-center gap-2 text-[#f3c84f]">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm font-bold text-white">
                            {itemRating.toFixed(1)}
                          </span>
                          <span className="text-sm font-semibold text-white/60">
                            ({itemReviews})
                          </span>
                        </div>

                        <h3 className="mt-2 font-serif text-base font-semibold leading-tight text-white sm:text-lg">
                          {item.name}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-xl font-black tracking-tight text-white sm:text-2xl">
                            {formatINR(itemPrice)}
                          </span>
                          {itemMrp !== undefined && itemMrp > itemPrice && (
                            <span className="text-sm font-semibold text-white/45 line-through sm:text-base">
                              {formatINR(itemMrp)}
                            </span>
                          )}
                          {itemDiscount > 0 && (
                            <span className="border border-[#159c72] bg-[#063d2e] px-2.5 py-1.5 text-[10px] font-black tracking-wide text-[#45d4a5] sm:text-xs">
                              {itemDiscount}% OFF
                            </span>
                          )}
                        </div>

                        <p className="mt-1.5 text-sm font-black text-[#45d4a5] sm:text-base">
                          Best Price: {formatINR(itemBestPrice > 0 ? itemBestPrice : itemPrice)}
                        </p>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* MOBILE STICKY ACTIONS */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#4b3921] bg-[#070707]/96 p-2.5 pb-[calc(.625rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,.55)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-2 gap-2">
          <button type="button" onClick={() => setSizeSheetOpen(true)} className="h-11 border border-[#d3a64f] bg-[#0b0b0b] text-[10px] font-black uppercase tracking-[0.14em] text-[#e8b95e] active:bg-[#15120d]">
            {selectedSize ? `Size · ${selectedSize}` : selectedColor ? `Color · ${selectedColor}` : 'Select Size'}
          </button>
          <button type="button" onClick={handleMobileAddToCart} className="h-11 border border-[#f3d57b] bg-gradient-to-r from-[#a87820] via-[#f0c65c] to-[#b88424] text-[10px] font-black uppercase tracking-[0.14em] text-black shadow-[0_0_20px_rgba(231,184,78,.34),0_6px_24px_rgba(0,0,0,.4)] transition-all hover:brightness-110 active:scale-[.99] active:brightness-95">Add to Cart</button>
        </div>
      </div>

      {/* Hidden mobile bridge: reuses the existing AddToCart component/API logic. */}
      <div ref={mobileCartBridgeRef} className="pointer-events-none absolute -left-[10000px] top-0 h-px w-px overflow-hidden opacity-0" aria-hidden="true">
        <AddToCart product={{ ...product, price, mrp, bestPrice, rating, reviewCount, images, variants, sizes, colors } as any} />
      </div>

      {/* MOBILE SIZE SELECTION ONLY */}
      {sizeSheetOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Choose product size">
          <button type="button" aria-label="Close size selector" onClick={() => setSizeSheetOpen(false)} className="absolute inset-0 bg-black/78 backdrop-blur-sm" />
          <div className="absolute inset-x-0 bottom-0 max-h-[72vh] overflow-y-auto border-t border-[#d3a64f] bg-[#080808] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_80px_rgba(0,0,0,.78)]">
            <div className="mx-auto mb-4 h-1 w-12 bg-[#d3a64f]" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.28em] text-[#d3a64f]">ARDENBY</p>
                <h2 className="mt-1 font-serif text-xl text-white">Select Size</h2>
                <p className="mt-1 text-[10px] text-[#817768]">Choose your size to continue.</p>
              </div>
              <button type="button" onClick={() => setSizeSheetOpen(false)} className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#4b3921] text-[#d3a64f]" aria-label="Close size selector">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 border-y border-[#30281c] py-5">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#d8cebf]">Available Sizes</p>
                {selectedSize && <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#d3a64f]">Selected · {selectedSize}</span>}
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => selectMobileSize(String(size))}
                    className={`relative h-12 border px-3 text-[10px] font-black uppercase tracking-[0.08em] transition ${selectedSize?.toLowerCase() === String(size).toLowerCase() ? 'border-[#f0c66b] bg-gradient-to-r from-[#a87820] via-[#f0c65c] to-[#b88424] text-black shadow-[0_0_22px_rgba(231,184,78,.30)]' : 'border-[#5b4728] bg-[#0d0d0d] text-white hover:border-[#d3a64f] hover:text-[#e8b95e]'}`}
                  >
                    {size}
                    {selectedSize?.toLowerCase() === String(size).toLowerCase() && <span className="absolute right-1.5 top-1 text-[9px]">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {colors.length > 0 && (
              <div className="border-b border-[#30281c] py-5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#d8cebf]">Select Color</p>
                  {selectedColor && (
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#d3a64f]">
                      Selected · {selectedColor}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {colors.map((color) => {
                    const active = selectedColor?.toLowerCase() === String(color).toLowerCase();
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => selectMobileColor(String(color))}
                        className={`h-11 border px-4 text-[10px] font-black uppercase tracking-[0.08em] transition ${
                          active
                            ? 'border-[#f0c66b] bg-gradient-to-r from-[#a87820] via-[#f0c65c] to-[#b88424] text-black shadow-[0_0_22px_rgba(231,184,78,.30)]'
                            : 'border-[#5b4728] bg-[#0d0d0d] text-white hover:border-[#d3a64f] hover:text-[#e8b95e]'
                        }`}
                      >
                        {color}
                        {active && <span className="ml-2">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {wishlistToast && (
        <div
          className="fixed left-1/2 top-5 z-[10000] w-[calc(100%-2rem)] max-w-[356px] -translate-x-1/2"
          role="status"
          aria-live="polite"
        >
          <div className="relative flex items-start gap-3 rounded-xl border border-black/10 bg-[#f8f7f5] px-4 py-3.5 text-[#171717] shadow-[0_18px_50px_rgba(0,0,0,.28)] ring-1 ring-white/70">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center text-[#e52b38]">
              <Heart className="h-[18px] w-[18px] fill-current stroke-[2.4]" />
            </span>

            <div className="min-w-0 flex-1 pr-5">
              <p className="text-[13px] font-bold leading-5 text-[#202020]">
                {wishlistToast.type === 'error'
                  ? 'Please log in to add this to your favourites.'
                  : wishlistToast.message === 'Removed from your wishlist'
                    ? 'Removed from your favourites.'
                    : 'Added to your favourites.'}
              </p>

              <p className="mt-0.5 text-[12px] font-medium leading-[18px] text-[#77736e]">
                {wishlistToast.type === 'error'
                  ? 'Create an account or sign in to save your favourite pieces.'
                  : wishlistToast.message === 'Removed from your wishlist'
                    ? 'This piece has been removed from your saved favourites.'
                    : 'This piece has been saved to your wishlist.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setWishlistToast(null)}
              className="absolute right-3 top-3 text-[#8b8781] transition hover:text-[#222]"
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
          className="fixed inset-0 z-[9999] flex h-dvh w-dvw items-center justify-center bg-black lg:hidden pointer-events-auto overscroll-none"
          role="dialog"
          aria-modal="true"
          aria-label="Product image viewer"
          onTouchStart={handleLightboxTouchStart}
          onTouchEnd={handleLightboxTouchEnd}
        >
          <button type="button" onClick={() => setLightboxOpen(false)} className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))] z-20 flex h-11 w-11 items-center justify-center border border-[#d3a64f] bg-black/75 text-[#e8b95e] backdrop-blur" aria-label="Close image viewer">
            <X className="h-5 w-5" />
          </button>
          <div className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-20 border border-[#4b3921] bg-black/70 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#d8c9b5]">
            {lightboxImage + 1} / {images.length}
          </div>

          <button type="button" onClick={() => goToLightboxImage(-1)} className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[#6b522b] bg-black/65 text-2xl text-[#e8b95e]" aria-label="Previous image">‹</button>
          <div className="flex h-dvh w-full items-center justify-center p-0">
            <img
              src={images[lightboxImage]}
              alt={`${product.name} fullscreen`}
              className="block h-auto w-auto max-h-[calc(100dvh-5rem)] max-w-[calc(100vw-1rem)] object-contain select-none"
              draggable={false}
            />
          </div>
          <button type="button" onClick={() => goToLightboxImage(1)} className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[#6b522b] bg-black/65 text-2xl text-[#e8b95e]" aria-label="Next image">›</button>
          <p className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-[0.2em] text-[#766b5d]">Swipe to view</p>
        </div>
      )}
    </main>
  );
}