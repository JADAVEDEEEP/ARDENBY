"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  ArrowUpRight,
  ArrowRight,
  Mail,
} from "lucide-react";

import { KovenikLogo } from "./kovenik-logo";
import { useNewsletterSubscribe } from "@/hooks/use-newsletter-subscribe";

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

const SERIF = "var(--font-bodoni), Didot, 'Bodoni MT', serif";
const SANS = "var(--font-archivo), Inter, Arial, system-ui, sans-serif";

/* ================================================================
    FOOTER
================================================================ */

export function Footer() {
  const pathname = usePathname() ?? "";
  const isHome = pathname === "/";

  // Same submit + toast logic as the homepage Newsletter section.
  const { email, setEmail, subscribed, handleSubscribe } =
    useNewsletterSubscribe();

  return (
    <footer
      className="chrome-scope relative isolate w-full overflow-x-hidden overflow-y-visible bg-[#050506] text-[#a2a7af]"
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
          background: #16181b !important;
          color: #eef0f2 !important;
          border: 1px solid rgba(255, 255, 255, 0.22) !important;
          border-radius: 14px !important;
          padding: 14px 16px !important;
          font-family: var(--font-archivo), Inter, Arial, system-ui, sans-serif !important;
          font-size: 13px !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45) !important;
          max-width: calc(100vw - 32px) !important;
        }
        [data-sonner-toast] [data-title] {
          color: #eef0f2 !important;
          font-weight: 500 !important;
        }
        [data-sonner-toast] [data-description] {
          color: #a2a7af !important;
        }
        [data-sonner-toast] [data-icon] {
          color: #dfe3e8 !important;
        }
        [data-sonner-toast] [data-button],
        [data-sonner-toast] [data-close-button] {
          background: #050506 !important;
          color: #eef0f2 !important;
          border: 1px solid rgba(255, 255, 255, 0.22) !important;
        }
        /* Theme variables sonner reads for its default / success / info toasts. */
        [data-sonner-toaster],
        [data-sonner-toaster][data-sonner-theme] {
          --normal-bg: #16181b;
          --normal-text: #eef0f2;
          --normal-border: rgba(255, 255, 255, 0.22);
          --success-bg: #16181b;
          --success-text: #eef0f2;
          --success-border: rgba(255, 255, 255, 0.22);
          --info-bg: #16181b;
          --info-text: #eef0f2;
          --info-border: rgba(255, 255, 255, 0.22);
        }
        /* Same look with higher specificity, so a Toaster theme can't win. */
        [data-sonner-toaster] [data-sonner-toast][data-styled="true"] {
          background: #16181b !important;
          color: #eef0f2 !important;
          border: 1px solid rgba(255, 255, 255, 0.22) !important;
          border-radius: 14px !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45) !important;
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
          background: #16181b !important;
          color: #eef0f2 !important;
          border: 1px solid rgba(255, 255, 255, 0.22) !important;
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

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* ============================================================
          NEWSLETTER (hidden on "/", where the homepage has its own)
      ============================================================ */}
      {!isHome && (
        <section className="border-b border-white/10 bg-[#0b0c0e]">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
            <div className="grid items-end gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
              <div>
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#c9a24a]">
                  Kovenik newsletter
                </p>

                <h2
                  className="chrome-text max-w-[760px] text-[clamp(30px,4.2vw,56px)] font-medium uppercase leading-[0.98]"
                  style={{ fontFamily: SERIF }}
                >
                  Stay in the inner circle.
                </h2>

                <p className="mt-5 max-w-[540px] text-[14px] leading-[1.7] text-[#c4c8cf] sm:text-[15px]">
                  Get first access to new drops, exclusive collections,
                  private releases and 10% off your first order.
                </p>
              </div>

              <form
                onSubmit={handleSubscribe}
                className="group relative w-full min-w-0"
              >
                <div className="flex min-h-[60px] w-full items-center overflow-hidden rounded-full border border-white/20 bg-black/40 transition-colors duration-300 focus-within:border-white/60 sm:min-h-[68px]">
                  <Mail
                    className="ml-5 h-5 w-5 shrink-0 text-[#a2a7af] sm:ml-6"
                    strokeWidth={1.4}
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    aria-label="Email address"
                    className="min-w-0 flex-1 bg-transparent px-3 text-[14px] text-[#eef0f2] outline-none placeholder:text-[#a2a7af] sm:px-4 sm:text-[15px]"
                  />

                  <button
                    type="submit"
                    disabled={subscribed}
                    className="gold-fill gold-sheen mr-1.5 flex h-[48px] shrink-0 items-center gap-2 rounded-full px-5 text-[11px] font-bold uppercase tracking-[0.16em] transition duration-300 hover:brightness-110 disabled:opacity-80 sm:mr-2 sm:h-[52px] sm:px-7"
                  >
                    <span>{subscribed ? "Joined" : "Join"}</span>
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      strokeWidth={2}
                    />
                  </button>
                </div>

                <p className="mt-3 pl-2 text-[12px] leading-relaxed text-[#a2a7af]">
                  By subscribing, you agree to receive KOVENIK updates,
                  product launches and offers.
                </p>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          MAIN FOOTER CONTENT
      ============================================================ */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-5 md:gap-12 lg:gap-14">
          {/* BRAND */}
          <div className="col-span-2">
            <Link
              href="/"
              aria-label="Kovenik home"
              className="chrome-focus group inline-block"
            >
              <KovenikLogo layout="stacked" className="h-auto w-[260px] max-w-full sm:w-[290px] lg:w-[330px]" />
              <span className="sr-only">Wear Your Essence</span>
            </Link>

            <p className="mt-5 max-w-[420px] text-[14px] leading-[1.7] text-[#a2a7af] sm:text-[15px]">
              Premium men&apos;s clothing crafted for the bold.
              High-density fabrics, relaxed cuts, and minimalist
              luxury aesthetics.
            </p>

            <div className="mt-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#c4c8cf]">
              <span>Est. 2026</span>
              <span className="h-px w-8 bg-white/30" />
              <span>India</span>
            </div>

            <div className="mt-7 flex gap-2.5">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="chrome-focus chrome-glass group flex h-11 w-11 items-center justify-center rounded-full text-[#eef0f2] transition-colors duration-300 hover:border-white/60 hover:bg-white hover:text-black"
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* LINK COLUMNS: Categories left, Company + Support stacked right on mobile */}
          {(() => {
            const renderNav = ([title, links]: [string, { label: string; href: string }[]]) => (
              <nav key={title} aria-label={title} className="min-w-0">
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#eef0f2]">
                  {title}
                </h3>

                <ul className="mt-4 space-y-0.5 md:mt-5 md:space-y-1">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="chrome-focus group inline-flex min-h-[36px] items-center gap-2 text-[14px] leading-snug text-[#a2a7af] transition-colors duration-200 hover:text-white md:leading-relaxed"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-[#c9a24a] opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            );
            const [first, ...rest] = Object.entries(footerLinks);
            return (
              <>
                {renderNav(first)}
                <div className="flex min-w-0 flex-col gap-8 md:contents">
                  {rest.map(renderNav)}
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* ============================================================
          BOTTOM BAR
      ============================================================ */}
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-3 border-t border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
          <p className="text-[12px] text-[#a2a7af]">
            © 2026 KOVENIK. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-x-7 gap-y-1">
            {[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
              { label: "Admin Portal", href: "/admin" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="chrome-focus inline-flex min-h-[36px] items-center text-[12px] text-[#a2a7af] transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================
          FINAL SIGNATURE — giant outlined wordmark, cropped at the edge
      ============================================================ */}
      <div
        aria-hidden="true"
        className="pointer-events-none h-[13vw] select-none overflow-hidden px-2"
      >
        <p
          className="chrome-outline whitespace-nowrap text-center font-semibold uppercase leading-[0.8]"
          style={{
            fontFamily: SERIF,
            fontSize: "18vw",
            letterSpacing: "0.04em",
          }}
        >
          Kovenik
        </p>
      </div>
    </footer>
  );
}
