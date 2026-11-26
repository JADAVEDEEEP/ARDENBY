import Image from 'next/image';
import Link from 'next/link';

import type { Product } from '@/types';

import { hasPlainBackground } from '@/lib/new-collection';

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

  // Covers come from the photos that have a clean studio background (no printed text), one per tile and a
  // different garment colour each where possible. If none exist, the older per-collection logic below applies.
  const plain = withPhoto.filter(hasPlainBackground).sort((a, b) => a.id.localeCompare(b.id));
  const covers: string[] = [];
  const colours = new Set<string>();
  plain.forEach((p) => {
    const colour = String(p.colors?.[0] ?? p.id);
    if (covers.length < COLLECTIONS.length && !colours.has(colour)) {
      colours.add(colour);
      covers.push(p.images[0]);
    }
  });
  plain.forEach((p) => {
    if (covers.length < COLLECTIONS.length && !covers.includes(p.images[0])) covers.push(p.images[0]);
  });

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
    <section aria-labelledby="home-collections" className="bg-kv-bg py-10 md:py-12">
      <div className="mx-auto w-full max-w-[760px] px-3 sm:px-6">
        <SectionHeader id="home-collections" title="Collections" titleClassName="text-[28px] md:text-[36px]" />

        {/* Always 2 columns, even on the smallest phones. */}
        <ul className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-x-[10px] gap-y-6 sm:gap-x-6 sm:gap-y-12">
          {COLLECTIONS.map((c, i) => {
            const photo = covers[i] ?? ownPhoto(c.slug) ?? pickSpare();
            return (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kv-ink">
                  <div className="relative aspect-[4/5] overflow-hidden bg-kv-img">
                    {photo ? (
                      <Image
                        src={photo}
                        alt={`${c.label} collection`}
                        fill
                        loading="lazy"
                        sizes="(min-width: 808px) 368px, 50vw"
                        className="object-cover object-[50%_12%] transition duration-500 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-4 text-center">
                        <span className="font-oswald text-[22px] font-semibold uppercase tracking-[0.12em] text-kv-ink/70 md:text-[28px]">
                          {c.label}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 font-oswald text-[14px] font-semibold uppercase leading-snug tracking-[0.04em] text-kv-ink transition-colors sm:text-[24px] sm:font-bold sm:tracking-[0.06em] [@media(hover:hover)]:group-hover:text-kv-gold-text">
                    {c.label}
                  </p>
                  <p className="mt-0.5 hidden line-clamp-2 text-[15px] leading-[1.5] text-kv-sub sm:block">{c.text}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
