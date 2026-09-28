'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Heart,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';

import type { UserProfile } from './navbar';
import { megaMenu, topNavItems } from './navbar-data';

type NavbarHeaderProps = {
  setMobileOpen: (open: boolean) => void;
  megaOpen: boolean;
  setMegaOpen: (open: boolean) => void;
  handleSearchSubmit: (e: FormEvent) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleOpenProfile: () => void;
  user: UserProfile | null;
  wishlistCount: number;
  cartCount: number;
  openCart: () => void;
  closeCart?: () => void;
};

/* ---------------------------------------------------------------------------
   ARDENBY — dark editorial / red accent
--------------------------------------------------------------------------- */

const BLACK = '#0D0D0D';
const BLACK_SOFT = '#151515';
const BLACK_LIGHT = '#1D1D1B';
const WHITE = '#F5F3EE';
const WHITE_SOFT = '#C8C3BA';
const RED = '#8D713E';
const RED_BRIGHT = '#C6A15B';
const GREY = '#8C877F';
const BORDER = '#2A2927';
const ARDENBY_LOGO_STYLE = {
    color: WHITE,
    fontFamily:
      'Bodoni MT, Didot, Cormorant Garamond, Times New Roman, serif',

    backgroundImage: `
      radial-gradient(circle at 3% 45%, #C6A15B 0 2px, transparent 2.5px),
      radial-gradient(circle at 7% 20%, #E33A3A 0 1.5px, transparent 2px),
      radial-gradient(circle at 12% 75%, #B82020 0 3px, transparent 3.5px),
      radial-gradient(circle at 18% 8%, #D52A2A 0 2px, transparent 2.5px),
      radial-gradient(circle at 25% 92%, #E33A3A 0 1.5px, transparent 2px),
      radial-gradient(circle at 34% 3%, #C6A15B 0 3px, transparent 3.5px),
      radial-gradient(circle at 43% 95%, #D52A2A 0 2px, transparent 2.5px),
      radial-gradient(circle at 52% 4%, #E33A3A 0 1.5px, transparent 2px),
      radial-gradient(circle at 62% 94%, #B82020 0 3px, transparent 3.5px),
      radial-gradient(circle at 71% 7%, #D52A2A 0 2px, transparent 2.5px),
      radial-gradient(circle at 79% 91%, #E33A3A 0 2px, transparent 2.5px),
      radial-gradient(circle at 88% 15%, #C6A15B 0 3px, transparent 3.5px),
      radial-gradient(circle at 94% 48%, #E33A3A 0 2px, transparent 2.5px),
      radial-gradient(circle at 98% 78%, #B82020 0 3px, transparent 3.5px),

      radial-gradient(circle at 8% 50%, #D71920 0 5px, transparent 6px),
      radial-gradient(circle at 17% 35%, #E21B23 0 2px, transparent 3px),
      radial-gradient(circle at 29% 18%, #C9151D 0 4px, transparent 5px),
      radial-gradient(circle at 40% 12%, #E21B23 0 2px, transparent 3px),
      radial-gradient(circle at 57% 14%, #D71920 0 4px, transparent 5px),
      radial-gradient(circle at 68% 22%, #E21B23 0 2px, transparent 3px),
      radial-gradient(circle at 82% 32%, #C9151D 0 4px, transparent 5px),
      radial-gradient(circle at 92% 60%, #E21B23 0 2px, transparent 3px),

      radial-gradient(circle at 15% 68%, #D71920 0 3px, transparent 4px),
      radial-gradient(circle at 27% 82%, #E21B23 0 5px, transparent 6px),
      radial-gradient(circle at 39% 72%, #C9151D 0 2px, transparent 3px),
      radial-gradient(circle at 51% 88%, #E21B23 0 3px, transparent 4px),
      radial-gradient(circle at 64% 78%, #D71920 0 4px, transparent 5px),
      radial-gradient(circle at 76% 86%, #E21B23 0 2px, transparent 3px),
      radial-gradient(circle at 87% 72%, #C9151D 0 4px, transparent 5px)
    `,

    backgroundRepeat: 'no-repeat',

    textShadow: `
      2px 0 0 rgba(200,50,50,0.85),
      -2px 0 0 rgba(110,15,15,0.65),
      0 4px 0 rgba(165,35,35,0.5),
      0 8px 18px rgba(0,0,0,0.6)
    `,
};


export function NavbarHeader({
  setMobileOpen,
  megaOpen,
  setMegaOpen,
  handleSearchSubmit,
  searchQuery,
  setSearchQuery,
  handleOpenProfile,
  user,
  wishlistCount,
  cartCount,
  openCart,
  closeCart,
}: NavbarHeaderProps) {
  const [activeMegaCategory, setActiveMegaCategory] =
    useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileExpandedCategory, setMobileExpandedCategory] =
    useState<string | null>(null);

  const activeMegaMenu =
    megaMenu.find((item) => item.slug === activeMegaCategory) ?? null;

  const openNavigation = () => {
    closeCart?.();
    setMegaOpen(false);
    setActiveMegaCategory(null);
    setMenuOpen(true);
    setMobileOpen(true);
  };

  const closeNavigation = () => {
    setMenuOpen(false);
    setMobileOpen(false);
    setMobileExpandedCategory(null);
  };

  const openCategory = (slug: string) => {
    setActiveMegaCategory(slug);
    setMegaOpen(true);
  };

  const closeMega = () => {
    setMegaOpen(false);
    setActiveMegaCategory(null);
  };

  const toggleMobileCategory = (slug: string) => {
    setMobileExpandedCategory((current) =>
      current === slug ? null : slug,
    );
  };

  return (
    <>
      <header
        className="sticky top-0 z-[100] w-full max-w-[100vw] overflow-x-clip"
        style={{
          backgroundColor: BLACK,
          color: WHITE,
        }}
      >
        {/* ================================================================
            PREMIUM DESKTOP MAIN HEADER
        ================================================================= */}
        <div
          className="hidden w-full border-b lg:block"
          style={{
            borderColor: 'rgba(216,189,130,0.16)',
            backgroundColor: '#0A0A0A',
          }}
        >
          <div className="mx-auto w-full max-w-[1700px] px-6 xl:px-10">
            <div className="relative flex h-[76px] items-center">
              {/* MENU */}
              <div className="flex w-[240px] shrink-0 items-center">
                <button
                  type="button"
                  onClick={openNavigation}
                  aria-label="Open menu"
                  className="group flex items-center gap-3"
                  style={{ color: WHITE_SOFT }}
                >
                  <span
                    className="flex h-[38px] w-[38px] items-center justify-center rounded-full border transition-all duration-300 group-hover:bg-[#D8BD82]/[0.08]"
                    style={{ borderColor: 'rgba(216,189,130,0.28)' }}
                  >
                    <Menu
                      className="h-[18px] w-[18px] transition-all duration-300 group-hover:scale-105 group-hover:text-[#D8BD82]"
                      strokeWidth={1.15}
                    />
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.28em] transition-colors duration-300 group-hover:text-[#D8BD82]">
                    Menu
                  </span>
                </button>
              </div>

              {/* LOGO */}
              <Link
                href="/"
                className="group absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              >
                <span
                  className="relative inline-block text-[48px] font-bold uppercase leading-none tracking-[-0.075em] transition-all duration-300 group-hover:scale-[1.015]"
                  style={ARDENBY_LOGO_STYLE}
                >
                  Kovenik
                </span>
                <span
                  className="absolute -bottom-[8px] left-1/2 h-[1px] w-0 -translate-x-1/2 transition-all duration-500 group-hover:w-[72%]"
                  style={{ backgroundColor: '#D8BD82' }}
                />
              </Link>

              {/* ACTIONS */}
              <div className="ml-auto flex shrink-0 items-center gap-2.5">
                {/* SEARCH */}
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="group flex h-[40px] items-center gap-2.5 rounded-full border px-4 transition-all duration-300 hover:bg-[#D8BD82]/[0.08] hover:shadow-[0_0_18px_rgba(216,189,130,0.14)]"
                  style={{
                    color: '#D8BD82',
                    borderColor: 'rgba(216,189,130,0.42)',
                    backgroundColor: 'rgba(216,189,130,0.045)',
                  }}
                >
                  <Search
                    className="h-[17px] w-[17px] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]"
                    strokeWidth={1.25}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.23em] transition-colors group-hover:text-[#F1D99B]">
                    Search
                  </span>
                </button>

                {/* PROFILE */}
                <button
                  type="button"
                  onClick={handleOpenProfile}
                  aria-label={user ? 'My profile' : 'Login'}
                  className="group flex h-[40px] w-[40px] items-center justify-center rounded-full border transition-all duration-300 hover:bg-[#D8BD82]/[0.08] hover:shadow-[0_0_16px_rgba(216,189,130,0.16)]"
                  style={{
                    color: '#D8BD82',
                    borderColor: 'rgba(216,189,130,0.28)',
                    backgroundColor: 'rgba(216,189,130,0.035)',
                  }}
                >
                  <User
                    className="h-[18px] w-[18px] transition-all duration-300 group-hover:scale-110 group-hover:text-[#F1D99B]"
                    strokeWidth={1.2}
                  />
                </button>

                {/* WISHLIST */}
                <Link
                  href="/wishlist"
                  aria-label="Wishlist"
                  className="group relative flex h-[40px] w-[40px] items-center justify-center rounded-full border transition-all duration-300 hover:bg-[#D8BD82]/[0.08] hover:shadow-[0_0_16px_rgba(216,189,130,0.16)]"
                  style={{
                    color: '#D8BD82',
                    borderColor: 'rgba(216,189,130,0.28)',
                    backgroundColor: 'rgba(216,189,130,0.035)',
                  }}
                >
                  <Heart
                    className="h-[18px] w-[18px] transition-all duration-300 group-hover:scale-110 group-hover:fill-[#D8BD82]/10 group-hover:text-[#F1D99B]"
                    strokeWidth={1.2}
                  />
                  {wishlistCount > 0 && (
                    <span
                      className="absolute -right-1 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full border px-1 text-[7px] font-bold"
                      style={{
                        backgroundColor: '#C6A15B',
                        color: '#0D0D0D',
                        borderColor: '#0D0D0D',
                      }}
                    >
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {/* CART */}
                <motion.button
                  type="button"
                  onClick={openCart}
                  aria-label="Shopping cart"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.94 }}
                  className="group relative flex h-[40px] w-[40px] items-center justify-center rounded-full border transition-all duration-300 hover:bg-[#D8BD82]/[0.08] hover:shadow-[0_0_16px_rgba(216,189,130,0.16)]"
                  style={{
                    color: '#D8BD82',
                    borderColor: 'rgba(216,189,130,0.28)',
                    backgroundColor: 'rgba(216,189,130,0.035)',
                  }}
                >
                  <ShoppingCart
                    className="h-[19px] w-[19px] transition-transform duration-300 group-hover:scale-105"
                    strokeWidth={1.2}
                  />
                  {cartCount > 0 && (
                    <span
                      className="absolute -right-1 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full border px-1 text-[7px] font-bold"
                      style={{
                        backgroundColor: '#C6A15B',
                        color: '#0D0D0D',
                        borderColor: '#0D0D0D',
                      }}
                    >
                      {cartCount}
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            PREMIUM DESKTOP CATEGORY BAR
        ================================================================= */}
        <nav
          className="hidden w-full border-b lg:block"
          style={{
            backgroundColor: '#0D0D0D',
            borderColor: 'rgba(216,189,130,0.12)',
          }}
        >
          <div className="mx-auto flex h-[50px] w-full max-w-[1700px] items-center justify-center overflow-hidden px-4">
            {topNavItems.map((item) => {
              const active = megaOpen && activeMegaCategory === item.slug;

              return (
                <div
                  key={item.slug}
                  className="relative h-full shrink-0"
                  onMouseEnter={() => openCategory(item.slug)}
                >
                  <Link
                    href={`/shop?category=${item.slug}`}
                    className="group relative flex h-full items-center px-5 xl:px-6"
                    style={{ color: active ? '#D8BD82' : WHITE }}
                  >
                    <span className="whitespace-nowrap text-[12px] font-semibold uppercase tracking-[0.13em] transition-all duration-300 group-hover:text-[#D8BD82]">
                      {item.label}
                    </span>
                    <span
                      className="absolute bottom-0 left-5 right-5 h-[1px] origin-center transition-transform duration-300 xl:left-6 xl:right-6"
                      style={{
                        backgroundColor: '#D8BD82',
                        transform: active ? 'scaleX(1)' : 'scaleX(0)',
                      }}
                    />
                    <span
                      className="absolute bottom-0 left-1/2 h-[3px] w-[18px] -translate-x-1/2 rounded-full opacity-0 blur-[3px] transition-opacity duration-300 group-hover:opacity-70"
                      style={{ backgroundColor: '#D8BD82' }}
                    />
                  </Link>
                </div>
              );
            })}
          </div>
        </nav>

        {/* ================================================================
            BIGGER MEGA MENU
        ================================================================= */}

        <AnimatePresence mode="wait">
          {megaOpen && activeMegaMenu && (
            <motion.div
              key={activeMegaMenu.slug}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full z-[90] hidden w-full max-w-[100vw] overflow-x-hidden border-b lg:block"
              style={{
                backgroundColor: BLACK_SOFT,
                borderColor: BORDER,
                boxShadow: '0 28px 65px rgba(0,0,0,0.5)',
              }}
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={closeMega}
            >
              <div className="mx-auto w-full max-w-[1500px] px-7 py-3.5 xl:px-10">
                <div
                  className="mb-3 flex items-end justify-between border-b pb-3"
                  style={{ borderColor: BORDER }}
                >
                  <div>
                    <Link href={`/shop?category=${activeMegaMenu.slug}`}>
                      <h3
                        className="text-[21px] font-medium uppercase tracking-[0.02em]"
                        style={{
                          color: WHITE,
                          fontFamily:
                            'Bodoni MT, Didot, Cormorant Garamond, Times New Roman, serif',
                        }}
                      >
                        {activeMegaMenu.title}
                      </h3>

                      <div
                        className="mt-2 h-[2px] w-10"
                        style={{ backgroundColor: RED_BRIGHT }}
                      />

                      <p
                        className="mt-2 max-w-[620px] text-[11px] leading-[1.125rem]"
                        style={{ color: GREY }}
                      >
                        {activeMegaMenu.desc}
                      </p>
                    </Link>
                  </div>

                  <Link
                    href={`/shop?category=${activeMegaMenu.slug}`}
                    className="group flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: WHITE }}
                  >
                    View Collection
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      strokeWidth={1.2}
                    />
                  </Link>
                </div>

                {activeMegaMenu.featured.length > 0 ? (
                  <div className={`grid gap-4 ${activeMegaMenu.featured.length <= 3 ? "grid-cols-3" : "grid-cols-4"}`}>
                    {activeMegaMenu.featured.slice(0, 4).map((p, index) => (
                      <Link
                        key={p.id}
                        href={`/product/${p.slug}`}
                        className="group min-w-0"
                      >
                        <div
                          className="relative aspect-[4/5] w-full min-w-0 overflow-hidden"
                          style={{ backgroundColor: BLACK_LIGHT }}
                        >
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          />

                          <span
                            className="absolute left-3 top-3 flex h-7 min-w-7 items-center justify-center px-2 text-[8px] font-semibold"
                            style={{
                              backgroundColor: 'rgba(13,13,13,0.78)',
                              color: RED_BRIGHT,
                            }}
                          >
                            0{index + 1}
                          </span>

                          <span
                            className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border opacity-0 transition-all duration-300 group-hover:opacity-100"
                            style={{
                              borderColor: 'rgba(245,243,238,0.6)',
                              backgroundColor: 'rgba(13,13,13,0.35)',
                              color: WHITE,
                            }}
                          >
                            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.2} />
                          </span>
                        </div>

                        <div className="pt-2.5">
                          <p
                            className="line-clamp-2 text-[12px] font-medium leading-4 transition-colors group-hover:text-[#D8BD82]"
                            style={{ color: WHITE }}
                          >
                            {p.name}
                          </p>

                          <p
                            className="mt-1.5 text-[7px] uppercase tracking-[0.24em]"
                            style={{ color: RED_BRIGHT }}
                          >
                            ARDENBY
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[120px] items-center justify-center text-center">
                    <div>
                      <p
                        className="text-[24px]"
                        style={{
                          color: WHITE,
                          fontFamily:
                            'Bodoni MT, Didot, Cormorant Garamond, Times New Roman, serif',
                        }}
                      >
                        Collection coming soon
                      </p>
                      <p className="mt-2 text-[11px]" style={{ color: GREY }}>
                        New pieces are being prepared.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================
            MOBILE HEADER
        ================================================================= */}
        <div
          className="relative flex h-[68px] w-full items-center justify-between border-b px-4 lg:hidden"
          style={{
            backgroundColor: '#0A0A0A',
            borderColor: 'rgba(216,189,130,0.16)',
          }}
        >
          <button
            type="button"
            onClick={openNavigation}
            aria-label="Open menu"
            className="group flex h-[40px] w-[40px] items-center justify-center rounded-full border"
            style={{
              color: '#D8BD82',
              borderColor: 'rgba(216,189,130,0.28)',
            }}
          >
            <Menu
              className="h-[19px] w-[19px] transition-transform duration-300 group-hover:scale-105"
              strokeWidth={1.15}
            />
          </button>

          <Link
            href="/"
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          >
            <span
              className="text-[31px] font-bold uppercase leading-none tracking-[-0.075em]"
              style={{
                ...ARDENBY_LOGO_STYLE,
                color: WHITE,
              }}
            >
              ARDENBY
            </span>
            <span
              className="mt-1 text-[5px] uppercase tracking-[0.38em]"
              style={{ color: '#D8BD82' }}
            >
              Wear Your Essence
            </span>
          </Link>

          <motion.button
            type="button"
            onClick={openCart}
            aria-label="Shopping cart"
            whileTap={{ scale: 0.92 }}
            className="relative flex h-[40px] w-[40px] items-center justify-center rounded-full border"
            style={{
              color: '#D8BD82',
              borderColor: 'rgba(216,189,130,0.28)',
            }}
          >
            <ShoppingCart
              className="h-[19px] w-[19px]"
              strokeWidth={1.2}
            />
            {cartCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full border px-1 text-[7px] font-bold"
                style={{
                  backgroundColor: '#C6A15B',
                  color: '#0D0D0D',
                  borderColor: '#0D0D0D',
                }}
              >
                {cartCount}
              </span>
            )}
          </motion.button>
        </div>
      </header>

      {/* ====================================================================
          ARDENBY SHOPPING MENU — SOUL-STORE-STYLE COMPOSITION
      ===================================================================== */}

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              onClick={closeNavigation}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9900] bg-black/55"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 top-0 z-[9910] flex h-[100dvh] w-[92vw] max-w-[560px] flex-col overflow-hidden border-r shadow-[18px_0_60px_rgba(0,0,0,0.55)] lg:w-[40vw] lg:min-w-[520px] lg:max-w-[580px]"
              style={{
                backgroundColor: BLACK,
                color: WHITE,
                borderColor: BORDER,
              }}
            >
              {/* ============================================================
                  SOUL-STORE STYLE SHOPPING MENU
                  Same ARDENBY content, redesigned as a clean commerce drawer
              ============================================================ */}

              {/* BRAND HEADER */}
              <div
                className="flex h-[76px] shrink-0 items-center justify-between border-b px-5 lg:h-[82px] lg:px-7"
                style={{
                  backgroundColor: '#111111',
                  borderColor: BORDER,
                }}
              >
                <Link
                  href="/"
                  onClick={closeNavigation}
                  className="group flex flex-col"
                >
                  <span
                    className="text-[31px] font-bold uppercase leading-[0.82] tracking-[-0.075em] transition-transform duration-300 group-hover:scale-[1.02] lg:text-[35px]"
                    style={{
                      ...ARDENBY_LOGO_STYLE,
                      color: WHITE,
                    }}
                  >
                    ARDENBY
                  </span>
                  <span
                    className="mt-1.5 text-[6px] uppercase tracking-[0.36em] lg:text-[7px]"
                    style={{ color: RED_BRIGHT }}
                  >
                    Wear Your Essence
                  </span>
                </Link>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      closeNavigation();
                      handleOpenProfile();
                    }}
                    className="hidden h-[40px] min-w-[138px] items-center justify-center border px-5 text-[9px] font-semibold uppercase tracking-[0.12em] transition-all duration-300 hover:bg-[#8F1D24] sm:flex"
                    style={{
                      borderColor: '#8F1D24',
                      color: WHITE,
                    }}
                  >
                    {user ? 'My Account' : 'Login / Register'}
                  </button>

                  <button
                    type="button"
                    onClick={closeNavigation}
                    aria-label="Close menu"
                    className="flex h-[40px] w-[40px] items-center justify-center transition-colors hover:text-[#E21B23]"
                    style={{ color: WHITE }}
                  >
                    <X className="h-5 w-5" strokeWidth={1.3} />
                  </button>
                </div>
              </div>

              {/* PROMO STRIP */}
              <div
                className="flex h-[40px] shrink-0 items-center justify-center border-b px-4"
                style={{
                  backgroundColor: '#9A1D25',
                  borderColor: '#9A1D25',
                  color: '#FFFFFF',
                }}
              >
                <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-center">
                  Premium Streetwear — New Collection
                </span>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#F7F5F0] text-[#111111]">

                {/* PRIMARY COLLECTION TABS */}
                <div className="sticky top-0 z-20 border-b bg-[#F7F5F0]">
                  <div className="flex min-w-max items-stretch overflow-x-auto scrollbar-none">
                    {topNavItems.slice(0, 4).map((item, index) => {
                      const active =
                        (mobileExpandedCategory ?? topNavItems[0]?.slug) ===
                        item.slug;

                      return (
                        <button
                          key={item.slug}
                          type="button"
                          onClick={() => toggleMobileCategory(item.slug)}
                          className="relative flex h-[58px] shrink-0 items-center justify-center px-5 text-[9px] font-bold uppercase tracking-[0.08em] transition-colors duration-200 lg:px-7"
                          style={{
                            color: active ? '#9A1D25' : '#77736D',
                          }}
                        >
                          {item.label}
                          <span
                            className="absolute bottom-0 left-4 right-4 h-[3px] transition-transform duration-200"
                            style={{
                              backgroundColor: '#9A1D25',
                              transform: active ? 'scaleX(1)' : 'scaleX(0)',
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FEATURED COLLECTION — SOUL STORE STYLE */}
                {(() => {
                  const selectedSlug =
                    mobileExpandedCategory ?? topNavItems[0]?.slug ?? '';
                  const selectedMenu =
                    megaMenu.find((menu) => menu.slug === selectedSlug) ??
                    megaMenu[0];
                  const featured = selectedMenu?.featured ?? [];

                  return (
                    <section className="border-b border-black/10 bg-[#F7F5F0] px-5 pb-5 pt-5 lg:px-7">
                      <div className="mb-4 flex items-end justify-between gap-4">
                        <div>
                          <p className="mb-1 text-[8px] font-bold uppercase tracking-[0.25em] text-[#9A1D25]">
                            Featured Collection
                          </p>
                          <h2
                            className="text-[22px] font-semibold uppercase leading-none tracking-[-0.025em] lg:text-[26px]"
                            style={{
                              color: '#111111',
                              fontFamily:
                                'Bodoni MT, Didot, Cormorant Garamond, Times New Roman, serif',
                            }}
                          >
                            {selectedMenu?.title ?? 'New Collection'}
                          </h2>
                        </div>

                        <Link
                          href={`/shop?category=${selectedMenu?.slug ?? ''}`}
                          onClick={closeNavigation}
                          className="flex shrink-0 items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.12em]"
                          style={{ color: '#111111' }}
                        >
                          View Collection
                          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.4} />
                        </Link>
                      </div>

                      {featured.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                          {featured.slice(0, 6).map((product, index) => (
                            <Link
                              key={product.id}
                              href={`/product/${product.slug}`}
                              onClick={closeNavigation}
                              className="group min-w-0"
                            >
                              <div className="relative aspect-[0.82] w-full overflow-hidden rounded-[2px] bg-[#E9E5DE]">
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.045]"
                                />

                                <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-sm bg-[#111111]/90 px-1 text-[7px] font-bold text-[#F7F5F0]">
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                              </div>

                              <div className="mt-2">
                                <p className="line-clamp-2 text-[11px] font-semibold leading-[1.35] text-[#171717] lg:text-[12px]">
                                  {product.name}
                                </p>
                                <p className="mt-1 text-[7px] font-bold uppercase tracking-[0.18em] text-[#9A1D25]">
                                  ARDENBY
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center">
                          <p
                            className="text-[20px]"
                            style={{
                              color: '#111111',
                              fontFamily:
                                'Bodoni MT, Didot, Cormorant Garamond, Times New Roman, serif',
                            }}
                          >
                            Collection coming soon
                          </p>
                        </div>
                      )}
                    </section>
                  );
                })()}

                {/* SHOP ALL */}
                <div className="border-b border-black/10 bg-white">
                  <Link
                    href="/shop"
                    onClick={closeNavigation}
                    className="flex min-h-[62px] items-center justify-between px-5 lg:px-7"
                  >
                    <span className="text-[15px] font-bold uppercase tracking-[0.025em] text-[#111111]">
                      Shop All
                    </span>
                    <ChevronDown
                      className="h-5 w-5"
                      strokeWidth={1.25}
                      style={{ color: '#55514B' }}
                    />
                  </Link>
                </div>

                {/* CATEGORIES — IMAGE GRID LIKE SOUL STORE */}
                <section className="bg-white px-5 pb-6 pt-5 lg:px-7">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-[#222222]">
                      Categories
                    </h3>
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#9A1D25]">
                      Explore
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                    {topNavItems.map((item, index) => {
                      const categoryData = megaMenu.find(
                        (menu) => menu.slug === item.slug,
                      );
                      const categoryImage =
                        categoryData?.featured?.[0]?.images?.[0];

                      return (
                        <Link
                          key={item.slug}
                          href={`/shop?category=${item.slug}`}
                          onClick={closeNavigation}
                          className="group min-w-0"
                        >
                          <div className="relative aspect-[0.78] overflow-hidden rounded-[6px] bg-[#ECE8E1]">
                            {categoryImage ? (
                              <img
                                src={categoryImage}
                                alt={item.label}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center px-2 text-center">
                                <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#77736D]">
                                  {item.label}
                                </span>
                              </div>
                            )}

                            <span className="absolute bottom-2 left-2 flex h-5 min-w-5 items-center justify-center rounded-sm bg-white/90 px-1 text-[7px] font-bold text-[#9A1D25]">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>

                          <p className="mt-2 line-clamp-2 text-center text-[9px] font-semibold leading-[1.25] text-[#33312E]">
                            {item.label}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </section>

                {/* ALL CATEGORIES — SAME ARDENBY CONTENT */}
                <section className="border-t border-black/10 bg-[#F7F5F0] px-5 pb-6 pt-5 lg:px-7">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-[#222222]">
                      All Categories
                    </h3>
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#9A1D25]">
                      {topNavItems.length} Collections
                    </span>
                  </div>

                  <div className="divide-y divide-black/10 border-y border-black/10">
                    {topNavItems.map((item, index) => (
                      <Link
                        key={`all-${item.slug}`}
                        href={`/shop?category=${item.slug}`}
                        onClick={closeNavigation}
                        className="group flex min-h-[58px] items-center gap-3"
                      >
                        <span className="w-7 shrink-0 text-[8px] font-bold text-[#9A1D25]">
                          {String(index + 1).padStart(2, '0')}
                        </span>

                        <span className="flex-1 text-[12px] font-bold uppercase tracking-[0.055em] text-[#222222] transition-colors group-hover:text-[#9A1D25]">
                          {item.label}
                        </span>

                        <ChevronRight
                          className="h-4 w-4 text-[#77736D] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#9A1D25]"
                          strokeWidth={1.2}
                        />
                      </Link>
                    ))}
                  </div>
                </section>

                {/* ACCOUNT / WISHLIST / CART */}
                <div className="border-t border-black/10 bg-white px-5 py-1 lg:px-7">
                  <button
                    type="button"
                    onClick={() => {
                      closeNavigation();
                      handleOpenProfile();
                    }}
                    className="group flex min-h-[58px] w-full items-center gap-3 border-b border-black/10 text-left transition-colors hover:text-[#9A1D25]"
                  >
                    <User className="h-[18px] w-[18px]" strokeWidth={1.25} />
                    <span className="text-[12px] font-bold uppercase tracking-[0.13em]">
                      {user ? 'My Profile' : 'Login / Register'}
                    </span>
                  </button>

                  <Link
                    href="/wishlist"
                    onClick={closeNavigation}
                    className="group flex min-h-[58px] items-center gap-3 border-b border-black/10 transition-colors hover:text-[#9A1D25]"
                  >
                    <Heart className="h-[18px] w-[18px]" strokeWidth={1.25} />
                    <span className="text-[12px] font-bold uppercase tracking-[0.13em]">
                      Wishlist
                    </span>
                    {wishlistCount > 0 && (
                      <span className="ml-auto text-[9px] font-bold text-[#9A1D25]">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      closeNavigation();
                      openCart();
                    }}
                    className="group flex min-h-[58px] w-full items-center gap-3 text-left transition-colors hover:text-[#9A1D25]"
                  >
                    <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.25} />
                    <span className="text-[12px] font-bold uppercase tracking-[0.13em]">
                      Shopping Cart
                    </span>
                    {cartCount > 0 && (
                      <span className="ml-auto text-[9px] font-bold text-[#9A1D25]">
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* COMPACT FOOTER */}
              <div
                className="flex h-[42px] shrink-0 items-center justify-between border-t px-5 lg:px-7"
                style={{
                  borderColor: BORDER,
                  backgroundColor: BLACK_SOFT,
                }}
              >
                <span
                  className="text-[6px] uppercase tracking-[0.28em]"
                  style={{ color: GREY }}
                >
                  ARDENBY
                </span>
                <span
                  className="text-[6px] uppercase tracking-[0.28em]"
                  style={{ color: RED_BRIGHT }}
                >
                  Wear Your Essence
                </span>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ====================================================================
          SEARCH OVERLAY
      ===================================================================== */}

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-start justify-center bg-black/95 px-5 pt-[15vh]"
          >
            <motion.div
              initial={{ y: -25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -25, opacity: 0 }}
              className="w-full max-w-[1000px]"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="text-[9px] font-semibold uppercase tracking-[0.3em]" style={{ color: RED_BRIGHT }}>
                  ARDENBY SEARCH
                </span>
                <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search">
                  <X className="h-7 w-7" strokeWidth={1.1} style={{ color: WHITE }} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  handleSearchSubmit(e);
                  setSearchOpen(false);
                }}
                className="border-b pb-5"
                style={{ borderColor: RED_BRIGHT }}
              >
                <div className="flex items-center gap-5">
                  <Search className="h-7 w-7" strokeWidth={1.1} style={{ color: RED_BRIGHT }} />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ARDENBY"
                    className="w-full bg-transparent text-[32px] font-light outline-none placeholder:text-white/25 sm:text-[42px]"
                    style={{ color: WHITE }}
                  />
                </div>
              </form>

              <p className="mt-5 text-[9px] uppercase tracking-[0.2em]" style={{ color: GREY }}>
                Search products, collections and essentials
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
