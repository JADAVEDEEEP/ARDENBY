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
  Mail,
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
    { label: "Kovenik Premium", href: "/shop?category=ardenby-premium" },
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

    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    setSubscribed(true);

    toast.success(
      "Welcome to the Kovenik Fam! Check your inbox for 10% off."
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
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#080808] text-stone-200">

      {/* ============================================================
          NEWSLETTER
      ============================================================ */}

      <section className="border-b border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20">

          <div className="grid items-end gap-10 lg:grid-cols-[1fr_0.9fr] lg:gap-20">

            {/* LEFT CONTENT */}

            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-white/30" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55 sm:text-[11px]">
                  KOVENIK NEWSLETTER
                </span>
              </div>

              <h2
                className="
                  max-w-[720px]
                  font-serif
                  text-[42px]
                  font-normal
                  leading-[0.95]
                  tracking-[-0.035em]
                  text-white
                  sm:text-[52px]
                  md:text-[62px]
                  lg:text-[70px]
                "
              >
                Stay in the
                <span className="block italic text-white/55">
                  inner circle.
                </span>
              </h2>

              <p className="mt-6 max-w-[560px] text-[14px] font-light leading-[1.8] text-neutral-400 sm:text-[15px] lg:text-[16px]">
                Get first access to new drops, exclusive collections,
                private releases and 10% off your first order.
              </p>
            </div>

            {/* RIGHT EMAIL FORM */}

            <div className="w-full">

              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/65 sm:text-[12px]">
                Join KOVENIK
              </p>

              <form
                onSubmit={handleSubscribe}
                className="group relative"
              >
                <div
                  className="
                    flex
                    min-h-[64px]
                    items-center
                    border
                    border-white/15
                    bg-white/[0.035]
                    transition-all
                    duration-300
                    focus-within:border-white/40
                    focus-within:bg-white/[0.055]
                    sm:min-h-[70px]
                  "
                >
                  {/* EMAIL ICON */}

                  <div className="flex shrink-0 items-center pl-5 text-white/40 sm:pl-6">
                    <Mail className="h-5 w-5" strokeWidth={1.4} />
                  </div>

                  {/* INPUT */}

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    aria-label="Email address"
                    className="
                      min-w-0
                      flex-1
                      bg-transparent
                      px-4
                      text-[14px]
                      font-light
                      tracking-wide
                      text-white
                      outline-none
                      placeholder:text-neutral-600
                      sm:px-5
                      sm:text-[15px]
                    "
                  />

                  {/* BUTTON */}

                  <button
                    type="submit"
                    disabled={subscribed}
                    className="
                      mr-1.5
                      flex
                      h-[52px]
                      shrink-0
                      items-center
                      gap-3
                      bg-white
                      px-5
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.18em]
                      text-black
                      transition-all
                      duration-300
                      hover:bg-neutral-200
                      sm:mr-2
                      sm:h-[56px]
                      sm:px-7
                    "
                  >
                    <span>
                      {subscribed ? "Joined" : "Join"}
                    </span>

                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      strokeWidth={1.8}
                    />
                  </button>
                </div>

                <p className="mt-4 text-[10px] leading-relaxed text-neutral-600 sm:text-[11px]">
                  By subscribing, you agree to receive KOVENIK updates,
                  product launches and offers.
                </p>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================
          MAIN FOOTER CONTENT
      ============================================================ */}

      <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">

        <div className="grid gap-14 md:grid-cols-5 lg:gap-16">

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
                    text-[38px]
                    font-bold
                    uppercase
                    tracking-[-0.08em]
                    text-white
                    transition-opacity
                    duration-300
                    group-hover:opacity-80
                    sm:text-[44px]
                  "
                  style={{
                    fontFamily: "Didot, Bodoni MT, serif",
                  }}
                >
                  KOVENIK
                </span>

                <div className="mt-3 flex items-center gap-3">

                  <span className="h-px w-9 bg-white/35" />

                  <span className="text-[9px] uppercase tracking-[0.34em] text-white/60">
                    WEAR YOUR ESSENCE
                  </span>

                  <span className="h-px w-9 bg-white/35" />

                </div>
              </div>
            </Link>

            {/* BRAND DESCRIPTION */}

            <p className="mt-7 max-w-[430px] text-[14px] font-light leading-[1.85] text-neutral-400 sm:text-[15px]">
              Premium men's clothing crafted for the bold.
              High-density fabrics, relaxed cuts, and minimalist
              luxury aesthetics.
            </p>

            {/* BRAND DETAIL */}

            <div className="mt-8 flex items-center gap-4">

              <span className="font-mono text-[10px] tracking-[0.2em] text-neutral-500">
                EST. 2026
              </span>

              <span className="h-px w-8 bg-neutral-700" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                INDIA
              </span>

            </div>

            {/* SOCIALS */}

            <div className="mt-9 flex gap-3">

              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="
                    group
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    border
                    border-white/[0.10]
                    bg-white/[0.025]
                    text-neutral-400
                    transition-all
                    duration-300
                    hover:border-white/30
                    hover:bg-white
                    hover:text-black
                  "
                >
                  <Icon
                    className="h-[17px] w-[17px]"
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
            ([title, links]) => (

              <div
                key={title}
                className="
                  border-b
                  border-white/[0.09]
                  pb-6
                  last:border-b-0
                  md:border-none
                  md:pb-0
                "
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

                  <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-white">
                    {title}
                  </span>

                  <ChevronDown
                    className={`
                      h-4
                      w-4
                      text-neutral-400
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
                    mt-6
                    space-y-4
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

                  {links.map((link) => (

                    <li key={link.label}>

                      <Link
                        href={link.href}
                        className="
                          group
                          inline-flex
                          items-center
                          gap-2
                          text-[13px]
                          font-light
                          leading-relaxed
                          text-neutral-400
                          transition-colors
                          duration-200
                          hover:text-white
                          sm:text-[14px]
                        "
                      >

                        <span>
                          {link.label}
                        </span>

                        <ArrowUpRight
                          className="
                            h-3.5
                            w-3.5
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

      <div className="overflow-hidden border-y border-white/[0.08] bg-black/30 py-5">

        <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-10">

          {Array.from({ length: 18 }).map((_, index) => (

            <div
              key={index}
              className="flex items-center gap-10 whitespace-nowrap"
            >

              <span
                className="
                  font-serif
                  text-[27px]
                  tracking-[0.12em]
                  text-neutral-500
                  sm:text-[34px]
                  lg:text-[40px]
                "
              >
                {marqueeText}
              </span>

              <span className="h-1.5 w-1.5 rounded-full bg-white/30" />

            </div>

          ))}

        </div>

      </div>

      {/* ============================================================
          BOTTOM BAR
      ============================================================ */}

      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">

        <div className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">

          {/* COPYRIGHT */}

          <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-neutral-500 sm:text-[11px]">
            © 2026 KOVENIK. All rights reserved.
          </p>

          {/* LEGAL LINKS */}

          <div className="flex flex-wrap gap-x-7 gap-y-3">

            <Link
              href="/privacy"
              className="
                text-[10px]
                uppercase
                tracking-[0.12em]
                text-neutral-500
                transition-colors
                hover:text-white
                sm:text-[11px]
              "
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="
                text-[10px]
                uppercase
                tracking-[0.12em]
                text-neutral-500
                transition-colors
                hover:text-white
                sm:text-[11px]
              "
            >
              Terms of Service
            </Link>

            <Link
              href="/admin"
              className="
                text-[10px]
                uppercase
                tracking-[0.12em]
                text-neutral-500
                transition-colors
                hover:text-white
                sm:text-[11px]
              "
            >
              Admin Portal
            </Link>

          </div>

        </div>

      </div>

      {/* ============================================================
          FOOTER WORDMARK
      ============================================================ */}

      <div className="pointer-events-none select-none overflow-hidden px-2">

        <p
          className="
            whitespace-nowrap
            text-center
            font-serif
            text-[18vw]
            font-normal
            leading-[0.65]
            tracking-[-0.08em]
            text-white/[0.035]
          "
        >
          KOVENIK
        </p>

      </div>

    </footer>
  );
}