import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, Heart, Star } from 'lucide-react';
import { getProductBySlug, getRelatedProducts } from '@/lib/data';
import { formatINR, discountPercent } from '@/lib/format';
import { ProductCard } from '@/components/product/product-card';
import { AddToCart } from './add-to-cart';

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();
  const related = getRelatedProducts(product, 4);

  return (
    <div className="container-ardenby py-10 lg:py-16">
      <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-olive mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
        <div className="grid grid-cols-2 gap-3">
          {product.images.map((image) => (
            <div key={image} className="aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={product.name} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="lg:pt-4">
          <p className="text-xs uppercase tracking-widest text-olive font-semibold">{product.categoryLabel}</p>
          <h1 className="font-display text-3xl lg:text-5xl font-bold mt-3 text-ink">{product.name}</h1>
          <div className="flex items-center gap-2 mt-4">
            <Star className="h-4 w-4 fill-sand text-sand" />
            <span className="font-medium">{product.rating}</span>
            <span className="text-muted-foreground">({product.reviewCount} reviews)</span>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <span className="text-2xl font-bold">{formatINR(product.price)}</span>
            <span className="text-muted-foreground line-through">{formatINR(product.mrp)}</span>
            <span className="text-sm font-semibold text-destructive">{discountPercent(product.mrp, product.price)}% OFF</span>
          </div>
          <p className="mt-6 text-ink-soft leading-relaxed">{product.description}</p>
          <div className="grid grid-cols-2 gap-3 mt-7 text-sm">
            <div className="rounded-xl bg-muted p-4"><span className="text-muted-foreground">Fabric</span><br /><strong>{product.fabricDetails}</strong></div>
            <div className="rounded-xl bg-muted p-4"><span className="text-muted-foreground">Care</span><br /><strong>{product.washCare}</strong></div>
          </div>
          <AddToCart product={product} />
          <div className="mt-6 space-y-2 text-sm text-ink-soft">
            <p className="flex items-center gap-2"><Check className="h-4 w-4 text-olive" /> Free shipping on orders over ₹999</p>
            <p className="flex items-center gap-2"><Check className="h-4 w-4 text-olive" /> 7-day easy returns</p>
          </div>
        </div>
      </div>
      <section className="mt-20">
        <h2 className="font-display text-3xl font-bold mb-6">You may also like</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">{related.map((item, index) => <ProductCard key={item.id} product={item} index={index} />)}</div>
      </section>
    </div>
  );
}
