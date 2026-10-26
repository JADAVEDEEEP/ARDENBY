import { apiUrl } from '@/lib/api-url';
import { normalizeApiProduct } from '@/lib/home-products';
import type { ApiProduct } from '@/lib/home-products';
import type { Product } from '@/types';

/** Canonical origin used for sitemap, canonical URLs and structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kovenik.in').replace(/\/+$/, '');

const FETCH_TIMEOUT_MS = 8000;

/** `status` is 0 when the API could not be reached at all. */
async function getJsonWithStatus(path: string, revalidate: number): Promise<{ status: number; data: unknown | null }> {
  let status = 0;
  // Two attempts: a cold-starting API host can miss the first call.
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(apiUrl(path), {
        next: { revalidate },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      status = response.status;
      if (response.ok) return { status, data: await response.json() };
      // A 404 is an answer, not an outage: do not retry it.
      if (response.status === 404) return { status, data: null };
    } catch (error) {
      console.error('[site] fetch failed:', path, `(attempt ${attempt})`, error instanceof Error ? error.message : error);
    }
  }
  // A slow or unreachable API must never break a page or the sitemap.
  return { status, data: null };
}

async function getJson(path: string, revalidate: number): Promise<unknown | null> {
  return (await getJsonWithStatus(path, revalidate)).data;
}

export interface ProductLookup {
  product: Product | null;
  /** True only when the API answered that this product does not exist. An
   *  unreachable API is NOT "missing", so real products are never 404ed by an outage. */
  missing: boolean;
}

/** One product by slug, from the live API (cached for 5 minutes). */
export async function fetchProduct(slug: string): Promise<ProductLookup> {
  const { status, data } = await getJsonWithStatus(`/api/products/${encodeURIComponent(slug)}`, 300);
  const raw = (data as { product?: ApiProduct } | null)?.product;
  if (!raw || !raw.slug) return { product: null, missing: status === 404 };
  return { product: normalizeApiProduct(raw), missing: false };
}

/** Product list for the sitemap (the API caps a page at 100). */
export async function fetchProductSlugs(): Promise<{ slug: string; updatedAt?: string }[]> {
  const data = (await getJson('/api/products?page=1&limit=100', 3600)) as
    | { products?: (ApiProduct & { updated_at?: string | null })[] }
    | null;
  return (data?.products ?? [])
    .filter((p) => p?.slug)
    .map((p) => ({ slug: p.slug, updatedAt: p.updated_at || p.created_at || undefined }));
}

export async function fetchCategorySlugs(): Promise<string[]> {
  const data = (await getJson('/api/categories', 3600)) as { categories?: { slug?: string }[] } | null;
  return (data?.categories ?? [])
    .map((c) => c.slug)
    .filter((slug): slug is string => Boolean(slug) && slug !== 'all-products');
}
