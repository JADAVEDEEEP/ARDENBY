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
import { products, categories, heroSlides } from "@/lib/data";

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

export default function HomePage() {
  const [slide, setSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [selectedSubCat, setSelectedSubCat] = useState("all");

  const bestSellers = useMemo(
    () => products.filter((p) => p.bestSeller).slice(0, 8),
    []
  );

  const filteredNewArrivals = useMemo(() => {
    if (selectedSubCat === "all") {
      return products.filter((p) => p.newArrival).slice(0, 4);
    }
    return products
      .filter((p) => p.category === selectedSubCat || p.tags?.includes(selectedSubCat))
      .slice(0, 4);
  }, [selectedSubCat]);

  const trending = useMemo(
    () => products.filter((p) => p.trending).slice(0, 4),
    []
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
      {/* ================= HERO SECTION ================= */}
     {/* =========================================================
    HERO SECTION
========================================================= */}

<section
  className="
    relative
    z-0
    w-full
    h-[600px]
    overflow-hidden
    bg-[#F4F2ED]

    sm:h-[640px]
    md:h-[680px]

    lg:h-[calc(100vh-90px)]
    lg:min-h-[580px]
    lg:max-h-[700px]
  "
  onMouseEnter={() => setIsPaused(true)}
  onMouseLeave={() => setIsPaused(false)}
>
  <div className="relative mx-auto h-full w-full max-w-[1500px]">

    {/* =====================================================
        BACKGROUND TRANSITION / BLEND LAYER
    ====================================================== */}
    <div
      aria-hidden="true"
      className="
        pointer-events-none
        absolute inset-0 z-0
        bg-[radial-gradient(ellipse_at_center,rgba(246,245,240,0)_0%,rgba(246,245,240,0.08)_28%,rgba(246,245,240,0.58)_72%,rgba(246,245,240,0.94)_100%)]
      "
    />

    <div
      aria-hidden="true"
      className="
        pointer-events-none
        absolute inset-x-0 bottom-0 z-0 h-36
        bg-gradient-to-t from-[#F6F5F0] via-[#F6F5F0]/55 to-transparent
      "
    />

    {/* =====================================================
        PREMIUM DROP LABEL
    ====================================================== */}

    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="
        absolute
        left-4
        top-5
        z-30

        sm:left-6
        sm:top-7

        lg:left-8
        lg:top-9
      "
    >
      <div
        className="
          rounded-md
          border
          border-neutral-300/80
          bg-white/75
          px-3
          py-1.5
          backdrop-blur-md
          shadow-[0_5px_16px_rgba(0,0,0,0.06)]

          sm:px-3.5
          sm:py-2
        "
      >
        <p
          className="
            text-[6.5px]
            font-bold
            uppercase
            tracking-[0.2em]
            text-neutral-900

            sm:text-[7px]
          "
        >
          Premium Drop • SS26
        </p>

        <p
          className="
            mt-0.5
            text-[7px]
            font-light
            text-neutral-500

            sm:text-[8px]
          "
        >
          Heavyweight • Drop Shoulder
        </p>
      </div>
    </motion.div>


    {/* =====================================================
        HUGE EDITORIAL TYPOGRAPHY

        z-10 = BEHIND MODEL
    ====================================================== */}

    <AnimatePresence mode="wait">
      <motion.div
        key={`headline-${slide}`}
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: -8,
        }}
        transition={{
          duration: 0.55,
          ease,
        }}
        className="
          absolute
          left-0
          right-0

          top-[105px]

          z-10

          flex
          justify-center

          px-2

          sm:top-[115px]
          sm:px-4

          md:top-[120px]

          lg:top-[88px]
          lg:px-8
        "
      >
        <h1
          className="
            w-full
            max-w-[1350px]

            text-center

            font-serif
            font-black
            uppercase

            leading-[0.76]

            tracking-[-0.055em]

            text-neutral-950

            /* MOBILE */
            text-[54px]

            /* LARGE PHONE */
            sm:text-[68px]

            /* TABLET */
            md:text-[86px]

            /* DESKTOP */
            lg:text-[clamp(86px,8.7vw,132px)]
          "
          style={{
            fontFamily:
              "Bodoni MT, Didot, Times New Roman, serif",

            textShadow:
              "0 1px 0 rgba(0,0,0,0.08)",
          }}
        >
          {activeHero.headline}
        </h1>
      </motion.div>
    </AnimatePresence>


    {/* =====================================================
        MODEL LAYER

        z-50 = ABOVE HEADLINE
    ====================================================== */}

    <div
      className="
        pointer-events-none

        absolute
        inset-0

        z-50

        flex
        items-end
        justify-center
      "
    >

      <AnimatePresence mode="wait">
        <motion.div
          key={`model-${slide}`}
          initial={{
            opacity: 0,
            y: 25,
            scale: 1.02,
          }}
          animate={{
            opacity: 1,
            y: 35,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 20,
          }}
          transition={{
            duration: 0.65,
            ease,
          }}
          className="
            relative
            z-50

            flex
            h-full
            w-full

            items-end
            justify-center

            sm:translate-y-[25px]

            md:translate-y-0
          "
        >

          {/* =================================================
              SOFT MODEL SHADOW
          ================================================== */}

          <div
            className="
              absolute

              bottom-[35px]
              left-1/2

              h-[340px]
              w-[290px]

              -translate-x-1/2

              rounded-full

              bg-neutral-400/10

              blur-[70px]

              sm:h-[390px]
              sm:w-[340px]

              md:h-[440px]
              md:w-[390px]

              lg:h-[470px]
              lg:w-[430px]
            "
          />


          {/* =================================================
              TRANSPARENT MODEL IMAGE
          ================================================== */}

          <img
            src={
              transparentHeroImages[
                slide % transparentHeroImages.length
              ]
            }
            alt={activeHero.headline}
            className="
              relative
              z-50

              /* MOBILE */
              h-[86%]

              w-auto

              max-w-[105%]

              object-contain
              object-bottom

              drop-shadow-[0_20px_32px_rgba(0,0,0,0.18)]

              /* LARGE PHONE */
              sm:h-[88%]
              sm:max-w-[100%]

              /* TABLET */
              md:h-[88%]

              /* DESKTOP */
              lg:h-[92%]
              lg:max-w-[64%]

              lg:drop-shadow-[0_22px_35px_rgba(0,0,0,0.20)]
            "
          />

        </motion.div>
      </AnimatePresence>

    </div>


    {/* =====================================================
        MOBILE SUBTITLE
    ====================================================== */}

    <AnimatePresence mode="wait">
      <motion.div
        key={`mobile-sub-${slide}`}
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        transition={{
          duration: 0.4,
        }}
        className="
          absolute

          left-0
          right-0

          top-[218px]

          z-30

          flex
          justify-center

          px-4

          sm:top-[245px]

          md:hidden
        "
      >
        <div className="flex items-center gap-2">

          <span className="h-px w-5 bg-neutral-400" />

          <span
            className="
              text-[6px]
              font-semibold
              uppercase
              tracking-[0.23em]
              text-neutral-600
            "
          >
            {activeHero.sub}
          </span>

          <span className="h-px w-5 bg-neutral-400" />

        </div>
      </motion.div>
    </AnimatePresence>


    {/* =====================================================
        MOBILE LEFT EDITORIAL TEXT
    ====================================================== */}

    <AnimatePresence mode="wait">
      <motion.div
        key={`mobile-left-${slide}`}
        initial={{
          opacity: 0,
          x: -8,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        exit={{
          opacity: 0,
        }}
        transition={{
          duration: 0.4,
        }}
        className="
          absolute

          left-4
          bottom-[145px]

          z-30

          w-[110px]

          sm:left-6
          sm:bottom-[150px]
          sm:w-[135px]

          md:hidden
        "
      >
        <p
          className="
            text-[6px]
            font-bold
            uppercase
            tracking-[0.2em]
            text-neutral-900
          "
        >
          Move Comfortably
        </p>

        <div
          className="
            mt-1.5
            h-px
            w-7
            bg-neutral-300
          "
        />

        <p
          className="
            mt-2
            text-[6.5px]
            font-light
            leading-[1.5]
            text-neutral-500
          "
        >
          Designed for everyday
          comfort, refined details,
          and modern silhouettes.
        </p>
      </motion.div>
    </AnimatePresence>


    {/* =====================================================
        MOBILE RIGHT EDITORIAL TEXT
    ====================================================== */}

    <AnimatePresence mode="wait">
      <motion.div
        key={`mobile-right-${slide}`}
        initial={{
          opacity: 0,
          x: 8,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        exit={{
          opacity: 0,
        }}
        transition={{
          duration: 0.4,
        }}
        className="
          absolute

          right-4
          bottom-[145px]

          z-30

          w-[110px]

          text-right

          sm:right-6
          sm:bottom-[150px]
          sm:w-[135px]

          md:hidden
        "
      >
        <p
          className="
            text-[6px]
            font-bold
            uppercase
            tracking-[0.2em]
            text-neutral-900
          "
        >
          Feel Confident
        </p>

        <div
          className="
            mt-1.5
            ml-auto
            h-px
            w-7
            bg-neutral-300
          "
        />

        <p
          className="
            mt-2
            text-[6.5px]
            font-light
            leading-[1.5]
            text-neutral-500
          "
        >
          Crafted for a refined
          everyday look with
          effortless comfort.
        </p>
      </motion.div>
    </AnimatePresence>


    {/* =====================================================
        DESKTOP LEFT TEXT
    ====================================================== */}

    <AnimatePresence mode="wait">
      <motion.div
        key={`left-${slide}`}
        initial={{
          opacity: 0,
          x: -12,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        exit={{
          opacity: 0,
        }}
        className="
          absolute

          left-7
          top-[275px]

          z-30

          hidden

          w-[205px]

          md:block

          xl:left-10
        "
      >
        <p
          className="
            text-[8px]
            font-bold
            uppercase
            tracking-[0.24em]
            text-neutral-900
          "
        >
          Move Comfortably
        </p>

        <div className="mt-2 h-px w-11 bg-neutral-300" />

        <p
          className="
            mt-3
            max-w-[190px]
            text-[8px]
            font-light
            leading-[1.65]
            text-neutral-500
          "
        >
          Designed for everyday comfort,
          refined details, and modern
          silhouettes.
        </p>
      </motion.div>
    </AnimatePresence>


    {/* =====================================================
        DESKTOP RIGHT TEXT
    ====================================================== */}

    <AnimatePresence mode="wait">
      <motion.div
        key={`right-${slide}`}
        initial={{
          opacity: 0,
          x: 12,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        exit={{
          opacity: 0,
        }}
        className="
          absolute

          right-7
          top-[275px]

          z-30

          hidden

          w-[205px]

          md:block

          xl:right-10
        "
      >
        <p
          className="
            text-[8px]
            font-bold
            uppercase
            tracking-[0.24em]
            text-neutral-900
          "
        >
          Feel Confident
        </p>

        <div className="mt-2 h-px w-11 bg-neutral-300" />

        <p
          className="
            mt-3
            max-w-[190px]
            text-[8px]
            font-light
            leading-[1.65]
            text-neutral-500
          "
        >
          Crafted for a refined everyday
          look with effortless comfort.
        </p>
      </motion.div>
    </AnimatePresence>


    {/* =====================================================
        CTA BUTTONS
    ====================================================== */}

    <AnimatePresence mode="wait">
      <motion.div
        key={`cta-${slide}`}
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: 8,
        }}
        transition={{
          delay: 0.15,
          duration: 0.45,
        }}
        className="
          absolute

          bottom-8

          left-0
          right-0

          z-[60]

          flex
          flex-wrap
          items-center
          justify-center

          gap-2

          px-3

          sm:bottom-9
          sm:gap-3

          lg:bottom-9
        "
      >

        {/* PRIMARY BUTTON */}

        <Link
    href={activeHero.href}
    className="
      group
      inline-flex
      h-12
      min-w-[158px]
      items-center
      justify-center
      gap-2
      rounded-sm
      bg-neutral-950
      px-6
      text-[10px]
      font-bold
      uppercase
      tracking-[0.16em]
      text-white
      shadow-[0_8px_24px_rgba(0,0,0,0.14)]
      transition-all
      duration-300
      hover:-translate-y-0.5
      hover:bg-neutral-800
      sm:h-[50px]
      sm:min-w-[168px]
      sm:px-7
    "
  >
    {activeHero.cta}

    <ArrowRight
      className="
        h-3.5
        w-3.5
        transition-transform
        duration-300
        group-hover:translate-x-1
      "
    />
  </Link>


  {/* EXPLORE COLLECTION */}
  <Link
    href="/shop"
    className="
      inline-flex
      h-12
      min-w-[190px]
      items-center
      justify-center
      rounded-sm
      border
      border-neutral-300
      bg-white/90
      px-6
      text-[10px]
      font-bold
      uppercase
      tracking-[0.16em]
      text-neutral-800
      shadow-[0_8px_24px_rgba(0,0,0,0.08)]
      backdrop-blur-sm
      transition-all
      duration-300
      hover:-translate-y-0.5
      hover:border-neutral-950
      hover:bg-white
      sm:h-[50px]
      sm:min-w-[202px]
      sm:px-7
    "
  >
    Explore Collection
  </Link>
      </motion.div>
    </AnimatePresence>


    {/* =====================================================
        SLIDE COUNTER
    ====================================================== */}

    <div
      className="
        absolute

        bottom-4
        left-4

        z-[60]

        flex
        items-center
        gap-2

        sm:bottom-5
        sm:left-6
        sm:gap-2.5

        lg:left-10
      "
    >
      <span
        className="
          text-[7px]
          font-bold
          tracking-[0.2em]
          text-neutral-900

          sm:text-[8px]
        "
      >
        {String(slide + 1).padStart(2, "0")}
      </span>

      <span
        className="
          h-px
          w-6
          bg-neutral-300

          sm:w-8
        "
      />

      <span
        className="
          text-[7px]
          tracking-[0.2em]
          text-neutral-400

          sm:text-[8px]
        "
      >
        {String(heroSlides.length).padStart(2, "0")}
      </span>
    </div>


    {/* =====================================================
        DESKTOP SLIDE INDICATORS
    ====================================================== */}

    <div
      className="
        absolute

        bottom-5
        right-5

        z-[60]

        hidden

        items-center
        gap-2

        lg:right-10
        lg:flex
      "
    >
      {heroSlides.map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => setSlide(index)}
          aria-label={`Go to slide ${index + 1}`}
          className="group p-1"
        >
          <span
            className={`
              block
              h-[2px]
              transition-all
              duration-500

              ${
                index === slide
                  ? "w-8 bg-neutral-950"
                  : "w-3.5 bg-neutral-300 group-hover:bg-neutral-500"
              }
            `}
          />
        </button>
      ))}
    </div>

  </div>
</section>

      {/* ================= FULL-WIDTH TRUST STRIP ================= */}
      <section className="relative w-full overflow-hidden bg-[#F4F3F0] py-16 sm:py-20 lg:py-24">
  <style>{`
    @keyframes ardenbyTrustMarquee {
      0% {
        transform: translate3d(0, 0, 0);
      }
      100% {
        transform: translate3d(-50%, 0, 0);
      }
    }

    .ardenby-trust-marquee {
      width: max-content;
      animation: ardenbyTrustMarquee 34s linear infinite;
      will-change: transform;
    }

    .ardenby-trust-track:hover .ardenby-trust-marquee {
      animation-play-state: paused;
    }

    @media (max-width: 640px) {
      .ardenby-trust-marquee {
        animation-duration: 28s;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ardenby-trust-marquee {
        animation: none;
      }
    }
  `}</style>

  {/* ================= HEADER ================= */}
  <div className="mx-auto mb-12 max-w-3xl px-5 text-center sm:mb-16">
    <div className="mb-5 flex items-center justify-center gap-3">
      <span className="h-px w-10 bg-neutral-300" />

      <span className="text-[9px] font-semibold uppercase tracking-[0.38em] text-neutral-400">
        The ARDENBY Standard
      </span>

      <span className="h-px w-10 bg-neutral-300" />
    </div>

    <h2 className="font-serif text-[32px] leading-none tracking-[-0.025em] text-neutral-950 sm:text-[40px] lg:text-[48px]">
      Made With Intention.
    </h2>

    <p className="mx-auto mt-4 max-w-lg text-[11px] leading-6 text-neutral-500 sm:text-xs">
      From the first stitch to the final delivery, every detail is
      considered to make your ARDENBY experience exceptional.
    </p>
  </div>

  {/* ================= MARQUEE ================= */}
  <div className="ardenby-trust-track relative w-full overflow-hidden">
    
    {/* Edge fade */}
    <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 bg-gradient-to-r from-[#F4F3F0] via-[#F4F3F0]/80 to-transparent sm:w-36" />

    <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20 bg-gradient-to-l from-[#F4F3F0] via-[#F4F3F0]/80 to-transparent sm:w-36" />

    <div className="ardenby-trust-marquee flex">
      {[...trustItems, ...trustItems].map(
        ({ Icon, title, desc }, index) => (
          <div
            key={`${title}-${index}`}
            className="
              group relative mx-2.5
              flex w-[290px] shrink-0
              items-center gap-5
              overflow-hidden
              rounded-[18px]
              border border-neutral-200/80
              bg-white
              px-5 py-5
              shadow-[0_8px_30px_rgba(0,0,0,0.045)]
              transition-all duration-500
              hover:-translate-y-1
              hover:border-neutral-300
              hover:shadow-[0_18px_45px_rgba(0,0,0,0.10)]
              sm:w-[360px]
              sm:px-6
              sm:py-6
            "
          >
            {/* Subtle inner glow */}
            <div
              className="
                pointer-events-none absolute
                -right-10 -top-10
                h-24 w-24
                rounded-full
                bg-neutral-100/70
                blur-2xl
                transition-all duration-500
                group-hover:bg-neutral-200
              "
            />

            {/* Number */}
            <div
              className="
                absolute right-4 top-3
                text-[8px] font-medium
                tracking-[0.2em]
                text-neutral-300
              "
            >
              {String((index % trustItems.length) + 1).padStart(2, "0")}
            </div>

            {/* Icon */}
            <div
              className="
                relative z-10
                flex h-12 w-12 shrink-0
                items-center justify-center
                rounded-xl
                border border-neutral-200
                bg-[#FAF9F5]
                shadow-[0_4px_14px_rgba(0,0,0,0.06)]
                transition-all duration-500
                group-hover:border-neutral-950
                group-hover:bg-neutral-950
                group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.18)]
              "
            >
              <Icon
                className="
                  h-[18px] w-[18px]
                  stroke-[1.5]
                  text-neutral-800
                  transition-all duration-500
                  group-hover:scale-110
                  group-hover:text-white
                "
              />
            </div>

            {/* Content */}
            <div className="relative z-10 min-w-0 pr-4">
              <p className="mb-1.5 text-[8px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
                ARDENBY Promise
              </p>

              <h3 className="text-[12px] font-semibold leading-tight tracking-wide text-neutral-950">
                {title}
              </h3>

              <p className="mt-1.5 line-clamp-2 text-[10px] leading-[1.65] text-neutral-500">
                {desc}
              </p>
            </div>

            {/* Bottom accent */}
            <div
              className="
                absolute bottom-0 left-5 right-5
                h-px
                origin-left
                scale-x-0
                bg-neutral-950
                transition-transform duration-500
                group-hover:scale-x-100
              "
            />
          </div>
        )
      )}
    </div>
  </div>

  {/* ================= BOTTOM STATEMENT ================= */}
  <div className="mx-auto mt-14 max-w-6xl px-5 sm:mt-16">
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-neutral-200" />

      <div className="flex items-center gap-3">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-950" />

        <span className="text-[8px] font-semibold uppercase tracking-[0.32em] text-neutral-400">
          Beyond Ordinary
        </span>

        <span className="h-1.5 w-1.5 rounded-full bg-neutral-950" />
      </div>

      <div className="h-px flex-1 bg-neutral-200" />
    </div>
  </div>
</section>
      {/* ================= SHOP BY CATEGORY ================= */}
    {/* ================================================================
    SHOP BY SUB-CATEGORY
    Desktop + Mobile Production Section
================================================================ */}

<section className="w-full bg-[#F8F7F3] px-4 py-10 sm:px-6 lg:px-9 lg:py-14">

  {/* ================================================================
      DESKTOP SECTION HEADER
  ================================================================= */}

  <div className="mb-8 hidden items-end justify-between gap-10 lg:flex">

    {/* LEFT CONTENT */}
    <div>

      {/* Eyebrow */}
      <div className="mb-4 flex items-center gap-3">

        <span className="h-px w-7 bg-neutral-500" />

        <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-neutral-500">
          Architectural Fits
        </span>

      </div>

      {/* Main Heading */}
     <h4 className="font-serif text-[36px] font-normal leading-[1] tracking-[-0.02em] text-neutral-950 sm:text-[40px] lg:text-[44px]">
  Shop by Sub-Category.
</h4>

      {/* Subtitle */}
      <p className="mt-4 font-serif text-[19px] text-neutral-500">
        Four distinct collections. One attitude.
      </p>

    </div>


    {/* RIGHT CONTENT */}
    <div className="flex flex-col items-end gap-5 pb-1">

      <p className="max-w-[190px] text-right text-[9px] uppercase leading-5 tracking-[0.25em] text-neutral-400">
        More than clothing.
        <br />
        A lifestyle.
      </p>

      <Link
        href="/shop"
        className="
          group
          inline-flex
          h-11
          items-center
          gap-4
          rounded-full
          bg-neutral-950
          px-6
          text-[9px]
          font-bold
          uppercase
          tracking-[0.2em]
          text-white
          transition-all
          duration-300
          hover:bg-neutral-800
        "
      >

        <span>
          Explore All Categories
        </span>

        <ArrowRight
          className="
            h-3.5
            w-3.5
            transition-transform
            duration-300
            group-hover:translate-x-1
          "
        />

      </Link>

    </div>

  </div>


  {/* ================================================================
      MOBILE SECTION HEADER
  ================================================================= */}

  <div className="mb-6 lg:hidden">

    {/* Eyebrow */}
    <div className="mb-3 flex items-center gap-2.5">

      <span className="h-px w-6 bg-neutral-400" />

      <span className="text-[8px] font-medium uppercase tracking-[0.25em] text-neutral-500">
        Architectural Fits
      </span>

    </div>


    {/* Mobile Heading */}
    <h2 className="font-serif text-[36px] font-normal leading-[0.9] tracking-[-0.04em] text-neutral-950">
      Shop by
      <br />
      Sub-Category.
    </h2>


    {/* Mobile Subtitle */}
    <p className="mt-3 font-serif text-[14px] text-neutral-500">
      Four distinct collections. One attitude.
    </p>


    {/* ================================================================
        MOBILE CATEGORY PILLS
    ================================================================= */}

    <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

      {/* ALL */}
      <Link
        href="/shop"
        className="
          shrink-0
          rounded-full
          bg-neutral-950
          px-4
          py-2
          text-[7px]
          font-bold
          uppercase
          tracking-[0.14em]
          text-white
        "
      >
        All
      </Link>


      {/* SUPREME */}
      <Link
        href="/shop?category=supreme-edition"
        className="
          shrink-0
          rounded-full
          bg-white
          px-4
          py-2
          text-[7px]
          font-semibold
          uppercase
          tracking-[0.12em]
          text-neutral-700
        "
      >
        Supreme Edition
      </Link>


      {/* EPIC THREAD */}
      <Link
        href="/shop?category=epic-thread"
        className="
          shrink-0
          rounded-full
          bg-white
          px-4
          py-2
          text-[7px]
          font-semibold
          uppercase
          tracking-[0.12em]
          text-neutral-700
        "
      >
        Epic Thread
      </Link>


      {/* PREMIUM */}
      <Link
        href="/shop?category=ardenby-premium"
        className="
          shrink-0
          rounded-full
          bg-white
          px-4
          py-2
          text-[7px]
          font-semibold
          uppercase
          tracking-[0.12em]
          text-neutral-700
        "
      >
        Premium
      </Link>

    </div>

  </div>


  {/* ================================================================
      DESKTOP — FOUR COLLECTION CARDS
  ================================================================= */}

  <div className="hidden grid-cols-4 gap-4 lg:grid">

    {categories.slice(0, 4).map((cat, index) => {

      const catProduct = products.find(
        (p) => p.category === cat.slug
      );


      const productImage =
        catProduct?.images?.[0] ||
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop";


      const cardData = [
        {
          top: "240 GSM",
          label: "HEAVYWEIGHT OVERSIZED DROPS",
          description: "Bold silhouettes. Timeless essentials.",
          position: "object-center",
        },

        {
          top: "GRAPHIC TEES",
          label: "GRAPHIC & PRINTED TEES",
          description: "Premium prints. Bolder stories.",
          position: "object-center",
        },

        {
          top: "EVERYDAY LUXURY",
          label: "LONG-STAPLE COTTON ESSENTIALS",
          description: "Everyday luxury. Elevated basics.",
          position: "object-center",
        },

        {
          top: "BOLD PRINTS",
          label: "STATEMENT PIECES",
          description: "No limits. Just expression.",
          position: "object-center",
        },
      ][index];


      return (
        <motion.div
          key={cat.slug}
          initial={{
            opacity: 0,
            y: 18,
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
            delay: index * 0.06,
            ease: [0.22, 1, 0.36, 1],
          }}
        >

          <Link
            href={`/shop?category=${cat.slug}`}
            className="
              group
              relative
              block
              aspect-[0.69]
              w-full
              overflow-hidden
              rounded-[14px]
              bg-neutral-200
            "
          >

            {/* ======================================================
                DESKTOP IMAGE
            ======================================================= */}

            <img
              src={productImage}
              alt={cat.name}
              className={`
                absolute
                inset-0
                h-full
                w-full
                object-cover
                ${cardData.position}
                transition-transform
                duration-700
                ease-out
                group-hover:scale-[1.035]
              `}
            />


            {/* ======================================================
                TOP IMAGE GRADIENT
            ======================================================= */}

            <div
              className="
                pointer-events-none
                absolute
                inset-x-0
                top-0
                h-32
                bg-gradient-to-b
                from-black/20
                to-transparent
              "
            />


            {/* ======================================================
                BOTTOM IMAGE GRADIENT
            ======================================================= */}

            <div
              className="
                pointer-events-none
                absolute
                inset-x-0
                bottom-0
                h-[60%]
                bg-gradient-to-t
                from-black/[0.94]
                via-black/50
                to-transparent
              "
            />


            {/* ======================================================
                TOP META
            ======================================================= */}

            <div
              className="
                absolute
                inset-x-0
                top-0
                z-10
                flex
                items-center
                justify-between
                p-5
              "
            >

              <div className="flex items-center gap-3 text-white">

                <span className="font-mono text-[10px] tracking-[0.18em]">
                  0{index + 1}
                </span>

                <span className="h-px w-7 bg-white/70" />

              </div>


              <span className="text-[7px] font-semibold uppercase tracking-[0.18em] text-white">
                {cardData.top}
              </span>

            </div>


            {/* ======================================================
                DESKTOP CENTER HOVER ARROW
            ======================================================= */}

            <div
              className="
                absolute
                right-5
                top-1/2
                z-20
                hidden
                h-10
                w-10
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-white/60
                bg-white/10
                text-white
                opacity-0
                backdrop-blur-sm
                transition-all
                duration-500
                group-hover:opacity-100
                lg:flex
              "
            >

              <ArrowUpRight className="h-4 w-4" />

            </div>


            {/* ======================================================
                DESKTOP BOTTOM CONTENT
            ======================================================= */}

            <div
              className="
                absolute
                inset-x-0
                bottom-0
                z-10
                p-5
              "
            >

              {/* Label */}
              <div className="mb-2 flex items-center gap-2">

                <span className="h-px w-5 bg-white/80" />

                <span className="text-[7px] font-bold uppercase tracking-[0.19em] text-white">
                  {cardData.label}
                </span>

              </div>


              {/* Title */}
              <h3 className="font-serif text-[28px] font-normal leading-none tracking-[-0.025em] text-white">
                {cat.name}
              </h3>


              {/* Description */}
              <p className="mt-2 max-w-[190px] text-[10px] leading-[1.45] text-white/80">
                {cardData.description}
              </p>


              {/* Divider */}
              <div className="my-4 border-t border-white/25" />


              {/* Action */}
              <div className="flex items-center justify-between">

                <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-white">
                  Explore
                </span>


                <span
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/70
                    text-white
                    transition-all
                    duration-300
                    group-hover:bg-white
                    group-hover:text-neutral-950
                  "
                >

                  <ArrowRight className="h-4 w-4" />

                </span>

              </div>

            </div>

          </Link>

        </motion.div>
      );
    })}

  </div>


  {/* ================================================================
      MOBILE — FOUR HORIZONTAL EDITORIAL CARDS
  ================================================================= */}

  <div className="flex flex-col gap-3 lg:hidden">

    {categories.slice(0, 4).map((cat, index) => {

      const catProduct = products.find(
        (p) => p.category === cat.slug
      );


      const productImage =
        catProduct?.images?.[0] ||
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop";


      /* --------------------------------------------------------------
          IMPORTANT:
          Different object positions prevent heads/faces from being
          unnecessarily pushed outside the mobile crop.
      -------------------------------------------------------------- */

      const cardData = [
        {
          top: "240 GSM",
          label: "HEAVYWEIGHT OVERSIZED DROPS",
          description: "Bold silhouettes. Timeless essentials.",
          position: "object-[center_18%]",
        },

        {
          top: "GRAPHIC TEES",
          label: "GRAPHIC & PRINTED TEES",
          description: "Premium prints. Bolder stories.",
          position: "object-[center_18%]",
        },

        {
          top: "EVERYDAY LUXURY",
          label: "LONG-STAPLE COTTON ESSENTIALS",
          description: "Everyday luxury. Elevated basics.",
          position: "object-[center_18%]",
        },

        {
          top: "BOLD PRINTS",
          label: "STATEMENT PIECES",
          description: "No limits. Just expression.",
          position: "object-[center_15%]",
        },
      ][index];


      return (
        <motion.div
          key={cat.slug}
          initial={{
            opacity: 0,
            y: 12,
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
            duration: 0.45,
            delay: index * 0.05,
            ease: [0.22, 1, 0.36, 1],
          }}
        >

          <Link
            href={`/shop?category=${cat.slug}`}
            className="
              group
              relative
              block
              h-[158px]
              w-full
              overflow-hidden
              rounded-[14px]
              bg-neutral-900
              sm:h-[175px]
            "
          >

            {/* ======================================================
                MOBILE SINGLE IMAGE
            ======================================================= */}

            <img
              src={productImage}
              alt={cat.name}
              className={`
                absolute
                inset-0
                h-full
                w-full
                object-cover
                ${cardData.position}
                transition-transform
                duration-700
                ease-out
                group-hover:scale-[1.025]
              `}
            />


            {/* ======================================================
                MOBILE LEFT GRADIENT
            ======================================================= */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                bg-gradient-to-r
                from-black/75
                via-black/30
                to-transparent
              "
            />


            {/* ======================================================
                MOBILE BOTTOM GRADIENT
            ======================================================= */}

            <div
              className="
                pointer-events-none
                absolute
                inset-x-0
                bottom-0
                h-24
                bg-gradient-to-t
                from-black/75
                to-transparent
              "
            />


            {/* ======================================================
                MOBILE TOP META
            ======================================================= */}

            <div
              className="
                absolute
                inset-x-0
                top-0
                z-10
                flex
                items-center
                justify-between
                px-4
                py-3.5
              "
            >

              <div className="flex items-center gap-2.5 text-white">

                <span className="font-mono text-[8px] tracking-[0.18em]">
                  0{index + 1}
                </span>

                <span className="h-px w-5 bg-white/70" />

              </div>


              <span className="text-[6px] font-semibold uppercase tracking-[0.15em] text-white">
                {cardData.top}
              </span>

            </div>


            {/* ======================================================
                MOBILE CONTENT
            ======================================================= */}

            <div
              className="
                absolute
                bottom-0
                left-0
                z-10
                w-full
                px-4
                pb-3.5
                pr-16
              "
            >

              {/* Label */}
              <div className="mb-1.5 flex items-center gap-1.5">

                <span className="h-px w-4 bg-white/70" />

                <span className="text-[6px] font-bold uppercase tracking-[0.17em] text-white">
                  {cardData.label}
                </span>

              </div>


              {/* Title */}
              <h3 className="font-serif text-[22px] font-normal leading-none tracking-[-0.025em] text-white">
                {cat.name}
              </h3>


              {/* Description */}
              <p className="mt-1.5 max-w-[210px] text-[8px] leading-3.5 text-white/75">
                {cardData.description}
              </p>


              {/* Explore */}
              <div className="mt-2.5 flex items-center gap-1.5">

                <span className="text-[6px] font-bold uppercase tracking-[0.18em] text-white">
                  Explore
                </span>

                <ArrowRight className="h-2.5 w-2.5 text-white" />

              </div>

            </div>


            {/* ======================================================
                MOBILE ROUND ARROW
            ======================================================= */}

            <span
              className="
                absolute
                bottom-3.5
                right-4
                z-20
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-white
                text-neutral-950
                shadow-lg
                transition-transform
                duration-300
                group-active:scale-95
              "
            >

              <ArrowRight className="h-3.5 w-3.5" />

            </span>

          </Link>

        </motion.div>
      );
    })}

  </div>


  {/* ================================================================
      MOBILE EXPLORE CTA
  ================================================================= */}

  <Link
    href="/shop"
    className="
      group
      mt-4
      flex
      h-12
      w-full
      items-center
      justify-center
      gap-3
      rounded-full 
      bg-neutral-950
      text-[8px]
      font-bold
      uppercase
      tracking-[0.2em]
      text-white
      transition-colors
      duration-300
      hover:bg-neutral-800
      lg:hidden
    "
  >

    <span>
      Explore All Categories
    </span>

    <ArrowRight
      className="
        h-3.5
        w-3.5
        transition-transform
        duration-300
        group-hover:translate-x-1
      "
    />

  </Link>


  {/* ================================================================
      DESKTOP TRUST STRIP
  ================================================================= */}




  {/* ================================================================
      MOBILE BENEFITS
  ================================================================= */}

  
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
          product={product}
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
              product={product}
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
            product={product}
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

            <p className="mt-4 font-serif text-[17px] leading-[1.45] text-white/75 sm:text-[20px]">
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