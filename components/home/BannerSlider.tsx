'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useBanners } from '@/hooks/use-banners';
import { isSafeBannerLink, type PublicBanner } from '@/lib/banner-api';
import { cn } from '@/lib/utils';

const SLIDE_MS = 6000;
const SWIPE_PX = 50;

/** Shown while there is nothing to rotate (no live banners, or the API is down). */
const FALLBACK = {
  image: '/images/hero-black-tee.jpg',
  alt: 'Model wearing a KOVENIK black oversized graphic tee',
};

function SlideLink({
  banner,
  active,
  children,
}: {
  banner: PublicBanner;
  active: boolean;
  children: ReactNode;
}) {
  const className = 'absolute inset-0 block';
  const tabIndex = active ? 0 : -1;
  const label = `${banner.name}`;

  if (!isSafeBannerLink(banner.linkUrl)) return <div className={className}>{children}</div>;

  if (banner.linkUrl.startsWith('/')) {
    return (
      <Link href={banner.linkUrl} className={className} tabIndex={tabIndex} aria-label={label} draggable={false}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={banner.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      tabIndex={tabIndex}
      aria-label={label}
      draggable={false}
    >
      {children}
    </a>
  );
}

/**
 * The hero's first column: admin-managed banners from the public banner API.
 * The server already applies active / start / end / display order.
 */
export function BannerSlider() {
  const { banners, loading, error, retry } = useBanners();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const swipe = useRef<{ x: number; moved: boolean } | null>(null);

  // A banner whose image will not load is skipped instead of showing a hole.
  const slides = banners.filter((b) => !failed.has(b.id));
  const count = slides.length;
  const current = count > 0 ? Math.min(index, count - 1) : 0;

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

  // Re-armed after every slide change, so using the arrows restarts the countdown.
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

  if (loading) {
    return (
      <div className="absolute inset-0 animate-pulse bg-kv-ink" role="status" aria-label="Loading banners">
        <span className="sr-only">Loading banners</span>
      </div>
    );
  }

  if (count === 0) {
    return (
      <>
        <Image src={FALLBACK.image} alt={FALLBACK.alt} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-[50%_25%]" />
        {error && (
          <button
            type="button"
            onClick={retry}
            className="absolute bottom-3 right-3 z-10 min-h-[44px] bg-black/70 px-4 text-[13px] font-bold uppercase tracking-[0.08em] text-white hover:bg-black"
          >
            Banners unavailable. Retry
          </button>
        )}
      </>
    );
  }

  return (
    <div
      className="absolute inset-0 touch-pan-y select-none overflow-hidden bg-kv-ink"
      aria-roledescription="carousel"
      aria-label="Promotional banners"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (swipe.current = null)}
      onClickCapture={(event) => {
        // A swipe must not also open the banner's link.
        if (swipe.current?.moved) {
          event.preventDefault();
          event.stopPropagation();
          swipe.current = null;
        }
      }}
    >
      <div aria-live={paused ? 'polite' : 'off'}>
        {slides.map((banner, i) => {
          const active = i === current;
          return (
            <div
              key={banner.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              className={cn(
                'absolute inset-0 transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none',
                active ? 'z-[1] scale-100 opacity-100' : 'pointer-events-none z-0 scale-[1.03] opacity-0'
              )}
            >
              <SlideLink banner={banner} active={active}>
                <picture>
                  {banner.mobileImageUrl && <source media="(max-width: 1079px)" srcSet={banner.mobileImageUrl} />}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.imageUrl}
                    alt={banner.name}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                    decoding="async"
                    draggable={false}
                    onError={() => setFailed((prev) => new Set(prev).add(banner.id))}
                    className="h-full w-full object-cover object-[50%_40%]"
                  />
                </picture>
              </SlideLink>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex items-center justify-center gap-1 min-[1080px]:inset-0 min-[1080px]:items-end min-[1080px]:pb-3">
          <div className="pointer-events-auto flex items-center" role="group" aria-label="Choose banner">
            {slides.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show banner ${i + 1} of ${count}: ${banner.name}`}
                aria-current={i === current}
                className="flex h-11 w-7 items-center justify-center"
              >
                <span
                  className={cn(
                    'block h-2 rounded-full transition-all duration-300',
                    i === current ? 'w-6 bg-kv-gold' : 'w-2 bg-white/70'
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
