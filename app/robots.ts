import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private, transactional or non-content areas.
        disallow: ['/admin', '/superadmin', '/api/', '/cart', '/checkout', '/orders', '/profile', '/wishlist', '/search'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
