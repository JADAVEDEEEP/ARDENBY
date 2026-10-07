"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
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

/* Shared header for the mobile sections (label / heading / action). */
function MobileSectionHeader({
  label,
  title,
  href,
  actionLabel = "View all",
  meta,
}: {
  label: string;
  title: string;
  href?: string;
  actionLabel?: string;
  meta?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-white/10 pb-4">
      <div className="min-w-0">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
          {label}
        </p>
        <h2
          className="font-serif text-[30px] leading-[1.05] tracking-[-0.03em] text-[#F3E5AB]"
          style={{ fontFamily: "Bodoni MT, Didot, Times New Roman, serif" }}
        >
          {title}
        </h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="-mb-1 flex min-h-[44px] shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#D4AF37]"
        >
          {actionLabel} <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      ) : meta ? (
        <span className="pb-1 text-[10px] uppercase tracking-[0.16em] text-neutral-400">
          {meta}
        </span>
      ) : null}
    </div>
  );
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
    <MotionConfig reducedMotion="user">
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

        /* =========================================================
           MOBILE PRODUCT CARD — ORIGINAL LOOK
           Only fix BESTSELLER badge text visibility.
        ========================================================= */
        .kovenik-mobile-product-card {
          border-radius: 0 !important;
          background: #0b0b0b !important;
          color: #f5f5f5 !important;
        }

        /* KEEP PRODUCT IMAGE EXACTLY AS THE ORIGINAL IMAGE */
        .kovenik-mobile-product-card img {
          border-radius: 0 !important;
          filter: none !important;
          opacity: 1 !important;
        }

        /* Product information stays visible */
        .kovenik-mobile-product-card h3,
        .kovenik-mobile-product-card h4 {
          color: #f5f5f5 !important;
          opacity: 1 !important;
          text-shadow: none !important;
        }

        .kovenik-mobile-product-card p {
          color: #d4d4d4 !important;
          opacity: 1 !important;
          text-shadow: none !important;
        }

        /* Rating / gold accents */
        .kovenik-mobile-product-card [class*="text-yellow"],
        .kovenik-mobile-product-card [class*="text-amber"] {
          color: #D4AF37 !important;
          opacity: 1 !important;
        }

        /* Best Price stays green */
        .kovenik-mobile-product-card [class*="text-emerald"] {
          color: #10b981 !important;
          opacity: 1 !important;
        }

        /* PRODUCT PRICE + MRP — WHITE ON MOBILE */
        .kovenik-mobile-product-card [class*="text-neutral-900"],
        .kovenik-mobile-product-card [class*="text-neutral-950"] {
          color: #ffffff !important;
          opacity: 1 !important;
        }

        /* Main price (e.g. ₹23) */
        .kovenik-mobile-product-card [class*="font-semibold"] {
          color: #ffffff !important;
          opacity: 1 !important;
        }

        /* MRP / struck price also stays clearly visible */
        .kovenik-mobile-product-card [class*="line-through"] {
          color: #d4d4d4 !important;
          opacity: 1 !important;
        }

        /* =========================================================
           BESTSELLER BADGE — BLACK BLOCK + WHITE TEXT
           Only the badge is changed. Product image/card stays original.
        ========================================================= */
        .kovenik-mobile-product-card [class*="bg-white"] {
          background-color: #111111 !important;
          color: #ffffff !important;
          border-color: rgba(212,175,55,0.35) !important;
          opacity: 1 !important;
        }

        .kovenik-mobile-product-card [class*="bg-white"] span,
        .kovenik-mobile-product-card [class*="bg-white"] p,
        .kovenik-mobile-product-card [class*="bg-white"] div {
          color: #ffffff !important;
          opacity: 1 !important;
          text-shadow: none !important;
        }

        .kovenik-mobile-product-card [class*="bg-white"][class*="text-white"] {
          background-color: #111111 !important;
          color: #ffffff !important;
        }

        /* Keep all card buttons/controls visible and unchanged */
        .kovenik-mobile-product-card button {
          opacity: 1 !important;
        }

        /* =========================================================
           MOBILE WISHLIST / HEART BUTTON
           Keep the wishlist circle WHITE — only the icon is dark.
           Do not affect the black quick-add (+) button.
        ========================================================= */
        .kovenik-mobile-product-card button:has(.lucide-heart) {
          background: #ffffff !important;
          background-color: #ffffff !important;
          color: #111111 !important;
          border-color: rgba(17, 17, 17, 0.12) !important;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.10) !important;
        }

        .kovenik-mobile-product-card button:has(.lucide-heart) .lucide-heart {
          color: #111111 !important;
          stroke: #111111 !important;
          fill: none !important;
        }

        /* Quick-add / plus button remains dark with its existing icon */
        .kovenik-mobile-product-card button[class*="bg-black"],
        .kovenik-mobile-product-card button[class*="bg-neutral-900"] {
          color: #ffffff !important;
        }
      @keyframes marquee {
        from { transform: translateX(0); }
        to { transform: translateX(-35%); }
      }

        /* =========================================================
           POLISH ADDITIONS (appended — win over earlier rules)
        ========================================================= */
        .scrollbar-none { scrollbar-width: none; -ms-overflow-style: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }

        /* MOBILE FASHION SVG — subtle continuous editorial motion */
        @keyframes kovenik-fashion-drift {
          0%, 100% { transform: translate3d(-2px, 0, 0) rotate(-1deg); opacity: .52; }
          50% { transform: translate3d(9px, -4px, 0) rotate(1deg); opacity: .88; }
        }
        @keyframes kovenik-fashion-shimmer {
          0%, 100% { stroke-dashoffset: 120; opacity: .28; }
          50% { stroke-dashoffset: 0; opacity: .78; }
        }
        .kovenik-fashion-svg { animation: kovenik-fashion-drift 5.5s ease-in-out infinite; transform-origin: center; }
        .kovenik-fashion-svg path, .kovenik-fashion-svg circle, .kovenik-fashion-svg line { stroke-dasharray: 120; animation: kovenik-fashion-shimmer 4.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .kovenik-fashion-svg, .kovenik-fashion-svg path, .kovenik-fashion-svg circle, .kovenik-fashion-svg line { animation: none !important; }
        }

        @media (max-width: 1023px) {
          /* Product title: readable, medium weight, max 2 lines */
          .kovenik-mobile-product-card h3,
          .kovenik-mobile-product-card h4 {
            font-size: 12.5px !important;
            font-weight: 500 !important;
            line-height: 1.35 !important;
            letter-spacing: 0 !important;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          /* Price: clearer hierarchy (badges with bg-white excluded) */
          .kovenik-mobile-product-card [class*="font-semibold"]:not([class*="bg-white"]):not([class*="absolute"]):not([class*="uppercase"]) {
            font-size: 14px !important;
            font-weight: 600 !important;
          }
          /* Badges (LIMITED DROP / BESTSELLER / -33%): one small, equal size */
          .kovenik-mobile-product-card.kovenik-mobile-product-card [class*="absolute"]:not(button),
          .kovenik-mobile-product-card.kovenik-mobile-product-card [class*="absolute"] *:not(svg):not(button) {
            font-size: 10px !important;
            line-height: 1.2 !important;
            letter-spacing: 0.06em !important;
          }
          /* MRP: secondary but legible */
          .kovenik-mobile-product-card [class*="line-through"] {
            font-size: 11px !important;
            font-weight: 400 !important;
          }
          /* Best Price: readable, secondary */
          .kovenik-mobile-product-card [class*="text-emerald"] {
            font-size: 10.5px !important;
            font-weight: 500 !important;
          }
        }

        @media (min-width: 1024px) {
          .ardenby-product-section :not(button)[class*="bg-white"] {
            background-color: #0b0b0b !important;
            color: #E6C65A !important;
            border: 1px solid rgba(212, 175, 55, 0.65) !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            letter-spacing: 0.14em !important;
            line-height: 1.2 !important;
            padding: 5px 10px !important;
            opacity: 1 !important;
          }
          .ardenby-product-section :not(button)[class*="bg-white"] * {
            color: #E6C65A !important;
            font-size: inherit !important;
            opacity: 1 !important;
          }
        }

        /* =========================================================
           MOBILE HOME — FULL KÖVENIK GOLD-METALLIC SYSTEM
           Mobile only. Desktop remains untouched.
        ========================================================= */
        @media (max-width: 1023px) {
          .kovenik-mobile-luxury,
          .kovenik-mobile-category-shell {
            background:
              radial-gradient(circle at 50% 0%, rgba(212,175,55,0.13), transparent 38%),
              linear-gradient(180deg, #090909 0%, #11100c 48%, #070707 100%) !important;
            color: #f4ead0 !important;
          }

          .kovenik-mobile-luxury,
          .kovenik-mobile-luxury *,
          .kovenik-mobile-category-shell,
          .kovenik-mobile-category-shell * {
            font-family: Arial, Helvetica, sans-serif !important;
            font-style: normal !important;
          }

          .kovenik-mobile-luxury h1,
          .kovenik-mobile-luxury h2,
          .kovenik-mobile-luxury h3,
          .kovenik-mobile-luxury h4,
          .kovenik-mobile-category-shell h1,
          .kovenik-mobile-category-shell h2,
          .kovenik-mobile-category-shell h3,
          .kovenik-mobile-category-shell h4 {
            font-weight: 800 !important;
            letter-spacing: -0.025em !important;
          }

          .kovenik-mobile-luxury [class*="bg-white"],
          .kovenik-mobile-luxury [class*="bg-[#f7f6f2]"],
          .kovenik-mobile-luxury [class*="bg-[#fffdf8]"],
          .kovenik-mobile-luxury [class*="bg-[#eee8dc]"],
          .kovenik-mobile-luxury [class*="bg-[#ddd6c8]"],
          .kovenik-mobile-luxury [class*="bg-[#ececec]"],
          .kovenik-mobile-category-shell [class*="bg-white"],
          .kovenik-mobile-category-shell [class*="bg-neutral-900"] {
            background: linear-gradient(180deg, #15130d 0%, #090909 100%) !important;
            color: #f4ead0 !important;
            border-color: rgba(212,175,55,0.42) !important;
          }

          .kovenik-mobile-luxury [class*="text-[#111]"],
          .kovenik-mobile-luxury [class*="text-neutral-900"],
          .kovenik-mobile-luxury [class*="text-neutral-700"],
          .kovenik-mobile-luxury [class*="text-neutral-600"],
          .kovenik-mobile-category-shell [class*="text-neutral-200"] {
            color: #eadfbf !important;
          }

          .kovenik-mobile-luxury [class*="text-[#9b7514]"],
          .kovenik-mobile-luxury [class*="text-[#D4AF37]"],
          .kovenik-mobile-category-shell [class*="text-amber-300"],
          .kovenik-mobile-category-shell [class*="text-amber-200"] {
            color: #F2C94C !important;
          }

          .kovenik-mobile-luxury .border-black\/10,
          .kovenik-mobile-luxury .border-black\/15,
          .kovenik-mobile-category-shell .border-neutral-800 {
            border-color: rgba(212,175,55,0.35) !important;
          }

          .kovenik-mobile-luxury .shadow-\[0_8px_24px_rgba\(0\,0\,0\,0\.07\)\],
          .kovenik-mobile-luxury .shadow-\[0_10px_30px_rgba\(0\,0\,0\,0\.12\)\] {
            box-shadow: 0 14px 34px rgba(0,0,0,0.38), 0 0 24px rgba(212,175,55,0.07) !important;
          }

          .kovenik-mobile-luxury a:not([class*="bg-[#D4AF37"]]) {
            color: inherit;
          }

          /* Product cards: clean spacing so text never touches the image/card edge. */
          .kovenik-mobile-luxury .kovenik-mobile-product-card {
            padding-bottom: 8px !important;
            background: #0d0d0c !important;
            border-color: rgba(212,175,55,0.28) !important;
          }

          .kovenik-mobile-luxury .kovenik-mobile-product-card h3,
          .kovenik-mobile-luxury .kovenik-mobile-product-card h4 {
            margin-top: 7px !important;
            padding-left: 8px !important;
            padding-right: 8px !important;
          }

          .kovenik-mobile-luxury .kovenik-mobile-product-card p {
            padding-left: 8px !important;
            padding-right: 8px !important;
          }

          /* Gold section separators. */
          .kovenik-mobile-luxury hr,
          .kovenik-mobile-luxury [class*="border-b"] {
            border-color: rgba(212,175,55,0.25) !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .kovenik-mobile-product-card img { transition: none !important; }
        }
      `}</style>
      {/* ================= KÖVENIK PREMIUM LUXURY HERO — HERO ONLY ================= */}
      <section
        className="hidden md:block relative left-1/2 z-0 w-screen max-w-none -translate-x-1/2 overflow-hidden bg-[#050505] text-white h-[calc(100svh-76px)] min-h-0 md:h-[calc(100svh-76px)] lg:h-[calc(100svh-128px)]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative h-full w-full">
          <div className="absolute inset-0 bg-[#050505]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_58%_48%,rgba(212,175,55,0.17)_0%,rgba(212,175,55,0.055)_24%,transparent_54%),radial-gradient(ellipse_at_10%_72%,rgba(212,175,55,0.06),transparent_34%),linear-gradient(115deg,#050505_0%,#0c0b08_48%,#020202_100%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.13] [background-image:radial-gradient(#D4AF37_0.65px,transparent_0.65px)] [background-size:21px_21px]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.2] [background-image:linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.025)_24%,transparent_42%,rgba(212,175,55,0.035)_62%,transparent_78%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_36%,rgba(0,0,0,0.78)_100%)]" />

          {/* MOBILE — dedicated luxury campaign composition */}
          <div className="absolute inset-0 block overflow-hidden md:hidden">
            <div className="absolute inset-0 bg-[#050505]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,rgba(212,175,55,0.20)_0%,rgba(212,175,55,0.07)_32%,transparent_65%),linear-gradient(180deg,#050505_0%,#090806_55%,#020202_100%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.13] [background-image:radial-gradient(#D4AF37_0.65px,transparent_0.65px)] [background-size:18px_18px]" />
            <div className="pointer-events-none absolute inset-x-3 top-3 bottom-3 border border-[#D4AF37]/15" />
            <div className="pointer-events-none absolute left-4 top-[20%] bottom-[15%] w-px bg-gradient-to-b from-transparent via-[#D4AF37]/45 to-transparent" />
            <div className="pointer-events-none absolute right-4 top-[23%] bottom-[17%] w-px bg-gradient-to-b from-transparent via-[#D4AF37]/28 to-transparent" />

            {/* Mobile headline — giant editorial type behind the model */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`mobile-headline-${slide}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.55, ease }}
                className="absolute inset-x-0 top-[13%] z-20 px-1 text-center"
              >
                <p className="mb-2 text-[8px] font-black uppercase tracking-[0.34em] text-[#F0D46E]">The New Standard • SS26</p>
                <h1
                  className="font-serif text-[clamp(52px,16.5vw,76px)] font-black uppercase leading-[0.78] tracking-[-0.065em]"
                  style={{
                    fontFamily: "Bodoni MT, Didot, Times New Roman, serif",
                    background: "linear-gradient(180deg,#FFFDF4 0%,#F8EBC0 25%,#D4AF37 55%,#8A661D 76%,#F3D36B 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 7px 18px rgba(0,0,0,0.9)) drop-shadow(0 0 20px rgba(212,175,55,0.18))",
                  }}
                >
                  {activeHero.headline}
                </h1>
              </motion.div>
            </AnimatePresence>

            {/* Mobile model — wide, dominant, gold-lit, NO black silhouette */}
            <div className="pointer-events-none absolute inset-x-0 top-[9%] bottom-[25%] z-30 flex items-end justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`mobile-model-${slide}`}
                  initial={{ opacity: 0, y: 16, scale: 1.025 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.65, ease }}
                  className="relative flex h-full w-full items-end justify-center"
                >
                  <div className="absolute bottom-[6%] left-1/2 h-[54%] w-[92%] -translate-x-1/2 rounded-full bg-[#D4AF37]/22 blur-[70px]" />
                  <div className="absolute bottom-[10%] left-1/2 h-[38%] w-[70%] -translate-x-1/2 rounded-full bg-[#F5D76E]/12 blur-[48px]" />
                  <img
                    src={transparentHeroImages[slide % transparentHeroImages.length]}
                    alt={activeHero.headline}
                    className="relative z-20 h-[104%] w-auto max-w-[118%] object-contain object-bottom drop-shadow-[0_0_20px_rgba(212,175,55,0.34)] drop-shadow-[0_22px_42px_rgba(212,175,55,0.24)]"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Clean mobile information + full-width CTAs */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`mobile-details-${slide}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.45, ease, delay: 0.08 }}
                className="absolute inset-x-3 bottom-[38px] z-50"
              >
                <div className="border border-[#D4AF37]/55 bg-[#050505]/88 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.65)] backdrop-blur-md">
                  <div className="mb-2.5 flex items-center gap-2.5">
                    <span className="h-px w-7 bg-[#F5D76E]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.28em] text-[#F0D46E]">Unrivaled Finish</span>
                  </div>
                  <p className="max-w-[330px] text-[12px] leading-[1.45] text-neutral-200">
                    Heavyweight custom milled fabrics engineered for elite street presence.
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Editorial pagination */}
            <div className="absolute bottom-3.5 left-5 right-5 z-[60] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-neutral-300">0{slide + 1}</span>
                <span className="h-px w-10 bg-gradient-to-r from-[#D4AF37] to-transparent" />
                <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-neutral-600">0{heroSlides.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {heroSlides.map((_, index) => (
                  <button key={index} type="button" onClick={() => setSlide(index)} aria-label={`Go to slide ${index + 1}`} className="p-1">
                    <span className={`block h-[2px] transition-all duration-500 ${index === slide ? "w-7 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.65)]" : "w-2.5 bg-white/25"}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DESKTOP / TABLET — editorial fashion campaign */}
          <div className="absolute inset-0 hidden md:block">
            <div className="pointer-events-none absolute inset-5 border border-white/[0.055] lg:inset-7" />
            <div className="pointer-events-none absolute left-7 top-[8%] bottom-[8%] w-px bg-gradient-to-b from-transparent via-[#D4AF37]/55 to-transparent" />
            <div className="pointer-events-none absolute right-7 top-[12%] bottom-[12%] w-px bg-gradient-to-b from-transparent via-[#D4AF37]/28 to-transparent" />
            <div className="pointer-events-none absolute right-[10%] top-[7%] h-[82%] w-[31%] border-x border-[#D4AF37]/10 bg-[linear-gradient(90deg,transparent,rgba(212,175,55,0.035),transparent)]" />
            <div className="pointer-events-none absolute right-[18%] top-[5%] h-[88%] w-px rotate-[8deg] bg-gradient-to-b from-transparent via-[#F5D76E]/45 to-transparent" />
            <div className="pointer-events-none absolute right-[22%] top-[17%] h-[45%] w-[20%] border border-[#D4AF37]/10 rotate-[8deg]" />
            <div className="pointer-events-none absolute bottom-[15%] left-[4%] h-px w-[75%] bg-gradient-to-r from-transparent via-[#D4AF37]/42 to-transparent" />
            <div className="pointer-events-none absolute left-[3.5%] top-[17%] h-2 w-2 rounded-full bg-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.75)]" />

            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="absolute left-9 top-[5%] z-50 xl:left-12 xl:top-[5.5%]">
              <div className="border border-[#D4AF37]/45 bg-[#090909]/75 px-4 py-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F5D76E]">The New Standard • SS26</p>
                <p className="mt-1 text-[9px] tracking-[0.04em] text-neutral-400">Crafted with Unrivaled West Delhi Precision</p>
              </div>
            </motion.div>

            {/* GIANT HEADLINE — behind model */}
            <AnimatePresence mode="wait">
              <motion.div key={`desktop-headline-${slide}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.55, ease }} className="absolute left-[3%] right-[3%] top-[20%] z-20 text-center px-2">
                <h1
                  className="mx-auto w-full max-w-[1320px] whitespace-nowrap font-serif text-[clamp(76px,8.1vw,142px)] font-black uppercase leading-[0.72] tracking-[-0.07em]"
                  style={{ fontFamily: "Bodoni MT, Didot, Times New Roman, serif", background: "linear-gradient(180deg,#FFFDF3 0%,#FFF7DC 25%,#E7D487 48%,#D4AF37 68%,#84621D 83%,#F1D46D 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.98)) drop-shadow(0 0 28px rgba(212,175,55,0.13))" }}
                >{activeHero.headline}</h1>
              </motion.div>
            </AnimatePresence>

            {/* MODEL — in front of headline */}
            <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
              <div className="absolute left-[53%] top-[49%] h-[72%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4AF37]/20 blur-[105px]" />
              <AnimatePresence mode="wait">
                <motion.div key={`desktop-model-${slide}`} initial={{ opacity: 0, y: 22, scale: 1.025 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15 }} transition={{ duration: 0.65, ease }} className="absolute inset-0 flex items-end justify-center">
                  <img src={transparentHeroImages[slide % transparentHeroImages.length]} alt={activeHero.headline} className="relative z-30 h-[98%] w-auto max-w-none translate-x-[1%] translate-y-0 object-contain object-bottom drop-shadow-[0_0_14px_rgba(245,215,110,0.72)] drop-shadow-[0_0_34px_rgba(212,175,55,0.38)] drop-shadow-[0_26px_54px_rgba(212,175,55,0.28)]" />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Side editorial copy */}
            <AnimatePresence mode="wait">
              <motion.div key={`desktop-left-${slide}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease }} className="absolute left-[5.5%] top-[55%] z-40 w-[320px] xl:left-[6%] xl:w-[340px]">
                <p className="text-[14px] font-black uppercase tracking-[0.28em] text-[#D4AF37]">Unrivaled Finish</p>
                <div className="mt-3 h-px w-14 bg-gradient-to-r from-[#D4AF37] to-transparent" />
                <p className="mt-4 text-[16px] leading-[1.65] text-neutral-100 xl:text-[17px]">Heavyweight custom milled fabrics engineered for elite street presence.</p>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div key={`desktop-right-${slide}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease, delay: 0.08 }} className="absolute right-[5%] top-[50%] z-40 w-[280px] text-right xl:right-[5.5%] xl:w-[300px]">
                <p className="text-[14px] font-black uppercase tracking-[0.28em] text-[#D4AF37]">Elite Status</p>
                <div className="mt-3 ml-auto h-px w-12 bg-[#D4AF37]/65" />
                <p className="mt-4 text-[15px] leading-[1.65] text-neutral-200">Designed in West Delhi, crafted with global luxury precision.</p>
                <p className="mt-7 text-[8px] font-semibold uppercase tracking-[0.28em] text-neutral-600">KÖVENIK / 2026</p>
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-[30px] left-[5.5%] z-50 hidden items-center gap-4 md:flex"><span className="text-[9px] font-bold uppercase tracking-[0.25em] text-neutral-500">01</span><span className="h-px w-16 bg-gradient-to-r from-[#D4AF37] to-transparent" /><span className="text-[9px] font-bold uppercase tracking-[0.25em] text-neutral-600">03</span></div>
            <div className="absolute bottom-[30px] right-[4%] z-50 hidden items-center gap-2 lg:flex">{heroSlides.map((_, index) => <button key={index} type="button" onClick={() => setSlide(index)} aria-label={`Go to slide ${index + 1}`} className="group p-1"><span className={`block h-[2px] transition-all duration-500 ${index === slide ? "w-9 bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.65)]" : "w-3.5 bg-white/20 group-hover:bg-white/45"}`} /></button>)}</div>
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

{/* =========================================================
   KOVENIK — MOBILE HOME / REFERENCE-STYLE SHOPPING LAYOUT
   Mobile-only. Desktop content below remains untouched.
========================================================= */}

{/* MOBILE FEATURED BANNER — premium metallic campaign card */}
<section className="kovenik-mobile-luxury w-full bg-[#050505] px-3 pb-7 pt-3 text-white lg:hidden">
  <div className="relative overflow-hidden border border-[#D4AF37]/45 bg-[#090909] shadow-[0_18px_45px_rgba(0,0,0,0.55),0_0_28px_rgba(212,175,55,0.08)]">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(212,175,55,0.16),transparent_38%),linear-gradient(180deg,#12100a_0%,#070707_58%,#030303_100%)]" />
    <div className="pointer-events-none absolute inset-2 border border-[#D4AF37]/15" />

    <div className="relative h-[315px] overflow-hidden border-b border-[#D4AF37]/35 bg-[#0b0b0b]">
      {bestSellers[0]?.images?.[0] ? (
        <img src={bestSellers[0].images[0]} alt={bestSellers[0].name} loading="lazy" className="h-full w-full object-cover object-center" />
      ) : (
        <div className="h-full w-full bg-[#111]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-[#050505]/10" />
      {/* Animated fashion-line SVG — decorative only */}
      <div className="pointer-events-none absolute right-2 top-1/2 z-10 -translate-y-1/2 opacity-70" aria-hidden="true">
        <svg className="kovenik-fashion-svg h-[190px] w-[115px]" viewBox="0 0 120 210" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M60 24c-11 0-19 8-19 18s8 18 19 18 19-8 19-18-8-18-19-18Z" stroke="#F5D76E" strokeWidth="1.25"/>
          <path d="M48 61 29 78l-13 44M72 61l19 17 13 44M43 65l17 14 17-14M29 78l-3 71M91 78l3 71M26 149l-6 45M94 149l6 45M20 194h22M78 194h22" stroke="#D4AF37" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M43 65c5 6 9 9 17 14 8-5 12-8 17-14M33 91h54M31 112h58" stroke="#FFF0B0" strokeWidth=".8" strokeLinecap="round" opacity=".75"/>
          <circle cx="60" cy="112" r="39" stroke="#D4AF37" strokeWidth=".55" opacity=".35"/>
        </svg>
      </div>

      <div className="absolute left-4 top-4 border border-[#D4AF37]/55 bg-black/65 px-3 py-1.5 backdrop-blur-sm">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F5D76E]">KÖVENIK / SS26</span>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#F5D76E]">Featured Drop</p>
          <p className="mt-1 text-[12px] font-black uppercase tracking-[0.08em] text-white">{bestSellers[0]?.categoryLabel || "KÖVENIK EDIT"}</p>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">01 / 03</span>
      </div>
    </div>

    <div className="relative px-5 pb-5 pt-5">
      <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#D4AF37]">Built for the everyday</p>
      <h2 className="mt-2 max-w-[330px] text-[29px] font-black uppercase leading-[0.95] tracking-[-0.035em] text-[#F5E7B8]">
        {bestSellers[0]?.name || "KOVENIK ESSENTIALS"}
      </h2>
      <p className="mt-3 max-w-[330px] text-[12px] leading-[1.55] text-neutral-300">Premium streetwear. Strong silhouettes. Pieces made to stand apart.</p>
      <Link href="/shop" className="relative mt-5 flex min-h-[46px] w-full items-center justify-center gap-2 overflow-hidden border border-[#D4AF37] bg-gradient-to-r from-[#8E691B] via-[#D4AF37] to-[#9A741E] text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-[0_8px_22px_rgba(212,175,55,0.16)]">
        <span className="relative z-10">Explore Collection</span>
        <ArrowUpRight className="relative z-10 h-3.5 w-3.5" />
      </Link>
    </div>
  </div>
  <div className="mt-3 flex justify-center gap-1.5"><span className="h-1 w-2 rounded-full bg-white/20" /><span className="h-1 w-7 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.5)]" /><span className="h-1 w-2 rounded-full bg-white/20" /></div>
</section>

{/* MOBILE COLLECTION / OFFERS STRIP — cleaner metallic editorial cards */}
<section className="kovenik-mobile-luxury w-full bg-[#050505] py-8 text-white lg:hidden">
  <div className="px-4">
    <div className="flex items-end justify-between gap-3 border-b border-[#D4AF37]/25 pb-4">
      <div>
        <p className="mb-1 text-[9px] font-black uppercase tracking-[0.24em] text-[#D4AF37]">KÖVENIK EDIT</p>
        <h2 className="text-[28px] font-black uppercase leading-none tracking-[-0.035em] text-[#F3E5AB]">Collection Highlights</h2>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">03 Stories</span>
    </div>
  </div>
  <div className="scrollbar-none mt-5 flex gap-3 overflow-x-auto px-4 pb-1">
    {philosophy.map((item) => (
      <article key={item.num} className="relative min-h-[205px] w-[78vw] max-w-[300px] shrink-0 overflow-hidden border border-[#D4AF37]/35 bg-[linear-gradient(145deg,#17140b,#080808)] p-5 shadow-[0_16px_35px_rgba(0,0,0,0.42)]">
        <span className="absolute right-4 top-4 text-[10px] font-black tracking-[0.18em] text-[#D4AF37]">{item.num}</span>
        <div className="mb-5 mt-7 h-[2px] w-12 bg-gradient-to-r from-[#F5D76E] to-[#8A661D]" />
        <h3 className="max-w-[245px] text-[20px] font-black uppercase leading-[1.02] tracking-[-0.02em] text-[#F5E7B8]">{item.title}</h3>
        <p className="mt-3 text-[11px] leading-[1.55] text-neutral-300">{item.desc}</p>
      </article>
    ))}
  </div>
</section>

{/* MOBILE CATEGORY TABS + TRENDING CATEGORIES */}
<section className="kovenik-mobile-luxury w-full bg-white px-4 py-8 text-[#111] lg:hidden">
  <div className="mb-5 flex items-end justify-between">
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#9b7514]">Explore the collection</p>
      <h2 className="font-serif text-[31px] font-bold italic leading-none" style={{ fontFamily: "Bodoni MT, Didot, Times New Roman, serif" }}>Trending Categories</h2>
    </div>
    <span className="text-2xl text-[#D4AF37]">↙</span>
  </div>
  <div className="grid grid-cols-3 gap-2.5">
    {[
      ...categories.slice(0, 4),
      { slug: "bottom-wear", name: "Bottom Wear" },
      { slug: "all-products", name: "All Products" },
    ].map((cat, index) => {
      const staticCatProduct = staticHomeProducts.find((p) => p.category === cat.slug);
      const catProduct = products.find((p) => p.category === cat.slug);
      const fallbackImage = products[index]?.images?.[0] || bestSellers[index]?.images?.[0];
      const image = staticCatProduct?.images?.[0] || catProduct?.images?.[0] || fallbackImage;
      if (!image) return null;
      return (
        <Link key={cat.slug} href={cat.slug === "all-products" ? "/shop" : `/shop?category=${cat.slug}`} className="group relative overflow-hidden rounded-[14px] bg-[#ececec]">
          <div className="relative aspect-[0.76] overflow-hidden">
            <img src={image} alt={cat.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-active:scale-[1.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <span className="absolute left-2 top-2 text-[8px] font-black tracking-[0.14em] text-white">0{index + 1}</span>
            <p className="absolute inset-x-2 bottom-2 text-[11px] font-bold uppercase leading-[1.05] text-white">{cat.name}</p>
          </div>
        </Link>
      );
    })}
  </div>
</section>

{/* MOBILE NEW ARRIVALS — reference-style tabbed grid */}
<section className="kovenik-mobile-luxury w-full bg-[#f7f6f2] px-4 py-8 text-[#111] lg:hidden">
  <div className="mb-4 flex items-end justify-between">
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#9b7514]">Fresh drops • SS26</p>
      <h2 className="font-serif text-[31px] font-bold italic leading-none" style={{ fontFamily: "Bodoni MT, Didot, Times New Roman, serif" }}>New Arrivals</h2>
    </div>
    <Link href="/shop" className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9b7514]">Explore All →</Link>
  </div>
  <div className="mb-5 flex overflow-x-auto border-b border-black/10">
    {[
      { id: "all", label: "All" },
      { id: "supreme-edition", label: "Supreme" },
      { id: "epic-thread", label: "Epic Thread" },
      { id: "Kovenik-premium", label: "Premium" },
      { id: "the-print-club", label: "Print Club" },
    ].map((tab) => {
      const active = selectedSubCat === tab.id;
      return <button key={tab.id} type="button" onClick={() => setSelectedSubCat(tab.id)} className={`shrink-0 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] ${active ? "border-b-2 border-[#111] text-[#111]" : "text-neutral-400"}`}>{tab.label}</button>;
    })}
  </div>
  {filteredNewArrivals.length > 0 ? (
    <div className="grid grid-cols-2 gap-3">
      {filteredNewArrivals.map((product, index) => (
        <div key={product.id} className="overflow-hidden border border-[#D4AF37]/35 bg-[#0b0b0b] p-1.5 shadow-[0_8px_22px_rgba(0,0,0,0.22)]">
          <ProductCard product={product as Product} index={index} />
        </div>
      ))}
    </div>
  ) : <div className="bg-white px-5 py-12 text-center text-[12px] text-neutral-500">No new arrivals in this collection yet.</div>}
</section>

{/* MOBILE BEST SELLERS — three-column visual rail like reference */}
<section className="kovenik-mobile-luxury w-full bg-white py-8 text-[#111] lg:hidden">
  <div className="mb-5 px-4">
    <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[#9b7514]">KÖVENIK / MOST LOVED</p>
    <h2 className="text-center font-serif text-[30px] font-bold italic leading-none" style={{ fontFamily: "Bodoni MT, Didot, Times New Roman, serif" }}>Best Sellers</h2>
  </div>
  <div className="scrollbar-none flex gap-3 overflow-x-auto px-4">
    {bestSellers.slice(0, 6).map((product, index) => (
      <Link key={product.id} href={`/product/${product.slug}`} className="w-[36vw] max-w-[155px] shrink-0 overflow-hidden border border-[#D4AF37]/25 bg-[#0a0a0a] p-2 shadow-[0_10px_24px_rgba(0,0,0,0.28)]">
        <div className="relative aspect-[0.78] overflow-hidden border border-[#D4AF37]/35 bg-[#111]">
          <img src={product.images?.[0]} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
        </div>
        <p className="mt-2 px-1 text-[8px] font-bold uppercase leading-[1.2] tracking-[0.12em] text-[#D4AF37]">{product.categoryLabel || "KÖVENIK"}</p>
        <p className="mt-1 min-h-[28px] px-1 line-clamp-2 text-[11px] font-bold uppercase leading-[1.2]">{product.name}</p>
        <p className="mt-1 px-1 text-[11px] font-black text-[#F5D76E]">₹{product.price}</p>
      </Link>
    ))}
  </div>
</section>

{/* MOBILE DEALS / STYLE GRID — same visual rhythm as reference, using existing KÖVENIK products */}
<section className="kovenik-mobile-luxury w-full bg-[#fffdf8] py-9 text-[#111] lg:hidden">
  <div className="px-4">
    <div className="mb-6 flex items-center justify-center gap-3"><span className="h-px flex-1 bg-black/15" /><h2 className="text-center font-serif text-[24px] font-bold italic" style={{ fontFamily: "Bodoni MT, Didot, Times New Roman, serif" }}>Style Worthy Drops</h2><span className="h-px flex-1 bg-black/15" /></div>
    <div className="grid grid-cols-3 gap-3">
      {products.slice(0, 6).map((product, index) => (
        <Link key={`${product.id}-${index}`} href={`/product/${product.slug}`} className="block">
          <div className="relative overflow-hidden border border-[#D4AF37] bg-[#eee]">
            <img src={product.images?.[0]} alt={product.name} loading="lazy" className="aspect-[0.78] w-full object-cover" />
          </div>
          <p className="mt-2 text-center text-[10px] font-black uppercase leading-[1.1]">{product.name}</p>
          <p className="mt-1 text-center text-[10px] font-bold text-neutral-700">₹{product.price}</p>
        </Link>
      ))}
    </div>
  </div>
</section>

{/* MOBILE REVIEWS */}
<section className="kovenik-mobile-luxury w-full bg-[#080808] py-9 text-white lg:hidden">
  <div className="mb-5 px-4 text-center">
    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">Community</p>
    <h2 className="font-serif text-[30px] font-bold italic leading-none text-[#F3E5AB]" style={{ fontFamily: "Bodoni MT, Didot, Times New Roman, serif" }}>What They Say</h2>
  </div>
  <div className="scrollbar-none flex gap-3 overflow-x-auto px-4">
    {reviews.map((review) => (
      <article key={review.name} className="w-[82vw] max-w-[340px] shrink-0 border border-[#D4AF37]/25 bg-[#111] p-5">
        <div className="mb-3 flex gap-1">{Array.from({ length: review.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[#D4AF37] text-[#D4AF37]" />)}</div>
        <p className="text-[14px] leading-[1.6] text-neutral-200">“{review.text}”</p>
        <div className="mt-5 border-t border-white/10 pt-4"><p className="text-[11px] font-semibold uppercase tracking-[0.12em]">{review.name}</p><p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#D4AF37]">{review.tag}</p></div>
      </article>
    ))}
  </div>
</section>

<section className="kovenik-mobile-category-shell hidden lg:block w-full bg-neutral-950 px-4 pt-10 pb-12 sm:px-6 sm:pt-14 sm:pb-16 lg:px-8 lg:pt-16 lg:pb-20">
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
      {[
        ...categories.slice(0, 4),
        { slug: "bottom-wear", name: "Bottom Wear" },
      ].map((cat, index) => {
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
              06 / COMPLETE COLLECTION
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
<section className="hidden lg:block ardenby-product-section w-full bg-[#0b0b0b] px-4 pb-12 pt-14 text-white sm:px-6 sm:pb-16 sm:pt-16 lg:px-10 lg:pb-20 lg:pt-20">
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
      {/* ================= NEW ARRIVALS ================= */}
      <section className="hidden lg:block ardenby-product-section w-full bg-[#0b0b0b] px-3 py-6 sm:px-6 lg:px-10 lg:py-10 text-white">
  <div className="relative w-full overflow-hidden rounded-[28px] border border-[#D4AF37]/50 bg-[#111111] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.12)] sm:p-7 lg:p-10">

    {/* Subtle background detail */}
    <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-black/40 blur-3xl" />

    {/* ================= HEADER ================= */}
    <div className="relative z-10 mb-7 border-b border-white/10 pb-6 sm:mb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

        {/* Heading */}
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#1a1a1a]">
              <SlidersHorizontal className="h-2.5 w-2.5 text-[#D4AF37]" />
            </span>

            <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#D4AF37] sm:text-[9px]">
              Fresh Drops • SS26
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {/* TITLE - METALLIC GOLD STYLE */}
            <h2 className="font-serif text-[38px] font-normal leading-none tracking-[-0.03em] bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA771C] bg-clip-text text-transparent sm:text-[40px] lg:text-[46px]">
              New Arrivals
            </h2>

            {/* Dynamic count */}
            <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#F3E5AB]">
              {filteredNewArrivals.length} Pieces
            </span>
          </div>

          <p className="mt-3 max-w-md text-[10px] leading-5 text-neutral-300 sm:text-[11px]">
            Discover the latest pieces added to the KOVENIK collection.
          </p>
        </div>

        {/* ================= FILTERS ================= */}
        <div className="w-full lg:w-auto lg:max-w-[620px]">
          <div className="scrollbar-none flex gap-1.5 overflow-x-auto pb-1">

            {[
              { id: "all", label: "All Fits" },
              { id: "supreme-edition", label: "Supreme Edition" },
              { id: "epic-thread", label: "Epic Thread" },
              { id: "Kovenik-premium", label: "Kovenik Premium" },
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
                        ? "border-[#D4AF37] bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA771C] text-neutral-950 font-bold shadow-[0_5px_18px_rgba(212,175,55,0.3)]"
                        : "border-[#D4AF37]/30 bg-[#161616] text-neutral-300 hover:border-[#D4AF37] hover:bg-[#1a1a1a] hover:text-white hover:shadow-sm"
                    }
                  `}
                >
                  {tab.label}

                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-neutral-950" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>

    {/* ================= PRODUCTS WITH PREMIUM SHADOW, RADIUS & GOLD STYLE ================= */}
    {filteredNewArrivals.length > 0 ? (
      <div className="relative z-10 grid w-full grid-cols-2 gap-x-2.5 gap-y-7 sm:gap-x-4 sm:gap-y-9 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-10">
        {filteredNewArrivals.map((product, index) => (
          <div
            key={product.id}
            className="group relative min-w-0 rounded-2xl bg-[#161616] p-3.5 border border-[#D4AF37]/40 shadow-[0_8px_30px_rgb(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.08)] transition-all duration-300 hover:border-[#D4AF37] hover:shadow-[0_12px_40px_rgb(0,0,0,0.9),0_0_25px_rgba(212,175,55,0.2)] hover:-translate-y-1.5 [&_h3]:font-bold [&_h3]:text-white [&_p]:text-neutral-200 [&_span]:text-[#F3E5AB] [&_span]:font-bold"
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
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#161616] shadow-sm">
          <SlidersHorizontal className="h-4 w-4 text-[#D4AF37]" />
        </div>

        <h3 className="font-serif text-xl text-white">
          No pieces found
        </h3>

        <p className="mt-2 max-w-xs text-[10px] leading-5 text-neutral-400">
          We couldn't find any new arrivals in this collection.
        </p>

        <button
          type="button"
          onClick={() => setSelectedSubCat("all")}
          className="mt-5 rounded-full bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA771C] px-5 py-2.5 text-[8px] font-bold uppercase tracking-[0.2em] text-neutral-950 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        >
          View All Pieces
        </button>
      </div>
    )}

    {/* ================= BOTTOM DETAIL ================= */}
    {filteredNewArrivals.length > 0 && (
      <div className="relative z-10 mt-8 flex items-center gap-3 border-t border-white/10 pt-5 sm:mt-10">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4AF37]" />

        <p className="text-[8px] font-medium uppercase tracking-[0.25em] text-neutral-400">
          Curated for the new season
        </p>

        <span className="h-px flex-1 bg-white/10" />

        <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
          KOVENIK
        </span>
      </div>
    )}
  </div>
</section>

      {/* ================= TRENDING NOW ================= */}
{/* ================================================================
    TRENDING NOW
================================================================ */}

<section className="hidden lg:block ardenby-product-section relative w-full overflow-hidden bg-[#0b0b0b] px-3 py-14 sm:px-6 sm:py-18 lg:px-10 lg:py-24 text-white">
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
       <h2
          className="
            overflow-visible
            bg-gradient-to-r
            from-[#FFF4C7]
            via-[#D4AF37]
            to-[#A87518]
            bg-clip-text
            pb-1
            font-serif
            text-[38px]
            font-normal
            leading-[1.05]
            tracking-[-0.035em]
            text-transparent

            sm:text-[44px]

            lg:text-[48px]
          "
        >
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

    </main>
    </MotionConfig>
  );
}
