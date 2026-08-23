import { ProductCard } from '@/components/product/product-card';
import { products } from '@/lib/data';

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q?.trim() || '';
  const results = query ? products.filter((product) => `${product.name} ${product.tags.join(' ')} ${product.categoryLabel}`.toLowerCase().includes(query.toLowerCase())) : products;
  return <div className="container-ardenby py-12"><p className="text-xs uppercase tracking-widest text-olive font-semibold">Search</p><h1 className="font-display text-4xl font-bold mt-2">{query ? `Results for “${query}”` : 'All products'}</h1><p className="text-muted-foreground mt-2">{results.length} products found</p>{results.length ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-10">{results.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <div className="py-20 text-center text-muted-foreground">No products matched your search.</div>}</div>;
}
