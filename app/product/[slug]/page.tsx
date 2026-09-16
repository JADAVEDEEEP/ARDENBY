'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Star,
  Truck,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

import {
  getProductBySlug,
  getRelatedProducts,
} from '@/lib/data';

import { apiUrl } from '@/lib/api-url';
import { formatINR, discountPercent } from '@/lib/format';
import { ProductCard } from '@/components/product/product-card';
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
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  const toggleAccordion = (section: string) => {
    setOpenAccordion((current) => (current === section ? null : section));
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

      try {
        const category =
          loadedProduct.category_slug ?? loadedProduct.category ?? '';

        if (category) {
          const response = await fetch(
            apiUrl(
              `/api/products?page=1&limit=20&category=${encodeURIComponent(category)}`
            ),
            { cache: 'no-store' }
          );

          if (response.ok) {
            const data = await response.json();
            const apiRelated = (
              Array.isArray(data?.products) ? data.products : []
            )
              .filter(
                (item: any) =>
                  item.id !== loadedProduct!.id &&
                  item.slug !== loadedProduct!.slug
              )
              .slice(0, 4)
              .map(normalizeProduct);

            if (apiRelated.length) {
              if (!cancelled) setRelated(apiRelated);
            } else {
              const staticProduct = getProductBySlug(slug);
              if (staticProduct && !cancelled) {
                setRelated(
                  getRelatedProducts(staticProduct, 4).map(normalizeProduct)
                );
              }
            }
          }
        }
      } catch (error) {
        console.error('Related products API error:', error);
        const staticProduct = getProductBySlug(slug);
        if (staticProduct && !cancelled) {
          setRelated(
            getRelatedProducts(staticProduct, 4).map(normalizeProduct)
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
    setOpenAccordion(null);
  }, [slug]);

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

  return (
    <main className="min-h-screen bg-white text-[#151515]">
      {/* BREADCRUMB */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-hidden text-[11px] text-neutral-500">
          <Link href="/shop" className="shrink-0 hover:text-black">
            Shop
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link
            href={`/shop?category=${encodeURIComponent(
              product.category_slug ?? product.category ?? ''
            )}`}
            className="shrink-0 hover:text-black"
          >
            {product.categoryLabel || product.category || 'Products'}
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="truncate text-neutral-900">{product.name}</span>
        </div>
      </div>

      {/* MAIN PRODUCT SECTION */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8 lg:pb-24">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.75fr)] lg:gap-12">
          
          {/* IMAGE GALLERY */}
          <div>
            {/* Mobile swipe view with navigation dots & buttons */}
            <div className="lg:hidden">
              <div
                className="relative overflow-hidden bg-neutral-100 rounded-sm"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {images.length > 0 ? (
                  <>
                    <div className="aspect-[4/5] w-full">
                      <img
                        src={images[mobileImage]}
                        alt={`${product.name} ${mobileImage + 1}`}
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    </div>

                    {/* Left / Right tap arrows on mobile */}
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => goToMobileImage(-1)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-black shadow-md backdrop-blur-xs"
                          aria-label="Previous image"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() => goToMobileImage(1)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-black shadow-md backdrop-blur-xs"
                          aria-label="Next image"
                        >
                          ›
                        </button>
                      </>
                    )}

                    {product.bestSeller && mobileImage === 0 && (
                      <span className="absolute left-3 top-3 bg-black px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-white">
                        Best Seller
                      </span>
                    )}
                    <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-medium text-neutral-700">
                      {mobileImage + 1} / {images.length}
                    </span>
                  </>
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center text-sm text-neutral-400">
                    No image available
                  </div>
                )}
              </div>

              {/* Mobile Image Pagination Dots */}
              {images.length > 1 && (
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMobileImage(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        mobileImage === idx ? 'w-6 bg-black' : 'w-1.5 bg-neutral-300'
                      }`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Grid Gallery */}
            <div className="hidden grid-cols-2 gap-2.5 lg:grid">
              {images.length > 0 ? (
                images.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="group relative aspect-[4/5] overflow-hidden bg-neutral-100 rounded-sm"
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    {index === 0 && product.bestSeller && (
                      <span className="absolute left-3 top-3 bg-black px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-white">
                        Best Seller
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex aspect-[4/5] items-center justify-center bg-neutral-100 text-sm text-neutral-400">
                  No product image available
                </div>
              )}
            </div>
          </div>

          {/* PRODUCT META & CONTROLS */}
          <div className="lg:sticky lg:top-24">
            
            {/* Price & Rating Bar */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <span className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-[28px]">
                    {formatINR(price)}
                  </span>
                  {mrp !== undefined && mrp > price && (
                    <span className="text-sm text-neutral-400 line-through">
                      {formatINR(mrp)}
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="text-xs font-bold text-emerald-600">
                      {discount}% OFF
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  Inclusive of all taxes
                </p>
              </div>

              {/* Rating badge */}
              <div className="flex items-center gap-1 rounded border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold shadow-xs">
                <span>{rating.toFixed(1)}</span>
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-neutral-300">|</span>
                <span className="text-[11px] font-normal text-neutral-500">{reviewCount}</span>
              </div>
            </div>

            <h1 className="mt-3 font-medium text-lg text-neutral-900 sm:text-xl">
              {product.name}
            </h1>

            {/* OFFERS BOX */}
            <div className="mt-5 rounded-lg border border-sky-200 bg-sky-50/50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-sky-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                    Best Offer
                  </span>
                  <p className="text-xs font-semibold text-neutral-900">
                    Get at <strong className="text-emerald-700">{formatINR(bestPrice > 0 ? bestPrice : price * 0.9)}</strong>
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-sky-700 cursor-pointer hover:underline">
                  Explore ›
                </span>
              </div>
              <p className="mt-1 text-[11px] text-neutral-600">
                Applicable on multi-item purchases & checkout promos.
              </p>
            </div>

            {/* TRUST BADGE STRIP */}
            <div className="mt-4 flex items-center gap-2 text-[11px] text-neutral-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Trusted by verified fashion enthusiasts across India.</span>
            </div>

            {/* SIZES SECTION */}
            {sizes.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Select Size
                  </p>
                  <button
                    type="button"
                    onClick={() => setSizeSheetOpen(true)}
                    className="text-[11px] font-semibold text-sky-600 hover:underline"
                  >
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className="flex h-10 min-w-[42px] items-center justify-center rounded border border-neutral-300 bg-white px-3 text-xs font-semibold hover:border-black transition-colors"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ADD TO CART COMPONENT WRAPPER */}
            <div className="mt-6">
              <AddToCart
                product={{
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
                } as any}
              />
            </div>

            {/* DELIVERY CHECKER */}
            <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900">
                <Truck className="h-4 w-4 text-neutral-700" />
                <span>Delivery Details</span>
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Pincode to estimate delivery"
                  maxLength={6}
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-hidden"
                />
                <button
                  type="button"
                  className="rounded bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shrink-0 hover:bg-black"
                >
                  Check
                </button>
              </div>
            </div>

            {/* KEY HIGHLIGHTS / ATTRIBUTES */}
            <div className="mt-6 border-t border-neutral-200 pt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Key Highlights
              </p>
              
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                {product.fit && (
                  <div className="rounded border border-neutral-200 bg-neutral-50 p-2.5">
                    <span className="text-[10px] uppercase text-neutral-400 block">Fit</span>
                    <span className="mt-0.5 text-xs font-semibold text-neutral-800">{product.fit}</span>
                  </div>
                )}
                {product.fabric && (
                  <div className="rounded border border-neutral-200 bg-neutral-50 p-2.5">
                    <span className="text-[10px] uppercase text-neutral-400 block">Fabric</span>
                    <span className="mt-0.5 text-xs font-semibold text-neutral-800">{product.fabric}</span>
                  </div>
                )}
                <div className="rounded border border-neutral-200 bg-neutral-50 p-2.5">
                  <span className="text-[10px] uppercase text-neutral-400 block">Stock</span>
                  <span className={`mt-0.5 text-xs font-semibold ${Number(product.inventory) > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {Number(product.inventory) > 0 ? 'In Stock' : 'Sold Out'}
                  </span>
                </div>
              </div>
            </div>

            {/* PRODUCT INFORMATION ACCORDIONS / SECTIONS */}
            <div className="mt-6 divide-y divide-neutral-200 border-t border-b border-neutral-200 text-xs">
              
              {/* Description */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('description')}
                  className="py-3.5 flex w-full items-center justify-between font-semibold text-neutral-900 text-left"
                >
                  <span>Product Description & Details</span>
                  <ChevronRight className={`h-4 w-4 text-neutral-400 transition-transform ${openAccordion === 'description' ? 'rotate-90' : ''}`} />
                </button>
                {openAccordion === 'description' && (
                  <div className="pb-4 text-neutral-600 leading-relaxed">
                    <p>{product.description || 'No specific description provided for this style.'}</p>
                    {product.fabricDetails && (
                      <p className="mt-2"><strong className="text-neutral-900">Fabric Details:</strong> {product.fabricDetails}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Fabric & Wash Care */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('wash')}
                  className="py-3.5 flex w-full items-center justify-between font-semibold text-neutral-900 text-left"
                >
                  <span>Fabric & Wash Care</span>
                  <ChevronRight className={`h-4 w-4 text-neutral-400 transition-transform ${openAccordion === 'wash' ? 'rotate-90' : ''}`} />
                </button>
                {openAccordion === 'wash' && (
                  <div className="pb-4 text-neutral-600 leading-relaxed">
                    <p>{product.washCare || 'Machine wash cold with similar colors. Do not bleach. Tumble dry low.'}</p>
                  </div>
                )}
              </div>

              {/* Returns & Exchange */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('returns')}
                  className="py-3.5 flex w-full items-center justify-between font-semibold text-neutral-900 text-left"
                >
                  <span>Easy Returns & Exchange Policy</span>
                  <ChevronRight className={`h-4 w-4 text-neutral-400 transition-transform ${openAccordion === 'returns' ? 'rotate-90' : ''}`} />
                </button>
                {openAccordion === 'returns' && (
                  <div className="pb-4 text-neutral-600 leading-relaxed">
                    <p>Hassle-free 7-day returns and exchanges from the date of delivery. Items must be unused, unwashed, and with all original tags intact.</p>
                  </div>
                )}
              </div>

            </div>

            {/* ASSURANCE BADGES ROW */}
            <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[10px] font-medium text-neutral-600">
              <div className="flex flex-col items-center justify-center rounded border border-neutral-200 p-2 bg-neutral-50/50">
                <Truck className="h-4 w-4 mb-1 text-neutral-800" />
                <span>COD AVAILABLE</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded border border-neutral-200 p-2 bg-neutral-50/50">
                <ShieldCheck className="h-4 w-4 mb-1 text-neutral-800" />
                <span>FREE SHIPPING ON ALL ORDERS</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded border border-neutral-200 p-2 bg-neutral-50/50">
                <RotateCcw className="h-4 w-4 mb-1 text-neutral-800" />
                <span>EASY RETURNS</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl gap-2">
          <button
            type="button"
            onClick={() => setSizeSheetOpen(true)}
            className="flex min-w-0 flex-1 items-center justify-between rounded border border-neutral-300 bg-white px-3 py-2.5 text-left"
          >
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                Size
              </span>
              <span className="block text-xs font-semibold text-neutral-900">
                Select Size
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-500" />
          </button>

          <button
            type="button"
            onClick={() => setSizeSheetOpen(true)}
            className="flex-1 rounded bg-[#00e676] hover:bg-[#00c853] px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-950 transition-colors shadow-sm"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET FOR SIZES */}
      {sizeSheetOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close size selector"
            onClick={() => setSizeSheetOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-7 pt-3 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-300" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                  ARDENBY
                </p>
                <h2 className="font-serif text-lg text-neutral-950">Select Variant</h2>
              </div>
              <button
                type="button"
                onClick={() => setSizeSheetOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700"
              >
                ✕
              </button>
            </div>
            <div className="mt-4">
              <AddToCart
                product={{
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
                } as any}
              />
            </div>
          </div>
        </div>
      )}

      {/* RELATED PRODUCTS SECTION */}
      {related.length > 0 && (
        <section className="border-t border-neutral-200 bg-neutral-50/50">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Similar Products
                </p>
                <h2 className="mt-1 font-serif text-2xl text-neutral-950 sm:text-3xl">
                  You May Also Like
                </h2>
              </div>
              <Link
                href={`/shop?category=${encodeURIComponent(
                  product.category_slug ?? product.category ?? ''
                )}`}
                className="hidden items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:opacity-60 sm:flex"
              >
                View all <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
              {related.map((item, index) => (
                <ProductCard
                  key={item.id ?? item.slug}
                  product={item as any}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}