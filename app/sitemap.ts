import type { MetadataRoute } from 'next';

import { fetchCategorySlugs, fetchProductSlugs, SITE_URL } from '@/lib/site';

export const revalidate = 3600;

/** Informational pages that exist in app/[...slug]. */
const INFO_PAGES = [
  'about',
  'contact',
  'shipping',
  'returns',
  'size-guide',
  'faqs',
  'privacy',
  'terms',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([fetchProductSlugs(), fetchCategorySlugs()]);

  const entry = (
    path: string,
    changeFrequency: 'daily' | 'weekly' | 'monthly',
    priority: number,
    lastModified?: string
  ) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
    ...(lastModified && !Number.isNaN(Date.parse(lastModified)) ? { lastModified: new Date(lastModified) } : {}),
  });

  return [
    entry('/', 'daily', 1),
    entry('/shop', 'daily', 0.9),
    ...categories.map((slug) => entry(`/shop?category=${encodeURIComponent(slug)}`, 'weekly', 0.7)),
    ...products.map((p) => entry(`/product/${encodeURIComponent(p.slug)}`, 'weekly', 0.8, p.updatedAt)),
    ...INFO_PAGES.map((slug) => entry(`/${slug}`, 'monthly', 0.3)),
  ];
}
