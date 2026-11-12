'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';

import Link from 'next/link';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, User, X } from 'lucide-react';

import { SafeImage } from '@/components/home/ui/SafeImage';
import { categoryImage, PRODUCT_FALLBACK_IMAGE } from '@/components/home/home-assets';
import { useHomeProducts } from '@/hooks/use-home-products';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

import { KovenikBrand } from './kovenik-brand';
import type { UserProfile } from './navbar';
import { HAS_SOCIAL_LINKS, SocialLinks } from './social-links';

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

type TabKey = 'top' | 'bottom' | 'plus';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'top', label: 'Top Wear' },
  { key: 'bottom', label: 'Bottom Wear' },
  { key: 'plus', label: 'Plus Size' },
];

/* Collection cards (swipe row). Images are the existing category photos. */
const COLLECTIONS = [
  { label: 'Supreme Edition', href: '/shop?category=supreme-edition', image: categoryImage('supreme-edition') },
  { label: 'Epic Thread', href: '/shop?category=epic-thread', image: categoryImage('epic-thread') },
  { label: 'Kovenik Premium', href: '/shop?category=ardenby-premium', image: categoryImage('ardenby-premium') },
  { label: 'The Print Club', href: '/shop?category=the-print-club', image: categoryImage('the-print-club') },
  { label: 'Best Sellers', href: '/shop?collection=bestSeller', image: categoryImage('all-products') },
];

/* Category tiles. `match` picks a real product photo; `fallback` is the existing category photo. */
const CATEGORY_TILES = [
  { id: 'oversized', label: 'Oversized Tees', href: '/shop?fit=Oversized', fallback: categoryImage('supreme-edition'), match: (p: Product) => p.fit === 'Oversized' },
  { id: 'graphic', label: 'Graphic Tees', href: '/shop?category=epic-thread', fallback: categoryImage('epic-thread'), match: (p: Product) => p.category === 'epic-thread' || /graphic|printed|dtf/i.test(p.tags.join(' ')) },
  { id: 'shirts', label: 'Shirts', href: '/shop?category=top-wear', fallback: categoryImage('top-wear'), match: (p: Product) => /\bshirt\b/i.test(p.name.replace(/t-?shirt/gi, '')) },
  { id: 'hoodies', label: 'Hoodies', href: '/shop?fit=Hoodie', fallback: categoryImage('ardenby-premium'), match: (p: Product) => p.fit === 'Hoodie' || /hoodie|sweatshirt/i.test(p.name) },
  { id: 'bottom', label: 'Bottom Wear', href: '/shop?category=bottom-wear', fallback: categoryImage('bottom-wear'), match: (p: Product) => p.category === 'bottom-wear' },
  { id: 'plus', label: 'Plus Size', href: '/shop?category=plus-size', fallback: categoryImage('plus-size'), match: (p: Product) => p.sizes.includes('XXL') },
  { id: 'all', label: 'All Products', href: '/shop', fallback: categoryImage('all-products'), match: () => true },
] as const;

/* Which tiles lead for each tab (all seven stay available). */
const TAB_ORDER: Record<TabKey, string[]> = {
  top: ['oversized', 'graphic', 'shirts', 'hoodies', 'bottom', 'plus', 'all'],
  bottom: ['bottom', 'all', 'oversized', 'graphic', 'shirts', 'hoodies', 'plus'],
  plus: ['plus', 'oversized', 'graphic', 'shirts', 'hoodies', 'bottom', 'all'],
};

const TOP_LINKS = [
  { label: 'Oversized Tees', href: '/shop?fit=Oversized' },
  { label: 'Graphic Tees', href: '/shop?category=epic-thread' },
  { label: 'Shirts', href: '/shop?category=top-wear' },
  { label: 'Hoodies', href: '/shop?fit=Hoodie' },
  { label: 'View all Top Wear', href: '/shop?category=top-wear' },
];

const BOTTOM_LINKS = [{ label: 'View all Bottom Wear', href: '/shop?category=bottom-wear' }];

const QUICK_LINKS = [
  { label: 'Track Order', href: '/orders' },
  { label: 'My Orders', href: '/orders' },
  { label: 'Wishlist', href: '/wishlist', badge: true },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Returns & Refunds', href: '/returns' },
] as const;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const LINK_ROW =
  'flex min-h-[48px] items-center text-[16px] font-medium text-kv-ink hover:text-kv-gold-text';

function Accordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = `drawer-acc-${title.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <section className="border-b border-kv-line">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={id}
          className="flex min-h-[56px] w-full items-center justify-between px-5 text-left text-[20px] font-bold text-kv-ink"
        >
          {title}
          <ChevronDown className={cn('h-6 w-6 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </button>
      </h3>
      <div id={id} hidden={!open} className="px-5 pb-5">
        {children}
      </div>
    </section>
  );
}

export function NavbarMobileDrawer({
  mobileOpen,
  setMobileOpen,
  wishlistCount,
  handleOpenProfile,
  user,
}: NavbarMobileDrawerProps) {
  const [tab, setTab] = useState<TabKey>('top');
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<HTMLUListElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const { products } = useHomeProducts();

  const close = useCallback(() => setMobileOpen(false), [setMobileOpen]);

  /* Scroll lock, focus in, and focus back on the hamburger when it closes. */
  useEffect(() => {
    if (!mobileOpen) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }, 50);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus();
    };
  }, [mobileOpen]);

  /* ESC closes. */
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen, close]);

  /* Keep Tab inside the drawer. */
  const trapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const nodes = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
      (n) => n.offsetParent !== null
    );
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  /* Pagination dots follow the swipe row. */
  const updatePages = useCallback(() => {
    const el = cardsRef.current;
    if (!el) return;
    setPages(Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth - 0.05)));
    setPage(Math.round(el.scrollLeft / el.clientWidth));
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const t = window.setTimeout(updatePages, 150);
    return () => window.clearTimeout(t);
  }, [mobileOpen, updatePages]);

  // Each tile prefers a product no earlier tile used, so the photos don't repeat.
  const tiles = useMemo(() => {
    const used = new Set<string>();
    return TAB_ORDER[tab].map((id) => {
      const def = CATEGORY_TILES.find((t) => t.id === id)!;
      const matches = def.id === 'all' ? [] : products.filter((p) => def.match(p) && p.images?.[0]);
      const product = matches.find((p) => !used.has(p.id));
      if (product) used.add(product.id);
      return { ...def, image: product?.images[0] || def.fallback };
    });
  }, [tab, products]);

  const bestSellerImage = products.find((p) => p.bestSeller && p.images?.[0])?.images[0];
  const firstName = user?.fullName?.trim().split(/\s+/)[0];

  const openProfile = () => {
    close();
    handleOpenProfile();
  };

  return (
    <AnimatePresence>
      {mobileOpen && (
        <div className="fixed inset-0 z-[9900]">
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            aria-hidden="true"
            className="absolute inset-0 bg-black/50"
          />

          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            onKeyDown={trapTab}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="kv-flat kv-thin-scroll absolute inset-y-0 left-0 flex w-[88vw] max-w-[420px] flex-col overflow-y-auto bg-kv-bg md:w-[440px] md:max-w-none"
          >
            {/* a) header row */}
            <div className="relative flex flex-wrap items-center justify-between gap-3 p-5 pr-[68px]">
              <Link href="/" onClick={close} aria-label="Kovenik home" className="shrink-0">
                <KovenikBrand variant="bust" className="h-[37px] w-[118px]" bearClassName="h-[56px]" />
              </Link>

              {user ? (
                <button
                  type="button"
                  onClick={openProfile}
                  className="flex min-h-[48px] items-center gap-2 text-[16px] font-bold text-kv-ink"
                >
                  Hi, {firstName}
                  <User className="h-6 w-6" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openProfile}
                  className="min-h-[48px] border-[1.5px] border-kv-ink px-5 text-[16px] font-semibold text-kv-ink transition-colors hover:bg-kv-ink hover:text-white"
                >
                  LOG IN / REGISTER
                </button>
              )}

              <button
                type="button"
                data-autofocus
                onClick={close}
                aria-label="Close menu"
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center text-kv-ink"
              >
                <X className="h-7 w-7" strokeWidth={1.8} />
              </button>
            </div>

            {/* b) offer strip */}
            <p className="rounded-b-[16px] bg-kv-gold px-4 py-3 text-center text-[15px] font-bold leading-5 text-white">
              Get 10% off your first order — join the inner circle
            </p>

            {/* c) tabs */}
            <div role="tablist" aria-label="Departments" className="flex justify-evenly border-b border-kv-line px-2">
              {TABS.map((t) => {
                const active = t.key === tab;
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      'relative min-h-[56px] whitespace-nowrap px-1 font-oswald text-[18px] font-semibold uppercase tracking-[0.03em]',
                      active ? 'text-kv-ink' : 'text-[#757575]'
                    )}
                  >
                    {t.label}
                    {active && <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-[3px] bg-kv-gold" />}
                  </button>
                );
              })}
            </div>

            {/* d) collection cards */}
            <div className="px-5 pb-1 pt-5">
              <ul
                ref={cardsRef}
                onScroll={updatePages}
                aria-label="Collections"
                className="kv-rail -mx-5 flex gap-4 overflow-x-auto px-5"
              >
                {COLLECTIONS.map((c) => (
                  <li key={c.label} className="w-[110px] shrink-0">
                    <Link href={c.href} onClick={close} className="block">
                      <span className="relative block h-[110px] w-[110px] overflow-hidden rounded-[8px] bg-kv-img">
                        <SafeImage
                          src={c.label === 'Best Sellers' && bestSellerImage ? bestSellerImage : c.image}
                          fallback={PRODUCT_FALLBACK_IMAGE}
                          alt=""
                          fill
                          sizes="110px"
                          className="object-cover object-top"
                        />
                      </span>
                      <span className="mt-2 block text-[14px] font-bold leading-[1.25] text-kv-ink">{c.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {pages > 1 && (
                <div className="mt-3 flex items-center justify-center" role="group" aria-label="Collection pages">
                  {Array.from({ length: pages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Page ${i + 1} of ${pages}`}
                      aria-current={i === page}
                      onClick={() =>
                        cardsRef.current?.scrollTo({ left: i * cardsRef.current.clientWidth, behavior: 'smooth' })
                      }
                      className="flex h-6 w-6 items-center justify-center"
                    >
                      <span className={cn('block h-2 w-2 rounded-full', i === page ? 'bg-kv-ink' : 'bg-kv-line')} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* e) Shop All accordion */}
            <div className="mt-2 border-t border-kv-line">
              <Accordion title="Shop All" defaultOpen>
                <button
                  type="button"
                  onClick={() => setCategoriesOpen((v) => !v)}
                  aria-expanded={categoriesOpen}
                  className="flex min-h-[48px] w-full items-center justify-between text-left text-[17px] font-semibold text-kv-ink"
                >
                  Categories
                  <ChevronDown
                    className={cn('h-5 w-5 transition-transform', categoriesOpen && 'rotate-180')}
                    aria-hidden="true"
                  />
                </button>
                {categoriesOpen && (
                  <ul className="mt-2 grid grid-cols-3 gap-x-3 gap-y-5">
                    {tiles.map((t) => (
                      <li key={t.id}>
                        <Link href={t.href} onClick={close} className="block">
                          <span className="relative block aspect-[3/4] overflow-hidden rounded-[6px] bg-kv-img">
                            <SafeImage
                              src={t.image}
                              fallback={t.fallback}
                              alt=""
                              fill
                              sizes="120px"
                              className="object-cover object-top"
                            />
                          </span>
                          <span className="mt-2 block text-[14px] font-semibold leading-[1.25] text-kv-ink">
                            {t.label}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Accordion>

              {/* f) more accordions */}
              <Accordion title="Collections">
                <ul>
                  {COLLECTIONS.map((c) => (
                    <li key={c.label}>
                      <Link href={c.href} onClick={close} className={LINK_ROW}>
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Accordion>
              <Accordion title="Top Wear">
                <ul>
                  {TOP_LINKS.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} onClick={close} className={LINK_ROW}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Accordion>
              <Accordion title="Bottom Wear">
                <ul>
                  {BOTTOM_LINKS.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} onClick={close} className={LINK_ROW}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Accordion>
            </div>

            {/* g) quick links */}
            <ul className="mt-2">
              {QUICK_LINKS.map((l) => (
                <li key={l.label} className="border-b border-kv-line">
                  <Link
                    href={l.href}
                    onClick={close}
                    className="flex min-h-[52px] items-center justify-between px-5 text-[16px] font-medium text-kv-ink hover:text-kv-gold-text"
                  >
                    {l.label}
                    {'badge' in l && wishlistCount > 0 && (
                      <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-kv-gold px-1.5 text-[13px] font-bold text-white">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {/* h) follow us */}
            {HAS_SOCIAL_LINKS && (
              <div className="px-5 pb-8 pt-6">
                <p className="mb-3 text-[16px] font-bold text-kv-ink">Follow Us</p>
                <SocialLinks />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
