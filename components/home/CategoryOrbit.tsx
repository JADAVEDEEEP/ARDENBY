import Link from 'next/link';

import { categories } from '@/lib/data';
import { cn } from '@/lib/utils';

import { categoryImage } from './home-assets';
import { ChromeRing } from './ui/ChromeRing';
import { ProductImage } from './ui/ProductImage';
import { Reveal } from './ui/Reveal';

interface CategoryOrbitProps {
  /** slug -> fallback image (a real product photo) if the category image 404s. */
  fallbacks: Record<string, string | undefined>;
}

// "All Products" leads the rail, the rest keep their catalogue order.
const railCategories = [...categories].sort(
  (a, b) => Number(b.slug === 'all-products') - Number(a.slug === 'all-products')
);

/** Circular chrome-ring categories. Desktop: even grid. Mobile: swipe row. */
export function CategoryOrbit({ fallbacks }: CategoryOrbitProps) {
  return (
    <section aria-label="Shop by category" className="bg-kv-bg">
      <Reveal className="no-scrollbar mx-auto flex w-full max-w-[1440px] snap-x gap-5 overflow-x-auto px-4 py-8 sm:gap-7 sm:px-8 lg:justify-between lg:gap-4 lg:px-12 lg:py-10">
        {railCategories.map((cat, index) => {
          const active = index === 0;
          return (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="chrome-focus group flex w-[76px] shrink-0 snap-start flex-col items-center gap-3 sm:w-[92px] lg:w-[110px]"
            >
              <ChromeRing
                active={active}
                className="h-[72px] w-[72px] transition-transform duration-300 group-hover:scale-105 sm:h-[88px] sm:w-[88px] lg:h-[104px] lg:w-[104px]"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_75%,rgba(255,255,255,0.16),transparent),linear-gradient(180deg,#1c1e22,#0b0c0e)]"
                />
                <ProductImage
                  src={categoryImage(cat.slug)}
                  fallback={fallbacks[cat.slug]}
                  alt=""
                  fit="circle"
                  vignette={false}
                  sizes="(min-width: 1024px) 104px, 88px"
                  className="transition-transform duration-500 group-hover:scale-110"
                />
              </ChromeRing>
              <span
                className={cn(
                  'line-clamp-2 text-center text-[10px] font-semibold uppercase leading-[1.3] tracking-[0.12em] transition-colors sm:text-[11px]',
                  active ? 'text-white' : 'text-kv-body group-hover:text-white'
                )}
              >
                {cat.name}
              </span>
            </Link>
          );
        })}
      </Reveal>
    </section>
  );
}
