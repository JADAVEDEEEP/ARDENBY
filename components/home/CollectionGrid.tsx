import Link from 'next/link';

import type { Product } from '@/types';

import { categoryImage, PRODUCT_FALLBACK_IMAGE } from './home-assets';
import { SafeImage } from './ui/SafeImage';
import { SectionHeader } from './ui/SectionHeader';

const COLLECTIONS = [
  { slug: 'supreme-edition', label: 'Supreme Edition', text: 'Heavyweight silhouettes engineered for everyday rotation' },
  { slug: 'epic-thread', label: 'Epic Thread', text: 'Premium graphics with a clean streetwear finish' },
  { slug: 'ardenby-premium', label: 'Kovenik Premium', text: 'Elevated essentials built for daily wear' },
  { slug: 'the-print-club', label: 'The Print Club', text: 'Limited edition drop artwork' },
  { slug: 'top-wear', label: 'Top Wear', text: 'Oversized tees, shirts and hoodies' },
  { slug: 'bottom-wear', label: 'Bottom Wear', text: 'Relaxed cuts to match every drop' },
] as const;

export function CollectionGrid({ products }: { products: Product[] }) {
  // If a category photo is missing, fall back to a real product photo.
  const fallbackFor = (slug: string) =>
    products.find((p) => p.category === slug)?.images?.[0] || products[0]?.images?.[0] || PRODUCT_FALLBACK_IMAGE;

  return (
    <section aria-labelledby="home-collections" className="bg-kv-bg py-10 md:py-14">
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-6">
        <SectionHeader id="home-collections" title="Collections" />

        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-12">
          {COLLECTIONS.map((c) => (
            <li key={c.slug}>
              <Link href={`/shop?category=${c.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-kv-img">
                  <SafeImage
                    src={categoryImage(c.slug)}
                    fallback={fallbackFor(c.slug)}
                    alt=""
                    fill
                    loading="lazy"
                    sizes="(min-width: 1280px) 400px, (min-width: 768px) 33vw, 50vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="mb-1 mt-3.5 text-[12px] font-bold uppercase tracking-[0.24em] text-kv-gold-text">Kovenik</p>
                <h3 className="font-oswald text-[15px] font-semibold uppercase tracking-[0.12em] text-kv-ink transition-colors group-hover:text-kv-gold-text md:text-[18px]">
                  {c.label}
                </h3>
                <p className="mt-1 text-[14px] leading-[1.5] text-kv-sub md:text-[15px]">{c.text}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
