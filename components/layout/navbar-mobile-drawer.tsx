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
            className="fixed inset-0 z-[9880] bg-black/60 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileOpen(false)}
          />

          {/* Mobile Drawer Panel */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed top-0 left-0 bottom-0 z-[9890] flex w-[310px] flex-col justify-between chrome-scope bg-[#050506] text-[#eef0f2] shadow-2xl lg:hidden overflow-y-auto selection:bg-white selection:text-black"
          >
            <div>
              {/* Header: Logo & Close Button */}
              <div className="flex items-center justify-between border-b border-white/10 p-5 bg-[#0b0c0e]">
                <div className="flex flex-col">
                  <span
                    className="chrome-text text-2xl font-medium uppercase tracking-[0.3em]"
                    style={{
                      fontFamily: 'var(--font-bodoni), Didot, serif',
                    }}
                  >
                    KOVENIK
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-[#c9a24a]">
                    Wear Your Essence
                  </span>
                </div>

                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-[#eef0f2] transition-colors hover:bg-white hover:text-black"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Luxury Search Bar */}
              <div className="p-4 border-b border-white/10 bg-[#050506]">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 'Oversized Tee'..."
                    className="w-full rounded-full border border-white/20 bg-white/5 py-3 pl-4 pr-11 text-xs text-[#eef0f2] placeholder:text-[#a2a7af] focus:border-white/60 focus:outline-none focus:ring-1 focus:ring-white/60"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a2a7af] hover:text-white transition-colors"
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
                <div className="mb-2 px-1 text-[8.5px] font-bold uppercase tracking-[0.25em] text-[#a2a7af]">
                  Collections & Line
                </div>

                {topNavItems.map((item, idx) => (
                  <motion.div key={item.slug} variants={itemVariants}>
                    <Link
                      href={`/shop?category=${item.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="group flex items-center justify-between rounded-xl p-2.5 text-xs font-bold uppercase tracking-wider text-[#eef0f2] transition-all hover:bg-white/10 hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/30 group-hover:bg-[#c9a24a] transition-colors" />
                        {item.label}
                      </span>

                      <div className="flex items-center gap-1">
                        {idx === 0 && (
                          <span className="rounded-full bg-[#c9a24a]/20 px-2 py-0.5 text-[7.5px] font-extrabold tracking-widest text-[#ecd189]">
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
            <div className="border-t border-white/10 bg-[#0b0c0e] p-4 space-y-3">
              {/* Profile Card Banner */}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleOpenProfile();
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/5 p-3 transition-all hover:border-white/40 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black font-bold text-xs">
                    {typedUser?.name ? typedUser.name.charAt(0) : <User className="h-4 w-4" />}
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-[#eef0f2] leading-none">
                      {typedUser?.name ? typedUser.name : 'Account Login'}
                    </p>
                    <p className="text-[9px] font-light text-[#a2a7af] mt-0.5">
                      {typedUser?.email ? typedUser.email : 'Tap to manage orders & profile'}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[#a2a7af]" />
              </button>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#eef0f2] transition-colors hover:bg-white hover:text-black"
                >
                  <Heart className="h-3.5 w-3.5 text-[#eef0f2]" />
                  Wishlist ({wishlistCount})
                </Link>

                <Link
                  href="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#eef0f2] transition-colors hover:bg-white hover:text-black"
                >
                  <Package className="h-3.5 w-3.5 text-[#c9a24a]" />
                  My Orders
                </Link>
              </div>

              {/* Shipping Trust Micro Badge */}
              <div className="flex items-center justify-center gap-1.5 pt-1 text-[8.5px] font-semibold text-[#a2a7af] uppercase tracking-widest">
                <Truck className="h-3 w-3 text-[#c9a24a]" />
                <span>Free Express Shipping Across India</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}