'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { Suspense, useEffect, useState } from 'react';

import { Heart, Menu, Search, ShoppingCart, User } from 'lucide-react';

import { cn } from '@/lib/utils';

import { KovenikWordmark } from './kovenik-wordmark';
import { NavbarMega } from './navbar-mega';
import type { UserProfile } from './navbar';
import { CATEGORY_LINKS, COLLECTION_LINKS, PRIMARY_LINKS } from './navbar-links';

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

/** Desktop: New In, Collections and Best Sellers sit left of the logo. Shop All and the departments live in the menu. */
const DESKTOP_NAV_KEYS = ['new', 'collections', 'best'];
const desktopLinks = PRIMARY_LINKS.filter((l) => DESKTOP_NAV_KEYS.includes(l.key));

const ICON_BTN =
  'relative flex h-11 w-11 shrink-0 items-center justify-center text-kv-ink transition-colors hover:text-kv-gold-text';
const BADGE =
  'absolute right-0 top-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-kv-gold px-1 text-[12px] font-bold leading-none text-white';

/* Reports ?category= / ?collection=. Isolated in a Suspense boundary so
 * useSearchParams never forces the rest of the app into client rendering. */
function ParamReporter({ onChange }: { onChange: (category: string | null, collection: string | null, sort: string | null) => void }) {
  const params = useSearchParams();
  const category = params.get('category');
  const collection = params.get('collection');
  const sort = params.get('sort');
  useEffect(() => {
    onChange(category, collection, sort);
  }, [category, collection, sort, onChange]);
  return null;
}

export function NavbarHeader({
  setMobileOpen,
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
  const pathname = usePathname() ?? '';
  const [category, setCategory] = useState<string | null>(null);
  const [collection, setCollection] = useState<string | null>(null);
  const [sort, setSort] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const onShop = pathname === '/shop';
  const activeKey = (key: string) => {
    if (!onShop) return false;
    if (key === 'best') return collection === 'bestSeller';
    if (key === 'new') return sort === 'new' && !category;
    if (key === 'shop') return !category && !collection && sort !== 'new';
    return category === key;
  };

  const searchForm = (idSuffix: string) => (
    <form
      onSubmit={handleSearchSubmit}
      role="search"
      className="flex h-12 w-full items-center gap-2 rounded-full border border-kv-ink bg-kv-bg px-4 focus-within:shadow-[0_0_0_1px_#0a0a0a]"
    >
      <input
        id={`site-search-${idSuffix}`}
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="What are you looking for?"
        aria-label="Search KOVENIK"
        className="min-w-0 flex-1 bg-transparent text-[16px] text-kv-ink outline-none focus-visible:!outline-none placeholder:text-kv-sub"
      />
      <button type="submit" aria-label="Search" className="flex h-9 w-9 items-center justify-center text-kv-ink">
        <Search className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </button>
    </form>
  );

  const iconButtons = (withAccount: boolean) => (
    <>
      {withAccount && (
        <button type="button" onClick={handleOpenProfile} aria-label={user ? 'My profile' : 'Login'} className={ICON_BTN}>
          <User className="h-[22px] w-[22px]" strokeWidth={1.6} />
        </button>
      )}
      <Link href="/wishlist" aria-label="Wishlist" className={ICON_BTN}>
        <Heart className="h-[22px] w-[22px]" strokeWidth={1.6} />
        {mounted && wishlistCount > 0 && <span className={BADGE}>{wishlistCount}</span>}
      </Link>
      <button
        type="button"
        onClick={() => {
          closeCart?.();
          openCart();
        }}
        aria-label="Shopping cart"
        className={ICON_BTN}
      >
        <ShoppingCart className="h-[22px] w-[22px]" strokeWidth={1.6} />
        {mounted && cartCount > 0 && <span className={BADGE}>{cartCount}</span>}
      </button>
    </>
  );

  const hamburger = (
    <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu" className={ICON_BTN}>
      <Menu className="h-6 w-6" strokeWidth={1.8} />
    </button>
  );

  const logo = (size: 'sm' | 'md') => (
    <Link href="/" aria-label="Kovenik home" className="block shrink-0">
      <KovenikWordmark size={size} />
    </Link>
  );

  return (
    <>
      <Suspense fallback={null}>
        <ParamReporter
          onChange={(c, col, so) => {
            setCategory(c);
            setCollection(col);
            setSort(so);
          }}
        />
      </Suspense>

      <header className="kv-flat sticky top-0 z-[100] w-full max-w-[100vw] bg-kv-bg shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        {/* ===================== DESKTOP ===================== */}
        <div className="hidden lg:block">
          <div className="kv-gutter grid h-[84px] w-full grid-cols-[1fr_auto_1fr] items-center">
            <div className="flex h-full items-center gap-4 xl:gap-8">
              {hamburger}
              <NavbarMega
                links={desktopLinks}
                isActive={activeKey}
                collectionsActive={onShop && [...COLLECTION_LINKS, ...CATEGORY_LINKS].some((c) => c.slug === category)}
              />
            </div>

            <div className="justify-self-center">
              {logo('md')}
            </div>

            <div className="flex items-center gap-1 justify-self-end">
              <div className="mr-2 w-[170px] xl:mr-3 xl:w-[280px]">{searchForm('d')}</div>
              {iconButtons(true)}
            </div>
          </div>
        </div>

        {/* ===================== MOBILE / TABLET ===================== */}
        <div className="lg:hidden">
          <div className="flex h-14 items-center justify-between pl-1 pr-2">
            <div className="flex min-w-0 items-center">
              {hamburger}
              {logo('sm')}
            </div>
            <div className="flex items-center">
              {iconButtons(false)}
            </div>
          </div>

          <div className="px-4 pb-2">{searchForm('m')}</div>

          <nav aria-label="Departments" className="kv-rail flex overflow-x-auto border-t border-kv-line px-2">
            {PRIMARY_LINKS.filter((l) => l.key !== 'collections').map((link) => {
              const active = activeKey(link.key);
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className="relative flex h-12 shrink-0 items-center px-3.5 font-oswald text-[16px] font-semibold uppercase tracking-[0.06em] text-kv-ink"
                >
                  {link.label}
                  {active && <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-[3px] bg-kv-gold" />}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    </>
  );
}
