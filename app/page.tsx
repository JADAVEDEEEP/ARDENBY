"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Play,
  Quote,
  Star,
} from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { products as staticProducts, categories, heroSlides } from "@/lib/data";
import { apiUrl } from "@/lib/api-url";
import type { Product } from "@/types";

const ease = [0.16, 1, 0.3, 1] as const;

/* ---------------------------------------------------------------------------
 *  KOVENIK — black / cream / metallic gold
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

/* Section title row: gold eyebrow, serif title, optional "View all" link. */
function SectionHead({
  eyebrow,
  title,
  href,
}: {
  eyebrow: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#C9A24B]">
          <span className="h-px w-6 bg-[#C9A24B]" />
          {eyebrow}
        </p>
        <h2
          className="text-[clamp(28px,3.8vw,48px)] font-semibold uppercase leading-[1] text-[#F3ECDD]"
          style={{ fontFamily: SERIF }}
        >
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group hidden shrink-0 items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F3ECDD] transition-colors hover:text-[#C9A24B] sm:flex"
        >
          View all
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
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

  /* ---------- hero controls ---------- */
  const goTo = (index: number) =>
    setSlide((index + heroSlides.length) % heroSlides.length);

  // Last two words of the headline get the metallic-gold treatment.
  const heroWords = activeHero.headline.split(" ");
  const heroSplit = Math.max(1, heroWords.length - 2);

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

  // "All Products" leads the category rail, the rest keep their catalogue order.
  const railCategories = [...categories].sort(
    (a, b) =>
      Number(b.slug === "all-products") - Number(a.slug === "all-products")
  );

  // Small rounded image that sits inline inside the editorial statement.
  const pill = (i: number) => {
    const cat = categories[i % 4];
    return (
      <span className="mx-[0.1em] inline-block h-[0.78em] w-[1.7em] translate-y-[0.04em] overflow-hidden rounded-full border border-[#0B0B0B]/25 align-middle">
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

  // Restyles the shared compact ProductCard in place: square corners, gold badge,
  // charcoal image well, larger name/price hierarchy (selling price > MRP > best price);
  // size/colour pickers, stock notes and cart button hidden.
  const cardShell =
    "mx-auto h-auto w-[94%] min-w-0 [&>div]:!rounded-none [&_a>div]:!rounded-none [&_a>div]:!bg-[#161616] [&_img]:!rounded-none [&_h3]:!text-[15px] [&_h3]:!leading-snug [&_h3]:!text-[#F3ECDD] [&_.group:hover_h3]:!text-[#E6CF8B] sm:[&_h3]:!text-[16px] [&_a+div>div>span:first-child]:!text-[19px] [&_a+div>div>span:nth-child(2)]:!text-[14px] [&_p]:!text-[14px] [&_span.pointer-events-none]:!rounded-none [&_span.pointer-events-none]:!border-0 [&_span.pointer-events-none]:!bg-[#C9A24B] [&_span.pointer-events-none]:!text-[#0B0B0B] [&_span.pointer-events-none]:!backdrop-blur-none [&_[role=group]]:!hidden [&_p:has(>span[aria-hidden])]:!hidden [&_button:not([aria-pressed])]:!hidden [&_a[aria-label='View_details']]:!hidden";

  const goldFill = `bg-[linear-gradient(135deg,#A67C28_0%,#F0DC9A_40%,#C9A24B_65%,#F7E9B5_100%)]`;

  const pillButton = `group inline-flex items-center gap-3 rounded-full ${goldFill} px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-[#0B0B0B] shadow-[0_10px_28px_-10px_rgba(201,162,75,0.6)] transition duration-300 hover:brightness-110`;

  const outlineButton =
    "group inline-flex items-center gap-3 rounded-full border border-[#F3ECDD]/35 px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#F3ECDD] transition-colors duration-300 hover:border-[#C9A24B] hover:text-[#C9A24B]";

  const arrowButton =
    "flex h-10 w-10 items-center justify-center rounded-full border border-[#F3ECDD]/25 bg-[#0B0B0B]/60 text-[#F3ECDD] backdrop-blur transition-colors duration-300 hover:border-[#C9A24B] hover:text-[#C9A24B] lg:h-12 lg:w-12";

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="w-full overflow-x-hidden bg-[#0B0B0B] text-[#F3ECDD] selection:bg-[#C9A24B] selection:text-[#0B0B0B]"
        style={{ fontFamily: SANS }}
      >
        <style jsx global>{`
          .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .no-scrollbar::-webkit-scrollbar { display: none; }

          /* Hero wordmark: scales with the viewport, sits behind the model */
          .kv-wordmark { font-size: clamp(70px, 26vw, 170px); }
          @media (min-width: 1024px) { .kv-wordmark { font-size: clamp(120px, 17vw, 300px); } }
        `}</style>

        {/* =====================================================================
            1. HERO CAROUSEL — editorial headline, model, CTA
        ===================================================================== */}
        <section
          className="relative isolate overflow-hidden bg-[#0B0B0B]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Warm gold glow + vignette */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(70%_80%_at_72%_38%,rgba(201,162,75,0.24),transparent_70%),linear-gradient(180deg,#141414_0%,#0B0B0B_100%)]" />

          {/* Outlined wordmark */}
          <div
            aria-hidden="true"
            className="kv-wordmark pointer-events-none absolute inset-x-0 top-[2%] z-0 select-none whitespace-nowrap text-center font-bold uppercase leading-[0.95]"
            style={{
              fontFamily: SERIF,
              color: "transparent",
              WebkitTextStroke: "1.2px rgba(201,162,75,0.28)",
              letterSpacing: "-0.01em",
            }}
          >
            Kovenik
          </div>

          <div className="relative mx-auto flex min-h-[700px] w-full max-w-[1440px] flex-col justify-end px-4 pb-8 sm:min-h-[720px] sm:px-8 lg:grid lg:min-h-[680px] lg:grid-cols-[1.05fr_1fr] lg:items-center lg:px-12 lg:pb-0">
            {/* Model — behind the copy on mobile, right column on desktop */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-[52%] items-end justify-center [mask-image:linear-gradient(to_bottom,#000_62%,transparent)] sm:h-[56%] lg:relative lg:order-2 lg:h-[680px] lg:[mask-image:none]">
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
            </div>

            {/* Legibility fade behind mobile copy */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[50%] bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/90 to-transparent lg:hidden" />

            {/* Copy */}
            <div className="relative z-30 lg:order-1">
              <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[#C9A24B]">
                <span className="h-px w-8 bg-[#C9A24B]" />
                Wear your essence
              </p>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`hero-copy-${slide}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.5, ease }}
                >
                  <h1 className="mt-4 text-[clamp(40px,10.5vw,64px)] font-extrabold uppercase leading-[0.96] tracking-[-0.02em] text-[#F3ECDD] lg:text-[clamp(56px,6.4vw,104px)]">
                    {heroWords.slice(0, heroSplit).join(" ")}
                    <br />
                    <span
                      className={`bg-clip-text text-transparent ${goldFill}`}
                    >
                      {heroWords.slice(heroSplit).join(" ")}
                    </span>
                  </h1>

                  <p className="mt-4 max-w-[460px] text-[14px] leading-[1.6] text-[#F3ECDD] sm:text-[15px]">
                    {activeHero.sub}
                  </p>
                </motion.div>
              </AnimatePresence>

              <p className="mt-3 max-w-[460px] text-[13px] leading-[1.65] text-[#B9B3A5]">
                KOVENIK is a minimalist luxury label. Heavyweight fabrics,
                relaxed cuts and a calm, considered finish.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/shop" className={pillButton}>
                  Shop now
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link href={activeHero.href} className={outlineButton}>
                  {activeHero.cta}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>

              <div className="mt-7 flex items-end justify-between gap-6 border-t border-[#F3ECDD]/10 pt-5 lg:max-w-[520px]">
                <div>
                  <p
                    className="bg-clip-text text-[clamp(34px,4vw,52px)] font-semibold leading-none text-transparent"
                    style={{
                      fontFamily: SERIF,
                      backgroundImage:
                        "linear-gradient(135deg,#A67C28,#F0DC9A 45%,#C9A24B 70%,#F7E9B5)",
                    }}
                  >
                    {products.length}+
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#F3ECDD]">
                    <span className="h-2 w-2 rounded-full bg-[#C9A24B]" />
                    New collection
                  </p>
                </div>

                <div className="flex items-center">
                  {heroSlides.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                      aria-current={index === slide}
                      className="p-2"
                    >
                      <span
                        className={`block h-[3px] rounded-full transition-all duration-500 ${
                          index === slide
                            ? "w-9 bg-[#C9A24B]"
                            : "w-4 bg-[#F3ECDD]/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Slide arrows */}
            <button
              type="button"
              onClick={() => goTo(slide - 1)}
              aria-label="Previous slide"
              className={`${arrowButton} absolute left-2 top-[30%] z-30 hidden sm:flex lg:left-0 lg:top-1/2 lg:-translate-y-1/2`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(slide + 1)}
              aria-label="Next slide"
              className={`${arrowButton} absolute right-3 top-[30%] z-30 sm:right-2 lg:right-0 lg:top-1/2 lg:-translate-y-1/2`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        {/* =====================================================================
            2. CATEGORY RAIL — every catalogue category, circular tiles
        ===================================================================== */}
        <section className="border-y border-[#F3ECDD]/10 bg-[#0B0B0B]">
          <div className="no-scrollbar mx-auto flex w-full max-w-[1440px] gap-5 overflow-x-auto px-4 py-6 sm:gap-7 sm:px-8 lg:justify-between lg:gap-4 lg:px-12 lg:py-8">
            {railCategories.map((cat, index) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className="group flex w-[72px] shrink-0 flex-col items-center gap-3 sm:w-[88px] lg:w-[104px]"
              >
                <span className="relative block h-[68px] w-[68px] overflow-hidden rounded-full border border-[#F3ECDD]/20 bg-[#1C1C1C] p-[3px] transition-colors duration-300 group-hover:border-[#C9A24B] sm:h-[84px] sm:w-[84px] lg:h-[100px] lg:w-[100px]">
                  <img
                    src={categoryImage(cat.slug)}
                    alt={cat.name}
                    loading="lazy"
                    onError={withFallback(legacyCategoryImage(cat.slug, index))}
                    className="h-full w-full rounded-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.08]"
                  />
                </span>
                <span className="line-clamp-2 text-center text-[10px] font-medium uppercase leading-[1.3] tracking-[0.1em] text-[#F3ECDD] transition-colors group-hover:text-[#C9A24B] sm:text-[11px]">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* =====================================================================
            3. COLLECTION BANNERS — large editorial promo cards
        ===================================================================== */}
        <section className="bg-[#0B0B0B] px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div className="no-scrollbar -mx-4 flex max-w-[1440px] snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 sm:mx-auto sm:px-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible">
            {categories.slice(0, 3).map((cat, index) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className="group relative flex aspect-[4/3] w-[82vw] max-w-[420px] shrink-0 snap-start items-end overflow-hidden rounded-2xl bg-[#1C1C1C] md:aspect-[5/4] md:w-auto md:max-w-none lg:aspect-[16/11]"
              >
                <img
                  src={categoryImage(cat.slug)}
                  alt={cat.name}
                  loading="lazy"
                  onError={withFallback(legacyCategoryImage(cat.slug, index))}
                  className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/45 to-transparent" />
                <div className="pointer-events-none absolute inset-0 rounded-2xl border border-[#F3ECDD]/10 transition-colors duration-300 group-hover:border-[#C9A24B]/70" />

                <div className="relative z-10 w-full p-5 lg:p-7">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#C9A24B]">
                    Collection
                  </p>
                  <h3
                    className="mt-1.5 text-[26px] font-semibold uppercase leading-none text-[#F3ECDD] lg:text-[32px]"
                    style={{ fontFamily: SERIF }}
                  >
                    {cat.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 max-w-[300px] text-[13px] leading-[1.5] text-[#F3ECDD]/80">
                    {collectionCopy[index]}
                  </p>
                  <span
                    className={`mt-4 inline-flex items-center gap-2 rounded-full ${goldFill} px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0B0B0B]`}
                  >
                    Shop now
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =====================================================================
            4. EDITORIAL STATEMENT — cream band
        ===================================================================== */}
        <section className="bg-[#F3ECDD] px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
          <Reveal className="mx-auto max-w-[1100px]">
            <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8A6A22]">
              Kovenik
            </p>
            <h2
              className="text-center text-[clamp(24px,4.4vw,56px)] font-medium uppercase leading-[1.28] tracking-[0.01em] text-[#0B0B0B]"
              style={{ fontFamily: SERIF }}
            >
              Elevate your fashion game {pill(0)} with our expertly {pill(1)} curated collection {pill(2)} of high-end pieces. {pill(3)} Discover the perfect outfit for any occasion, from casual {pill(0)} to formal.
            </h2>
          </Reveal>
        </section>

        {/* =====================================================================
            5. NEW ARRIVALS — filterable product grid
        ===================================================================== */}
        <section className="bg-[#0B0B0B] px-4 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
          <div className="mx-auto w-full max-w-[1440px]">
            <Reveal>
              <SectionHead
                eyebrow="Fresh drops"
                title="Explore our category"
                href="/shop"
              />

              <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                {filterTabs.map((tab) => {
                  const isActive = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFilter(tab.id)}
                      aria-pressed={isActive}
                      className={`shrink-0 rounded-full border px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition duration-300 ${
                        isActive
                          ? `border-transparent ${goldFill} text-[#0B0B0B]`
                          : "border-[#F3ECDD]/25 text-[#F3ECDD] hover:border-[#C9A24B] hover:text-[#C9A24B]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {productsLoading && (
                <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#C9A24B]">
                  Loading live collection...
                </p>
              )}
              {!productsLoading && productsError && (
                <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#B9B3A5]">
                  Showing the latest available collection.
                </p>
              )}
            </Reveal>

            {gridProducts.length > 0 ? (
              <div className="mt-8 grid w-full grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8 md:grid-cols-3 xl:grid-cols-6">
                {gridProducts.map((product, index) => (
                  <div key={product.id} className={cardShell}>
                    <ProductCard compact product={product as Product} index={index} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-[#F3ECDD]/10 bg-[#141414] px-5 text-center">
                <h3 className="text-[26px] text-[#F3ECDD]" style={{ fontFamily: SERIF }}>
                  No pieces found
                </h3>
                <p className="mt-2 max-w-xs text-[13px] leading-6 text-[#B9B3A5]">
                  Nothing in this category yet.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`mt-5 rounded-full ${goldFill} px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0B0B0B] transition hover:brightness-110`}
                >
                  View all pieces
                </button>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================================
            6. BRAND PROCESS
        ===================================================================== */}
        <section className="bg-[#141414] px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="mx-auto w-full max-w-[1200px]">
            <Reveal>
              <span className="inline-block rounded-full border border-[#C9A24B]/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
                Our process
              </span>
              <h2
                className="mt-5 max-w-[720px] text-[clamp(32px,4.6vw,60px)] font-semibold uppercase leading-[1.05] text-[#F3ECDD]"
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
                  className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#1C1C1C] lg:aspect-[5/4]"
                >
                  <img
                    src={editorialImages.story}
                    alt="KOVENIK collection"
                    loading="lazy"
                    onError={withFallback(legacyStoryImage)}
                    className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[#0B0B0B]/30" />
                  <span
                    className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${goldFill} text-[#0B0B0B] shadow-[0_10px_30px_-8px_rgba(201,162,75,0.7)] transition group-hover:scale-105`}
                  >
                    <Play className="h-5 w-5 translate-x-0.5 fill-current" />
                  </span>
                </Link>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="max-w-[460px] text-[14px] leading-[1.7] text-[#B9B3A5]">
                  Take a peek behind the curtain and discover how we create each piece with meticulous attention to detail, sustainable practices, and a deep respect for craftsmanship.
                </p>

                <ol className="mt-8 divide-y divide-[#F3ECDD]/10 border-y border-[#F3ECDD]/10">
                  {philosophy.map((item, i) => (
                    <li key={item.num} className="flex items-start gap-4 py-5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C9A24B]/70 text-[11px] font-semibold text-[#C9A24B]">
                        {i + 1}
                      </span>
                      <div>
                        <h3
                          className="text-[20px] font-medium uppercase leading-[1.1] text-[#F3ECDD]"
                          style={{ fontFamily: SERIF }}
                        >
                          {item.title}
                        </h3>
                        <p className="mt-1.5 max-w-[420px] text-[13px] leading-[1.6] text-[#B9B3A5]">
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
            7. FEATURED PRODUCTS
        ===================================================================== */}
        <section className="bg-[#0B0B0B] px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="mx-auto w-full max-w-[1200px]">
            <Reveal>
              <SectionHead
                eyebrow="Handpicked for you"
                title="Our featured products"
                href="/shop"
              />
            </Reveal>

            <div className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0">
              {featured.map((product, index) => (
                <div
                  key={product.id || index}
                  className={`${cardShell} !w-[64vw] max-w-[280px] shrink-0 snap-start sm:!w-[94%] sm:max-w-none`}
                >
                  <ProductCard compact product={product as Product} index={index} />
                </div>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link href="/shop" className={outlineButton}>
                View all
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* =====================================================================
            8. TESTIMONIALS — cream band
        ===================================================================== */}
        <section className="bg-[#F3ECDD] px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="mx-auto w-full max-w-[1200px]">
            <Reveal className="mb-8 text-center sm:mb-10">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8A6A22]">
                Verified reviews
              </p>
              <h2
                className="text-[clamp(30px,4vw,52px)] font-semibold uppercase leading-[1] text-[#0B0B0B]"
                style={{ fontFamily: SERIF }}
              >
                What our customers say
              </h2>
              <p className="mt-3 text-[13px] text-[#0B0B0B]/60">Real stories from real people</p>
            </Reveal>

            <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0">
              {reviews.map((review) => (
                <article
                  key={review.name}
                  className="flex w-[84vw] max-w-[380px] shrink-0 snap-start flex-col rounded-2xl border border-[#0B0B0B]/10 bg-[#FBF7EE] p-6 shadow-[0_14px_40px_-24px_rgba(11,11,11,0.35)] sm:w-auto sm:max-w-none"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <Quote className="h-5 w-5 fill-[#C9A24B] text-[#C9A24B]" />
                    <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-[#C9A24B] text-[#C9A24B]" />
                      ))}
                    </div>
                  </div>
                  <p className="flex-1 text-[14px] leading-[1.65] text-[#0B0B0B]">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className="mt-5 flex items-center gap-3 border-t border-[#0B0B0B]/10 pt-4">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${goldFill} text-[17px] font-semibold text-[#0B0B0B]`}
                      style={{ fontFamily: SERIF }}
                    >
                      {review.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-[#0B0B0B]">{review.name}</p>
                      <p className="text-[11px] font-medium text-[#8A6A22]">{review.tag}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Footer: rendered site-wide by components/layout/footer.tsx via SiteShell */}
      </div>
    </MotionConfig>
  );
}
