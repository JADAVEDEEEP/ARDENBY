'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  Clock,
  PackageX,
  RefreshCw,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

import { apiUrl } from '@/lib/api-url';
import { getAdminToken } from '@/components/admin/admin-auth';

/* ------------------------------------------------------------------ */
/* Types (same API shapes as before; no backend changes)               */
/* ------------------------------------------------------------------ */

type Product = {
  id: string;
  name: string;
  category_id?: string | number;
  categoryId?: string | number;
  category_slug?: string;
  category_label?: string;
  price?: number;
  best_price?: number;
  inventory?: number;
  images?: { image_url?: string }[];
};

/** Row from the existing Categories API. */
type Category = {
  id?: string | number;
  slug?: string;
  category_slug?: string;
  name?: string;
  label?: string;
  category_label?: string;
  title?: string;
};

type NormCategory = { id: string; slug: string; name: string };

type OrderItem = {
  id?: string;
  product_id?: string | number;
  productId?: string | number;
  product?: { id?: string | number; name?: string };
  product_name?: string;
  productName?: string;
  name?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  unit_price?: number;
  unitPrice?: number;
  total?: number;
  line_total?: number;
  lineTotal?: number;
};

type Order = {
  id?: string;
  order_id?: string;
  orderId?: string;
  customer_id?: string | number;
  customerId?: string | number;
  user_id?: string | number;
  userId?: string | number;
  customer?: { id?: string | number; email?: string; name?: string };
  user?: { id?: string | number; email?: string; name?: string };
  customer_name?: string;
  customerName?: string;
  customer_email?: string;
  customerEmail?: string;
  email?: string;
  total?: number;
  total_amount?: number;
  totalAmount?: number;
  grand_total?: number;
  grandTotal?: number;
  amount?: number;
  status?: string;
  payment_method?: string;
  paymentMethod?: string;
  payment_status?: string;
  paymentStatus?: string;
  created_at?: string;
  createdAt?: string;
  items?: OrderItem[];
  order_items?: OrderItem[];
  orderItems?: OrderItem[];
};

type StatusKey =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

type NormItem = { productId: string; name: string; qty: number; revenue: number };

type NormOrder = {
  id: string;
  customerKey: string;
  name: string;
  email: string;
  amount: number;
  status: StatusKey;
  statusRaw: string;
  payment: string;
  ts: number;
  items: NormItem[];
};

type Source<T> = { data: T[]; error: string };

/* ------------------------------------------------------------------ */
/* Data helpers                                                        */
/* ------------------------------------------------------------------ */

async function request<T>(path: string): Promise<T> {
  const token = getAdminToken();

  const response = await fetch(apiUrl(path), {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store',
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const body = data as { message?: string; error?: string } | null;
    throw new Error(body?.message || body?.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

function arrayFrom<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  const d = data as Record<string, unknown> | null;
  if (Array.isArray(d?.[key])) return d?.[key] as T[];
  const inner = d?.data as Record<string, unknown> | unknown[] | undefined;
  if (Array.isArray(inner)) return inner as T[];
  if (inner && Array.isArray((inner as Record<string, unknown>)[key])) {
    return (inner as Record<string, unknown>)[key] as T[];
  }
  return [];
}

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** First non-empty value, as a trimmed string. */
function text(...values: unknown[]): string {
  for (const v of values) {
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return '';
}

/** Number only if finite and > 0, otherwise 0 (so null/0/'' totals fall through to qty x price). */
function positive(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function statusKey(raw?: string): StatusKey {
  const v = String(raw || '').toLowerCase();
  if (v.includes('cancel')) return 'cancelled';
  if (v.includes('return')) return 'returned';
  if (v.includes('deliver') || v.includes('complete')) return 'delivered';
  if (v.includes('ship')) return 'shipped';
  if (v.includes('pack')) return 'packed';
  if (v.includes('process')) return 'processing';
  if (v.includes('confirm')) return 'confirmed';
  return 'pending';
}

function normalizeOrder(order: Order): NormOrder {
  const email = text(
    order.customer_email,
    order.customerEmail,
    order.email,
    order.customer?.email,
    order.user?.email
  );
  const name =
    text(order.customer_name, order.customerName, order.customer?.name, order.user?.name, email) || 'Customer';
  const key = text(
    order.customer_id,
    order.customerId,
    order.user_id,
    order.userId,
    order.customer?.id,
    order.user?.id,
    email,
    order.customer_name,
    order.customerName
  );

  const rawItems = order.items || order.order_items || order.orderItems || [];
  const items: NormItem[] = (Array.isArray(rawItems) ? rawItems : [])
    .map((item) => {
      const qty = num(item.quantity ?? item.qty, 1) || 1;
      const unit = num(item.price ?? item.unit_price ?? item.unitPrice, 0);
      // Prefer the item's own total; otherwise quantity x price.
      const revenue = positive(item.total ?? item.line_total ?? item.lineTotal) || unit * qty;
      return {
        productId: text(item.product_id, item.productId, item.product?.id),
        name: text(item.product_name, item.productName, item.name, item.product?.name),
        qty,
        revenue,
      };
    })
    .filter((i) => i.name || i.productId);

  const ts = new Date(order.created_at || order.createdAt || '').getTime();

  return {
    id: String(order.order_id || order.orderId || order.id || '—'),
    customerKey: key.toLowerCase(),
    name,
    email,
    amount: num(
      order.total ??
        order.total_amount ??
        order.totalAmount ??
        order.grand_total ??
        order.grandTotal ??
        order.amount,
      0
    ),
    status: statusKey(order.status),
    statusRaw: order.status || 'Pending',
    payment: String(
      order.payment_method || order.paymentMethod || order.payment_status || order.paymentStatus || '—'
    ),
    ts: Number.isNaN(ts) ? 0 : ts,
    items,
  };
}

const DAY = 86_400_000;
const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const money = (v: number) => inr.format(v);
const compact = (v: number) =>
  v >= 1e7 ? `₹${(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `₹${(v / 1e5).toFixed(1)}L` : v >= 1e3 ? `₹${Math.round(v / 1e3)}K` : `₹${Math.round(v)}`;

/** Category label for a product; used for sales (from order items) and for the separate product count. */
const catName = (p?: Product) => p?.category_label || p?.category_slug || 'Uncategorized';

function normalizeCategory(c: Category): NormCategory {
  const slug = text(c.slug, c.category_slug);
  return { id: text(c.id), slug, name: text(c.name, c.label, c.category_label, c.title, slug) };
}

type CatIndex = {
  list: NormCategory[];
  byId: Map<string, NormCategory>;
  bySlug: Map<string, NormCategory>;
  byName: Map<string, NormCategory>;
};
const catKey = (c: NormCategory) => c.id || c.slug || c.name;

/** product -> category from the Categories API: by category id, then slug, then label. */
function matchCategory(p: Product | undefined, idx: CatIndex): NormCategory | undefined {
  if (!p) return undefined;
  const id = text(p.category_id, p.categoryId);
  if (id && idx.byId.has(id)) return idx.byId.get(id);
  const slug = text(p.category_slug).toLowerCase();
  if (slug && idx.bySlug.has(slug)) return idx.bySlug.get(slug);
  const label = text(p.category_label).toLowerCase();
  if (label && idx.byName.has(label)) return idx.byName.get(label);
  return undefined;
}

const fmtDate = (ts: number) =>
  ts
    ? new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

function growth(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const STATUS_META: Record<StatusKey, { label: string; chip: string; bar: string }> = {
  pending: { label: 'Pending', chip: 'bg-[#B89A5A]/20 text-[#C8A96B] border-[#B89A5A]/50', bar: '#B89A5A' },
  confirmed: { label: 'Confirmed', chip: 'bg-[#C8A96B]/15 text-[#C8A96B] border-[#C8A96B]/40', bar: '#C8A96B' },
  processing: { label: 'Processing', chip: 'bg-[#6FA383]/15 text-[#A9D1B3] border-[#6FA383]/40', bar: '#6FA383' },
  packed: { label: 'Packed', chip: 'bg-[#8FA394]/15 text-[#B9C7BA] border-[#8FA394]/40', bar: '#8FA394' },
  shipped: { label: 'Shipped', chip: 'bg-[#8FB79A]/20 text-[#C9E3D0] border-[#8FB79A]/50', bar: '#8FB79A' },
  delivered: { label: 'Delivered', chip: 'bg-[#C8A96B] text-[#07180D] border-[#C8A96B]', bar: '#A9D1B3' },
  cancelled: { label: 'Cancelled', chip: 'bg-[#C46B6B]/15 text-[#E5A3A3] border-[#C46B6B]/40', bar: '#C46B6B' },
  returned: { label: 'Returned', chip: 'bg-[#B89A5A]/10 text-[#C8A96B] border-[#B89A5A]/40', bar: '#9A7B3A' },
};
const STATUS_ORDER: StatusKey[] = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
];

type StockLevel = 'Normal' | 'Low' | 'Critical' | 'Out of Stock';
const stockLevel = (n: number): StockLevel =>
  n <= 0 ? 'Out of Stock' : n <= 5 ? 'Critical' : n <= 10 ? 'Low' : 'Normal';
const STOCK_CHIP: Record<StockLevel, string> = {
  Normal: 'bg-[#8FB79A]/15 text-[#A9D1B3] border-[#8FB79A]/40',
  Low: 'bg-[#B89A5A]/20 text-[#C8A96B] border-[#B89A5A]/50',
  Critical: 'bg-[#C46B6B]/15 text-[#E5A3A3] border-[#C46B6B]/40',
  'Out of Stock': 'bg-[#07180D] text-[#F4F0E6] border-[#C8A96B]/30',
};

const FOREST_CARD =
  'min-w-0 rounded-2xl border border-[#C8A96B]/25 bg-[#12351F] text-[#F4F0E6] shadow-[0_10px_30px_rgba(0,0,0,0.3)]';

/* ------------------------------------------------------------------ */
/* Date range                                                          */
/* ------------------------------------------------------------------ */

type Preset = 'today' | '7' | '30' | '90' | 'custom';
const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7', label: '7 Days' },
  { key: '30', label: '30 Days' },
  { key: '90', label: '90 Days' },
  { key: 'custom', label: 'Custom Range' },
];

const toInput = (ts: number) => {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Source<Product>>({ data: [], error: '' });
  const [rawOrders, setRawOrders] = useState<Source<Order>>({ data: [], error: '' });
  const [categoryList, setCategoryList] = useState<Source<Category>>({ data: [], error: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [preset, setPreset] = useState<Preset>('30');
  const [customFrom, setCustomFrom] = useState(() => toInput(Date.now() - 29 * DAY));
  const [customTo, setCustomTo] = useState(() => toInput(Date.now()));
  const [chartRange, setChartRange] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    const [p, o, c] = await Promise.allSettled([
      request<unknown>('/api/products?page=1&limit=100&search=&category='),
      request<unknown>('/api/orders/admin/all'),
      request<unknown>('/api/categories'),
    ]);

    setProducts(
      p.status === 'fulfilled'
        ? { data: arrayFrom<Product>(p.value, 'products'), error: '' }
        : { data: [], error: p.reason instanceof Error ? p.reason.message : 'Unable to load products.' }
    );
    setRawOrders(
      o.status === 'fulfilled'
        ? { data: arrayFrom<Order>(o.value, 'orders'), error: '' }
        : { data: [], error: o.reason instanceof Error ? o.reason.message : 'Unable to load orders.' }
    );

    setCategoryList(
      c.status === 'fulfilled'
        ? { data: arrayFrom<Category>(c.value, 'categories'), error: '' }
        : { data: [], error: c.reason instanceof Error ? c.reason.message : 'Unable to load categories.' }
    );

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const orders = useMemo(() => rawOrders.data.map(normalizeOrder), [rawOrders.data]);

  /* ---- active range + previous period ---- */
  const { from, to } = useMemo(() => {
    const today = startOfDay(Date.now());
    if (preset === 'today') return { from: today, to: today + DAY - 1 };
    if (preset === 'custom') {
      const f = startOfDay(new Date(customFrom).getTime() || today);
      const t = startOfDay(new Date(customTo).getTime() || today) + DAY - 1;
      return f <= t ? { from: f, to: t } : { from: t - DAY + 1, to: f + DAY - 1 };
    }
    const days = Number(preset);
    return { from: today - (days - 1) * DAY, to: today + DAY - 1 };
  }, [preset, customFrom, customTo]);

  const span = to - from + 1;

  const kpis = useMemo(() => {
    const cur = orders.filter((o) => o.ts >= from && o.ts <= to);
    const prev = orders.filter((o) => o.ts >= from - span && o.ts < from);
    const rev = (list: NormOrder[]) =>
      list.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.amount, 0);
    const cust = (list: NormOrder[]) => new Set(list.map((o) => o.customerKey).filter(Boolean)).size;

    return {
      revenue: rev(cur),
      revenueGrowth: growth(rev(cur), rev(prev)),
      orders: cur.length,
      ordersGrowth: growth(cur.length, prev.length),
      customers: cust(cur),
      customersGrowth: growth(cust(cur), cust(prev)),
      pending: orders.filter((o) => o.status === 'pending').length,
      current: cur,
    };
  }, [orders, from, to, span]);

  /* ---- revenue / orders time series (own range selector) ---- */
  const series = useMemo(() => {
    const today = startOfDay(Date.now());
    const buckets: { label: string; start: number; end: number; revenue: number; count: number }[] = [];

    if (chartRange === '1Y') {
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const s = new Date(now.getFullYear(), now.getMonth() - i, 1).getTime();
        const e = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();
        buckets.push({
          label: new Date(s).toLocaleDateString('en-IN', { month: 'short' }),
          start: s,
          end: e,
          revenue: 0,
          count: 0,
        });
      }
    } else {
      const days = chartRange === '7D' ? 7 : chartRange === '30D' ? 30 : 90;
      const step = days === 90 ? 7 : 1;
      const first = today - (days - 1) * DAY;
      for (let s = first; s <= today; s += step * DAY) {
        buckets.push({
          label: new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          start: s,
          end: s + step * DAY,
          revenue: 0,
          count: 0,
        });
      }
    }

    orders.forEach((o) => {
      const b = buckets.find((x) => o.ts >= x.start && o.ts < x.end);
      if (!b) return;
      b.count += 1;
      if (o.status !== 'cancelled') b.revenue += o.amount;
    });
    return buckets;
  }, [orders, chartRange]);

  /* ---- order status breakdown (selected period) ---- */
  const statusCounts = useMemo(() => {
    const m = Object.fromEntries(STATUS_ORDER.map((k) => [k, 0])) as Record<StatusKey, number>;
    kpis.current.forEach((o) => {
      m[o.status] += 1;
    });
    return m;
  }, [kpis]);

  /* ---- product lookups ---- */
  const productIndex = useMemo(() => {
    const byId = new Map<string, Product>();
    const byName = new Map<string, Product>();
    products.data.forEach((p) => {
      byId.set(String(p.id), p);
      byName.set(String(p.name || '').toLowerCase(), p);
    });
    return { byId, byName };
  }, [products.data]);

  const ordersFailed = Boolean(rawOrders.error);

  /* ---- real categories from the Categories API ---- */
  const catIndex = useMemo<CatIndex>(() => {
    const list = categoryList.data.map(normalizeCategory).filter((c) => c.id || c.slug || c.name);
    const byId = new Map<string, NormCategory>();
    const bySlug = new Map<string, NormCategory>();
    const byName = new Map<string, NormCategory>();
    list.forEach((c) => {
      if (c.id) byId.set(c.id, c);
      if (c.slug) bySlug.set(c.slug.toLowerCase(), c);
      if (c.name) byName.set(c.name.toLowerCase(), c);
    });
    return { list, byId, bySlug, byName };
  }, [categoryList.data]);

  /* ---- category sales (selected period) ---- */
  const { categorySales } = useMemo(() => {
    type CatRow = { key: string; name: string; orders: Set<string>; units: number; revenue: number; products: number };

    // Every category from the API is listed, even with no sales yet.
    const cat = new Map<string, CatRow>();
    catIndex.list.forEach((c) =>
      cat.set(catKey(c), { key: catKey(c), name: c.name || c.slug, orders: new Set<string>(), units: 0, revenue: 0, products: 0 })
    );

    // Catalogue size per category (separate from sales).
    products.data.forEach((p) => {
      const m = matchCategory(p, catIndex);
      const row = m ? cat.get(catKey(m)) : undefined;
      if (row) row.products += 1;
    });

    // ORDERS -> ORDER ITEMS -> PRODUCT ID -> PRODUCTS API -> CATEGORY
    kpis.current.forEach((o, idx) => {
      if (o.status === 'cancelled') return;
      const orderKey = o.id === '—' ? `#${idx}` : o.id;

      o.items.forEach((item) => {
        const product =
          productIndex.byId.get(item.productId) || productIndex.byName.get(item.name.toLowerCase());
        const revenue = item.revenue || (product ? num(product.price ?? product.best_price) * item.qty : 0);

        const matched = matchCategory(product, catIndex);
        let row = matched ? cat.get(catKey(matched)) : undefined;
        if (!row) {
          // Sold product whose category is not in the Categories API: show it honestly, don't drop it.
          const label = catName(product);
          const key = `other:${label.toLowerCase()}`;
          row = cat.get(key) || { key, name: label, orders: new Set<string>(), units: 0, revenue: 0, products: 0 };
          cat.set(key, row);
        }
        row.orders.add(orderKey);
        row.units += item.qty;
        row.revenue += revenue;
      });
    });

    const totalRev = Array.from(cat.values()).reduce((s, c) => s + c.revenue, 0);
    const categorySales = Array.from(cat.values())
      .map((c) => ({
        key: c.key,
        name: c.name,
        products: c.products,
        orders: c.orders.size,
        units: c.units,
        revenue: c.revenue,
        pct: totalRev ? (c.revenue / totalRev) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue || b.units - a.units || a.name.localeCompare(b.name));

    return { categorySales };
  }, [kpis, products.data, productIndex, catIndex]);

  const maxCategoryRevenue = Math.max(...categorySales.map((c) => c.revenue), 0);
  const categoryHasSales = maxCategoryRevenue > 0;
  const categoryError = ordersFailed ? rawOrders.error : products.error || categoryList.error;

  /* ---- customers (all orders) ---- */
  const customerStats = useMemo(() => {
    const map = new Map<
      string,
      { key: string; name: string; email: string; orders: number; spent: number; last: number; first: number }
    >();
    orders.forEach((o) => {
      if (!o.customerKey) return;
      const c = map.get(o.customerKey) || {
        key: o.customerKey,
        name: o.name,
        email: o.email,
        orders: 0,
        spent: 0,
        last: 0,
        first: Infinity,
      };
      c.orders += 1;
      if (o.status !== 'cancelled') c.spent += o.amount;
      if (o.ts > c.last) {
        c.last = o.ts;
        c.name = o.name;
        c.email = o.email || c.email;
      }
      if (o.ts && o.ts < c.first) c.first = o.ts;
      map.set(o.customerKey, c);
    });
    return Array.from(map.values());
  }, [orders]);

  const recentCustomers = useMemo(
    () => [...customerStats].sort((a, b) => b.last - a.last).slice(0, 5),
    [customerStats]
  );

  const customerGrowth = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        label: d.toLocaleDateString('en-IN', { month: 'short' }),
        start: d.getTime(),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(),
        added: 0,
        returning: 0,
      };
    });
    const firstOf = new Map(customerStats.map((c) => [c.key, c.first]));
    months.forEach((m) => {
      const active = new Set<string>();
      orders.forEach((o) => {
        if (o.customerKey && o.ts >= m.start && o.ts < m.end) active.add(o.customerKey);
      });
      active.forEach((key) => {
        const first = firstOf.get(key) ?? Infinity;
        if (first >= m.start && first < m.end) m.added += 1;
        else m.returning += 1;
      });
    });
    return months;
  }, [orders, customerStats]);

  /* ---- inventory ---- */
  const lowStock = useMemo(
    () =>
      products.data
        .map((p) => ({ product: p, stock: num(p.inventory) }))
        .filter((x) => x.stock <= 10)
        .sort((a, b) => a.stock - b.stock),
    [products.data]
  );

  const recentOrders = useMemo(() => [...orders].sort((a, b) => b.ts - a.ts).slice(0, 6), [orders]);

  const productsFailed = Boolean(products.error);
  const retry = () => void load(true);

  /* ---------------------------------------------------------------- */

  return (
    <div className="w-full space-y-5 pb-4 font-sans text-[#F4F0E6] selection:bg-[#B89A5A]/30 sm:space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-[#F4F0E6] sm:text-4xl">Dashboard</h1>
          <p className="mt-1.5 text-sm text-[#B9C7BA]">Overview of your KOVENIK store performance</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="tablist"
            aria-label="Date range"
            className="flex max-w-full overflow-x-auto rounded-lg border border-[#C8A96B]/25 bg-[#0D2415]/80 p-1"
          >
            {PRESETS.map((p) => (
              <button
                key={p.key}
                role="tab"
                aria-selected={preset === p.key}
                onClick={() => setPreset(p.key)}
                className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  preset === p.key ? 'bg-[#B89A5A] text-[#07180D]' : 'text-[#EAE4D5] hover:bg-[#12351F]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={retry}
            disabled={loading || refreshing}
            aria-label="Refresh dashboard data"
            title="Refresh"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#C8A96B]/25 text-[#C8A96B] transition hover:bg-[#12351F] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#C8A96B]/25 bg-[#0D2415]/70 p-3 text-xs text-[#EAE4D5]">
          <CalendarDays className="h-4 w-4 text-[#B89A5A]" />
          <label className="flex items-center gap-2">
            From
            <input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-md border border-[#C8A96B]/25 bg-[#07180D] px-2 py-1 text-[#F4F0E6] [color-scheme:dark]"
            />
          </label>
          <label className="flex items-center gap-2">
            To
            <input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-md border border-[#C8A96B]/25 bg-[#07180D] px-2 py-1 text-[#F4F0E6] [color-scheme:dark]"
            />
          </label>
        </div>
      )}

      {/* KPIs */}
      <section aria-label="Key metrics" className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Kpi
            label="Total Revenue"
            icon={CircleDollarSign}
            loading={loading}
            failed={ordersFailed}
            value={money(kpis.revenue)}
            change={kpis.revenueGrowth}
          />
          <Kpi
            label="Total Orders"
            icon={ShoppingBag}
            loading={loading}
            failed={ordersFailed}
            value={kpis.orders.toLocaleString('en-IN')}
            change={kpis.ordersGrowth}
          />
          <Kpi
            label="Total Customers"
            icon={Users}
            loading={loading}
            failed={ordersFailed}
            value={kpis.customers.toLocaleString('en-IN')}
            change={kpis.customersGrowth}
          />
          <Kpi
            label="Total Products"
            icon={Boxes}
            loading={loading}
            failed={productsFailed}
            value={products.data.length.toLocaleString('en-IN')}
            note="in catalogue"
          />
        </div>
        
      </section>

      {/* Revenue + Orders overview */}
      <section className="grid gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card
          title="Revenue Overview"
          subtitle="Total revenue and orders over time"
          action={
            <Segmented
              options={['7D', '30D', '90D', '1Y']}
              value={chartRange}
              onChange={(v) => setChartRange(v as typeof chartRange)}
            />
          }
        >
          <State
            loading={loading}
            error={rawOrders.error}
            empty={orders.length === 0}
            emptyText="No order data available"
            onRetry={retry}
            skeleton={<Skel className="h-56 w-full" />}
          >
            <TrendChart
              labels={series.map((s) => s.label)}
              lines={[
                { values: series.map((s) => s.revenue), stroke: '#C8A96B', fill: true },
                { values: series.map((s) => s.count), stroke: '#8FB79A', dashed: true },
              ]}
              yFormat={compact}
              tooltip={(i) => (
                <>
                  <p className="font-semibold">{series[i].label}</p>
                  <p>Revenue: {money(series[i].revenue)}</p>
                  <p>Orders: {series[i].count}</p>
                </>
              )}
            />
            <Legend items={[{ label: 'Revenue', color: '#C8A96B' }, { label: 'Orders', color: '#8FB79A' }]} />
          </State>
        </Card>

        <Card title="Orders Overview" subtitle="By status, selected period">
          <State
            loading={loading}
            error={rawOrders.error}
            empty={kpis.orders === 0}
            emptyText="No orders in this period."
            onRetry={retry}
            skeleton={<Skel className="h-56 w-full" />}
          >
            <StatusBars counts={statusCounts} />
          </State>
        </Card>
      </section>

      {/* Category row */}
      <section className="grid gap-5 sm:gap-6 lg:grid-cols-2">
        <Card title="Sales by Category" subtitle="Revenue by category">
          <State
            loading={loading}
            error={categoryError}
            empty={categorySales.length === 0}
            emptyText="No categories available"
            onRetry={retry}
            skeleton={<Skel className="h-48 w-full" />}
          >
            <ul className="space-y-3.5">
              {categorySales.map((c, i) => (
                <HBar
                  key={c.key}
                  label={c.name}
                  value={c.revenue}
                  max={maxCategoryRevenue}
                  highlight={i === 0 && c.revenue > 0}
                  right={
                    <>
                      {money(c.revenue)} <span className="text-[#B9C7BA]">· {c.pct.toFixed(0)}%</span>
                    </>
                  }
                  sub={`${c.units} ${c.units === 1 ? 'unit' : 'units'} sold · ${c.orders} ${
                    c.orders === 1 ? 'order' : 'orders'
                  } · ${c.products} ${c.products === 1 ? 'product' : 'products'}`}
                />
              ))}
            </ul>
            {!categoryHasSales && (
              <p className="mt-3 text-[10px] text-[#B9C7BA]">No category sales in this period.</p>
            )}
          </State>
        </Card>

        <Card title="Customer Growth" subtitle="Last 6 months">
          <State
            loading={loading}
            error={rawOrders.error}
            empty={customerStats.length === 0}
            emptyText="No customer data available"
            onRetry={retry}
            skeleton={<Skel className="h-48 w-full" />}
          >
            <TrendChart
              labels={customerGrowth.map((m) => m.label)}
              shared
              lines={[
                { values: customerGrowth.map((m) => m.added), stroke: '#C8A96B', fill: true },
                { values: customerGrowth.map((m) => m.returning), stroke: '#8FB79A', fill: true },
              ]}
              yFormat={(v) => String(Math.round(v))}
              tooltip={(i) => (
                <>
                  <p className="font-semibold">{customerGrowth[i].label}</p>
                  <p>New: {customerGrowth[i].added}</p>
                  <p>Returning: {customerGrowth[i].returning}</p>
                </>
              )}
            />
            <Legend
              items={[
                { label: 'New Customers', color: '#C8A96B' },
                { label: 'Returning Customers', color: '#8FB79A' },
              ]}
            />
            <p className="mt-2 text-[10px] text-[#B9C7BA]">Derived from order history.</p>
          </State>
        </Card>
      </section>

      {/* Recent orders */}
      <Card
        title="Recent Orders"
        subtitle="Latest orders from your customers"
        action={<GoldLink href="/admin/orders">View All</GoldLink>}
      >
        <State
          loading={loading}
          error={rawOrders.error}
          empty={recentOrders.length === 0}
          emptyText="No orders available."
          onRetry={retry}
          skeleton={<Skel className="h-52 w-full" />}
        >
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#C8A96B]/20 text-[11px] font-semibold uppercase tracking-wider text-[#C8A96B]">
                  <th className="py-2.5 pr-3">Order ID</th>
                  <th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5">Product</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                  <th className="px-3 py-2.5">Payment</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="py-2.5 pl-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C8A96B]/15">
                {recentOrders.map((o, i) => (
                  <tr key={`${o.id}-${i}`} className="transition-colors hover:bg-[#F4F0E6]/[0.04]">
                    <td className="py-3 pr-3 font-semibold">#{o.id}</td>
                    <td className="max-w-[160px] truncate px-3 py-3">{o.name}</td>
                    <td className="max-w-[180px] truncate px-3 py-3 text-[#F4F0E6]">
                      {o.items[0]?.name || '—'}
                      {o.items.length > 1 ? ` +${o.items.length - 1}` : ''}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">{money(o.amount)}</td>
                    <td className="px-3 py-3 capitalize text-[#B9C7BA]">{o.payment}</td>
                    <td className="px-3 py-3">
                      <StatusChip status={o.status} label={o.statusRaw} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-[#B9C7BA]">{fmtDate(o.ts)}</td>
                    <td className="py-3 pl-3 text-right">
                      <Link href="/admin/orders" className="text-xs font-semibold text-[#C8A96B] hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {recentOrders.map((o, i) => (
              <li key={`${o.id}-${i}`} className="rounded-xl border border-[#C8A96B]/20 bg-[#0D2415]/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">#{o.id}</p>
                    <p className="truncate text-xs text-[#B9C7BA]">{o.name}</p>
                  </div>
                  <p className="shrink-0 font-serif text-lg">{money(o.amount)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <StatusChip status={o.status} label={o.statusRaw} />
                  <span className="text-[11px] text-[#B9C7BA]">{fmtDate(o.ts)}</span>
                </div>
                <Link
                  href="/admin/orders"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#C8A96B]"
                >
                  View Order <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </State>
      </Card>

      {/* Low stock + recent customers */}
      <section className="grid gap-5 sm:gap-6 lg:grid-cols-2">
        <Card
          title="Low Stock Alert"
          subtitle="Products running low"
          action={<GoldLink href="/admin/products">View All</GoldLink>}
        >
          <State
            loading={loading}
            error={products.error}
            empty={lowStock.length === 0}
            emptyText="All products are well stocked."
            onRetry={retry}
            skeleton={<Skel className="h-44 w-full" />}
          >
            <ul className="divide-y divide-[#C8A96B]/15">
              {lowStock.slice(0, 6).map(({ product, stock }) => {
                const level = stockLevel(stock);
                return (
                  <li key={product.id} className="flex items-center gap-3 py-3">
                    <Thumb product={product} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{product.name}</p>
                      <p className="text-[11px] text-[#B9C7BA]">{stock} in stock</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STOCK_CHIP[level]}`}
                    >
                      {level}
                    </span>
                  </li>
                );
              })}
            </ul>
          </State>
        </Card>

        <Card title="Recent Customers" subtitle="Derived from order history">
          <State
            loading={loading}
            error={rawOrders.error}
            empty={recentCustomers.length === 0}
            emptyText="No customers yet."
            onRetry={retry}
            skeleton={<Skel className="h-44 w-full" />}
          >
            <ul className="divide-y divide-[#C8A96B]/15">
              {recentCustomers.map((c) => (
                <li key={c.key} className="flex items-center gap-3 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C8A96B]/60 bg-[#07180D] font-serif text-sm text-[#C8A96B]">
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="truncate text-[11px] text-[#B9C7BA]">{c.email || '—'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-[#C8A96B]">{money(c.spent)}</p>
                    <p className="text-[11px] text-[#B9C7BA]">
                      {c.orders} {c.orders === 1 ? 'order' : 'orders'} · {fmtDate(c.last)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </State>
        </Card>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

type Icon = ComponentType<{ className?: string }>;

function Skel({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#F4F0E6]/10 ${className}`} />;
}

function Kpi({
  label,
  icon: Icon,
  value,
  change,
  note,
  loading,
  failed,
}: {
  label: string;
  icon: Icon;
  value: string;
  change?: number | null;
  note?: string;
  loading: boolean;
  failed: boolean;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-[#C8A96B]/25 bg-gradient-to-br from-[#163D25] to-[#12351F] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-0.5 hover:border-[#C8A96B]/70 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B9C7BA] sm:text-[11px]">{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#B89A5A]/40 bg-[#07180D]/60 text-[#C8A96B] sm:h-9 sm:w-9">
          <Icon className="h-4 w-4" />
        </span>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          <div className="h-7 w-24 animate-pulse rounded bg-[#F4F0E6]/10" />
          <div className="h-3 w-20 animate-pulse rounded bg-[#F4F0E6]/10" />
        </div>
      ) : failed ? (
        <p className="mt-4 text-xs text-[#E5A3A3]">Unavailable</p>
      ) : (
        <>
          <p className="mt-3 truncate font-serif text-2xl text-[#F4F0E6] sm:text-[28px]">{value}</p>
          {change !== undefined ? (
            <p
              className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${
                change === null ? 'text-[#B9C7BA]' : up ? 'text-[#7FD1A0]' : 'text-[#E5A3A3]'
              }`}
            >
              {change === null ? null : up ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {change === null ? 'New activity' : `${up ? '+' : ''}${change.toFixed(1)}%`}
              <span className="font-normal text-[#8FA394]">vs previous period</span>
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-[#8FA394]">{note}</p>
          )}
        </>
      )}
    </div>
  );
}

function MiniStat({
  label,
  icon: Icon,
  value,
  loading,
  href,
}: {
  label: string;
  icon: Icon;
  value: string;
  loading: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-w-0 items-center gap-3 rounded-xl border border-[#C8A96B]/25 bg-[#12351F] p-3.5 transition hover:border-[#B89A5A]/60"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#B89A5A]/40 text-[#C8A96B]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B9C7BA]">{label}</p>
        {loading ? (
          <div className="mt-1 h-5 w-10 animate-pulse rounded bg-[#F4F0E6]/10" />
        ) : (
          <p className="font-serif text-xl text-[#F4F0E6]">{value}</p>
        )}
      </div>
    </Link>
  );
}

function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${FOREST_CARD} p-4 sm:p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-serif text-lg text-[#F4F0E6] sm:text-xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11px] text-[#B9C7BA]">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function State({
  loading,
  error,
  empty,
  emptyText,
  onRetry,
  skeleton,
  children,
}: {
  loading: boolean;
  error: string;
  empty: boolean;
  emptyText: string;
  onRetry: () => void;
  skeleton: ReactNode;
  children: ReactNode;
}) {
  if (loading) return <>{skeleton}</>;
  if (error) {
    return (
      <div className="flex min-h-[110px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#9B2C2C]/40 bg-[#9B2C2C]/5 px-4 py-5 text-center">
        <p className="text-xs text-[#E5A3A3]">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-[#9B2C2C]/40 px-3 py-1 text-xs font-semibold text-[#E5A3A3] hover:bg-[#9B2C2C]/10"
        >
          Try again
        </button>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="flex min-h-[110px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#B89A5A]/50 px-4 py-5 text-center text-xs text-[#B9C7BA]">
        <PackageX className="h-5 w-5 text-[#B89A5A]" />
        {emptyText}
      </div>
    );
  }
  return <>{children}</>;
}

function GoldLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#C8A96B] underline-offset-4 outline-none transition hover:underline focus-visible:ring-1 focus-visible:ring-[#B89A5A]"
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg border border-[#C8A96B]/25 bg-[#07180D]/60 p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
            value === o ? 'bg-[#C8A96B] text-[#07180D]' : 'text-[#B9C7BA] hover:bg-[#F4F0E6]/10'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-[#B9C7BA]">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function StatusChip({ status, label }: { status: StatusKey; label: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_META[status].chip}`}
    >
      {label || STATUS_META[status].label}
    </span>
  );
}

function Thumb({ product, size = 'md' }: { product?: Product; size?: 'md' | 'lg' }) {
  const image = product?.images?.[0]?.image_url;
  const dim = size === 'lg' ? 'h-14 w-14' : 'h-10 w-10';
  return (
    <div className={`${dim} shrink-0 overflow-hidden rounded-lg border border-[#C8A96B]/25 bg-[#07180D]`}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={product?.name || ''} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Boxes className="h-4 w-4 text-[#8FA394]" />
        </div>
      )}
    </div>
  );
}

function HBar({
  label,
  value,
  max,
  right,
  sub,
  highlight = false,
}: {
  label: string;
  value: number;
  max: number;
  right: ReactNode;
  sub?: string;
  highlight?: boolean;
}) {
  const width = max > 0 && value > 0 ? Math.max((value / max) * 100, 2) : 0;
  return (
    <li>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="truncate font-semibold" title={label}>
          {label}
        </span>
        <span className="shrink-0 font-semibold">{right}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F4F0E6]/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${width}%`, backgroundColor: highlight ? '#C8A96B' : '#6FA383' }}
        />
      </div>
      {sub && <p className="mt-1 text-[11px] text-[#B9C7BA]">{sub}</p>}
    </li>
  );
}

/* ---------------------------- charts ------------------------------ */

type Line = { values: number[]; stroke: string; fill?: boolean; dashed?: boolean };

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${
      p2.y - (p3.y - p1.y) / 6
    }, ${p2.x} ${p2.y}`;
  }
  return d;
}

function TrendChart({
  labels,
  lines,
  tooltip,
  yFormat,
  shared = false,
}: {
  labels: string[];
  lines: Line[];
  tooltip: (i: number) => ReactNode;
  yFormat: (v: number) => string;
  shared?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 600;
  const H = 200;
  const n = Math.max(labels.length, 1);
  const x = (i: number) => (n === 1 ? W / 2 : (i * W) / (n - 1));

  const sharedMax = Math.max(...lines.flatMap((l) => l.values), 1);
  const maxOf = (l: Line) => (shared ? sharedMax : Math.max(...l.values, 1));

  const paths = lines.map((l) => {
    const max = maxOf(l);
    const pts = l.values.map((v, i) => ({ x: x(i), y: H - 8 - (v / max) * (H - 24) }));
    const d = smoothPath(pts);
    const area = pts.length ? `${d} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z` : '';
    return { pts, d, area };
  });

  const ticks = [1, 0.75, 0.5, 0.25, 0];
  const primaryMax = maxOf(lines[0]);
  const step = Math.max(1, Math.ceil(labels.length / 6));

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    setHover(Math.round(ratio * (n - 1)));
  };

  return (
    <div className="flex gap-2">
      <div className="flex h-[200px] w-10 shrink-0 flex-col justify-between pb-0 text-right text-[10px] text-[#B9C7BA] sm:w-12">
        {ticks.map((t) => (
          <span key={t}>{yFormat(primaryMax * t)}</span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div
          className="relative h-[200px] touch-pan-y"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {ticks.map((t) => (
              <div key={t} className="border-t border-[#F4F0E6]/10" />
            ))}
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <defs>
              {lines.map((l, i) => (
                <linearGradient key={i} id={`kv-grad-${i}-${l.stroke.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={l.stroke} stopOpacity="0.32" />
                  <stop offset="100%" stopColor={l.stroke} stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>
            {lines.map((l, i) => (
              <g key={i}>
                {l.fill && <path d={paths[i].area} fill={`url(#kv-grad-${i}-${l.stroke.slice(1)})`} />}
                <path
                  d={paths[i].d}
                  fill="none"
                  stroke={l.stroke}
                  strokeWidth={2}
                  strokeDasharray={l.dashed ? '5 4' : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}
          </svg>

          {hover !== null && (
            <>
              <div
                className="pointer-events-none absolute inset-y-0 w-px bg-[#B89A5A]/60"
                style={{ left: `${n === 1 ? 50 : (hover / (n - 1)) * 100}%` }}
              />
              {lines.map((l, i) => (
                <span
                  key={i}
                  className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#F4F0E6]"
                  style={{
                    left: `${n === 1 ? 50 : (hover / (n - 1)) * 100}%`,
                    top: `${(paths[i].pts[hover]?.y / H) * 100}%`,
                    backgroundColor: l.stroke,
                  }}
                />
              ))}
              <div
                className="pointer-events-none absolute top-1 z-10 w-36 rounded-lg bg-[#C8A96B] p-2.5 text-[11px] leading-relaxed text-[#07180D] shadow-lg"
                style={{
                  left: `${n === 1 ? 50 : (hover / (n - 1)) * 100}%`,
                  transform: hover > n / 2 ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)',
                }}
              >
                {tooltip(hover)}
              </div>
            </>
          )}
        </div>

        <div className="mt-2 flex justify-between text-[10px] text-[#B9C7BA]">
          {labels.map((l, i) => (
            <span key={`${l}-${i}`} className={i % step === 0 ? '' : 'invisible'}>
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBars({ counts }: { counts: Record<StatusKey, number> }) {
  const max = Math.max(...Object.values(counts), 1);
  return (
    <div className="flex h-56 items-end justify-between gap-1.5 sm:gap-2">
      {STATUS_ORDER.map((k) => (
        <div key={k} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-xs font-semibold">{counts[k]}</span>
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md transition-all duration-500"
              style={{
                height: `${(counts[k] / max) * 100}%`,
                minHeight: counts[k] ? 4 : 2,
                backgroundColor: STATUS_META[k].bar,
                opacity: counts[k] ? 1 : 0.25,
              }}
            />
          </div>
          <span className="w-full truncate text-center text-[9px] text-[#B9C7BA] sm:text-[10px]">
            {STATUS_META[k].label}
          </span>
        </div>
      ))}
    </div>
  );
}