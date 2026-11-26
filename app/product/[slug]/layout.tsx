import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { fetchProduct, SITE_URL } from '@/lib/site';
import type { Product } from '@/types';

type Props = { children: ReactNode; params: { slug: string } };

const trim = (text: string, max = 160) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
};

const productUrl = (slug: string) => `${SITE_URL}/product/${encodeURIComponent(slug)}`;

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { product, missing } = await fetchProduct(params.slug);

  if (missing) {
    return { title: 'Product not found | KOVENIK', robots: { index: false, follow: false } };
  }
  // API unreachable: keep the site-wide defaults instead of guessing.
  if (!product) return {};

  const title = `${product.name} | KOVENIK`;
  const description = trim(
    product.description ||
      `${product.name} from KOVENIK. Premium men's streetwear crafted for the bold.`
  );
  const image = product.images[0];

  return {
    title,
    description,
    alternates: { canonical: productUrl(product.slug) },
    openGraph: {
      type: 'website',
      title,
      description,
      url: productUrl(product.slug),
      siteName: 'KOVENIK',
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/** schema.org Product from real fields only: no ratings are emitted because the
 *  store has no verified review data to back them. */
function productJsonLd(product: Product) {
  const stock = product.variants.length
    ? product.variants.reduce((sum, v) => sum + Number(v.inventory || 0), 0)
    : Number(product.inventory || 0);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: trim(product.description || product.name, 500),
    url: productUrl(product.slug),
    ...(product.images.length ? { image: product.images } : {}),
    brand: { '@type': 'Brand', name: 'KOVENIK' },
    ...(product.categoryLabel ? { category: product.categoryLabel } : {}),
    ...(product.colors.length ? { color: product.colors.join(', ') } : {}),
    offers: {
      '@type': 'Offer',
      url: productUrl(product.slug),
      priceCurrency: 'INR',
      price: Number(product.price) || 0,
      itemCondition: 'https://schema.org/NewCondition',
      availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
}

export default async function ProductLayout({ children, params }: Props) {
  const { product, missing } = await fetchProduct(params.slug);

  // A real 404 status for a product that does not exist (never for an outage).
  if (missing) notFound();

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          // `<` is escaped so product text can never close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)).replace(/</g, '\\u003c') }}
        />
      )}
      {children}
    </>
  );
}
