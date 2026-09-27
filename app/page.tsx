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
      {/* ================= HERO SECTION ================= */
     <section
        className="relative z-0 w-full max-w-none overflow-hidden bg-[#F6F5F0] min-h-[560px] h-[calc(100svh-76px)] sm:h-[calc(100svh-84px)] md:h-[calc(100svh-76px)] lg:h-[calc(100svh-128px)] lg:min-h-0"
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
                <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-neutral-900">
                  Premium Drop • SS26
                </p>
                <p className="mt-1 text-[8px] text-neutral-500">
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
                className="absolute inset-x-0 top-[72px] z-10 flex w-full justify-center overflow-visible px-0 text-center"
              >
                <h1
                  className="
                    w-full max-w-none px-0
                    font-serif font-black uppercase
                    text-[72px] leading-[0.74] tracking-[-0.065em]
                    text-neutral-950
                    sm:text-[82px]
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

            {/* transparent red sprint / screen-print shadow behind model */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[15] overflow-hidden"
            >
              <div className="absolute left-1/2 top-[56%] h-[230px] w-[520px] -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] opacity-90">
                <div className="absolute inset-[10%] rounded-[45%] bg-[#A51F2A]/[0.035] blur-[10px]" />
                <div className="absolute left-[3%] top-[27%] h-[16px] w-[70%] -rotate-[3deg] -skew-x-[18deg] rounded-full bg-[#A51F2A]/[0.045] blur-[3px]" />
                <div className="absolute right-[6%] top-[39%] h-[6px] w-[62%] rotate-[2deg] -skew-x-[18deg] rounded-full bg-[#C42B35]/[0.06] blur-[1px]" />
                <div className="absolute left-[8%] top-[51%] h-[3px] w-[82%] -rotate-[4deg] -skew-x-[18deg] rounded-full bg-[#A51F2A]/[0.075]" />
                <div className="absolute left-[22%] top-[64%] h-[4px] w-[55%] rotate-[1deg] -skew-x-[18deg] rounded-full bg-[#C42B35]/[0.055] blur-[1px]" />
              </div>
            </div>

            {/* MOBILE MODEL — sits IN FRONT of the headline */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-[78%] w-full items-end justify-center sm:h-[82%]">
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
                      h-full w-auto max-w-none
                      scale-[1.18]
                      object-contain object-bottom
                      drop-shadow-[0_4px_8px_rgba(0,0,0,0.035)]
                      sm:scale-[1.12]
                    "
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* mobile slide counter */}
            <div className="absolute bottom-4 left-4 z-[80] flex items-center gap-2">
              <span className="text-[9px] font-bold tracking-[0.18em] text-neutral-900">
                {String(slide + 1).padStart(2, "0")}
              </span>
              <span className="h-px w-7 bg-neutral-300" />
              <span className="text-[9px] tracking-[0.18em] text-neutral-400">
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
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-900">
                  Premium Drop • SS26
                </p>
                <p className="mt-1 text-[10px] font-light text-neutral-500">
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
                  className="w-full max-w-[1450px] text-center font-serif text-[64px] font-black uppercase leading-[0.78] tracking-[-0.05em] text-neutral-950 md:text-[78px] lg:text-[clamp(84px,8.5vw,132px)]"
                  style={{
                    fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
                    textShadow: "0 1px 0 rgba(0,0,0,0.05)",
                  }}
                >
                  {activeHero.headline}
                </h1>
              </motion.div>
            </AnimatePresence>

            {/* transparent red sprint / screen-print shadow behind model */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
            >
              <div className="absolute left-1/2 top-[54%] h-[360px] w-[720px] -translate-x-1/2 -translate-y-1/2 rotate-[-7deg] opacity-95 lg:h-[430px] lg:w-[900px]">
                {/* broad transparent red ghost */}
                <div className="absolute inset-[8%] rounded-[45%] bg-[#A51F2A]/[0.035] blur-[14px]" />

                {/* organic screen-print / sprint streaks */}
                <div className="absolute left-[1%] top-[19%] h-[28px] w-[72%] -rotate-[2deg] -skew-x-[17deg] rounded-full bg-[#A51F2A]/[0.045] blur-[4px]" />
                <div className="absolute right-[2%] top-[28%] h-[13px] w-[48%] rotate-[1deg] -skew-x-[19deg] rounded-full bg-[#C42B35]/[0.065] blur-[2px]" />
                <div className="absolute left-[4%] top-[38%] h-[7px] w-[91%] -rotate-[4deg] -skew-x-[18deg] rounded-full bg-[#A51F2A]/[0.075] blur-[1px]" />
                <div className="absolute left-[17%] top-[48%] h-[4px] w-[68%] rotate-[-2deg] -skew-x-[20deg] rounded-full bg-[#C42B35]/[0.065]" />
                <div className="absolute right-[7%] top-[56%] h-[10px] w-[61%] rotate-[2deg] -skew-x-[18deg] rounded-full bg-[#A51F2A]/[0.055] blur-[2px]" />
                <div className="absolute left-[8%] top-[66%] h-[5px] w-[52%] rotate-[-3deg] -skew-x-[19deg] rounded-full bg-[#C42B35]/[0.06] blur-[1px]" />
                <div className="absolute left-[27%] top-[75%] h-[3px] w-[63%] rotate-[1deg] -skew-x-[18deg] rounded-full bg-[#A51F2A]/[0.05]" />

                {/* broken ink fragments */}
                <div className="absolute left-[11%] top-[25%] h-[2px] w-[76px] rotate-[-9deg] bg-[#A51F2A]/[0.075]" />
                <div className="absolute right-[17%] top-[35%] h-[2px] w-[105px] rotate-[5deg] bg-[#C42B35]/[0.065]" />
                <div className="absolute left-[19%] top-[61%] h-[2px] w-[64px] rotate-[-6deg] bg-[#A51F2A]/[0.07]" />
                <div className="absolute right-[22%] top-[72%] h-[2px] w-[88px] rotate-[4deg] bg-[#C42B35]/[0.06]" />
              </div>
            </div>

            {/* desktop model */}
            <div className="pointer-events-none absolute inset-0 z-50 flex items-end justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`desktop-model-${slide}`}
                  initial={{ opacity: 0, y: 18, scale: 1.01 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.6, ease }}
                  className="relative z-50 flex h-full w-full items-end justify-center md:translate-y-0"
                >
                  <div className="absolute bottom-[28px] left-1/2 h-[390px] w-[340px] -translate-x-1/2 rounded-full bg-neutral-400/[0.035] blur-[42px] lg:h-[420px] lg:w-[380px]" />

                  <img
                    src={transparentHeroImages[slide % transparentHeroImages.length]}
                    alt={activeHero.headline}
                    className="relative z-50 h-[79%] w-auto max-w-[96%] object-contain object-bottom drop-shadow-[0_7px_12px_rgba(0,0,0,0.06)] lg:h-[82%] lg:max-w-[60%]"
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
                className="absolute left-6 top-[175px] z-30 hidden w-[270px] md:block lg:left-9 lg:top-[185px] xl:left-12"
              >
                <p className="text-[16px] font-bold uppercase tracking-[0.2em] text-neutral-900 lg:text-[17px]">
                  Move Comfortably
                </p>
                <div className="mt-3 h-px w-14 bg-neutral-300" />
                <p className="mt-4 max-w-[290px] text-[17px] font-light leading-[1.6] text-neutral-500 lg:text-[18px]">
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
                className="absolute right-6 top-[175px] z-30 hidden w-[270px] text-right md:block lg:right-9 lg:top-[185px] xl:right-12"
              >
                <p className="text-[14px] font-bold uppercase tracking-[0.22em] text-neutral-900 lg:text-[15px]">
                  Feel Confident
                </p>
                <div className="mt-3 ml-auto h-px w-14 bg-neutral-300" />
                <p className="mt-4 ml-auto max-w-[290px] text-[17px] font-light leading-[1.6] text-neutral-500 lg:text-[18px]">
                  Crafted for a refined everyday look with effortless comfort.
                </p>
              </motion.div>
            </AnimatePresence>

            {/* desktop editorial note */}
            <div className="absolute bottom-[72px] left-8 z-[55] hidden max-w-[280px] lg:block xl:left-12">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-px w-7 bg-neutral-900/35" />
                
              </div>
             
              <p className="mt-3 max-w-[280px] text-[16px] leading-[1.6] text-neutral-600/75">
                Refined silhouettes, premium fabric and quiet confidence.
              </p>
            </div>

            {/* desktop counter */}
            <div className="absolute bottom-4 left-5 z-[60] flex items-center gap-2 sm:bottom-5 sm:left-7 lg:left-9">
              <span className="text-[9px] font-bold tracking-[0.18em] text-neutral-900 sm:text-[10px]">
                {String(slide + 1).padStart(2, "0")}
              </span>
              <span className="h-px w-6 bg-neutral-300 sm:w-8" />
              <span className="text-[9px] tracking-[0.18em] text-neutral-400 sm:text-[10px]">
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
}

    {/* =========================================================
    ARDENBY STANDARD — EDITORIAL SPLIT
========================================================= */}

<section className="w-full overflow-hidden bg-[#F6F5F0] lg:h-[calc(100svh-128px)] lg:min-h-0">
  <div className="grid h-full w-full grid-cols-1 lg:grid-cols-[55%_45%]">

    {/* =====================================================
        LEFT IMAGE
    ===================================================== */}

    <div className="group relative h-[600px] w-full overflow-hidden sm:h-[700px] lg:h-full">

      <img
        src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=92"
        alt="ARDENBY craft and collection"
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1400ms] group-hover:scale-[1.025]"
      />

      {/* Image overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

      {/* ===================================================
          RED ARDENBY SPRINT EFFECT
      =================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[48%] h-[390px] w-[95%] -translate-x-1/2 -translate-y-1/2 rotate-[-5deg]">

          <div className="absolute inset-[10%] rounded-[45%] bg-[#A51F2A]/[0.045] blur-[22px]" />

          <div className="absolute left-[-5%] top-[14%] h-[25px] w-[72%] -skew-x-[20deg] rounded-full bg-[#C52D38]/[0.12] blur-[5px]" />

          <div className="absolute right-[-3%] top-[27%] h-[9px] w-[60%] rotate-[2deg] -skew-x-[18deg] rounded-full bg-[#A51F2A]/[0.14] blur-[2px]" />

          <div className="absolute left-[-7%] top-[40%] h-[6px] w-[94%] -rotate-[2deg] -skew-x-[20deg] rounded-full bg-[#C52D38]/[0.16]" />

          <div className="absolute left-[12%] top-[53%] h-[14px] w-[72%] rotate-[1deg] -skew-x-[18deg] rounded-full bg-[#A51F2A]/[0.11] blur-[3px]" />

          <div className="absolute right-[2%] top-[66%] h-[5px] w-[56%] -rotate-[4deg] -skew-x-[20deg] rounded-full bg-[#C52D38]/[0.14]" />

          <div className="absolute left-[6%] top-[78%] h-[3px] w-[46%] rotate-[2deg] -skew-x-[18deg] rounded-full bg-[#A51F2A]/[0.16]" />

          <span className="absolute left-[12%] top-[25%] h-[2px] w-[82px] rotate-[-8deg] bg-[#C52D38]/[0.20]" />

          <span className="absolute right-[17%] top-[36%] h-[2px] w-[108px] rotate-[5deg] bg-[#A51F2A]/[0.18]" />

          <span className="absolute left-[24%] top-[68%] h-[2px] w-[72px] rotate-[-6deg] bg-[#C52D38]/[0.18]" />

          <span className="absolute right-[12%] top-[76%] h-[2px] w-[94px] rotate-[4deg] bg-[#A51F2A]/[0.15]" />

        </div>
      </div>

      {/* Top label */}

      <div className="absolute left-6 top-6 sm:left-10 sm:top-9 lg:left-12 lg:top-11">
        <span className="text-[9px] font-bold uppercase tracking-[0.32em] text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.55)] sm:text-[10px]">
          ARDENBY / CRAFT
        </span>
      </div>

      {/* Image text */}

      <div className="absolute bottom-9 left-6 right-6 sm:bottom-12 sm:left-10 sm:right-10 lg:bottom-14 lg:left-12 lg:right-12">

        <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.30em] text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.65)] sm:text-[11px]">
          Quality · Craft · Intention
        </p>

        <h2
          className="max-w-[760px] font-serif text-[64px] font-medium leading-[0.82] tracking-[-0.055em] text-white [text-shadow:0_3px_15px_rgba(0,0,0,0.58)] sm:text-[88px] lg:text-[112px] xl:text-[126px]"
          style={{
            fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
          }}
        >
          Made for
          <br />
          everyday.
        </h2>

        <div className="mt-5 h-[5px] w-[150px] -rotate-[3deg] rounded-full bg-[#C52D38] sm:w-[190px]" />

        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.27em] text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.6)] sm:text-[13px]">
          Premium essentials for modern living.
        </p>

      </div>
    </div>


    {/* =====================================================
        RIGHT EDITORIAL PANEL
    ===================================================== */}

    <div className="hidden min-h-[600px] flex-col bg-[#F6F5F0] sm:min-h-[700px] lg:flex lg:min-h-0">

      <div className="flex flex-1 flex-col justify-center px-7 py-14 sm:px-10 sm:py-16 lg:px-14 lg:py-14 xl:px-16">

        <div className="flex items-center justify-between">

          <span className="text-[9px] font-bold uppercase tracking-[0.30em] text-neutral-500 sm:text-[10px]">
            01 — Philosophy
          </span>

          <span className="text-[8px] uppercase tracking-[0.22em] text-neutral-400 sm:text-[9px]">
            AR / 01
          </span>

        </div>

        <h2
          className="mt-8 font-serif text-[62px] font-medium leading-[0.84] tracking-[-0.055em] text-neutral-950 sm:text-[76px] lg:text-[86px] xl:text-[98px]"
          style={{
            fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
          }}
        >
          Made With
          <br />
          Intention.
        </h2>

        <p className="mt-7 max-w-[650px] text-[14px] leading-[1.75] text-neutral-600 sm:text-[16px] lg:text-[17px]">
          From the first stitch to the final delivery, every detail
          is considered. Premium clothing doesn't need to shout —
          quality speaks through the fabric, construction and fit.
        </p>

        {/* CTA */}

        <Link
          href="/shop"
          className="group mt-9 flex w-fit items-center gap-6 bg-[#0B0B0B] px-7 py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-colors duration-300 hover:bg-[#A51F2A] sm:px-9 sm:py-5 sm:text-[11px]"
        >
          <span>Explore the standard</span>

          <span className="text-[18px] leading-none transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </Link>

      </div>


      {/* ===================================================
          DETAIL CARDS

          MOBILE  : HIDDEN
          DESKTOP : VISIBLE

          IMPORTANT:
          Cards are NOT deleted.
      =================================================== */}

      <div className="grid w-full grid-cols-1 border-t border-neutral-300/70 sm:grid-cols-3">

        {/* MATERIAL */}

        <div className="hidden bg-[#EFEEE9] p-7 sm:block lg:p-8">

          <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-neutral-500">
            Material
          </span>

          <div className="mt-4 flex items-end gap-2">

            <span
              className="font-serif text-[48px] leading-none tracking-[-0.05em] text-neutral-950 sm:text-[54px]"
              style={{
                fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
              }}
            >
              240
            </span>

            <span className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500">
              GSM
            </span>

          </div>

          <p className="mt-3 text-[10px] leading-[1.6] text-neutral-500 sm:text-[11px]">
            Heavyweight
            <br />
            combed cotton.
          </p>

        </div>


        {/* CONSTRUCTION */}

        <div className="hidden border-l border-neutral-300/70 bg-[#E9E7E1] p-7 sm:block lg:p-8">

          <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-neutral-500">
            Construction
          </span>

          <h3
            className="mt-5 font-serif text-[30px] leading-[0.88] tracking-[-0.04em] text-neutral-950 sm:text-[36px] lg:text-[38px]"
            style={{
              fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
            }}
          >
            Precision
            <br />
            in every
            <br />
            stitch.
          </h3>

          <div className="mt-5 h-[1px] w-10 bg-neutral-900" />

        </div>


        {/* PHILOSOPHY */}

        <div className="hidden border-l border-neutral-300/70 bg-[#E2E0DA] p-7 sm:block lg:p-8">

          <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-neutral-500">
            Philosophy
          </span>

          <h3
            className="mt-5 font-serif text-[30px] leading-[0.88] tracking-[-0.04em] text-neutral-950 sm:text-[36px] lg:text-[38px]"
            style={{
              fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
            }}
          >
            Built
            <br />
            beyond
            <br />
            seasons.
          </h3>

          <div className="mt-5 h-[1px] w-10 bg-neutral-900" />

        </div>

      </div>

    </div>

  </div>
</section>
<section className="w-full overflow-hidden bg-[#F5F2EC] px-4 py-8 sm:px-6 sm:py-9 lg:h-[calc(100svh-128px)] lg:min-h-0 lg:px-8 lg:py-7 xl:py-8 lg:translate-y-[18px]">
  {/* ============================================================
      ARDENBY — SHOP BY CATEGORY
      DESIGN 01 — REFINED ASYMMETRIC EDITORIAL GRID
      Compact, balanced and designed to stay inside one desktop viewport.
  ============================================================ */}

  <div className="mx-auto flex h-full w-full max-w-[1380px] flex-col">
    {/* SECTION HEADER */}
    <div className="mb-5 flex shrink-0 items-end justify-between gap-6 lg:mb-4">
      <div>
        <div className="mb-2 flex items-center gap-2.5">
          <span className="h-px w-7 bg-[#8F1D24]" />
           <span className="text-[9px] font-medium uppercase tracking-[0.28em] text-neutral-500 sm:text-[8.5px]">
              ARDENBY / COLLECTION
            </span>
        </div>

        <h6
          className="text-[34px] font-normal leading-[0.9] tracking-[-0.035em] text-[#11100F] sm:text-[46px] lg:text-[54px] xl:text-[58px]"
          style={{
            fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
          }}
        >
          Category
        </h6>

        <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-[#77716A] sm:text-[12px] lg:text-[13px]">
          Build your everyday uniform.
        </p>
      </div>

      <Link
        href="/shop"
        className="group hidden shrink-0 items-center gap-1.5 border-b border-[#11100F]/50 pb-1.5 text-[7px] font-bold uppercase tracking-[0.22em] text-[#11100F] transition-colors hover:border-[#8F1D24] hover:text-[#8F1D24] sm:flex"
      >
        <span>Explore All</span>
        <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </div>

    {/* ============================================================
        DESKTOP — REFINED ASYMMETRIC GRID
        4 / 4 / 4 top balance + 4 / 5 / 3 bottom rhythm.
    ============================================================ */}
    <div className="hidden min-h-0 flex-1 grid-cols-12 grid-rows-2 gap-2.5 lg:grid xl:gap-3">
      {categories.slice(0, 4).map((cat, index) => {
        const staticCatProduct = staticHomeProducts.find(
          (p) => p.category === cat.slug,
        );
        const catProduct = products.find((p) => p.category === cat.slug);

        const webImages = [
          // Supreme Edition — editorial menswear portrait
          "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1400&q=90",
          // Epic Thread — clothing rack / fashion edit
          "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1400&q=90",
          // Ardenby Premium — fashion portrait
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=90",
          // The Print Club — flat lay fashion
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1400&q=90",
        ];

        const productImage =
          webImages[index] ||
          staticCatProduct?.images?.[0] ||
          catProduct?.images?.[0];

        const isFeatured = index === 0;

        const desktopSpan = [
          "col-span-4 row-span-2",
          "col-span-4 row-span-1",
          "col-span-4 row-span-1",
          "col-span-5 row-span-1 col-start-5 row-start-2",
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
            className={`${desktopSpan} min-h-0`}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.48, delay: index * 0.055 }}
          >
            <Link
              href={`/shop?category=${cat.slug}`}
              className="group relative block h-full min-h-0 overflow-hidden bg-[#DDD5C8]"
            >
              <div className="relative h-full min-h-0">
                <img
                  src={productImage}
                  alt={cat.name}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {isFeatured && (
                  <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 sm:left-4 sm:top-4">
                    <span className="h-[2px] w-5 bg-[#E21B23]" />
                    <span className="text-[6px] font-bold uppercase tracking-[0.23em] text-white drop-shadow-[0_1px_5px_rgba(0,0,0,0.8)]">
                      Featured Category
                    </span>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-3.5 xl:p-4">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[6px] font-semibold uppercase tracking-[0.2em] text-white/80">
                      {label}
                    </span>

                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/70 bg-black/15 text-white backdrop-blur-sm transition-all duration-300 group-hover:bg-white group-hover:text-[#11100F]">
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>

                  <h3
                    className={
                      isFeatured
                        ? "text-[30px] font-normal leading-[0.86] tracking-[-0.045em] text-white sm:text-[36px] xl:text-[42px]"
                        : "text-[25px] font-normal leading-[0.88] tracking-[-0.04em] text-white sm:text-[28px] xl:text-[32px]"
                    }
                    style={{
                      fontFamily:
                        "Bodoni MT, Didot, Times New Roman, serif",
                      textShadow:
                        "0 2px 9px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)",
                    }}
                  >
                    {cat.name}
                  </h3>

                  <p
                    className={
                      isFeatured
                        ? "mt-2.5 max-w-[440px] text-[12px] leading-[1.55] text-white/95 sm:text-[13px] xl:text-[14px]"
                        : "mt-2.5 max-w-[360px] text-[11px] leading-[1.55] text-white/95 sm:text-[12px] xl:text-[13px]"
                    }
                  >
                    {copy}
                  </p>

                  {isFeatured && (
                    <span className="mt-2.5 inline-flex items-center gap-1.5 bg-white px-3 py-1.5 text-[6px] font-bold uppercase tracking-[0.19em] text-[#11100F] transition-transform duration-300 group-hover:-translate-y-0.5">
                      Shop Collection
                      <ArrowRight className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}

      {/* ALL PRODUCTS — SMALLER COUNTERWEIGHT */}
      <motion.div
        className="col-span-3 col-start-10 row-start-2 min-h-0"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.48, delay: 0.24 }}
      >
        <Link
          href="/shop"
          className="group block h-full min-h-0 overflow-hidden bg-[#CFC5B6]"
        >
          <div className="relative h-full min-h-0">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=90"
              alt="All Ardenby Products"
              className="h-full w-full object-cover object-[center_28%] transition-transform duration-700 ease-out group-hover:scale-[1.035]"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-3.5">
              <p className="mb-1.5 text-[6px] font-bold uppercase tracking-[0.2em] text-white/80">
                05 / COMPLETE COLLECTION
              </p>

              <div className="flex items-end justify-between gap-2">
                <h3
                  className="text-[23px] font-normal leading-[0.88] tracking-[-0.04em] text-white sm:text-[26px]"
                  style={{
                    fontFamily:
                      "Bodoni MT, Didot, Times New Roman, serif",
                    textShadow: "0 2px 9px rgba(0,0,0,0.85)",
                  }}
                >
                  All Products
                </h3>

                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/70 bg-black/15 text-white backdrop-blur-sm transition-all duration-300 group-hover:bg-white group-hover:text-[#11100F]">
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>

    {/* ============================================================
        MOBILE — CLEAN 2 COLUMN EDITORIAL GRID
    ============================================================ */}
    <div className="grid grid-cols-2 gap-2 lg:hidden">
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
              className="group block overflow-hidden bg-[#DDD5C8]"
            >
              <div
                className={
                  isFeatured
                    ? "relative h-[270px] sm:h-[320px]"
                    : "relative h-[185px] sm:h-[215px]"
                }
              >
                <img
                  src={productImage}
                  alt={cat.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 z-10 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[6px] font-bold uppercase tracking-[0.18em] text-white/80">
                      0{index + 1} / COLLECTION
                    </span>
                    <ArrowUpRight className="h-3 w-3 text-white" />
                  </div>

                  <h3
                    className={
                      isFeatured
                        ? "text-[30px] font-normal leading-[0.86] tracking-[-0.04em] text-white sm:text-[36px]"
                        : "text-[19px] font-normal leading-[0.88] tracking-[-0.035em] text-white"
                    }
                    style={{
                      fontFamily:
                        "Bodoni MT, Didot, Times New Roman, serif",
                      textShadow:
                        "0 2px 8px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.9)",
                    }}
                  >
                    {cat.name}
                  </h3>

                  <p className="mt-1.5 max-w-[90%] text-[9px] leading-[1.45] text-white/90 sm:text-[10px]">
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
          className="group flex min-h-[70px] items-center justify-between border border-[#11100F]/15 bg-[#E4DDD2] px-4 py-3 transition-colors duration-300 hover:bg-[#DDD4C7]"
        >
          <div>
            <p className="mb-1 text-[6px] font-bold uppercase tracking-[0.2em] text-[#8F1D24]">
              05 / COMPLETE COLLECTION
            </p>
            <h3
              className="text-[23px] font-normal leading-none tracking-[-0.035em] text-[#11100F]"
              style={{
                fontFamily:
                  "Bodoni MT, Didot, Times New Roman, serif",
              }}
            >
              All Products
            </h3>
          </div>

          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#11100F]/30 transition-all duration-300 group-hover:bg-[#11100F] group-hover:text-white">
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </Link>
      </motion.div>
    </div>
  </div>
</section>
<section className="ardenby-product-section w-full bg-[#f8f7f3] px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-16 lg:px-10 lg:pb-20 lg:pt-20">
  <div className="mx-auto w-full max-w-[1440px]">

    {/* ================= HEADER ================= */}
    <div className="mb-6 border-b border-black/10 pb-6 sm:mb-8 sm:pb-7 lg:mb-9 lg:pb-8">
      <div className="flex items-end justify-between">

        {/* LEFT CONTENT */}
        <div className="min-w-0">

          {/* EYEBROW */}
          <div className="mb-2 flex items-center gap-2.5 sm:mb-2.5">
            <span className="text-[9px] font-medium uppercase tracking-[0.28em] text-neutral-500 sm:text-[8.5px]">
              ARDENBY / COLLECTION
            </span>

            <span className="hidden h-px w-7 bg-neutral-300 sm:block" />

            <span className="hidden text-[7.5px] font-medium uppercase tracking-[0.22em] text-neutral-400 sm:block">
              04 ITEMS
            </span>
          </div>

          {/* TITLE */}
          <h2 className="font-serif text-[42px] font-normal leading-[0.92] tracking-[-0.045em] text-[#111] sm:text-[42px] lg:text-[48px]">
            Best Sellers
          </h2>

          {/* DESCRIPTION */}
          <p className="mt-3 max-w-[420px] text-[12px] leading-[1.6] text-neutral-500 sm:text-[10.5px]">
            Most loved. Most worn. Timeless pieces that define ARDENBY.
          </p>

          {/* LOADING */}
          {productsLoading && (
            <p className="mt-2 text-[8.5px] font-medium uppercase tracking-[0.2em] text-neutral-400">
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
          className="group hidden shrink-0 items-center gap-2 border-b border-black pb-1.5 text-[8.5px] font-semibold uppercase tracking-[0.2em] text-neutral-900 transition-colors duration-300 hover:text-neutral-500 sm:flex"
        >
          Explore All Fits

          <ArrowUpRight
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </div>

    {/* ================= PRODUCTS ================= */}
    <div className="grid w-full grid-cols-2 gap-x-2.5 gap-y-9 sm:gap-x-4 sm:gap-y-11 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-12">
      {bestSellers.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product as Product}
          index={index}
        />
      ))}
    </div>

    {/* ================= MOBILE VIEW ALL ================= */}
    <div className="mt-10 flex w-full justify-center sm:hidden">
      <Link
        href="/shop"
        className="group mx-auto flex items-center justify-center gap-2 border-b border-black pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-neutral-900"
      >
        View All Best Sellers

        <ArrowUpRight
          className="h-3.5 w-3.5 transition-transform duration-300 group-active:-translate-y-0.5 group-active:translate-x-0.5"
        />
      </Link>
    </div>

  </div>
</section>
      {/* ================= NEW ARRIVALS ================= */}
      <section className="ardenby-product-section w-full px-3 py-6 sm:px-6 lg:px-10 lg:py-10">
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

            <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-neutral-500 sm:text-[9px]">
              Fresh Drops • SS26
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-serif text-[38px] font-normal leading-none tracking-[-0.03em] text-neutral-950 sm:text-[40px] lg:text-[46px]">
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

<section className="ardenby-product-section relative w-full overflow-hidden bg-[#F6F5F0] px-3 py-14 sm:px-6 sm:py-18 lg:px-10 lg:py-24">
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

          <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-neutral-500 sm:text-[9px]">
            Community Top Picks
          </span>
        </div>

        <h2 className="mt-2 font-serif text-[42px] font-normal leading-[0.92] tracking-[-0.045em] text-neutral-950 sm:text-[42px] lg:text-[52px]">
          Trending Now
        </h2>

        <p className="mt-3 max-w-[420px] text-[12px] leading-[1.6] text-neutral-500 sm:text-[11px]">
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
        className="group flex items-center gap-2 border-b border-neutral-900 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em] text-neutral-900"
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