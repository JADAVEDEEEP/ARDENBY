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
  { label: "Instagram", Icon: Instagram, href: "#" },
  { label: "Twitter", Icon: Twitter, href: "#" },
  { label: "Facebook", Icon: Facebook, href: "#" },
  { label: "Youtube", Icon: Youtube, href: "#" },
];

/* KOVENIK — deep forest green / ivory / subtle gold */
const SERIF =
  "'Cormorant Garamond', 'Bodoni MT', Didot, 'Times New Roman', serif";
const SANS = "Inter, 'Helvetica Neue', Arial, system-ui, sans-serif";

/* ================================================================
    FOOTER
================================================================ */

export function Footer() {
  const [email, setEmail] = useState("");
  const [openSections, setOpenSections] = useState<
    Record<string, boolean>
  >({});
  const [subscribed, setSubscribed] = useState(false);

  /* NEWSLETTER */
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

  /* ACCORDION */
  const toggleAccordion = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <footer
      className="relative isolate w-full overflow-x-hidden overflow-y-visible bg-[#07180D] text-[#C8C6B9]"
      style={{ fontFamily: SANS }}
    >
      {/* Toast styling (e.g. "Added to Wishlist"). Visual only; timing and
          behavior stay with the existing toaster. The footer renders site-wide,
          so this applies on every page. */}
      <style jsx global>{`
        [data-sonner-toaster] {
          --width: min(356px, calc(100vw - 32px));
        }
        [data-sonner-toast] {
          box-sizing: border-box !important;
          background: #17351f !important;
          color: #f4f0e6 !important;
          border: 1px solid rgba(184, 154, 90, 0.35) !important;
          border-radius: 14px !important;
          padding: 14px 16px !important;
          font-family: Inter, 'Helvetica Neue', Arial, system-ui, sans-serif !important;
          font-size: 13px !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45) !important;
          max-width: calc(100vw - 32px) !important;
        }
        [data-sonner-toast] [data-title] {
          color: #f4f0e6 !important;
          font-weight: 500 !important;
        }
        [data-sonner-toast] [data-description] {
          color: #c8c6b9 !important;
        }
        [data-sonner-toast] [data-icon] {
          color: #b89a5a !important;
        }
        [data-sonner-toast] [data-button],
        [data-sonner-toast] [data-close-button] {
          background: #07180d !important;
          color: #f4f0e6 !important;
          border: 1px solid rgba(184, 154, 90, 0.35) !important;
        }
        /* Theme variables sonner reads for its default / success / info toasts. */
        [data-sonner-toaster],
        [data-sonner-toaster][data-sonner-theme] {
          --normal-bg: #17351f;
          --normal-text: #f4f0e6;
          --normal-border: rgba(184, 154, 90, 0.35);
          --success-bg: #17351f;
          --success-text: #f4f0e6;
          --success-border: rgba(184, 154, 90, 0.35);
          --info-bg: #17351f;
          --info-text: #f4f0e6;
          --info-border: rgba(184, 154, 90, 0.35);
        }
        /* Same look with higher specificity, so a Toaster theme can't win. */
        [data-sonner-toaster] [data-sonner-toast][data-styled="true"] {
          background: #17351f !important;
          color: #f4f0e6 !important;
          border: 1px solid rgba(184, 154, 90, 0.35) !important;
          border-radius: 14px !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45) !important;
        }
        /* Keep top toasts below the sticky header (72px mobile, 84px desktop)
           so they never cover the logo or navigation. */
        [data-sonner-toaster][data-y-position="top"] {
          top: 72px !important;
        }
        @media (min-width: 1024px) {
          [data-sonner-toaster][data-y-position="top"] {
            top: 84px !important;
          }
        }
        /* Fallback if the wishlist toast comes from react-toastify. */
        .Toastify__toast {
          background: #17351f !important;
          color: #f4f0e6 !important;
          border: 1px solid rgba(184, 154, 90, 0.35) !important;
          border-radius: 14px !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45) !important;
          max-width: calc(100vw - 32px);
        }
        @media (min-width: 640px) {
          [data-sonner-toast] {
            width: fit-content !important;
            min-width: 240px;
          }
        }
      `}</style>

      {/* ============================================================
          NEWSLETTER
      ============================================================ */}
      <section className="border-t border-[#F4F0E6]/10 bg-[#0D2415]">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
          <div className="grid items-end gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div>
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-[#B89A5A]">
                Kovenik newsletter
              </p>

              <h2
                className="max-w-[760px] text-[clamp(30px,4.2vw,60px)] font-medium uppercase leading-[0.96] tracking-[-0.01em] text-[#F4F0E6]"
                style={{ fontFamily: SERIF }}
              >
                Stay in the inner circle.
              </h2>

              <p className="mt-5 max-w-[540px] text-[14px] leading-[1.7] text-[#C8C6B9] sm:text-[15px]">
                Get first access to new drops, exclusive collections,
                private releases and 10% off your first order.
              </p>
            </div>

            <div className="w-full">
              <form
                onSubmit={handleSubscribe}
                className="group relative w-full min-w-0"
              >
                <div className="flex min-h-[60px] w-full items-center overflow-hidden rounded-full border border-[#F4F0E6]/25 bg-[#07180D] transition-colors duration-300 focus-within:border-[#B89A5A] sm:min-h-[68px]">
                  <div className="flex shrink-0 items-center pl-5 text-[#B89A5A] sm:pl-6">
                    <Mail className="h-5 w-5" strokeWidth={1.4} />
                  </div>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    aria-label="Email address"
                    className="min-w-0 flex-1 bg-transparent px-3 text-[14px] text-[#F4F0E6] outline-none placeholder:text-[#C8C6B9]/50 sm:px-4 sm:text-[15px]"
                  />

                  <button
                    type="submit"
                    disabled={subscribed}
                    className="mr-1.5 flex h-[48px] shrink-0 items-center gap-2 rounded-full bg-[#F4F0E6] px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#07180D] transition-colors duration-300 hover:bg-[#B89A5A] disabled:opacity-80 sm:mr-2 sm:h-[52px] sm:px-7"
                  >
                    <span>{subscribed ? "Joined" : "Join"}</span>
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      strokeWidth={2}
                    />
                  </button>
                </div>

                <p className="mt-3 pl-2 text-[12px] leading-relaxed text-[#C8C6B9]/80">
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
      <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <div className="grid gap-8 md:grid-cols-5 md:gap-12 lg:gap-14">
          {/* BRAND */}
          <div className="md:col-span-2">
            <Link href="/" className="group inline-block">
              <span
                className="block text-[36px] font-medium uppercase leading-none tracking-[0.14em] text-[#F4F0E6] transition-opacity duration-300 group-hover:opacity-90 sm:text-[46px]"
                style={{ fontFamily: SERIF }}
              >
                Kovenik
              </span>
              <span className="mt-3 block text-[10px] uppercase tracking-[0.32em] text-[#B89A5A]">
                Wear Your Essence
              </span>
            </Link>

            <p className="mt-5 max-w-[420px] text-[14px] leading-[1.7] text-[#C8C6B9] sm:text-[15px]">
              Premium men&apos;s clothing crafted for the bold.
              High-density fabrics, relaxed cuts, and minimalist
              luxury aesthetics.
            </p>

            <div className="mt-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#B89A5A]">
              <span>Est. 2026</span>
              <span className="h-px w-8 bg-[#B89A5A]/50" />
              <span>India</span>
            </div>

            <div className="mt-7 flex gap-2.5">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="group flex h-11 w-11 items-center justify-center rounded-full border border-[#F4F0E6]/20 text-[#F4F0E6] transition-colors duration-300 hover:border-[#B89A5A] hover:bg-[#B89A5A] hover:text-[#07180D]"
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* LINK COLUMNS */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div
              key={title}
              className="border-b border-[#F4F0E6]/10 pb-6 last:border-b-0 md:border-none md:pb-0"
            >
              <button
                type="button"
                onClick={() => toggleAccordion(title)}
                aria-expanded={!!openSections[title]}
                className="flex w-full items-center justify-between text-left md:pointer-events-none"
              >
                <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#F4F0E6]">
                  {title}
                </span>

                <ChevronDown
                  className={`h-4 w-4 text-[#B89A5A] transition-transform duration-300 md:hidden ${
                    openSections[title] ? "rotate-180" : ""
                  }`}
                />
              </button>

              <ul
                className={`mt-5 space-y-3.5 overflow-hidden transition-all duration-300 md:max-h-none md:opacity-100 ${
                  openSections[title]
                    ? "max-h-80 opacity-100"
                    : "max-h-0 opacity-0 md:max-h-none"
                }`}
              >
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-[14px] leading-relaxed text-[#C8C6B9] transition-colors duration-200 hover:text-[#F4F0E6]"
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-[#B89A5A] opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          BOTTOM BAR
      ============================================================ */}
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-3 border-t border-[#F4F0E6]/10 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
          <p className="text-[12px] text-[#C8C6B9]/80">
            © 2026 KOVENIK. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-x-7 gap-y-3">
            <Link
              href="/privacy"
              className="text-[12px] text-[#C8C6B9]/80 transition-colors hover:text-[#F4F0E6]"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="text-[12px] text-[#C8C6B9]/80 transition-colors hover:text-[#F4F0E6]"
            >
              Terms of Service
            </Link>

            <Link
              href="/admin"
              className="text-[12px] text-[#C8C6B9]/80 transition-colors hover:text-[#F4F0E6]"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================
          FINAL SIGNATURE — outlined wordmark, cropped at the page edge
      ============================================================ */}
      <div
        aria-hidden="true"
        className="pointer-events-none h-[13vw] select-none overflow-hidden px-2"
      >
        <p
          className="whitespace-nowrap text-center uppercase leading-[0.8]"
          style={{
            fontFamily: SERIF,
            fontSize: "18vw",
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(244,240,230,0.28)",
            letterSpacing: "-0.01em",
          }}
        >
          Kovenik
        </p>
      </div>
    </footer>
  );
}