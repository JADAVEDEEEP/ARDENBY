import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Star,
  Truck,
} from 'lucide-react';

import { getProductBySlug, getRelatedProducts } from '@/lib/data';
import { formatINR, discountPercent } from '@/lib/format';
import { ProductCard } from '@/components/product/product-card';
import { AddToCart } from './add-to-cart';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  const related = getRelatedProducts(product, 4);
  const discount = discountPercent(product.mrp, product.price);

  return (
    <main className="w-full bg-[#faf9f6] text-[#121212] font-sans antialiased min-h-screen py-6 sm:py-8 lg:py-12">
      <div className="w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* BREADCRUMB */}
        <nav className="mb-6 lg:mb-8 flex items-center gap-2 text-xs tracking-wider text-neutral-500 uppercase font-medium">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-black"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to shop
          </Link>
          <ChevronRight className="h-3 w-3 opacity-40" />
          <span className="text-neutral-900">{product.categoryLabel}</span>
        </nav>

        {/* PRODUCT SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 xl:gap-16 items-start">

          {/* EDITORIAL GALLERY */}
          <div className="lg:col-span-7 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {product.images.map((image, index) => (
                <div
                  key={image}
                  className="group relative aspect-[4/5] w-full overflow-hidden bg-[#f3f1ed] border border-black/5"
                >
                  <span className="absolute left-3 top-3 z-10 flex h-6 px-2 items-center justify-center bg-white/90 text-[10px] font-mono tracking-widest text-neutral-800 backdrop-blur-md shadow-sm">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <img
                    src={image}
                    alt={`${product.name} detail ${index + 1}`}
                    className="
                      h-full
                      w-full
                      object-cover
                      object-center
                      transition-transform
                      duration-700
                      ease-out
                      group-hover:scale-[1.03]
                    "
                  />
                </div>
              ))}
            </div>
          </div>

          {/* STICKY INFO PANEL */}
          <div className="lg:col-span-5 w-full lg:sticky lg:top-28 space-y-6">
            
            {/* Category & Title */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500">
                {product.categoryLabel}
              </span>

              <h1 className="mt-2.5 text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-neutral-900 leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="mt-3.5 flex items-center gap-2.5">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-current stroke-none" />
                  <span className="text-xs font-semibold text-neutral-900">
                    {product.rating}
                  </span>
                </div>
                <span className="h-3 w-px bg-neutral-300" />
                <span className="text-xs text-neutral-500 tracking-wide">
                  {product.reviewCount} verified reviews
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 border-y border-neutral-200/80 py-4">
              <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
                {formatINR(product.price)}
              </span>

              {product.mrp && (
                <span className="text-sm sm:text-base text-neutral-400 line-through">
                  {formatINR(product.mrp)}
                </span>
              )}

              {discount > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                  Save {discount}%
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm leading-relaxed text-neutral-600 max-w-[600px]">
              {product.description}
            </p>

            {/* Fabric & Wash Care Block */}
            <div className="grid grid-cols-2 border border-neutral-200/80 bg-white/50 divide-x divide-neutral-200/80">
              <div className="p-3.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1">
                  Fabric
                </p>
                <p className="text-xs font-medium text-neutral-800">
                  {product.fabricDetails}
                </p>
              </div>

              <div className="p-3.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1">
                  Care
                </p>
                <p className="text-xs font-medium text-neutral-800">
                  {product.washCare}
                </p>
              </div>
            </div>

            {/* Add To Cart Section (Client Component) */}
            <div className="pt-2">
              <AddToCart product={product} />
            </div>

            {/* Delivery Info */}
            <div className="pt-4 border-t border-neutral-200/80 space-y-2.5 text-xs text-neutral-600">
              <div className="flex items-center gap-2.5">
                <Truck className="h-4 w-4 text-neutral-700 shrink-0" />
                <span>Complimentary standard shipping on orders over ₹999</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-neutral-700 shrink-0" />
                <span>Hassle-free 7-day returns & exchanges</span>
              </div>
            </div>

            {/* Brand Essence */}
            <div className="bg-[#f2efe9] p-4 text-xs space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-neutral-800">
                ARDENBY ESSENCE
              </p>
              <p className="text-neutral-600 leading-normal text-[11px]">
                Crafted with high-density textiles and minimalist tailoring engineered for everyday versatility.
              </p>
            </div>

          </div>
        </section>

        {/* RELATED PRODUCTS */}
        <section className="mt-20 border-t border-neutral-200/80 pt-12 sm:pt-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-1">
                Curated Selection
              </p>
              <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-neutral-900">
                You May Also Like
              </h2>
            </div>

            <Link
              href="/shop"
              className="text-xs font-semibold uppercase tracking-widest text-neutral-900 hover:underline underline-offset-4 hidden sm:block"
            >
              View Collection
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {related.map((item, index) => (
              <ProductCard
                key={item.id}
                product={item}
                index={index}
              />
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}