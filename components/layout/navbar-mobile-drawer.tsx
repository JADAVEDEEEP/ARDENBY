'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  X,
  Heart,
  User,
  Package,
  ChevronRight,
  ArrowUpRight,
  Truck,
} from 'lucide-react';

import type { UserProfile } from './navbar';
import { topNavItems } from './navbar-data';

type NavbarMobileDrawerProps = {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  handleSearchSubmit: (e: FormEvent) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  wishlistCount: number;
  handleOpenProfile: () => void;
  user: UserProfile | null;
};

const ease = [0.16, 1, 0.3, 1] as const;

const drawerVariants = {
  hidden: { x: '-100%', transition: { duration: 0.35, ease } },
  visible: { x: 0, transition: { duration: 0.4, ease } },
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease } },
};

export function NavbarMobileDrawer({
  mobileOpen,
  setMobileOpen,
  handleSearchSubmit,
  searchQuery,
  setSearchQuery,
  wishlistCount,
  handleOpenProfile,
  user,
}: NavbarMobileDrawerProps) {
  // Safe accessor to bypass strict type check if UserProfile lacks properties in navbar.ts
  const typedUser = user as Record<string, any> | null;

  return (
    <AnimatePresence>
      {mobileOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileOpen(false)}
          />

          {/* Mobile Drawer Panel */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed top-0 left-0 bottom-0 z-50 flex w-[310px] flex-col justify-between bg-[#F8F7F3] text-[#111111] shadow-2xl lg:hidden overflow-y-auto selection:bg-neutral-900 selection:text-white"
          >
            <div>
              {/* Header: Logo & Close Button */}
              <div className="flex items-center justify-between border-b border-black/10 p-5 bg-[#F4F2ED]">
                <div className="flex flex-col">
                  <span
                    className="font-serif text-2xl font-bold uppercase tracking-tight text-neutral-950"
                    style={{
                      fontFamily: 'Bodoni MT, Didot, Times New Roman, serif',
                    }}
                  >
                    ARDENBY
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-amber-700">
                    Luxury Streetwear
                  </span>
                </div>

                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-neutral-800 transition-colors hover:bg-neutral-900 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Luxury Search Bar */}
              <div className="p-4 border-b border-black/5 bg-[#F8F7F3]">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 'Oversized Tee'..."
                    className="w-full rounded-full border border-neutral-300 bg-white py-2.5 pl-4 pr-10 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 shadow-2xs"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-950 transition-colors"
                    aria-label="Search"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {/* Dynamic Category Navigation with Stagger Effect */}
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="p-4 space-y-1"
              >
                <div className="mb-2 px-1 text-[8.5px] font-bold uppercase tracking-[0.25em] text-neutral-400">
                  Collections & Line
                </div>

                {topNavItems.map((item, idx) => (
                  <motion.div key={item.slug} variants={itemVariants}>
                    <Link
                      href={`/shop?category=${item.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="group flex items-center justify-between rounded-xl p-2.5 text-xs font-bold uppercase tracking-wider text-neutral-800 transition-all hover:bg-white hover:text-black hover:shadow-2xs"
                    >
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 group-hover:bg-amber-500 transition-colors" />
                        {item.label}
                      </span>

                      <div className="flex items-center gap-1">
                        {idx === 0 && (
                          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[7.5px] font-extrabold tracking-widest text-amber-800">
                            HOT
                          </span>
                        )}
                        <ChevronRight className="h-3.5 w-3.5 opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Mobile Footer & User Account Actions */}
            <div className="border-t border-black/10 bg-[#EFECE4] p-4 space-y-3">
              {/* Profile Card Banner */}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleOpenProfile();
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-white p-3 shadow-2xs transition-all hover:border-black/20 hover:bg-stone-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-white font-bold text-xs">
                    {typedUser?.name ? typedUser.name.charAt(0) : <User className="h-4 w-4" />}
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-neutral-900 leading-none">
                      {typedUser?.name ? typedUser.name : 'Account Login'}
                    </p>
                    <p className="text-[9px] font-light text-neutral-500 mt-0.5">
                      {typedUser?.email ? typedUser.email : 'Tap to manage orders & profile'}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-neutral-500" />
              </button>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-black/5 bg-white py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-800 transition-colors hover:bg-neutral-900 hover:text-white"
                >
                  <Heart className="h-3.5 w-3.5 text-rose-500" />
                  Wishlist ({wishlistCount})
                </Link>

                <Link
                  href="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-black/5 bg-white py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-800 transition-colors hover:bg-neutral-900 hover:text-white"
                >
                  <Package className="h-3.5 w-3.5 text-amber-600" />
                  My Orders
                </Link>
              </div>

              {/* Shipping Trust Micro Badge */}
              <div className="flex items-center justify-center gap-1.5 pt-1 text-[8.5px] font-semibold text-neutral-500 uppercase tracking-widest">
                <Truck className="h-3 w-3 text-emerald-600" />
                <span>Free Express Shipping Across India</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}