"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { useNewsletterSubscribe } from "@/hooks/use-newsletter-subscribe";
import { cn } from "@/lib/utils";

import { KovenikBrand } from "./kovenik-brand";
import { SocialLinks } from "./social-links";

/* ================================================================
    FOOTER CONTENT
================================================================ */

const footerColumns = [
  {
    title: "Need Help",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Track Order", href: "/orders" },
      { label: "Returns & Refunds", href: "/returns" },
      { label: "Shipping & Delivery", href: "/shipping" },
      { label: "FAQs", href: "/faqs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Sustainability", href: "/sustainability" },
    ],
  },
  {
    title: "Categories",
    links: [
      { label: "Supreme Edition", href: "/shop?category=supreme-edition" },
      { label: "Epic Thread", href: "/shop?category=epic-thread" },
      { label: "Kovenik Premium", href: "/shop?category=ardenby-premium" },
      { label: "The Print Club", href: "/shop?category=the-print-club" },
      { label: "Bottom Wear", href: "/shop?category=bottom-wear" },
    ],
  },
  {
    title: "More Info",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  },
];

/** Link column: an accordion below md (Need Help starts open), always open from md up. */
function FooterColumn({
  title,
  links,
  defaultOpen = false,
}: {
  title: string;
  links: { label: string; href: string }[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `footer-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <nav aria-label={title} className="min-w-0 border-t border-kv-line md:border-0">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-h-[48px] w-full items-center justify-between font-oswald text-[18px] font-semibold uppercase tracking-[0.1em] text-[#111111] md:text-[22px] md:pointer-events-none md:min-h-0 md:cursor-default"
        >
          {title}
          <ChevronDown
            className={cn("h-5 w-5 transition-transform md:hidden", open && "rotate-180")}
            aria-hidden="true"
          />
        </button>
      </h3>
      <ul id={panelId} className={cn("pb-3 md:mt-4 md:block md:pb-0", open ? "block" : "hidden")}>
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="inline-flex min-h-[44px] items-center text-[15px] text-kv-ink transition-colors hover:text-kv-gold-text md:min-h-[38px] md:text-[16px]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ================================================================
    FOOTER
================================================================ */

export function Footer() {
  const pathname = usePathname() ?? "";
  const isHome = pathname === "/";

  // Same submit + toast logic as the homepage Newsletter section.
  const { email, setEmail, available, handleSubscribe } = useNewsletterSubscribe();

  return (
    <footer className="kv-flat relative w-full overflow-x-hidden bg-kv-footer text-kv-ink">
      <style jsx global>{`
        [data-sonner-toaster] {
          --width: min(356px, calc(100vw - 32px));
        }
        [data-sonner-toast] {
          box-sizing: border-box !important;
          background: #FFFFFF !important;
          color: #222222 !important;
          border: 1px solid rgba(255, 255, 255, 0.22) !important;
          border-radius: 14px !important;
          padding: 14px 16px !important;
          font-family: var(--font-inter), Inter, Arial, system-ui, sans-serif !important;
          font-size: 13px !important;
          box-shadow: none !important;
          max-width: calc(100vw - 32px) !important;
        }
        [data-sonner-toast] [data-title] {
          color: #222222 !important;
          font-weight: 500 !important;
        }
        [data-sonner-toast] [data-description] {
          color: #707070 !important;
        }
        [data-sonner-toast] [data-icon] {
          color: #222222 !important;
        }
        [data-sonner-toast] [data-button],
        [data-sonner-toast] [data-close-button] {
          background: #222222 !important;
          color: #FFFFFF !important;
          border: 1px solid rgba(255, 255, 255, 0.22) !important;
        }
        /* Theme variables sonner reads for its default / success / info toasts. */
        [data-sonner-toaster],
        [data-sonner-toaster][data-sonner-theme] {
          --normal-bg: #FFFFFF;
          --normal-text: #222222;
          --normal-border: rgba(255, 255, 255, 0.22);
          --success-bg: #FFFFFF;
          --success-text: #222222;
          --success-border: rgba(255, 255, 255, 0.22);
          --info-bg: #FFFFFF;
          --info-text: #222222;
          --info-border: rgba(255, 255, 255, 0.22);
        }
        /* Same look with higher specificity, so a Toaster theme can't win. */
        [data-sonner-toaster] [data-sonner-toast][data-styled="true"] {
          background: #FFFFFF !important;
          color: #222222 !important;
          border: 1px solid rgba(255, 255, 255, 0.22) !important;
          border-radius: 14px !important;
          box-shadow: none !important;
        }
        /* Keep top toasts below the sticky header (~165px mobile with the
           search + nav rows, ~125px desktop) so they never cover the logo
           or navigation. */
        [data-sonner-toaster][data-y-position="top"] {
          top: 172px !important;
        }
        @media (min-width: 1024px) {
          [data-sonner-toaster][data-y-position="top"] {
            top: 132px !important;
          }
        }
        /* Fallback if the wishlist toast comes from react-toastify. */
        .Toastify__toast {
          background: #FFFFFF !important;
          color: #222222 !important;
          border: 1px solid rgba(255, 255, 255, 0.22) !important;
          border-radius: 14px !important;
          box-shadow: none !important;
          max-width: calc(100vw - 32px);
        }
        @media (min-width: 640px) {
          [data-sonner-toast] {
            width: fit-content !important;
            min-width: 240px;
          }
        }
      `}</style>

      {/* Newsletter (hidden on "/", where the homepage has its own) */}
      {!isHome && (
        <section aria-label="Newsletter" className="on-dark bg-kv-ink">
          <div className="mx-auto grid w-full max-w-[1280px] items-center gap-4 px-4 py-8 md:grid-cols-2 md:gap-12 md:px-6">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-kv-gold-dark">Kovenik newsletter</p>
              <h2 className="mt-2 font-oswald text-[26px] font-bold uppercase leading-none tracking-[0.04em] text-white md:text-[32px]">
                Stay in the inner circle.
              </h2>
            </div>
            <form onSubmit={handleSubscribe} className="w-full min-w-0">
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Email address
              </label>
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <input
                  id="footer-newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!available}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  className="h-12 min-w-0 flex-none border border-white/40 sm:flex-1 bg-transparent px-4 text-[16px] text-white outline-none placeholder:text-kv-mist focus:border-kv-gold-dark"
                />
                <button
                  type="submit"
                  disabled={!available}
                  className="inline-flex h-12 shrink-0 items-center justify-center bg-kv-gold px-8 text-[15px] font-bold uppercase tracking-[0.1em] text-white hover:bg-kv-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Join
                </button>
              </div>
              <p className="mt-3 text-[13px] leading-5 text-kv-mist">Newsletter sign-up is not available yet. Please check back soon.</p>
            </form>
          </div>
        </section>
      )}

      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-6 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 md:gap-8">
          {footerColumns.map((col, i) => (
            <FooterColumn key={col.title} title={col.title} links={col.links} defaultOpen={i === 0} />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-5 border-t border-kv-line pt-6 md:mt-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Kovenik home" className="inline-block">
              <KovenikBrand className="h-[48px] w-[136px] md:h-[64px] md:w-[182px]" bearClassName="h-[84px] md:h-[130px]" />
            </Link>
            <span className="text-[14px] font-semibold uppercase tracking-[0.12em] text-kv-sub">Est. 2026 · India</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[16px] font-bold text-kv-ink">Follow Us:</span>
            <SocialLinks />
          </div>
        </div>

        <details className="group mt-6 border border-kv-line bg-kv-bg">
          <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between px-4 text-[16px] font-semibold text-kv-ink [&::-webkit-details-marker]:hidden">
            Who we are
            <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="px-4 pb-4 text-[15px] leading-[1.6] text-kv-sub">
            Premium men&apos;s clothing crafted for the bold. High-density fabrics, relaxed cuts, and minimalist luxury
            aesthetics.
          </p>
        </details>

        {/* Decorative brand wordmark: scales with the container, stays on one line at every width. */}
        <div aria-hidden="true" className="pointer-events-none mt-8 select-none md:mt-12">
          <svg
            viewBox="0 0 1000 170"
            preserveAspectRatio="xMidYMid meet"
            className="block h-auto w-full"
            focusable="false"
          >
            <text
              x="0"
              y="150"
              textLength="1000"
              lengthAdjust="spacingAndGlyphs"
              fill="#111111"
              fillOpacity="0.12"
              style={{
                fontFamily: "var(--font-inter), Inter, Arial, system-ui, sans-serif",
                fontWeight: 900,
                fontSize: 190,
              }}
            >
              KOVENIK
            </text>
          </svg>
        </div>

        <p className="mt-6 text-center text-[14px] text-kv-sub">© 2026 KOVENIK. All rights reserved.</p>
      </div>
    </footer>
  );
}
