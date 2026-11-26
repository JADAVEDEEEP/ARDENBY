'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import Link from 'next/link';

import { useBanners } from '@/hooks/use-banners';
import { useCategories } from '@/hooks/use-categories';
import { isSafeBannerLink, type PublicBanner } from '@/lib/banner-api';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

import { withHeroArt } from './hero-banner-assets';
import { SafeImage } from './ui/SafeImage';

/**
 * Full-width hero. Layers, back to front:
 *   banner background -> edge gradients -> giant KOVENIK word -> transparent model cut-out -> content.
 * The word and the text overlay only appear for banners that have a model cut-out (`modelImageUrl`).
 * Banners without one are shown exactly as uploaded (their art already carries its own text), as a clickable image.
 *
 * Layout: from 1024px the stage fills the screen under the announcement bar + header (see `.kv-hero-stage` in
 * globals.css) with the text on the left and the collection cards bottom-right. Below 1024px the stage is just the
 * picture and the text, button and cards stack underneath, so nothing overlaps the model.
 */

const LAYERED_HERO = true;
const SLIDE_MS = 6000;
const SWIPE_PX = 50;
const RED = '#ff3b3b';
const BUTTON_RED = '#c91f26';
/** One corner style for the button, the collection cards and the header search bar (`--kv-radius`, globals.css). */
const RADIUS = 'rounded-[var(--kv-radius)]';

/** Shown while there is nothing to rotate (no live banners, or the API is down). */
const FALLBACK = { image: '/images/hero-black-tee.jpg', alt: 'Model wearing a KOVENIK black oversized graphic tee' };

/** The three collections shown as cards. Names come from the categories API; images from each collection's products. */
const CARD_SLUGS = ['apex-edition', 'epic-thread', 'ardenby-premium'] as const;

/** Whole image visible (never cropped, head included); the sides are filled by a blurred copy of the same photo. */
const IMG_POS = 'object-contain object-center';
/** Layered slides: background and model share one box (full height, natural width, centred) so they line up exactly. */
const LAYER = 'absolute bottom-0 left-1/2 h-[94%] w-auto max-w-none -translate-x-1/2 lg:h-[88%]';
/** Viewports below this width get the picture-only stage (matches Tailwind `lg`). */
const STACKED_QUERY = '(max-width: 1023px)';

interface HeroCarouselProps {
  /** Live products from the API (used only to pick each collection card's image). */
  products: Product[];
  loading?: boolean;
}

type Card = { slug: string; name: string; image: string | null; alt: string };

function splitTitle(title: string) {
  const words = title.trim().split(/\s+/);
  return { first: words[0] ?? '', rest: words.slice(1).join(' ') };
}

function CardSkeleton() {
  return (
    <li aria-hidden="true">
      <div className={cn('aspect-[3/4] w-full animate-pulse bg-white/10', RADIUS)} />
      <div className="mx-auto mt-2 h-3 w-3/4 animate-pulse rounded-sm bg-white/10" />
    </li>
  );
}

/** Three equal cards (same ratio, size and crop). Each is a link with hover and keyboard-focus states. */
function CollectionCards({ cards, loading }: { cards: Card[]; loading: boolean }) {
  if (!loading && cards.length === 0) {
    // Categories API empty or down: still give the visitor a way into the shop.
    return (
      <Link
        href="/shop"
        className={cn(
          'inline-flex min-h-[44px] items-center justify-center border border-white/40 px-5 text-[13px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
          RADIUS
        )}
      >
        Shop all products
      </Link>
    );
  }
  return (
    <ul className="grid grid-cols-3 gap-2 md:gap-3 lg:gap-2">
      {loading
        ? CARD_SLUGS.map((slug) => <CardSkeleton key={slug} />)
        : cards.map((card) => (
            <li key={card.slug} className="min-w-0">
              <Link
                href={`/shop?category=${card.slug}`}
                aria-label={`Shop ${card.name}`}
                className="group block outline-none"
              >
                <span
                  className={cn(
                    'relative block aspect-[3/4] w-full overflow-hidden bg-white/10 ring-1 ring-white/15 transition duration-200 motion-reduce:transition-none',
                    'group-hover:ring-white/60 group-focus-visible:ring-2 group-focus-visible:ring-white group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#0a0a0a]',
                    RADIUS
                  )}
                >
                  {card.image && (
                    <SafeImage
                      src={card.image}
                      alt={card.alt}
                      fill
                      loading="lazy"
                      sizes="(min-width: 1024px) 110px, (min-width: 768px) 150px, 30vw"
                      className="object-cover object-top transition duration-300 motion-reduce:transition-none group-hover:scale-105"
                    />
                  )}
                </span>
                <span className="mt-2 line-clamp-2 block break-words text-center text-[11px] font-bold uppercase leading-tight tracking-[0.06em] text-white transition-colors group-hover:text-[#ff3b3b] group-focus-visible:text-[#ff3b3b] md:text-[12px]">
                  {card.name}
                </span>
              </Link>
            </li>
          ))}
    </ul>
  );
}

function HeroButton({ banner, modern, className }: { banner: PublicBanner | null; modern: boolean; className?: string }) {
  const href = banner && isSafeBannerLink(banner.linkUrl) ? banner.linkUrl : '/shop';
  const label = modern && banner?.buttonText ? banner.buttonText : 'Shop now';
  const cls = cn(
    'inline-flex min-h-[48px] max-w-full items-center justify-center px-6 text-center text-[13px] font-bold uppercase leading-tight tracking-[0.1em] text-white transition-colors hover:brightness-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-[14px] sm:tracking-[0.12em]',
    RADIUS,
    className
  );
  const style = { backgroundColor: BUTTON_RED };
  const text = (
    <>
      <span className="line-clamp-2">{label}</span> <span aria-hidden="true" className="ml-2 shrink-0">→</span>
    </>
  );
  if (href.startsWith('/')) {
    return (
      <Link href={href} className={cls} style={style}>
        {text}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style}>
      {text}
    </a>
  );
}

/** Keeps `--kv-top` (announcement bar + header height) equal to the real thing, bar open or closed. */
function useChromeHeight() {
  useEffect(() => {
    const root = document.documentElement;
    const measure = () => {
      const header = document.querySelector<HTMLElement>('header.sticky');
      const bar = document.querySelector<HTMLElement>('[data-kv-bar]');
      if (!header) return;
      const total = Math.round(header.getBoundingClientRect().height + (bar ? bar.getBoundingClientRect().height : 0));
      if (total > 0) root.style.setProperty('--kv-top', `${total}px`);
    };
    measure();
    const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    const header = document.querySelector('header.sticky');
    if (header) resize?.observe(header);
    const bar = document.querySelector('[data-kv-bar]');
    if (bar) resize?.observe(bar);
    // Closing the bar removes it from the page, which a size observer cannot see: watch the flag it sets on <html>.
    const mutation = new MutationObserver(measure);
    mutation.observe(root, { attributes: true, attributeFilter: ['data-bar'] });
    window.addEventListener('resize', measure);
    return () => {
      resize?.disconnect();
      mutation.disconnect();
      window.removeEventListener('resize', measure);
      root.style.removeProperty('--kv-top');
    };
  }, []);
}

export function HeroCarousel({ products, loading = false }: HeroCarouselProps) {
  const { categories, loading: categoriesLoading } = useCategories();
  const { banners: apiBanners, loading: bannersLoading, error, retry } = useBanners();
  useChromeHeight();
  // Layered look (giant KOVENIK word behind a cut-out model) is switched off until proper studio model photos exist.
  // Set to true to bring it back: the cut-outs are in public/images/hero.
  const banners = useMemo(() => (LAYERED_HERO ? apiBanners.map(withHeroArt) : apiBanners), [apiBanners]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [modelFailed, setModelFailed] = useState<Set<string>>(() => new Set());
  const swipe = useRef<{ x: number; moved: boolean } | null>(null);

  // A banner whose background will not load is skipped instead of showing a hole.
  const slides = banners.filter((b) => !failed.has(b.id));
  const count = slides.length;
  const current = count > 0 ? Math.min(index, count - 1) : 0;
  const active = count > 0 ? slides[current] : null;

  const hasModel = (b: PublicBanner) => Boolean(b.modelImageUrl) && !modelFailed.has(b.id);
  const activeModern = active ? hasModel(active) : false;

  // One card per collection: the API's category name + the first real product image in that collection.
  // A collection with no products yet borrows a different real product image, so no two cards repeat a picture.
  const cards = useMemo<Card[]>(() => {
    const withImage = products.filter((p) => p.images?.[0]);
    const used = new Set<string>();
    const own = (slug: string) => withImage.find((p) => p.category === slug);
    CARD_SLUGS.forEach((slug) => {
      const p = own(slug);
      if (p) used.add(p.id);
    });

    return CARD_SLUGS.flatMap((slug) => {
      const category = categories.find((c) => c.slug === slug);
      if (!category) return [];
      let product = own(slug);
      if (!product) {
        product = withImage.find((p) => !used.has(p.id));
        if (product) used.add(product.id);
      }
      return [{ slug, name: category.name, image: product?.images[0] ?? null, alt: product?.name ?? category.name }];
    });
  }, [categories, products]);
  const cardsLoading = loading || categoriesLoading;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const go = useCallback(
    (to: number) => {
      if (count > 0) setIndex(((to % count) + count) % count);
    },
    [count]
  );

  // Re-armed after every slide change, so using a dot restarts the countdown.
  useEffect(() => {
    if (count < 2 || paused || reduceMotion) return;
    const timer = window.setTimeout(() => go(current + 1), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [count, paused, reduceMotion, current, go]);

  // No rotation while the tab is in the background.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const onPointerDown = (event: ReactPointerEvent) => {
    swipe.current = { x: event.clientX, moved: false };
  };
  const onPointerUp = (event: ReactPointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || count < 2) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) >= SWIPE_PX) {
      swipe.current = { x: 0, moved: true };
      go(current + (dx < 0 ? 1 : -1));
    }
  };

  const title = active ? splitTitle(active.title?.trim() || active.name) : { first: '', rest: '' };
  const modelAlt = active ? `KOVENIK ${active.title?.trim() || active.name}: model in KOVENIK streetwear` : '';

  const dots =
    count > 1 ? (
      <div className="pointer-events-auto flex items-center" role="group" aria-label="Choose banner">
        {slides.map((banner, i) => (
          <button
            key={banner.id}
            type="button"
            onClick={() => go(i)}
            aria-label={`Show banner ${i + 1} of ${count}: ${banner.name}`}
            aria-current={i === current}
            className="flex h-8 w-6 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <span
              className={cn(
                'block h-2 rounded-full transition-all duration-300',
                i === current ? 'w-7 bg-[#d92b2b]' : 'w-2 bg-white/60'
              )}
            />
          </button>
        ))}
      </div>
    ) : null;

  const showCardsHeading = cardsLoading || cards.length > 0;

  return (
    <section aria-label="Featured collection" className="w-full bg-[#0a0a0a] text-white">
      <h1 className="sr-only">KOVENIK: art you can wear</h1>

      {/* ============ STAGE: banner, word, model and overlay content ============ */}
      <div
        className="kv-hero-stage relative w-full overflow-hidden bg-[#0a0a0a]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
        onClickCapture={(event) => {
          // A swipe must not also open a banner link.
          if (swipe.current?.moved) {
            event.preventDefault();
            event.stopPropagation();
            swipe.current = null;
          }
        }}
        aria-roledescription={count > 0 ? 'carousel' : undefined}
        aria-label={count > 0 ? 'Promotional banners' : undefined}
      >
        {bannersLoading ? (
          <div className="absolute inset-0 bg-[#141414]" role="status" aria-label="Loading banners">
            <span className="sr-only">Loading banners</span>
            {/* Skeleton of the real layout: title, subtitle and button on the left, a model silhouette in the middle. */}
            <div className="absolute inset-0 animate-pulse">
              <div className="absolute bottom-0 left-1/2 h-[86%] w-[34%] min-w-[180px] -translate-x-1/2 rounded-t-full bg-white/[0.05]" />
              <div className="absolute left-4 top-1/2 hidden w-[28%] -translate-y-1/2 space-y-3 lg:left-12 lg:block">
                <div className="h-12 w-full rounded-sm bg-white/10" />
                <div className="h-12 w-4/5 rounded-sm bg-white/10" />
                <div className="h-4 w-3/5 rounded-sm bg-white/10" />
                <div className={cn('h-12 w-48 bg-white/10', RADIUS)} />
              </div>
            </div>
          </div>
        ) : count === 0 ? (
          <>
            {/* Empty list or API down: a static campaign photo and a way into the shop, never a blank box. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={FALLBACK.image} alt={FALLBACK.alt} className={cn('absolute inset-0 h-full w-full', IMG_POS)} />
            <div className="absolute inset-x-4 bottom-6 z-20 flex flex-wrap items-center gap-3 lg:inset-x-12">
              <HeroButton banner={null} modern={false} />
              {error && (
                <button
                  type="button"
                  role="alert"
                  onClick={retry}
                  className={cn(
                    'min-h-[48px] bg-black/70 px-4 text-[13px] font-bold uppercase tracking-[0.08em] text-white hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white',
                    RADIUS
                  )}
                >
                  Banners unavailable. Retry
                </button>
              )}
            </div>
          </>
        ) : (
          slides.map((banner, i) => {
            const isActive = i === current;
            const modern = hasModel(banner);
            const link = isSafeBannerLink(banner.linkUrl) ? banner.linkUrl : null;
            // Only the first slide is loaded up front; the main model image gets fetch priority.
            const first = i === 0;
            return (
              <div
                key={banner.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                aria-hidden={!isActive}
                className={cn(
                  'absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none',
                  isActive ? 'z-[1] opacity-100' : 'pointer-events-none z-0 opacity-0'
                )}
              >
                {/* 1. background. A plain banner is shown whole (never cropped, its text is baked in) over a blurred copy of itself. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.imageUrl}
                  alt=""
                  aria-hidden="true"
                  loading={first ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                  className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl"
                />
                <picture>
                  {banner.mobileImageUrl && <source media={STACKED_QUERY} srcSet={banner.mobileImageUrl} />}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.imageUrl}
                    alt={modern ? '' : banner.name}
                    loading={first ? 'eager' : 'lazy'}
                    fetchPriority={first && !modern ? 'high' : 'auto'}
                    decoding="async"
                    draggable={false}
                    onError={() => setFailed((prev) => new Set(prev).add(banner.id))}
                    className={
                      modern
                        ? cn(LAYER, '[mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent),linear-gradient(180deg,transparent,#000_14%)] [-webkit-mask-composite:source-in] [mask-composite:intersect]')
                        : cn('absolute inset-0 h-full w-full', IMG_POS)
                    }
                  />
                </picture>

                {modern ? (
                  <>
                    {/* 2. dark gradients on the left and right edges (desktop) and at the bottom */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0)_38%,rgba(0,0,0,0)_62%,rgba(0,0,0,0.78)_100%)]"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-black/55 to-transparent"
                    />
                    {/* 3. giant word, behind the model: faint, and fading out towards the bottom */}
                    <span
                      aria-hidden="true"
                      className="kv-hero-word pointer-events-none absolute left-1/2 top-[5%] -translate-x-1/2 select-none whitespace-nowrap font-oswald font-bold uppercase leading-none lg:top-[7%]"
                    >
                      Kovenik
                    </span>
                    {/* 4. transparent model, same size and position as the background */}
                    <picture>
                      {banner.mobileModelImageUrl && (
                        <source media={STACKED_QUERY} srcSet={banner.mobileModelImageUrl} />
                      )}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={banner.modelImageUrl ?? ''}
                        alt={isActive ? modelAlt : ''}
                        loading={first ? 'eager' : 'lazy'}
                        fetchPriority={first ? 'high' : 'low'}
                        decoding="async"
                        draggable={false}
                        onError={() => setModelFailed((prev) => new Set(prev).add(banner.id))}
                        // The desktop cut-out sits 6% right of its box centre, so pull it back to the true centre of the banner.
                        className={cn('pointer-events-none', LAYER, 'lg:-translate-x-[56%]')}
                      />
                    </picture>
                  </>
                ) : (
                  link && (
                    // Plain banner: the whole image is the link.
                    <Link
                      href={link}
                      className="absolute inset-0 block focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
                      tabIndex={isActive ? 0 : -1}
                      aria-label={banner.name}
                      draggable={false}
                      {...(link.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                    />
                  )
                )}
              </div>
            );
          })
        )}

        {/* 5. content. Wrapper ignores the pointer so plain banners stay clickable; its children opt back in. */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="relative mx-auto h-full w-full max-w-[1600px] px-4 md:px-8 lg:px-12">
            {/* Title, subtitle, button: left, vertically centred (from 1024px) */}
            {active && activeModern && (
              <div
                key={active.id}
                className="pointer-events-auto absolute left-8 top-1/2 hidden w-[min(36%,460px)] -translate-y-1/2 lg:left-12 lg:block"
              >
                <p className="font-oswald font-bold uppercase leading-[0.95] tracking-[0.01em] text-[clamp(40px,5vw,88px)] [overflow-wrap:anywhere]">
                  <span className="block line-clamp-2" style={{ color: RED }}>
                    {title.first}
                  </span>
                  {title.rest && <span className="block line-clamp-3 text-white">{title.rest}</span>}
                </p>
                {active.subtitle && (
                  <p className="mt-4 line-clamp-3 max-w-[34ch] text-[clamp(15px,1.3vw,19px)] leading-snug text-white/90">
                    {active.subtitle}
                  </p>
                )}
                <HeroButton banner={active} modern className="mt-7" />
              </div>
            )}

            {/* Heading + 3 collections: bottom right (from 1024px). Below that they sit under the stage. */}
            {showCardsHeading && (
              <div className="pointer-events-auto absolute bottom-6 right-8 hidden w-[min(28vw,320px)] lg:right-12 lg:block">
                <p className="mb-2 font-oswald text-[clamp(14px,1.25vw,18px)] font-bold uppercase leading-none tracking-[0.08em] text-white/90">
                  Art you can wear
                </p>
                <CollectionCards cards={cards} loading={cardsLoading} />
              </div>
            )}
            {!showCardsHeading && (
              <div className="pointer-events-auto absolute bottom-6 right-8 hidden lg:right-12 lg:block">
                <CollectionCards cards={cards} loading={false} />
              </div>
            )}

            {/* Slider dots: bottom left (from 1024px), centred on the image (below) */}
            {dots && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 lg:bottom-6 lg:left-12 lg:translate-x-0">{dots}</div>
            )}
          </div>
        </div>
      </div>

      {/* ============ BELOW 1024px: title, button and collections stacked under the picture ============ */}
      <div className="px-4 pb-10 pt-6 md:px-8 lg:hidden">
        <div className="mx-auto max-w-[560px] md:mx-0">
          {active && activeModern && (
            <>
              <p className="font-oswald text-[clamp(30px,9vw,48px)] font-bold uppercase leading-[1.02] [overflow-wrap:anywhere]">
                <span className="line-clamp-2" style={{ color: RED }}>
                  {title.first}
                </span>
                {title.rest && <span className="line-clamp-3 text-white">{title.rest}</span>}
              </p>
              {active.subtitle && (
                <p className="mt-2 line-clamp-3 text-[15px] leading-snug text-white/90">{active.subtitle}</p>
              )}
            </>
          )}
          <HeroButton banner={activeModern ? active : null} modern={activeModern} className="mt-5 w-full sm:w-auto" />
          <div className="mt-8">
            {showCardsHeading && (
              <p className="mb-3 font-oswald text-[16px] font-bold uppercase leading-none tracking-[0.08em] text-white/90">
                Art you can wear
              </p>
            )}
            <CollectionCards cards={cards} loading={cardsLoading} />
          </div>
        </div>
      </div>
    </section>
  );
}
