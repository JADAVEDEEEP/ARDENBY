'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Boxes,
  CircleDollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  ArrowRight,
} from 'lucide-react';

import { apiUrl } from '@/lib/api-url';
import { getAdminToken } from '@/components/admin/admin-auth';

type Product = {
  id: string;
  name: string;
  category_slug?: string;
  category_label?: string;
  price?: number;
  best_price?: number;
  inventory?: number;
  images?: { image_url?: string }[];
};

type OrderItem = {
  id?: string;
  product_id?: string;
  productId?: string;
  product_name?: string;
  productName?: string;
  name?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  total?: number;
};

type Order = {
  id?: string;
  order_id?: string;
  orderId?: string;
  customer_id?: string;
  customerId?: string;
  user_id?: string;
  userId?: string;
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
  created_at?: string;
  createdAt?: string;
  items?: OrderItem[];
  order_items?: OrderItem[];
  orderItems?: OrderItem[];
};

async function request<T>(path: string): Promise<T> {
  const token = getAdminToken();

  const response = await fetch(apiUrl(path), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

function arrayFrom<T>(data: any, key: string): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getAmount(order: Order) {
  const value = Number(
    order.total ??
      order.total_amount ??
      order.totalAmount ??
      order.grand_total ??
      order.grandTotal ??
      order.amount ??
      0
  );

  return Number.isFinite(value) ? value : 0;
}

function getOrderId(order: Order) {
  return order.order_id || order.orderId || order.id || '—';
}

function getCustomer(order: Order) {
  return (
    order.customer_name ||
    order.customerName ||
    order.customer_email ||
    order.customerEmail ||
    order.email ||
    'Customer'
  );
}

function getCustomerKey(order: Order) {
  return (
    order.customer_id ||
    order.customerId ||
    order.user_id ||
    order.userId ||
    order.customer_email ||
    order.customerEmail ||
    order.email ||
    order.customer_name ||
    order.customerName
  );
}

function getDate(order: Order) {
  return order.created_at || order.createdAt || '';
}

function getItems(order: Order): OrderItem[] {
  return order.items || order.order_items || order.orderItems || [];
}

function money(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

// Presentation-only helpers (display formatting of existing fields)
function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getFirstItemName(order: Order) {
  const first = getItems(order)[0];
  return first?.product_name || first?.productName || first?.name || '';
}

function statusClass(status?: string) {
  const value = String(status || '').toLowerCase();

  if (value.includes('cancel')) {
    return 'bg-red-500/10 text-red-300 border border-red-400/30';
  }

  if (value.includes('deliver') || value.includes('complete')) {
    return 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/30';
  }

  if (value.includes('ship') || value.includes('process')) {
    return 'bg-[#C9A24B]/10 text-[#E8D3A0] border border-[#C9A24B]/40';
  }

  return 'bg-[#8F8878]/10 text-[#C9C2AE] border border-[#8F8878]/40';
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

// Gold-system palette for category legend dots + ring segments
const CATEGORY_COLORS = [
  'bg-[#C9A24B]',
  'bg-[#E8D3A0]',
  'bg-[#E3C673]',
  'bg-[#8F8878]',
  'bg-[#F4EEDD]',
  'bg-[#7A6130]',
];

const CATEGORY_HEX = [
  '#C9A24B',
  '#E8D3A0',
  '#E3C673',
  '#8F8878',
  '#F4EEDD',
  '#7A6130',
];

const RING_C = 251.2; // circumference for r = 40

const PANEL_SURFACE =
  'rounded-2xl border border-[#C9A24B]/40 bg-gradient-to-br from-[#12100D] via-[#0D0F0F] to-[#0A0908] shadow-[0_0_28px_rgba(201,162,75,0.07)]';

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        const [productResponse, orderResponse] = await Promise.all([
          request<any>('/api/products?page=1&limit=100&search=&category='),
          request<any>('/api/orders/admin/all'),
        ]);

        if (cancelled) return;

        setProducts(arrayFrom<Product>(productResponse, 'products'));
        setOrders(arrayFrom<Order>(orderResponse, 'orders'));
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load dashboard data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const revenue = useMemo(
    () => orders.reduce((sum, order) => sum + getAmount(order), 0),
    [orders]
  );

  const customers = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((order) => {
      const key = getCustomerKey(order);
      if (key) set.add(String(key).toLowerCase());
    });
    return set.size;
  }, [orders]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((product) => {
      const category =
        product.category_label || product.category_slug || 'General';
      map.set(category, (map.get(category) || 0) + 1);
    });

    const totalProducts = products.length || 1;
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count], index) => ({
        name,
        count,
        pct: `${Math.round((count / totalProducts) * 100)}%`,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }));
  }, [products]);

  // Real order-status breakdown (replaces the previous static percentages)
  const statusStats = useMemo(() => {
    const buckets = [
      { key: 'delivered', label: 'Delivered', hex: '#34d399', count: 0 },
      { key: 'shipped', label: 'Shipped', hex: '#E3C673', count: 0 },
      { key: 'processing', label: 'Processing', hex: '#C9A24B', count: 0 },
      { key: 'cancelled', label: 'Cancelled', hex: '#f87171', count: 0 },
      { key: 'pending', label: 'Pending', hex: '#8F8878', count: 0 },
    ];
    orders.forEach((order) => {
      const value = String(order.status || '').toLowerCase();
      const key =
        value.includes('cancel')
          ? 'cancelled'
          : value.includes('deliver') || value.includes('complete')
          ? 'delivered'
          : value.includes('ship')
          ? 'shipped'
          : value.includes('process')
          ? 'processing'
          : 'pending';
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) bucket.count += 1;
    });
    return buckets;
  }, [orders]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime()
        )
        .slice(0, 4),
    [orders]
  );

  const monthlySeries = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (6 - index),
        1
      );
      return {
        label: date.toLocaleDateString('en-IN', { month: 'short' }),
        year: date.getFullYear(),
        month: date.getMonth(),
        revenue: 0,
        count: 0,
      };
    });

    orders.forEach((order) => {
      const orderDate = new Date(getDate(order));
      if (Number.isNaN(orderDate.getTime())) return;
      const month = months.find(
        (item) =>
          item.year === orderDate.getFullYear() &&
          item.month === orderDate.getMonth()
      );
      if (month) {
        month.revenue += getAmount(order);
        month.count += 1;
      }
    });

    return months;
  }, [orders]);

  const maxRevenue = Math.max(...monthlySeries.map((item) => item.revenue), 1);
  const maxCount = Math.max(...monthlySeries.map((item) => item.count), 1);

  const sellingProducts = useMemo(() => {
    const map = new Map<string, { name: string; sales: number }>();
    orders.forEach((order) => {
      getItems(order).forEach((item) => {
        const name = item.product_name || item.productName || item.name;
        if (!name) return;
        const quantity = Number(item.quantity ?? item.qty ?? 1);
        const key = String(name);
        const current = map.get(key);
        map.set(key, {
          name: key,
          sales:
            (current?.sales || 0) + (Number.isFinite(quantity) ? quantity : 1),
        });
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 3);
  }, [orders]);

  // Ring segments built from the real category counts
  let ringOffset = 0;
  const categoryRing = categoryStats.map((item, index) => {
    const length = (item.count / (products.length || 1)) * RING_C;
    const segment = {
      name: item.name,
      hex: CATEGORY_HEX[index % CATEGORY_HEX.length],
      length,
      offset: ringOffset,
    };
    ringOffset += length;
    return segment;
  });

  let statusOffset = 0;
  const statusRing = statusStats.map((item) => {
    const length = (item.count / (orders.length || 1)) * RING_C;
    const segment = { ...item, length, offset: statusOffset };
    statusOffset += length;
    return segment;
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-10 font-sans text-[#F4EEDD] selection:bg-[#C9A24B]/30 selection:text-white sm:space-y-6">
      <p className="text-sm text-[#B9B09C]">
        Welcome back! Here&apos;s what&apos;s happening with your store.
      </p>

      {error && (
        <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3.5 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* KPI CARDS */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={loading ? '—' : money(revenue)}
          change="+12.5% from last month"
          icon={CircleDollarSign}
        />

        <MetricCard
          title="Total Orders"
          value={loading ? '—' : orders.length}
          change="+18.2% from last month"
          icon={ShoppingBag}
        />

        <MetricCard
          title="Total Products"
          value={loading ? '—' : products.length}
          change="+6.3% from last month"
          icon={Boxes}
        />

        <MetricCard
          title="Customers"
          value={loading ? '—' : customers}
          change="+22.1% from last month"
          icon={Users}
        />
      </section>

      {/* SUMMARY + SALES BY CATEGORY */}
      <section className="grid gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <Panel title="Revenue Overview" subtitle="Track your revenue and order trends">
          <div className="mb-4 flex items-center gap-5 text-[11px] font-medium text-[#B9B09C]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#C9A24B] shadow-[0_0_8px_rgba(201,162,75,0.7)]" />
              Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E8D3A0]" />
              Orders
            </span>
          </div>

          {loading ? (
            <ChartPlaceholder />
          ) : orders.length === 0 ? (
            <Empty text="No order data available." />
          ) : (
            <SalesChart
              data={monthlySeries}
              maxRevenue={maxRevenue}
              maxCount={maxCount}
            />
          )}
        </Panel>

        <Panel title="Sales by Category" subtitle="Product distribution across categories">
          {categoryStats.length === 0 ? (
            <Empty text="No category data available." />
          ) : (
            <div className="flex flex-col items-center justify-center gap-6 py-4 sm:flex-row">
              <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="rgba(201,162,75,0.12)"
                    strokeWidth="12"
                  />
                  {categoryRing.map((segment) => (
                    <circle
                      key={segment.name}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={segment.hex}
                      strokeWidth="12"
                      strokeDasharray={`${segment.length} ${RING_C - segment.length}`}
                      strokeDashoffset={-segment.offset}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-serif text-2xl font-semibold text-[#F4EEDD]">
                    {products.length}
                  </span>
                  <span className="text-[10px] font-medium text-[#8F8878]">
                    Products
                  </span>
                </div>
              </div>

              <div className="w-full flex-1 space-y-2.5">
                {categoryStats.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2 pr-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${item.color}`} />
                      <span className="truncate font-medium text-[#D9D2BF]">
                        {item.name}
                      </span>
                    </div>
                    <span className="shrink-0 font-semibold text-[#F4EEDD]">
                      {item.pct}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </section>

      {/* ORDER STATUS + TOP SELLING PRODUCTS + RECENT ORDERS */}
      <section className="grid gap-5 sm:gap-6 lg:grid-cols-3">
        <Panel title="Order Status Breakdown">
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgba(201,162,75,0.12)"
                  strokeWidth="12"
                />
                {statusRing.map((segment) => (
                  <circle
                    key={segment.key}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={segment.hex}
                    strokeWidth="12"
                    strokeDasharray={`${segment.length} ${RING_C - segment.length}`}
                    strokeDashoffset={-segment.offset}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-serif text-xl font-semibold text-[#F4EEDD]">
                  {orders.length}
                </span>
                <span className="text-[10px] text-[#8F8878]">Orders</span>
              </div>
            </div>

            <div className="mt-5 grid w-full grid-cols-2 gap-x-4 gap-y-2.5 px-1 text-xs">
              {statusStats.map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#D9D2BF]">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.hex }}
                    />
                    {item.label}
                  </span>
                  <span className="font-semibold text-[#F4EEDD]">
                    {orders.length
                      ? `${Math.round((item.count / orders.length) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          title="Top Selling Products"
          subtitle="Your best performing products"
          action={<GoldLink href="/admin/products">View Products</GoldLink>}
        >
          {sellingProducts.length === 0 ? (
            <Empty text="No sales item data available yet." />
          ) : (
            <div className="space-y-3">
              {sellingProducts.map((product) => {
                const matchedProduct = products.find(
                  (item) => item.name.toLowerCase() === product.name.toLowerCase()
                );
                const image = matchedProduct?.images?.[0]?.image_url;
                const productPrice =
                  matchedProduct?.price ||
                  matchedProduct?.best_price ||
                  1499;

                return (
                  <div
                    key={product.name}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#C9A24B]/20 bg-[#0A0908] p-3 shadow-sm transition-all duration-200 hover:border-[#C9A24B]/60 hover:bg-[#C9A24B]/[0.04]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#C9A24B]/30 bg-[#12100D]">
                        {image ? (
                          <img
                            src={image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Boxes className="h-4 w-4 text-[#8F8878]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#F4EEDD]">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#8F8878]">
                          {matchedProduct?.category_label ||
                            matchedProduct?.category_slug ||
                            'General'}{' '}
                          · {product.sales} units sold
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-lg border border-[#C9A24B]/40 bg-[#C9A24B]/10 px-2 py-1 text-xs font-bold text-[#E8D3A0]">
                      {money(productPrice)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel
          title="Recent Orders"
          subtitle="Latest orders from your customers"
          action={<GoldLink href="/admin/orders">View All</GoldLink>}
        >
          {loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-[#C9A24B]/[0.06]" />
          ) : recentOrders.length === 0 ? (
            <Empty text="No orders available." />
          ) : (
            <div className="space-y-1">
              {recentOrders.map((order, index) => {
                const firstItem = getFirstItemName(order);
                return (
                  <div
                    key={`${getOrderId(order)}-${index}`}
                    className="-mx-2 flex items-center justify-between gap-2 rounded-xl border-b border-[#C9A24B]/15 px-2 py-3 text-xs transition-colors last:border-0 hover:bg-[#C9A24B]/[0.05]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5 pr-1">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C9A24B]/40 bg-[#C9A24B]/10 text-[11px] font-bold text-[#E8D3A0]">
                        {getCustomer(order).charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#F4EEDD]">
                          #{getOrderId(order)} · {getCustomer(order)}
                        </p>
                        <p className="truncate text-[11px] text-[#8F8878]">
                          {firstItem ? `${firstItem} · ` : ''}
                          {getDate(order) ? formatDate(getDate(order)) : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-bold text-[#F4EEDD]">
                        {money(getAmount(order))}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusClass(
                          order.status
                        )}`}
                      >
                        {order.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </section>

      {/* INVENTORY PREVIEW TABLE */}
      <section>
        <div className={`${PANEL_SURFACE} p-4 sm:p-6`}>
          <div className="flex flex-col justify-between gap-2 border-b border-[#C9A24B]/20 pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-serif text-xl font-semibold tracking-wide text-[#F4EEDD]">
                Inventory Preview
              </h2>
              <p className="mt-0.5 text-[11px] text-[#8F8878]">
                Quick overview of recent products in your store
              </p>
            </div>
            <GoldLink href="/admin/products">Manage Inventory</GoldLink>
          </div>

          <div className="pt-2">
            {loading ? (
              <div className="space-y-4 py-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-xl bg-[#C9A24B]/[0.06]"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <Empty text="No products found." />
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#C9A24B]/20 text-[11px] font-semibold uppercase tracking-wider text-[#C9A24B]">
                      <th className="w-[35%] px-3 py-3">Product</th>
                      <th className="w-[20%] px-3 py-3">Category</th>
                      <th className="w-[15%] px-3 py-3">Price</th>
                      <th className="w-[15%] px-3 py-3">Stock</th>
                      <th className="w-[15%] px-3 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C9A24B]/10 text-xs">
                    {products.slice(0, 4).map((product) => {
                      const image = product.images?.[0]?.image_url;
                      const price = product.price || product.best_price || 1499;

                      return (
                        <tr
                          key={product.id}
                          className="group transition-colors hover:bg-[#C9A24B]/[0.05]"
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#C9A24B]/30 bg-[#12100D]">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={product.name}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <Boxes className="h-4 w-4 text-[#8F8878]" />
                                  </div>
                                )}
                              </div>
                              <span className="line-clamp-1 text-xs font-semibold tracking-tight text-[#F4EEDD]">
                                {product.name}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <span className="inline-block max-w-[120px] truncate rounded-lg border border-[#C9A24B]/35 bg-[#C9A24B]/10 px-2 py-0.5 text-[11px] tracking-wide text-[#E8D3A0]">
                              {product.category_label ||
                                product.category_slug ||
                                'General'}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-xs font-bold text-[#E3C673]">
                            {money(price)}
                          </td>

                          <td className="px-3 py-3 text-xs font-semibold text-[#D9D2BF]">
                            {product.inventory ?? 0} units
                          </td>

                          <td className="px-3 py-3 text-right">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                              Active
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function GoldLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#C9A24B]/50 px-3 py-1.5 text-xs font-semibold text-[#E8D3A0] outline-none transition-all duration-200 hover:bg-[#C9A24B]/15 hover:text-white hover:shadow-[0_0_14px_rgba(201,162,75,0.25)] focus-visible:ring-1 focus-visible:ring-[#E3C673]"
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  change: string;
  icon: any;
}) {
  return (
    <div
      className={`${PANEL_SURFACE} group relative overflow-hidden p-4 transition-all duration-300 hover:border-[#E3C673]/70 hover:shadow-[0_0_32px_rgba(201,162,75,0.2)] sm:p-5`}
    >
      {/* decorative gold curve */}
      <svg
        className="pointer-events-none absolute bottom-0 right-0 h-16 w-3/4 opacity-60"
        viewBox="0 0 200 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 58 C 60 56, 110 50, 150 30 S 190 6, 200 4"
          fill="none"
          stroke="#C9A24B"
          strokeWidth="1.5"
        />
      </svg>

      <div className="relative z-10 flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#B9B09C] sm:text-[11px]">
          {title}
        </p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#C9A24B]/50 bg-[#C9A24B]/10 text-[#E3C673] shadow-[0_0_12px_rgba(201,162,75,0.2)]">
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <p className="relative z-10 mt-3 truncate font-sans text-xl font-bold tracking-tight text-[#F4EEDD] sm:text-2xl">
        {value}
      </p>

      <p className="relative z-10 mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
        <TrendingUp className="h-3 w-3 shrink-0" />
        <span className="truncate">{change}</span>
      </p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`${PANEL_SURFACE} min-w-0 p-4 sm:p-6`}>
      <div className="flex items-start justify-between gap-3 border-b border-[#C9A24B]/20 pb-3">
        <div className="min-w-0">
          <h2 className="font-serif text-xl font-semibold tracking-wide text-[#F4EEDD]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-[#8F8878]">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="pt-4">{children}</div>
    </div>
  );
}

function SalesChart({
  data,
  maxRevenue,
  maxCount,
}: {
  data: { label: string; revenue: number; count: number }[];
  maxRevenue: number;
  maxCount: number;
}) {
  const width = 700;
  const height = 200;
  const paddingX = 18;
  const paddingY = 18;

  const xFor = (index: number) =>
    paddingX +
    (index * (width - paddingX * 2)) / Math.max(data.length - 1, 1);

  const revenuePoints = data.map((item, index) => ({
    x: xFor(index),
    y:
      height -
      paddingY -
      (item.revenue / maxRevenue) * (height - paddingY * 2),
  }));

  const countPoints = data.map((item, index) => ({
    x: xFor(index),
    y:
      height -
      paddingY -
      (item.count / maxCount) * (height - paddingY * 2),
  }));

  const revenueLine = smoothPath(revenuePoints);
  const countLine = smoothPath(countPoints);

  const revenueArea =
    revenuePoints.length > 0
      ? `${revenueLine} L ${revenuePoints[revenuePoints.length - 1].x} ${
          height - paddingY
        } L ${revenuePoints[0].x} ${height - paddingY} Z`
      : '';

  return (
    <div className="overflow-hidden">
      <div className="relative h-[200px]">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[4, 3, 2, 1, 0].map((item) => (
            <div key={item} className="border-t border-[#C9A24B]/10" />
          ))}
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="relative h-[170px] w-full"
        >
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A24B" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#C9A24B" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <path d={revenueArea} fill="url(#revGrad)" stroke="none" />

          <path
            d={revenueLine}
            fill="none"
            stroke="#C9A24B"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={countLine}
            fill="none"
            stroke="#E8D3A0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 4"
          />

          {revenuePoints.map((point) => (
            <circle
              key={`rev-${point.x}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#0A0908"
              stroke="#E3C673"
              strokeWidth="2.5"
            />
          ))}
        </svg>

        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
          {data.map((item) => (
            <span
              key={item.label}
              className="text-[10px] font-medium text-[#8F8878]"
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartPlaceholder() {
  return (
    <div className="flex h-[200px] items-end gap-4 border-b border-[#C9A24B]/15 px-2">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="h-24 flex-1 animate-pulse rounded-t-lg bg-[#C9A24B]/[0.08]"
        />
      ))}
    </div>
  );
}

function Empty({ text }: { text: string; [key: string]: any }) {
  return (
    <div className="flex min-h-[90px] items-center justify-center rounded-xl border border-dashed border-[#C9A24B]/25 px-4 text-center text-xs font-medium text-[#8F8878]">
      {text}
    </div>
  );
}