'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

import { Notice, Spinner, StatusPill, btnOutline } from '@/components/admin/ui';
import { inr, message, opsRequest, when } from '@/lib/admin-ops-api';

export type RefundEntry = {
  kind: 'cancellation' | 'return';
  id: string;
  at: string | null;
  by: string;
  reason: string;
  wholeOrder: boolean | null;
  returnStatus: string | null;
  items: { name: string; quantity: number }[];
  amount: number | null;
  status: string | null;
  statusLabel: string;
  method: string | null;
  refundId: string | null;
  reference: string | null;
  error: string | null;
  completedAt: string | null;
  canCheck: boolean;
  canRetry: boolean;
};

type History = {
  order: { id: string; orderNumber: string; status: string; paymentStatus: string; total: number };
  totals: { paid: number; refundedConfirmed: number; inProgress: number; stillHeld: number };
  entries: RefundEntry[];
  canCheck: boolean;
  canRetry: boolean;
};

const TONE: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  completed: 'success',
  manual_done: 'success',
  processing: 'warning',
  pending: 'warning',
  failed: 'error',
  not_applicable: 'neutral',
};

/**
 * Money history of one order: every cancellation / return refund with its amount, status and
 * Razorpay id. "Check refund status" only READS Razorpay (the server cannot create a refund
 * from it), so it is safe to press as often as needed.
 */
export function RefundHistory({
  orderId,
  reloadKey,
  onChanged,
}: {
  orderId: string;
  /** Change this to reload (e.g. after the order list refreshed). */
  reloadKey?: number | string;
  /** Called after a check recorded something new, so the parent can reload the order list. */
  onChanged?: () => void | Promise<void>;
}) {
  const [data, setData] = useState<History | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await opsRequest<History>(`/api/orders/admin/${encodeURIComponent(orderId)}/refunds`));
    } catch (e) {
      setData(null);
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    setLoading(true);
    setNotice('');
    void load();
  }, [load, reloadKey]);

  const check = async () => {
    setChecking(true);
    setError('');
    setNotice('');
    try {
      const res = await opsRequest<{ message: string; results: { changed?: boolean }[] }>(
        `/api/orders/admin/${encodeURIComponent(orderId)}/refunds/check`,
        { method: 'POST' }
      );
      setNotice(res.message);
      await load();
      if (res.results?.some((r) => r.changed)) await onChanged?.();
    } catch (e) {
      setError(message(e));
    } finally {
      setChecking(false);
    }
  };

  if (loading) return <Spinner label="Loading refunds" />;
  if (!data) return error ? <Notice tone="error">{error}</Notice> : null;
  // Nothing was ever cancelled or returned with money: keep the panel out of the way.
  if (data.entries.length === 0) return null;

  return (
    <section aria-label="Refund history" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#5A6075]">Refund history</p>
        {data.canCheck && (
          <button type="button" className={btnOutline} onClick={() => void check()} disabled={checking}>
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Check refund status
          </button>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-2 text-[14px]">
        {[
          ['Paid by customer', data.totals.paid],
          ['Refunded (confirmed)', data.totals.refundedConfirmed],
          ['Refund in progress', data.totals.inProgress],
          ['Still with us', data.totals.stillHeld],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-[#E3E5EE] bg-[#F5F6FA] px-3 py-2">
            <dt className="text-[#5A6075]">{label}</dt>
            <dd className="font-semibold text-[#11162B]">{inr(Number(value))}</dd>
          </div>
        ))}
      </dl>

      {notice && <Notice tone="success">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <ul className="space-y-2">
        {data.entries.map((e) => (
          <li key={`${e.kind}-${e.id}`} className="rounded-lg border border-[#E3E5EE] p-3 text-[14px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-[#11162B]">
                {e.kind === 'cancellation' ? (e.wholeOrder ? 'Order cancelled' : 'Items cancelled') : 'Return'}
                {e.amount !== null && e.amount > 0 ? ` · ${inr(e.amount)}` : ''}
              </span>
              <StatusPill tone={TONE[e.status || ''] || 'neutral'}>{e.statusLabel}</StatusPill>
            </div>
            <p className="mt-1 text-[#5A6075]">
              {e.items.map((i) => `${i.quantity} × ${i.name}`).join(', ') || '—'}
            </p>
            <p className="mt-1 text-[#5A6075]">
              {when(e.at)} · {e.by} · {e.reason}
            </p>
            {(e.refundId || e.reference) && (
              <p className="mt-1 break-all text-[#5A6075]">
                {e.refundId ? `Razorpay refund ${e.refundId}` : `Reference ${e.reference}`}
                {e.completedAt ? ` · confirmed ${when(e.completedAt)}` : ''}
              </p>
            )}
            {e.error && <p className="mt-1 text-[#9A2C1F]">{e.error}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
