'use client';

import { useCallback, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, ZoomIn } from 'lucide-react';

import { useFinePointer } from '@/hooks/use-fine-pointer';

type ProductStageProps = {
  images: string[];
  name: string;
  onOpenFullscreen: (index: number) => void;
};

const ZOOM_SCALE = 1.9;
const OVERLAY = 'bg-white/[0.92] text-[#111111]';
const SECONDARY_LABELS = ['On model', 'Print detail'];

/**
 * Product gallery. The real product photography is never replaced or
 * distorted. Desktop: thumbnail rail + 4:5 stage with hover zoom, plus a row of
 * the next two images. Mobile: native scroll-snap swiper (no mouse effects).
 */
export function ProductStage({ images, name, onOpenFullscreen }: ProductStageProps) {
  const [active, setActive] = useState(0);
  const fine = useFinePointer();

  const imageRef = useRef<HTMLDivElement | null>(null);
  const swiperRef = useRef<HTMLDivElement | null>(null);

  const count = images.length;

  const go = useCallback(
    (index: number) => {
      if (count === 0) return;
      setActive(((index % count) + count) % count);
    },
    [count]
  );

  /* ---- Desktop hover zoom: direct style writes, no re-renders ---- */

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!fine || event.pointerType !== 'mouse') return;
    const image = imageRef.current;
    if (!image) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const nx = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const ny = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    image.style.transformOrigin = `${nx * 100}% ${ny * 100}%`;
    image.style.transform = `scale(${ZOOM_SCALE})`;
  };

  const resetZoom = () => {
    const image = imageRef.current;
    if (image) image.style.transform = '';
  };

  /* ---- Mobile swiper: scroll-snap ---- */

  const handleSwiperScroll = () => {
    const el = swiperRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive((current) => (current === index ? current : index));
  };

  if (count === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center bg-white text-[14px] text-[var(--muted)]">
        No image available
      </div>
    );
  }

  const secondary = count >= 3 ? [1, 2] : [];

  return (
    <div className="min-w-0">
      {/* ------------------------------ DESKTOP ------------------------------ */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-[76px_minmax(0,1fr)] items-start gap-4">
          <div className="flex flex-col gap-[10px]">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                aria-label={`View image ${index + 1}`}
                aria-current={active === index}
                onClick={() => go(index)}
                className={`kv-opt aspect-[4/5] w-full overflow-hidden border bg-white p-[2px] ${
                  active === index
                    ? 'border-[var(--ink)]'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={image} alt={`${name} ${index + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>

          <div
            onPointerMove={handlePointerMove}
            onPointerLeave={resetZoom}
            className="relative aspect-[4/5] overflow-hidden bg-white"
          >
            <div ref={imageRef} className="kv-zoom-layer h-full w-full">
              <img
                key={active}
                src={images[active]}
                alt={name}
                draggable={false}
                className="kv-fade block h-full w-full select-none object-cover"
              />
            </div>

            <button
              type="button"
              aria-label="Open product image fullscreen"
              onClick={() => onOpenFullscreen(active)}
              className="absolute inset-0 z-10 cursor-zoom-in"
            />

            {count > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() => go(active - 1)}
                  className={`absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full ${OVERLAY}`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => go(active + 1)}
                  className={`absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full ${OVERLAY}`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {count > 1 && (
              <span
                className={`pointer-events-none absolute bottom-4 left-4 z-20 rounded-full px-4 py-2 text-[12px] font-semibold tabular-nums tracking-[0.1em] ${OVERLAY}`}
              >
                {active + 1} / {count}
              </span>
            )}

            <span
              className={`pointer-events-none absolute bottom-4 right-4 z-20 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] ${OVERLAY}`}
            >
              <ZoomIn className="h-3.5 w-3.5" />
              Hover to zoom
            </span>
          </div>
        </div>

        {secondary.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 pl-[92px]">
            {secondary.map((index, position) => (
              <button
                key={`${images[index]}-${index}`}
                type="button"
                aria-label={`Open image ${index + 1} fullscreen`}
                onClick={() => onOpenFullscreen(index)}
                className="relative aspect-[4/5] overflow-hidden bg-white"
              >
                <img src={images[index]} alt={`${name} ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                <span
                  className={`absolute bottom-3 left-3 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] ${OVERLAY}`}
                >
                  {SECONDARY_LABELS[position]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------- MOBILE ------------------------------ */}
      <div className="lg:hidden">
        <div className="relative isolate">
          <div
            ref={swiperRef}
            onScroll={handleSwiperScroll}
            className="kv-swiper flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain bg-white"
            aria-label={`${name} images`}
          >
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                aria-label={`Open image ${index + 1} fullscreen`}
                onClick={() => onOpenFullscreen(index)}
                className="relative block aspect-[4/5] w-full shrink-0 snap-center touch-manipulation"
              >
                <img
                  src={image}
                  alt={`${name} ${index + 1}`}
                  draggable={false}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="block h-full w-full select-none object-cover"
                />
              </button>
            ))}
          </div>

          {count > 1 && (
            <span
              className={`pointer-events-none absolute right-3 top-3 rounded-full px-3 py-1.5 text-[12px] font-semibold tabular-nums ${OVERLAY}`}
            >
              {active + 1} / {count}
            </span>
          )}

          <button
            type="button"
            aria-label="Open product image fullscreen"
            onClick={() => onOpenFullscreen(active)}
            className={`absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full ${OVERLAY}`}
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          {count > 1 && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-center gap-1.5"
              aria-hidden="true"
            >
              {images.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    active === index ? 'w-5 bg-[#111111]' : 'w-1.5 bg-[#111111]/35'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
