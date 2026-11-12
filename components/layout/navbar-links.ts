/** The one primary navigation, shared by the desktop header and the mobile drawer. */
export const COLLECTION_LINKS = [
  { label: 'Supreme Edition', slug: 'supreme-edition', href: '/shop?category=supreme-edition' },
  { label: 'Epic Thread', slug: 'epic-thread', href: '/shop?category=epic-thread' },
  { label: 'Kovenik Premium', slug: 'ardenby-premium', href: '/shop?category=ardenby-premium' },
  { label: 'The Print Club', slug: 'the-print-club', href: '/shop?category=the-print-club' },
] as const;

export const PRIMARY_LINKS = [
  { label: 'Shop All', href: '/shop', key: 'shop' },
  { label: 'New In', href: '/shop?sort=new', key: 'new' },
  { label: 'Top Wear', href: '/shop?category=top-wear', key: 'top-wear' },
  { label: 'Bottom Wear', href: '/shop?category=bottom-wear', key: 'bottom-wear' },
  { label: 'Plus Size', href: '/shop?category=plus-size', key: 'plus-size' },
  { label: 'Collections', href: '/shop', key: 'collections' },
  { label: 'Best Sellers', href: '/shop?collection=bestSeller', key: 'best' },
] as const;

/** Categories shown beside the collections in the desktop dropdown. */
export const CATEGORY_LINKS = [
  { label: 'Top Wear', slug: 'top-wear', href: '/shop?category=top-wear' },
  { label: 'Bottom Wear', slug: 'bottom-wear', href: '/shop?category=bottom-wear' },
  { label: 'Plus Size', slug: 'plus-size', href: '/shop?category=plus-size' },
  { label: 'Shop All', slug: 'all', href: '/shop' },
] as const;
