'use client';

import Link from 'next/link';

import { cn } from '@/lib/utils';
import type { Product } from '@/types';

import { BannerSlider } from './BannerSlider';
import { SafeImage } from './ui/SafeImage';

const BTN =
  'inline-flex min-h-[48px] flex-1 items-center justify-center whitespace-nowrap px-3 text-[14px] font-bold uppercase tracking-[0.08em] transition-colors sm:flex-none sm:min-h-[52px] sm:px-6 sm:text-[15px] lg:px-8';

interface HeroCarouselProps {
  /** Real products shown as the three thumbnails. */
  products: Product[];
}

export function HeroCarousel({ products }: HeroCarouselProps) {
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
      aria-label="Featured collection"
      className="w-full bg-kv-bg"
    >
      {/* Edge to edge: image flush left, content fills the rest */}
      <div className="grid w-full md:grid-cols-2 lg:min-h-[calc(100svh-var(--kv-top))]">
        <div className="w-full md:contents">
          {/* Banner slider: live banners from the admin panel */}
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-kv-ink md:aspect-auto md:min-h-[560px] lg:min-h-0">
            <BannerSlider />
          </div>

          {/* Phone: the heading and buttons sit under the banner so they never cover its artwork */}
          <div className="bg-kv-ink px-4 pb-6 pt-5 text-white md:hidden">
            <h1 className="font-oswald text-[40px] font-bold uppercase leading-none tracking-[0.04em]">Art you can wear</h1>
            <p className="mt-2 text-[15px] leading-[1.6] text-kv-mist">
              Heavyweight fabrics, relaxed cuts and a calm, considered finish.
            </p>
            <div className="mt-4">{buttons}</div>
          </div>
        </div>

        {/* Desktop panel */}
        <div className="kv-gutter hidden flex-col items-center justify-center py-10 text-center md:flex lg:py-6">
          <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-kv-gold-text">Graphic streetwear</p>
          <h1 className="mt-3 font-oswald text-[56px] font-bold uppercase leading-none tracking-[0.04em] text-kv-ink lg:text-[64px]">
            Art you can wear
          </h1>

          {thumbs.length > 0 && (
            <ul className="mt-6 grid w-full max-w-[600px] grid-cols-3 gap-4 lg:min-h-[150px] lg:flex-1 lg:max-h-[320px]">
              {thumbs.map((p) => (
                <li key={p.id} className="lg:min-h-0">
                  <Link href={`/product/${p.slug}`} aria-label={p.name} className="relative block aspect-[3/4] overflow-hidden bg-kv-img lg:aspect-auto lg:h-full">
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
            Apex Edition | Epic Thread | Kovenik Premium
          </p>
          <div className="mt-7">{buttons}</div>
        </div>
      </div>

    </section>
  );
}
