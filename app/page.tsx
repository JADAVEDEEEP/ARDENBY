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
  title: "Join the ARDENBY Fam",
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
      {/* ================= HERO SECTION ================= */
      <section
        className="relative z-0 w-full overflow-hidden bg-[#F6F5F0] h-[500px] sm:h-[540px] md:h-[520px] lg:h-[540px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative h-full w-full">

          {/* =====================================================
              MOBILE HERO — purpose-built composition
          ====================================================== */}
          <div className="absolute inset-0 block md:hidden">

            {/* subtle background */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0)_35%,rgba(246,245,240,0.28)_100%)]" />

            {/* premium badge */}
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute left-4 top-4 z-[70]"
            >
              <div className="rounded-md border border-neutral-300/70 bg-white/75 px-3 py-1.5 backdrop-blur-sm">
                <p className="text-[6px] font-bold uppercase tracking-[0.18em] text-neutral-900">
                  Premium Drop • SS26
                </p>
                <p className="mt-0.5 text-[6.5px] text-neutral-500">
                  Heavyweight • Drop Shoulder
                </p>
              </div>
            </motion.div>

            {/* MOBILE EDITORIAL HEADLINE — intentionally BEHIND the model */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`mobile-headline-${slide}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.45, ease }}
                className="absolute inset-x-1 top-[82px] z-10 flex justify-center text-center"
              >
                <h1
                  className="
                    w-full px-2
                    font-serif font-black uppercase
                    text-[52px] leading-[0.74] tracking-[-0.065em]
                    text-neutral-950
                    sm:text-[62px]
                  "
                  style={{
                    fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
                    textShadow: "0 1px 0 rgba(0,0,0,0.03)",
                  }}
                >
                  {activeHero.headline}
                </h1>
              </motion.div>
            </AnimatePresence>

            {/* MOBILE MODEL — sits IN FRONT of the headline */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-[430px] items-end justify-center sm:h-[450px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`mobile-model-${slide}`}
                  initial={{ opacity: 0, y: 18, scale: 1.02 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.55, ease }}
                  className="relative flex h-full w-full items-end justify-center"
                >
                  {/* very subtle grounding shadow */}
                  <div className="absolute bottom-5 left-1/2 h-[190px] w-[175px] -translate-x-1/2 rounded-full bg-neutral-400/[0.018] blur-[38px]" />

                  <img
                    src={transparentHeroImages[slide % transparentHeroImages.length]}
                    alt={activeHero.headline}
                    className="
                      relative z-20
                      h-full w-auto max-w-[108%]
                      scale-[1.08]
                      object-contain object-bottom
                      drop-shadow-[0_4px_8px_rgba(0,0,0,0.035)]
                      sm:max-w-[105%] sm:scale-[1.05]
                    "
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* mobile slide counter */}
            <div className="absolute bottom-4 left-4 z-[80] flex items-center gap-2">
              <span className="text-[7px] font-bold tracking-[0.2em] text-neutral-900">
                {String(slide + 1).padStart(2, "0")}
              </span>
              <span className="h-px w-7 bg-neutral-300" />
              <span className="text-[7px] tracking-[0.2em] text-neutral-400">
                {String(heroSlides.length).padStart(2, "0")}
              </span>
            </div>

            {/* mobile indicators */}
            <div className="absolute bottom-4 right-4 z-[80] flex items-center gap-1.5">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className="p-1"
                >
                  <span
                    className={`block h-[2px] transition-all duration-300 ${
                      index === slide ? "w-7 bg-neutral-950" : "w-2.5 bg-neutral-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* =====================================================
              DESKTOP / TABLET HERO
          ====================================================== */}
          <div className="absolute inset-0 hidden md:block">

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(246,245,240,0)_0%,rgba(246,245,240,0.06)_48%,rgba(246,245,240,0.30)_100%)]"
            />

            {/* PREMIUM DROP LABEL */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="absolute left-7 top-7 z-30 lg:left-9 lg:top-8"
            >
              <div className="rounded-md border border-neutral-300/70 bg-white/65 px-3.5 py-2 backdrop-blur-sm">
                <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-neutral-900">
                  Premium Drop • SS26
                </p>
                <p className="mt-0.5 text-[8px] font-light text-neutral-500">
                  Heavyweight • Drop Shoulder
                </p>
              </div>
            </motion.div>

            {/* desktop headline */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`desktop-headline-${slide}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, ease }}
                className="absolute left-0 right-0 top-[70px] z-10 flex justify-center px-4 lg:top-[58px] lg:px-8"
              >
                <h1
                  className="w-full max-w-[1450px] text-center font-serif text-[56px] font-black uppercase leading-[0.76] tracking-[-0.055em] text-neutral-950 md:text-[70px] lg:text-[clamp(76px,8vw,118px)]"
                  style={{
                    fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
                    textShadow: "0 1px 0 rgba(0,0,0,0.05)",
                  }}
                >
                  {activeHero.headline}
                </h1>
              </motion.div>
            </AnimatePresence>

            {/* desktop model */}
            <div className="pointer-events-none absolute inset-0 z-50 flex items-end justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`desktop-model-${slide}`}
                  initial={{ opacity: 0, y: 18, scale: 1.01 }}
                  animate={{ opacity: 1, y: 28, scale: 1 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.6, ease }}
                  className="relative z-50 flex h-full w-full items-end justify-center md:translate-y-0"
                >
                  <div className="absolute bottom-[28px] left-1/2 h-[390px] w-[340px] -translate-x-1/2 rounded-full bg-neutral-400/[0.035] blur-[42px] lg:h-[420px] lg:w-[380px]" />

                  <img
                    src={transparentHeroImages[slide % transparentHeroImages.length]}
                    alt={activeHero.headline}
                    className="relative z-50 h-[82%] w-auto max-w-[96%] object-contain object-bottom drop-shadow-[0_7px_12px_rgba(0,0,0,0.06)] lg:h-[84%] lg:max-w-[61%]"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* desktop left copy */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`left-${slide}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute left-5 top-[235px] z-30 hidden w-[210px] md:block lg:left-9"
              >
                <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-neutral-900">
                  Move Comfortably
                </p>
                <div className="mt-2 h-px w-10 bg-neutral-300" />
                <p className="mt-3 max-w-[195px] text-[8px] font-light leading-[1.65] text-neutral-500">
                  Designed for everyday comfort, refined details, and modern silhouettes.
                </p>
              </motion.div>
            </AnimatePresence>

            {/* desktop right copy */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`right-${slide}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute right-5 top-[235px] z-30 hidden w-[210px] text-right md:block lg:right-9"
              >
                <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-neutral-900">
                  Feel Confident
                </p>
                <div className="mt-2 ml-auto h-px w-10 bg-neutral-300" />
                <p className="mt-3 ml-auto max-w-[195px] text-[8px] font-light leading-[1.65] text-neutral-500">
                  Crafted for a refined everyday look with effortless comfort.
                </p>
              </motion.div>
            </AnimatePresence>

            {/* desktop editorial note */}
            <div className="absolute bottom-[76px] left-7 z-[55] hidden max-w-[210px] lg:block xl:left-10">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-px w-7 bg-neutral-900/35" />
                <span className="text-[7px] font-semibold uppercase tracking-[0.28em] text-neutral-700/80">
                  ARDENBY / 01
                </span>
              </div>
              <p
                className="font-serif text-[18px] leading-[0.95] tracking-[-0.025em] text-neutral-900 xl:text-[20px]"
                style={{ fontFamily: "Bodoni MT, Didot, Times New Roman, serif" }}
              >
                Everyday pieces,
                <br />
                considered differently.
              </p>
              <p className="mt-2 max-w-[190px] text-[7px] leading-[1.6] text-neutral-600/75">
                Refined silhouettes, premium fabric and quiet confidence.
              </p>
            </div>

            {/* desktop counter */}
            <div className="absolute bottom-4 left-5 z-[60] flex items-center gap-2 sm:bottom-5 sm:left-7 lg:left-9">
              <span className="text-[7px] font-bold tracking-[0.2em] text-neutral-900 sm:text-[8px]">
                {String(slide + 1).padStart(2, "0")}
              </span>
              <span className="h-px w-6 bg-neutral-300 sm:w-8" />
              <span className="text-[7px] tracking-[0.2em] text-neutral-400 sm:text-[8px]">
                {String(heroSlides.length).padStart(2, "0")}
              </span>
            </div>

            {/* desktop indicators */}
            <div className="absolute bottom-5 right-5 z-[60] hidden items-center gap-2 lg:right-9 lg:flex">
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
                        ? "w-8 bg-neutral-950"
                        : "w-3.5 bg-neutral-300 group-hover:bg-neutral-500"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      /* =========================================================
          ARDENBY STANDARD — MATCHED EDITORIAL SPLIT
          Full width / no max-width / no heavy shadow
      ========================================================= */}
      <section className="w-full overflow-hidden bg-[#F6F5F0]">

        {/* SAME VISUAL LANGUAGE AS HERO */}
        <div className="grid w-full grid-cols-1 lg:grid-cols-[55%_45%]">

          {/* IMAGE */}
          <div className="group relative h-[360px] w-full overflow-hidden sm:h-[440px] lg:h-[500px]">
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=90"
              alt="ARDENBY craft and collection"
              className="
                absolute inset-0 h-full w-full object-cover
                object-center
                transition-transform duration-1000
                group-hover:scale-[1.02]
              "
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/10 to-transparent" />

            <div className="absolute left-6 top-6 sm:left-8 sm:top-8">
              <span className="text-[7px] font-semibold uppercase tracking-[0.32em] text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.55)]">
                ARDENBY / CRAFT
              </span>
            </div>

            <div className="absolute bottom-8 left-6 sm:bottom-10 sm:left-8">
              <p className="mb-2 text-[7px] font-semibold uppercase tracking-[0.3em] text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.65)]">
                Quality · Craft · Intention
              </p>

              <h2
                className="
                  font-serif text-[42px] leading-[0.88]
                  tracking-[-0.045em] text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.58)]
                  sm:text-[52px] lg:text-[60px]
                "
                style={{
                  fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
                }}
              >
                Made for
                <br />
                everyday.
              </h2>
            </div>
          </div>

          {/* RIGHT EDITORIAL PANEL */}
          <div className="flex min-h-[390px] flex-col bg-[#F6F5F0] sm:min-h-[440px] lg:min-h-[500px]">

            <div className="flex flex-1 flex-col justify-center px-7 py-12 sm:px-10 lg:px-14">

              <div className="flex items-center justify-between">
                <span className="text-[8px] font-semibold uppercase tracking-[0.32em] text-neutral-500">
                  01 — Philosophy
                </span>

                <span className="text-[7px] uppercase tracking-[0.2em] text-neutral-400">
                  AR / 01
                </span>
              </div>

              <h2
                className="
                  mt-8 font-serif text-[48px] leading-[0.86]
                  tracking-[-0.05em] text-neutral-950 [text-shadow:0_1px_0_rgba(255,255,255,0.7)]
                  sm:text-[58px] lg:text-[68px]
                "
                style={{
                  fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
                }}
              >
                Made With
                <br />
                Intention.
              </h2>

              <p className="mt-6 max-w-[520px] text-[10px] leading-[1.8] text-neutral-500 sm:text-[11px] lg:text-[12px]">
                From the first stitch to the final delivery, every detail is
                considered. Premium clothing doesn't need to shout — quality
                speaks through the fabric, construction and fit.
              </p>

              <Link
                href="/shop"
                className="
                  group mt-7 flex w-fit items-center gap-4
                  border-b border-neutral-900 pb-2
                  text-[8px] font-bold uppercase tracking-[0.22em]
                  text-neutral-900
                "
              >
                Explore the standard
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* DETAIL GRID — SAME CLEAN LANGUAGE */}
            <div className="grid grid-cols-1 border-t border-neutral-300/70 sm:grid-cols-3">

              <div className="border-b border-neutral-300/70 bg-[#EFEEE9] p-5 sm:border-b-0 sm:p-7">
                <span className="text-[7px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
                  Material
                </span>

                <div className="mt-4 flex items-end gap-2">
                  <span
                    className="font-serif text-[38px] leading-none tracking-[-0.04em] text-neutral-950"
                    style={{
                      fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
                    }}
                  >
                    240
                  </span>
                  <span className="mb-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    GSM
                  </span>
                </div>

                <p className="mt-3 text-[7px] leading-[1.6] text-neutral-500">
                  Heavyweight
                  <br />
                  combed cotton.
                </p>
              </div>

              <div className="border-b border-neutral-300/70 bg-[#E9E7E1] p-5 sm:border-b-0 sm:border-l sm:p-7">
                <span className="text-[7px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
                  Construction
                </span>

                <h3
                  className="mt-4 font-serif text-[25px] leading-[0.9] tracking-[-0.035em] text-neutral-950 sm:text-[30px]"
                  style={{
                    fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
                  }}
                >
                  Precision
                  <br />
                  in every stitch.
                </h3>
              </div>

              <div className="bg-[#E2E0DA] p-5 sm:border-l sm:border-neutral-300/70 sm:p-7">
                <span className="text-[7px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
                  Philosophy
                </span>

                <h3
                  className="mt-4 font-serif text-[25px] leading-[0.9] tracking-[-0.035em] text-neutral-950 sm:text-[30px]"
                  style={{
                    fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
                  }}
                >
                  Built
                  <br />
                  beyond seasons.
                </h3>
              </div>

            </div>
          </div>
        </div>

        {/* FOUR TRUST CARDS */}
        <div className="grid w-full grid-cols-1 border-t border-neutral-300/70 sm:grid-cols-2 lg:grid-cols-4">

          <div className="border-b border-neutral-300/70 p-5 sm:p-6 sm:border-r">
            <div className="flex items-center justify-between">
              <span className="text-[7px] text-neutral-400">01</span>
              <ShieldCheck className="h-4 w-4 text-neutral-500" />
            </div>
            <p className="mt-4 text-[9px] font-semibold text-neutral-900">
              Encrypted Payments
            </p>
            <p className="mt-1 text-[7px] text-neutral-500">
              UPI, Cards & COD.
            </p>
          </div>

          <div className="border-b border-neutral-300/70 p-5 sm:p-6 sm:border-r">
            <div className="flex items-center justify-between">
              <span className="text-[7px] text-neutral-400">02</span>
              <Truck className="h-4 w-4 text-neutral-500" />
            </div>
            <p className="mt-4 text-[9px] font-semibold text-neutral-900">
              Free Express Shipping
            </p>
            <p className="mt-1 text-[7px] text-neutral-500">
              2-4 business days.
            </p>
          </div>

          <div className="border-b border-neutral-300/70 p-5 sm:p-6 sm:border-r">
            <div className="flex items-center justify-between">
              <span className="text-[7px] text-neutral-400">03</span>
              <RefreshCw className="h-4 w-4 text-neutral-500" />
            </div>
            <p className="mt-4 text-[9px] font-semibold text-neutral-900">
              7-Day Returns
            </p>
            <p className="mt-1 text-[7px] text-neutral-500">
              Easy exchange.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-[7px] text-neutral-400">04</span>
              <Star className="h-4 w-4 text-neutral-500" />
            </div>
            <p className="mt-4 text-[9px] font-semibold text-neutral-900">
              ARDENBY Standard
            </p>
            <p className="mt-1 text-[7px] text-neutral-500">
              Beyond ordinary.
            </p>
          </div>

        </div>
      </section>
{/*================================================================

    ARDENBY — SHOP BY CATEGORY

    SHOPRZ-STYLE 5-TILE EDITORIAL LAYOUT



    Layout:

      LEFT  : 2 stacked category cards

      CENTER: 1 tall featured card

      RIGHT : 2 stacked category cards



    Existing categories / product lookup / category hrefs remain intact.

================================================================ */}

<section className="w-full overflow-hidden bg-[#F6F3EC] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">



  {/* SECTION HEADER */}

  <div className="mx-auto mb-7 flex w-full max-w-[1380px] items-end justify-between gap-6 sm:mb-9 lg:mb-10">

    <div>

      <div className="mb-2 flex items-center gap-2.5">

        <span className="h-px w-7 bg-[#181714]" />

        <span className="text-[8px] font-semibold uppercase tracking-[0.28em] text-[#77716A] sm:text-[9px]">

          ARDENBY COLLECTIONS

        </span>

      </div>



      <h2

        className="text-[38px] font-normal leading-[0.9] tracking-[-0.055em] text-[#11100F] sm:text-[48px] lg:text-[58px]"

        style={{ fontFamily: "Bodoni MT, Didot, Times New Roman, serif" }}

      >

        Shop by Category

      </h2>



      <p className="mt-2 font-serif text-[13px] italic tracking-[-0.01em] text-[#77716A] sm:text-[14px]">

        Find your everyday uniform.

      </p>

    </div>



    <Link

      href="/shop"

      className="group hidden items-center gap-2 border-b border-[#11100F] pb-1.5 text-[8px] font-semibold uppercase tracking-[0.24em] text-[#11100F] sm:flex"

    >

      <span>Explore Ardenby</span>

      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />

    </Link>

  </div>



  {/* ============================================================

      DESKTOP — 3 COLUMN / 5 TILE COMPOSITION

      LEFT 2 STACKED | CENTER TALL | RIGHT 2 STACKED

  ============================================================ */}

  <div className="mx-auto hidden w-full max-w-[1380px] gap-3 lg:grid lg:grid-cols-[1fr_1.02fr_1fr]">

    {categories.slice(0, 4).map((cat, index) => {

      const staticCatProduct = staticHomeProducts.find(

        (p) => p.category === cat.slug

      );



      const catProduct = products.find(

        (p) => p.category === cat.slug

      );



      const productImage =

        staticCatProduct?.images?.[0] ||

        catProduct?.images?.[0] ||

        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop";



      const isCenter = index === 1;



      const cardCopy = [

        "Heavyweight silhouettes for your everyday rotation.",

        "Distinct graphics with a premium streetwear finish.",

        "Elevated essentials built for everyday luxury.",

        "Statement pieces made to stand apart.",

      ][index];



      const cardLabel = [

        "HEAVYWEIGHT ESSENTIALS",

        "GRAPHIC COLLECTION",

        "EVERYDAY LUXURY",

        "STATEMENT EDIT",

      ][index];



      return (

        <motion.div

          key={cat.slug}

          className={isCenter ? "row-span-2" : ""}

          initial={{ opacity: 0, y: 14 }}

          whileInView={{ opacity: 1, y: 0 }}

          viewport={{ once: true, amount: 0.12 }}

          transition={{ duration: 0.5, delay: index * 0.06 }}

        >

          <Link

            href={`/shop?category=${cat.slug}`}

            className="group block h-full overflow-hidden rounded-[16px] bg-[#E9E1D5]"

          >

            <div className={isCenter ? "relative h-full min-h-[620px]" : "relative h-[304px]"}>

              <img

                src={productImage}

                alt={cat.name}

                className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.025]"

              />



              {/* Very soft readability wash — image stays dominant */}

              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/28 to-transparent" />



              {/* Center card */}

              {isCenter ? (

                <div className="absolute inset-x-0 bottom-0 p-5 text-white xl:p-6">

                  <div className="mb-3 flex items-center gap-2">

                    <span className="h-px w-6 bg-white/80" />

                    <span className="text-[7px] font-semibold uppercase tracking-[0.22em] text-white/85">

                      Featured Collection

                    </span>

                  </div>



                  <h3

                    className="max-w-[360px] text-[38px] font-normal leading-[0.88] tracking-[-0.045em] sm:text-[44px] xl:text-[50px]"

                    style={{ fontFamily: "Bodoni MT, Didot, Times New Roman, serif" }}

                  >

                    {cat.name}

                  </h3>



                  <p className="mt-2 max-w-[330px] text-[9px] leading-relaxed text-white/80">

                    {cardCopy}

                  </p>



                  <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[7px] font-bold uppercase tracking-[0.2em] text-[#11100F] transition-transform duration-300 group-hover:translate-y-[-2px]">

                    Shop Collection

                    <ArrowUpRight className="h-3 w-3" />

                  </span>

                </div>

              ) : (

                <div className="absolute inset-x-0 bottom-0 p-4 text-white xl:p-5">

                  <p className="mb-1.5 text-[7px] font-semibold uppercase tracking-[0.2em] text-white/80">

                    {cardLabel}

                  </p>



                  <div className="flex items-end justify-between gap-3">

                    <h3

                      className="text-[25px] font-normal leading-[0.9] tracking-[-0.035em] xl:text-[29px]"

                      style={{ fontFamily: "Bodoni MT, Didot, Times New Roman, serif" }}

                    >

                      {cat.name}

                    </h3>



                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-white group-hover:text-[#11100F]">

                      <ArrowUpRight className="h-3.5 w-3.5" />

                    </span>

                  </div>

                </div>

              )}

            </div>

          </Link>

        </motion.div>

      );

    })}



    {/* FIFTH TILE — ALL PRODUCTS / ARDENBY FEATURE */}

    <motion.div

      className="row-start-2"

      initial={{ opacity: 0, y: 14 }}

      whileInView={{ opacity: 1, y: 0 }}

      viewport={{ once: true, amount: 0.12 }}

      transition={{ duration: 0.5, delay: 0.22 }}

    >

      <Link

        href="/shop"

        className="group block h-[304px] overflow-hidden rounded-[16px] bg-[#DDD4C7]"

      >

        <div className="relative h-full">

          <img

            src={

              staticHomeProducts?.[4]?.images?.[0] ||

              staticHomeProducts?.[0]?.images?.[0] ||

              "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1200&auto=format&fit=crop"

            }

            alt="All Ardenby Products"

            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.025]"

          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/42 via-black/5 to-transparent" />



          <div className="absolute inset-x-0 bottom-0 p-4 text-white xl:p-5">

            <p className="mb-1.5 text-[7px] font-semibold uppercase tracking-[0.2em] text-white/80">

              Complete Collection

            </p>

            <div className="flex items-end justify-between gap-3">

              <h3

                className="text-[25px] font-normal leading-[0.9] tracking-[-0.035em] xl:text-[29px]"

                style={{ fontFamily: "Bodoni MT, Didot, Times New Roman, serif" }}

              >

                All Products

              </h3>

              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-white group-hover:text-[#11100F]">

                <ArrowUpRight className="h-3.5 w-3.5" />

              </span>

            </div>

          </div>

        </div>

      </Link>

    </motion.div>

  </div>



  {/* ============================================================

      MOBILE — 2 COLUMN SHOPRZ STYLE

  ============================================================ */}

  <div className="mx-auto grid w-full max-w-[1380px] grid-cols-2 gap-2.5 lg:hidden">

    {categories.slice(0, 4).map((cat, index) => {

      const staticCatProduct = staticHomeProducts.find(

        (p) => p.category === cat.slug

      );



      const catProduct = products.find(

        (p) => p.category === cat.slug

      );



      const productImage =

        staticCatProduct?.images?.[0] ||

        catProduct?.images?.[0] ||

        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop";



      return (

        <motion.div

          key={cat.slug}

          className={index === 1 ? "row-span-2" : ""}

          initial={{ opacity: 0, y: 10 }}

          whileInView={{ opacity: 1, y: 0 }}

          viewport={{ once: true, amount: 0.08 }}

          transition={{ duration: 0.4, delay: index * 0.04 }}

        >

          <Link

            href={`/shop?category=${cat.slug}`}

            className="group block h-full overflow-hidden rounded-[12px] bg-[#E9E1D5]"

          >

            <div className={index === 1 ? "relative h-[390px]" : "relative h-[190px]"}>

              <img

                src={productImage}

                alt={cat.name}

                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.025]"

              />

              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/38 to-transparent" />



              <div className="absolute inset-x-0 bottom-0 p-3 text-white">

                <p className="mb-1 text-[6px] font-semibold uppercase tracking-[0.18em] text-white/80">

                  0{index + 1} / COLLECTION

                </p>

                <div className="flex items-end justify-between gap-2">

                  <h3

                    className="text-[19px] font-normal leading-[0.9] tracking-[-0.03em]"

                    style={{ fontFamily: "Bodoni MT, Didot, Times New Roman, serif" }}

                  >

                    {cat.name}

                  </h3>

                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />

                </div>

              </div>

            </div>

          </Link>

        </motion.div>

      );

    })}



    <Link

      href="/shop"

      className="col-span-2 flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#11100F] text-[7px] font-bold uppercase tracking-[0.23em] text-white"

    >

      Explore All Products

      <ArrowRight className="h-3 w-3" />

    </Link>

  </div>

</section>
     
    

      {/* ================= BEST SELLERS ================= */}
     <section className="w-full bg-[#f8f7f3] px-3 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-10 lg:pb-16 lg:pt-20">
  <div className="mx-auto w-full max-w-[1440px]">

    {/* ================= HEADER ================= */}
    <div className="mb-7 flex items-end justify-between border-b border-black/10 pb-5 sm:mb-9">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-[8.5px] font-semibold uppercase tracking-[0.28em] text-neutral-500 sm:text-[9px]">
            Customer Favorites
          </span>

          <span className="hidden h-px w-8 bg-neutral-400 sm:block" />
        </div>

        <h2 className="mt-1 font-serif text-[32px] font-normal leading-[0.95] tracking-[-0.035em] text-[#111] sm:text-[42px] lg:text-[48px]">
          Best Sellers
        </h2>

        <p className="mt-3 hidden max-w-[420px] text-[11px] leading-5 text-neutral-500 sm:block">
          Most loved. Most worn. Timeless pieces that define ARDENBY.
        </p>
        {productsLoading && (
          <p className="mt-2 text-[8px] font-medium uppercase tracking-[0.2em] text-neutral-400">
            Loading live collection...
          </p>
        )}
        {!productsLoading && productsError && (
          <p className="mt-2 text-[8px] font-medium uppercase tracking-[0.2em] text-neutral-400">
            Showing the latest available collection.
          </p>
        )}
      </div>

      {/* DESKTOP VIEW ALL */}
      <Link
        href="/shop"
        className="group hidden items-center gap-2 border-b border-black pb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-neutral-900 transition-colors hover:text-neutral-500 sm:flex"
      >
        Explore All Fits

        <ArrowUpRight
          className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </Link>
    </div>

    {/* ================= PRODUCTS ================= */}
    <div className="grid w-full grid-cols-2 gap-x-2.5 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-10">
      {bestSellers.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product as Product}
          index={index}
        />
      ))}
    </div>

    {/* ================= MOBILE VIEW ALL ================= */}
    <div className="mt-9 flex justify-center sm:hidden">
      <Link
        href="/shop"
        className="flex items-center gap-2 border-b border-black pb-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-900"
      >
        View All Best Sellers

        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>

  </div>
</section>

      {/* ================= NEW ARRIVALS ================= */}
      <section className="w-full px-3 py-6 sm:px-6 lg:px-10 lg:py-10">
  <div className="relative w-full overflow-hidden rounded-[28px] border border-black/10 bg-[#EFECE4] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.06)] sm:p-7 lg:p-10">

    {/* Subtle background detail */}
    <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-black/[0.025] blur-3xl" />

    {/* ================= HEADER ================= */}
    <div className="relative z-10 mb-7 border-b border-black/10 pb-6 sm:mb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

        {/* Heading */}
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-black/10 bg-white/60">
              <SlidersHorizontal className="h-2.5 w-2.5 text-neutral-700" />
            </span>

            <span className="text-[8px] font-semibold uppercase tracking-[0.3em] text-neutral-500 sm:text-[9px]">
              Fresh Drops • SS26
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-serif text-[30px] font-normal leading-none tracking-[-0.025em] text-neutral-950 sm:text-[40px] lg:text-[46px]">
              New Arrivals
            </h2>

            {/* Dynamic count */}
            <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-neutral-400">
              {filteredNewArrivals.length} Pieces
            </span>
          </div>

          <p className="mt-3 max-w-md text-[10px] leading-5 text-neutral-500 sm:text-[11px]">
            Discover the latest pieces added to the ARDENBY collection.
          </p>
        </div>

        {/* ================= FILTERS ================= */}
        <div className="w-full lg:w-auto lg:max-w-[620px]">
          <div className="scrollbar-none flex gap-1.5 overflow-x-auto pb-1">

            {[
              { id: "all", label: "All Fits" },
              { id: "supreme-edition", label: "Supreme Edition" },
              { id: "epic-thread", label: "Epic Thread" },
              { id: "ardenby-premium", label: "Ardenby Premium" },
              { id: "the-print-club", label: "Print Club" },
            ].map((tab) => {
              const isActive = selectedSubCat === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedSubCat(tab.id)}
                  className={`
                    group relative shrink-0 overflow-hidden
                    rounded-full border px-4 py-2
                    text-[8px] font-semibold uppercase
                    tracking-[0.17em]
                    transition-all duration-300
                    sm:px-5 sm:py-2.5
                    sm:text-[8.5px]
                    ${
                      isActive
                        ? "border-neutral-950 bg-neutral-950 text-white shadow-[0_5px_18px_rgba(0,0,0,0.18)]"
                        : "border-black/10 bg-white/70 text-neutral-600 hover:border-black/20 hover:bg-white hover:text-neutral-950 hover:shadow-sm"
                    }
                  `}
                >
                  {tab.label}

                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-white/70" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>

    {/* ================= PRODUCTS ================= */}
    {filteredNewArrivals.length > 0 ? (
      <div className="relative z-10 grid w-full grid-cols-2 gap-x-2.5 gap-y-7 sm:gap-x-4 sm:gap-y-9 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-10">
        {filteredNewArrivals.map((product, index) => (
          <div
            key={product.id}
            className="group min-w-0"
          >
            <ProductCard
              product={product as Product}
              index={index}
            />
          </div>
        ))}
      </div>
    ) : (
      /* ================= EMPTY STATE ================= */
      <div className="relative z-10 flex min-h-[280px] flex-col items-center justify-center px-5 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white/60 shadow-sm">
          <SlidersHorizontal className="h-4 w-4 text-neutral-500" />
        </div>

        <h3 className="font-serif text-xl text-neutral-950">
          No pieces found
        </h3>

        <p className="mt-2 max-w-xs text-[10px] leading-5 text-neutral-500">
          We couldn't find any new arrivals in this collection.
        </p>

        <button
          type="button"
          onClick={() => setSelectedSubCat("all")}
          className="mt-5 rounded-full bg-neutral-950 px-5 py-2.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg"
        >
          View All Pieces
        </button>
      </div>
    )}

    {/* ================= BOTTOM DETAIL ================= */}
    {filteredNewArrivals.length > 0 && (
      <div className="relative z-10 mt-8 flex items-center gap-3 border-t border-black/10 pt-5 sm:mt-10">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-950" />

        <p className="text-[8px] font-medium uppercase tracking-[0.25em] text-neutral-400">
          Curated for the new season
        </p>

        <span className="h-px flex-1 bg-black/10" />

        <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-neutral-400">
          ARDENBY
        </span>
      </div>
    )}
  </div>
</section>

      {/* ================= TRENDING NOW ================= */}
      {/* ================================================================
    TRENDING NOW
================================================================ */}

<section className="relative w-full overflow-hidden bg-[#F6F5F0] px-3 py-14 sm:px-6 sm:py-18 lg:px-10 lg:py-24">
  <div className="mx-auto w-full max-w-[1440px]">

    {/* ================= HEADER ================= */}
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease }}
      className="mb-8 flex items-end justify-between border-b border-black/10 pb-5 sm:mb-10 sm:pb-6"
    >
      <div>
        <div className="flex items-center gap-3">
          <span className="h-px w-7 bg-neutral-400" />

          <span className="text-[8px] font-semibold uppercase tracking-[0.28em] text-neutral-500 sm:text-[9px]">
            Community Top Picks
          </span>
        </div>

        <h2 className="mt-2 font-serif text-[32px] font-normal leading-[0.95] tracking-[-0.04em] text-neutral-950 sm:text-[42px] lg:text-[52px]">
          Trending Now
        </h2>

        <p className="mt-3 max-w-[420px] text-[10px] leading-5 text-neutral-500 sm:text-[11px]">
          Discover the pieces everyone is talking about this season.
        </p>
      </div>

      {/* DESKTOP CTA */}
      <Link
        href="/shop"
        className="group hidden items-center gap-2 border-b border-neutral-900 pb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-900 sm:flex"
      >
        Discover Trending

        <ArrowUpRight
          className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </Link>
    </motion.div>

    {/* ================= PRODUCT GRID ================= */}
    <div className="grid w-full grid-cols-2 gap-x-2.5 gap-y-9 sm:gap-x-4 sm:gap-y-12 lg:grid-cols-4 lg:gap-x-5">

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
          className="group min-w-0"
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
        className="group flex items-center gap-2 border-b border-neutral-900 pb-1.5 text-[8.5px] font-bold uppercase tracking-[0.2em] text-neutral-900"
      >
        Discover Trending

        <ArrowUpRight
          className="h-3.5 w-3.5 transition-transform duration-300 group-active:-translate-y-0.5 group-active:translate-x-0.5"
        />
      </Link>
    </div>

  </div>
</section>


{/* ================================================================
    BRAND PHILOSOPHY
================================================================ */}

<section className="w-full px-3 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
  <div className="relative mx-auto w-full max-w-[1440px] overflow-hidden bg-[#101010] px-5 py-10 text-[#F8F7F3] sm:px-8 sm:py-14 lg:px-12 lg:py-20">

    {/* SUBTLE BACKGROUND DETAIL */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full border border-white/[0.04]"
    />

    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full border border-white/[0.035]"
    />

    <div className="relative z-10">

      {/* ================= TOP HEADER ================= */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease }}
        className="grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:pb-14"
      >

        {/* LEFT */}
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-7 bg-amber-400/70" />

            <span className="text-[8px] font-semibold uppercase tracking-[0.3em] text-amber-400 sm:text-[9px]">
              Core Standard
            </span>
          </div>

          <h2 className="mt-3 max-w-[500px] font-serif text-[32px] font-normal leading-[0.98] tracking-[-0.045em] text-[#F8F7F3] sm:text-[42px] lg:text-[54px]">
            Crafted with precision.
            <br />
            Built for identity.
          </h2>
        </div>

        {/* RIGHT EDITORIAL COPY */}
        <div className="flex items-end lg:justify-end">
          <div className="max-w-[390px]">
            <p className="text-[8px] font-semibold uppercase tracking-[0.24em] text-white/35">
              The ARDENBY Standard
            </p>

            <p className="mt-4 font-serif text-[17px] leading-[1.45] text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.55)] sm:text-[20px]">
              Every silhouette is engineered around quality, comfort and
              individuality — without unnecessary compromise.
            </p>
          </div>
        </div>

      </motion.div>


      {/* ================= PHILOSOPHY GRID ================= */}
      <div className="grid sm:grid-cols-3">

        {philosophy.map((item, index) => (
          <motion.div
            key={item.num}
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.15,
            }}
            transition={{
              duration: 0.55,
              delay: index * 0.08,
              ease,
            }}
            className={`
              group
              relative
              py-7
              sm:px-6
              sm:py-9
              lg:px-8
              lg:py-11
              ${
                index !== philosophy.length - 1
                  ? "border-b border-white/10 sm:border-b-0 sm:border-r"
                  : ""
              }
            `}
          >

            {/* NUMBER */}
            <div className="flex items-center justify-between">

              <span className="font-mono text-[10px] tracking-[0.18em] text-amber-400 sm:text-[11px]">
                {item.num}
              </span>

              <ArrowUpRight
                className="
                  h-3.5
                  w-3.5
                  text-white/20
                  transition-all
                  duration-300
                  group-hover:-translate-y-0.5
                  group-hover:translate-x-0.5
                  group-hover:text-amber-400
                "
              />

            </div>

            {/* TITLE */}
            <h3 className="mt-6 max-w-[250px] font-serif text-[20px] font-normal leading-[1.05] tracking-[-0.02em] text-white sm:text-[22px] lg:text-[25px]">
              {item.title}
            </h3>

            {/* DESCRIPTION */}
            <p className="mt-3 max-w-[300px] text-[10px] font-light leading-[1.7] text-white/45 sm:text-[11px]">
              {item.desc}
            </p>

            {/* BOTTOM INDEX */}
            <div className="mt-7 flex items-center gap-2">

              <span className="h-px w-5 bg-white/15 transition-all duration-300 group-hover:w-9 group-hover:bg-amber-400/70" />

              <span className="text-[7px] font-semibold uppercase tracking-[0.2em] text-white/25">
                ARDENBY
              </span>

            </div>

          </motion.div>
        ))}

      </div>

    </div>
  </div>
</section>


{/* ================================================================
    REVIEWS
================================================================ */}

<section className="w-full bg-[#F8F7F3] px-3 py-14 sm:px-6 sm:py-18 lg:px-10 lg:py-24">
  <div className="mx-auto w-full max-w-[1440px]">

    {/* ================= HEADER ================= */}
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease }}
      className="text-center"
    >

      <div className="flex items-center justify-center gap-3">
        <span className="h-px w-7 bg-neutral-300" />

        <span className="text-[8px] font-semibold uppercase tracking-[0.28em] text-neutral-400 sm:text-[9px]">
          Real Customer Reviews
        </span>

        <span className="h-px w-7 bg-neutral-300" />
      </div>

      <h2 className="mt-3 font-serif text-[32px] font-normal leading-none tracking-[-0.04em] text-neutral-950 sm:text-[42px] lg:text-[50px]">
        What The Fam Says
      </h2>

      {/* RATING */}
      <div className="mt-4 flex items-center justify-center gap-3">

        <div className="flex gap-0.5 text-amber-500">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className="h-3 w-3 fill-current sm:h-3.5 sm:w-3.5"
            />
          ))}
        </div>

        <span className="h-3 w-px bg-neutral-300" />

        <span className="text-[8px] font-semibold uppercase tracking-[0.15em] text-neutral-500 sm:text-[9px]">
          4.9 / 5 Rating
        </span>

      </div>

    </motion.div>


    {/* ================= REVIEW GRID ================= */}
    <div className="mt-9 grid gap-3 sm:mt-12 sm:gap-5 md:grid-cols-3">

      {reviews.map((review, index) => (
        <motion.article
          key={review.name}
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
            amount: 0.15,
          }}
          transition={{
            duration: 0.55,
            delay: index * 0.08,
            ease,
          }}
          className="
            group
            relative
            flex
            min-h-[270px]
            flex-col
            justify-between
            overflow-hidden
            border
            border-black/10
            bg-white
            p-5
            transition-all
            duration-500
            hover:-translate-y-1
            hover:border-black/20
            hover:shadow-[0_18px_50px_rgba(0,0,0,0.07)]
            sm:min-h-[320px]
            sm:p-7
            lg:p-8
          "
        >

          {/* QUOTE MARK */}
          <span
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              right-5
              top-1
              font-serif
              text-[75px]
              leading-none
              text-black/[0.045]
              transition-transform
              duration-500
              group-hover:translate-y-1
              sm:right-7
              sm:text-[90px]
            "
          >
            “
          </span>


          {/* REVIEW CONTENT */}
          <div className="relative z-10">

            {/* STARS */}
            <div className="flex gap-0.5 text-amber-500">
              {[...Array(review.rating)].map((_, i) => (
                <Star
                  key={i}
                  className="h-3 w-3 fill-current"
                />
              ))}
            </div>

            {/* REVIEW TEXT */}
            <p className="mt-5 max-w-[360px] font-serif text-[15px] leading-[1.65] tracking-[-0.01em] text-neutral-800 sm:mt-6 sm:text-[17px] sm:leading-[1.7]">
              “{review.text}”
            </p>

          </div>


          {/* REVIEWER */}
          <div className="relative z-10 mt-8 border-t border-black/8 pt-4">

            <div className="flex items-center justify-between gap-3">

              <div className="flex items-center gap-3">

                {/* INITIAL */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-neutral-950 font-serif text-sm text-white sm:h-10 sm:w-10">
                  {review.name.charAt(0)}
                </div>

                <div>

                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-900 sm:text-[10px]">
                    {review.name}
                  </p>

                  <div className="mt-1 flex items-center gap-1.5">
                    <Check className="h-2.5 w-2.5 text-emerald-600" />

                    <span className="text-[7px] font-semibold uppercase tracking-[0.14em] text-emerald-600 sm:text-[8px]">
                      {review.tag}
                    </span>
                  </div>

                </div>

              </div>

              {/* REVIEW NUMBER */}
              <span className="font-mono text-[8px] tracking-[0.18em] text-neutral-300">
                0{index + 1}
              </span>

            </div>

          </div>

        </motion.article>
      ))}

    </div>


    {/* ================= BOTTOM EDITORIAL LINE ================= */}
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="mt-10 flex items-center justify-center gap-3 sm:mt-12"
    >
      <span className="h-px w-10 bg-neutral-200" />

      <span className="text-[7px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
        Worn by the community
      </span>

      <span className="h-px w-10 bg-neutral-200" />
    </motion.div>

  </div>
</section>
      {/* ================= NEWSLETTER ================= */}
     
    </main>
  );
}