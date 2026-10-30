'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { daysAgoIso, inr, todayIso } from '@/lib/admin-ops-api';
import { errorMessage, superAdminRequest } from '@/lib/superadmin-api';
import { cn } from '@/lib/utils';

type Totals = {
  orders: number;
  grossOrderValue: number;
  composition: { subtotal: number; discounts: number; shipping: number; tax: number };
  payments: {
    collected: number;
    collectedOrders: number;
    byMethod: { online: number; cod: number };
    failed: number;
    failedOrders: number;
    awaitingPayment: number;
    awaitingPaymentOrders: number;
  };
  refunds: {
    refunded: number;
    refundedOrders: number;
    partiallyRefundedOrders?: number;
    refundPending: number;
    refundPendingOrders: number;
    codReturnsAwaitingManualRefund: number;
  };
  cancellations: { cancelledOrders: number; cancelledValue: number; cancelledAfterPaymentValue: number };
  returns: { returnedOrders: number; returnedValue: number };
  net: { received: number; afterPendingRefunds: number };
};

type Report = {
  range: { from: string; to: string; days: number };
  generatedAt: string;
  totals: Totals;
  daily: {
    date: string;
    orders: number;
    grossOrderValue: number;
    collected: number;
    refunded: number;
    refundPending: number;
    failed: number;
    cancelled: number;
  }[];
  notes: string[];
};

const card = 'rounded-xl border border-[#E53935]/20 bg-gradient-to-b from-[#1A1A1A] to-[#111111]';
const field =
  'h-10 rounded-lg border border-[#E53935]/25 bg-[#1A1A1A]/80 px-3 text-sm text-[#F7F7F7] outline-none transition focus:border-[#E53935]/70';

function Stat({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div className={cn(card, 'px-4 py-3')}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#7A7A7A]">{label}</p>
      <p className={cn('mt-1 font-serif text-2xl', strong ? 'text-[#E53935]' : 'text-[#F7F7F7]')}>{value}</p>
      {hint && <p className="mt-1 text-xs text-[#979797]">{hint}</p>}
    </div>
  );
}

/** Money in, money out, side by side. Each figure is its own thing; none is a sum of the others unless stated. */
export default function FinancePage() {
  const [from, setFrom] = useState(daysAgoIso(29));
  const [to, setTo] = useState(todayIso());
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latest = useRef(0);

  const load = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    setError('');
    try {
      const response = await superAdminRequest<{ data: Report }>(`/reports/financial?from=${from}&to=${to}`);
      if (request === latest.current) setReport(response.data);
    } catch (e) {
      if (request === latest.current) setError(errorMessage(e));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const t = report?.totals;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl text-[#F7F7F7]">Financial report</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#979797]">
          Built from your orders. Dates are Indian Standard Time, and orders are grouped by the day they were placed.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-[#979797]">
          From{' '}
          <input type="date" className={field} value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="text-xs text-[#979797]">
          To{' '}
          <input type="date" className={field} value={to} min={from} max={todayIso()} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E53935]/30 px-3 text-xs font-semibold text-[#E5E5E5] transition hover:bg-[#272727] disabled:opacity-60"
        >
          <RefreshCw className={cn('h-4 w-4 text-[#E53935]', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-[#D98B7E]/40 bg-[#D98B7E]/10 px-4 py-2.5 text-sm text-[#E2A79D]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!t ? (
        <div className={cn(card, 'h-40 animate-pulse')} aria-busy />
      ) : (
        <div className={cn('space-y-6 transition-opacity', loading && 'opacity-60')}>
          <section aria-labelledby="fin-headline">
            <h2 id="fin-headline" className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#E53935]">
              Headline
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Orders placed" value={String(t.orders)} />
              <Stat label="Gross order value" value={inr(t.grossOrderValue)} hint="Everything customers ordered" />
              <Stat label="Money collected" value={inr(t.payments.collected)} hint={`${t.payments.collectedOrders} orders paid`} />
              <Stat label="Net received" value={inr(t.net.received)} hint="Collected minus confirmed refunds" strong />
            </div>
          </section>

          <section aria-labelledby="fin-refunds">
            <h2 id="fin-refunds" className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#E53935]">
              Refunds
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Refunded (confirmed)" value={inr(t.refunds.refunded)} hint={`${t.refunds.refundedOrders} orders${t.refunds.partiallyRefundedOrders ? ` · ${t.refunds.partiallyRefundedOrders} partly refunded` : ''}`} />
              <Stat label="Refund pending" value={inr(t.refunds.refundPending)} hint={`${t.refunds.refundPendingOrders} orders, not confirmed yet`} />
              <Stat label="COD returns to pay back" value={inr(t.refunds.codReturnsAwaitingManualRefund)} hint="Refund these yourself" />
              <Stat label="Net if all refunds complete" value={inr(t.net.afterPendingRefunds)} hint="Net received minus pending and COD returns" />
            </div>
          </section>

          <section aria-labelledby="fin-other">
            <h2 id="fin-other" className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#E53935]">
              Not collected
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Failed payments" value={inr(t.payments.failed)} hint={`${t.payments.failedOrders} orders`} />
              <Stat label="Awaiting payment" value={inr(t.payments.awaitingPayment)} hint={`${t.payments.awaitingPaymentOrders} orders (includes COD not yet delivered)`} />
              <Stat label="Cancelled" value={inr(t.cancellations.cancelledValue)} hint={`${t.cancellations.cancelledOrders} orders · ${inr(t.cancellations.cancelledAfterPaymentValue)} had been paid`} />
              <Stat label="Returned" value={inr(t.returns.returnedValue)} hint={`${t.returns.returnedOrders} orders`} />
            </div>
          </section>

          <section aria-labelledby="fin-split">
            <h2 id="fin-split" className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#E53935]">
              Where it came from
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Collected online" value={inr(t.payments.byMethod.online)} />
              <Stat label="Collected on delivery" value={inr(t.payments.byMethod.cod)} />
              <Stat label="Discounts given" value={inr(t.composition.discounts)} />
              <Stat label="Shipping charged" value={inr(t.composition.shipping)} />
              <Stat label="Tax on orders" value={inr(t.composition.tax)} />
              <Stat label="Items subtotal" value={inr(t.composition.subtotal)} />
            </div>
          </section>

          <section className={cn(card, 'overflow-hidden')} aria-label="Daily figures">
            {report.daily.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#7A7A7A]">No orders in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E53935]/20 text-[10px] uppercase tracking-[0.18em] text-[#7A7A7A]">
                      <th className="px-5 py-3 font-semibold">Day</th>
                      <th className="px-3 py-3 text-right font-semibold">Orders</th>
                      <th className="px-3 py-3 text-right font-semibold">Gross</th>
                      <th className="px-3 py-3 text-right font-semibold">Collected</th>
                      <th className="px-3 py-3 text-right font-semibold">Refunded</th>
                      <th className="px-3 py-3 text-right font-semibold">Refund pending</th>
                      <th className="px-5 py-3 text-right font-semibold">Failed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.daily.map((d) => (
                      <tr key={d.date} className="border-b border-[#E53935]/10 last:border-0 text-[#E5E5E5]">
                        <td className="px-5 py-2.5">{d.date}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{d.orders}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{inr(d.grossOrderValue)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{inr(d.collected)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{inr(d.refunded)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{inr(d.refundPending)}</td>
                        <td className="px-5 py-2.5 text-right tabular-nums">{inr(d.failed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[#C47A16]/30 bg-[#C47A16]/10 px-5 py-4" aria-label="Limits of this report">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E0A84A]">What this report cannot tell you</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#E5E5E5]">
              {report?.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
