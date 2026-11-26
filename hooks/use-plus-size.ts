'use client';

import { useMemo } from 'react';

import { inCategory } from '@/components/shop/shop-filters';
import { useHomeProducts } from '@/hooks/use-home-products';

/** True once at least one product belongs to Plus Size (tagged plus-size, or sold in 3XL and above).
 *  Plus Size filters, chips and links use this, so they appear on their own as soon as such a product exists
 *  and stay hidden until then (also while the product feed is still loading). */
export function usePlusSizeAvailable(): boolean {
  const { products } = useHomeProducts();
  return useMemo(() => inCategory(products, 'plus-size').length > 0, [products]);
}
