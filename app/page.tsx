'use client';

import { useMemo } from 'react';

import { CollectionGrid } from '@/components/home/CollectionGrid';
import { ExploreCategory } from '@/components/home/ExploreCategory';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { MobileCategoryIcons } from '@/components/home/MobileCategoryIcons';
import { MembershipBanner } from '@/components/home/MembershipBanner';
import { Newsletter } from '@/components/home/Newsletter';
import { ProductRail } from '@/components/home/ProductRail';
import { USPStrip } from '@/components/home/USPStrip';
import { useHomeProducts } from '@/hooks/use-home-products';
import { isNewCollection, prioritizeNewCollection } from '@/lib/new-collection';


export default function HomePage() {
  const { products: feed, loading, error, retry } = useHomeProducts();

  // The 34 imported catalogue products lead every product section (see lib/new-collection.ts); the older
  // products stay in the list after them, so sections that look for a specific collection still find them.
  const products = useMemo(() => prioritizeNewCollection(feed), [feed]);
  // New Arrivals shows exactly the 34, read live from the API.
  const newArrivals = useMemo(() => products.filter(isNewCollection), [products]);

  return (
    <>
      <div className="kv-flat w-full overflow-x-clip bg-kv-bg">
        <MobileCategoryIcons />
        <HeroCarousel products={products} />
        <USPStrip />
        <ProductRail
          id="home-new-arrivals"
          title="New arrivals"
          products={newArrivals}
          loading={loading}
          error={error}
          onRetry={retry}
        />
        <CollectionGrid products={products} />
        <ExploreCategory products={products} loading={loading} error={error} onRetry={retry} />
        <MembershipBanner />
        <Newsletter />
      </div>

    </>
  );
}
