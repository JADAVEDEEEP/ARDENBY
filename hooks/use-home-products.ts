'use client';

import { useEffect, useMemo, useState } from 'react';

import { apiUrl } from '@/lib/api-url';
import { products as staticProducts } from '@/lib/data';
import {
  normalizeApiProduct,
  normalizeStaticProduct,
} from '@/lib/home-products';
import type { ApiProduct } from '@/lib/home-products';
import type { Product } from '@/types';

// Several components (home sections, nav mega menu) ask for the same list, so
// they share one in-flight request and a short-lived cache.
const CACHE_MS = 60_000;
let cached: { at: number; promise: Promise<Product[]> } | null = null;

function fetchLiveProducts(): Promise<Product[]> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.promise;

  const promise = (async () => {
    const response = await fetch(apiUrl('/api/products?page=1&limit=1000'), {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Products API failed with status ${response.status}`);
    }

    const data: unknown = await response.json();
    const payload = (data ?? {}) as {
      products?: ApiProduct[];
      data?: ApiProduct[];
    };

    const apiProducts: ApiProduct[] = Array.isArray(payload.products)
      ? payload.products
      : Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(data)
          ? (data as ApiProduct[])
          : [];

    return apiProducts
      .map((product) => normalizeApiProduct(product))
      .filter((product) => Boolean(product.id && product.slug && product.name));
  })();

  cached = { at: Date.now(), promise };
  // A failed request must not be cached.
  promise.catch(() => {
    if (cached?.promise === promise) cached = null;
  });

  return promise;
}

/** Product feed for the storefront. Only database products are ever returned:
 *  they are the only ones that can be added to a cart and bought.
 *  `staticHomeProducts` is exposed ONLY as decorative imagery for category tiles. */
export function useHomeProducts() {
  const staticHomeProducts = useMemo(
    () => staticProducts.map((p) => normalizeStaticProduct(p)),
    []
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError('');

    fetchLiveProducts()
      .then((live) => {
        if (!cancelled) setProducts(live);
      })
      .catch((err) => {
        console.error('Home products API error:', err);
        if (!cancelled) {
          setProducts([]);
          setError('Products are temporarily unavailable. Please try again shortly.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { products, staticHomeProducts, loading, error };
}
