"use client";

import Link from "next/link";
import {
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  ArrowUpRight,
  ChevronDown,
  ArrowRight,
  Check,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/* ================================================================
   FOOTER CONTENT
================================================================ */

const footerLinks = {
  Categories: [
    { label: "Supreme Edition", href: "/shop?category=supreme-edition" },
    { label: "Epic Thread", href: "/shop?category=epic-thread" },
    { label: "Ardenby Premium", href: "/shop?category=ardenby-premium" },
    { label: "The Print Club", href: "/shop?category=the-print-club" },
    { label: "Bottom Wear", href: "/shop?category=bottom-wear" },
  ],

  Company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Sustainability", href: "/sustainability" },
  ],

  Support: [
    { label: "Contact Us", href: "/contact" },
    { label: "Shipping Policy", href: "/shipping" },
    { label: "Returns & Exchange", href: "/returns" },
    { label: "FAQs", href: "/faqs" },
    { label: "Track Order", href: "/orders" },
  ],
};

const socialLinks = [
  {
    label: "Instagram",
    Icon: Instagram,
    href: "#",
  },
  {
    label: "Twitter",
    Icon: Twitter,
    href: "#",
  },
  {
    label: "Facebook",
    Icon: Facebook,
    href: "#",
  },
  {
    label: "Youtube",
    Icon: Youtube,
    href: "#",
  },
];

const marqueeText = "WEAR BEYOND ORDINARY";

/* ================================================================
   FOOTER
================================================================ */

export function Footer() {
  const [email, setEmail] = useState("");
  const [openSections, setOpenSections] = useState<
    Record<string, boolean>
  >({});
  const [subscribed, setSubscribed] = useState(false);

  /* ================================================================
     NEWSLETTER
  ================================================================= */

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    setSubscribed(true);

    toast.success(
      "Welcome to the ARDENBY Fam! Check your inbox for 10% off."
    );

    setEmail("");
  };

  /* ================================================================
     ACCORDION
  ================================================================= */

  const toggleAccordion = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <footer className="relative overflow-hidden border-t border-neutral-800 bg-[#090909] text-stone-200">

      {/* ============================================================
          NEWSLETTER / EXCLUSIVE ACCESS
      ============================================================ */}

      <section className="border-b border-white/[0.08]">

        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">

          <div className="relative overflow-hidden border border-white/[0.08] bg-[#0D0D0D] px-5 py-12 text-center sm:px-10 sm:py-16 lg:px-16 lg:py-20">

            {/* Background rings */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -right-40
                -top-40
                h-[420px]
                w-[420px]
                rounded-full
                border
                border-white/[0.035]
              "
            />

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -bottom-48
                -left-48
                h-[500px]
                w-[500px]
                rounded-full
                border
                border-white/[0.03]
              "
            />

            <div className="relative z-10 mx-auto max-w-[650px]">

              {/* Eyebrow */}
              <div className="flex items-center justify-center gap-3">

                <span className="h-px w-7 bg-amber-300/50" />

                <span className="text-[8px] font-semibold uppercase tracking-[0.3em] text-amber-200/80 sm:text-[9px]">
                  Exclusive Privilege
                </span>

                <span className="h-px w-7 bg-amber-300/50" />

              </div>

              {/* Heading */}
              <h2
                className="
                  mt-4
                  font-serif
                  text-[34px]
                  font-normal
                  leading-none
                  tracking-[-0.04em]
                  text-white
                  sm:text-[48px]
                  lg:text-[58px]
                "
              >
                Join the ARDENBY Fam
              </h2>

              {/* Description */}
              <p className="mx-auto mt-4 max-w-[480px] text-[10px] font-light leading-5 text-neutral-400 sm:text-[12px] sm:leading-6">
                Get early access to limited drops, runway insights,
                and 10% off your inaugural order.
              </p>

              {/* ======================================================
                  SUCCESS
              ====================================================== */}

              {subscribed ? (

                <div className="mx-auto mt-8 flex w-fit items-center gap-3 border border-white/10 bg-white/[0.04] px-5 py-3.5">

                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/10">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </div>

                  <div className="text-left">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white">
                      You're In
                    </p>

                    <p className="mt-0.5 text-[9px] text-neutral-500">
                      Welcome to the ARDENBY family.
                    </p>
                  </div>

                </div>

              ) : (

                /* ====================================================
                   FORM
                ==================================================== */

                <form
                  onSubmit={handleSubscribe}
                  className="
                    mx-auto
                    mt-8
                    flex
                    w-full
                    max-w-[520px]
                    flex-col
                    gap-2
                    sm:flex-row
                    sm:gap-2.5
                  "
                >

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    aria-label="Email address"
                    className="
                      h-12
                      w-full
                      min-w-0
                      flex-1
                      border
                      border-white/10
                      bg-white/[0.045]
                      px-4
                      text-[10px]
                      text-white
                      outline-none
                      placeholder:text-neutral-600
                      transition-all
                      duration-300
                      focus:border-white/30
                      focus:bg-white/[0.07]
                      sm:h-[50px]
                      sm:px-5
                      sm:text-[11px]
                    "
                  />

                  <button
                    type="submit"
                    className="
                      group
                      inline-flex
                      h-12
                      shrink-0
                      items-center
                      justify-center
                      gap-2
                      bg-white
                      px-7
                      text-[8px]
                      font-bold
                      uppercase
                      tracking-[0.2em]
                      text-black
                      transition-all
                      duration-300
                      hover:bg-neutral-200
                      active:scale-[0.98]
                      sm:h-[50px]
                      sm:px-8
                      sm:text-[9px]
                    "
                  >
                    Subscribe

                    <ArrowRight
                      className="
                        h-3.5
                        w-3.5
                        transition-transform
                        duration-300
                        group-hover:translate-x-1
                      "
                    />
                  </button>

                </form>

              )}

              {!subscribed && (
                <p className="mt-4 text-[7px] uppercase tracking-[0.2em] text-neutral-600">
                  No spam. Just ARDENBY.
                </p>
              )}

            </div>
          </div>

        </div>
      </section>


      {/* ============================================================
          MAIN FOOTER CONTENT
      ============================================================ */}

      <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20">

        <div className="grid gap-12 md:grid-cols-5 lg:gap-16">

          {/* ========================================================
              BRAND
          ======================================================== */}

          <div className="md:col-span-2">

            <Link
              href="/"
              className="group inline-block"
            >

              <div className="flex flex-col leading-none">

                <span
                  className="
                    text-[30px]
                    font-bold
                    uppercase
                    tracking-[-0.08em]
                    text-white
                    transition-opacity
                    duration-300
                    group-hover:opacity-80
                    sm:text-[34px]
                  "
                  style={{
                    fontFamily: "Didot, Bodoni MT, serif",
                  }}
                >
                  ARDENBY
                </span>

                <div className="mt-2 flex items-center gap-2">

                  <span className="h-px w-7 bg-white/35" />

                  <span className="text-[7px] uppercase tracking-[0.34em] text-white/60">
                    WEAR YOUR ESSENCE
                  </span>

                  <span className="h-px w-7 bg-white/35" />

                </div>

              </div>

            </Link>


            {/* BRAND DESCRIPTION */}

            <p className="mt-6 max-w-[390px] text-[11px] font-light leading-[1.8] text-neutral-500 sm:text-[12px]">
              Premium men's clothing crafted for the bold.
              High-density fabrics, relaxed cuts, and minimalist
              luxury aesthetics.
            </p>


            {/* BRAND DETAIL */}

            <div className="mt-7 flex items-center gap-3">

              <span className="font-mono text-[8px] tracking-[0.2em] text-neutral-600">
                EST. 2026
              </span>

              <span className="h-px w-6 bg-neutral-800" />

              <span className="text-[7px] font-semibold uppercase tracking-[0.2em] text-neutral-600">
                INDIA
              </span>

            </div>


            {/* SOCIALS */}

            <div className="mt-7 flex gap-2.5">

              {socialLinks.map(({ Icon, href, label }) => (

                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="
                    group
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    border
                    border-white/[0.08]
                    bg-white/[0.025]
                    text-neutral-500
                    transition-all
                    duration-300
                    hover:border-white/20
                    hover:bg-white
                    hover:text-black
                  "
                >
                  <Icon
                    className="h-3.5 w-3.5"
                    strokeWidth={1.5}
                  />
                </a>

              ))}

            </div>

          </div>


          {/* ========================================================
              DYNAMIC LINK COLUMNS
          ======================================================== */}

          {Object.entries(footerLinks).map(
            ([title, links], columnIndex) => (

              <div
                key={title}
                className="border-b border-white/[0.07] pb-5 last:border-b-0 md:border-none md:pb-0"
              >

                {/* COLUMN HEADER */}

                <button
                  type="button"
                  onClick={() => toggleAccordion(title)}
                  className="
                    flex
                    w-full
                    items-center
                    justify-between
                    text-left
                    md:pointer-events-none
                  "
                >

                  <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white">
                    {title}
                  </span>

                  <ChevronDown
                    className={`
                      h-3.5
                      w-3.5
                      text-neutral-500
                      transition-transform
                      duration-300
                      md:hidden
                      ${
                        openSections[title]
                          ? "rotate-180"
                          : ""
                      }
                    `}
                  />

                </button>


                {/* LINKS */}

                <ul
                  className={`
                    mt-4
                    space-y-3
                    overflow-hidden
                    transition-all
                    duration-300
                    md:max-h-none
                    md:opacity-100
                    ${
                      openSections[title]
                        ? "max-h-80 opacity-100"
                        : "max-h-0 opacity-0 md:max-h-none"
                    }
                  `}
                >

                  {links.map((link, linkIndex) => (

                    <li key={link.label}>

                      <Link
                        href={link.href}
                        className="
                          group
                          inline-flex
                          items-center
                          gap-1.5
                          text-[10px]
                          font-light
                          text-neutral-500
                          transition-colors
                          duration-200
                          hover:text-white
                          sm:text-[11px]
                        "
                      >

                        <span>
                          {link.label}
                        </span>

                        <ArrowUpRight
                          className="
                            h-2.5
                            w-2.5
                            opacity-0
                            transition-all
                            duration-200
                            group-hover:-translate-y-0.5
                            group-hover:translate-x-0.5
                            group-hover:opacity-100
                          "
                        />

                      </Link>

                    </li>

                  ))}

                </ul>

              </div>

            )
          )}

        </div>

      </section>


      {/* ============================================================
          MARQUEE
      ============================================================ */}

      <div className="overflow-hidden border-y border-white/[0.07] bg-black/30 py-4">

        <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-8">

          {Array.from({ length: 18 }).map((_, index) => (

            <div
              key={index}
              className="flex items-center gap-8 whitespace-nowrap"
            >

              <span className="font-serif text-[20px] tracking-[0.12em] text-neutral-600 sm:text-[26px]">
                {marqueeText}
              </span>

              <span className="h-1 w-1 rounded-full bg-amber-200/40" />

            </div>

          ))}

        </div>

      </div>


      {/* ============================================================
          BOTTOM BAR
      ============================================================ */}

      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">

        <div className="flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between">

          {/* COPYRIGHT */}

          <p className="text-[8px] font-mono uppercase tracking-[0.08em] text-neutral-600 sm:text-[9px]">
            © 2026 ARDENBY. All rights reserved.
          </p>


          {/* LEGAL LINKS */}

          <div className="flex flex-wrap gap-x-5 gap-y-2">

            <Link
              href="/privacy"
              className="text-[8px] uppercase tracking-[0.12em] text-neutral-600 transition-colors hover:text-neutral-300 sm:text-[9px]"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="text-[8px] uppercase tracking-[0.12em] text-neutral-600 transition-colors hover:text-neutral-300 sm:text-[9px]"
            >
              Terms of Service
            </Link>

            <Link
              href="/admin"
              className="text-[8px] uppercase tracking-[0.12em] text-neutral-600 transition-colors hover:text-neutral-300 sm:text-[9px]"
            >
              Admin Portal
            </Link>

          </div>

        </div>

      </div>


      {/* ============================================================
          FOOTER WORDMARK
      ============================================================ */}

      <div className="pointer-events-none select-none overflow-hidden px-2 pb-[-1px]">

        <p
          className="
            whitespace-nowrap
            text-center
            font-serif
            text-[18vw]
            font-normal
            leading-[0.65]
            tracking-[-0.08em]
            text-white/[0.025]
          "
        >
          ARDENBY
        </p>

      </div>

    </footer>
  );
}