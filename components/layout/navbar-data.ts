import { products } from '@/lib/data';

export const topNavItems = [
  {
    label: 'SUPREME EDITION',
    slug: 'supreme-edition',
    desc: 'Heavyweight oversized drops',
  },
  {
    label: 'EPIC THREAD',
    slug: 'epic-thread',
    desc: 'Graphic & printed tees',
  },
  {
    label: 'ARDENBY PREMIUM',
    slug: 'ardenby-premium',
    desc: 'Long-staple cotton essentials',
  },
  {
    label: 'THE PRINT CLUB',
    slug: 'the-print-club',
    desc: 'Bold prints & puff graphics',
  },
  {
    label: 'TOP WEAR',
    slug: 'top-wear',
    desc: 'Hoodies & sweatshirts',
  },
  {
    label: 'PLUS SIZE',
    slug: 'plus-size',
    desc: 'Relaxed fits up to XXL',
  },
  {
    label: 'BOTTOM WEAR',
    slug: 'bottom-wear',
    desc: 'Cargos & joggers',
  },
  {
    label: 'ALL PRODUCTS',
    slug: 'all-products',
    desc: 'Browse the complete collection',
  },
] as const;

/* =========================================================
   DYNAMIC MEGA MENU
   Products are automatically picked from existing data
========================================================= */

export const megaMenu = topNavItems.map((category) => {
  const featured =
    category.slug === 'all-products'
      ? products.slice(0, 8)
      : products
          .filter(
            (product) =>
              product.category === category.slug
          )
          .slice(0, 8);

  return {
    title: category.label,
    slug: category.slug,
    desc: category.desc,
    featured,
  };
});