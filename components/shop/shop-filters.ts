import { prioritizeNewCollection } from '@/lib/new-collection';
import {
  canonicalColorName,
  carriesSize,
  focusQty,
  normalizeProductColors,
  sizeQty,
  stateOfQty,
  type StockState,
} from '@/app/shop/shop-stock';

/* Filter + sort state for the listing page. The URL is the source of truth:
   ?category=top-wear&size=L,XL&color=black&fit=oversized&min=500&max=2000&sort=price-asc */

export type SortKey = 'relevance' | 'new' | 'best' | 'price-asc' | 'price-desc' | 'discount';
export type CollectionKey = 'newArrival' | 'bestSeller' | 'limitedEdition';

export type ShopFilters = {
  category: string;
  sizes: string[];
  colors: string[];
  fits: string[];
  fabrics: string[];
  coverages: string[];
  collections: CollectionKey[];
  min: number | null;
  max: number | null;
  inStock: boolean;
  onSale: boolean;
  sort: SortKey;
};

export const ALL_CATEGORY = 'all-products';

export const EMPTY_FILTERS: ShopFilters = {
  category: ALL_CATEGORY,
  sizes: [],
  colors: [],
  fits: [],
  fabrics: [],
  coverages: [],
  collections: [],
  min: null,
  max: null,
  inStock: false,
  onSale: false,
  sort: 'relevance',
};

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'new', label: 'New arrivals' },
  { value: 'best', label: 'Best selling' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'discount', label: 'Biggest discount' },
];

export const COLLECTION_OPTIONS: { key: CollectionKey; label: string }[] = [
  { key: 'newArrival', label: 'New Arrivals' },
  { key: 'bestSeller', label: 'Best Sellers' },
  { key: 'limitedEdition', label: 'Limited Edition' },
];

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
const FALLBACK_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

/** Case/space-insensitive key used in the URL and for matching ("Royal Blue" -> "royal-blue"). */
export const keyOf = (s: unknown) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, '-');

export function humanize(value: string): string {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const discountPct = (p: any): number =>
  !p.mrp || p.mrp <= 0 || p.price >= p.mrp ? 0 : Math.round(((p.mrp - p.price) / p.mrp) * 100);

/* ---------------- URL <-> state ---------------- */

type ParamReader = { get(name: string): string | null };

const list = (v: string | null) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);
const num = (v: string | null) => {
  const n = Number(v);
  return v !== null && v !== '' && Number.isFinite(n) && n >= 0 ? n : null;
};

export function parseFilters(sp: ParamReader): ShopFilters {
  const sort = sp.get('sort') as SortKey | null;
  const collections = list(sp.get('collection'))
    .map((c) => COLLECTION_OPTIONS.find((o) => o.key.toLowerCase() === c.toLowerCase())?.key)
    .filter(Boolean) as CollectionKey[];
  return {
    category: sp.get('category') || ALL_CATEGORY,
    sizes: list(sp.get('size')).map((s) => s.toUpperCase()),
    colors: list(sp.get('color')).map(keyOf),
    fits: list(sp.get('fit')).map(keyOf),
    fabrics: list(sp.get('fabric')).map(keyOf),
    coverages: list(sp.get('print')).map(keyOf),
    collections,
    min: num(sp.get('min')),
    max: num(sp.get('max')),
    inStock: sp.get('stock') === '1',
    onSale: sp.get('sale') === '1',
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortKey) : 'relevance',
  };
}

export function filtersToQuery(f: ShopFilters): string {
  const p = new URLSearchParams();
  if (f.category && f.category !== ALL_CATEGORY) p.set('category', f.category);
  if (f.sizes.length) p.set('size', f.sizes.join(','));
  if (f.colors.length) p.set('color', f.colors.join(','));
  if (f.fits.length) p.set('fit', f.fits.join(','));
  if (f.fabrics.length) p.set('fabric', f.fabrics.join(','));
  if (f.coverages.length) p.set('print', f.coverages.join(','));
  if (f.collections.length) p.set('collection', f.collections.join(','));
  if (f.min !== null) p.set('min', String(f.min));
  if (f.max !== null) p.set('max', String(f.max));
  if (f.inStock) p.set('stock', '1');
  if (f.onSale) p.set('sale', '1');
  if (f.sort !== 'relevance') p.set('sort', f.sort);
  return p.toString().replace(/%2C/g, ',');
}

export function toggleIn<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

/* ---------------- applying filters ---------------- */

export function inCategory(products: any[], category: string): any[] {
  if (!category || category === ALL_CATEGORY) return products;
  // tags arrive as an array (home feed) or a comma-separated string (shop API)
  const tagList = (p: any): string[] =>
    (Array.isArray(p.tags) ? p.tags : String(p.tags || '').split(',')).map((t: string) => String(t).trim().toLowerCase());
  const tagged = (p: any) => tagList(p).includes(category);
  // Plus Size = tagged plus-size or sold in 3XL and above (regular ranges also reach XXL, so XXL alone no longer means plus).
  if (category === 'plus-size') {
    return products.filter((p) => tagged(p) || (p.sizes || []).some((s: string) => ['3XL', '4XL', '5XL'].includes(String(s))));
  }
  // A product has one collection (its category slug); Top Wear / Bottom Wear live as tags.
  return products.filter((p) => p.category === category || tagged(p));
}

export function applyFilters(products: any[], f: ShopFilters): any[] {
  let r = inCategory(products, f.category);
  if (f.sizes.length) r = r.filter((p) => f.sizes.some((s) => carriesSize(p, s)));
  if (f.colors.length) r = r.filter((p) => (p.colors as string[]).some((c) => f.colors.includes(keyOf(c))));
  if (f.fits.length) r = r.filter((p) => f.fits.includes(keyOf(p.fit)));
  if (f.fabrics.length) r = r.filter((p) => f.fabrics.includes(keyOf(p.fabric)));
  if (f.coverages.length) r = r.filter((p) => f.coverages.includes(keyOf(p.coverage)));
  if (f.collections.length) r = r.filter((p) => f.collections.some((k) => Boolean(p[k])));
  if (f.inStock) r = r.filter((p) => focusQty(p, f.sizes) > 0);
  if (f.onSale) r = r.filter((p) => discountPct(p) > 0);
  if (f.min !== null) r = r.filter((p) => p.price >= (f.min as number));
  if (f.max !== null) r = r.filter((p) => p.price <= (f.max as number));

  const sorted = [...r];
  switch (f.sort) {
    case 'new':
      sorted.sort((a, b) => Number(b.newArrival) - Number(a.newArrival));
      break;
    case 'best':
      sorted.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'discount':
      sorted.sort((a, b) => discountPct(b) - discountPct(a));
      break;
    default:
      sorted.sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller));
  }
  // Default ("Relevance") and "New arrivals" lead with the 34 imported catalogue products; older products
  // follow in the order above. Explicit price / best-selling / discount sorts are left exactly as chosen.
  return f.sort === 'relevance' || f.sort === 'new' ? prioritizeNewCollection(sorted) : sorted;
}

/** Filters that count toward the "N filters" badge (category and sort don't). */
export function countActive(f: ShopFilters): number {
  return (
    f.sizes.length +
    f.colors.length +
    f.fits.length +
    f.fabrics.length +
    f.coverages.length +
    f.collections.length +
    (f.min !== null || f.max !== null ? 1 : 0) +
    (f.inStock ? 1 : 0) +
    (f.onSale ? 1 : 0)
  );
}

/* ---------------- facets (options + counts) ---------------- */

export type Option = { key: string; label: string; count: number };
export type SizeFacet = { size: string; state: StockState; carrying: number };
export type ColourFacet = Option & { hex: string };

export type Facets = {
  sizes: SizeFacet[];
  colors: ColourFacet[];
  fits: Option[];
  fabrics: Option[];
  coverages: Option[];
  collections: Record<CollectionKey, number>;
  priceMax: number;
};

function tally(products: any[], pick: (p: any) => string): Option[] {
  const map = new Map<string, Option>();
  for (const p of products) {
    const label = pick(p);
    if (!label) continue;
    const key = keyOf(label);
    const cur = map.get(key);
    if (cur) cur.count += 1;
    else map.set(key, { key, label, count: 1 });
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function buildFacets(allProducts: any[], category: string): Facets {
  const products = inCategory(allProducts, category);
  const scope = new Set(products);

  const present = new Set<string>();
  for (const p of allProducts) for (const s of (p.sizes as string[]) || []) present.add(String(s).toUpperCase());
  const ordered = (present.size ? SIZE_ORDER.filter((s) => present.has(s)) : FALLBACK_SIZES).concat(
    Array.from(present).filter((s) => !SIZE_ORDER.includes(s))
  );
  const sizes: SizeFacet[] = ordered.map((size) => {
    const carrying = products.filter((p) => carriesSize(p, size));
    const pieces = carrying.reduce((n, p) => n + sizeQty(p, size), 0);
    return { size, carrying: carrying.length, state: pieces === 0 ? 'out' : stateOfQty(pieces) };
  });

  const colourMap = new Map<string, ColourFacet>();
  for (const p of allProducts) {
    for (const dot of normalizeProductColors(p)) {
      const key = keyOf(dot.name);
      const inScope = scope.has(p) ? 1 : 0;
      const cur = colourMap.get(key);
      if (cur) cur.count += inScope;
      else colourMap.set(key, { key, label: canonicalColorName(dot.name), hex: dot.hex, count: inScope });
    }
  }

  const collections: Record<CollectionKey, number> = { newArrival: 0, bestSeller: 0, limitedEdition: 0 };
  for (const p of products) for (const o of COLLECTION_OPTIONS) if (p[o.key]) collections[o.key] += 1;

  return {
    sizes,
    colors: Array.from(colourMap.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    fits: tally(products, (p) => p.fit),
    fabrics: tally(products, (p) => p.fabric),
    coverages: tally(products, (p) => p.coverage),
    collections,
    priceMax: Math.max(2000, Math.ceil(Math.max(0, ...allProducts.map((p) => p.price || 0)) / 100) * 100),
  };
}
