"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Star,
  Truck,
  Flame,
  SlidersHorizontal,
} from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { products as staticProducts, categories, heroSlides } from "@/lib/data";
import { apiUrl } from "@/lib/api-url";
import type { Product } from "@/types";

const ease = [0.16, 1, 0.3, 1] as const;

const transparentHeroImages = [
  "/images/hero-linen.png",
  "/images/hero-dtf-back-print.png",
  "/images/hero-olive-graphic.png",
];
const newsletterContent = {
  eyebrow: "Exclusive Access",
  title: "Join the KOVENIK Fam",
  description:
    "Get early drop links, VIP discounts, and 10% off your inaugural order.",
  inputPlaceholder: "Enter your email",
  buttonLabel: "Subscribe",
  successMessage: "You are on the list. Welcome to the family.",
};
const trustItems = [
  {
    Icon: Truck,
    title: "Free Express Shipping",
    desc: "Delivered in 2-4 business days nationwide.",
  },
  {
    Icon: RefreshCw,
    title: "Instant 7-Day Returns",
    desc: "Hassle-free doorstep pickup & exchange.",
  },
  {
    Icon: ShieldCheck,
    title: "Encrypted Payments",
    desc: "100% safe checkout with UPI, Cards & COD.",
  },
  {
    Icon: Star,
    title: "240 GSM Luxury Heavyweight",
    desc: "Combed cotton engineered for long endurance.",
  },
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

export default function HomePage() {
  const [slide, setSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [selectedSubCat, setSelectedSubCat] = useState("all");

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
          .map((product: ApiProduct) =>
            normalizeApiProduct(product)
          )
          .filter(
            (product: HomeProduct) =>
              Boolean(
                product.id &&
                product.slug &&
                product.name
              )
          );

        if (!cancelled) {
          // IMPORTANT:
          // API products + existing dummy/static products.
          // Static data is intentionally NOT removed.
          setProducts([
            ...normalizedApiProducts,
            ...staticHomeProducts,
          ]);
        }
      } catch (error) {
        console.error(
          "Home products API error:",
          error
        );

        if (!cancelled) {
          setProductsError(
            "Live products are temporarily unavailable."
          );

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
    () => products.filter((p) => p.bestSeller).slice(0, 8),
    [products]
  );

  const filteredNewArrivals = useMemo(() => {
    if (selectedSubCat === "all") {
      return products.filter((p) => p.newArrival).slice(0, 4);
    }
    return products
      .filter((p) => p.newArrival && (p.category === selectedSubCat || p.tags?.includes(selectedSubCat)))
      .slice(0, 4);
  }, [products, selectedSubCat]);

  const trending = useMemo(
    () => products.filter((p) => p.trending).slice(0, 4),
    [products]
  );

  useEffect(() => {
    if (isPaused || heroSlides.length <= 1) return;

    const timer = window.setInterval(() => {
      setSlide((current) => (current + 1) % heroSlides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  const activeHero = heroSlides[slide];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <main className="w-full overflow-x-hidden bg-[#F6F5F0] text-[#111111] selection:bg-neutral-900 selection:text-white">
      <style jsx global>{`
        .ardenby-product-section img,
        .ardenby-product-section [class*="rounded-xl"],
        .ardenby-product-section [class*="rounded-2xl"],
        .ardenby-product-section [class*="rounded-lg"] {
          border-radius: 0 !important;
        }

        .ardenby-product-section button:has(.lucide-plus),
        .ardenby-product-section button:has([data-lucide="plus"]) {
          display: none !important;
        }
      `}</style>
      {/* ================= PREMIUM DARK LUXURY HERO SECTION ================= */}
<section
  className="relative left-1/2 z-0 w-screen max-w-none -translate-x-1/2 overflow-hidden bg-[#0A0A0A] min-h-[560px] h-[calc(100svh-76px)] sm:h-[calc(100svh-84px)] md:h-[calc(100svh-76px)] lg:h-[calc(100svh-128px)] lg:min-h-0"
  onMouseLeave={() => setIsPaused(false)}
>
  <div className="relative h-full w-full">

    {/* Luxury Marble & Gold Glow Background */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,rgba(10,10,10,0.95)_70%,#050505_100%)]" />
    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

    {/* =====================================================
        MOBILE HERO — Purpose-built Luxury Composition
    ====================================================== */}
    <div className="absolute inset-0 block md:hidden">

      {/* Premium Badge */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute left-4 top-4 z-[70]"
      >
        <div className="rounded-md border border-amber-500/30 bg-neutral-900/80 px-3 py-1.5 backdrop-blur-md">
          <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-amber-400">
            The New Standard • SS26
          </p>
          <p className="mt-1 text-[8px] text-neutral-400">
            West Delhi Precision
          </p>
        </div>
      </motion.div>

      {/* Mobile Luxury Headline */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`mobile-headline-${slide}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.45, ease }}
          className="absolute inset-x-0 top-[68px] z-10 flex w-full justify-center px-2 text-center"
        >
          <h1
            className="w-full font-serif font-black uppercase text-[56px] leading-[0.85] tracking-[-0.04em]"
            style={{
              fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
              background: "linear-gradient(180deg, #FFFFFF 30%, #D4AF37 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {activeHero.headline}
          </h1>
        </motion.div>
      </AnimatePresence>

      {/* Mobile Model / Product Showcase */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-[76%] w-full items-end justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`mobile-model-${slide}`}
            initial={{ opacity: 0, y: 18, scale: 1.02 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.55, ease }}
            className="relative flex h-full w-full items-end justify-center"
          >
            <div className="absolute bottom-5 left-1/2 h-[180px] w-[160px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[40px]" />
            <img
              src={transparentHeroImages[slide % transparentHeroImages.length]}
              alt={activeHero.headline}
              className="relative z-20 h-full w-auto max-w-none scale-[1.15] object-contain object-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile Explore / CTA Button */}
      <div className="absolute bottom-6 inset-x-0 z-[80] flex justify-center px-6">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-full rounded-full bg-gradient-to-r from-[#C5A059] via-[#E6CA65] to-[#AA823E] py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-950 shadow-[0_4px_20px_rgba(212,175,55,0.3)]"
        >
          Explore Drop
        </motion.button>
      </div>
    </div>

    {/* =====================================================
        DESKTOP / TABLET LUXURY HERO
    ===================================================== */}
    <div className="absolute inset-0 hidden md:block">

      {/* Premium Badge Desktop */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="absolute left-7 top-7 z-30 lg:left-9 lg:top-8"
      >
        <div className="rounded-md border border-amber-500/30 bg-neutral-900/70 px-4 py-2 backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
            The New Standard • SS26
          </p>
          <p className="mt-0.5 text-[10px] text-neutral-400">
            Crafted with Unrivaled West Delhi Precision
          </p>
        </div>
      </motion.div>

      {/* Desktop Luxury Headline with Gold Gradient */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`desktop-headline-${slide}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5, ease }}
          className="absolute left-0 right-0 top-[65px] z-10 flex justify-center px-4 lg:top-[50px]"
        >
          <h1
            className="w-full max-w-[1450px] text-center font-serif text-[72px] font-black uppercase leading-[0.8] tracking-[-0.04em] md:text-[88px] lg:text-[clamp(90px,9vw,140px)]"
            style={{
              fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
              background: "linear-gradient(180deg, #FFFFFF 20%, #E6CA65 70%, #997A30 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 4px 25px rgba(212,175,55,0.2))",
            }}
          >
            {activeHero.headline}
          </h1>
        </motion.div>
      </AnimatePresence>

      {/* Central 3D Podium & Floating Apparel Glow Effect */}
      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden flex items-center justify-center">
        <div className="absolute left-1/2 top-[56%] h-[380px] w-[750px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500/10 via-amber-300/5 to-transparent blur-[60px] rounded-full" />
      </div>

      {/* Desktop Model / Product Display */}
      <div className="pointer-events-none absolute inset-0 z-40 flex items-end justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`desktop-model-${slide}`}
            initial={{ opacity: 0, y: 20, scale: 1.01 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.6, ease }}
            className="relative z-40 flex h-full w-full items-end justify-center"
          >
            <div className="absolute bottom-[20px] left-1/2 h-[320px] w-[450px] -translate-x-1/2 rounded-full bg-black/80 blur-[50px]" />
            <img
              src={transparentHeroImages[slide % transparentHeroImages.length]}
              alt={activeHero.headline}
              className="relative z-40 h-[82%] w-auto max-w-[90%] object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Desktop Left Copy - West Delhi Vibe */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`left-${slide}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute left-8 top-[200px] z-30 hidden w-[280px] md:block lg:left-12 lg:top-[220px]"
        >
          <p className="text-[15px] font-bold uppercase tracking-[0.2em] text-amber-400">
            Unrivaled Finish
          </p>
          <div className="mt-3 h-px w-14 bg-amber-500/40" />
          <p className="mt-4 text-[16px] font-light leading-[1.6] text-neutral-400">
            Heavyweight custom milled fabrics engineered for elite street presence.
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Desktop Right Copy */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`right-${slide}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute right-8 top-[200px] z-30 hidden w-[280px] text-right md:block lg:right-12 lg:top-[220px]"
        >
          <p className="text-[15px] font-bold uppercase tracking-[0.22em] text-amber-400">
            Elite Status
          </p>
          <div className="mt-3 ml-auto h-px w-14 bg-amber-500/40" />
          <p className="mt-4 ml-auto text-[16px] font-light leading-[1.6] text-neutral-400">
            Designed in West Delhi, crafted with global luxury precision.
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Central Shop Button (Desktop) */}
      <div className="absolute bottom-10 left-1/2 z-50 -translate-x-1/2 hidden md:block">
  <Link href="/shop">
    <motion.button
      whileHover={{
        scale: 1.06,
        y: -2,
      }}
      whileTap={{ scale: 0.96 }}
      className="group relative overflow-hidden rounded-full border border-[#E6CA65]/40 bg-gradient-to-r from-[#8B1E1E] via-[#D4AF37] to-[#E6CA65] px-9 py-3.5 text-[12px] font-bold uppercase tracking-[0.25em] text-[#090909] shadow-[0_8px_30px_rgba(139,30,30,0.28),0_0_35px_rgba(212,175,55,0.22)] transition-all duration-300"
    >
      <span className="absolute inset-y-0 -left-[100%] w-[60%] skew-x-[-20deg] bg-white/25 transition-all duration-700 group-hover:left-[120%]" />

      <span className="relative z-10">
        Shop The Drop
      </span>
    </motion.button>
  </Link>
</div>

      {/* Desktop Slide Indicators */}
      <div className="absolute bottom-8 right-9 z-[60] hidden items-center gap-2 lg:flex">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            className="group p-1"
          >
            <span
              className={`block h-[2px] transition-all duration-500 ${
                index === slide
                  ? "w-8 bg-amber-400"
                  : "w-3.5 bg-neutral-700 group-hover:bg-neutral-500"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  </div>
</section>

  {/* =========================================================
    KOVENIK PREMIUM EDITORIAL SPLIT (DARK THEME - DESKTOP ONLY)
========================================================= */}

<section className="hidden lg:block w-full overflow-hidden bg-[#0A0A0A] min-h-[calc(100svh-128px)] text-white">
  <div className="grid w-full grid-cols-1 lg:grid-cols-[55%_45%]">

    {/* =====================================================
        LEFT IMAGE (Dark Marble Product Flat-Lay)
    ===================================================== */}

    <div className="group relative min-h-[650px] lg:min-h-[calc(100svh-128px)] w-full overflow-hidden flex flex-col justify-end p-12">

      <img
        src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=2000&q=92"
        alt="Kovenik luxury product flatlay"
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1400ms] group-hover:scale-[1.025]"
      />

      {/* Image overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

      {/* Image text */}
      <div className="relative z-10">

        <h2
          className="max-w-[760px] font-serif font-medium leading-[0.82] tracking-[-0.055em] text-white [text-shadow:0_3px_15px_rgba(0,0,0,0.8)] lg:text-[100px] xl:text-[116px]"
          style={{
            fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
          }}
        >
          Made for
          <br />
          everyday.
        </h2>

        <div className="mt-5 h-[5px] w-[190px] -rotate-[3deg] rounded-full bg-[#C52D38]" />

        <p className="mt-5 text-[13px] font-semibold uppercase tracking-[0.27em] text-neutral-300 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
          Premium essentials for modern living.
        </p>

      </div>
    </div>


    {/* =====================================================
        RIGHT EDITORIAL PANEL (Dark Theme)
    ===================================================== */}

    <div className="flex min-h-[650px] lg:min-h-[calc(100svh-128px)] flex-col bg-[#0A0A0A] justify-between">

      <div className="flex flex-1 flex-col justify-center px-12 py-12 xl:px-16">

        <h2
          className="font-serif font-medium leading-[0.84] tracking-[-0.055em] text-white lg:text-[76px] xl:text-[88px]"
          style={{
            fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
          }}
        >
          Crafted With
          <br />
          Intention.
        </h2>

        <p className="mt-6 max-w-[620px] text-[16px] leading-[1.75] text-neutral-400">
          Every piece in the KOVENIK collection is the result of a rigorous design process where form meets function. We believe that true luxury lies in the details—from the selection of the finest raw materials to the precision of our construction.
        </p>

        {/* CTA Button */}
        <div className="mt-8">
          <Link
            href="/shop"
            className="group inline-flex items-center gap-6 border border-neutral-700 bg-transparent px-9 py-5 text-[11px] font-bold uppercase tracking-[0.24em] text-white transition-colors duration-300 hover:border-amber-400 hover:text-amber-400"
          >
            <span>Explore the standard</span>
            <span className="text-[18px] leading-none transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

      </div>


      {/* ===================================================
          BOTTOM FOOTER ICONS / INFO
      =================================================== */}

      <div className="grid w-full grid-cols-2 border-t border-neutral-800/80 px-12 py-5 text-xs text-neutral-400">
        <div className="flex items-center gap-3">
          <span>🌐 Global Shipping</span>
        </div>
        <div className="flex items-center gap-3 justify-end">
          <span>🌿 Sustainable Practices</span>
        </div>
      </div>

    </div>

  </div>
</section>
<section className="w-full bg-neutral-950 px-4 pt-10 pb-12 sm:px-6 sm:pt-14 sm:pb-16 lg:px-8 lg:pt-16 lg:pb-20">
  {/* ============================================================
      ARDENBY / KOVENIK — CLEAN LUXURY EDITORIAL GRID (DARK THEME)
  ============================================================ */}

  <div className="mx-auto flex w-full max-w-[1380px] flex-col text-white">
    {/* SECTION HEADER */}
    <div className="mb-6 flex shrink-0 items-end justify-between gap-6 border-b border-amber-500/30 pb-3.5">
      <div>
        <div className="mb-2 flex items-center gap-2.5">
          <span className="h-px w-7 bg-gradient-to-r from-amber-400 to-yellow-500" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-amber-300">
            KOVENIK / COLLECTION
          </span>
        </div>

        <h2
          className="pb-1 pr-2 text-[36px] font-normal leading-[1.1] tracking-[-0.035em] bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(245,158,11,0.3)] sm:text-[48px] lg:text-[58px]"
          style={{
            fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
          }}
        >
          Category
        </h2>

        <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-neutral-300 sm:text-[12px]">
          Build your everyday uniform.
        </p>
      </div>

      <Link
        href="/shop"
        className="group hidden shrink-0 items-center gap-1.5 border-b border-amber-400 pb-1.5 text-[8px] font-bold uppercase tracking-[0.22em] text-amber-300 transition-colors hover:border-amber-200 hover:text-amber-100 sm:flex"
      >
        <span>Explore All</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </div>

    {/* ============================================================
        DESKTOP — FIXED GRID LAYOUT WITH PERFECT PROPORTIONS
    ============================================================ */}
    <div className="hidden grid-cols-12 gap-4 lg:grid xl:gap-5">
      {categories.slice(0, 4).map((cat, index) => {
        const staticCatProduct = staticHomeProducts.find(
          (p) => p.category === cat.slug,
        );
        const catProduct = products.find((p) => p.category === cat.slug);

        const webImages = [
          "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1400&q=90",
          "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1400&q=90",
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=90",
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1400&q=90",
        ];

        const productImage =
          webImages[index] ||
          staticCatProduct?.images?.[0] ||
          catProduct?.images?.[0];

        const isFeatured = index === 0;

        const desktopSpan = [
          "col-span-4 row-span-2 h-[520px] xl:h-[560px]",
          "col-span-4 h-[250px] xl:h-[270px]",
          "col-span-4 h-[250px] xl:h-[270px]",
          "col-span-5 col-start-5 h-[250px] xl:h-[270px]",
        ][index];

        const copy = [
          "Heavyweight silhouettes engineered for everyday rotation.",
          "Premium graphics with a clean streetwear finish.",
          "Elevated essentials built for daily wear.",
          "Statement layers made to stand apart.",
        ][index];

        const label = [
          "01 / CORE EDIT",
          "02 / GRAPHIC EDIT",
          "03 / ESSENTIALS",
          "04 / STATEMENT EDIT",
        ][index];

        return (
          <motion.div
            key={cat.slug}
            className={`${desktopSpan}`}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.48, delay: index * 0.055 }}
          >
            <Link
              href={`/shop?category=${cat.slug}`}
              className="group relative block h-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-none transition-all duration-500 hover:border-amber-400"
            >
              <div className="relative h-full">
                <img
                  src={productImage}
                  alt={cat.name}
                  className="h-full w-full object-cover opacity-85 transition-transform duration-700 ease-out group-hover:scale-[1.035] group-hover:opacity-95"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

                {isFeatured && (
                  <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5">
                    <span className="h-[2px] w-5 bg-amber-400" />
                    <span className="text-[7px] font-bold uppercase tracking-[0.23em] text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      Featured Category
                    </span>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[7.5px] font-bold uppercase tracking-[0.22em] text-amber-300">
                      {label}
                    </span>

                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-400/60 bg-neutral-900 text-amber-200 shadow-none transition-all duration-300 group-hover:bg-amber-400 group-hover:text-neutral-950">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  <h3
                    className={
                      isFeatured
                        ? "pb-1 pr-1 text-[32px] font-medium leading-[1.1] tracking-[-0.04em] bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(245,158,11,0.25)] sm:text-[38px] xl:text-[44px]"
                        : "pb-1 pr-1 text-[26px] font-medium leading-[1.1] tracking-[-0.035em] bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(245,158,11,0.25)] sm:text-[30px] xl:text-[34px]"
                    }
                    style={{
                      fontFamily:
                        "Bodoni MT, Didot, Times New Roman, serif",
                    }}
                  >
                    {cat.name}
                  </h3>

                  <p
                    className={
                      isFeatured
                        ? "mt-2.5 max-w-[460px] text-[13px] font-medium leading-[1.5] text-neutral-200 sm:text-[14px]"
                        : "mt-2 max-w-[380px] text-[12px] font-medium leading-[1.5] text-neutral-200 sm:text-[13px]"
                    }
                  >
                    {copy}
                  </p>

                  {isFeatured && (
                    <span className="mt-3 inline-flex items-center gap-1.5 bg-amber-400 px-3.5 py-2 text-[7px] font-bold uppercase tracking-[0.2em] text-neutral-950 transition-transform duration-300 group-hover:-translate-y-0.5">
                      Shop Collection
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}

      {/* ALL PRODUCTS — COUNTERWEIGHT CARD */}
      <motion.div
        className="col-span-3 col-start-10 h-[250px] xl:h-[270px]"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.48, delay: 0.24 }}
      >
        <Link
          href="/shop"
          className="group block h-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-none transition-all duration-500 hover:border-amber-400"
        >
          <div className="relative h-full">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=90"
              alt="All Ardenby Products"
              className="h-full w-full object-cover object-[center_28%] opacity-85 transition-transform duration-700 ease-out group-hover:scale-[1.035] group-hover:opacity-95"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6">
              <p className="mb-2 text-[7.5px] font-bold uppercase tracking-[0.22em] text-amber-300">
                05 / COMPLETE COLLECTION
              </p>

              <div className="flex items-end justify-between gap-2">
                <h3
                  className="pb-1 pr-1 text-[26px] font-medium leading-[1.1] tracking-[-0.035em] bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(245,158,11,0.25)] sm:text-[30px]"
                  style={{
                    fontFamily:
                      "Bodoni MT, Didot, Times New Roman, serif",
                  }}
                >
                  All Products
                </h3>

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-400/60 bg-neutral-900 text-amber-200 shadow-none transition-all duration-300 group-hover:bg-amber-400 group-hover:text-neutral-950">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>

    {/* ============================================================
        MOBILE — RESPONSIVE GRID
    ============================================================ */}
    <div className="grid grid-cols-2 gap-3.5 lg:hidden">
      {categories.slice(0, 4).map((cat, index) => {
        const staticCatProduct = staticHomeProducts.find(
          (p) => p.category === cat.slug,
        );
        const catProduct = products.find((p) => p.category === cat.slug);

        const webImages = [
          "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=90",
          "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=90",
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=90",
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=90",
        ];

        const productImage =
          webImages[index] ||
          staticCatProduct?.images?.[0] ||
          catProduct?.images?.[0];

        const isFeatured = index === 0;

        return (
          <motion.div
            key={cat.slug}
            className={isFeatured ? "col-span-2" : "col-span-1"}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.08 }}
            transition={{ duration: 0.4, delay: index * 0.04 }}
          >
            <Link
              href={`/shop?category=${cat.slug}`}
              className="group block overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 shadow-none transition-all duration-300 hover:border-amber-400"
            >
              <div
                className={
                  isFeatured
                    ? "relative h-[310px] sm:h-[350px]"
                    : "relative h-[210px] sm:h-[240px]"
                }
              >
                <img
                  src={productImage}
                  alt={cat.name}
                  className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-[1.03] group-hover:opacity-95"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-amber-300">
                      0{index + 1} / COLLECTION
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-amber-200" />
                  </div>

                  <h3
                    className={
                      isFeatured
                        ? "pb-1 pr-1 text-[32px] font-medium leading-[1.1] tracking-[-0.04em] bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(245,158,11,0.25)] sm:text-[38px]"
                        : "pb-1 pr-1 text-[22px] font-medium leading-[1.1] tracking-[-0.035em] bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(245,158,11,0.25)]"
                    }
                    style={{
                      fontFamily:
                        "Bodoni MT, Didot, Times New Roman, serif",
                    }}
                  >
                    {cat.name}
                  </h3>

                  <p className="mt-1.5 max-w-[92%] text-[10.5px] font-medium leading-[1.45] text-neutral-200 sm:text-[11.5px]">
                    {index === 0
                      ? "Heavyweight silhouettes engineered for everyday rotation."
                      : index === 1
                        ? "Premium graphics with a clean streetwear finish."
                        : index === 2
                          ? "Elevated essentials built for daily wear."
                          : "Statement layers made to stand apart."}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}

      <motion.div
        className="col-span-2"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: 0.4, delay: 0.18 }}
      >
        <Link
          href="/shop"
          className="group flex min-h-[80px] items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-4 shadow-none transition-colors duration-300 hover:border-amber-400 hover:bg-neutral-800"
        >
          <div>
            <p className="mb-1 text-[7px] font-bold uppercase tracking-[0.2em] text-amber-300">
              05 / COMPLETE COLLECTION
            </p>
            <h3
              className="pb-0.5 pr-1 text-[25px] font-medium leading-[1.1] tracking-[-0.035em] bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(245,158,11,0.25)]"
              style={{
                fontFamily:
                  "Bodoni MT, Didot, Times New Roman, serif",
              }}
            >
              All Products
            </h3>
          </div>

          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-400/60 bg-neutral-900 text-amber-200 shadow-none transition-all duration-300 group-hover:bg-amber-400 group-hover:text-neutral-950">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </motion.div>
    </div>
  </div>
</section>
<section className="ardenby-product-section w-full bg-[#0b0b0b] px-4 pb-12 pt-14 text-white sm:px-6 sm:pb-16 sm:pt-16 lg:px-10 lg:pb-20 lg:pt-20">
  <div className="mx-auto w-full max-w-[1440px]">

    {/* ================= HEADER ================= */}
    <div className="mb-6 border-b border-white/10 pb-6 sm:mb-8 sm:pb-7 lg:mb-9 lg:pb-8">
      <div className="flex items-end justify-between">

        {/* LEFT CONTENT */}
        <div className="min-w-0">

          {/* EYEBROW */}
          <div className="mb-2 flex items-center gap-2.5 sm:mb-2.5">
            <span className="text-[9px] font-medium uppercase tracking-[0.28em] text-[#D4AF37] sm:text-[8.5px]">
              KOVENIK / COLLECTION
            </span>

            <span className="hidden h-px w-7 bg-white/20 sm:block" />

            <span className="hidden text-[7.5px] font-medium uppercase tracking-[0.22em] text-neutral-400 sm:block">
              04 ITEMS
            </span>
          </div>

          {/* TITLE - METALLIC GOLD STYLE */}
          <h2 className="font-serif text-[42px] font-normal leading-[0.92] tracking-[-0.045em] bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA771C] bg-clip-text text-transparent sm:text-[42px] lg:text-[48px]">
            Best Sellers
          </h2>

          {/* DESCRIPTION */}
          <p className="mt-3 max-w-[420px] text-[12px] leading-[1.6] text-neutral-300 sm:text-[10.5px]">
            Most loved. Most worn. Timeless pieces that define KOVENIK.
          </p>

          {/* LOADING */}
          {productsLoading && (
            <p className="mt-2 text-[8.5px] font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
              Loading live collection...
            </p>
          )}

          {/* ERROR */}
          {!productsLoading && productsError && (
            <p className="mt-2 text-[8.5px] font-medium uppercase tracking-[0.2em] text-neutral-400">
              Showing the latest available collection.
            </p>
          )}
        </div>

        {/* ================= DESKTOP VIEW ALL ================= */}
        <Link
          href="/shop"
          className="group hidden shrink-0 items-center gap-2 border-b border-[#D4AF37] pb-1.5 text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37] transition-colors duration-300 hover:text-white sm:flex"
        >
          Explore All Fits

          <ArrowUpRight
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </div>

    {/* ================= PRODUCTS GRID WITH PREMIUM SHADOW & RADIUS ================= */}
    <div className="grid w-full grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 sm:gap-y-11 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
      {bestSellers.map((product, index) => (
        <div
          key={product.id || index}
          className="group relative min-w-0 rounded-2xl bg-[#111111] p-3.5 border border-[#D4AF37]/50 shadow-[0_8px_30px_rgb(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.1)] transition-all duration-300 hover:border-[#D4AF37] hover:shadow-[0_12px_40px_rgb(0,0,0,0.9),0_0_25px_rgba(212,175,55,0.25)] hover:-translate-y-1.5 [&_h3]:font-bold [&_h3]:text-white [&_p]:text-neutral-200 [&_span]:text-[#F3E5AB] [&_span]:font-bold"
        >
          <ProductCard
            product={product as Product}
            index={index}
          />
        </div>
      ))}
    </div>

    {/* ================= MOBILE VIEW ALL ================= */}
    <div className="mt-10 flex w-full justify-center sm:hidden">
      <Link
        href="/shop"
        className="group mx-auto flex items-center justify-center gap-2 border-b border-[#D4AF37] pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#D4AF37]"
      >
        View All Best Sellers

        <ArrowUpRight
          className="h-3.5 w-3.5 transition-transform duration-300 group-active:-translate-y-0.5 group-active:translate-x-0.5"
        />
      </Link>
    </div>

  </div>
</section>

     {/* ================= TRENDING NOW ================= */}
{/* ================================================================
    TRENDING NOW
================================================================ */}

<section className="ardenby-product-section relative w-full overflow-hidden bg-[#0b0b0b] px-3 py-14 sm:px-6 sm:py-18 lg:px-10 lg:py-24 text-white">
  <div className="mx-auto w-full max-w-[1440px]">

    {/* ================= HEADER ================= */}
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease }}
      className="mb-8 flex items-end justify-between border-b border-white/10 pb-5 sm:mb-10 sm:pb-6"
    >
      <div>
        <div className="flex items-center gap-3">
          <span className="h-px w-7 bg-[#D4AF37]/50" />

          <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37] sm:text-[9px]">
            Community Top Picks
          </span>
        </div>

        {/* TITLE - METALLIC GOLD STYLE */}
        <h2 className="mt-2 font-serif text-[42px] font-normal leading-[0.92] tracking-[-0.045em] bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA771C] bg-clip-text text-transparent sm:text-[42px] lg:text-[52px]">
          Trending Now
        </h2>

        <p className="mt-3 max-w-[420px] text-[12px] leading-[1.6] text-neutral-300 sm:text-[11px]">
          Discover the pieces everyone is talking about this season.
        </p>
      </div>

      {/* DESKTOP CTA */}
      <Link
        href="/shop"
        className="group hidden items-center gap-2 border-b border-[#D4AF37] pb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] transition-colors duration-300 hover:text-white sm:flex"
      >
        Discover Trending

        <ArrowUpRight
          className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </Link>
    </motion.div>

    {/* ================= PRODUCT GRID WITH PREMIUM SHADOW, RADIUS & GOLD STYLE ================= */}
    <div className="grid w-full grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-4 lg:gap-x-6">

      {trending.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{
            opacity: 0,
            y: 25,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.12,
          }}
          transition={{
            duration: 0.55,
            delay: index * 0.07,
            ease,
          }}
          className="group relative min-w-0 rounded-2xl bg-[#111111] p-3.5 border border-[#D4AF37]/50 shadow-[0_8px_30px_rgb(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.1)] transition-all duration-300 hover:border-[#D4AF37] hover:shadow-[0_12px_40px_rgb(0,0,0,0.9),0_0_25px_rgba(212,175,55,0.25)] hover:-translate-y-1.5 [&_h3]:font-bold [&_h3]:text-white [&_p]:text-neutral-200 [&_span]:text-[#F3E5AB] [&_span]:font-bold"
        >
          <ProductCard
            product={product as Product}
            index={index}
          />
        </motion.div>
      ))}

    </div>

    {/* ================= MOBILE CTA ================= */}
    <div className="mt-9 flex justify-center sm:hidden">
      <Link
        href="/shop"
        className="group flex items-center gap-2 border-b border-[#D4AF37] pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]"
      >
        Discover Trending

        <ArrowUpRight
          className="h-3.5 w-3.5 transition-transform duration-300 group-active:-translate-y-0.5 group-active:translate-x-0.5"
        />
      </Link>
    </div>

  </div>
</section>



      {/* ================= NEWSLETTER ================= */}
     
    </main>
  );
}