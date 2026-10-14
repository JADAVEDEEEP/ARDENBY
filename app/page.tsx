"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { ArrowRight, ArrowUpRight, Play, Quote, Star } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { products as staticProducts, categories, heroSlides } from "@/lib/data";
import { apiUrl } from "@/lib/api-url";
import type { Product } from "@/types";

const ease = [0.16, 1, 0.3, 1] as const;

/* ---------------------------------------------------------------------------
 *  KOVENIK — deep forest green / ivory / subtle gold
 * ------------------------------------------------------------------------- */
const SERIF =
  "'Cormorant Garamond', 'Bodoni MT', Didot, 'Times New Roman', serif";
const SANS = "Inter, 'Helvetica Neue', Arial, system-ui, sans-serif";

const transparentHeroImages = [
  "/images/hero-linen.png",
  "/images/hero-dtf-back-print.png",
  "/images/hero-olive-graphic.png",
];
const philosophy = [
  {
    num: "01",
    title: "240 GSM Engineered Fabric",
    desc: "Custom heavyweight combed cotton. Bio-washed, pre-shrunk, and crafted to retain architecture after every wash.",
  },
  {
    num: "02",
    title: "Limited Edition Drop Artwork",
    desc: "Original high-density DTF and puff graphic designs. Exclusive runs with zero restocks.",
  },
  {
    num: "03",
    title: "Drop-Shoulder Silhouette",
    desc: "Precision tailored streetwear fits engineered with dropped armholes for the ideal relaxed drape.",
  },
];

const reviews = [
  {
    name: "Aarav Sharma",
    text: "The Phantom Beige Oversized Tee is unreal. The weight, stitch quality, and drop-shoulder structure exceed high-end luxury brands.",
    rating: 5,
    tag: "Verified Buyer",
  },
  {
    name: "Karan Patel",
    text: "Bought the Eclipse Hoodie and the fleece density is top tier. Doesn't lose shape after washing at all.",
    rating: 5,
    tag: "Verified Buyer",
  },
  {
    name: "Vikram Reddy",
    text: "The Savage Black Back Print gets endless compliments. Print clarity is crisp and fabric feels insanely soft.",
    rating: 5,
    tag: "Verified Buyer",
  },
];

const collectionCopy = [
  "Heavyweight silhouettes engineered for everyday rotation.",
  "Premium graphics with a clean streetwear finish.",
  "Elevated essentials built for daily wear.",
];

/* ---------------------------------------------------------------------------
 *  Campaign visuals (external Unsplash URLs). Used ONLY for category cards and
 *  editorial sections. Real product / best-seller images still come from the API.
 * ------------------------------------------------------------------------- */
const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const editorialImages = {
  story: unsplash("1529139574466-a303027c1d8b", 1400),
};
// If an external image ever fails to load, fall back once to the previous image.
const withFallback =
  (fallback?: string) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!fallback || img.dataset.fb) return;
    img.dataset.fb = "1";
    img.src = fallback;
  };

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
  tags?: string | string[] | null;
  best_seller?: boolean;
  new_arrival?: boolean;
  trending?: boolean;
  limited_edition?: boolean;
  inventory?: number | string | null;
  created_at?: string | null;
  images?: {
    id?: string;
    image_url?: string;
    sort_order?: number;
    is_primary?: boolean;
  }[];
  variants?: {
    id?: string;
    product_id?: string;
    size?: string;
    color?: string;
    inventory?: number | string;
    sku?: string | null;
  }[];
};

type HomeProduct = {
  [key: string]: any;
  id: string;
  slug: string;
  name: string;
  category?: string;
  categoryLabel?: string;
  fit?: string;
  fabric?: string;
  coverage?: string;
  colors?: string[];
  sizes?: string[];
  images?: string[];
  price?: number;
  mrp?: number;
  bestPrice?: number;
  rating?: number;
  reviewCount?: number;
  description?: string;
  fabricDetails?: string;
  washCare?: string;
  tags?: string[];
  bestSeller?: boolean;
  newArrival?: boolean;
  trending?: boolean;
  limitedEdition?: boolean;
  inventory?: number;
  variants?: any[];
  fabricImage: string;
  reviews: any[];
};

function normalizeApiProduct(product: ApiProduct): HomeProduct {
  const variants = Array.isArray(product.variants)
    ? product.variants
        .filter((variant) => variant?.size && variant?.color)
        .map((variant) => ({
          id: variant.id,
          product_id: variant.product_id || product.id,
          size: String(variant.size),
          color: String(variant.color),
          inventory: Number(variant.inventory || 0),
          sku: variant.sku || "",
        }))
    : [];

  const images = Array.isArray(product.images)
    ? [...product.images]
        .sort(
          (a, b) =>
            Number(a.sort_order || 0) - Number(b.sort_order || 0)
        )
        .map((image) => image?.image_url)
        .filter((url): url is string => Boolean(url))
    : [];

  const colors = Array.from(
    new Set(
      variants
        .map((variant) => variant.color)
        .filter(Boolean)
    )
  );

  const sizes = Array.from(
    new Set(
      variants
        .map((variant) => variant.size)
        .filter(Boolean)
    )
  );

  const tags = Array.isArray(product.tags)
    ? product.tags.map(String)
    : product.tags
      ? String(product.tags)
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category_slug || "",
    categoryLabel: product.category_label || "",
    fit: product.fit || "",
    fabric: product.fabric || "",
    coverage: product.coverage || "",
    colors,
    sizes,
    images,
    price: Number(product.price || 0),
    mrp:
      product.mrp == null
        ? undefined
        : Number(product.mrp),
    bestPrice: Number(product.best_price || 0),
    rating: Number(product.rating || 0),
    reviewCount: Number(product.review_count || 0),
    description: product.description || "",
    fabricDetails: product.fabric_details || "",
    washCare: product.wash_care || "",
    tags,
    bestSeller: Boolean(product.best_seller),
    newArrival: Boolean(product.new_arrival),
    trending: Boolean(product.trending),
    limitedEdition: Boolean(product.limited_edition),
    inventory: Number(product.inventory || 0),
    variants,
    fabricImage: images[0] || "",
    reviews: [],
  };
}

function normalizeStaticProduct(product: any): HomeProduct {
  const variants = Array.isArray(product?.variants)
    ? product.variants
    : [];

  const images = Array.isArray(product?.images)
    ? product.images
        .map((image: any) =>
          typeof image === "string"
            ? image
            : image?.image_url
        )
        .filter(Boolean)
    : [];

  const sizes =
    Array.isArray(product?.sizes) && product.sizes.length
      ? product.sizes
      : Array.from(
          new Set(
            variants
              .map((variant: any) => variant?.size)
              .filter(Boolean)
          )
        );

  const colors =
    Array.isArray(product?.colors) && product.colors.length
      ? product.colors
      : Array.from(
          new Set(
            variants
              .map((variant: any) => variant?.color)
              .filter(Boolean)
          )
        );

  const tags = Array.isArray(product?.tags)
    ? product.tags.map(String)
    : product?.tags
      ? String(product.tags)
          .split(",")
          .map((tag: string) => tag.trim())
          .filter(Boolean)
      : [];

  return {
    ...product,
    id: String(product?.id ?? ""),
    slug: String(product?.slug ?? ""),
    name: String(product?.name ?? ""),
    category:
      product?.category ||
      product?.category_slug ||
      "",
    categoryLabel:
      product?.categoryLabel ||
      product?.category_label ||
      "",
    fit: product?.fit || "",
    fabric: product?.fabric || "",
    coverage: product?.coverage || "",
    price: Number(product?.price || 0),
    mrp:
      product?.mrp == null
        ? undefined
        : Number(product.mrp),
    bestPrice: Number(
      product?.bestPrice ??
        product?.best_price ??
        0
    ),
    rating: Number(product?.rating || 0),
    reviewCount: Number(
      product?.reviewCount ??
        product?.review_count ??
        0
    ),
    description: product?.description || "",
    fabricDetails:
      product?.fabricDetails ||
      product?.fabric_details ||
      "",
    washCare:
      product?.washCare ||
      product?.wash_care ||
      "",
    tags,
    bestSeller: Boolean(
      product?.bestSeller ??
        product?.best_seller
    ),
    newArrival: Boolean(
      product?.newArrival ??
        product?.new_arrival
    ),
    trending: Boolean(product?.trending),
    limitedEdition: Boolean(
      product?.limitedEdition ??
        product?.limited_edition
    ),
    inventory: Number(product?.inventory || 0),
    images,
    variants,
    sizes,
    colors,
    fabricImage: product?.fabricImage || images[0] || "",
    reviews: Array.isArray(product?.reviews) ? product.reviews : [],
  };
}

/* Fade-up wrapper — used once per section, nothing else animates on scroll. */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.7, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const [slide, setSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  // Existing dummy/static products stay available.
  const staticHomeProducts = useMemo(
    () => staticProducts.map(normalizeStaticProduct),
    []
  );

  const [products, setProducts] = useState<HomeProduct[]>(
    () => staticProducts.map(normalizeStaticProduct)
  );
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setProductsLoading(true);
      setProductsError("");

      try {
        const response = await fetch(
          apiUrl("/api/products?page=1&limit=1000"),
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(
            `Products API failed with status ${response.status}`
          );
        }

        const data = await response.json();

        const apiProducts = Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];

        const normalizedApiProducts = apiProducts
          .map((product: ApiProduct) => normalizeApiProduct(product))
          .filter((product: HomeProduct) =>
            Boolean(product.id && product.slug && product.name)
          );

        if (!cancelled) {
          // API products + existing dummy/static products.
          // Static data is intentionally NOT removed.
          setProducts([...normalizedApiProducts, ...staticHomeProducts]);
        }
      } catch (error) {
        console.error("Home products API error:", error);

        if (!cancelled) {
          setProductsError("Live products are temporarily unavailable.");
          // Keep existing dummy products if API fails.
          setProducts(staticHomeProducts);
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [staticHomeProducts]);

  const bestSellers = useMemo(
    () => products.filter((p) => p.bestSeller),
    [products]
  );

  const featured = useMemo(() => {
    const picks = bestSellers.slice(0, 3);
    if (picks.length >= 3) return picks;
    const ids = new Set(picks.map((p) => p.id));
    const extra = products.filter(
      (p) => !ids.has(p.id) && (p.trending || p.newArrival)
    );
    return [...picks, ...extra].slice(0, 3);
  }, [bestSellers, products]);

  // Filter tabs: All / New In / Best Seller + the real catalogue categories.
  const filterTabs = useMemo(
    () => [
      { id: "all", label: "All" },
      { id: "new-in", label: "New In" },
      { id: "best-seller", label: "Best Seller" },
      ...categories.slice(0, 4).map((c) => ({ id: c.slug, label: c.name })),
    ],
    []
  );

  const gridProducts = useMemo(() => {
    const list =
      activeFilter === "all"
        ? products
        : activeFilter === "new-in"
          ? products.filter((p) => p.newArrival)
          : activeFilter === "best-seller"
            ? products.filter((p) => p.bestSeller)
            : products.filter(
                (p) =>
                  p.category === activeFilter ||
                  p.tags?.includes(activeFilter)
              );
    return list.slice(0, 6);
  }, [products, activeFilter]);

  useEffect(() => {
    if (isPaused || heroSlides.length <= 1) return;

    const timer = window.setInterval(() => {
      setSlide((current) => (current + 1) % heroSlides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  const activeHero = heroSlides[slide];

  /* ---------- display helpers (read-only, use existing data) ---------- */
  const firstImage = (p?: HomeProduct) => p?.images?.[0];

  const legacyCategoryImage = (slug: string, index: number) =>
    firstImage(staticHomeProducts.find((p) => p.category === slug)) ||
    firstImage(products.find((p) => p.category === slug)) ||
    firstImage(products[index]) ||
    firstImage(bestSellers[index]);

  const categoryImage = (slug: string) => `/images/categories/${slug}.jpg`;

  const legacyStoryImage =
    firstImage(bestSellers[1]) ||
    firstImage(bestSellers[0]) ||
    firstImage(products.find((p) => p.images?.[0]));

  // Small rounded image that sits inline inside the editorial statement.
  const pill = (i: number) => {
    const cat = categories[i % 4];
    return (
      <span className="mx-[0.1em] inline-block h-[0.78em] w-[1.7em] translate-y-[0.04em] overflow-hidden rounded-full border border-[#F4F0E6]/25 align-middle">
        <img
          src={`/images/categories/${cat.slug}.jpg`}
          alt=""
          aria-hidden="true"
          loading="lazy"
          onError={withFallback(legacyCategoryImage(cat.slug, i))}
          className="h-full w-full object-cover"
        />
      </span>
    );
  };

  // Restyles the shared compact ProductCard in place: square corners, slightly smaller,
  // larger name/price hierarchy (selling price > MRP > best price); size/colour pickers, stock notes and cart button hidden.
  const cardShell =
    "mx-auto h-auto w-[94%] min-w-0 [&>div]:!rounded-none [&_a>div]:!rounded-none [&_img]:!rounded-none [&_h3]:!text-[15px] [&_h3]:!leading-snug sm:[&_h3]:!text-[16px] [&_a+div>div>span:first-child]:!text-[19px] [&_a+div>div>span:nth-child(2)]:!text-[14px] [&_p]:!text-[14px] [&_[role=group]]:!hidden [&_p:has(>span[aria-hidden])]:!hidden [&_button:not([aria-pressed])]:!hidden [&_a[aria-label='View_details']]:!hidden";

  const pillButton =
    "group inline-flex items-center gap-3 rounded-full bg-[#F4F0E6] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#07180D] transition-colors duration-300 hover:bg-[#B89A5A]";

  return (
    <MotionConfig reducedMotion="user">
      <main
        className="w-full overflow-x-hidden bg-[#07180D] text-[#F4F0E6] selection:bg-[#B89A5A] selection:text-[#07180D]"
        style={{ fontFamily: SANS }}
      >
        <style jsx global>{`
          .scrollbar-none { scrollbar-width: none; -ms-overflow-style: none; }
          .scrollbar-none::-webkit-scrollbar { display: none; }

          /* Hero wordmark: scales with the viewport, sits behind the model */
          .kv-wordmark { font-size: clamp(60px, 22vw, 150px); }
          @media (min-width: 1024px) { .kv-wordmark { font-size: clamp(60px, 17vw, 300px); } }
        `}</style>

        {/* =====================================================================
            1. HERO — outlined wordmark, model, CTA, collection cards
        ===================================================================== */}
        <section
          className="relative isolate flex flex-col overflow-hidden lg:min-h-[clamp(560px,calc(100svh-72px),760px)]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#1f4d2d_0%,#1a4228_30%,#0D2415_68%,#07180D_100%)]" />

          {/* Outlined wordmark */}
          <div
            aria-hidden="true"
            className="kv-wordmark pointer-events-none absolute inset-x-0 top-[1%] z-0 select-none whitespace-nowrap text-center uppercase leading-[0.95]"
            style={{
              fontFamily: SERIF,
              color: "transparent",
              WebkitTextStroke: "1.2px rgba(244,240,230,0.3)",
              letterSpacing: "-0.01em",
            }}
          >
            Kovenik
          </div>

          {/* Model */}
          <div className="pointer-events-none relative z-10 flex h-[380px] items-end justify-center sm:h-[460px] lg:absolute lg:inset-x-0 lg:bottom-0 lg:top-[8%] lg:h-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={`hero-model-${slide}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.7, ease }}
                className="flex h-full items-end justify-center"
              >
                <img
                  src={transparentHeroImages[slide % transparentHeroImages.length]}
                  alt={activeHero.headline}
                  className="h-full w-auto max-w-full object-contain object-bottom"
                />
              </motion.div>
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[40%] bg-gradient-to-t from-[#07180D] via-[#07180D]/70 to-transparent lg:hidden" />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden h-[38%] bg-gradient-to-t from-[#07180D] via-[#07180D]/70 to-transparent lg:block" />

          {/* Copy + collection cards */}
          <div className="relative z-30 -mt-24 w-full px-4 pb-8 sm:-mt-28 sm:px-8 lg:mt-auto lg:px-12 lg:pb-10">
            <div className="mx-auto w-full max-w-[1440px]">
              <div className="grid gap-5 lg:grid-cols-[1fr_minmax(240px,30vw)_1fr] lg:items-end">
                {/* Left: stat */}
                <div>
                  <p className="text-[clamp(34px,4vw,56px)] font-medium leading-none text-[#F4F0E6]" style={{ fontFamily: SERIF }}>
                    {products.length}+
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[#F4F0E6]">
                    <span className="h-2 w-2 rounded-full bg-[#B89A5A]" />
                    New collection
                  </p>
                  <h1 className="mt-3 text-[12px] font-medium uppercase tracking-[0.2em] text-[#B89A5A]">
                    {activeHero.headline}
                  </h1>
                </div>

                <div className="hidden lg:block" />

                {/* Right: description + CTA */}
                <div className="lg:justify-self-end lg:text-right">
                  <p className="max-w-[360px] text-[14px] leading-[1.6] text-[#C8C6B9] lg:ml-auto">
                    KOVENIK is a minimalist luxury label. Heavyweight fabrics,
                    relaxed cuts and a calm, considered finish.
                  </p>
                  <div className="mt-4 flex items-center gap-3 lg:justify-end">
                    <Link href="/shop" className={pillButton}>
                      Shop now
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                    <div className="flex items-center">
                      {heroSlides.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSlide(index)}
                          aria-label={`Go to slide ${index + 1}`}
                          className="p-2"
                        >
                          <span
                            className={`block h-[2px] transition-all duration-500 ${
                              index === slide ? "w-8 bg-[#B89A5A]" : "w-4 bg-[#F4F0E6]/30"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Collection cards */}
              <div className="scrollbar-none -mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0">
                {categories.slice(0, 3).map((cat, index) => {
                  const image = categoryImage(cat.slug);
                  return (
                    <Link
                      key={cat.slug}
                      href={`/shop?category=${cat.slug}`}
                      className="group relative flex w-[78vw] max-w-[340px] shrink-0 snap-start items-center gap-3 rounded-2xl bg-[#F4F0E6] p-2.5 text-[#07180D] transition-colors duration-300 hover:bg-white sm:w-auto sm:max-w-none"
                    >
                      <div className="h-[92px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-[#17351F] sm:h-[104px] sm:w-[100px]">
                        {image && (
                          <img
                            src={image}
                            alt={cat.name}
                            loading="lazy"
                            onError={withFallback(legacyCategoryImage(cat.slug, index))}
                            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.05]"
                          />
                        )}
                      </div>
                      <div className="min-w-0 pr-8">
                        <h3 className="text-[22px] font-medium leading-none sm:text-[26px]" style={{ fontFamily: SERIF }}>
                          {cat.name}
                        </h3>
                        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8a6f33]">
                          Collection
                        </p>
                        <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.45] text-[#07180D]/70">
                          {collectionCopy[index]}
                        </p>
                      </div>
                      <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#07180D] text-[#F4F0E6] transition-colors duration-300 group-hover:bg-[#B89A5A] group-hover:text-[#07180D]">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            2. EDITORIAL STATEMENT
        ===================================================================== */}
        <section className="bg-[#07180D] px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
          <Reveal className="mx-auto max-w-[1100px]">
            <h2
              className="text-center text-[clamp(24px,4.4vw,56px)] font-normal uppercase leading-[1.28] tracking-[0.01em] text-[#F4F0E6]"
              style={{ fontFamily: SERIF }}
            >
              Elevate your fashion game {pill(0)} with our expertly {pill(1)} curated collection {pill(2)} of high-end pieces. {pill(3)} Discover the perfect outfit for any occasion, from casual {pill(0)} to formal.
            </h2>
          </Reveal>
        </section>

        {/* =====================================================================
            3. BRAND PROCESS
        ===================================================================== */}
        <section className="bg-[#07180D] px-4 pb-16 sm:px-8 sm:pb-20 lg:px-12 lg:pb-28">
          <div className="mx-auto w-full max-w-[1100px]">
            <Reveal>
              <span className="inline-block rounded-full border border-[#F4F0E6]/25 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#C8C6B9]">
                Our process
              </span>
              <h2
                className="mt-5 max-w-[720px] text-[clamp(32px,4.6vw,60px)] font-normal uppercase leading-[1.05] text-[#F4F0E6]"
                style={{ fontFamily: SERIF }}
              >
                Crafted with care, from start to finish.
              </h2>
            </Reveal>

            <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-14">
              <Reveal>
                <Link
                  href="/shop"
                  aria-label="Shop the KOVENIK collection"
                  className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#17351F] lg:aspect-[5/4]"
                >
                  <img
                    src={editorialImages.story}
                    alt="KOVENIK collection"
                    loading="lazy"
                    onError={withFallback(legacyStoryImage)}
                    className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[#07180D]/20" />
                  <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#F4F0E6]/90 text-[#07180D] transition-colors group-hover:bg-[#B89A5A]">
                    <Play className="h-5 w-5 translate-x-0.5 fill-current" />
                  </span>
                </Link>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="max-w-[460px] text-[14px] leading-[1.7] text-[#C8C6B9]">
                  Take a peek behind the curtain and discover how we create each piece with meticulous attention to detail, sustainable practices, and a deep respect for craftsmanship.
                </p>

                <ol className="mt-8 divide-y divide-[#F4F0E6]/10 border-y border-[#F4F0E6]/10">
                  {philosophy.map((item, i) => (
                    <li key={item.num} className="flex items-start gap-4 py-5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#B89A5A]/70 text-[11px] font-medium text-[#B89A5A]">
                        {i + 1}
                      </span>
                      <div>
                        <h3
                          className="text-[19px] font-normal uppercase leading-[1.1] text-[#F4F0E6]"
                          style={{ fontFamily: SERIF }}
                        >
                          {item.title}
                        </h3>
                        <p className="mt-1.5 max-w-[420px] text-[13px] leading-[1.6] text-[#C8C6B9]">
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <Link href="/shop" className={`${pillButton} mt-8`}>
                  Discover our values
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Reveal>
            </div>
          </div>
        </section>

        {/* =====================================================================
            4. CATEGORY GRID WITH FILTERS
        ===================================================================== */}
        <section className="bg-[#07180D] px-4 pb-16 sm:px-8 sm:pb-20 lg:px-12 lg:pb-24">
          <div className="mx-auto w-full max-w-[1100px]">
            <Reveal>
              <h2
                className="text-[clamp(30px,4vw,52px)] font-normal uppercase leading-[1] text-[#F4F0E6]"
                style={{ fontFamily: SERIF }}
              >
                Explore our category
              </h2>

              <div className="scrollbar-none -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                {filterTabs.map((tab) => {
                  const isActive = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFilter(tab.id)}
                      aria-pressed={isActive}
                      className={`shrink-0 rounded-full border px-5 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-300 ${
                        isActive
                          ? "border-[#B89A5A] bg-[#B89A5A] text-[#07180D]"
                          : "border-[#F4F0E6]/25 text-[#F4F0E6] hover:border-[#B89A5A] hover:text-[#B89A5A]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {productsLoading && (
                <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#B89A5A]">
                  Loading live collection...
                </p>
              )}
              {!productsLoading && productsError && (
                <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#C8C6B9]">
                  Showing the latest available collection.
                </p>
              )}
            </Reveal>

            {gridProducts.length > 0 ? (
              <div className="mt-8 grid w-full grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-5 sm:gap-y-7 lg:grid-cols-3">
                {gridProducts.map((product, index) => (
                  <div key={product.id} className={cardShell}>
                    <ProductCard compact product={product as Product} index={index} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-[#F4F0E6]/10 bg-[#0D2415] px-5 text-center">
                <h3 className="text-[26px] text-[#F4F0E6]" style={{ fontFamily: SERIF }}>
                  No pieces found
                </h3>
                <p className="mt-2 max-w-xs text-[13px] leading-6 text-[#C8C6B9]">
                  Nothing in this category yet.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className="mt-5 rounded-full bg-[#F4F0E6] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#07180D] transition-colors hover:bg-[#B89A5A]"
                >
                  View all pieces
                </button>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================================
            5. FEATURED PRODUCTS
        ===================================================================== */}
        <section className="bg-[#0D2415] px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="mx-auto w-full max-w-[1100px]">
            <Reveal className="flex items-end justify-between gap-4">
              <h2
                className="text-[clamp(30px,4vw,52px)] font-normal uppercase leading-[1] text-[#F4F0E6]"
                style={{ fontFamily: SERIF }}
              >
                Our featured products
              </h2>
              <Link
                href="/shop"
                className="group hidden shrink-0 items-center gap-2 text-[12px] font-medium uppercase tracking-[0.16em] text-[#F4F0E6] transition-colors hover:text-[#B89A5A] sm:flex"
              >
                View all
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </Reveal>

            <div className="scrollbar-none -mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0">
              {featured.map((product, index) => (
                <div
                  key={product.id || index}
                  className={`${cardShell} !w-[64vw] max-w-[280px] shrink-0 snap-start sm:!w-[94%] sm:max-w-none`}
                >
                  <ProductCard compact product={product as Product} index={index} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            6. TESTIMONIALS
        ===================================================================== */}
        <section className="bg-[#07180D] px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="mx-auto w-full max-w-[1100px]">
            <Reveal className="mb-8 text-center sm:mb-10">
              <h2
                className="text-[clamp(30px,4vw,52px)] font-normal uppercase leading-[1] text-[#F4F0E6]"
                style={{ fontFamily: SERIF }}
              >
                What our customers say
              </h2>
              <p className="mt-3 text-[13px] text-[#C8C6B9]">Real stories from real people</p>
            </Reveal>

            <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0">
              {reviews.map((review) => (
                <article
                  key={review.name}
                  className="flex w-[84vw] max-w-[380px] shrink-0 snap-start flex-col rounded-2xl border border-[#F4F0E6]/10 bg-[#0D2415] p-5 sm:w-auto sm:max-w-none"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <Quote className="h-5 w-5 fill-[#B89A5A] text-[#B89A5A]" />
                    <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-[#B89A5A] text-[#B89A5A]" />
                      ))}
                    </div>
                  </div>
                  <p className="flex-1 text-[14px] leading-[1.65] text-[#F4F0E6]">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className="mt-5 flex items-center gap-3 border-t border-[#F4F0E6]/10 pt-4">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17351F] text-[16px] text-[#F4F0E6]"
                      style={{ fontFamily: SERIF }}
                    >
                      {review.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-[#F4F0E6]">{review.name}</p>
                      <p className="text-[11px] text-[#B89A5A]">{review.tag}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Footer: rendered site-wide by components/layout/footer.tsx via SiteShell */}
      </main>
    </MotionConfig>
  );
}
