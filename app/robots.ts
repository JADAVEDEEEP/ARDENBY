import type { MetadataRoute } from 'next';

import { IS_STAGING, SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  // A staging copy must never appear in search results.
  if (IS_STAGING) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

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
