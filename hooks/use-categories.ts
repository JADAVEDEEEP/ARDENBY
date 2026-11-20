'use client';

import { useEffect, useState } from 'react';

import { apiUrl } from '@/lib/api-url';

export type StoreCategory = { slug: string; name: string; description?: string | null };

// One shared request + short cache, like use-home-products.
const CACHE_MS = 60_000;
let cached: { at: number; promise: Promise<StoreCategory[]> } | null = null;

function fetchCategories(): Promise<StoreCategory[]> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.promise;

  const promise = (async () => {
    const response = await fetch(apiUrl('/api/categories'));
    if (!response.ok) throw new Error(`Categories API failed with status ${response.status}`);
    const data: any = await response.json();
    const list: unknown = Array.isArray(data)
      ? data
      : Array.isArray(data?.categories)
        ? data.categories
        : Array.isArray(data?.data?.categories)
          ? data.data.categories
          : [];
    return (list as StoreCategory[]).filter((c) => c && typeof c.slug === 'string' && c.slug && c.name);
  })();

  cached = { at: Date.now(), promise };
  promise.catch(() => {
    if (cached?.promise === promise) cached = null;
  });
  return promise;
}

/** The store's real categories, straight from the database (`categories` table). */
export function useCategories() {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((list) => !cancelled && setCategories(list))
      .catch((err) => console.error('Categories API error:', err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading };
}
