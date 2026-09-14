import { products } from '@/lib/data';

export const megaMenu = [
  {
    title: 'Supreme Edition',
    slug: 'supreme-edition',
    desc: 'Heavyweight oversized cotton',
    featured: products.filter((p) => p.category === 'supreme-edition').slice(0, 3),
  },
  {
    title: 'Epic Thread',
    slug: 'epic-thread',
    desc: 'Graphic & printed tees',
    featured: products.filter((p) => p.category === 'epic-thread').slice(0, 3),
  },
  {
    title: 'Ardenby Premium',
    slug: 'ardenby-premium',
    desc: 'Long-staple cotton essentials',
    featured: products.filter((p) => p.category === 'ardenby-premium').slice(0, 3),
  },
  {
    title: 'The Print Club',
    slug: 'the-print-club',
    desc: 'Bold prints & puff graphics',
    featured: products.filter((p) => p.category === 'the-print-club').slice(0, 3),
  },
];

export const topNavItems = [
  { label: 'SUPREME EDITION', slug: 'supreme-edition' },
  { label: 'EPIC THREAD', slug: 'epic-thread' },
  { label: 'ARDENBY PREMIUM', slug: 'ardenby-premium' },
  { label: 'THE PRINT CLUB', slug: 'the-print-club' },
  { label: 'TOP WEAR', slug: 'top-wear' },
  { label: 'PLUS SIZE', slug: 'plus-size' },
  { label: 'BOTTOM WEAR', slug: 'bottom-wear' },
  { label: 'ALL PRODUCTS', slug: 'all-products' },
];
