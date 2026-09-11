import { Suspense } from 'react';

import { ShopClient } from './shop-client';

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="container-ardenby py-10">
          <div className="h-9 w-56 rounded-lg bg-muted" />
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="aspect-[3/4] rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      }
    >
      <ShopClient />
    </Suspense>
  );
}
