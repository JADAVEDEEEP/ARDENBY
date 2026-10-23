'use client';

import { useMemo } from 'react';

import { MotionConfig } from 'framer-motion';

import { CategoryOrbit } from '@/components/home/CategoryOrbit';
import { CollectionCards } from '@/components/home/CollectionCards';
import { CraftedSection } from '@/components/home/CraftedSection';
import { EditorialStatement } from '@/components/home/EditorialStatement';
import { ExploreCategory } from '@/components/home/ExploreCategory';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { HeroSection } from '@/components/home/HeroSection';
import { MobileShopBar } from '@/components/home/MobileShopBar';
import { Newsletter } from '@/components/home/Newsletter';
import { Testimonials } from '@/components/home/Testimonials';
import { useHomeProducts } from '@/hooks/use-home-products';
import { categories } from '@/lib/data';
import { pickFeaturedDrop } from '@/lib/featured-drop';

export default function HomePage() {
  const { products, staticHomeProducts, loading, error } = useHomeProducts();

  const bestSellers = useMemo(
    () => products.filter((p) => p.bestSeller),
    [products]
  );

  // Same picks as before: top 3 best sellers, topped up with trending / new.
  const featured = useMemo(() => {
    const picks = bestSellers.slice(0, 3);
    if (picks.length >= 3) return picks;
    const ids = new Set(picks.map((p) => p.id));
    const extra = products.filter(
      (p) => !ids.has(p.id) && (p.trending || p.newArrival)
    );
    return [...picks, ...extra].slice(0, 3);
  }, [bestSellers, products]);

  const featuredDrop = useMemo(() => pickFeaturedDrop(products), [products]);

  // If a category image is missing, fall back to a real product photo.
  const fallbacks = useMemo(() => {
    const firstImage = (p?: { images?: string[] }) => p?.images?.[0];
    const map: Record<string, string | undefined> = {};

    categories.forEach((cat, index) => {
      map[cat.slug] =
        firstImage(staticHomeProducts.find((p) => p.category === cat.slug)) ||
        firstImage(products.find((p) => p.category === cat.slug)) ||
        firstImage(products[index]) ||
        firstImage(bestSellers[index]);
    });

    return map;
  }, [staticHomeProducts, products, bestSellers]);

  return (
    <MotionConfig reducedMotion="user">
      {/* pb-24 keeps the floating mobile shop bar from covering the footer. */}
      <div
        className="chrome-scope w-full overflow-x-hidden bg-kv-bg pb-24 text-kv-body selection:bg-white selection:text-black md:pb-0"
        style={{ fontFamily: 'var(--font-archivo), Inter, Arial, sans-serif' }}
      >
        <HeroSection productCount={products.length} featuredDrop={featuredDrop} />
        <CategoryOrbit fallbacks={fallbacks} />
        <CollectionCards fallbacks={fallbacks} />
        <EditorialStatement fallbacks={fallbacks} />
        <ExploreCategory products={products} loading={loading} error={error} />
        <CraftedSection />
        <FeaturedProducts featured={featured} />
        <Testimonials />
        <Newsletter />
      </div>

      <MobileShopBar />
    </MotionConfig>
  );
}
