'use client';

import { useMemo } from 'react';

import { CollectionGrid } from '@/components/home/CollectionGrid';
import { ExploreCategory } from '@/components/home/ExploreCategory';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { MobileCategoryIcons } from '@/components/home/MobileCategoryIcons';
import { MobileShopBar } from '@/components/home/MobileShopBar';
import { Newsletter } from '@/components/home/Newsletter';
import { ProcessSection } from '@/components/home/ProcessSection';
import { ProductRail } from '@/components/home/ProductRail';
import { PromoBanner } from '@/components/home/PromoBanner';
import { USPStrip } from '@/components/home/USPStrip';
import { useHomeProducts } from '@/hooks/use-home-products';

const RAIL_LIMIT = 8;

export default function HomePage() {
  const { products, loading, error, retry } = useHomeProducts();

  // Products flagged as new; if nothing is flagged yet, the latest products.
  const newArrivals = useMemo(() => {
    const flagged = products.filter((p) => p.newArrival);
    return (flagged.length > 0 ? flagged : products).slice(0, RAIL_LIMIT);
  }, [products]);

  return (
    <>
      {/* pb-24 keeps the fixed mobile shop bar from covering the footer. */}
      <div className="kv-flat w-full overflow-x-hidden bg-kv-bg pb-24 md:pb-0">
        <MobileCategoryIcons />
        <HeroCarousel products={products} />
        <USPStrip />
        <PromoBanner products={products} />
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
        <ProcessSection />
        <Newsletter />
      </div>

      <MobileShopBar />
    </>
  );
}
