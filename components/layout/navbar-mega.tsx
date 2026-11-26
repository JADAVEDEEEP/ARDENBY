'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import Link from 'next/link';

import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import { categoryImage, PRODUCT_FALLBACK_IMAGE } from '@/components/home/home-assets';
import { SafeImage } from '@/components/home/ui/SafeImage';
import { inCategory } from '@/components/shop/shop-filters';
import { useHomeProducts } from '@/hooks/use-home-products';
import { formatINR } from '@/lib/format';
import { interleaveNewCollection, isNewCollection, prioritizeNewCollection } from '@/lib/new-collection';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

import { CATEGORY_LINKS, COLLECTION_LINKS } from './navbar-links';
import { topNavItems } from './navbar-data';

type PanelKey = 'new' | 'best' | 'collections';
type NavLink = { label: string; href: string; key: string };

type NavbarMegaProps = {
  links: readonly NavLink[];
  /** Whether a plain link (shop, new, best) is the current page. */
  isActive: (key: string) => boolean;
  /** True when a category / collection page is showing, so "Collections" can carry the underline. */
  collectionsActive: boolean;
};

const CLOSE_DELAY_MS = 140;
const MAX_ITEMS = 12;

const PANELS: Record<PanelKey, { eyebrow: string; title: string; blurb: string; cta: string; href: string }> = {
  new: {
    eyebrow: 'Just landed',
    title: 'New In',
    blurb: 'The latest drops, fresh off the press. Be first to wear them.',
    cta: 'Shop new in',
    href: '/shop?sort=new',
  },
  best: {
    eyebrow: 'Most loved',
    title: 'Best Sellers',
    blurb: 'The pieces our customers keep coming back for.',
    cta: 'Shop best sellers',
    href: '/shop?collection=bestSeller',
  },
  collections: {
    eyebrow: 'Curated edits',
    title: 'Collections',
    blurb: 'Pick a world. Heavyweight drops, bold graphics, quiet essentials.',
    cta: 'Browse everything',
    href: '/shop',
  },
};

/* ------------------------------------------------------------------ slider */

/** Horizontal scroll-snap rail with prev / next arrows that only show when there is more to reveal. */
function Rail({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const next = {
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    };
    // Only re-render when an edge actually flips (this runs on every scroll event).
    setEdge((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
    // Mark cards that are only partly in view so their captions can fade instead of being cut mid-word.
    const box = el.getBoundingClientRect();
    Array.from(el.children).forEach((child) => {
      const r = (child as HTMLElement).getBoundingClientRect();
      const clipped = r.left < box.left - 2 || r.right > box.right + 2;
      (child as HTMLElement).dataset.clipped = clipped ? 'true' : 'false';
    });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, children]);

  const step = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  const ARROW =
    'absolute top-[38%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-kv-ink shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition hover:bg-kv-ink hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kv-ink';

  return (
    <div className="relative min-w-0 flex-1">
      <ul
        ref={ref}
        onScroll={measure}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            step(1);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            step(-1);
          }
        }}
        aria-label={label}
        className="kv-rail -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-1"
      >
        {children}
      </ul>
      {!edge.start && (
        <button type="button" aria-label={`Previous ${label}`} onClick={() => step(-1)} className={cn(ARROW, '-left-3')}>
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {!edge.end && (
        <button type="button" aria-label={`Next ${label}`} onClick={() => step(1)} className={cn(ARROW, '-right-3')}>
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
      {/* soft fade so cut-off cards read as "more to come" */}
      {!edge.end && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-kv-bg to-transparent"
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- cards */

function ProductCard({ product, tag, onNavigate }: { product: Product; tag: string; onNavigate: () => void }) {
  const discount = product.mrp > product.price;
  return (
    <li className="w-[150px] shrink-0 snap-start xl:w-[168px]">
      <Link href={`/product/${product.slug}`} onClick={onNavigate} className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kv-ink">
        <span className="relative block aspect-[3/4] overflow-hidden rounded-2xl bg-kv-img shadow-[0_4px_14px_rgba(0,0,0,0.1)]">
          <SafeImage
            src={product.images[0]}
            fallback={PRODUCT_FALLBACK_IMAGE}
            alt={product.name}
            fill
            sizes="170px"
            className="object-cover object-top transition duration-500 group-hover:scale-[1.06]"
          />
          <span className="absolute left-2 top-2 rounded-full bg-kv-ink px-2.5 py-1 text-[11px] font-bold uppercase leading-none tracking-[0.12em] text-white">
            {tag}
          </span>
          <span
            aria-hidden="true"
            className="absolute inset-x-2 bottom-2 translate-y-[140%] rounded-full bg-kv-ink/90 py-2 text-center text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-transform duration-300 group-hover:translate-y-0"
          >
            View
          </span>
        </span>
        <span className="mt-2 block truncate text-[14px] font-bold text-kv-ink group-hover:text-kv-gold-text">
          {product.name}
        </span>
        <span className="mt-0.5 flex items-baseline gap-2 text-[14px]">
          <span className="font-bold text-kv-ink">{formatINR(product.price)}</span>
          {discount && <span className="text-[12px] text-kv-sub line-through">{formatINR(product.mrp)}</span>}
        </span>
      </Link>
    </li>
  );
}

type Tile = { slug: string; label: string; desc: string; href: string; image: string; count: number };

function CollectionTile({ tile, onNavigate }: { tile: Tile; onNavigate: () => void }) {
  return (
    <li className="w-[176px] shrink-0 snap-start xl:w-[196px]">
      <Link
        href={tile.href}
        onClick={onNavigate}
        className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-kv-ink shadow-[0_6px_18px_rgba(0,0,0,0.12)] transition-shadow duration-300 hover:shadow-[0_12px_28px_rgba(0,0,0,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kv-ink"
      >
        <SafeImage
          src={tile.image}
          fallback={categoryImage(tile.slug)}
          alt=""
          fill
          sizes="196px"
          className="object-cover object-top transition duration-500 group-hover:scale-[1.06]"
        />
        {/* Soft bottom-to-top shade keeps the white caption readable on light and dark photos alike. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-t from-black/90 via-black/70 to-transparent"
        />
        {/* A card that is only partly in the slider (data-clipped, set by Rail) fades its caption out until it slides fully in. */}
        <span className="absolute inset-x-3 bottom-3 text-white transition-opacity duration-200 [li[data-clipped=true]_&]:opacity-0">
          <span className="block font-oswald text-[19px] font-semibold uppercase leading-tight tracking-[0.05em] text-white">
            {tile.label}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-white/90">{tile.desc}</span>
          <span className="mt-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-kv-gold-dark">
            {tile.count > 0 ? `${tile.count} ${tile.count === 1 ? 'style' : 'styles'}` : 'Explore'}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </span>
      </Link>
    </li>
  );
}

function Skeletons() {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} aria-hidden="true" className="w-[150px] shrink-0 xl:w-[168px]">
          <div className="aspect-[3/4] animate-pulse rounded-2xl bg-kv-img" />
          <div className="mt-2 h-3 w-4/5 animate-pulse bg-kv-img" />
          <div className="mt-1.5 h-3 w-1/3 animate-pulse bg-kv-img" />
        </li>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------- panel */

function Panel({ id, panel, onNavigate, products, loading }: { id: PanelKey; panel: (typeof PANELS)[PanelKey]; onNavigate: () => void; products: Product[]; loading: boolean }) {
  const withImage = useMemo(() => products.filter((p) => p.images?.[0]), [products]);
  // Plus Size tile appears once a Plus Size product exists.
  const plusSize = useMemo(() => inCategory(products, 'plus-size').length > 0, [products]);

  const productList = useMemo(() => {
    // New In = the 34 products of the new catalogue (ard-kvk-*), all of them, in a varied order.
    if (id === 'new') return interleaveNewCollection(withImage.filter(isNewCollection));
    if (id === 'best') return withImage.filter((p) => p.bestSeller).slice(0, MAX_ITEMS);
    return [];
  }, [id, withImage]);

  // Each tile shows a real product photo from its group, avoiding repeats where possible.
  const tiles = useMemo<Tile[]>(() => {
    if (id !== 'collections') return [];
    const used = new Set<string>();
    const groups = [
      ...COLLECTION_LINKS.map((c) => ({ slug: c.slug as string, label: c.label, href: c.href })),
      ...CATEGORY_LINKS.filter((c) => c.slug !== 'all' && (c.slug !== 'plus-size' || plusSize)).map((c) => ({ slug: c.slug as string, label: c.label, href: c.href })),
    ];
    return groups.map((g) => {
      const matches = prioritizeNewCollection(inCategory(withImage, g.slug)) as Product[];
      const pick = matches.find((p) => !used.has(p.id)) ?? matches[0];
      if (pick) used.add(pick.id);
      const meta = topNavItems.find((t) => t.slug === g.slug);
      return {
        slug: g.slug,
        label: g.label,
        desc: meta?.desc ?? '',
        href: g.href,
        image: pick?.images[0] ?? categoryImage(g.slug),
        count: matches.length,
      };
    });
  }, [id, withImage, plusSize]);

  const tag = id === 'best' ? 'Bestseller' : 'New';
  const empty = !loading && id !== 'collections' && productList.length === 0;

  return (
    <div className="kv-gutter flex w-full items-stretch gap-8 py-7 xl:gap-12">
      <div className="flex w-[220px] shrink-0 flex-col justify-between border-r border-kv-line pr-8 xl:w-[260px]">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-kv-gold-text">{panel.eyebrow}</p>
          <p className="mt-2 font-oswald text-[29px] font-bold uppercase leading-none tracking-[0.03em] text-kv-ink xl:text-[34px]">
            {panel.title}
          </p>
          <span aria-hidden="true" className="mt-4 block h-[3px] w-12 bg-kv-gold" />
          <p className="mt-4 text-[14px] leading-[1.6] text-kv-sub">{panel.blurb}</p>
        </div>
        <Link
          href={panel.href}
          onClick={onNavigate}
          className="group mt-6 inline-flex min-h-[46px] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-kv-ink px-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kv-ink xl:px-6 xl:text-[13px] xl:tracking-[0.12em]"
        >
          {panel.cta}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>

      {empty ? (
        <p className="self-center text-[14px] text-kv-sub">Nothing here right now. Check back soon.</p>
      ) : (
        <Rail label={panel.title}>
          {loading && <Skeletons />}
          {!loading && id !== 'collections' && productList.map((p) => <ProductCard key={p.id} product={p} tag={tag} onNavigate={onNavigate} />)}
          {!loading && id === 'collections' && tiles.map((t) => <CollectionTile key={t.slug} tile={t} onNavigate={onNavigate} />)}
        </Rail>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ the nav */

/**
 * Desktop nav left of the logo (panels anchor to the sticky header). "New In", "Best Sellers" and "Collections" open a full-width panel with an
 * image slider; "Shop All" stays a plain link. Opens on hover or focus, a click pins it, Esc closes.
 */
export function NavbarMega({ links, isActive, collectionsActive }: NavbarMegaProps) {
  const [open, setOpen] = useState<PanelKey | null>(null);
  const [pinned, setPinned] = useState(false);
  const [visited, setVisited] = useState<Set<PanelKey>>(() => new Set());
  const navRef = useRef<HTMLElement>(null);
  const timer = useRef<number | null>(null);
  const { products, loading } = useHomeProducts();

  const cancelClose = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  const close = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setOpen(null);
    setPinned(false);
  }, []);
  const show = (key: PanelKey) => {
    cancelClose();
    setOpen(key);
    // Panels build their images on first open only, so closed ones cost nothing.
    setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  };
  const scheduleClose = () => {
    if (pinned) return;
    cancelClose();
    timer.current = window.setTimeout(close, CLOSE_DELAY_MS);
  };

  useEffect(() => () => cancelClose(), []);

  // Esc closes an open panel even when focus is not inside the nav (e.g. it was opened by hover).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Once the product feed is in, build every panel while the browser is idle so the first open
  // shows images that are already loading/cached instead of blank cards.
  useEffect(() => {
    if (loading) return;
    const warm = () => setVisited(new Set<PanelKey>(['new', 'best', 'collections']));
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(warm);
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(warm, 1200);
    return () => window.clearTimeout(id);
  }, [loading]);

  // A click outside closes a pinned panel.
  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [pinned, close]);

  const TRIGGER =
    'relative flex h-full items-center gap-1 whitespace-nowrap text-[14px] font-extrabold uppercase tracking-[0.03em] text-kv-ink transition-colors duration-200 hover:text-kv-gold-text xl:text-[16px] 2xl:text-[17px]';

  const underline = <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-[#d92b2b]" />;

  return (
    <nav
      ref={navRef}
      aria-label="Primary"
      className="h-full"
      onMouseLeave={scheduleClose}
      onBlur={(e) => {
        if (!navRef.current?.contains(e.relatedTarget as Node | null)) close();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
      }}
    >
      <ul className="flex h-full items-center gap-2 min-[1100px]:gap-3 xl:gap-5 2xl:gap-6">
        {links.map((link) => {
          if (link.key === 'collections') {
            const isOpen = open === 'collections';
            return (
              <li key={link.key} className="h-full" onMouseEnter={() => show('collections')} onFocus={() => show('collections')}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls="mega-collections"
                  onClick={() => (isOpen && pinned ? close() : (show('collections'), setPinned(true)))}
                  className={cn(TRIGGER, isOpen && 'text-kv-gold-text')}
                >
                  Collections
                  <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')} aria-hidden="true" />
                  {collectionsActive && underline}
                </button>
              </li>
            );
          }

          const panelKey: PanelKey | null = link.key === 'new' ? 'new' : link.key === 'best' ? 'best' : null;
          const active = isActive(link.key);
          const isOpen = panelKey !== null && open === panelKey;
          return (
            <li
              key={link.key}
              className="h-full"
              onMouseEnter={() => (panelKey ? show(panelKey) : close())}
              onFocus={() => (panelKey ? show(panelKey) : close())}
            >
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                aria-expanded={panelKey ? isOpen : undefined}
                aria-controls={panelKey ? `mega-${panelKey}` : undefined}
                onClick={close}
                className={cn(TRIGGER, isOpen && 'text-kv-gold-text')}
              >
                {link.label}
                {panelKey && <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')} aria-hidden="true" />}
                {active && underline}
              </Link>
            </li>
          );
        })}
      </ul>

      {(Object.keys(PANELS) as PanelKey[]).map((key) => {
        const isOpen = open === key;
        return (
          <div
            key={key}
            id={`mega-${key}`}
            aria-hidden={!isOpen}
            onMouseEnter={cancelClose}
            className={cn(
              'absolute inset-x-0 top-full z-50 rounded-b-[28px] border-t-2 border-kv-gold bg-kv-bg shadow-[0_18px_40px_rgba(0,0,0,0.14)] transition duration-200 ease-out motion-reduce:transition-none',
              isOpen ? 'visible translate-y-0 opacity-100' : 'invisible pointer-events-none -translate-y-2 opacity-0'
            )}
          >
            {visited.has(key) && <Panel id={key} panel={PANELS[key]} onNavigate={close} products={products} loading={loading} />}
          </div>
        );
      })}
    </nav>
  );
}
