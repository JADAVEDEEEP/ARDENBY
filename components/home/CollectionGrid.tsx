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
 * No stock photography. A collection with no visible product uses another KOVENIK product photo; only if
 * there are no product photos at all is a clean branded tile shown (never another brand's image).
 */
export function CollectionGrid({ products }: { products: Product[] }) {
  // A collection with no visible product of its own borrows a photo from the live catalogue, a different
  // one per tile (spread across the list), so a tile is never blank.
  const withPhoto = products.filter((p) => p.images?.[0]);
  const used = new Set<string>();
  const ownPhoto = (slug: string) => withPhoto.find((p) => p.category === slug)?.images[0];
  COLLECTIONS.forEach((c) => {
    const own = ownPhoto(c.slug);
    if (own) used.add(own);
  });
  const spare = withPhoto.map((p) => p.images[0]).filter((url) => !used.has(url));
  let borrowed = 0;
  const pickSpare = () => {
    if (spare.length === 0) return undefined;
    const idx = Math.floor((spare.length / (COLLECTIONS.length + 1)) * (borrowed + 1)) % spare.length;
    borrowed += 1;
    return spare[idx];
  };

  return (
    <section aria-labelledby="home-collections" className="bg-kv-bg py-8 md:py-10">
      <SectionHeader id="home-collections" title="Collections" className="kv-gutter" />

      <ul className="grid grid-cols-2 gap-3 px-3 md:gap-4 md:px-0 lg:grid-cols-4">
        {COLLECTIONS.map((c, i) => {
          const photo = ownPhoto(c.slug) ?? pickSpare();
          const count = products.filter((p) => p.category === c.slug).length;
          return (
            <li key={c.slug}>
              <Link
                href={`/shop?category=${c.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden bg-kv-ink shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow duration-300 hover:shadow-[0_16px_36px_rgba(0,0,0,0.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kv-ink"
              >
                {photo ? (
                  <Image
                    src={photo}
                    alt={`${c.label} collection`}
                    fill
                    loading="lazy"
                    sizes="(min-width: 1600px) 400px, (min-width: 1024px) 25vw, 50vw"
                    className="object-cover object-top transition duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
                  />
                ) : (
                  <span className="absolute inset-0 bg-gradient-to-br from-kv-ink to-[#2a2a2a]" aria-hidden="true" />
                )}

                {/* Collection number, top left */}
                <span className="absolute left-3 top-3 bg-white/90 px-2.5 py-1 font-oswald text-[13px] font-semibold tracking-[0.12em] text-kv-ink shadow-sm">
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Caption on its own dark card, so it reads on any photo */}
                <span className="absolute inset-x-2.5 bottom-2.5 bg-black/75 px-3 py-2.5 text-white md:px-4 md:py-3.5 backdrop-blur-sm md:inset-x-3 md:bottom-3">
                  <span className="block font-oswald text-[17px] font-semibold uppercase leading-tight tracking-[0.05em] md:text-[26px] md:tracking-[0.06em]">
                    {c.label}
                  </span>
                  <span className="mt-1 hidden text-[14px] leading-[1.45] text-white/85 md:block">{c.text}</span>
                  <span className="mt-2 inline-flex items-center gap-1.5 whitespace-nowrap bg-white px-3 py-1.5 text-[11px] md:mt-3 md:gap-2 md:px-4 md:py-2 md:text-[12px] font-bold uppercase tracking-[0.12em] text-kv-ink transition-colors group-hover:bg-kv-gold group-hover:text-white">
                    {count > 0 ? `${count} styles` : 'Shop'}
                    <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
