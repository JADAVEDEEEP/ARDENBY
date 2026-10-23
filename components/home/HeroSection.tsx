
'use client';

import { useEffect, useState } from 'react';
import type { PointerEvent } from 'react';

import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

import { useFinePointer } from '@/hooks/use-fine-pointer';
import { heroSlides } from '@/lib/data';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

import { ChromeButton } from './ui/ChromeButton';
import { GoldButton } from './ui/GoldButton';
import { HeroStage } from './HeroStage';
import { HERO_PRODUCT_IMAGE } from './home-assets';

const SLIDE_INTERVAL_MS = 7000;

/** "Everyday Essentials" leads (matches the approved reference); each slide
 *  gets its own garment colour on the stage. */
const SLIDE_ORDER = ['s3', 's1', 's2', 's4'];
const slides = [...heroSlides].sort(
  (a, b) => SLIDE_ORDER.indexOf(a.id) - SLIDE_ORDER.indexOf(b.id)
);

/* Deterministic particle field (no Math.random, so SSR and client match). */
const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  top: (i * 53 + 7) % 92,
  size: 1 + ((i * 7) % 3),
  delay: (i % 9) * -1.7,
  duration: 12 + ((i * 5) % 9),
  dx: ((i * 13) % 29) - 14,
}));

const ARROW =
  'chrome-focus chrome-glass flex h-11 w-11 items-center justify-center rounded-full text-kv-head transition hover:border-white/50 hover:text-white';

interface HeroSectionProps {
  /** Total product count for the "24+ New collection" stat. */
  productCount: number;
  /** Featured drop (same product as the Shop hero); falls back to the default tee. */
  featuredDrop?: Product | null;
}

export function HeroSection({ productCount, featuredDrop }: HeroSectionProps) {
  const teeFront = featuredDrop?.images?.[0] ?? HERO_PRODUCT_IMAGE;
  const teeBack = featuredDrop?.images?.[1] ?? teeFront;
  const printLabel = featuredDrop && /trapslayer/i.test(featuredDrop.name) ? 'TRAPSLAYER' : 'KOVENIK';

  const [slide, setSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const fine = useFinePointer();
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  // Existing auto-advance, paused while the pointer is over the hero.
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const timer = window.setInterval(() => {
      setSlide((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  const activeHero = slides[slide];
  const goTo = (index: number) =>
    setSlide((index + slides.length) % slides.length);

  const heroWords = activeHero.headline.split(' ');

  const handleMove = (e: PointerEvent<HTMLElement>) => {
    if (!fine) return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section
      aria-label="Featured collection"
      className="chrome-scope relative isolate overflow-hidden bg-kv-bg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        px.set(0);
        py.set(0);
      }}
      onPointerMove={handleMove}
    >
      {/* Radial dark-chrome backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(70%_70%_at_72%_40%,rgba(120,126,136,0.28),transparent_70%),radial-gradient(60%_50%_at_10%_0%,rgba(255,255,255,0.07),transparent_70%),linear-gradient(180deg,#0b0c0e_0%,#050506_100%)]"
      />

      {/* Giant outlined wordmark */}
      <div
        aria-hidden="true"
        className="chrome-outline pointer-events-none absolute inset-x-0 top-[4%] -z-10 select-none whitespace-nowrap text-center font-bodoni text-[clamp(90px,24vw,360px)] font-semibold uppercase leading-[0.9] tracking-[0.08em]"
      >
        Kovenik
      </div>

      {/* T hin chrome pillars */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
        {['left-[46%]', 'left-[96%]'].map((pos) => (
          <span
            key={pos}
            className={cn(
              'absolute top-0 h-full w-px bg-gradient-to-b from-transparent via-white/30 to-transparent',
              pos
            )}
          />
        ))}
      </div>

      {/* Diagonal light streak */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[10%] -top-[20%] -z-10 h-[140%] w-[22%] rotate-[24deg] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
      />

      {/* Perspective reflective floor grid */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[34%] overflow-hidden">
        <div className="chrome-grid-floor absolute inset-x-[-20%] top-0 h-[200%]" />
      </div>

      {/* Particles */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="kv-drift absolute rounded-full bg-white"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
              ['--kv-d' as string]: `${p.duration}s`,
              ['--kv-dx' as string]: `${p.dx}px`,
            }}
          />
        ))}
      </div>

      <div className="mx-auto grid w-full max-w-[1440px] gap-y-6 px-4 pb-10 pt-8 sm:px-8 lg:min-h-[680px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[1fr_auto] lg:gap-x-10 lg:gap-y-8 lg:px-12 lg:pb-16 lg:pt-14">
        {/* Head: eyebrow + headline */}
        <div className="relative z-20 lg:col-start-1 lg:row-start-1 lg:self-end">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-kv-gold lg:mb-6">
            Wear your essence
          </p>

          <AnimatePresence mode="wait">
            <motion.h1
              key={slide}
              className="font-archivo text-[clamp(40px,10vw,64px)] font-black uppercase leading-[0.92] tracking-[-0.02em] lg:text-[clamp(52px,4.9vw,84px)]"
              style={{ fontVariationSettings: "'wdth' 125" }}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}
              variants={{ show: { transition: { staggerChildren: 0.09 } } }}
            >
              {heroWords.map((word, i) => (
                <motion.span
                  key={`${word}-${i}`}
                  className="chrome-shine inline-block pr-[0.22em]"
                  style={{ animationDelay: `${(i % 3) * 0.35}s` }}
                  variants={{
                    hidden: { opacity: 0, y: 28 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                    },
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* Stage (between headline and copy on mobile, right column on desktop) */}
        <div className="relative z-10 py-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:py-0">
          <HeroStage
            alt={activeHero.headline}
            front={teeFront}
            back={teeBack}
            printLabel={printLabel}
            px={px}
            py={py}
          />

          {/* Slide arrows */}
          <button
            type="button"
            onClick={() => goTo(slide - 1)}
            aria-label="Previous slide"
            className={cn(ARROW, 'absolute left-0 top-1/2 hidden -translate-y-1/2 sm:flex lg:-left-4')}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo(slide + 1)}
            aria-label="Next slide"
            className={cn(ARROW, 'absolute right-0 top-1/2 hidden -translate-y-1/2 sm:flex lg:-right-4')}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Body: copy, CTAs, stat, indicators */}
        <div className="relative z-20 lg:col-start-1 lg:row-start-2 lg:self-start">
          <AnimatePresence mode="wait">
            <motion.p
              key={slide}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="max-w-[480px] text-[15px] font-semibold leading-[1.5] text-kv-head sm:text-[17px]"
            >
              {activeHero.sub}
            </motion.p>
          </AnimatePresence>

          <p className="mt-3 max-w-[480px] text-[14px] leading-[1.75] text-kv-muted">
            KOVENIK is a minimalist luxury label. Heavyweight fabrics, relaxed
            cuts and a calm, considered finish.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <GoldButton href="/shop">
              Shop now
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </GoldButton>
            <ChromeButton href={activeHero.href}>{activeHero.cta}</ChromeButton>
          </div>

          <div className="mt-7 flex items-end justify-between gap-6 border-t border-white/10 pt-5 lg:max-w-[540px]">
            <div>
              <p className="chrome-text font-bodoni text-[clamp(34px,4vw,52px)] font-medium leading-none">
                {productCount}+
              </p>
              <p className="mt-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-kv-head">
                <span className="h-1.5 w-1.5 rounded-full bg-kv-gold" />
                New collection
              </p>
            </div>

            <div className="flex items-center">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === slide}
                  className="chrome-focus flex h-11 items-center px-1.5"
                >
                  <span
                    className={cn(
                      'block h-[3px] rounded-full transition-all duration-500',
                      index === slide ? 'w-9 bg-white' : 'w-4 bg-white/30'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
