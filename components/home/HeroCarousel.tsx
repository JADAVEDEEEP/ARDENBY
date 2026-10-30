'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import type { Product } from '@/types';

import { SafeImage } from './ui/SafeImage';

const SLIDE_MS = 6000;

/* Existing KOVENIK campaign photography. */
const SLIDES = [
  { image: '/images/hero-black-tee.jpg', alt: 'Model wearing a KOVENIK black oversized graphic tee' },
  { image: '/images/hero-olive-graphic.jpg', alt: 'Model wearing an olive KOVENIK oversized tee' },
  { image: '/images/hero-dtf-back-print.jpg', alt: 'Model wearing a white KOVENIK tee with a crane back print' },
  { image: '/images/hero-linen.jpg', alt: 'Model wearing a KOVENIK linen tee' },
] as const;

const BTN =
  'inline-flex min-h-[48px] flex-1 items-center justify-center whitespace-nowrap px-3 text-[14px] font-bold uppercase tracking-[0.08em] transition-colors sm:flex-none sm:min-h-[52px] sm:px-6 sm:text-[15px] lg:px-8';

interface HeroCarouselProps {
  /** Real products shown as the three thumbnails. */
  products: Product[];
}

export function HeroCarousel({ products }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [paused]);

  const thumbs = products.filter((p) => p.images?.[0]).slice(0, 3);

  const buttons = (
    <div className="flex flex-wrap justify-center gap-3">
      <Link href="/shop" className={cn(BTN, 'bg-kv-ink text-white hover:bg-black')}>
        Shop now
      </Link>
      <Link
        href="/shop?category=epic-thread"
        className={cn(
          BTN,
          'border-2 border-white text-white hover:bg-white hover:text-kv-ink md:border-kv-ink md:text-kv-ink md:hover:bg-kv-ink md:hover:text-white'
        )}
      >
        Explore graphics
      </Link>
    </div>
  );

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collection"
      className="w-full bg-kv-bg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Edge to edge: image flush left, content fills the rest */}
      <div className="grid w-full md:grid-cols-2">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-kv-ink md:aspect-auto md:min-h-[560px]">
          {SLIDES.map((slide, i) => (
            <Image
              key={slide.image}
              src={slide.image}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="(min-width: 768px) 50vw, 100vw"
              aria-hidden={i !== index}
              className={cn('object-cover object-[50%_25%] transition-opacity duration-500', i === index ? 'opacity-100' : 'opacity-0')}
            />
          ))}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent px-4 pb-5 pt-16 text-white md:hidden">
            <h1 className="font-oswald text-[40px] font-bold uppercase leading-none tracking-[0.04em]">Art you can wear</h1>
            <p className="mt-2 text-[15px] leading-[1.6] text-kv-mist">
              Heavyweight fabrics, relaxed cuts and a calm, considered finish.
            </p>
            <div className="mt-4">{buttons}</div>
          </div>
        </div>

        {/* Desktop panel */}
        <div className="kv-gutter hidden flex-col items-center justify-center py-10 text-center md:flex">
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-kv-gold-text">Graphic streetwear · 240 GSM</p>
          <h1 className="mt-3 font-oswald text-[56px] font-bold uppercase leading-none tracking-[0.04em] text-kv-ink lg:text-[64px]">
            Art you can wear
          </h1>

          {thumbs.length > 0 && (
            <ul className="mt-8 grid w-full max-w-[600px] grid-cols-3 gap-4">
              {thumbs.map((p) => (
                <li key={p.id}>
                  <Link href={`/product/${p.slug}`} aria-label={p.name} className="relative block aspect-[3/4] overflow-hidden bg-kv-img">
                    <SafeImage
                      src={p.images[0]}
                      alt={p.name}
                      fill
                      sizes="200px"
                      className="object-cover object-top transition duration-300 hover:scale-105"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-7 text-[15px] font-bold uppercase tracking-[0.12em] text-kv-ink">
            Supreme Edition | Epic Thread | Kovenik Premium
          </p>
          <div className="mt-7">{buttons}</div>
        </div>
      </div>

      <div className="flex items-center justify-center py-1" role="group" aria-label="Choose slide">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.image}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1} of ${SLIDES.length}`}
            aria-current={i === index}
            className="flex h-11 w-8 items-center justify-center"
          >
            <span className={cn('block h-2 rounded-full transition-all duration-300', i === index ? 'w-6 bg-kv-gold' : 'w-2 bg-kv-line')} />
          </button>
        ))}
      </div>
    </section>
  );
}
