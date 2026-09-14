'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Menu, Search, ShoppingBag, User } from 'lucide-react';

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
  return (
    <>
      {/* ======================================================

          MAIN NAVBAR

      ====================================================== */}



      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white shadow-sm">

        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">

          <div className="flex h-14 items-center justify-between gap-4 lg:h-[60px]">



            {/* Mobile Menu */}

            <button

              className="lg:hidden p-2 -ml-2 text-neutral-800"

              onClick={() => setMobileOpen(true)}

              aria-label="Open menu"

            >

              <Menu className="h-6 w-6" />

            </button>



            {/* Brand */}

            <Link

              href="/"

              className="flex items-center gap-2 select-none group flex-shrink-0"

            >

              <div className="flex flex-col leading-none">

                <span

                  className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-[-0.08em] text-transparent bg-clip-text bg-gradient-to-b from-black via-neutral-700 to-black transition-all duration-300 group-hover:opacity-80"

                  style={{

                    fontFamily: 'Bodoni MT, Didot, Times New Roman, serif',

                  }}

                >

                  ARDENBY

                </span>



                <div className="mt-1 flex items-center gap-2">

                  <div className="h-px w-4 sm:w-5 bg-neutral-300" />

                  <span className="text-[7px] uppercase tracking-[0.4em] text-neutral-500">

                    WEAR YOUR ESSENCE

                  </span>

                  <div className="h-px w-4 sm:w-5 bg-neutral-300" />

                </div>

              </div>

            </Link>



            {/* Desktop Navigation */}

            <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center px-4">

              {topNavItems.map((item) => (

                <div

                  key={item.slug}

                  className="relative py-3"

                  onMouseEnter={() => {

                    if (

                      item.slug === 'supreme-edition' ||

                      item.slug === 'epic-thread'

                    ) {

                      setMegaOpen(true);

                    }

                  }}

                  onMouseLeave={() => setMegaOpen(false)}

                >

                  <Link

                    href={`/shop?category=${item.slug}`}

                    className="text-[11px] xl:text-[12px] font-bold text-neutral-800 hover:text-[#1A80E6] transition-colors leading-tight text-center block max-w-[85px] tracking-tight uppercase"

                  >

                    {item.label}

                  </Link>

                </div>

              ))}

            </nav>



            {/* Search + Actions */}

            <div className="flex items-center gap-3 xl:gap-4">

              <form

                onSubmit={handleSearchSubmit}

                className="hidden md:block relative w-44"

              >

                <input

                  type="text"

                  value={searchQuery}

                  onChange={(e) => setSearchQuery(e.target.value)}

                  placeholder='Try searching "T-shirt"'

                  className="w-full pl-4 pr-10 py-2 text-xs bg-neutral-50 rounded-lg border border-purple-300 focus:border-purple-600 focus:outline-none focus:bg-white text-neutral-800 placeholder-neutral-400 transition-all"

                />



                <button

                  type="submit"

                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-800"

                  aria-label="Search"

                >

                  <Search className="h-4 w-4" />

                </button>

              </form>



              {/* Profile */}

              <button

                type="button"

                onClick={handleOpenProfile}

                className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors hidden sm:block text-neutral-700"

                aria-label={user ? 'My profile' : 'Login'}

                title={user ? 'My profile' : 'Login'}

              >

                <User className="h-5 w-5" />

              </button>



              {/* Wishlist */}

              <Link

                href="/wishlist"

                className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors relative text-neutral-700"

                aria-label="Wishlist"

              >

                <Heart className="h-5 w-5" />



                {wishlistCount > 0 && (

                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">

                    {wishlistCount}

                  </span>

                )}

              </Link>



              {/* Cart */}

              <button

                onClick={openCart}

                className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors relative text-neutral-700"

                aria-label="Cart"

              >

                <ShoppingBag className="h-5 w-5" />



                {cartCount > 0 && (

                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">

                    {cartCount}

                  </span>

                )}

              </button>

            </div>

          </div>

        </div>



        {/* ====================================================

            MEGA MENU

        ===================================================== */}

        <AnimatePresence>

          {megaOpen && (

            <motion.div

              initial={{ opacity: 0, y: 10 }}

              animate={{ opacity: 1, y: 0 }}

              exit={{ opacity: 0, y: 10 }}

              transition={{ duration: 0.2 }}

              className="absolute top-full left-0 w-full bg-white  border-neutral-200 shadow-xl py-6 z-50 hidden lg:block"

              onMouseEnter={() => setMegaOpen(true)}

              onMouseLeave={() => setMegaOpen(false)}

            >

              <div className="max-w-7xl mx-auto px-6 grid grid-cols-4 gap-8">

                {megaMenu.map((col) => (

                  <div key={col.slug}>

                    <Link

                      href={`/shop?category=${col.slug}`}

                      className="block mb-2"

                    >

                      <h3 className="font-bold text-sm text-neutral-900 hover:text-[#1A80E6] transition-colors">

                        {col.title}

                      </h3>



                      <p className="text-xs text-neutral-500">{col.desc}</p>

                    </Link>



                    <div className="space-y-2 mt-3">

                      {col.featured.map((p) => (

                        <Link

                          key={p.id}

                          href={`/product/${p.slug}`}

                          className="flex items-center gap-2 group p-1 rounded-md hover:bg-neutral-50 transition-colors"

                        >

                          <div className="w-10 h-12 rounded overflow-hidden bg-neutral-100 flex-shrink-0">

                            <img

                              src={p.images[0]}

                              alt={p.name}

                              className="w-full h-full object-cover"

                            />

                          </div>



                          <span className="text-xs font-medium text-neutral-700 group-hover:text-[#1A80E6] line-clamp-2">

                            {p.name}

                          </span>

                        </Link>

                      ))}

                    </div>

                  </div>

                ))}

              </div>

            </motion.div>

          )}

        </AnimatePresence>

      </header>
    </>
  );
}
