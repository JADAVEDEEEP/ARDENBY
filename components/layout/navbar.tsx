'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, ShoppingBag, Menu, X, User } from 'lucide-react';
import { useCartStore, getCartCount } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { categories, products } from '@/lib/data';
import { cn } from '@/lib/utils';

const megaMenu = [
  {
    title: 'Supreme Edition',
    slug: 'supreme-edition',
    desc: 'Heavyweight oversized cotton',
    featured: products.filter((p) => p.category === 'supreme-edition').slice(0, 3),
  },
  {
    title: 'Epic Thread',
    slug: 'epic-thread',
    desc: 'Graphic & printed tees',
    featured: products.filter((p) => p.category === 'epic-thread').slice(0, 3),
  },
  {
    title: 'Ardenby Premium',
    slug: 'ardenby-premium',
    desc: 'Long-staple cotton essentials',
    featured: products.filter((p) => p.category === 'ardenby-premium').slice(0, 3),
  },
  {
    title: 'The Print Club',
    slug: 'the-print-club',
    desc: 'Bold prints & puff graphics',
    featured: products.filter((p) => p.category === 'the-print-club').slice(0, 3),
  },
];

const topNavItems = [
  { label: 'SUPREME EDITION', slug: 'supreme-edition' },
  { label: 'EPIC THREAD', slug: 'epic-thread' },
  { label: 'ARDENBY PREMIUM', slug: 'ardenby-premium' },
  { label: 'THE PRINT CLUB', slug: 'the-print-club' },
  { label: 'TOP WEAR', slug: 'top-wear' },
  { label: 'PLUS SIZE', slug: 'plus-size' },
  { label: 'BOTTOM WEAR', slug: 'bottom-wear' },
  { label: 'ALL PRODUCTS', slug: 'all-products' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const pathname = usePathname();
  const router = useRouter();

  const cartItems = useCartStore((s) => s.items);
  const openCart = useCartStore((s) => s.openCart);
  const cartCount = getCartCount(cartItems);
  const wishlistCount = useWishlistStore((s) => s.items.length);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="flex h-16 lg:h-[68px] items-center justify-between gap-4">
            
            {/* Mobile Hamburger */}
            <button
              className="lg:hidden p-2 -ml-2 text-neutral-800"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Original Brand Logo */}
            <Link href="/" className="flex items-center gap-2 select-none group flex-shrink-0">
              <div className="flex flex-col leading-none">
                <span
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-[-0.08em] text-transparent bg-clip-text bg-gradient-to-b from-black via-neutral-700 to-black transition-all duration-300 group-hover:opacity-80"
                  style={{ fontFamily: 'Bodoni MT, Didot, Times New Roman, serif' }}
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

            {/* Horizontal Text Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center px-4">
              {topNavItems.map((item) => (
                <div
                  key={item.slug}
                  className="relative py-5"
                  onMouseEnter={() => {
                    if (item.slug === 'supreme-edition' || item.slug === 'epic-thread') {
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

            {/* Inline Search Bar & Right Action Icons */}
            <div className="flex items-center gap-3 xl:gap-4">
              <form onSubmit={handleSearchSubmit} className="hidden md:block relative w-44">
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

              {/* Account Link */}
              <Link
                href="/profile"
                className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors hidden sm:block text-neutral-700"
                aria-label="Account"
              >
                <User className="h-5 w-5" />
              </Link>

              {/* Wishlist Link with Badge */}
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

              {/* Cart Drawer Trigger with Badge */}
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

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {megaOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 w-full bg-white border-b border-neutral-200 shadow-xl py-6 z-50 hidden lg:block"
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={() => setMegaOpen(false)}
            >
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-4 gap-8">
                {megaMenu.map((col) => (
                  <div key={col.slug}>
                    <Link href={`/shop?category=${col.slug}`} className="block mb-2">
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

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 lg:hidden overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                  <span
                    className="font-bold text-xl uppercase tracking-tight"
                    style={{ fontFamily: 'Bodoni MT, Didot, Times New Roman, serif' }}
                  >
                    ARDENBY
                  </span>
                  <button onClick={() => setMobileOpen(false)} className="p-1 text-neutral-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Search Input */}
                <div className="p-4 border-b border-neutral-100">
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder='Search "T-shirt"'
                      className="w-full pl-3 pr-8 py-2 text-xs bg-neutral-50 rounded-md border border-purple-300 focus:outline-none"
                    />
                    <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-600">
                      <Search className="h-4 w-4" />
                    </button>
                  </form>
                </div>

                {/* Mobile Category Links */}
                <div className="p-4 space-y-1">
                  {topNavItems.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/shop?category=${item.slug}`}
                      className="block py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-800 hover:text-[#1A80E6]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Footer Links */}
              <div className="p-4 border-t border-neutral-200 bg-neutral-50 space-y-2">
                <Link href="/wishlist" className="block text-xs font-semibold text-neutral-700">
                  Wishlist ({wishlistCount})
                </Link>
                <Link href="/profile" className="block text-xs font-semibold text-neutral-700">
                  My Profile
                </Link>
                <Link href="/orders" className="block text-xs font-semibold text-neutral-700">
                  Orders
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}