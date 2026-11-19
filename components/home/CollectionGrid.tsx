import Image from 'next/image';
import Link from 'next/link';

import type { Product } from '@/types';

import { SectionHeader } from './ui/SectionHeader';

const COLLECTIONS = [
  { slug: 'apex-edition', label: 'Apex Edition', text: 'Heavyweight silhouettes for everyday rotation' },
  { slug: 'epic-thread', label: 'Epic Thread', text: 'Premium graphics, clean streetwear finish' },
  { slug: 'ardenby-premium', label: 'Kovenik Premium', text: 'Elevated essentials built for daily wear' },
  { slug: 'the-print-club', label: 'The Print Club', text: 'Limited edition drop artwork' },
] as const;

/**
 * Collections: one tile per collection, each showing a real KOVENIK product from that collection.
 * No stock photography. If a collection has no product photo yet, a clean branded tile is shown
 * instead (never another brand's image).
 */
export function CollectionGrid({ products }: { products: Product[] }) {
  return (
    <section aria-labelledby="home-collections" className="bg-kv-bg py-10 md:py-12">
      <div className="kv-gutter mx-auto w-full max-w-[1600px]">
        <SectionHeader id="home-collections" title="Collections" />

        <ul className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {COLLECTIONS.map((c) => {
            const photo = products.find((p) => p.category === c.slug && p.images?.[0])?.images[0];
            return (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-kv-img">
                    {photo ? (
                      <Image
                        src={photo}
                        alt={`${c.label} collection`}
                        fill
                        loading="lazy"
                        sizes="(min-width: 1600px) 390px, (min-width: 1024px) 25vw, 50vw"
                        className="object-cover object-top transition duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-4 text-center">
                        <span className="font-oswald text-[22px] font-semibold uppercase tracking-[0.12em] text-kv-ink/70 md:text-[28px]">
                          {c.label}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 font-oswald text-[16px] font-semibold uppercase tracking-[0.1em] text-kv-ink transition-colors group-hover:text-kv-gold-text md:text-[18px]">
                    {c.label}
                  </p>
                  <p className="mt-0.5 text-[14px] leading-[1.5] text-kv-sub">{c.text}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
