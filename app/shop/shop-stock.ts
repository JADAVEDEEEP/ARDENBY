/* Stock + colour helpers for the shop page. One place for the low-stock
   threshold, variant stock maths and colour normalisation. */

export const LOW_STOCK_THRESHOLD = 5;
export const NOTIFY_KEY = 'kovenik_notify_me';

export type StockState = 'in' | 'low' | 'out';
/** `hex2` is set for two-tone colours ("Black & Cream"): drawn as a split circle. */
export type ProductColorDot = { name: string; hex: string; hex2?: string };

export const stateOfQty = (qty: number): StockState =>
  qty <= 0 ? 'out' : qty <= LOW_STOCK_THRESHOLD ? 'low' : 'in';

/* ---------------- variants ---------------- */

type Variant = { size: string; color: string; stock: number };

/** Variants as { size, color, stock }. The API calls the quantity `inventory`. */
export function getVariantStock(product: any): Variant[] {
  const raw: any[] = Array.isArray(product?.variants) ? product.variants : [];
  return raw
    .filter((v) => v && (v.size || v.color))
    .map((v) => ({
      size: String(v.size ?? '').trim().toUpperCase(),
      color: String(v.color ?? '').trim(),
      stock: Math.max(0, Number(v.stock ?? v.inventory ?? 0) || 0),
    }));
}

export function totalStock(product: any): number {
  const v = getVariantStock(product);
  return v.length > 0 ? v.reduce((n, x) => n + x.stock, 0) : Number(product?.inventory || 0);
}

/** Pieces of one size across colours. 0 when the product doesn't carry it. */
export function sizeQty(product: any, size: string): number {
  const v = getVariantStock(product);
  if (v.length === 0) {
    const sizes: string[] = product?.sizes || [];
    return sizes.includes(size) ? Number(product?.inventory || 0) : 0;
  }
  return v.filter((x) => x.size === size).reduce((n, x) => n + x.stock, 0);
}

export const carriesSize = (product: any, size: string) =>
  getVariantStock(product).some((v) => v.size === size) || (product?.sizes || []).includes(size);

/** Quantity that matters for the current view: the selected sizes, else everything. */
export function focusQty(product: any, sizes: string[]): number {
  return sizes.length === 0 ? totalStock(product) : sizes.reduce((n, s) => n + sizeQty(product, s), 0);
}

/* ---------------- colours ---------------- */

const KNOWN_COLORS: Record<string, string> = {
  Black: '#111111',
  White: '#FFFFFF',
  Beige: '#D8C3A5',
  Olive: '#6B705C',
  Navy: '#1a2540',
  'Royal Blue': '#1e40d4',
  'Sky Blue': '#87CEEB',
  Lilac: '#C8A2C8',
  Red: '#DC2626',
  Green: '#16a34a',
  Cream: '#F1E6D0',
  'Off-White': '#F5F2EA',
  Maroon: '#6d1f2c',
  Burgundy: '#7B1E2E',
  Charcoal: '#36393D',
  Plum: '#5B2C4A',
  Purple: '#5B3A8C',
  'Washed Purple': '#7B6A9C',
  Brown: '#6f4e37',
  'Dark Brown': '#3E2A22',
  Teal: '#0F6B6B',
  Grey: '#808080',
};

/** Capitalise every word, also after a hyphen ("off-white" -> "Off-White"). */
const titleCase = (s: string) => s.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase());

/** "Black & Cream" / "Black and Cream" / "Black/Cream" -> ["Black", "Cream"]. One colour -> [it]. */
const splitTwoTone = (name: string): string[] => name.split(/\s*(?:&|\/|\band\b)\s*/i).map((p) => p.trim()).filter(Boolean);

/** "BLACK", " royal  blue " -> "Black", "Royal Blue". */
export function canonicalColorName(raw: unknown): string {
  const clean = String(raw ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const known = Object.keys(KNOWN_COLORS).find((k) => k.toLowerCase() === clean.toLowerCase());
  return known ?? titleCase(clean);
}

function hexFor(name: string): string {
  const known = Object.keys(KNOWN_COLORS).find((k) => k.toLowerCase() === name.toLowerCase());
  if (known) return KNOWN_COLORS[known];
  const css = name.toLowerCase().replace(/\s+/g, '');
  if (typeof CSS !== 'undefined' && CSS.supports?.('color', css)) return css;
  return '#8a8a8a';
}

/**
 * Always returns [{ name, hex }]. Uses an explicit `colors` field (array, or a
 * comma-separated string) and falls back to variants[].color. De-duplicated,
 * case-insensitive, empty values ignored.
 */
export function normalizeProductColors(product: any): ProductColorDot[] {
  const explicit = product?.colors;
  const list: unknown[] = Array.isArray(explicit)
    ? explicit.map((c) => (c && typeof c === 'object' ? (c as any).name : c))
    : typeof explicit === 'string'
      ? explicit.split(',')
      : [];
  const fromVariants = Array.isArray(product?.variants) ? product.variants.map((v: any) => v?.color) : [];

  const seen = new Set<string>();
  const out: ProductColorDot[] = [];
  for (const raw of [...list, ...fromVariants]) {
    const name = canonicalColorName(raw);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    const parts = splitTwoTone(name);
    out.push(parts.length >= 2 ? { name, hex: hexFor(parts[0]), hex2: hexFor(parts[1]) } : { name, hex: hexFor(name) });
  }
  return out;
}

/* ---------------- errors + notify ---------------- */

/** Never fail silently: console always (with product id + status), and the
    error tracker if one is installed (e.g. Sentry on window). */
export function reportShopError(context: string, info: { productId?: string; status?: number | string; error?: unknown }) {
  console.error(`[shop] ${context}`, info);
  try {
    if (process.env.NODE_ENV === 'production') {
      const sentry = (window as any).Sentry;
      sentry?.captureException?.(info.error instanceof Error ? info.error : new Error(context), { extra: info });
    }
  } catch {
    /* tracker unavailable */
  }
}

export function saveNotify(productId: string, size?: string) {
  try {
    const list: string[] = JSON.parse(localStorage.getItem(NOTIFY_KEY) || '[]');
    const key = size ? `${productId}:${size}` : productId;
    if (!list.includes(key)) list.push(key);
    localStorage.setItem(NOTIFY_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
}

/** Dev switch for testing the colour error state: ?colorsFail=1 (retry works) or =hard (retry fails). */
export function colorsFailFlag(): 'off' | 'soft' | 'hard' {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return 'off';
  const v = new URLSearchParams(window.location.search).get('colorsFail');
  return v === 'hard' ? 'hard' : v ? 'soft' : 'off';
}
