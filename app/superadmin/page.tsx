'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  UserCog,
  Users,
} from 'lucide-react';

import {
  DashboardData,
  errorMessage,
  formatDate,
  formatInr,
  superAdminRequest,
} from '@/lib/superadmin-api';
import { cn } from '@/lib/utils';

const RANGES = [7, 30, 90] as const;

const card =
  'rounded-xl border border-[#E3E5EE] bg-[#FFFFFF] ';

/* ------------------------------ small pieces ------------------------------ */

function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(card, 'p-5', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#4338CA]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <div className={cn(card, 'p-5')}>
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#5A6075]">
          {label}
        </p>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E3E5EE] bg-[#FFFFFF]">
          <Icon className="h-4 w-4 text-[#4338CA]" />
        </span>
      </div>
      <p className="mt-3 font-serif text-3xl text-[#11162B]">{value}</p>
      {hint && <p className="mt-1 text-[13px] text-[#5A6075]">{hint}</p>}
    </div>
  );
}

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[13px] text-[#5A6075]">no prior data</span>;
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[13px]', up ? 'text-[#17603F]' : 'text-[#9A2C1F]')}>
      <Icon className="h-3.5 w-3.5" />
      {up ? '+' : ''}
      {value}% vs previous
    </span>
  );
}

const TONE: Record<string, string> = {
  paid: 'border-[#17603F]/40 text-[#17603F]',
  delivered: 'border-[#17603F]/40 text-[#17603F]',
  shipped: 'border-[#E3E5EE]/40 text-[#5A6075]',
  refunded: 'border-[#E3E5EE] text-[#4338CA]',
  pending: 'border-[#E3E5EE] text-[#4338CA]',
  'refund pending': 'border-[#E3E5EE] text-[#4338CA]',
  'partially refunded': 'border-[#E3E5EE]/40 text-[#5A6075]',
  cancelled: 'border-[#9A2C1F]/40 text-[#9A2C1F]',
  failed: 'border-[#9A2C1F]/40 text-[#9A2C1F]',
};

function Badge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[12px] font-medium capitalize',
        TONE[value.toLowerCase()] || 'border-[#E3E5EE]/40 text-[#5A6075]'
      )}
    >
      {value}
    </span>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-[15px] text-[#5A6075]">{children}</p>;
}

/* --------------------------------- chart ---------------------------------- */

function RevenueChart({ series }: { series: DashboardData['series'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...series.map((p) => p.revenue), 0);

  if (series.every((p) => p.revenue === 0 && p.orders === 0)) {
    return <Empty>No orders in this period yet.</Empty>;
  }

  const W = 600;
  const H = 180;
  const gap = series.length > 45 ? 1 : 3;
  const bar = (W - gap * (series.length - 1)) / series.length;
  const active = hover === null ? null : series[hover];

  return (
    <div>
      <div className="mb-2 flex h-5 items-center justify-between text-[13px] text-[#5A6075]">
        <span>{active ? formatDate(active.date) : 'Paid revenue per day'}</span>
        <span className="text-[#11162B]">
          {active ? `${formatInr(active.revenue)} · ${active.orders} order${active.orders === 1 ? '' : 's'}` : `Peak ${formatInr(max)}`}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-44 w-full"
        role="img"
        aria-label="Paid revenue per day"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="kv-silver" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5A6075" />
            <stop offset="100%" stopColor="#5A6075" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1="0" x2={W} y1={H - f * (H - 6)} y2={H - f * (H - 6)} stroke="#4338CA" strokeOpacity="0.12" />
        ))}
        {series.map((p, i) => {
          const h = max > 0 ? Math.max((p.revenue / max) * (H - 6), p.revenue > 0 ? 2 : 0) : 0;
          return (
            <g key={p.date} onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
              <rect x={i * (bar + gap)} y="0" width={bar} height={H} fill="transparent" />
              <rect
                x={i * (bar + gap)}
                y={H - h}
                width={bar}
                height={h}
                rx="1.5"
                fill="url(#kv-silver)"
                opacity={hover === null || hover === i ? 1 : 0.45}
              />
              {p.revenue === 0 && p.orders > 0 && (
                <rect x={i * (bar + gap)} y={H - 2} width={bar} height="2" fill="#5A6075" />
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[12px] text-[#5A6075]">
        <span>{formatDate(series[0].date)}</span>
        <span>{formatDate(series[series.length - 1].date)}</span>
      </div>
    </div>
  );
}

function Breakdown({ items }: { items: { status: string; count: number }[] }) {
  const total = items.reduce((sum, i) => sum + i.count, 0);
  if (!total) return <Empty>No orders yet.</Empty>;
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.status}>
          <div className="flex justify-between text-[13px]">
            <span className="text-[#5A6075]">{i.status}</span>
            <span className="text-[#11162B]">{i.count}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#E3E5EE]">
            <div
              className="h-full rounded-full bg-[#4338CA]"
              style={{ width: `${(i.count / total) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn(card, 'h-[118px]')} />
        ))}
      </div>
      <div className={cn(card, 'h-72')} />
      <div className={cn(card, 'h-64')} />
    </div>
  );
}

/* ---------------------------------- page ---------------------------------- */

export default function SuperAdminPage() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const latest = useRef(0);

  const load = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    setError('');
    try {
      const response = await superAdminRequest<{ data: DashboardData }>(`/dashboard?days=${days}`);
      if (request === latest.current) setData(response.data);
    } catch (e) {
      if (request === latest.current) setError(errorMessage(e));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = (
    <button
      type="button"
      onClick={() => void load()}
      disabled={loading}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E3E5EE] px-3 text-[13px] font-semibold text-[#11162B] outline-none transition hover:bg-[#FFFFFF] focus-visible:ring-1 focus-visible:ring-[#4338CA] disabled:opacity-60"
    >
      <RefreshCw className={cn('h-4 w-4 text-[#4338CA]', loading && 'animate-spin')} />
      Refresh
    </button>
  );

  if (!data && loading) return <Skeleton />;

  if (!data) {
    return (
      <div className={cn(card, 'mx-auto max-w-md p-8 text-center')} role="alert">
        <AlertTriangle className="mx-auto h-8 w-8 text-[#9A2C1F]" />
        <p className="mt-3 font-serif text-xl">Dashboard unavailable</p>
        <p className="mt-2 text-[15px] text-[#5A6075]">{error}</p>
        <div className="mt-5 flex justify-center">{refresh}</div>
      </div>
    );
  }

  const { stats, revenue, orders, products, customers } = data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-[#5A6075]">
          Updated {formatDate(data.generatedAt, true)}
        </p>
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-[#E3E5EE]" role="group" aria-label="Date range">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDays(r)}
                aria-pressed={days === r}
                className={cn(
                  'h-10 px-3 text-[13px] font-semibold transition',
                  days === r ? 'bg-[#FFFFFF] text-[#11162B]' : 'text-[#5A6075] hover:bg-[#FFFFFF]'
                )}
              >
                {r}D
              </button>
            ))}
          </div>
          {refresh}
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-[#9A2C1F]/40 bg-[#FBE3DF]/10 px-4 py-2.5 text-[15px] text-[#9A2C1F]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Could not refresh: {error}. Showing the last loaded data.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Customers" value={stats.totalCustomers.toLocaleString('en-IN')} icon={Users} hint={`${customers.newLast30Days} joined in 30 days`} />
        <StatCard label="Total Products" value={stats.totalProducts.toLocaleString('en-IN')} icon={Boxes} hint={`${products.unitsInStock} units in stock`} />
        <StatCard label="Total Orders" value={stats.totalOrders.toLocaleString('en-IN')} icon={ShoppingBag} hint={`${orders.today} today`} />
        <StatCard label="Common Admins" value={stats.totalCommonAdmins.toLocaleString('en-IN')} icon={UserCog} hint="Active accounts" />
        <StatCard label="Super Admins" value={stats.totalSuperAdmins.toLocaleString('en-IN')} icon={ShieldCheck} hint="Active accounts" />
        <StatCard label="Total Revenue" value={formatInr(stats.totalRevenue)} icon={CircleDollarSign} hint={`${revenue.paidOrders} paid order${revenue.paidOrders === 1 ? '' : 's'}, excl. cancelled & refunded`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title={`Sales overview · ${days} days`} className="lg:col-span-2">
          <RevenueChart series={data.series} />
        </Panel>
        <Panel title="Revenue summary">
          <dl className="space-y-4 text-[15px]">
            {[
              ['Today', revenue.today, null, `${orders.today} orders`],
              ['Last 7 days', revenue.last7Days, revenue.last7DaysChange, `${orders.last7Days} orders`],
              ['Last 30 days', revenue.last30Days, revenue.last30DaysChange, `${orders.last30Days} orders`],
            ].map(([label, amount, change, count]) => (
              <div key={label as string} className="border-b border-[#4338CA]/10 pb-3 last:border-0 last:pb-0">
                <div className="flex items-baseline justify-between">
                  <dt className="text-[#5A6075]">{label as string}</dt>
                  <dd className="font-serif text-lg text-[#11162B]">{formatInr(amount as number)}</dd>
                </div>
                <div className="mt-0.5 flex justify-between text-[13px] text-[#5A6075]">
                  <span>{count as string}</span>
                  {change !== null && <Change value={change as number | null} />}
                </div>
              </div>
            ))}
            <div className="flex justify-between text-[13px]">
              <span className="text-[#5A6075]">Average paid order</span>
              <span className="text-[#11162B]">{formatInr(revenue.averageOrderValue)}</span>
            </div>
          </dl>
        </Panel>
      </div>

      <Panel title="Recent orders">
        {data.recentOrders.length === 0 ? (
          <Empty>No orders have been placed yet.</Empty>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[640px] text-left text-[15px]">
              <thead>
                <tr className="border-b border-[#E3E5EE] text-[12px] uppercase tracking-[0.18em] text-[#5A6075]">
                  <th className="pb-2 font-semibold">Order</th>
                  <th className="pb-2 font-semibold">Customer</th>
                  <th className="pb-2 text-right font-semibold">Amount</th>
                  <th className="pb-2 pl-4 font-semibold">Payment</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 text-right font-semibold">Placed</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-[#4338CA]/10 last:border-0">
                    <td className="py-3 pr-3 font-medium text-[#11162B]">{o.orderNumber}</td>
                    <td className="py-3 pr-3 text-[#5A6075]">
                      {o.customer}
                      {o.customerEmail && <span className="block text-[12px] text-[#5A6075]">{o.customerEmail}</span>}
                    </td>
                    <td className="py-3 text-right text-[#11162B]">{formatInr(o.amount)}</td>
                    <td className="py-3 pl-4"><Badge value={o.paymentStatus} /></td>
                    <td className="py-3"><Badge value={o.status} /></td>
                    <td className="py-3 text-right text-[13px] text-[#5A6075]">{formatDate(o.createdAt, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Order status">
          <Breakdown items={orders.byStatus} />
        </Panel>
        <Panel title="Payment status">
          <Breakdown items={orders.byPaymentStatus} />
        </Panel>
        <Panel title="Top selling products">
          {products.topSelling.length === 0 ? (
            <Empty>No paid sales yet.</Empty>
          ) : (
            <ol className="space-y-3">
              {products.topSelling.map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3 text-[15px]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#E3E5EE] text-[12px] text-[#4338CA]">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[#11162B]">{p.name}</span>
                  <span className="text-right text-[13px] text-[#5A6075]">
                    {p.units} sold
                    <span className="block text-[#5A6075]">{formatInr(p.revenue)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="Product statistics">
          <dl className="grid grid-cols-3 gap-3 text-center">
            {[
              ['In catalogue', products.total],
              [`Low stock (≤${products.lowStockLimit})`, products.lowStock],
              ['Out of stock', products.outOfStock],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-lg border border-[#E3E5EE] bg-[#FFFFFF]/60 p-3">
                <dd className="font-serif text-2xl text-[#11162B]">{value as number}</dd>
                <dt className="mt-1 text-[12px] uppercase tracking-wider text-[#5A6075]">{label as string}</dt>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Customer statistics">
          <dl className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            {[
              ['New · 7 days', customers.newLast7Days],
              ['New · 30 days', customers.newLast30Days],
              ['Verified', customers.verified],
              ['Have ordered', customers.withOrders],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-lg border border-[#E3E5EE] bg-[#FFFFFF]/60 p-3">
                <dd className="font-serif text-2xl text-[#11162B]">{value as number}</dd>
                <dt className="mt-1 text-[12px] uppercase tracking-wider text-[#5A6075]">{label as string}</dt>
              </div>
            ))}
          </dl>
          {customers.deactivated > 0 && (
            <p className="mt-3 text-[13px] text-[#5A6075]">{customers.deactivated} deactivated customer account(s) not counted above.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
