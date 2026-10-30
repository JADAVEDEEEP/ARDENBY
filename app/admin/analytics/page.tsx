'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Download,
  Minus,
  RefreshCw,
} from 'lucide-react';

import { adminApiRequest } from '@/components/admin/admin-auth';
import {
  Card,
  EmptyState,
  Notice,
  PageHeader,
  Spinner,
  btnOutline,
  fieldClass,
  labelClass,
} from '@/components/admin/ui';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Types (mirror GET /api/admin/analytics)                             */
/* ------------------------------------------------------------------ */

type Summary = {
  revenue: number;
  orders: number;
  paidOrders: number;
  averageOrderValue: number | null;
  units: number;
  delivered: number;
  cancelled: number;
  cancellationRate: number | null;
  refundedAmount: number;
  discounts: number;
};

type Analytics = {
  range: { from: string; to: string; days: number };
  previousRange: { from: string; to: string; days: number } | null;
  granularity: 'day' | 'week' | 'month';
  summary: Summary;
  previousSummary: Summary | null;
  comparison: Record<string, number | null> | null;
  series: { date: string; orders: number; revenue: number }[];
  statuses: { status: string; count: number }[];
  paymentMethods: { method: string; orders: number; revenue: number }[];
  topProducts: { id: string; name: string; image: string | null; units: number; revenue: number }[];
  categories: { category: string; units: number; revenue: number }[];
  coupons: { code: string; uses: number; discount: number; revenue: number }[];
};

type Preset = 'today' | '7d' | '30d' | 'month' | 'custom';

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'month', label: 'This Month' },
  { id: 'custom', label: 'Custom Range' },
];

const INK = '#111111';
const RED = '#E53935';
const GRID = '#E4E7EC';
const MUTED = '#626875';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const DAY = 86_400_000;
// The store trades in IST; the server buckets days in IST too.
const istToday = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
const shift = (iso: string, days: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);

function presetRange(preset: Exclude<Preset, 'custom'>) {
  const to = istToday();
  if (preset === 'today') return { from: to, to };
  if (preset === '7d') return { from: shift(to, -6), to };
  if (preset === '30d') return { from: shift(to, -29), to };
  return { from: `${to.slice(0, 7)}-01`, to };
}

const inr = (n: number) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const inrCompact = (n: number) =>
  n >= 1e7
    ? `₹${(n / 1e7).toFixed(1)}Cr`
    : n >= 1e5
    ? `₹${(n / 1e5).toFixed(1)}L`
    : n >= 1e3
    ? `₹${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k`
    : `₹${n}`;

const fmtDay = (iso: string, withYear = false) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  });

const bucketLabel = (iso: string, g: Analytics['granularity']) =>
  g === 'month'
    ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', {
        month: 'short',
        year: '2-digit',
        timeZone: 'UTC',
      })
    : g === 'week'
    ? `Wk ${fmtDay(iso)}`
    : fmtDay(iso);

const rangeLabel = (r: { from: string; to: string }) =>
  r.from === r.to ? fmtDay(r.from, true) : `${fmtDay(r.from)} – ${fmtDay(r.to, true)}`;

function csvEscape(v: string | number) {
  const s = String(v);
  // Neutralise spreadsheet formula injection from product names.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function Delta({
  value,
  inverse,
  label,
}: {
  value: number | null | undefined;
  inverse?: boolean;
  label: string;
}) {
  if (value === undefined) return null;
  if (value === null) {
    return (
      <p className="mt-3 text-[13px] text-[#626875]">
        <span className="font-semibold">N/A</span> · no earlier data to compare
      </p>
    );
  }
  const flat = value === 0;
  const good = inverse ? value < 0 : value > 0;
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-1.5 text-[13px] text-[#626875]">
      <span
        className={cn(
          'inline-flex items-center gap-0.5 font-bold',
          flat ? 'text-[#626875]' : good ? 'text-[#16845B]' : 'text-[#D92D20]'
        )}
      >
        <Icon className="h-4 w-4" />
        {Math.abs(value)}%
      </span>
      {label}
    </p>
  );
}

function Kpi({
  label,
  value,
  note,
  delta,
  inverse,
  compareLabel,
  accent,
}: {
  label: string;
  value: string;
  note?: string;
  delta?: number | null;
  inverse?: boolean;
  compareLabel: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[#E4E7EC] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]',
        accent && 'border-t-[3px] border-t-[#E53935]'
      )}
    >
      <p className="text-[14px] font-semibold text-[#626875]">{label}</p>
      <p className="mt-2 text-[34px] font-bold leading-none tracking-tight text-[#111111] md:text-[40px]">
        {value}
      </p>
      {note && <p className="mt-2 text-[13px] text-[#626875]">{note}</p>}
      <Delta value={delta} inverse={inverse} label={compareLabel} />
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  money,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#E4E7EC] bg-white px-3 py-2 text-[13px] shadow-lg">
      <p className="font-semibold text-[#111111]">{label}</p>
      <p className="text-[#626875]">
        {money ? inr(payload[0].value) : `${payload[0].value} orders`}
      </p>
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  delivered: '#16845B',
  shipped: '#111111',
  processing: '#C47A16',
  confirmed: '#C47A16',
  pending: '#98A0AE',
  cancelled: '#D92D20',
  returned: '#D92D20',
  'cancellation requested': '#D92D20',
};

function HBars({
  rows,
  format,
  color = INK,
}: {
  rows: { key: string; label: string; value: number; sub?: string; color?: string }[];
  format: (n: number) => string;
  color?: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="min-w-0 truncate font-semibold text-[#111111]">{r.label}</span>
            <span className="shrink-0 font-bold text-[#111111]">{format(r.value)}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#F2F4F7]">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max((r.value / max) * 100, 2)}%`, background: r.color ?? color }}
            />
          </div>
          {r.sub && <p className="mt-1 text-[12px] text-[#626875]">{r.sub}</p>}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<Preset>('30d');
  const [range, setRange] = useState(() => presetRange('30d'));
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [compare, setCompare] = useState(true);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ from: range.from, to: range.to, compare: compare ? '1' : '0' });
      const res = await adminApiRequest<{ data: Analytics }>(`/api/admin/analytics?${qs}`);
      setData(res.data);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Could not load analytics.');
    } finally {
      setLoading(false);
    }
  }, [range, compare]);

  useEffect(() => {
    void load();
  }, [load]);

  function choose(next: Preset) {
    setPreset(next);
    if (next !== 'custom') setRange(presetRange(next));
  }

  const today = istToday();
  const customInvalid =
    preset === 'custom' && (!customFrom || !customTo || customFrom > customTo || customTo > today);

  function applyCustom() {
    if (!customInvalid) setRange({ from: customFrom, to: customTo });
  }

  function exportCsv() {
    if (!data) return;
    const lines: (string | number)[][] = [
      ['KOVENIK analytics', rangeLabel(data.range)],
      [],
      ['Metric', 'Value'],
      ['Revenue (INR)', data.summary.revenue],
      ['Orders', data.summary.orders],
      ['Paid orders', data.summary.paidOrders],
      ['Average order value (INR)', data.summary.averageOrderValue ?? 'N/A'],
      ['Units sold', data.summary.units],
      ['Delivered orders', data.summary.delivered],
      ['Cancelled orders', data.summary.cancelled],
      ['Refunded amount (INR)', data.summary.refundedAmount],
      [],
      [`Per ${data.granularity}`, 'Orders', 'Revenue (INR)'],
      ...data.series.map((p) => [p.date, p.orders, p.revenue]),
      [],
      ['Top product', 'Units', 'Item revenue (INR)'],
      ...data.topProducts.map((p) => [p.name, p.units, p.revenue]),
      [],
      ['Category', 'Units', 'Item revenue (INR)'],
      ...data.categories.map((c) => [c.category, c.units, c.revenue]),
    ];
    const csv = lines.map((row) => row.map(csvEscape).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `kovenik-analytics-${data.range.from}_to_${data.range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const compareLabel = useMemo(
    () => (data?.previousRange ? `vs previous ${data.previousRange.days} day${data.previousRange.days === 1 ? '' : 's'} (${rangeLabel(data.previousRange)})` : ''),
    [data]
  );

  const hasSales = (data?.summary.orders ?? 0) > 0;
  const chartData = useMemo(
    () => (data ? data.series.map((p) => ({ ...p, label: bucketLabel(p.date, data.granularity) })) : []),
    [data]
  );

  const s = data?.summary;
  const c = data?.comparison;

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Sales performance from your real orders. Revenue counts paid orders that were not cancelled or refunded."
        actions={
          <>
            <button type="button" onClick={() => void load()} className={btnOutline} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </button>
            <button type="button" onClick={exportCsv} className={btnOutline} disabled={!data || !hasSales}>
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </>
        }
      />

      {/* Filters */}
      <Card className="mb-6" bodyClassName="space-y-4">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Date range">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => choose(p.id)}
              aria-pressed={preset === p.id}
              className={cn(
                'min-h-10 rounded-full border px-4 text-[14px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#E53935]/40',
                preset === p.id
                  ? 'border-[#111111] bg-[#111111] text-white'
                  : 'border-[#D0D5DD] bg-white text-[#111111] hover:border-[#111111]'
              )}
            >
              {p.label}
            </button>
          ))}
          <label className="ml-auto flex min-h-10 cursor-pointer items-center gap-2 text-[14px] font-semibold text-[#111111]">
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
              className="h-4 w-4 accent-[#E53935]"
            />
            Compare with previous period
          </label>
        </div>

        {preset === 'custom' && (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="a-from" className={labelClass}>
                From
              </label>
              <input
                id="a-from"
                type="date"
                max={today}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className={cn(fieldClass, 'w-44')}
              />
            </div>
            <div>
              <label htmlFor="a-to" className={labelClass}>
                To
              </label>
              <input
                id="a-to"
                type="date"
                max={today}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className={cn(fieldClass, 'w-44')}
              />
            </div>
            <button
              type="button"
              onClick={applyCustom}
              disabled={customInvalid}
              className="inline-flex min-h-11 items-center rounded-lg bg-[#E53935] px-5 text-[14px] font-semibold text-white transition hover:bg-[#C62E2B] disabled:opacity-50"
            >
              Apply
            </button>
            {customFrom && customTo && customFrom > customTo && (
              <p className="text-[13px] font-medium text-[#D92D20]">Start date must be before the end date.</p>
            )}
          </div>
        )}

        <p className="text-[13px] text-[#626875]">
          Showing <span className="font-semibold text-[#111111]">{rangeLabel(range)}</span> · grouped by{' '}
          {data?.granularity ?? 'day'} · times in IST · amounts in INR
        </p>
      </Card>

      {error && (
        <Notice tone="error" className="mb-6">
          {error}
        </Notice>
      )}

      {loading && !data && <Spinner label="Loading analytics" />}

      {data && s && (
        <div className={cn('space-y-6 transition-opacity', loading && 'opacity-60')}>
          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Kpi
              accent
              label="Total sales"
              value={inr(s.revenue)}
              note={`${s.paidOrders} paid order${s.paidOrders === 1 ? '' : 's'}${s.discounts ? ` · ${inr(s.discounts)} in discounts given` : ''}`}
              delta={c ? c.revenue : undefined}
              compareLabel={compareLabel}
            />
            <Kpi
              label="Total orders"
              value={s.orders.toLocaleString('en-IN')}
              note="All orders placed in this period"
              delta={c ? c.orders : undefined}
              compareLabel={compareLabel}
            />
            <Kpi
              label="Average order value"
              value={s.averageOrderValue === null ? 'N/A' : inr(s.averageOrderValue)}
              note="Revenue ÷ paid orders"
              delta={c ? (data.previousSummary?.averageOrderValue ? c.averageOrderValue : null) : undefined}
              compareLabel={compareLabel}
            />
            <Kpi
              label="Units sold"
              value={s.units.toLocaleString('en-IN')}
              note="Items in paid orders"
              delta={c ? c.units : undefined}
              compareLabel={compareLabel}
            />
            <Kpi
              label="Delivered orders"
              value={s.delivered.toLocaleString('en-IN')}
              note="Orders placed in this period now delivered"
              delta={c ? c.delivered : undefined}
              compareLabel={compareLabel}
            />
            <Kpi
              label="Cancelled orders"
              value={s.cancelled.toLocaleString('en-IN')}
              note={`${s.cancellationRate === null ? 'N/A' : `${s.cancellationRate}%`} cancellation rate${s.refundedAmount ? ` · ${inr(s.refundedAmount)} refunded` : ''}`}
              delta={c ? c.cancelled : undefined}
              inverse
              compareLabel={compareLabel}
            />
          </div>

          {!hasSales ? (
            <Card>
              <EmptyState icon={BarChart3} title="No orders in this period">
                Try a longer date range. Charts appear as soon as orders are placed.
              </EmptyState>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 xl:grid-cols-2">
                <Card title="Revenue trend" description={`Paid revenue per ${data.granularity}`}>
                  <div className="h-72" role="img" aria-label="Revenue over time">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={RED} stopOpacity={0.18} />
                            <stop offset="100%" stopColor={RED} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={GRID} vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
                        <YAxis tick={{ fill: MUTED, fontSize: 12 }} tickLine={false} axisLine={false} width={56} tickFormatter={inrCompact} />
                        <Tooltip content={<ChartTooltip money />} cursor={{ stroke: GRID }} />
                        <Area type="monotone" dataKey="revenue" stroke={RED} strokeWidth={2} fill="url(#rev)" dot={chartData.length <= 14 ? { r: 3, fill: RED, stroke: '#fff', strokeWidth: 2 } : false} activeDot={{ r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card title="Orders trend" description={`Orders placed per ${data.granularity} (all payment states)`}>
                  <div className="h-72" role="img" aria-label="Orders over time">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke={GRID} vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
                        <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 12 }} tickLine={false} axisLine={false} width={32} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F2F4F7' }} />
                        <Bar dataKey="orders" fill={INK} radius={[4, 4, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <Card title="Order status" description="Current status of orders placed in this period">
                  <HBars
                    format={(n) => `${n}`}
                    rows={data.statuses.map((x) => ({
                      key: x.status,
                      label: x.status,
                      value: x.count,
                      color: STATUS_COLOR[x.status.toLowerCase()] ?? INK,
                      sub: `${Math.round((x.count / Math.max(s.orders, 1)) * 100)}% of orders`,
                    }))}
                  />
                </Card>

                <Card
                  title="Best-selling products"
                  description="By units sold. Revenue is item price × quantity, before coupons and GST."
                  className="xl:col-span-2"
                >
                  {data.topProducts.length === 0 ? (
                    <EmptyState title="No product sales yet" />
                  ) : (
                    <ol className="divide-y divide-[#E4E7EC]">
                      {data.topProducts.map((p, i) => (
                        <li key={p.id} className="flex items-center gap-4 py-3">
                          <span className="w-5 text-[14px] font-bold text-[#98A0AE]">{i + 1}</span>
                          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#F2F4F7]">
                            {p.image && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[#111111]">{p.name}</span>
                          <span className="text-right">
                            <span className="block text-[15px] font-bold text-[#111111]">{p.units} sold</span>
                            <span className="block text-[13px] text-[#626875]">{inr(p.revenue)}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <Card title="Category performance" description="Item revenue by category" className="xl:col-span-2">
                  {data.categories.length === 0 ? (
                    <EmptyState title="No category data" />
                  ) : (
                    <HBars
                      format={inr}
                      color={RED}
                      rows={data.categories.map((x) => ({
                        key: x.category,
                        label: x.category,
                        value: x.revenue,
                        sub: `${x.units} unit${x.units === 1 ? '' : 's'} sold`,
                      }))}
                    />
                  )}
                </Card>

                <div className="space-y-6">
                  <Card title="Payment methods" description="Paid revenue by method">
                    {data.paymentMethods.length === 0 ? (
                      <p className="text-[14px] text-[#626875]">No paid orders yet.</p>
                    ) : (
                      <ul className="divide-y divide-[#E4E7EC]">
                        {data.paymentMethods.map((m) => (
                          <li key={m.method} className="flex items-center justify-between py-3 text-[14px]">
                            <span className="font-semibold uppercase text-[#111111]">{m.method}</span>
                            <span className="text-right">
                              <span className="block font-bold text-[#111111]">{inr(m.revenue)}</span>
                              <span className="block text-[12px] text-[#626875]">{m.orders} orders</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>

                  <Card title="Coupon performance" description="Paid orders that used a coupon">
                    {data.coupons.length === 0 ? (
                      <p className="text-[14px] text-[#626875]">No coupons used in this period.</p>
                    ) : (
                      <ul className="divide-y divide-[#E4E7EC]">
                        {data.coupons.map((cp) => (
                          <li key={cp.code} className="flex items-center justify-between py-3 text-[14px]">
                            <span className="font-mono font-bold text-[#111111]">{cp.code}</span>
                            <span className="text-right">
                              <span className="block font-bold text-[#111111]">{cp.uses} use{cp.uses === 1 ? '' : 's'}</span>
                              <span className="block text-[12px] text-[#626875]">{inr(cp.discount)} discounted</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
