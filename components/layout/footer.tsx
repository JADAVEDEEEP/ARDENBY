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


const KOVENIK_LOGO_STYLE = {
  color: '#F5F3EE',
  fontFamily:
    'Bodoni MT, Didot, Cormorant Garamond, Times New Roman, serif',
  backgroundImage: `
    radial-gradient(circle at 3% 45%, #D4AF37 0 2px, transparent 2.5px),
    radial-gradient(circle at 7% 20%, #8B1E1E 0 1.5px, transparent 2px),
    radial-gradient(circle at 12% 75%, #A52A2A 0 3px, transparent 3.5px),
    radial-gradient(circle at 18% 8%, #D4AF37 0 2px, transparent 2.5px),
    radial-gradient(circle at 25% 92%, #8B1E1E 0 1.5px, transparent 2px),
    radial-gradient(circle at 34% 3%, #E6CA65 0 3px, transparent 3.5px),
    radial-gradient(circle at 43% 95%, #A52A2A 0 2px, transparent 2.5px),
    radial-gradient(circle at 52% 4%, #D4AF37 0 1.5px, transparent 2px),
    radial-gradient(circle at 62% 94%, #8B1E1E 0 3px, transparent 3.5px),
    radial-gradient(circle at 71% 7%, #D4AF37 0 2px, transparent 2.5px),
    radial-gradient(circle at 79% 91%, #A52A2A 0 2px, transparent 2.5px),
    radial-gradient(circle at 88% 15%, #E6CA65 0 3px, transparent 3.5px),
    radial-gradient(circle at 94% 48%, #D4AF37 0 2px, transparent 2.5px),
    radial-gradient(circle at 98% 78%, #8B1E1E 0 3px, transparent 3.5px)
  `,
  backgroundRepeat: 'no-repeat',
  textShadow: `
    2px 0 0 rgba(139,30,30,0.85),
    -2px 0 0 rgba(80,15,15,0.65),
    0 4px 0 rgba(212,175,55,0.45),
    0 8px 18px rgba(0,0,0,0.6)
  `,
};

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
  ================================================================ */

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
  ================================================================ */

  const toggleAccordion = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <footer className="relative isolate w-full overflow-x-hidden overflow-y-visible border-t border-[#D4AF37]/30 bg-[#080808] text-stone-200">

      {/* ============================================================
          NEWSLETTER
      ============================================================ */}

      <section className="border-b border-[#D4AF37]/30 bg-[#0b0b0b]">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-8 sm:py-20 lg:px-12 lg:py-24">

          <div className="grid items-end gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-20">

            {/* LEFT CONTENT */}

            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-12 bg-[#D4AF37]/50" />

                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37] sm:text-[12px]">
                  KOVENIK NEWSLETTER
                </span>
              </div>

              <h2
                className="
                  max-w-[760px]
                  font-serif
                  text-[38px]
                  sm:text-[46px]
                  font-normal
                  leading-[0.95]
                  tracking-[-0.035em]
                  bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA771C]
                  bg-clip-text text-transparent
                  md:text-[66px]
                  lg:text-[76px]
                "
              >
                Stay in the
                <span className="block italic text-[#F3E5AB]/70">
                  inner circle.
                </span>
              </h2>

              <p className="mt-4 max-w-[580px] text-[13px] font-light leading-[1.7] text-neutral-300 sm:mt-6 sm:text-[16px] lg:text-[17px]">
                Get first access to new drops, exclusive collections,
                private releases and 10% off your first order.
              </p>
            </div>

            {/* RIGHT EMAIL FORM */}

            <div className="w-full">

              <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#F3E5AB] sm:text-[13px]">
                Join KOVENIK
              </p>

              <form
                onSubmit={handleSubscribe}
                className="group relative w-full min-w-0"
              >
                <div
                  className="
                    flex
                    min-h-[60px]
                    w-full
                    overflow-hidden
                    items-center
                    rounded-2xl
                    border
                    border-[#D4AF37]/40
                    bg-[#141414]
                    shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.1)]
                    transition-all
                    duration-300
                    focus-within:border-[#D4AF37]
                    focus-within:bg-[#1a1a1a]
                    focus-within:shadow-[0_10px_35px_rgba(0,0,0,0.9),0_0_20px_rgba(212,175,55,0.2)]
                    sm:min-h-[76px]
                  "
                >
                  {/* EMAIL ICON */}

                  <div className="flex shrink-0 items-center pl-4 text-[#D4AF37] sm:pl-6">
                    <Mail className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
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
                      px-3
                      text-[12px]
                      font-light
                      tracking-wide
                      text-white
                      outline-none
                      placeholder:text-neutral-500
                      sm:px-5
                      sm:text-[16px]
                    "
                  />

                  {/* BUTTON */}

                  <button
                    type="submit"
                    disabled={subscribed}
                    className="
                      mr-2
                      flex
                      h-[48px]
                      shrink-0
                      items-center
                      gap-2
                      rounded-lg
                      bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA771C]
                      px-4
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.18em]
                      text-neutral-950
                      transition-all
                      duration-300
                      hover:brightness-110
                      hover:shadow-lg
                      sm:mr-2.5
                      sm:h-[60px]
                      sm:px-8
                      sm:text-[12px]
                    "
                  >
                    <span>
                      {subscribed ? "Joined" : "Join"}
                    </span>

                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      strokeWidth={2}
                    />
                  </button>
                </div>

                <p className="mt-3 text-[10px] leading-relaxed text-neutral-400 sm:mt-4 sm:text-[12px]">
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

      <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-8 sm:py-22 lg:px-12 lg:py-28">

        <div className="grid gap-9 md:grid-cols-5 md:gap-14 lg:gap-16">

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
                    relative inline-block
                    text-[34px]
                    font-bold
                    uppercase
                    leading-none
                    tracking-[-0.075em]
                    transition-all
                    duration-300
                    group-hover:scale-[1.015]
                    sm:text-[50px]
                  "
                  style={KOVENIK_LOGO_STYLE}
                >
                  KOVENIK

                  <span
                    className="absolute -bottom-[8px] left-1/2 h-[1px] w-0 -translate-x-1/2 transition-all duration-500 group-hover:w-[72%]"
                    style={{ backgroundColor: '#D4AF37' }}
                  />
                </span>

                <div className="mt-3 flex items-center gap-3">
                  <span className="h-px w-10 bg-[#D4AF37]/50" />

                  <span
                    className="text-[10px] uppercase tracking-[0.34em]"
                    style={{ color: '#D4AF37' }}
                  >
                    WEAR YOUR ESSENCE
                  </span>

                  <span className="h-px w-10 bg-[#D4AF37]/50" />
                </div>
              </div>
            </Link>

            {/* BRAND DESCRIPTION */}

            <p className="mt-5 max-w-[450px] text-[13px] font-light leading-[1.75] text-neutral-300 sm:mt-7 sm:text-[16px]">
              Premium men's clothing crafted for the bold.
              High-density fabrics, relaxed cuts, and minimalist
              luxury aesthetics.
            </p>

            {/* BRAND DETAIL */}

            <div className="mt-6 flex items-center gap-3 sm:mt-8 sm:gap-4">

              <span className="font-mono text-[11px] tracking-[0.2em] text-[#D4AF37]">
                EST. 2026
              </span>

              <span className="h-px w-8 bg-[#D4AF37]/40" />

              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                INDIA
              </span>

            </div>

            {/* SOCIALS */}

            <div className="mt-6 flex gap-2.5 sm:mt-9 sm:gap-3.5">

              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="
                    group
                    flex
                    h-10
                    w-10
                    sm:h-12
                    sm:w-12
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-[#D4AF37]/30
                    bg-[#141414]
                    text-neutral-300
                    transition-all
                    duration-300
                    hover:border-[#D4AF37]
                    hover:bg-gradient-to-r hover:from-[#F3E5AB] hover:via-[#D4AF37] hover:to-[#AA771C]
                    hover:text-neutral-950
                    hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]
                  "
                >
                  <Icon
                    className="h-[18px] w-[18px]"
                    strokeWidth={1.6}
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
                  border-[#D4AF37]/20
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

                  <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-white sm:text-[14px]">
                    {title}
                  </span>

                  <ChevronDown
                    className={`
                      h-4
                      w-4
                      text-[#D4AF37]
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
                          text-[14px]
                          font-light
                          leading-relaxed
                          text-neutral-300
                          transition-colors
                          duration-200
                          hover:text-[#F3E5AB]
                          sm:text-[15px]
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
          MARQUEE (METALLIC GOLD GRADIENT TEXT)
      ============================================================ */}

      <div className="w-full overflow-hidden border-y border-[#D4AF37]/30 bg-[#060606] py-4 sm:py-6">

        <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-10">

          {Array.from({ length: 18 }).map((_, index) => (

            <div
              key={index}
              className="flex items-center gap-10 whitespace-nowrap"
            >

              <span
                className="
                  font-serif
                  text-[30px]
                  font-normal
                  tracking-[0.12em]
                  bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA771C]
                  bg-clip-text text-transparent
                  sm:text-[38px]
                  lg:text-[44px]
                "
              >
                {marqueeText}
              </span>

              <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />

            </div>

          ))}

        </div>

      </div>

      {/* ============================================================
          BOTTOM BAR
      ============================================================ */}

      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-12">

        <div className="flex flex-col gap-4 py-6 sm:gap-6 sm:py-9 sm:flex-row sm:items-center sm:justify-between">

          {/* COPYRIGHT */}

          <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-neutral-400 sm:text-[12px]">
            © 2026 KOVENIK. All rights reserved.
          </p>

          {/* LEGAL LINKS */}

          <div className="flex flex-wrap gap-x-8 gap-y-3">

            <Link
              href="/privacy"
              className="
                text-[11px]
                uppercase
                tracking-[0.12em]
                text-neutral-400
                transition-colors
                hover:text-[#F3E5AB]
                sm:text-[12px]
              "
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="
                text-[11px]
                uppercase
                tracking-[0.12em]
                text-neutral-400
                transition-colors
                hover:text-[#F3E5AB]
                sm:text-[12px]
              "
            >
              Terms of Service
            </Link>

            <Link
              href="/admin"
              className="
                text-[11px]
                uppercase
                tracking-[0.12em]
                text-neutral-400
                transition-colors
                hover:text-[#F3E5AB]
                sm:text-[12px]
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

      <div className="pointer-events-none hidden select-none overflow-hidden px-2 pb-4 sm:block">

        <p
          className="
            whitespace-nowrap
            text-center
            font-serif
            text-[18vw]
            font-normal
            leading-[0.65]
            tracking-[-0.08em]
            bg-gradient-to-r from-white/[0.05] via-[#D4AF37]/[0.05] to-white/[0.05]
            bg-clip-text text-transparent
          "
        >
          KOVENIK
        </p>

      </div>

    </footer>
  );
}