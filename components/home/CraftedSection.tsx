import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import { HERO_PRODUCT_IMAGE, PROCESS_STORY_IMAGE } from './home-assets';
import { philosophy } from './home-content';
import { ChromeRing } from './ui/ChromeRing';
import { GoldButton } from './ui/GoldButton';
import { Reveal } from './ui/Reveal';
import { SafeImage } from './ui/SafeImage';

/** Left: 3D display (pedestal, glass panels, light beam, play button).
 *  Right: copy + numbered features + CTA. The play button keeps the previous
 *  behaviour: the whole display links to /shop. */
export function CraftedSection() {
  return (
    <section
      aria-label="Our process"
      className="bg-kv-bg px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        <Reveal>
          <span className="inline-block rounded-full border border-kv-gold/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-kv-gold">
            Our process
          </span>
          <h2 className="chrome-text mt-5 max-w-[720px] font-bodoni text-[clamp(32px,4.6vw,60px)] font-medium uppercase leading-[1.05]">
            Crafted with care, from start to finish.
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14">
          <Reveal>
            <Link
              href="/shop"
              aria-label="Shop the KOVENIK collection"
              className="chrome-focus group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/15 bg-[radial-gradient(80%_70%_at_50%_30%,#23262b,#07080a)] lg:aspect-[5/4]"
            >
              {/* Story image, dimmed behind the display */}
              <SafeImage
                src={PROCESS_STORY_IMAGE}
                alt=""
                fill
                sizes="(min-width: 1024px) 560px, 92vw"
                className="object-cover opacity-20 mix-blend-luminosity"
              />

              {/* Light beam */}
              <div
                aria-hidden="true"
                className="kv-beam absolute left-1/2 top-0 h-[78%] w-[50%] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.05)_80%,transparent)] [clip-path:polygon(38%_0,62%_0,100%_100%,0_100%)]"
              />

              {/* Glass architectural panels */}
              <div aria-hidden="true" className="absolute inset-0 [perspective:1000px]">
                <div
                  className="chrome-glass absolute bottom-[14%] left-[5%] top-[9%] w-[24%] rounded-lg"
                  style={{ transform: 'rotateY(32deg)', transformOrigin: 'left center' }}
                />
                <div
                  className="chrome-glass absolute bottom-[14%] right-[5%] top-[9%] w-[24%] rounded-lg"
                  style={{ transform: 'rotateY(-32deg)', transformOrigin: 'right center' }}
                />
              </div>

              {/* Product floating above the chrome pedestal */}
              <div className="kv-bob absolute inset-x-[27%] bottom-[19%] top-[8%]" style={{ ['--kv-d' as string]: '6s' }}>
                <SafeImage
                  src={HERO_PRODUCT_IMAGE}
                  alt="KOVENIK Mahadev heavyweight tee on display"
                  fill
                  sizes="320px"
                  className="object-contain drop-shadow-[0_26px_30px_rgba(0,0,0,0.7)]"
                />
              </div>
              {/* Pedestal: chrome ellipse with glow */}
              <div
                aria-hidden="true"
                className="absolute inset-x-[14%] bottom-[5%] h-[16%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.35),transparent)] blur-md"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-[18%] bottom-[8%] h-[11%] rounded-[50%] border border-white/60 bg-[linear-gradient(180deg,#f4f6f8,#8a9098_45%,#2a2d32)] shadow-[0_14px_34px_rgba(0,0,0,0.8),inset_0_2px_0_rgba(255,255,255,0.8)]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-[27%] bottom-[11.5%] h-[4%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(0,0,0,0.7),transparent)]"
              />

              {/* Chrome play button with gold triangle */}
              <ChromeRing
                thickness={3}
                className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 group-hover:scale-110"
                innerClassName="flex items-center justify-center bg-kv-bg"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 translate-x-0.5" aria-hidden="true">
                  <path d="M7 4.5v15l12-7.5z" fill="#c9a24a" />
                </svg>
              </ChromeRing>

              <p className="absolute bottom-3 left-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-kv-muted">
                The process film
              </p>
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="max-w-[460px] text-[14px] leading-[1.75] text-kv-body">
              Take a peek behind the curtain and discover how we create each piece with
              meticulous attention to detail, sustainable practices, and a deep respect for
              craftsmanship.
            </p>

            <ol className="mt-8 space-y-6">
              {philosophy.map((item, i) => (
                <li key={item.num} className="flex items-start gap-4">
                  <ChromeRing
                    thickness={2}
                    className="h-11 w-11 shrink-0"
                    innerClassName="flex items-center justify-center bg-kv-bg text-[12px] font-bold text-kv-head"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </ChromeRing>
                  <div>
                    <h3 className="font-bodoni text-[20px] font-medium uppercase leading-[1.15] text-kv-head">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 max-w-[420px] text-[13px] leading-[1.6] text-kv-muted">
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <GoldButton href="/shop" className="mt-9">
              Discover our values
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </GoldButton>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
