'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, ShoppingBag, Menu, X, User, ChevronDown } from 'lucide-react';
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

const topLinks = [
  { label: 'Top Wear', slug: 'top-wear' },
  { label: 'Plus Size', slug: 'plus-size' },
  { label: 'Bottom Wear', slug: 'bottom-wear' },
  { label: 'All Products', slug: 'all-products' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  const cartItems = useCartStore((s) => s.items);
  const openCart = useCartStore((s) => s.openCart);
  const cartCount = getCartCount(cartItems);
  const wishlistCount = useWishlistStore((s) => s.items.length);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          scrolled ? 'glass-nav shadow-sm border-b border-border/40' : 'bg-cream border-b border-transparent',
        )}
      >
        <nav className="container-ardenby">
          <div className="flex h-16 lg:h-20 items-center justify-between gap-4">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 -ml-2"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 select-none">
              <span className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-ink">
                ARDENBY
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
              <div
                className="relative"
                onMouseEnter={() => setMegaOpen(true)}
                onMouseLeave={() => setMegaOpen(false)}
              >
                <button className="flex items-center gap-1 text-sm font-medium tracking-wide hover:text-olive transition-colors">
                  Collections
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', megaOpen && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {megaOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[900px] glass-nav rounded-2xl shadow-2xl border border-border/40 p-6"
                    >
                      <div className="grid grid-cols-4 gap-6">
                        {megaMenu.map((col) => (
                          <div key={col.slug}>
                            <Link
                              href={`/shop?category=${col.slug}`}
                              className="block mb-3"
                            >
                              <h3 className="font-display text-base font-bold text-ink hover:text-olive transition-colors">
                                {col.title}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{col.desc}</p>
                            </Link>
                            <div className="space-y-2">
                              {col.featured.map((p) => (
                                <Link
                                  key={p.id}
                                  href={`/product/${p.slug}`}
                                  className="flex items-center gap-2 group"
                                >
                                  <div className="relative w-12 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={p.images[0]}
                                      alt={p.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <span className="text-xs text-ink-soft group-hover:text-olive transition-colors line-clamp-2">
                                    {p.name}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 pt-5 border-t border-border/40 flex gap-6">
                        {topLinks.map((link) => (
                          <Link
                            key={link.slug}
                            href={`/shop?category=${link.slug}`}
                            className="text-sm font-medium text-ink-soft hover:text-olive transition-colors"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {topLinks.map((link) => (
                <Link
                  key={link.slug}
                  href={`/shop?category=${link.slug}`}
                  className="text-sm font-medium tracking-wide hover:text-olive transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
              <Link
                href="/wishlist"
                className="p-2 hover:bg-muted rounded-full transition-colors relative"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-ink text-cream text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                className="p-2 hover:bg-muted rounded-full transition-colors hidden sm:block"
                aria-label="Account"
              >
                <User className="h-5 w-5" />
              </Link>
              <button
                onClick={openCart}
                className="p-2 hover:bg-muted rounded-full transition-colors relative"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-ink text-cream text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-[300px] bg-cream z-50 lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-display text-xl font-bold">ARDENBY</span>
                <button onClick={() => setMobileOpen(false)} className="p-2">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-1">
                <Link href="/shop" className="block py-2.5 text-sm font-medium hover:text-olive">
                  All Products
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/shop?category=${cat.slug}`}
                    className="block py-2.5 text-sm font-medium hover:text-olive"
                  >
                    {cat.name}
                  </Link>
                ))}
                <div className="pt-4 mt-4 border-t border-border space-y-1">
                  <Link href="/wishlist" className="block py-2.5 text-sm font-medium hover:text-olive">
                    Wishlist
                  </Link>
                  <Link href="/profile" className="block py-2.5 text-sm font-medium hover:text-olive">
                    Profile
                  </Link>
                  <Link href="/orders" className="block py-2.5 text-sm font-medium hover:text-olive">
                    Orders
                  </Link>
                  <Link href="/admin" className="block py-2.5 text-sm font-medium hover:text-olive">
                    Admin
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-cream/95 backdrop-blur-md flex items-start justify-center pt-24"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="w-full max-w-2xl px-6"
              onClick={(e) => e.stopPropagation()}
            >
              <form action="/search" className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  name="q"
                  autoFocus
                  placeholder="Search for tees, hoodies, cargos..."
                  className="w-full pl-12 pr-4 py-4 text-lg bg-white rounded-2xl border border-border focus:outline-none focus:ring-2 focus:ring-ink"
                />
              </form>
              <div className="mt-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Popular Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Oversized Tee', 'Hoodie', 'Cargo', 'Graphic', 'Premium', 'Puff Print'].map((tag) => (
                    <Link
                      key={tag}
                      href={`/search?q=${encodeURIComponent(tag)}`}
                      className="px-4 py-2 text-sm bg-white border border-border rounded-full hover:bg-ink hover:text-cream transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
