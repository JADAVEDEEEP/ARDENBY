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
      <header className="sticky top-0 z-[100] w-full max-w-[100vw] overflow-x-clip"
        style={{
          backgroundColor: BLACK,
          color: WHITE,
        }}
      >
        {/* ================================================================
            MAIN HEADER — NO SECOND ANNOUNCEMENT BAR
        ================================================================= */}

        <div
          className="hidden w-full max-w-full overflow-hidden border-b lg:block"
          style={{ borderColor: BORDER }}
        >
          <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-7 xl:px-10">
            <div className="relative flex h-[78px] items-center">
              {/* MENU */}
              <div className="flex w-[220px] shrink-0 items-center">
                <button
                  type="button"
                  onClick={openNavigation}
                  aria-label="Open menu"
                  className="group flex items-center gap-3"
                  style={{ color: WHITE }}
                >
                  <Menu
                    className="h-[21px] w-[21px] transition-colors group-hover:text-[#D8BD82]"
                    strokeWidth={1.2}
                  />
                  <span className="text-[13px] font-semibold uppercase tracking-[0.2em] transition-colors group-hover:text-[#D8BD82]">
                    
                  </span>
                </button>
              </div>

              {/* LOGO */}
              <Link
                href="/"
                className="group absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center whitespace-nowrap"
              >
               <span
  className="
    relative
    inline-block
    text-[50px]
    font-bold
    uppercase
    leading-[0.8]
    tracking-[-0.075em]
    transition-all
    duration-300
    group-hover:text-[#FFF5F0]
  "
  style={{
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
  }}
>
  ARDENBY
</span>
               
              </Link>

              {/* ACTIONS */}
              <div className="ml-auto flex shrink-0 items-center gap-5 xl:gap-6">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="group flex items-center gap-2.5"
                  style={{ color: WHITE_SOFT }}
                >
                  <Search
                    className="h-[19px] w-[19px] transition-colors group-hover:text-[#D8BD82]"
                    strokeWidth={1.25}
                  />
                  <span className="text-[12px] font-semibold uppercase tracking-[0.2em] transition-colors group-hover:text-[#D8BD82]">
                    Search
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenProfile}
                  aria-label={user ? 'My profile' : 'Login'}
                  className="group"
                >
                  <User
                    className="h-[21px] w-[21px] transition-colors group-hover:text-[#D8BD82]"
                    strokeWidth={1.2}
                  />
                </button>

                <Link
                  href="/wishlist"
                  aria-label="Wishlist"
                  className="group relative"
                >
                  <Heart
                    className="h-[21px] w-[21px] transition-colors group-hover:text-[#D8BD82]"
                    strokeWidth={1.2}
                  />
                  {wishlistCount > 0 && (
                    <span
                      className="absolute -right-2.5 -top-2 flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[7px] font-bold"
                      style={{ backgroundColor: RED_BRIGHT, color: WHITE }}
                    >
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <motion.button
                  type="button"
                  onClick={openCart}
                  aria-label="Shopping cart"
                  whileHover={{ y: -2, rotate: -3 }}
                  whileTap={{ scale: 0.9 }}
                  className="group relative"
                >
                  <ShoppingCart
                    className="h-[22px] w-[22px] transition-colors group-hover:text-[#D8BD82]"
                    strokeWidth={1.25}
                  />
                  {cartCount > 0 && (
                    <span
                      className="absolute -right-2.5 -top-2 flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[7px] font-bold"
                      style={{ backgroundColor: RED_BRIGHT, color: WHITE }}
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
            DESKTOP CATEGORY BAR
        ================================================================= */}

        <nav
          className="hidden w-full max-w-full overflow-hidden border-b lg:block"
          style={{
            borderColor: BORDER,
            backgroundColor: BLACK,
          }}
        >
          <div className="mx-auto flex h-[52px] w-full max-w-[1600px] items-center justify-center overflow-hidden px-2 lg:px-3 xl:px-5">
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
                    className="group relative flex h-full items-center px-3.5 lg:px-4.5 xl:px-5"
                    style={{ color: active ? RED_BRIGHT : WHITE }}
                  >
                    <span className="whitespace-nowrap text-[12px] font-semibold uppercase tracking-[0.11em] transition-colors group-hover:text-[#D8BD82]">
                      {item.label}
                    </span>
                    <span
                      className="absolute bottom-0 left-3.5 right-3.5 h-[2px] origin-center transition-transform duration-300 lg:left-4.5 lg:right-4.5 xl:left-5 xl:right-5"
                      style={{
                        backgroundColor: RED_BRIGHT,
                        transform: active ? 'scaleX(1)' : 'scaleX(0)',
                      }}
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
              <div className="mx-auto w-full max-w-[1500px] px-10 py-8 xl:px-14">
                <div
                  className="mb-7 flex items-end justify-between border-b pb-6"
                  style={{ borderColor: BORDER }}
                >
                  <div>
                    <Link href={`/shop?category=${activeMegaMenu.slug}`}>
                      <h3
                        className="text-[24px] font-medium uppercase tracking-[0.02em]"
                        style={{
                          color: WHITE,
                          fontFamily:
                            'Bodoni MT, Didot, Cormorant Garamond, Times New Roman, serif',
                        }}
                      >
                        {activeMegaMenu.title}
                      </h3>

                      <div
                        className="mt-3 h-[2px] w-12"
                        style={{ backgroundColor: RED_BRIGHT }}
                      />

                      <p
                        className="mt-3 text-[13px] leading-5"
                        style={{ color: GREY }}
                      >
                        {activeMegaMenu.desc}
                      </p>
                    </Link>
                  </div>

                  <Link
                    href={`/shop?category=${activeMegaMenu.slug}`}
                    className="group flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: WHITE }}
                  >
                    View Collection
                    <ArrowRight
                      className="h-5 w-5 transition-transform group-hover:translate-x-1"
                      strokeWidth={1.2}
                    />
                  </Link>
                </div>

                {activeMegaMenu.featured.length > 0 ? (
                  <div className={`grid gap-7 ${activeMegaMenu.featured.length <= 3 ? "grid-cols-3" : "grid-cols-4"}`}>
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

                        <div className="pt-4">
                          <p
                            className="line-clamp-2 text-[13px] font-medium leading-5 transition-colors group-hover:text-[#D8BD82]"
                            style={{ color: WHITE }}
                          >
                            {p.name}
                          </p>

                          <p
                            className="mt-2 text-[8px] uppercase tracking-[0.24em]"
                            style={{ color: RED_BRIGHT }}
                          >
                            ARDENBY
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[160px] items-center justify-center text-center">
                    <div>
                      <p
                        className="text-[30px]"
                        style={{
                          color: WHITE,
                          fontFamily:
                            'Bodoni MT, Didot, Cormorant Garamond, Times New Roman, serif',
                        }}
                      >
                        Collection coming soon
                      </p>
                      <p className="mt-3 text-[13px]" style={{ color: GREY }}>
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
          className="relative flex h-[74px] w-full max-w-full items-center justify-between overflow-hidden border-b px-5 lg:hidden"
          style={{ backgroundColor: BLACK, borderColor: BORDER }}
        >
          <button
            type="button"
            onClick={openNavigation}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-start"
            style={{ color: WHITE }}
          >
            <Menu className="h-6 w-6" strokeWidth={1.2} />
          </button>

          <Link
            href="/"
            className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center whitespace-nowrap"
          >
            <span
              className="text-[32px] font-bold uppercase leading-[0.8] tracking-[-0.075em]"
              style={{
                color: WHITE,
                fontFamily:
                  'Bodoni MT, Didot, Cormorant Garamond, Times New Roman, serif',
                textShadow: '2px 0 0 rgba(198,161,91,0.78), -2px 0 0 rgba(111,89,50,0.58), 0 4px 0 rgba(141,113,62,0.45), 0 7px 15px rgba(0,0,0,0.5)',
              }}
            >
              ARDENBY
            </span>
            <span
              className="mt-2 text-[5px] uppercase tracking-[0.4em]"
              style={{ color: RED_BRIGHT }}
            >
              Wear Your Essence
            </span>
          </Link>

          <motion.button
            type="button"
            onClick={openCart}
            aria-label="Shopping cart"
            whileHover={{ y: -2, rotate: -3 }}
            whileTap={{ scale: 0.9 }}
            className="relative flex h-10 w-10 items-center justify-end"
            style={{ color: WHITE }}
          >
            <ShoppingCart className="h-[22px] w-[22px]" strokeWidth={1.2} />
            {cartCount > 0 && (
              <span
                className="absolute right-[-2px] top-[2px] flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[7px] font-bold"
                style={{ backgroundColor: RED_BRIGHT, color: WHITE }}
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
              className="fixed left-0 top-0 z-[9910] flex h-[100dvh] w-[92vw] max-w-[560px] flex-col overflow-hidden border-r shadow-[14px_0_45px_rgba(0,0,0,0.18)] lg:w-[40vw] lg:min-w-[520px] lg:max-w-[580px]"
              style={{
                backgroundColor: '#FAF8F3',
                color: '#1B1B1B',
                borderColor: '#E4DFD4',
              }}
            >
              {/* COMPACT BRAND HEADER */}
              <div
                className="flex h-[70px] shrink-0 items-center justify-between border-b px-5 lg:h-[76px] lg:px-6"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E4DFD4',
                }}
              >
                <Link href="/" onClick={closeNavigation} className="group flex flex-col">
                  <span
                    className="text-[29px] font-bold uppercase leading-[0.8] tracking-[-0.065em] transition-colors duration-300 group-hover:text-[#D8BD82] lg:text-[32px]"
                    style={{
                      color: '#1B1B1B',
                      fontFamily:
                        'Bodoni MT, Didot, Cormorant Garamond, Times New Roman, serif',
                    }}
                  >
                    ARDENBY
                  </span>
                  <span
                    className="mt-1.5 text-[5px] uppercase tracking-[0.32em] lg:text-[6px]"
                    style={{ color: '#C6A15B' }}
                  >
                    Wear Your Essence
                  </span>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeNavigation();
                      handleOpenProfile();
                    }}
                    className="hidden h-10 items-center justify-center border px-5 text-[9px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-[#1B1B1B] hover:text-white sm:flex"
                    style={{ borderColor: '#C6A15B', color: '#1B1B1B' }}
                  >
                    {user ? 'My Account' : 'Login / Register'}
                  </button>

                  <button
                    type="button"
                    onClick={closeNavigation}
                    aria-label="Close menu"
                    className="flex h-10 w-10 items-center justify-center"
                    style={{ color: '#1B1B1B' }}
                  >
                    <X className="h-5 w-5" strokeWidth={1.3} />
                  </button>
                </div>
              </div>

              {/* DARK GOLD PROMO STRIP */}
              <div
                className="flex h-[38px] shrink-0 items-center justify-center"
                style={{ backgroundColor: '#80652F', color: '#FFFFFF' }}
              >
                <span className="text-[8px] font-semibold uppercase tracking-[0.16em]">
                  Premium Streetwear — New Collection
                </span>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* CATEGORY TABS */}
                <div
                  className="overflow-x-auto border-b bg-white"
                  style={{ borderColor: '#E4DFD4' }}
                >
                  <div className="flex min-w-max">
                    {topNavItems.slice(0, 6).map((item, index) => {
                      const active =
                        (mobileExpandedCategory ?? topNavItems[0]?.slug) === item.slug;

                      return (
                        <button
                          key={item.slug}
                          type="button"
                          onClick={() => toggleMobileCategory(item.slug)}
                          className="relative flex h-[52px] items-center px-4 text-[9px] font-semibold uppercase tracking-[0.08em] transition-colors lg:px-5"
                          style={{ color: active ? '#1B1B1B' : '#8A8175' }}
                        >
                          {item.label}
                          {active && (
                            <span
                              className="absolute bottom-0 left-3 right-3 h-[2px]"
                              style={{ backgroundColor: '#C6A15B' }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FEATURED COLLECTION */}
                {(() => {
                  const selectedSlug =
                    mobileExpandedCategory ?? topNavItems[0]?.slug ?? '';
                  const selectedMenu =
                    megaMenu.find((menu) => menu.slug === selectedSlug) ??
                    megaMenu[0];
                  const featured = selectedMenu?.featured ?? [];

                  return (
                    <div
                      className="border-b bg-white px-5 py-5 lg:px-6 lg:py-6"
                      style={{ borderColor: '#E4DFD4' }}
                    >
                      <div className="mb-5 flex items-end justify-between gap-4">
                        <div>
                          <p
                            className="mb-1.5 text-[8px] font-semibold uppercase tracking-[0.25em]"
                            style={{ color: '#C6A15B' }}
                          >
                            Featured Collection
                          </p>
                          <h2
                            className="text-[21px] font-semibold uppercase leading-none tracking-[-0.02em] lg:text-[24px]"
                            style={{
                              color: '#1B1B1B',
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
                          className="flex shrink-0 items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.14em]"
                          style={{ color: '#1B1B1B' }}
                        >
                          View Collection
                          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.2} />
                        </Link>
                      </div>

                      {featured.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 lg:gap-5">
                          {featured.slice(0, 6).map((product, index) => (
                            <Link
                              key={product.id}
                              href={`/product/${product.slug}`}
                              onClick={closeNavigation}
                              className="group block min-w-0"
                            >
                              <div
                                className="relative aspect-[0.80] w-full overflow-hidden"
                                style={{ backgroundColor: '#ECE8E0' }}
                              >
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                />
                                <span
                                  className="absolute left-2.5 top-2.5 flex h-6 min-w-6 items-center justify-center px-1 text-[7px] font-semibold"
                                  style={{
                                    backgroundColor: 'rgba(250,248,243,0.9)',
                                    color: '#C6A15B',
                                  }}
                                >
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                              </div>

                              <div className="mt-2.5">
                                <p
                                  className="line-clamp-2 text-[13px] font-medium leading-[1.45] lg:text-[12px]"
                                  style={{ color: '#1B1B1B' }}
                                >
                                  {product.name}
                                </p>
                                <p
                                  className="mt-1 text-[7px] uppercase tracking-[0.2em]"
                                  style={{ color: '#C6A15B' }}
                                >
                                  ARDENBY
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center">
                          <p className="text-[20px]" style={{ color: '#1B1B1B' }}>
                            Collection coming soon
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* SHOP ALL */}
                <div
                  className="border-b bg-white"
                  style={{ borderColor: '#E4DFD4' }}
                >
                  <Link
                    href="/shop"
                    onClick={closeNavigation}
                    className="flex min-h-[64px] items-center justify-between px-5 lg:px-6"
                  >
                    <span
                      className="text-[15px] font-semibold uppercase tracking-[0.04em]"
                      style={{ color: '#1B1B1B' }}
                    >
                      Shop All
                    </span>
                    <ArrowRight className="h-5 w-5" strokeWidth={1.2} style={{ color: '#C9C0B2' }} />
                  </Link>
                </div>

                {/* ALL CATEGORIES */}
                <div
                  className="bg-[#FAF8F3] px-5 pb-6 pt-5 lg:px-6"
                  style={{ borderColor: '#E4DFD4' }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3
                      className="text-[19px] font-semibold uppercase tracking-[0.01em]"
                      style={{ color: '#1B1B1B' }}
                    >
                      Categories
                    </h3>
                    <span
                      className="text-[8px] font-semibold uppercase tracking-[0.2em]"
                      style={{ color: '#C6A15B' }}
                    >
                      Explore
                    </span>
                  </div>

                  <div className="divide-y" style={{ borderColor: '#E4DFD4' }}>
                    {topNavItems.map((item, index) => {
                      const categoryData = megaMenu.find(
                        (menu) => menu.slug === item.slug,
                      );
                      const expanded = mobileExpandedCategory === item.slug;

                      return (
                        <div key={item.slug} style={{ borderColor: '#E4DFD4' }}>
                          <div className="flex min-h-[68px] items-center gap-3">
                            <span
                              className="w-6 shrink-0 text-[8px] font-semibold"
                              style={{ color: '#C6A15B' }}
                            >
                              {String(index + 1).padStart(2, '0')}
                            </span>

                            <button
                              type="button"
                              onClick={() => toggleMobileCategory(item.slug)}
                              className="flex flex-1 items-center justify-between text-left"
                            >
                              <span
                                className="text-[14px] font-semibold uppercase tracking-[0.045em] lg:text-[15px]"
                                style={{ color: '#1B1B1B' }}
                              >
                                {item.label}
                              </span>

                              <ChevronDown
                                className="mr-1 h-5 w-5 transition-transform duration-300"
                                style={{
                                  color: '#C9C0B2',
                                  transform: expanded
                                    ? 'rotate(180deg)'
                                    : 'rotate(0deg)',
                                }}
                                strokeWidth={1.2}
                              />
                            </button>
                          </div>

                          <AnimatePresence initial={false}>
                            {expanded && categoryData && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                              >
                                <div className="pb-6 pl-9">
                                  <p
                                    className="mb-4 max-w-[410px] text-[12px] leading-5"
                                    style={{ color: '#C9C0B2' }}
                                  >
                                    {categoryData.desc}
                                  </p>

                                  <div className="grid grid-cols-2 gap-4">
                                    {categoryData.featured
                                      .slice(0, 6)
                                      .map((product) => (
                                        <Link
                                          key={product.id}
                                          href={`/product/${product.slug}`}
                                          onClick={closeNavigation}
                                          className="group"
                                        >
                                          <div
                                            className="aspect-[0.82] overflow-hidden"
                                            style={{ backgroundColor: '#ECE8E0' }}
                                          >
                                            <img
                                              src={product.images[0]}
                                              alt={product.name}
                                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                            />
                                          </div>
                                          <p
                                            className="mt-2 line-clamp-2 text-[12px] leading-4"
                                            style={{ color: '#1B1B1B' }}
                                          >
                                            {product.name}
                                          </p>
                                        </Link>
                                      ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ACCOUNT / WISHLIST / CART */}
                <div
                  className="border-t bg-white px-5 py-2 lg:px-6"
                  style={{ borderColor: '#E4DFD4' }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      closeNavigation();
                      handleOpenProfile();
                    }}
                    className="flex min-h-[58px] w-full items-center gap-3 border-b text-left"
                    style={{ borderColor: '#E4DFD4' }}
                  >
                    <User className="h-[18px] w-[18px]" strokeWidth={1.25} />
                    <span className="text-[12px] font-semibold uppercase tracking-[0.15em]">
                      {user ? 'My Profile' : 'Login / Register'}
                    </span>
                  </button>

                  <Link
                    href="/wishlist"
                    onClick={closeNavigation}
                    className="flex min-h-[58px] items-center gap-3 border-b"
                    style={{ borderColor: '#E4DFD4' }}
                  >
                    <Heart className="h-[18px] w-[18px]" strokeWidth={1.25} />
                    <span className="text-[12px] font-semibold uppercase tracking-[0.15em]">
                      Wishlist
                    </span>
                    {wishlistCount > 0 && (
                      <span className="ml-auto text-[9px]" style={{ color: '#C6A15B' }}>
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
                    className="flex min-h-[58px] w-full items-center gap-3 text-left"
                  >
                    <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.25} />
                    <span className="text-[12px] font-semibold uppercase tracking-[0.15em]">
                      Shopping Cart
                    </span>
                    {cartCount > 0 && (
                      <span className="ml-auto text-[9px]" style={{ color: '#C6A15B' }}>
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* COMPACT FOOTER */}
              <div
                className="flex h-[42px] shrink-0 items-center justify-between border-t px-5"
                style={{
                  borderColor: '#E4DFD4',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <span
                  className="text-[6px] uppercase tracking-[0.28em]"
                  style={{ color: '#A29A8E' }}
                >
                  ARDENBY
                </span>
                <span
                  className="text-[6px] uppercase tracking-[0.28em]"
                  style={{ color: '#C6A15B' }}
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
