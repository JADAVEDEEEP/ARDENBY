'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, ZoomIn } from 'lucide-react';

import { useFinePointer } from '@/hooks/use-fine-pointer';

type ProductStageProps = {
  images: string[];
  name: string;
  onOpenFullscreen: (index: number) => void;
};

const MAX_TILT = 4; // degrees; subtle so the artwork never looks distorted
const ZOOM_SCALE = 1.9;

/**
 * Layered 2.5D product showcase.
 * No 3D garment model exists, so depth is built from CSS perspective, lighting,
 * shadows and cursor parallax. The real product photography is never replaced
 * or distorted. Desktop: cursor-responsive tilt + sheen + in-place zoom.
 * Mobile: native scroll-snap swiper (no mouse effects).
 */
export function ProductStage({ images, name, onOpenFullscreen }: ProductStageProps) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const fine = useFinePointer();

  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const swiperRef = useRef<HTMLDivElement | null>(null);
  const swiperLock = useRef(false);

  const count = images.length;

  const go = useCallback(
    (index: number) => {
      if (count === 0) return;
      setZoomed(false);
      setActive(((index % count) + count) % count);
    },
    [count]
  );

  /* ---- Desktop pointer-driven depth (direct style writes: no re-renders) ---- */

  const resetDepth = () => {
    const stage = stageRef.current;
    const card = cardRef.current;
    const image = imageRef.current;
    if (card) card.style.transform = '';
    if (image) image.style.transform = '';
    if (stage) {
      stage.style.setProperty('--px', '0');
      stage.style.setProperty('--py', '0');
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!fine || event.pointerType !== 'mouse') return;
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card) return;

    const rect = card.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width; // 0..1
    const ny = (event.clientY - rect.top) / rect.height;
    const cx = Math.min(1, Math.max(0, nx)) - 0.5; // -0.5..0.5
    const cy = Math.min(1, Math.max(0, ny)) - 0.5;

    stage.style.setProperty('--px', String(cx * 2));
    stage.style.setProperty('--py', String(cy * 2));
    stage.style.setProperty('--mx', `${nx * 100}%`);
    stage.style.setProperty('--my', `${ny * 100}%`);

    if (zoomed) {
      // Pan the magnified image under the cursor instead of tilting.
      const image = imageRef.current;
      if (image) {
        image.style.transformOrigin = `${nx * 100}% ${ny * 100}%`;
        image.style.transform = `scale(${ZOOM_SCALE})`;
      }
      card.style.transform = '';
    } else {
      card.style.transform = `rotateX(${-cy * MAX_TILT * 2}deg) rotateY(${cx * MAX_TILT * 2}deg)`;
    }
  };

  useEffect(() => {
    if (!zoomed) {
      const image = imageRef.current;
      if (image) image.style.transform = '';
    }
  }, [zoomed]);

  /* ---- Mobile swiper: scroll-snap, synced with the thumbnail strip ---- */

  const handleSwiperScroll = () => {
    const el = swiperRef.current;
    if (!el || swiperLock.current) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive((current) => (current === index ? current : index));
  };

  const scrollSwiperTo = (index: number) => {
    const el = swiperRef.current;
    if (!el) return;
    swiperLock.current = true;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
    window.setTimeout(() => {
      swiperLock.current = false;
    }, 450);
  };

  const selectThumb = (index: number) => {
    go(index);
    scrollSwiperTo(index);
  };

  if (count === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center border border-white/10 bg-[#1C1D20] text-base text-[#8D8A82]">
        No image available
      </div>
    );
  }

  const thumbClass = (index: number) =>
    `relative shrink-0 overflow-hidden border bg-[#1C1D20] transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D2D2D7] ${
      active === index
        ? 'border-white shadow-[0_8px_20px_rgba(0,0,0,.5)]'
        : 'border-white/10 opacity-70 hover:-translate-y-0.5 hover:border-white/30 hover:opacity-100'
    }`;

  return (
    <div className="min-w-0 lg:sticky lg:top-[8.5rem] lg:self-start">
      {/* ------------------------------ DESKTOP ------------------------------ */}
      <div className="hidden items-start lg:grid lg:grid-cols-[84px_minmax(0,1fr)] lg:gap-5">
        <div className="flex max-h-[calc(100vh-11rem)] flex-col gap-3 overflow-y-auto pr-1">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              aria-label={`View image ${index + 1}`}
              aria-current={active === index}
              onClick={() => go(index)}
              className={`${thumbClass(index)} aspect-[4/5]`}
            >
              <img src={image} alt={`${name} ${index + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>

        <div
          ref={stageRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={resetDepth}
          className="kv-stage relative isolate"
          style={{ ['--px' as string]: 0, ['--py' as string]: 0 }}
        >
          {/* ambient light + dark metallic environment */}

          {/* thin decorative rings at different depths (parallax) */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[5]">
            <span className="kv-ring kv-ring-a" />
            <span className="kv-ring kv-ring-b" />
          </div>

          <div className="kv-stage-in [perspective:1400px]">
            <div
              ref={cardRef}
              className="kv-card relative overflow-hidden bg-[#090a0b] [transform-style:preserve-3d]"
            >
              <div ref={imageRef} className="kv-zoom-layer">
                <img
                  key={active}
                  src={images[active]}
                  alt={name}
                  draggable={false}
                  className="kv-fade block h-auto max-h-[calc(100vh-9rem)] w-full select-none object-contain mix-blend-lighten"
                />
              </div>

              {/* cursor-following specular highlight + vignette: lighting only */}
              <div aria-hidden="true" className="kv-sheen-layer pointer-events-none absolute inset-0" />

              {/* click target for in-place zoom */}
              <button
                type="button"
                aria-label={zoomed ? 'Exit zoom' : 'Zoom image'}
                aria-pressed={zoomed}
                onClick={() => setZoomed((z) => !z)}
                className={`absolute inset-0 z-10 ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
              />

              {count > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() => go(active - 1)}
                    className="kv-ctl absolute left-4 top-1/2 z-20 -translate-y-1/2"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => go(active + 1)}
                    className="kv-ctl absolute right-4 top-1/2 z-20 -translate-y-1/2"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                <span className="kv-ctl pointer-events-none !w-auto gap-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em]">
                  <ZoomIn className="h-3.5 w-3.5" />
                  {zoomed ? 'Move to explore' : 'Click to zoom'}
                </span>
              </div>

              <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                {count > 1 && (
                  <span className="kv-ctl pointer-events-none !w-auto px-3 text-xs font-semibold tabular-nums">
                    {active + 1} / {count}
                  </span>
                )}
                <button
                  type="button"
                  aria-label="Open product image fullscreen"
                  onClick={() => onOpenFullscreen(active)}
                  className="kv-ctl"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* grounded reflection / floor shadow */}
            <div aria-hidden="true" className="kv-floor" />
          </div>
        </div>
      </div>

      {/* ------------------------------- MOBILE ------------------------------ */}
      <div className="lg:hidden">
        <div className="relative isolate">
          <div
            ref={swiperRef}
            onScroll={handleSwiperScroll}
            className="kv-swiper flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain bg-[#090a0b]"
            aria-label={`${name} images`}
          >
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                aria-label={`Open image ${index + 1} fullscreen`}
                onClick={() => onOpenFullscreen(index)}
                className="relative block w-full shrink-0 snap-center touch-manipulation"
              >
                <img
                  src={image}
                  alt={`${name} ${index + 1}`}
                  draggable={false}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="block h-auto w-full select-none object-contain mix-blend-lighten"
                />
              </button>
            ))}
          </div>

          <span className="pointer-events-none absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-[#0C0C0E]/80 text-[#FFFFFF]">
            <Maximize2 className="h-4 w-4" />
          </span>
          {count > 1 && (
            <span className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/15 bg-[#0C0C0E]/85 px-3 py-1 text-xs font-semibold tabular-nums text-[#FFFFFF]">
              {active + 1}/{count}
            </span>
          )}
        </div>

        {count > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2" aria-hidden="true">
            {images.map((_, index) => (
              <span
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${active === index ? 'w-6 bg-[#FFFFFF]' : 'w-1.5 bg-white/25'}`}
              />
            ))}
          </div>
        )}

        {count > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                aria-label={`View image ${index + 1}`}
                aria-current={active === index}
                onClick={() => selectThumb(index)}
                className={`${thumbClass(index)} h-[72px] w-14`}
              >
                <img src={image} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
