import type {
  CategorySlug,
  CoverageType,
  FabricType,
  FitType,
  Product,
  ProductColor,
  ProductSize,
  ProductVariant,
} from '@/types';

/* Normalizers for the homepage product feed. Moved verbatim (behaviour-wise)
 * from app/page.tsx so the API shape, static fallbacks and the Product type
 * stay exactly as before. */

export type ApiProduct = {
  id: string;
  slug: string;
  name: string;
  category_slug?: string | null;
  category_label?: string | null;
  fit?: string | null;
  fabric?: string | null;
  coverage?: string | null;
  price?: number | string | null;
  mrp?: number | string | null;
  best_price?: number | string | null;
  rating?: number | string | null;
  review_count?: number | string | null;
  description?: string | null;
  fabric_details?: string | null;
  wash_care?: string | null;
  tags?: string | string[] | null;
  best_seller?: boolean;
  new_arrival?: boolean;
  trending?: boolean;
  limited_edition?: boolean;
  inventory?: number | string | null;
  back_image?: string | null;
  frames_360?: string[] | null;
  created_at?: string | null;
  images?: {
    id?: string;
    image_url?: string;
    sort_order?: number;
    is_primary?: boolean;
  }[];
  variants?: {
    id?: string;
    product_id?: string;
    size?: string;
    color?: string;
    inventory?: number | string;
    sku?: string | null;
  }[];
};

/** Loosely-typed static product (legacy dummy data may use snake_case keys). */
type StaticProductInput = Partial<Product>;

function splitTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.map(String);
  if (tags) {
    return String(tags)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function normalizeApiProduct(product: ApiProduct): Product {
  const variants: ProductVariant[] = Array.isArray(product.variants)
    ? product.variants
        .filter((variant) => variant?.size && variant?.color)
        .map((variant) => ({
          id: String(variant.id ?? ''),
          product_id: variant.product_id || product.id,
          size: String(variant.size) as ProductSize,
          color: String(variant.color) as ProductColor,
          inventory: Number(variant.inventory || 0),
          sku: variant.sku || '',
        }))
    : [];

  const images = Array.isArray(product.images)
    ? [...product.images]
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        .map((image) => image?.image_url)
        .filter((url): url is string => Boolean(url))
    : [];

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: (product.category_slug || '') as CategorySlug,
    categoryLabel: product.category_label || '',
    fit: (product.fit || '') as FitType,
    fabric: (product.fabric || '') as FabricType,
    coverage: (product.coverage || '') as CoverageType,
    colors: unique(variants.map((variant) => variant.color).filter(Boolean)),
    sizes: unique(variants.map((variant) => variant.size).filter(Boolean)),
    variants,
    images,
    backImage: product.back_image || undefined,
    frames360: Array.isArray(product.frames_360) && product.frames_360.length ? product.frames_360 : undefined,
    fabricImage: images[0] || '',
    price: Number(product.price || 0),
    mrp: product.mrp == null ? (undefined as unknown as number) : Number(product.mrp),
    bestPrice: Number(product.best_price || 0),
    rating: Number(product.rating || 0),
    reviewCount: Number(product.review_count || 0),
    reviews: [],
    description: product.description || '',
    fabricDetails: product.fabric_details || '',
    washCare: product.wash_care || '',
    tags: splitTags(product.tags),
    bestSeller: Boolean(product.best_seller),
    newArrival: Boolean(product.new_arrival),
    trending: Boolean(product.trending),
    limitedEdition: Boolean(product.limited_edition),
    inventory: Number(product.inventory || 0),
  };
}

export function normalizeStaticProduct(product: StaticProductInput): Product {
  const variants: ProductVariant[] = Array.isArray(product.variants)
    ? product.variants
    : [];

  const rawImages: unknown[] = Array.isArray(product.images) ? product.images : [];
  const images = rawImages
    .map((image) =>
      typeof image === 'string'
        ? image
        : (image as { image_url?: string } | null)?.image_url
    )
    .filter((url): url is string => Boolean(url));

  const sizes: ProductSize[] =
    Array.isArray(product.sizes) && product.sizes.length
      ? product.sizes
      : unique(variants.map((variant) => variant?.size).filter(Boolean));

  const colors: ProductColor[] =
    Array.isArray(product.colors) && product.colors.length
      ? product.colors
      : unique(variants.map((variant) => variant?.color).filter(Boolean));

  const snake = (key: string): unknown =>
    (product as Record<string, unknown>)[key];

  return {
    ...(product as Product),
    id: String(product.id ?? ''),
    slug: String(product.slug ?? ''),
    name: String(product.name ?? ''),
    category: (product.category || snake('category_slug') || '') as CategorySlug,
    categoryLabel: String(
      product.categoryLabel || snake('category_label') || ''
    ),
    fit: (product.fit || '') as FitType,
    fabric: (product.fabric || '') as FabricType,
    coverage: (product.coverage || '') as CoverageType,
    price: Number(product.price || 0),
    mrp: product.mrp == null ? (undefined as unknown as number) : Number(product.mrp),
    bestPrice: Number(product.bestPrice ?? snake('best_price') ?? 0),
    rating: Number(product.rating || 0),
    reviewCount: Number(product.reviewCount ?? snake('review_count') ?? 0),
    description: product.description || '',
    fabricDetails: String(product.fabricDetails || snake('fabric_details') || ''),
    washCare: String(product.washCare || snake('wash_care') || ''),
    tags: splitTags(product.tags),
    bestSeller: Boolean(product.bestSeller ?? snake('best_seller')),
    newArrival: Boolean(product.newArrival ?? snake('new_arrival')),
    trending: Boolean(product.trending),
    limitedEdition: Boolean(product.limitedEdition ?? snake('limited_edition')),
    inventory: Number(product.inventory || 0),
    images,
    variants,
    sizes,
    colors,
    fabricImage: product.fabricImage || images[0] || '',
    reviews: Array.isArray(product.reviews) ? product.reviews : [],
  };
}
