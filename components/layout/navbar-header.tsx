'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { Suspense, useEffect, useRef, useState } from 'react';

import { ChevronDown, Heart, Menu, Search, ShoppingCart, User } from 'lucide-react';

import { cn } from '@/lib/utils';

import { HeaderMember } from '@/components/membership/header-member';

import { KovenikBrand } from './kovenik-brand';
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

/** Departments shown left of the logo (desktop). The second row carries the remaining primary links. */
const LEFT_TAB_KEYS = ['top-wear', 'bottom-wear', 'plus-size'];
const leftTabs = PRIMARY_LINKS.filter((l) => LEFT_TAB_KEYS.includes(l.key));
const rowTwoLinks = PRIMARY_LINKS.filter((l) => !LEFT_TAB_KEYS.includes(l.key));

const ICON_BTN =
  'relative flex h-11 w-11 shrink-0 items-center justify-center text-kv-ink transition-colors hover:text-kv-gold-text';
const BADGE =
  'absolute right-0 top-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-kv-gold px-1 text-[12px] font-bold leading-none text-white';

/** "Collections" with a dropdown of the four collections. Opens on hover, focus or click; Esc closes. */
function CollectionsMenu({ activeSlug }: { activeSlug: string | null }) {
  // Opens on hover; a click pins it open (so hovering first and then clicking the arrow no longer closes it).
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hover || pinned;
  const setOpen = (v: boolean) => {
    setHover(v);
    if (!v) setPinned(false);
  };
  const wrapRef = useRef<HTMLLIElement>(null);

  // Click anywhere outside closes a pinned menu.
  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [pinned]);
  const active = [...COLLECTION_LINKS, ...CATEGORY_LINKS].some((c) => c.slug === activeSlug);

  return (
    <li
      ref={wrapRef}
      className="relative h-full"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="collections-menu"
        onClick={() => (pinned ? setOpen(false) : setPinned(true))}
        className="relative flex h-full items-center gap-1 whitespace-nowrap text-[16px] font-bold uppercase tracking-[0.08em] text-kv-ink transition-colors duration-200 hover:text-kv-gold-text xl:text-[17px]"
      >
        Collections
        <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
        {active && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-kv-gold" />}
      </button>
      <div
        id="collections-menu"
        aria-hidden={!open}
        className={cn(
          'absolute left-1/2 top-full z-50 w-[460px] -translate-x-1/2 grid-cols-2 gap-x-2 border border-kv-line bg-kv-bg px-3 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
          open ? 'grid' : 'hidden'
        )}
      >
        {[
          { title: 'Collections', items: COLLECTION_LINKS },
          { title: 'Categories', items: CATEGORY_LINKS },
        ].map((group) => (
          <div key={group.title} className="px-2">
            <p className="mb-1 border-b border-kv-line px-3 pb-2 text-[12px] font-bold uppercase tracking-[0.2em] text-kv-gold-text">
              {group.title}
            </p>
            <ul>
              {group.items.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={c.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[44px] items-center px-3 text-[14px] font-bold uppercase tracking-[0.08em] text-kv-ink transition-colors duration-200 hover:bg-kv-band hover:text-kv-gold-text"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </li>
  );
}

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
      className="flex h-12 w-full items-center gap-2 rounded-full border border-kv-line bg-kv-bg px-4 focus-within:border-kv-ink"
    >
      <input
        id={`site-search-${idSuffix}`}
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="What are you looking for?"
        aria-label="Search KOVENIK"
        className="min-w-0 flex-1 bg-transparent text-[16px] text-kv-ink outline-none placeholder:text-kv-sub"
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

  const logo = (cls: string, bearCls: string, badgeCls: string) => (
    <div className="relative shrink-0">
      <Link href="/" aria-label="Kovenik home" className="block">
        <KovenikBrand variant="bust" className={cls} bearClassName={bearCls} />
      </Link>
      <HeaderMember className={badgeCls} />
    </div>
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
              <nav aria-label="Departments" className="flex h-full items-center gap-5 xl:gap-9">
                {leftTabs.map((tab) => {
                  const active = onShop && category === tab.key;
                  return (
                    <Link
                      key={tab.key}
                      href={tab.href}
                      aria-current={active ? 'page' : undefined}
                      className="relative flex h-full items-center font-oswald text-[19px] font-semibold uppercase tracking-[0.05em] text-kv-ink transition-colors duration-200 hover:text-kv-gold-text xl:text-[21px] xl:tracking-[0.08em]"
                    >
                      {tab.label}
                      {active && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-kv-gold" />}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="justify-self-center">
              {logo('h-[46px] w-[131px]', '-my-1 h-[80px] translate-y-[2px]', '')}
            </div>

            <div className="flex items-center gap-1 justify-self-end">
              <div className="mr-2 w-[170px] xl:mr-3 xl:w-[300px]">{searchForm('d')}</div>
              {iconButtons(true)}
            </div>
          </div>

          <nav aria-label="Primary" className="border-t border-kv-line">
            <ul className="kv-gutter flex h-14 w-full items-center justify-center gap-8 xl:gap-14">
              {rowTwoLinks.map((link) => {
                if (link.key === 'collections') {
                  return <CollectionsMenu key={link.key} activeSlug={onShop ? category : null} />;
                }
                const active = activeKey(link.key);
                return (
                  <li key={link.key} className="h-full">
                    <Link
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className="relative flex h-full items-center whitespace-nowrap text-[16px] font-bold uppercase tracking-[0.08em] text-kv-ink transition-colors duration-200 hover:text-kv-gold-text xl:text-[17px]"
                    >
                      {link.label}
                      {active && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-kv-gold" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* ===================== MOBILE / TABLET ===================== */}
        <div className="lg:hidden">
          <div className="flex h-14 items-center justify-between pl-1 pr-2">
            <div className="flex min-w-0 items-center">
              {hamburger}
              {logo('h-[32px] w-[91px]', '-my-1 h-[55px] translate-y-[2px]', '')}
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
