import Image from 'next/image';
import Link from 'next/link';

import type { Product } from '@/types';

import { SafeImage } from './ui/SafeImage';
import { SectionHeader } from './ui/SectionHeader';

const MARQUEE_TEXT = 'THE PRINT CLUB ✦ LIMITED EDITION DROP ✦ ZERO RESTOCKS ✦ 240 GSM ✦';
const MARQUEE_REPEAT = 6;

/** Up to three real products for "In this drop": The Print Club first, then
 *  limited-edition and new pieces to fill the row. */
function pickDrop(products: Product[]): Product[] {
  const withImage = products.filter((p) => p.images?.[0]);
  const picked: Product[] = [];
  const add = (list: Product[]) => {
    for (const p of list) {
      if (picked.length < 3 && !picked.includes(p)) picked.push(p);
    }
  };
  add(withImage.filter((p) => p.category === 'the-print-club'));
  add(withImage.filter((p) => p.limitedEdition));
  add(withImage.filter((p) => p.newArrival));
  add(withImage);
  return picked;
}

export function PromoBanner({ products }: { products: Product[] }) {
  const drop = pickDrop(products);

  return (
    <section aria-labelledby="home-new-in" className="w-full bg-kv-bg">
      <div className="kv-gutter pb-6 pt-10 md:pb-8 md:pt-14">
        <SectionHeader id="home-new-in" title="New in" className="mb-0 md:mb-0" />
      </div>

      {/* Full-bleed banner: 100% of the viewport, no container, no radius */}
      <div className="on-dark grid w-full bg-kv-ink md:min-h-[580px] md:grid-cols-2">
        <div className="relative order-1 h-[320px] w-full md:order-2 md:h-auto">
          <Image
            src="/images/print-club-campaign.png"
            alt="Model in an oversized cream KOVENIK tee with the chest badge, from The Print Club drop"
            fill
            loading="lazy"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover object-[50%_20%]"
          />
        </div>

        <div className="order-2 flex flex-col justify-center px-4 py-10 md:order-1 md:px-16 md:py-[72px]">
          <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-kv-gold-dark md:text-[13px]">
            Limited edition drop · 01
          </p>
          <h3 className="mt-4 font-oswald text-[48px] font-bold uppercase leading-[0.95] text-white md:text-[84px]">
            The Print
            <br />
            Club
          </h3>
          <p className="mt-5 max-w-[460px] text-[15px] leading-[1.6] text-kv-mist md:text-[17px]">
            Original high-density DTF and puff graphic designs. Exclusive runs with zero restocks.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop?category=the-print-club"
              className="inline-flex min-h-[48px] items-center justify-center bg-kv-gold px-8 text-[14px] font-bold uppercase tracking-[0.1em] text-kv-ink transition-colors hover:bg-kv-gold-dark md:min-h-[52px] md:text-[15px]"
            >
              Shop the drop
            </Link>
            <Link
              href="/shop"
              className="inline-flex min-h-[48px] items-center justify-center border-2 border-white px-8 text-[14px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white hover:text-kv-ink md:min-h-[52px] md:text-[15px]"
            >
              View lookbook
            </Link>
          </div>

          {drop.length > 0 && (
            <div className="mt-9">
              <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-kv-gold-dark md:text-[13px]">In this drop</p>
              <ul className="mt-3 grid grid-cols-3 gap-3 md:flex md:gap-4">
                {drop.map((p) => (
                  <li key={p.id} className="min-w-0 md:w-[104px]">
                    <Link href={`/product/${p.slug}`} className="group block">
                      <span className="relative block aspect-[104/128] w-full overflow-hidden bg-kv-img">
                        <SafeImage
                          src={p.images[0]}
                          alt={p.name}
                          fill
                          sizes="104px"
                          className="object-cover object-top transition duration-300 group-hover:scale-105"
                        />
                      </span>
                      <span className="mt-2 line-clamp-2 block text-[14px] font-semibold leading-[1.3] text-white group-hover:text-kv-gold-dark">
                        {p.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Gold marquee strip: scrolls left forever; static for reduced motion */}
      <div className="w-full overflow-hidden bg-kv-gold" role="marquee" aria-label={MARQUEE_TEXT}>
        <div className="kv-marquee flex w-max" aria-hidden="true">
          {[0, 1].map((group) => (
            <div key={group} className="flex shrink-0">
              {Array.from({ length: MARQUEE_REPEAT }).map((_, i) => (
                <span
                  key={i}
                  className="whitespace-nowrap px-3 py-3 font-oswald text-[16px] font-semibold uppercase tracking-[0.14em] text-kv-ink md:text-[18px]"
                >
                  {MARQUEE_TEXT}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
