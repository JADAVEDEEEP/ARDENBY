'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  ArrowRight,
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
};

// ---------------------------------------------------------------------------
// Design tokens — ivory / charcoal / brass
// ---------------------------------------------------------------------------

const INK = '#1B1B1B';
const IVORY = '#FAF8F3';
const BRASS = '#A67C42';
const STONE = '#7A7268';
const HAIRLINE = '#E4DFD4';

// Soft golden glow
const GLOW_SOFT =
  '0 0 0 1px rgba(166,124,66,0.16), 0 3px 14px rgba(166,124,66,0.14)';

const GLOW_HOVER =
  '0 0 0 1px rgba(166,124,66,0.30), 0 5px 20px rgba(166,124,66,0.22)';

const GLOW_FOCUS =
  '0 0 0 1.5px rgba(166,124,66,0.45), 0 7px 26px rgba(166,124,66,0.28)';

const ICON_GLOW = '0 4px 16px rgba(166,124,66,0.22)';

const SEARCH_RADIUS = '14px';

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
}: NavbarHeaderProps) {
  // =========================================================
  // ACTIVE CATEGORY
  // =========================================================

  const [activeMegaCategory, setActiveMegaCategory] =
    useState<string | null>(null);

  // Current category data
  const activeMegaMenu =
    megaMenu.find(
      (item) => item.slug === activeMegaCategory
    ) ?? null;

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        backgroundColor: IVORY,
        borderColor: HAIRLINE,
      }}
    >
      <style jsx>{`
        .ard-search {
          box-shadow: ${GLOW_SOFT};
          transition: box-shadow 0.3s ease;
        }

        .ard-search:hover {
          box-shadow: ${GLOW_HOVER};
        }

        .ard-search:focus-within {
          box-shadow: ${GLOW_FOCUS};
        }

        .ard-icon {
          transition:
            box-shadow 0.3s ease,
            background-color 0.3s ease,
            color 0.3s ease;
        }

        .ard-icon:hover {
          box-shadow: ${ICON_GLOW};
          background-color: rgba(166, 124, 66, 0.07);
          color: ${BRASS};
        }

        .ard-icon:focus-visible {
          outline: 2px solid ${BRASS};
          outline-offset: 2px;
        }
      `}</style>

      {/* =====================================================
          MAIN HEADER — brand left, search center, icons right
      ====================================================== */}

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
        <div className="flex min-h-[76px] items-center gap-3 lg:min-h-[88px] lg:gap-8">

          {/* MOBILE MENU BUTTON */}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden shrink-0 p-2 -ml-2 rounded-full transition-colors"
            style={{ color: INK }}
            aria-label="Open menu"
          >
            <Menu
              className="h-6 w-6"
              strokeWidth={1.5}
            />
          </button>

          {/* BRAND LOGO */}

          <Link
            href="/"
            className="group flex shrink-0 flex-col items-start leading-none select-none"
          >
            <span
              className="text-[28px] sm:text-[34px] lg:text-[42px] font-bold uppercase tracking-[-0.055em] transition-transform duration-300 group-hover:translate-y-[-1px]"
              style={{
                color: INK,
                fontFamily:
                  'Bodoni MT, Didot, Times New Roman, serif',
              }}
            >
              ARDENBY
            </span>

            <div className="mt-1 flex w-full items-center gap-1.5 sm:gap-2">
              <span
                className="text-[6.5px] sm:text-[7.5px] uppercase tracking-[0.32em] sm:tracking-[0.38em] whitespace-nowrap"
                style={{ color: STONE }}
              >
                Wear Your Essence
              </span>

              <div
                className="h-px flex-1"
                style={{
                  backgroundColor: BRASS,
                  opacity: 0.55,
                }}
              />
            </div>
          </Link>

          {/* DESKTOP SEARCH BAR */}

          <div className="hidden lg:flex items-center justify-end flex-1">
            <form
              onSubmit={handleSearchSubmit}
              className="w-full max-w-[220px]"
            >
              <div
                className="relative flex items-center bg-[#f5f0eb] rounded-md border-2 border-[#8d6e63] transition-all hover:border-[#6d4c41]"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  placeholder='Try searching "T-Shirt"'
                  className="w-full h-[44px] pl-3.5 pr-10 bg-transparent text-[13px] font-medium outline-none text-[#4e342e] placeholder:text-[#8d6e63] placeholder:font-medium"
                />

                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-[34px] w-[34px] flex items-center justify-center rounded-md text-[#6d4c41] hover:bg-[#ebdcd0] transition-colors outline-none"
                >
                  <Search
                    className="h-[16px] w-[16px]"
                    strokeWidth={2.5}
                  />
                </button>
              </div>
            </form>
          </div>

          {/* ACTION ICONS */}

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">

            {/* PROFILE */}

            <button
              type="button"
              onClick={handleOpenProfile}
              aria-label={user ? 'My profile' : 'Login'}
              title={user ? 'My profile' : 'Login'}
              className="ard-icon group relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full"
              style={{ color: INK }}
            >
              <User
                className="h-[18px] w-[18px] sm:h-[20px] sm:w-[20px]"
                strokeWidth={1.5}
              />

              <span
                className="pointer-events-none absolute top-[48px] left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1.5 text-[10px] font-medium text-white opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 hidden sm:block"
                style={{
                  backgroundColor: INK,
                }}
              >
                {user ? 'My Profile' : 'Login'}
              </span>
            </button>

            {/* WISHLIST */}

            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="ard-icon relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full"
              style={{ color: INK }}
            >
              <Heart
                className="h-[18px] w-[18px] sm:h-[20px] sm:w-[20px]"
                strokeWidth={1.5}
              />

              {wishlistCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 min-w-[17px] h-[17px] px-1 rounded-full text-[9px] font-semibold flex items-center justify-center"
                  style={{
                    backgroundColor: BRASS,
                    color: IVORY,
                    boxShadow: `0 0 0 2px ${IVORY}`,
                  }}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* CART */}

            <button
              type="button"
              onClick={openCart}
              aria-label="Cart"
              className="ard-icon relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full"
              style={{ color: INK }}
            >
              <ShoppingBag
                className="h-[18px] w-[18px] sm:h-[20px] sm:w-[20px]"
                strokeWidth={1.5}
              />

              {cartCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 min-w-[17px] h-[17px] px-1 rounded-full text-[9px] font-semibold flex items-center justify-center"
                  style={{
                    backgroundColor: BRASS,
                    color: IVORY,
                    boxShadow: `0 0 0 2px ${IVORY}`,
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          CATEGORY NAVIGATION
      ====================================================== */}

      <div
        className="hidden lg:block border-t"
        style={{
          borderColor: HAIRLINE,
        }}
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <nav className="flex items-center justify-center">

            {topNavItems.map((item, i) => {
              const isActive =
                megaOpen &&
                activeMegaCategory === item.slug;

              return (
                <div
                  key={item.slug}
                  className="relative flex items-center"
                  onMouseEnter={() => {
                    setActiveMegaCategory(item.slug);
                    setMegaOpen(true);
                  }}
                >
                  {i > 0 && (
                    <div
                      className="h-3 w-px"
                      style={{
                        backgroundColor: HAIRLINE,
                      }}
                    />
                  )}

                  <Link
                    href={`/shop?category=${item.slug}`}
                    className="group relative flex min-h-[50px] items-center justify-center px-5 xl:px-6 text-[11px] xl:text-[12px] font-medium uppercase tracking-[0.1em] whitespace-nowrap transition-colors duration-200"
                    style={{
                      color: isActive
                        ? BRASS
                        : INK,
                    }}
                  >
                    {item.label}

                    <span
                      className={`absolute bottom-0 left-5 right-5 h-[1.5px] origin-center transition-transform duration-300 ${
                        isActive
                          ? 'scale-x-100'
                          : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                      style={{
                        backgroundColor: BRASS,
                      }}
                    />
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* =====================================================
          DYNAMIC MEGA MENU
      ====================================================== */}

      <AnimatePresence mode="wait">
        {megaOpen && activeMegaMenu && (
          <motion.div
            key={activeMegaMenu.slug}
            initial={{
              opacity: 0,
              y: 6,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 6,
            }}
            transition={{
              duration: 0.18,
            }}
            className="absolute top-full left-0 w-full border-t py-8 z-50 hidden lg:block"
            style={{
              backgroundColor: IVORY,
              borderColor: HAIRLINE,
              boxShadow:
                '0 20px 40px rgba(27,27,27,0.08)',
            }}
            onMouseEnter={() => setMegaOpen(true)}
            onMouseLeave={() => {
              setMegaOpen(false);
              setActiveMegaCategory(null);
            }}
          >
            <div className="mx-auto max-w-7xl px-6">

              {/* =================================================
                  CATEGORY HEADER
              ================================================== */}

              <div className="mb-5 flex items-end justify-between border-b pb-4">
                <div>
                  <Link
                    href={`/shop?category=${activeMegaMenu.slug}`}
                    className="group inline-block"
                  >
                    <h3
                      className="text-[13px] font-semibold uppercase tracking-[0.1em]"
                      style={{
                        color: INK,
                        fontFamily:
                          'Bodoni MT, Didot, Times New Roman, serif',
                      }}
                    >
                      {activeMegaMenu.title}
                    </h3>

                    <div
                      className="mt-1.5 h-px w-6 transition-all duration-300 group-hover:w-10"
                      style={{
                        backgroundColor: BRASS,
                      }}
                    />

                    <p
                      className="mt-2 text-xs"
                      style={{
                        color: STONE,
                      }}
                    >
                      {activeMegaMenu.desc}
                    </p>
                  </Link>
                </div>

                <Link
                  href={`/shop?category=${activeMegaMenu.slug}`}
                  className="group flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.2em]"
                  style={{
                    color: INK,
                  }}
                >
                  View Collection

                  <ArrowRight
                    className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
                    strokeWidth={1.5}
                  />
                </Link>
              </div>

              {/* =================================================
                  CATEGORY PRODUCTS
              ================================================== */}

              {activeMegaMenu.featured.length > 0 ? (
                <div className="grid grid-cols-4 gap-6">

                  {activeMegaMenu.featured
                    .slice(0, 4)
                    .map((p, index) => (
                      <Link
                        key={p.id}
                        href={`/product/${p.slug}`}
                        className="group flex items-center gap-3 p-1.5 transition-colors"
                      >
                        {/* PRODUCT IMAGE */}

                        <div
                          className="w-11 h-12 overflow-hidden shrink-0"
                          style={{
                            backgroundColor: HAIRLINE,
                          }}
                        >
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>

                        {/* PRODUCT DETAILS */}

                        <div className="min-w-0">
                          <span
                            className="block text-[10px] font-medium line-clamp-2 transition-colors"
                            style={{
                              color: STONE,
                            }}
                          >
                            {p.name}
                          </span>

                          <span
                            className="mt-1 block text-[7px] uppercase tracking-[0.16em] opacity-60"
                            style={{
                              color: BRASS,
                            }}
                          >
                            ARDENBY
                          </span>
                        </div>

                        {/* NUMBER */}

                        <span
                          className="ml-auto self-start text-[7px] opacity-30"
                          style={{
                            color: INK,
                          }}
                        >
                          0{index + 1}
                        </span>
                      </Link>
                    ))}

                </div>
              ) : (
                /* =================================================
                   EMPTY CATEGORY
                ================================================== */

                <div className="flex min-h-[115px] items-center justify-center text-center">
                  <div>
                    <p
                      className="font-serif text-lg"
                      style={{
                        color: INK,
                        fontFamily:
                          'Bodoni MT, Didot, Times New Roman, serif',
                      }}
                    >
                      Collection coming soon
                    </p>

                    <p
                      className="mt-1.5 text-[10px]"
                      style={{
                        color: STONE,
                      }}
                    >
                      New pieces are being prepared.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}