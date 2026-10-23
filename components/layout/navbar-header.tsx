'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { Suspense, useEffect, useMemo, useState } from 'react';
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
import { buildMegaMenu, topNavItems } from './navbar-data';
import { useHomeProducts } from '@/hooks/use-home-products';
import { KovenikLogo } from './kovenik-logo';

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
 *  KOVENIK chrome theme: near-black / silver glass / tiny gold accents
 * ------------------------------------------------------------------------- */

const G900 = '#050506';
const G800 = '#0b0c0e';
const G700 = '#16181b';
const IVORY = '#eef0f2';
const MIST = '#b4b9c0'; // secondary text on dark, 8:1+ contrast
const NAV_IDLE = '#d6d9de';
const GOLD = '#c9a24a';
const LINE = 'rgba(255,255,255,0.12)';

const SERIF = 'var(--font-bodoni), Didot, "Bodoni MT", serif';
const SANS = 'var(--font-archivo), Inter, Arial, system-ui, sans-serif';

const LOGO_STYLE = {
  fontFamily: SERIF,
};

/* Glass round icon button (desktop + mobile). */
const ICON_BTN =
  'chrome-focus group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.05] text-[#e8eaed] transition duration-300 hover:border-white/50 hover:bg-white/[0.1] hover:text-white';

const BADGE =
  'absolute -right-1 -top-1 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#c9a24a] px-1 text-[10px] font-bold leading-none text-[#17120a]';

const NAV_LINK =
  'chrome-focus group relative flex h-full items-center whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors duration-300 hover:!text-white';

/* Reports the `?category=` param. Isolated in its own Suspense boundary so
 * useSearchParams never forces the rest of the app into client rendering. */
function CategoryReporter({ onChange }: { onChange: (slug: string | null) => void }) {
  const params = useSearchParams();
  const category = params.get('category');

  useEffect(() => {
    onChange(category);
  }, [category, onChange]);

  return null;
}

function Wordmark({ className }: { className?: string }) {
  return <KovenikLogo layout="horizontal" className={className} />;
}

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
  const pathname = usePathname() ?? "";
  const isHome = pathname === '/';

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeMegaCategory, setActiveMegaCategory] =
    useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileExpandedCategory, setMobileExpandedCategory] =
    useState<string | null>(null);

  // Prevent client-only cart/wishlist counts from causing SSR hydration mismatch.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Desktop navbar: Plus Size and All Products are removed here.
  const navbarItems = topNavItems.filter((item) => {
    const label = String(item.label).trim().toLowerCase();
    const slug = String(item.slug).trim().toLowerCase();
    return !(
      label === 'plus size' ||
      label === 'all products' ||
      slug === 'plus-size' ||
      slug === 'all-products' ||
      slug === 'all'
    );
  });

  const { products: liveProducts } = useHomeProducts();
  const megaMenu = useMemo(() => buildMegaMenu(liveProducts), [liveProducts]);

  const activeMegaMenu =
    megaMenu.find((item) => item.slug === activeMegaCategory) ?? null;

  const onShop = pathname === '/shop';
  const isActiveHome = isHome;
  const isActiveShop = onShop && !activeCategory;
  const isActiveAbout = pathname.startsWith('/about');

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

  /* Underline + colour for a nav item. Active = gold underline. */
  const navLabelStyle = (active: boolean) => ({
    color: active ? '#ffffff' : NAV_IDLE,
  });
  const underlineStyle = (active: boolean) => ({
    transform: active ? 'scaleX(1)' : 'scaleX(0)',
  });

  const searchForm = (
    <form
      onSubmit={handleSearchSubmit}
      role="search"
      className="flex h-11 w-full items-center gap-3 rounded-full border border-white/[0.14] bg-white/[0.06] px-5 transition-colors duration-300 focus-within:border-white/50"
    >
      <Search
        className="h-[18px] w-[18px] shrink-0 text-[#c9a24a]"
        strokeWidth={1.8}
      />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search Kovenik"
        aria-label="Search Kovenik"
        className="min-w-0 flex-1 bg-transparent text-[13px] text-[#eef0f2] outline-none placeholder:text-[#9aa0a8]"
      />
    </form>
  );

  return (
    <>
      <Suspense fallback={null}>
        <CategoryReporter onChange={setActiveCategory} />
      </Suspense>

      <header
        className="chrome-scope sticky top-0 z-[100] w-full max-w-[100vw] border-b border-white/[0.08]"
        style={{
          color: IVORY,
          fontFamily: SANS,
          // Translucent glass only where a dark page sits behind it (home).
          backgroundColor: isHome ? 'rgba(9,10,11,0.72)' : '#090a0b',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
        onMouseLeave={closeMega}
      >
        {/* ===================== DESKTOP ===================== */}
        <div className="hidden w-full lg:block">
          {/* Row 1: logo / search / utilities */}
          <div className="mx-auto grid h-[76px] w-full max-w-[1500px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-8 px-8 xl:gap-12 xl:px-12">
            <Link href="/" aria-label="Kovenik home" className="chrome-focus group relative shrink-0">
              <Wordmark className="h-[60px] w-auto" />
            </Link>

            <div className="mx-auto w-full max-w-[560px]">{searchForm}</div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenProfile}
                aria-label={user ? 'My profile' : 'Login'}
                className={ICON_BTN}
              >
                <User className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </button>

              <Link href="/wishlist" aria-label="Wishlist" className={ICON_BTN}>
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.6} />
                {mounted && wishlistCount > 0 && (
                  <span className={BADGE}>{wishlistCount}</span>
                )}
              </Link>

              <motion.button
                type="button"
                onClick={openCart}
                aria-label="Shopping cart"
                whileTap={{ scale: 0.94 }}
                className={ICON_BTN}
              >
                <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.6} />
                {mounted && cartCount > 0 && (
                  <span className={BADGE}>{cartCount}</span>
                )}
              </motion.button>

              <button
                type="button"
                onClick={openNavigation}
                aria-label="Open menu"
                className={ICON_BTN}
              >
                <Menu className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </button>
            </div>
          </div>

          {/* Row 2: real category navigation */}
          <nav aria-label="Primary" className="border-t border-white/[0.08]">
            <div className="mx-auto flex h-[46px] w-full max-w-[1500px] items-center justify-center gap-7 px-8 xl:gap-10 xl:px-12">
              <Link
                href="/"
                onMouseEnter={closeMega}
                aria-current={isActiveHome ? 'page' : undefined}
                className={NAV_LINK}
                style={navLabelStyle(isActiveHome)}
              >
                Home
                <span
                  className="absolute bottom-0 left-0 h-[2px] w-full origin-center bg-[#c9a24a] transition-transform duration-300 group-hover:!scale-x-100"
                  style={underlineStyle(isActiveHome)}
                />
              </Link>

              <Link
                href="/shop"
                onMouseEnter={closeMega}
                aria-current={isActiveShop ? 'page' : undefined}
                className={NAV_LINK}
                style={navLabelStyle(isActiveShop)}
              >
                Shop
                <span
                  className="absolute bottom-0 left-0 h-[2px] w-full origin-center bg-[#c9a24a] transition-transform duration-300 group-hover:!scale-x-100"
                  style={underlineStyle(isActiveShop)}
                />
              </Link>

              {navbarItems.map((item) => {
                const hovered = megaOpen && activeMegaCategory === item.slug;
                const current = onShop && activeCategory === item.slug;
                const active = hovered || current;
                return (
                  <Link
                    key={item.slug}
                    href={`/shop?category=${item.slug}`}
                    onMouseEnter={() => openCategory(item.slug)}
                    onFocus={() => openCategory(item.slug)}
                    aria-current={current ? 'page' : undefined}
                    className={NAV_LINK}
                    style={navLabelStyle(active)}
                  >
                    {item.label}
                    <span
                      className="absolute bottom-0 left-0 h-[2px] w-full origin-center bg-[#c9a24a] transition-transform duration-300 group-hover:!scale-x-100"
                      style={underlineStyle(active)}
                    />
                  </Link>
                );
              })}

              <Link
                href="/about"
                onMouseEnter={closeMega}
                aria-current={isActiveAbout ? 'page' : undefined}
                className={NAV_LINK}
                style={navLabelStyle(isActiveAbout)}
              >
                About
                <span
                  className="absolute bottom-0 left-0 h-[2px] w-full origin-center bg-[#c9a24a] transition-transform duration-300 group-hover:!scale-x-100"
                  style={underlineStyle(isActiveAbout)}
                />
              </Link>
            </div>
          </nav>
        </div>

        {/* ===================== MEGA MENU ===================== */}
        <AnimatePresence mode="wait">
          {megaOpen && activeMegaMenu && (
            <motion.div
              key={activeMegaMenu.slug}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full z-[90] hidden w-full max-w-[100vw] overflow-x-hidden border-b border-t lg:block"
              style={{
                backgroundColor: G800,
                borderColor: LINE,
                boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              }}
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={closeMega}
            >
              <div className="mx-auto w-full max-w-[1500px] px-7 py-3 xl:px-10">
                <div
                  className="mb-3 flex items-end justify-between border-b pb-3"
                  style={{ borderColor: LINE }}
                >
                  <div>
                    <Link href={`/shop?category=${activeMegaMenu.slug}`}>
                      <h3
                        className="chrome-text text-[26px] font-medium uppercase leading-none tracking-[0.04em]"
                        style={{ fontFamily: SERIF }}
                      >
                        {activeMegaMenu.title}
                      </h3>
                      <div
                        className="mt-3 h-px w-10"
                        style={{ backgroundColor: GOLD }}
                      />
                      <p
                        className="mt-3 max-w-[680px] text-[13px] leading-[1.5rem]"
                        style={{ color: MIST }}
                      >
                        {activeMegaMenu.desc}
                      </p>
                    </Link>
                  </div>

                  <Link
                    href={`/shop?category=${activeMegaMenu.slug}`}
                    className="chrome-focus group flex min-h-[44px] items-center gap-2 rounded-full border border-white/30 px-5 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors hover:border-white/70 hover:bg-white/10"
                    style={{ color: IVORY }}
                  >
                    View collection
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      strokeWidth={1.3}
                    />
                  </Link>
                </div>

                {activeMegaMenu.featured.length > 0 ? (
                  <div
                    className={`grid gap-4 ${
                      activeMegaMenu.featured.length <= 3
                        ? 'grid-cols-3'
                        : 'grid-cols-4'
                    }`}
                  >
                    {activeMegaMenu.featured.slice(0, 4).map((p) => (
                      <Link
                        key={p.id}
                        href={`/product/${p.slug}`}
                        className="chrome-focus group min-w-0"
                      >
                        <div
                          className="relative h-[160px] w-full min-w-0 overflow-hidden rounded-xl border border-white/10 xl:h-[180px]"
                          style={{ backgroundColor: G700 }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                          <span
                            className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                            style={{ backgroundColor: IVORY, color: G900 }}
                          >
                            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </span>
                        </div>

                        <div className="pt-3">
                          <p
                            className="line-clamp-2 text-[14px] font-medium leading-[1.3rem] transition-colors group-hover:text-white"
                            style={{ color: IVORY }}
                          >
                            {p.name}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[90px] items-center justify-center text-center">
                    <div>
                      <p
                        className="text-[26px]"
                        style={{ color: IVORY, fontFamily: SERIF }}
                      >
                        Collection coming soon
                      </p>
                      <p className="mt-1.5 text-[12px]" style={{ color: MIST }}>
                        New pieces are being prepared.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================== MOBILE HEADER ===================== */}
        <div className="lg:hidden">
          <div className="relative flex h-[60px] w-full items-center px-4">
            <button
              type="button"
              onClick={openNavigation}
              aria-label="Open menu"
              className={ICON_BTN}
            >
              <Menu className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </button>

            <Link
              href="/"
              aria-label="Kovenik home"
              className="chrome-focus flex h-full min-w-0 flex-1 items-center justify-center px-2"
            >
              <Wordmark className="h-[42px] w-auto max-w-full" />
            </Link>

            <div className="flex items-center gap-2">
              <Link href="/wishlist" aria-label="Wishlist" className={ICON_BTN}>
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.6} />
                {mounted && wishlistCount > 0 && (
                  <span className={BADGE}>{wishlistCount}</span>
                )}
              </Link>

              <motion.button
                type="button"
                onClick={openCart}
                aria-label="Shopping cart"
                whileTap={{ scale: 0.92 }}
                className={ICON_BTN}
              >
                <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.6} />
                {mounted && cartCount > 0 && (
                  <span className={BADGE}>{cartCount}</span>
                )}
              </motion.button>
            </div>
          </div>

          {/* Full-width search + account */}
          <div className="flex items-center gap-2 px-4 pb-2.5">
            <div className="min-w-0 flex-1">{searchForm}</div>
            <button
              type="button"
              onClick={handleOpenProfile}
              aria-label={user ? 'My profile' : 'Login'}
              className={ICON_BTN}
            >
              <User className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </button>
          </div>

          {/* Horizontally scrollable nav row */}
          <nav
            aria-label="Categories"
            className="no-scrollbar flex items-center gap-1 overflow-x-auto border-t border-white/10 px-4"
          >
            {[
              { label: 'Home', href: '/', active: isActiveHome },
              { label: 'Shop', href: '/shop', active: isActiveShop },
              ...topNavItems
                .filter((item) => item.slug !== 'all-products')
                .map((item) => ({
                  label: item.label,
                  href: `/shop?category=${item.slug}`,
                  active: onShop && activeCategory === item.slug,
                })),
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.active ? 'page' : undefined}
                className="chrome-focus relative flex h-11 shrink-0 items-center whitespace-nowrap px-3 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-white"
                style={navLabelStyle(link.active)}
              >
                {link.label}
                <span
                  className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#c9a24a] transition-transform duration-300"
                  style={underlineStyle(link.active)}
                />
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* ====================================================================
          NAVIGATION DRAWER
      ==================================================================== */}
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
              className="fixed inset-0 z-[9900] bg-black/60"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="chrome-scope fixed left-0 top-0 z-[9910] flex h-[100dvh] w-[92vw] max-w-[560px] flex-col overflow-hidden border-r shadow-[18px_0_60px_rgba(0,0,0,0.6)] lg:w-[40vw] lg:min-w-[520px] lg:max-w-[580px]"
              style={{
                backgroundColor: G900,
                color: IVORY,
                borderColor: LINE,
                fontFamily: SANS,
              }}
            >
              {/* BRAND HEADER */}
              <div
                className="flex h-[72px] shrink-0 items-center justify-between border-b px-5 lg:h-[80px] lg:px-7"
                style={{ backgroundColor: G800, borderColor: LINE }}
              >
                <Link
                  href="/"
                  onClick={closeNavigation}
                  className="group flex flex-col"
                >
                  <KovenikLogo layout="horizontal" className="h-[46px] w-auto" />
                  <span
                    className="mt-1.5 text-[9px] uppercase tracking-[0.32em]"
                    style={{ color: GOLD }}
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
                    className="hidden h-10 items-center justify-center rounded-full border border-white/25 px-5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors hover:border-white/70 hover:text-white sm:flex"
                    style={{ color: IVORY }}
                  >
                    {user ? 'My Account' : 'Login / Register'}
                  </button>

                  <button
                    type="button"
                    onClick={closeNavigation}
                    aria-label="Close menu"
                    className={ICON_BTN}
                  >
                    <X className="h-[18px] w-[18px]" strokeWidth={1.3} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto" style={{ backgroundColor: G900 }}>
                {/* COLLECTION TABS */}
                <div
                  className="sticky top-0 z-20 border-b"
                  style={{ borderColor: LINE, backgroundColor: G800 }}
                >
                  <div className="scrollbar-none flex min-w-max items-stretch overflow-x-auto">
                    {topNavItems.slice(0, 4).map((item) => {
                      const active =
                        (mobileExpandedCategory ?? topNavItems[0]?.slug) ===
                        item.slug;

                      return (
                        <button
                          key={item.slug}
                          type="button"
                          onClick={() => toggleMobileCategory(item.slug)}
                          className="relative flex h-[58px] shrink-0 items-center justify-center px-5 text-[12px] font-medium uppercase tracking-[0.12em] transition-colors duration-200 lg:px-7"
                          style={{ color: active ? '#ffffff' : MIST }}
                        >
                          {item.label}
                          <span
                            className="absolute bottom-0 left-4 right-4 h-px transition-transform duration-200"
                            style={{
                              backgroundColor: GOLD,
                              transform: active ? 'scaleX(1)' : 'scaleX(0)',
                            }}
                          />
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
                    <section
                      className="border-b px-5 pb-6 pt-6 lg:px-7"
                      style={{ borderColor: LINE }}
                    >
                      <div className="mb-5 flex items-end justify-between gap-4">
                        <div>
                          <p
                            className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em]"
                            style={{ color: GOLD }}
                          >
                            Featured collection
                          </p>
                          <h2
                            className="text-[32px] font-medium uppercase leading-none lg:text-[36px]"
                            style={{ color: IVORY, fontFamily: SERIF }}
                          >
                            {selectedMenu?.title ?? 'New Collection'}
                          </h2>
                        </div>

                        <Link
                          href={`/shop?category=${selectedMenu?.slug ?? ''}`}
                          onClick={closeNavigation}
                          className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors hover:text-white"
                          style={{ color: IVORY }}
                        >
                          View
                          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.4} />
                        </Link>
                      </div>

                      {featured.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                          {featured.slice(0, 6).map((product) => (
                            <Link
                              key={product.id}
                              href={`/product/${product.slug}`}
                              onClick={closeNavigation}
                              className="group min-w-0"
                            >
                              <div
                                className="relative aspect-[0.82] w-full overflow-hidden rounded-xl"
                                style={{ backgroundColor: G700 }}
                              >
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                />
                              </div>
                              <p
                                className="mt-2.5 line-clamp-2 text-[12px] font-medium leading-[1.4]"
                                style={{ color: IVORY }}
                              >
                                {product.name}
                              </p>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center">
                          <p
                            className="text-[22px]"
                            style={{ color: IVORY, fontFamily: SERIF }}
                          >
                            Collection coming soon
                          </p>
                        </div>
                      )}
                    </section>
                  );
                })()}

                {/* SHOP ALL */}
                <div className="border-b" style={{ borderColor: LINE }}>
                  <Link
                    href="/shop"
                    onClick={closeNavigation}
                    className="flex min-h-[60px] items-center justify-between px-5 lg:px-7"
                  >
                    <span
                      className="text-[22px]"
                      style={{ color: IVORY, fontFamily: SERIF }}
                    >
                      Shop all
                    </span>
                    <ChevronDown
                      className="h-5 w-5"
                      strokeWidth={1.25}
                      style={{ color: GOLD }}
                    />
                  </Link>
                </div>

                {/* CATEGORIES — IMAGE GRID */}
                <section
                  className="border-b px-5 pb-6 pt-6 lg:px-7"
                  style={{ borderColor: LINE }}
                >
                  <h3
                    className="mb-4 text-[24px]"
                    style={{ color: IVORY, fontFamily: SERIF }}
                  >
                    Categories
                  </h3>

                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                    {topNavItems.map((item) => {
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
                          <div
                            className="relative aspect-[0.78] overflow-hidden rounded-xl"
                            style={{ backgroundColor: G700 }}
                          >
                            {categoryImage ? (
                              <img
                                src={categoryImage}
                                alt={item.label}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center px-2 text-center">
                                <span
                                  className="text-[10px] font-medium uppercase tracking-[0.08em]"
                                  style={{ color: MIST }}
                                >
                                  {item.label}
                                </span>
                              </div>
                            )}
                          </div>

                          <p
                            className="mt-2.5 line-clamp-2 text-center text-[11px] font-medium leading-[1.3]"
                            style={{ color: IVORY }}
                          >
                            {item.label}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </section>

                {/* ALL CATEGORIES */}
                <section className="px-5 pb-4 pt-6 lg:px-7">
                  <div className="mb-3 flex items-center justify-between">
                    <h3
                      className="text-[24px]"
                      style={{ color: IVORY, fontFamily: SERIF }}
                    >
                      All categories
                    </h3>
                    <span
                      className="text-[11px] font-medium uppercase tracking-[0.16em]"
                      style={{ color: GOLD }}
                    >
                      {topNavItems.length} collections
                    </span>
                  </div>

                  <div
                    className="divide-y border-y"
                    style={{ borderColor: LINE }}
                  >
                    {topNavItems.map((item) => (
                      <Link
                        key={`all-${item.slug}`}
                        href={`/shop?category=${item.slug}`}
                        onClick={closeNavigation}
                        className="group flex min-h-[56px] items-center gap-3"
                        style={{ borderColor: LINE }}
                      >
                        <span
                          className="flex-1 text-[13px] font-medium uppercase tracking-[0.1em] transition-colors group-hover:text-white"
                          style={{ color: IVORY }}
                        >
                          {item.label}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white"
                          strokeWidth={1.2}
                          style={{ color: MIST }}
                        />
                      </Link>
                    ))}
                  </div>
                </section>

                {/* ACCOUNT / WISHLIST / CART */}
                <div className="px-5 pb-6 lg:px-7">
                  <button
                    type="button"
                    onClick={() => {
                      closeNavigation();
                      handleOpenProfile();
                    }}
                    className="group flex min-h-[56px] w-full items-center gap-3 border-b text-left transition-colors hover:text-white"
                    style={{ borderColor: LINE, color: IVORY }}
                  >
                    <User className="h-[18px] w-[18px]" strokeWidth={1.25} />
                    <span className="text-[13px] font-medium uppercase tracking-[0.12em]">
                      {user ? 'My Profile' : 'Login / Register'}
                    </span>
                  </button>

                  <Link
                    href="/wishlist"
                    onClick={closeNavigation}
                    className="group flex min-h-[56px] items-center gap-3 border-b transition-colors hover:text-white"
                    style={{ borderColor: LINE, color: IVORY }}
                  >
                    <Heart className="h-[18px] w-[18px]" strokeWidth={1.25} />
                    <span className="text-[13px] font-medium uppercase tracking-[0.12em]">
                      Wishlist
                    </span>
                    {mounted && wishlistCount > 0 && (
                      <span
                        className="ml-auto text-[12px] font-semibold"
                        style={{ color: GOLD }}
                      >
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
                    className="group flex min-h-[56px] w-full items-center gap-3 text-left transition-colors hover:text-white"
                    style={{ color: IVORY }}
                  >
                    <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.25} />
                    <span className="text-[13px] font-medium uppercase tracking-[0.12em]">
                      Shopping Cart
                    </span>
                    {mounted && cartCount > 0 && (
                      <span
                        className="ml-auto text-[12px] font-semibold"
                        style={{ color: GOLD }}
                      >
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* COMPACT FOOTER */}
              <div
                className="flex h-[42px] shrink-0 items-center justify-between border-t px-5 lg:px-7"
                style={{ borderColor: LINE, backgroundColor: G800 }}
              >
                <span
                  className="text-[9px] uppercase tracking-[0.24em]"
                  style={{ color: MIST }}
                >
                  Kovenik
                </span>
                <span
                  className="text-[9px] uppercase tracking-[0.24em]"
                  style={{ color: GOLD }}
                >
                  Wear Your Essence
                </span>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
