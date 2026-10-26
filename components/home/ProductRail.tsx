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
      <div className="mt-3 h-4 w-3/4 bg-kv-img" />
      <div className="mt-2 h-3.5 w-1/2 bg-kv-img" />
    </div>
  );
}

/* 8px gaps. Mobile: 160px cards. Tablet: 3 across. Desktop (1024px+): 4 across. */
const ITEM = 'w-[160px] shrink-0 md:w-[calc((100%-16px)/3)] lg:w-[calc((100%-24px)/4)]';

const ARROW =
  'absolute top-[calc(50%-48px)] z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-kv-line bg-kv-bg text-kv-ink transition-colors hover:border-kv-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-ink disabled:pointer-events-none disabled:opacity-0 md:flex';

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
    <section aria-labelledby={id} className="kv-gutter w-full bg-kv-bg py-10 md:py-14">
      <SectionHeader id={id} title={title} href={href} />

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
            className={`${ARROW} left-3`}
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next products"
            onClick={() => scrollByPage(1)}
            disabled={!canNext}
            className={`${ARROW} right-3`}
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>

          <ul
            ref={track}
            onScroll={update}
            className="kv-rail -mx-[clamp(16px,3vw,48px)] flex gap-2 overflow-x-auto px-[clamp(16px,3vw,48px)] md:mx-0 md:px-0"
          >
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className={ITEM}>
                    <ProductSkeletonCard />
                  </li>
                ))
              : products.map((product, i) => (
                  <li key={product.id} className={ITEM}>
                    <ProductCard product={product} variant="arrival" priority={i < 4} />
                  </li>
                ))}
          </ul>
        </div>
      )}
    </section>
  );
}
