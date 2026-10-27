import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ShopClient } from './shop-client';

export const metadata: Metadata = {
  title: 'Shop All | KÖVENIK',
  description: "Shop KÖVENIK oversized tees, graphic prints and everyday essentials. Premium men's streetwear crafted for the bold.",
  alternates: { canonical: '/shop' },
};

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="kvl min-h-screen bg-[var(--ivory)] px-4 py-10 lg:pl-[336px] lg:pr-12">
          <div className="kvl-skeleton h-9 w-56" />
          <div className="mt-8 grid grid-cols-2 gap-x-2.5 gap-y-[26px] md:grid-cols-3 lg:grid-cols-4 lg:gap-x-[22px] lg:gap-y-11">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="kvl-skeleton aspect-[4/5]" />
            ))}
          </div>
        </div>
      }
    >
      <ShopClient />
    </Suspense>
  );
}
