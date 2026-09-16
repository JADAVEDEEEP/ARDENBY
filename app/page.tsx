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
      <section className="w-full px-3 py-3 sm:px-6 sm:py-4 lg:px-10">
        <div className="grid w-full grid-cols-2 gap-2.5 rounded-2xl border border-black/5 bg-white p-2.5 shadow-xs sm:gap-4 lg:grid-cols-4 lg:p-4">
          {trustItems.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-xl bg-[#FAF9F5] p-3 transition-all duration-300 hover:bg-[#F2EFE8] sm:gap-3.5 sm:p-3.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs sm:h-9 sm:w-9">
                <Icon className="h-3.5 w-3.5 text-neutral-900 stroke-[1.75] sm:h-4 sm:w-4" />
              </div>
              <div>
                <h3 className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-neutral-900 sm:text-[9.5px] sm:tracking-[0.16em]">
                  {title}
                </h3>
                <p className="mt-0.5 hidden text-[10px] font-light text-neutral-500 md:block">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SHOP BY CATEGORY ================= */}
      <section className="w-full px-3 py-8 sm:px-6 lg:px-10 lg:py-14">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white/80 px-3 py-1 text-[8px] font-bold uppercase tracking-[0.22em] text-neutral-700 backdrop-blur-sm sm:text-[8.5px] sm:tracking-[0.25em]">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Architectural Fits
            </span>
            <h2 className="mt-2 font-serif text-2xl font-normal tracking-[-0.035em] text-neutral-950 sm:text-4xl lg:text-5xl">
              Shop by Sub-Category
            </h2>
          </div>

          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 self-start rounded-full border border-neutral-300 bg-white px-4 py-2 text-[8.5px] font-bold uppercase tracking-[0.2em] text-neutral-900 transition-all hover:border-neutral-950 hover:bg-neutral-950 hover:text-white sm:px-5 sm:py-2.5 sm:text-[9px]"
          >
            Explore All Categories
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {categories.slice(0, 4).map((cat, index) => {
            const catProduct = products.find((p) => p.category === cat.slug);

            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.45, ease }}
                className="group relative w-full"
              >
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className="relative block aspect-[3/4] w-full overflow-hidden rounded-2xl border border-black/10 bg-stone-200 shadow-xs transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-xl sm:rounded-3xl"
                >
                  {catProduct && (
                    <img
                      src={catProduct.images[0]}
                      alt={cat.name}
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5 transition-opacity duration-300 group-hover:from-black/90" />

                  <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 sm:top-4 sm:inset-x-4">
                    <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 text-[7.5px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md sm:px-3 sm:py-1 sm:text-[8px]">
                      Drop 0{index + 1}
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105 sm:h-8 sm:w-8">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <div className="absolute inset-x-2.5 bottom-2.5 z-10 rounded-xl border border-white/15 bg-neutral-950/65 p-3 text-white backdrop-blur-md transition-colors duration-300 group-hover:bg-neutral-950/80 sm:inset-x-3 sm:bottom-3 sm:rounded-2xl sm:p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[7.5px] font-bold uppercase tracking-[0.2em] text-amber-300 sm:text-[8px]">
                        {cat.desc}
                      </span>
                      <span className="hidden text-[8.5px] font-light text-neutral-300 sm:block">
                        240 GSM
                      </span>
                    </div>

                    <h3 className="mt-0.5 font-serif text-lg font-normal tracking-tight sm:mt-1 sm:text-2xl">
                      {cat.name}
                    </h3>

                    <div className="mt-1.5 flex items-center gap-1.5 text-[7.5px] font-bold uppercase tracking-[0.18em] text-white/80 group-hover:text-white sm:mt-2 sm:text-[8.5px]">
                      <span>Browse Line</span>
                      <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ================= EDITORIAL / SUPREME BANNER (FIXED DESKTOP GRID & WHITE TRANSPARENT CUTOUT) ================= */}
      <section className="w-full px-3 pb-8 sm:px-6 lg:px-10 lg:pb-14">
        <div className="relative w-full overflow-hidden rounded-3xl border border-neutral-800 bg-[#0C0C0C] text-white shadow-2xl">
          <div className="relative grid w-full min-h-[440px] lg:min-h-[520px] lg:grid-cols-12 lg:items-center">
            
            {/* Image Layer: Mobile absolute background overlay / Desktop relative right column */}
            <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-35 sm:opacity-50 lg:relative lg:inset-auto lg:col-span-6 lg:z-10 lg:h-[520px] lg:opacity-100">
              {/* Backlight Glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-stone-300/10 blur-2xl pointer-events-none" />

              <img
                src="/images/hero-linen.png"
                alt="Supreme Edition Lookbook"
                className="h-full w-auto max-w-full object-contain object-bottom transition-transform duration-700 hover:scale-105"
              />
              
              {/* Mobile Readability Gradient Mask */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C] via-[#0C0C0C]/70 to-transparent lg:hidden" />
            </div>

            {/* Text Content Layer: Mobile overlay on top / Desktop left column */}
            <div className="relative z-20 flex flex-col justify-center p-6 sm:p-10 lg:col-span-6 lg:p-14 xl:p-16 lg:order-first">
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 text-[8px] font-bold uppercase tracking-[0.22em] text-amber-300 backdrop-blur-md sm:text-[8.5px]">
                <Flame className="h-3.5 w-3.5" />
                Limited Supreme Release
              </div>

              <h2 className="mt-4 font-serif text-3xl font-normal leading-[0.98] tracking-[-0.04em] sm:mt-6 sm:text-5xl lg:text-6xl">
                Supreme <br className="hidden sm:block" />
                Edition '26
              </h2>

              <p className="mt-3 max-w-lg text-xs font-light leading-5 text-neutral-300 sm:mt-4 sm:text-sm sm:leading-6">
                Custom high-density screen graphics, 240 GSM combed cotton, raw-edge stitch accents, and an architectural oversized drape.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link
                  href="/shop?category=supreme-edition"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-6 py-3.5 text-[8.5px] font-bold uppercase tracking-[0.2em] text-black transition-all hover:bg-neutral-200 sm:text-[9px]"
                >
                  Shop Supreme Drop
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>

                <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-[8px] font-semibold uppercase tracking-[0.2em] text-neutral-200 backdrop-blur-md sm:text-[8.5px]">
                  <span>Only 300 Pieces Created</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= BEST SELLERS ================= */}
      <section className="w-full px-3 pb-8 sm:px-6 lg:px-10 lg:pb-14">
        <div className="mb-6 flex items-end justify-between border-b border-black/10 pb-4">
          <div>
            <span className="text-[8.5px] font-bold uppercase tracking-[0.25em] text-neutral-500 sm:text-[9px]">
              High Demand
            </span>
            <h2 className="mt-1 font-serif text-2xl font-normal tracking-tight sm:text-4xl">
              Best Sellers
            </h2>
          </div>
          <Link
            href="/shop"
            className="group hidden items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.2em] text-neutral-900 hover:text-neutral-600 sm:flex"
          >
            Explore All Fits
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="grid w-full grid-cols-2 gap-x-2.5 gap-y-6 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-10">
          {bestSellers.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>

      {/* ================= NEW ARRIVALS ================= */}
      <section className="w-full px-3 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="w-full rounded-3xl border border-black/10 bg-[#EFECE4] p-4 sm:p-8 lg:p-10">
          <div className="mb-6 flex flex-col justify-between gap-4 border-b border-black/10 pb-5 md:flex-row md:items-end">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[8.5px] font-bold uppercase tracking-[0.25em] text-neutral-600 sm:text-[9px]">
                <SlidersHorizontal className="h-3 w-3" />
                Fresh Drops • SS26
              </span>
              <h2 className="mt-0.5 font-serif text-2xl font-normal tracking-tight text-neutral-950 sm:text-4xl">
                New Arrivals
              </h2>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "all", label: "All Fits" },
                { id: "supreme-edition", label: "Supreme Edition" },
                { id: "epic-thread", label: "Epic Thread" },
                { id: "ardenby-premium", label: "Ardenby Premium" },
                { id: "the-print-club", label: "Print Club" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSubCat(tab.id)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[8px] font-bold uppercase tracking-[0.18em] transition-all duration-300 sm:px-4 sm:py-2 sm:text-[8.5px] ${
                    selectedSubCat === tab.id
                      ? "bg-neutral-950 text-white shadow-md"
                      : "bg-white/80 text-neutral-700 hover:bg-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-x-2.5 gap-y-6 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-5">
            {filteredNewArrivals.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= TRENDING NOW ================= */}
      <section className="w-full px-3 py-8 sm:px-6 lg:px-10 lg:py-14">
        <div className="mb-6 text-center sm:mb-8">
          <span className="text-[8.5px] font-bold uppercase tracking-[0.28em] text-neutral-400 sm:text-[9px]">
            Community Top Picks
          </span>
          <h2 className="mt-1 font-serif text-2xl font-normal tracking-[-0.035em] sm:text-4xl">
            Trending Now
          </h2>
        </div>

        <div className="grid w-full grid-cols-2 gap-x-2.5 gap-y-6 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-5">
          {trending.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>

      {/* ================= BRAND PHILOSOPHY ================= */}
      <section className="w-full px-3 pb-8 sm:px-6 lg:px-10 lg:pb-14">
        <div className="w-full rounded-3xl bg-[#0F0F0F] px-5 py-10 text-[#F8F7F3] sm:px-10 lg:px-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <div>
              <span className="text-[8.5px] font-bold uppercase tracking-[0.28em] text-amber-400 sm:text-[9.5px]">
                Core Standard
              </span>
              <h2 className="mt-2 font-serif text-2xl font-normal leading-[1.08] tracking-[-0.04em] sm:mt-3 sm:text-4xl lg:text-5xl">
                Crafted with precision. <br /> Built for identity.
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
              {philosophy.map((item) => (
                <div
                  key={item.num}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-colors hover:border-white/20 sm:p-6"
                >
                  <span className="font-serif text-xl font-light text-amber-400 sm:text-2xl">
                    {item.num}
                  </span>
                  <h3 className="mt-2 font-serif text-lg font-normal sm:mt-3 sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs font-light leading-5 text-neutral-400 sm:mt-2">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= REVIEWS ================= */}
      <section className="w-full px-3 py-8 sm:px-6 lg:px-10 lg:py-14">
        <div className="flex flex-col items-center text-center">
          <span className="text-[8.5px] font-bold uppercase tracking-[0.28em] text-neutral-400 sm:text-[9.5px]">
            Real Customer Reviews
          </span>
          <h2 className="mt-1 font-serif text-2xl font-normal tracking-[-0.035em] sm:text-4xl">
            What The Fam Says
          </h2>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex gap-0.5 text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-600 sm:text-[10px]">
              4.9 / 5 Rating (2,800+ Orders)
            </span>
          </div>
        </div>

        <div className="mt-8 grid w-full gap-4 md:grid-cols-3 sm:mt-10 sm:gap-5">
          {reviews.map((review) => (
            <div
              key={review.name}
              className="flex flex-col justify-between rounded-3xl border border-black/10 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1 sm:p-8"
            >
              <div>
                <div className="flex gap-1 text-amber-400">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                </div>
                <p className="mt-3 font-serif text-sm leading-6 text-neutral-800 sm:mt-4 sm:text-base sm:leading-7">
                  “{review.text}”
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-3.5 sm:mt-6 sm:pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-950 text-[10px] font-bold text-white sm:h-8 sm:w-8 sm:text-xs">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] sm:text-[9.5px]">
                      {review.name}
                    </p>
                    <p className="text-[7.5px] uppercase tracking-[0.15em] text-emerald-600 font-semibold flex items-center gap-1 sm:text-[8px]">
                      <Check className="h-2.5 w-2.5" />
                      {review.tag}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= NEWSLETTER ================= */}
      <section className="w-full px-3 pb-12 sm:px-6 lg:px-10">
        <div className="relative w-full overflow-hidden rounded-3xl bg-[#080808] py-12 px-5 text-white text-center sm:py-20 sm:px-12">
          <div className="relative z-10 mx-auto max-w-2xl">
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-[8px] font-bold uppercase tracking-[0.22em] text-amber-300 sm:text-[8.5px]">
              Exclusive Access
            </span>
            <h2 className="mt-3 font-serif text-3xl font-normal tracking-tight sm:mt-4 sm:text-5xl">
              Join the ARDENBY Fam
            </h2>
            <p className="mt-2 text-xs font-light text-neutral-400 sm:mt-3 sm:text-sm">
              Get early drop links, VIP discounts, and 10% off your inaugural order.
            </p>

            {subscribed ? (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-neutral-900 border border-neutral-800 px-5 py-3 text-xs text-neutral-200 sm:mt-8 sm:px-6 sm:py-3.5">
                <Check className="h-4 w-4 text-emerald-400" />
                You are on the list. Welcome to the family.
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:items-center sm:justify-center sm:gap-3"
              >
                <div className="relative w-full max-w-md">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full rounded-full bg-neutral-900 border border-neutral-800 py-3 pl-11 pr-4 text-xs text-white placeholder-neutral-500 focus:border-neutral-400 focus:outline-none sm:py-3.5"
                  />
                </div>
                <button
                  type="submit"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-[8.5px] font-bold uppercase tracking-[0.2em] text-black transition hover:bg-neutral-200 sm:py-3.5 sm:text-[9px]"
                >
                  Subscribe
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}