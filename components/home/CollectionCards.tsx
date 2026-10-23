import Link from 'next/link';

import { ArrowUpRight } from 'lucide-react';

import { categories } from '@/lib/data';
import { cn } from '@/lib/utils';

import { categoryImage } from './home-assets';
import { collectionCopy } from './home-content';
import { GoldButton } from './ui/GoldButton';
import { ProductImage } from './ui/ProductImage';
import { Reveal } from './ui/Reveal';

interface CollectionCardsProps {
  fallbacks: Record<string, string | undefined>;
}

/** Three glass collection cards. The middle one is raised on desktop. */
export function CollectionCards({ fallbacks }: CollectionCardsProps) {
  return (
    <section aria-label="Collections" className="bg-kv-bg px-4 py-8 sm:px-8 lg:px-12 lg:py-14">
      <div className="mx-auto grid max-w-[1440px] gap-5 md:grid-cols-3 md:gap-6 md:items-start">
        {categories.slice(0, 3).map((cat, index) => (
          <Reveal key={cat.slug} delay={index * 0.12} className={cn(index === 1 && 'md:-mt-8')}>
            <Link
              href={`/shop?category=${cat.slug}`}
              className="chrome-focus chrome-glass group relative block overflow-hidden rounded-2xl p-5 transition-[border-color,box-shadow] duration-500 hover:border-white/60 hover:shadow-[0_40px_80px_-30px_rgba(255,255,255,0.2)] lg:p-6"
            >
              {/* Light sweep: continuous, faster on hover */}
              <span
                aria-hidden="true"
                className="kv-card-sweep pointer-events-none absolute inset-y-0 -left-1/2 z-[2] w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)]"
              />

              <div className="relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-xl bg-[radial-gradient(70%_55%_at_50%_85%,rgba(255,255,255,0.16),transparent_70%),linear-gradient(180deg,#1c1e22,#0b0c0e)] md:aspect-[5/4]">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-[16%] bottom-[7%] h-[9%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.45),transparent)]"
                />
                <div className="kv-bob absolute inset-0" style={{ ['--kv-d' as string]: `${5.5 + index * 0.8}s` }}>
                  <ProductImage
                    src={categoryImage(cat.slug)}
                    fallback={fallbacks[cat.slug]}
                    alt={cat.name}
                    sizes="(min-width: 768px) 30vw, 90vw"
                    className="transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                </div>
              </div>

              <div className="relative mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-kv-gold">
                  Collection
                </p>
                <h3 className="chrome-text mt-1.5 font-bodoni text-[28px] font-medium uppercase leading-none lg:text-[32px]">
                  {cat.name}
                </h3>
                <p className="mt-2 max-w-[320px] text-[13px] leading-[1.55] text-kv-body">
                  {collectionCopy[index]}
                </p>
                <GoldButton asText className="mt-4 min-h-[44px] px-6">
                  Shop now
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </GoldButton>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
