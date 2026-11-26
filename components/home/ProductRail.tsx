'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { Product } from '@/types';

import { ProductCard } from './ProductCard';
import { SectionHeader } from './ui/SectionHeader';

interface ProductRailProps {
  id: string;
  title: string;
  products: Product[];
  loading: boolean;
  error?: string;
  onRetry?: () => void;
  href?: string;
}

export function ProductSkeletonCard() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="aspect-[3/4] bg-kv-img" />
      {/* Mirrors the card's text block (brand, name, category, price) so loading doesn't shift the page. */}
      <div className="pt-3.5">
        <div className="mb-1 h-3 w-1/4 bg-kv-img" />
        <div className="h-[22px] w-3/4 bg-kv-img" />
        <div className="mt-1 h-5 w-1/2 bg-kv-img" />
        <div className="mt-2 h-6 w-2/5 bg-kv-img" />
      </div>
    </div>
  );
}

/* Same gaps as the grids below (12px mobile, 24px md+). Mobile: 160px cards. Tablet: 3 across. 1024px+: 4. 1600px+: 5. */
const ITEM =
  'w-[44%] shrink-0 md:w-[calc((100%-24px)/3)] lg:w-[calc((100%-36px)/4)] min-[1600px]:w-[calc((100%-48px)/5)]';

const ARROW =
  'absolute top-[calc(50%-48px)] z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-kv-ink shadow-[0_2px_8px_rgba(0,0,0,0.22)] transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kv-ink disabled:pointer-events-none disabled:opacity-0 md:flex';

/** Full-width horizontal carousel: swipe on touch, arrows on tablet/desktop. */
export function ProductRail({ id, title, products, loading, error, onRetry, href }: ProductRailProps) {
  const track = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, products, loading]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  if (!loading && !error && products.length === 0) return null;

  return (
    <section aria-labelledby={id} className="mx-auto w-full bg-kv-bg py-8 md:py-10">
      <SectionHeader id={id} title={title} href={href} className="kv-gutter" />

      {error && !loading ? (
        <div role="status" className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-[16px] text-kv-sub">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-[48px] items-center border-2 border-kv-ink px-6 text-[14px] font-bold uppercase tracking-[0.1em] text-kv-ink hover:bg-kv-ink hover:text-white"
            >
              Try again
            </button>
          )}
        </div>
      ) : (
        <div className="relative" role="region" aria-roledescription="carousel" aria-label={title}>
          <button
            type="button"
            aria-label="Previous products"
            onClick={() => scrollByPage(-1)}
            disabled={!canPrev}
            className={`${ARROW} left-1`}
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next products"
            onClick={() => scrollByPage(1)}
            disabled={!canNext}
            className={`${ARROW} right-1`}
          >
            <ChevronRight className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
          </button>

          <ul
            ref={track}
            onScroll={update}
            className="kv-rail flex gap-3 overflow-x-auto px-3 md:px-0"
          >
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className={ITEM}>
                    <ProductSkeletonCard />
                  </li>
                ))
              : products.map((product) => (
                  <li key={product.id} className={ITEM}>
                    <ProductCard product={product} variant="arrival" />
                  </li>
                ))}
          </ul>
        </div>
      )}
    </section>
  );
}
