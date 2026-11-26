'use client';

import Link from 'next/link';

import { usePlusSizeAvailable } from '@/hooks/use-plus-size';

import { categoryImage } from './home-assets';
import { SafeImage } from './ui/SafeImage';

const ITEMS = [
  { slug: 'all-products', label: 'All Products', href: '/shop' },
  { slug: 'apex-edition', label: 'Apex Edition', href: '/shop?category=apex-edition' },
  { slug: 'epic-thread', label: 'Epic Thread', href: '/shop?category=epic-thread' },
  { slug: 'ardenby-premium', label: 'Kovenik Premium', href: '/shop?category=ardenby-premium' },
  { slug: 'the-print-club', label: 'The Print Club', href: '/shop?category=the-print-club' },
  { slug: 'top-wear', label: 'Top Wear', href: '/shop?category=top-wear' },
  { slug: 'plus-size', label: 'Plus Size', href: '/shop?category=plus-size' },
  { slug: 'bottom-wear', label: 'Bottom Wear', href: '/shop?category=bottom-wear' },
] as const;

/** Mobile only: swipeable round category icons with a gold ring. */
export function MobileCategoryIcons() {
  const plusSize = usePlusSizeAvailable();
  return (
    <nav aria-label="Shop by category" className="bg-kv-bg md:hidden">
      <ul className="kv-rail flex gap-4 overflow-x-auto px-4 py-4">
        {ITEMS.filter((item) => item.slug !== 'plus-size' || plusSize).map((item) => (
          <li key={item.slug} className="w-[80px] shrink-0">
            <Link href={item.href} className="flex flex-col items-center gap-2">
              <span className="relative block h-[68px] w-[68px] overflow-hidden rounded-full border-2 border-kv-gold bg-kv-img">
                <SafeImage src={categoryImage(item.slug)} alt="" fill sizes="68px" className="object-cover" />
              </span>
              <span className="line-clamp-2 text-center text-[12px] font-bold leading-[1.25] text-kv-ink">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
