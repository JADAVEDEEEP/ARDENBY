'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  BadgePercent,
  Boxes,
  ChevronDown,
  CircleDollarSign,
  FolderTree,
  PackageCheck,
  ShoppingBag,
  Users,
} from 'lucide-react';

import { apiUrl } from '@/lib/api-url';

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
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('ardenby_token')
      : null;

  const response = await fetch(apiUrl(path), {
    headers: {
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
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
  return (
    order.items ||
    order.order_items ||
    order.orderItems ||
    []
  );
}

function getFirstItemName(order: Order) {
  const item = getItems(order)[0];
  const name = item?.product_name || item?.productName || item?.name;
  const extra = getItems(order).length > 1 ? ` +${getItems(order).length - 1}` : '';
  return name ? `${name}${extra}` : '—';
}

function money(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function shortDate(value: string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusClass(status?: string) {
  const value = String(status || '').toLowerCase();

  if (value.includes('cancel')) {
    return 'bg-[#fdeceb] text-[#c0392b]';
  }

  if (
    value.includes('deliver') ||
    value.includes('complete')
  ) {
    return 'bg-[#e7f7ed] text-[#1f8a4c]';
  }

  if (
    value.includes('ship') ||
    value.includes('process')
  ) {
    return 'bg-[#e9f1fb] text-[#2f6fb0]';
  }

  return 'bg-[#fdf3e0] text-[#b3811f]';
}

// Smooth cubic-bezier path through a set of points (nicer curve than straight segments)
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

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categoryCount, setCategoryCount] = useState(0);
  const [couponCount, setCouponCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        const [
          productResponse,
          orderResponse,
          categoryResponse,
          couponResponse,
        ] = await Promise.all([
          request<any>(
            '/api/products?page=1&limit=100&search=&category='
          ),
          request<any>('/api/orders/admin/all'),
          request<any>('/api/categories'),
          request<any>('/api/coupons'),
        ]);

        if (cancelled) return;

        setProducts(
          arrayFrom<Product>(
            productResponse,
            'products'
          )
        );

        setOrders(
          arrayFrom<Order>(
            orderResponse,
            'orders'
          )
        );

        setCategoryCount(
          arrayFrom<any>(
            categoryResponse,
            'categories'
          ).length
        );

        setCouponCount(
          arrayFrom<any>(
            couponResponse,
            'coupons'
          ).length
        );
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.message ||
              'Unable to load dashboard data.'
          );
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
    () =>
      orders.reduce(
        (sum, order) => sum + getAmount(order),
        0
      ),
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
        product.category_label ||
        product.category_slug ||
        'Uncategorized';

      map.set(
        category,
        (map.get(category) || 0) + 1
      );
    });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [products]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            new Date(getDate(b)).getTime() -
            new Date(getDate(a)).getTime()
        )
        .slice(0, 6),
    [orders]
  );

  const lowStock = useMemo(
    () =>
      [...products]
        .filter(
          (product) =>
            typeof product.inventory === 'number' &&
            product.inventory <= 5
        )
        .sort(
          (a, b) =>
            Number(a.inventory || 0) -
            Number(b.inventory || 0)
        )
        .slice(0, 5),
    [products]
  );

  // Monthly revenue + monthly order count, both from real order data
  const monthlySeries = useMemo(() => {
    const now = new Date();

    const months = Array.from(
      { length: 7 },
      (_, index) => {
        const date = new Date(
          now.getFullYear(),
          now.getMonth() - (6 - index),
          1
        );

        return {
          label: date.toLocaleDateString('en-IN', {
            month: 'short',
          }),
          year: date.getFullYear(),
          month: date.getMonth(),
          revenue: 0,
          count: 0,
        };
      }
    );

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

  const maxRevenue = Math.max(
    ...monthlySeries.map((item) => item.revenue),
    1
  );

  const maxCount = Math.max(
    ...monthlySeries.map((item) => item.count),
    1
  );

  const sellingProducts = useMemo(() => {
    const map = new Map<
      string,
      { name: string; sales: number }
    >();

    orders.forEach((order) => {
      getItems(order).forEach((item) => {
        const name =
          item.product_name ||
          item.productName ||
          item.name;

        if (!name) return;

        const quantity = Number(
          item.quantity ?? item.qty ?? 1
        );

        const key = String(name);

        const current = map.get(key);

        map.set(key, {
          name: key,
          sales:
            (current?.sales || 0) +
            (Number.isFinite(quantity)
              ? quantity
              : 1),
        });
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 4);
  }, [orders]);

  const topCustomers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; orders: number }
    >();

    orders.forEach((order) => {
      const key = getCustomerKey(order);

      if (!key) return;

      const normalized = String(key).toLowerCase();
      const current = map.get(normalized);

      map.set(normalized, {
        name: getCustomer(order),
        orders: (current?.orders || 0) + 1,
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 4);
  }, [orders]);

  const totalInventory = useMemo(
    () =>
      products.reduce(
        (sum, product) =>
          sum + Number(product.inventory || 0),
        0
      ),
    [products]
  );

  return (
    <div className="min-h-full bg-[#f5f6f8] p-4 sm:p-6 lg:p-8">
      {/* PAGE INTRO */}
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1c1f23] sm:text-3xl">
            Welcome back, Admin
          </h1>

          <p className="mt-1.5 text-sm text-[#8b929a]">
            Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          

         
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* KPI CARDS */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Ecommerce Revenue"
          value={loading ? '—' : money(revenue)}
          icon={CircleDollarSign}
          tint="bg-gradient-to-br from-[#fff1e0] to-[#ffe6c7]"
          iconTint="bg-white/70 text-[#c9822b]"
        />

        <MetricCard
          title="Total Products"
          value={loading ? '—' : products.length}
          icon={Boxes}
          tint="bg-gradient-to-br from-[#eaf7e6] to-[#dcf1d6]"
          iconTint="bg-white/70 text-[#4c9a3f]"
        />

        <MetricCard
          title="Total Orders"
          value={loading ? '—' : orders.length}
          icon={ShoppingBag}
          tint="bg-gradient-to-br from-[#e9f1ff] to-[#dbe9ff]"
          iconTint="bg-white/70 text-[#3f6fbf]"
        />

        <MetricCard
          title="Customers"
          value={loading ? '—' : customers}
          icon={Users}
          tint="bg-gradient-to-br from-[#fbe9ef] to-[#f8dbe6]"
          iconTint="bg-white/70 text-[#c05c81]"
        />
      </section>

      {/* SUMMARY + SELLING PRODUCTS */}
      <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.8fr)]">
        <Panel title="Summary">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs text-[#8c949b]">Revenue</p>

              <p className="mt-1 text-2xl font-semibold tracking-tight text-[#252a2f]">
                {loading ? '—' : money(revenue)}
              </p>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-[#788188]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#2f9e5c]" />
                Revenue
              </span>

              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#79d68a]" />
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

        <Panel
          title="Most Selling Products"
          action={
            <Link href="/admin/products" className="text-[#a47743]">
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          }
        >
          {sellingProducts.length === 0 ? (
            <Empty text="No order item data available." />
          ) : (
            <div className="space-y-2.5">
              {sellingProducts.map((product) => {
                const image = products.find(
                  (item) => item.name === product.name
                )?.images?.[0]?.image_url;

                return (
                  <div
                    key={product.name}
                    className="flex items-center gap-3 rounded-2xl border border-[#edf0f2] bg-[#fbfcfd] p-3"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#f0f2f4]">
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Boxes className="h-5 w-5 text-[#a5adb4]" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#30363b]">
                        {product.name}
                      </p>

                      <p className="mt-0.5 text-[11px] text-[#929aa1]">
                        {product.sales} sold
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#596169] shadow-sm">
                      {product.sales} Sales
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </section>

      {/* RECENT ORDERS + TOP CUSTOMERS */}
      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.8fr)]">
        <Panel
          title="Recent Orders"
          action={
            <Link
              href="/admin/orders"
              className="rounded-full border border-[#e0e5e8] bg-white px-3.5 py-1.5 text-[11px] font-medium text-[#4c78a0] shadow-sm"
            >
              View All
            </Link>
          }
        >
          {loading ? (
            <div className="h-48 animate-pulse rounded-xl bg-[#fafbfc]" />
          ) : recentOrders.length === 0 ? (
            <Empty text="No orders available." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="border-b border-[#edf0f2] text-left text-[11px] text-[#929aa1]">
                    <th className="px-2 py-3 font-medium">Product</th>
                    <th className="px-2 py-3 font-medium">Customer</th>
                    <th className="px-2 py-3 font-medium">Order ID</th>
                    <th className="px-2 py-3 font-medium">Date</th>
                    <th className="px-2 py-3 font-medium">Status</th>
                    <th className="px-2 py-3 text-right font-medium">Price</th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr
                      key={`${getOrderId(order)}-${index}`}
                      className="border-b border-[#f1f3f4] last:border-0"
                    >
                      <td className="max-w-[160px] truncate px-2 py-3.5 text-xs text-[#69727a]">
                        {getFirstItemName(order)}
                      </td>

                      <td className="max-w-[160px] truncate px-2 py-3.5 text-xs font-medium text-[#3f78b5]">
                        {getCustomer(order)}
                      </td>

                      <td className="px-2 py-3.5 text-xs font-semibold text-[#343a40]">
                        #{getOrderId(order)}
                      </td>

                      <td className="px-2 py-3.5 text-[11px] text-[#929aa1]">
                        {shortDate(getDate(order))}
                      </td>

                      <td className="px-2 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${statusClass(
                            order.status
                          )}`}
                        >
                          {order.status || 'Pending'}
                        </span>
                      </td>

                      <td className="px-2 py-3.5 text-right text-xs font-semibold text-[#343a40]">
                        {money(getAmount(order))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel
          title="Top Customers"
          action={<Users className="h-4 w-4 text-[#8d969d]" />}
        >
          {topCustomers.length === 0 ? (
            <Empty text="No customer data available." />
          ) : (
            <div className="space-y-3.5">
              {topCustomers.map((customerItem, index) => (
                <div
                  key={`${customerItem.name}-${index}`}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9eef2] text-xs font-semibold text-[#69747c]">
                    {customerItem.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#343a40]">
                      {customerItem.name}
                    </p>

                    <p className="mt-0.5 text-[11px] text-[#929aa1]">
                      {customerItem.orders}{' '}
                      {customerItem.orders === 1 ? 'Order' : 'Orders'}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-[#e3e7ea] px-3 py-1 text-[11px] font-medium text-[#596169]">
                    View
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>

      {/* CATEGORIES + INVENTORY + STORE MANAGEMENT */}
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Top Categories">
          {categoryStats.length === 0 ? (
            <Empty text="No category data available." />
          ) : (
            <div className="space-y-4">
              {categoryStats.map(([name, count]) => {
                const max = categoryStats[0]?.[1] || 1;

                return (
                  <div key={name}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="max-w-[75%] truncate text-xs text-[#687078]">
                        {name}
                      </span>

                      <span className="text-[11px] font-semibold text-[#4e575e]">
                        {count}
                      </span>
                    </div>

                    <div className="h-1.5 rounded-full bg-[#edf0f2]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#5a9bd2] to-[#8ec0e6]"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Inventory">
          <div className="grid grid-cols-2 gap-3">
            <SmallMetric
              label="Total Stock"
              value={loading ? '—' : totalInventory}
            />

            <SmallMetric
              label="Low Stock"
              value={loading ? '—' : lowStock.length}
            />
          </div>

          <div className="mt-4 space-y-2.5">
            {lowStock.length === 0 ? (
              <Empty text="No low-stock products." />
            ) : (
              lowStock.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 border-b border-[#f0f2f3] pb-2.5 last:border-0"
                >
                  <p className="truncate text-xs text-[#687078]">
                    {product.name}
                  </p>

                  <span className="shrink-0 rounded-full bg-[#fdeceb] px-2.5 py-1 text-[10px] font-semibold text-[#c0392b]">
                    {product.inventory} left
                  </span>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Store Management">
          <div className="grid grid-cols-2 gap-2.5">
            <ManagementCard
              href="/admin/products"
              icon={Boxes}
              title="Products"
              value={products.length}
            />

            <ManagementCard
              href="/admin/orders"
              icon={PackageCheck}
              title="Orders"
              value={orders.length}
            />

            <ManagementCard
              href="/admin/categories"
              icon={FolderTree}
              title="Categories"
              value={categoryCount}
            />

            <ManagementCard
              href="/admin/coupons"
              icon={BadgePercent}
              title="Coupons"
              value={couponCount}
            />
          </div>
        </Panel>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  tint,
  iconTint,
}: {
  title: string;
  value: string | number;
  icon: any;
  tint: string;
  iconTint: string;
}) {
  return (
    <div
      className={`min-h-[128px] rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${tint}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-[#5c646b]">{title}</p>

        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ${iconTint}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <p className="mt-5 text-2xl font-semibold tracking-tight text-[#22272b]">
        {value}
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
    <div className="min-w-0 rounded-2xl border border-[#e9ecef] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:p-5">
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-sm font-semibold text-[#343a40]">{title}</h2>
        {action}
      </div>

      <div className="pt-1">{children}</div>
    </div>
  );
}

function SmallMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-[#f7f9fa] p-3.5">
      <p className="text-[10px] text-[#929aa1]">{label}</p>

      <p className="mt-1 text-lg font-semibold text-[#343a40]">{value}</p>
    </div>
  );
}

function ManagementCard({
  href,
  icon: Icon,
  title,
  value,
}: {
  href: string;
  icon: any;
  title: string;
  value: number;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-[#e9ecef] bg-[#fafbfc] p-3.5 transition hover:border-[#cfd6dc] hover:bg-white"
    >
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-[#7d8790]" />

        <ArrowUpRight className="h-3.5 w-3.5 text-[#a2aab1] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>

      <p className="mt-3 text-[11px] text-[#7a838a]">{title}</p>

      <p className="mt-1 text-lg font-semibold text-[#343a40]">{value}</p>
    </Link>
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
  const height = 220;
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
      <div className="relative h-[240px]">
        <div className="absolute inset-0 flex flex-col justify-between">
          {[4, 3, 2, 1, 0].map((item) => (
            <div key={item} className="border-t border-[#f0f2f4]" />
          ))}
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="relative h-[210px] w-full"
        >
          <path d={revenueArea} fill="rgba(47,158,92,0.07)" stroke="none" />

          <path
            d={revenueLine}
            fill="none"
            stroke="#2f9e5c"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={countLine}
            fill="none"
            stroke="#79d68a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1 0"
          />

          {revenuePoints.map((point) => (
            <circle
              key={`rev-${point.x}`}
              cx={point.x}
              cy={point.y}
              r="3.5"
              fill="#ffffff"
              stroke="#2f9e5c"
              strokeWidth="2"
            />
          ))}
        </svg>

        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
          {data.map((item) => (
            <span key={item.label} className="text-[10px] text-[#929aa1]">
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
    <div className="flex h-[240px] items-end gap-4 border-b border-[#edf0f2] px-2">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="h-24 flex-1 animate-pulse rounded-t-lg bg-[#f1f3f5]"
        />
      ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex min-h-[100px] items-center justify-center px-4 text-center text-xs text-[#969ea5]">
      {text}
    </div>
  );
}