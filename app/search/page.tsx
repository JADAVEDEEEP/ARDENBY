import Link from 'next/link';
import { ProductCard } from '@/components/product/product-card';
import { apiUrl } from '@/lib/api-url';
import { normalizeApiProduct } from '@/lib/home-products';
import type { ApiProduct } from '@/lib/home-products';
import type { Product } from '@/types';

export const dynamic = 'force-dynamic';

const SERIF = { fontFamily: 'Bodoni MT, Didot, Times New Roman, serif' };

async function searchProducts(query: string): Promise<{ products: Product[]; failed: boolean }> {
  try {
    const params = new URLSearchParams({ page: '1', limit: '60' });
    if (query) params.set('search', query);

    const response = await fetch(apiUrl(`/api/products?${params.toString()}`), {
      cache: 'no-store',
    });

    if (!response.ok) return { products: [], failed: true };

    const data = await response.json();
    const list: ApiProduct[] = Array.isArray(data?.products) ? data.products : [];

    return {
      products: list
        .map((item) => normalizeApiProduct(item))
        .filter((product) => Boolean(product.id && product.slug && product.name)),
      failed: false,
    };
  } catch {
    return { products: [], failed: true };
  }
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q?.trim() || '';
  const { products: results, failed } = await searchProducts(query);

  return (
    <main
      className="min-h-[70vh] px-4 py-12 text-[#F3EBDD] sm:px-8 lg:px-10 lg:py-16"
      style={{
        backgroundColor: '#050505',
        backgroundImage:
          'radial-gradient(ellipse 60% 40% at 85% 0%, rgba(201,162,75,0.12), transparent 70%)',
      }}
    >
      <div className="mx-auto max-w-[1360px]">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rotate-45 bg-[#C9A24B]" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C9A24B]">
            Search
          </p>
        </div>

        <h1 className="text-[32px] leading-tight sm:text-[44px]" style={SERIF}>
          {query ? `Results for “${query}”` : 'All products'}
        </h1>

        {!failed && (
          <p className="mt-2 text-[13px] text-[#F3EBDD]/60">
            {results.length} {results.length === 1 ? 'product' : 'products'} found
          </p>
        )}

        {results.length ? (
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {results.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-dashed border-[#C9A24B]/30 bg-[#0A0A0A] px-6 py-16 text-center">
            <p className="text-[15px] text-[#F3EBDD]/70">
              {failed
                ? 'Search is temporarily unavailable. Please try again shortly.'
                : 'No products matched your search.'}
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex min-h-[48px] items-center rounded-lg bg-[linear-gradient(135deg,#9C7A32_0%,#E6CF92_45%,#B8903A_100%)] px-8 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0A0A0A] transition hover:brightness-110"
            >
              Browse all products
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
