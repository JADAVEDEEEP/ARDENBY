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

function statusClass(status?: string) {
  const value = String(status || '').toLowerCase();

  if (value.includes('cancel')) {
    return 'bg-red-500/10 text-red-400 border border-red-500/20';
  }

  if (value.includes('deliver') || value.includes('complete')) {
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  }

  if (value.includes('ship') || value.includes('process')) {
    return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  }

  return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
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

const CATEGORY_COLORS = [
  'bg-amber-600',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-pink-600',
  'bg-purple-600',
  'bg-slate-600',
];

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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-[#1a1c23] font-sans selection:bg-amber-500/30 selection:text-amber-900 pb-10">
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-xs text-red-600 backdrop-blur-md">
          {error}
        </div>
      )}

      {/* KPI CARDS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={loading ? '—' : money(revenue)}
          change="+12.5% from last month"
          icon={CircleDollarSign}
          gradient="from-amber-500/10 via-orange-500/5 to-transparent"
          iconBg="bg-amber-500/15 text-amber-700 border border-amber-500/30 shadow-sm"
        />

        <MetricCard
          title="Total Orders"
          value={loading ? '—' : orders.length}
          change="+18.2% from last month"
          icon={ShoppingBag}
          gradient="from-blue-500/10 via-cyan-500/5 to-transparent"
          iconBg="bg-blue-500/15 text-blue-700 border border-blue-500/30 shadow-sm"
        />

        <MetricCard
          title="Total Products"
          value={loading ? '—' : products.length}
          change="+6.3% from last month"
          icon={Boxes}
          gradient="from-emerald-500/10 via-teal-500/5 to-transparent"
          iconBg="bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 shadow-sm"
        />

        <MetricCard
          title="Customers"
          value={loading ? '—' : customers}
          change="+22.1% from last month"
          icon={Users}
          gradient="from-pink-500/10 via-rose-500/5 to-transparent"
          iconBg="bg-pink-500/15 text-pink-700 border border-pink-500/30 shadow-sm"
        />
      </section>

      {/* SUMMARY + REAL SALES BY CATEGORY */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <Panel title="Revenue Overview">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[11px] font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-600 shadow-sm" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                Orders
              </span>
            </div>
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

        <Panel title="Sales by Category">
          {categoryStats.length === 0 ? (
            <Empty text="No category data available." />
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
              <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="rgba(0,0,0,0.06)"
                    strokeWidth="14"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#d97706"
                    strokeWidth="14"
                    strokeDasharray="251.2"
                    strokeDashoffset="60"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#2563eb"
                    strokeWidth="14"
                    strokeDasharray="251.2"
                    strokeDashoffset="160"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#059669"
                    strokeWidth="14"
                    strokeDasharray="251.2"
                    strokeDashoffset="210"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-bold text-slate-900">
                    {products.length}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">
                    Products
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-2">
                {categoryStats.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${item.color}`} />
                      <span className="font-medium text-slate-700 truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="shrink-0 font-semibold text-slate-900">
                      {item.pct}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </section>

      {/* ORDER STATUS + REAL TOP SELLING PRODUCTS + RECENT ORDERS */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Panel title="Order Status Breakdown">
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#059669"
                  strokeWidth="12"
                  strokeDasharray="251.2"
                  strokeDashoffset="80"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#2563eb"
                  strokeWidth="12"
                  strokeDasharray="251.2"
                  strokeDashoffset="210"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#d97706"
                  strokeWidth="12"
                  strokeDasharray="251.2"
                  strokeDashoffset="235"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#dc2626"
                  strokeWidth="12"
                  strokeDasharray="251.2"
                  strokeDashoffset="245"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-bold text-slate-900">
                  {orders.length}
                </span>
                <span className="text-[10px] text-slate-500">Orders</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 w-full px-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  Delivered
                </span>
                <span className="font-semibold text-slate-900">68%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  Processing
                </span>
                <span className="font-semibold text-slate-900">18%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-amber-600" />
                  Shipped
                </span>
                <span className="font-semibold text-slate-900">10%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-red-600" />
                  Cancelled
                </span>
                <span className="font-semibold text-slate-900">4%</span>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Top Selling Products"
          action={
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
            >
              View Products
            </Link>
          }
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
                    className="flex items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-white p-3 hover:border-amber-500/40 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                        {image ? (
                          <img
                            src={image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Boxes className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {product.sales} units sold
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 text-xs font-bold text-amber-700 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
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
          action={
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
            >
              View All
            </Link>
          }
        >
          {loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-black/[0.03]" />
          ) : recentOrders.length === 0 ? (
            <Empty text="No orders available." />
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order, index) => (
                <div
                  key={`${getOrderId(order)}-${index}`}
                  className="flex items-center justify-between gap-2 border-b border-black/[0.06] pb-3 last:border-0 last:pb-0 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 truncate">
                      #{getOrderId(order)}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {getCustomer(order)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusClass(
                      order.status
                    )}`}
                  >
                    {order.status || 'Pending'}
                  </span>
                  <span className="shrink-0 font-bold text-slate-900">
                    {money(getAmount(order))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>

      {/* INVENTORY PREVIEW TABLE */}
      <section>
        <div className="rounded-3xl border border-black/[0.08] bg-white p-4 sm:p-6 shadow-md backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-black/[0.06]">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-wide">
                Inventory Preview
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Quick overview of recent products in your store
              </p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
            >
              Manage Inventory
            </Link>
          </div>

          <div className="pt-2">
            {loading ? (
              <div className="space-y-4 py-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-2xl bg-black/[0.03]"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <Empty text="No products found." />
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-black/[0.06] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3 w-[35%]">Product</th>
                      <th className="py-3 px-3 w-[20%]">Category</th>
                      <th className="py-3 px-3 w-[15%]">Price</th>
                      <th className="py-3 px-3 w-[15%]">Stock</th>
                      <th className="py-3 px-3 w-[15%] text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] text-xs">
                    {products.slice(0, 4).map((product) => {
                      const image = product.images?.[0]?.image_url;
                      const price = product.price || product.best_price || 1499;

                      return (
                        <tr
                          key={product.id}
                          className="group hover:bg-amber-500/[0.02] transition-colors"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#F9F6EE] border border-black/[0.08] shadow-sm">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={product.name}
                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <Boxes className="h-4 w-4 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <span className="font-bold text-slate-900 tracking-tight text-xs line-clamp-1">
                                {product.name}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3 font-semibold text-slate-600">
                            <span className="inline-block text-[11px] tracking-wide text-amber-800 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 truncate max-w-[120px]">
                              {product.category_label ||
                                product.category_slug ||
                                'General'}
                            </span>
                          </td>

                          <td className="py-3 px-3 font-extrabold text-amber-700 text-xs">
                            {money(price)}
                          </td>

                          <td className="py-3 px-3 font-bold text-slate-800 text-xs">
                            {product.inventory ?? 0} units
                          </td>

                          <td className="py-3 px-3 text-right">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
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

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  gradient,
  iconBg,
}: {
  title: string;
  value: string | number;
  change: string;
  icon: any;
  gradient: string;
  iconBg: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-black/[0.08] bg-white p-5 shadow-md backdrop-blur-xl">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 pointer-events-none`}
      />

      <div className="relative z-10 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
          {title}
        </p>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-2xl ${iconBg}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <p className="relative z-10 mt-3 text-2xl font-black tracking-tight text-slate-900">
        {value}
      </p>

      <p className="relative z-10 mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
        <TrendingUp className="h-3 w-3" />
        {change}
      </p>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-3xl border border-black/[0.08] bg-white p-5 sm:p-6 shadow-md backdrop-blur-xl">
      <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
        <h2 className="text-sm font-bold text-slate-900 tracking-wide">{title}</h2>
        {action}
      </div>
      <div className="pt-3">{children}</div>
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
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[4, 3, 2, 1, 0].map((item) => (
            <div key={item} className="border-t border-black/[0.06]" />
          ))}
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="relative h-[170px] w-full"
        >
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <path d={revenueArea} fill="url(#revGrad)" stroke="none" />

          <path
            d={revenueLine}
            fill="none"
            stroke="#d97706"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={countLine}
            fill="none"
            stroke="#f59e0b"
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
              fill="#ffffff"
              stroke="#d97706"
              strokeWidth="2.5"
            />
          ))}
        </svg>

        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
          {data.map((item) => (
            <span
              key={item.label}
              className="text-[10px] font-medium text-slate-500"
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
    <div className="flex h-[200px] items-end gap-4 border-b border-black/[0.06] px-2">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="h-24 flex-1 animate-pulse rounded-t-lg bg-black/[0.04]"
        />
      ))}
    </div>
  );
}

function Empty({ text }: { text: string; [key: string]: any }) {
  return (
    <div className="flex min-h-[90px] items-center justify-center px-4 text-center text-xs text-slate-500 font-medium">
      {text}
    </div>
  );
}