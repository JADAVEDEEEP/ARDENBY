'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { BarChart3, Loader2, PackageX, RefreshCw } from 'lucide-react';

import { getCurrentAdmin } from '@/components/admin/admin-auth';
import { Pager } from '@/components/admin/pager';
import { ReasonDialog } from '@/components/admin/reason-dialog';
import {
  Card,
  EmptyState,
  Notice,
  PageHeader,
  Spinner,
  StatusPill,
  btnDanger,
  btnDark,
  btnOutline,
  btnPrimary,
  fieldClass,
  labelClass,
} from '@/components/admin/ui';
import { Pagination, daysAgoIso, inr, message, opsRequest, toQuery, todayIso, when } from '@/lib/admin-ops-api';

type Inspection = {
  result: string;
  label: string;
  note: string | null;
  refundable: boolean;
  restock: boolean;
  restockAuthorized: boolean;
  restocked: boolean;
  lineRefund: number | null;
};

type Item = {
  orderItemId: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  orderedQuantity: number;
  unitPrice: number;
  inspection: Inspection | null;
};

type Breakdown = {
  lines: { orderItemId: string; name: string; quantity: number; goods: number; discount: number; tax: number; refund: number }[];
  shipping: number;
  calculated: number;
  final: number;
  error?: string;
};

type ReturnRow = {
  id: string;
  orderId: string;
  orderNumber: string | null;
  status: 'Requested' | 'Approved' | 'Shipped' | 'Received' | 'Inspected' | 'Completed' | 'Rejected';
  reasonLabel: string | null;
  customerReason: string;
  description: string | null;
  decisionReason: string | null;
  trackingReference: string | null;
  requestedAt: string | null;
  items: Item[];
  order: { status: string; paymentMethod: string; paymentStatus: string; total: number; paidOnline: boolean; paidCod: boolean } | null;
  customer: { name: string | null; email: string } | null;
  refund: {
    status: string | null;
    method: string | null;
    reference: string | null;
    calculated: number | null;
    deduction: number | null;
    deductionReason: string | null;
    amount: number | null;
    error: string | null;
  };
  refundPreview: Breakdown | null;
  history: { from: string | null; to: string; note: string | null; actorRole: string | null; at: string }[];
};

type Analytics = {
  available: boolean;
  range: { from: string; to: string };
  cancellations: { requests: number; wholeOrders: number; partial: number; ordersCancelled: number; ordersPlaced: number; cancellationRatePercent: number | null };
  returns: { requests: number; pending: number; approved: number; rejected: number; inProgress: number; completed: number; unitsReturned: number; unitsSold: number; returnRatePercent: number | null };
  refunds: { refundedAmount: number; pendingAmount: number; pendingCount: number; failedCount: number };
  reasons: { cancellation: { code: string; label: string; count: number }[]; returns: { code: string; label: string; count: number }[] };
  products: { productId: string; name: string; unitsReturned: number; requests: number; unitsSold: number; returnRatePercent: number | null }[];
};

const STATUS_TONE: Record<string, 'warning' | 'accent' | 'error' | 'success' | 'neutral'> = {
  Requested: 'warning',
  Approved: 'accent',
  Shipped: 'accent',
  Received: 'accent',
  Inspected: 'accent',
  Completed: 'success',
  Rejected: 'error',
};

const REFUND_TEXT: Record<string, string> = {
  not_applicable: 'No refund due',
  pending: 'Refund waiting to be sent',
  processing: 'Refund sent — waiting for Razorpay to confirm',
  completed: 'Refund completed',
  failed: 'Refund failed — retry it',
};

const RESULTS = [
  { code: 'unused_original', label: 'Unused, original condition', refundable: true },
  { code: 'damaged', label: 'Damaged', refundable: true },
  { code: 'defective', label: 'Defective', refundable: true },
  { code: 'used_washed', label: 'Used or washed', refundable: false },
  { code: 'incorrect_item', label: 'Incorrect product returned', refundable: false },
  { code: 'other', label: 'Other', refundable: false },
];

const METHODS = [
  { code: 'upi', label: 'UPI' },
  { code: 'bank_transfer', label: 'Bank transfer' },
  { code: 'cash', label: 'Cash' },
  { code: 'other', label: 'Other' },
];

type Action =
  | { kind: 'approve' | 'reject' | 'receive' | 'ship'; row: ReturnRow }
  | { kind: 'inspect'; row: ReturnRow }
  | { kind: 'refund'; row: ReturnRow };

export default function AdminReturnsPage() {
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('Requested');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<Action | null>(null);
  const [busyId, setBusyId] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const latest = useRef(0);

  useEffect(() => {
    getCurrentAdmin()
      .then((u) => setIsOwner(u.role === 'superadmin'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    setError('');
    try {
      const data = await opsRequest(`/api/admin/returns${toQuery({ page, limit: 10, status, search })}`);
      if (request !== latest.current) return;
      setRows(data.returns || []);
      setPagination(data.pagination || null);
    } catch (e) {
      if (request === latest.current) setError(message(e));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const done = async (text: string) => {
    setNotice(text);
    setAction(null);
    await load();
  };

  const patch = async (id: string, path: string, body: object, text: string) => {
    await opsRequest(`/api/admin/returns/${id}/${path}`, { method: 'PATCH', body: JSON.stringify(body) });
    await done(text);
  };

  const retryRefund = async (row: ReturnRow) => {
    setBusyId(row.id);
    setError('');
    setNotice('');
    try {
      if (row.refund.status === 'processing') {
        // Razorpay already holds this refund: only look it up (the server cannot create one from here).
        const checked = await opsRequest(`/api/admin/returns/${row.id}/refund-check`, { method: 'POST' });
        setNotice(checked.message || 'Refund checked.');
      } else {
        const data = await opsRequest(`/api/admin/returns/${row.id}/refund-retry`, { method: 'POST' });
        setNotice(data.return?.refundStatus === 'completed' ? 'Refund confirmed by Razorpay.' : 'Refund checked. It is not confirmed by Razorpay yet.');
      }
      await load();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Returns"
        subtitle="Each return moves step by step: approve → items on the way → goods received → inspection → refund. Stock goes back and money moves only after the inspection."
        actions={
          <button type="button" className={btnOutline} onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      <InsightsCard />
      {isOwner && <PolicyCard onSaved={setNotice} />}

      <div className="flex flex-wrap gap-3">
        <select
          className={`${fieldClass} sm:max-w-[240px]`}
          aria-label="Filter by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All requests</option>
          <option value="Requested">Waiting for a decision</option>
          <option value="Approved">Approved — awaiting the parcel</option>
          <option value="Shipped">On its way back</option>
          <option value="Received">Received — to inspect</option>
          <option value="Inspected">Inspected — refund due</option>
          <option value="Completed">Completed</option>
          <option value="Rejected">Rejected</option>
        </select>
        <input
          className={`${fieldClass} sm:max-w-xs`}
          placeholder="Search order number, name or e-mail"
          aria-label="Search returns"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {notice && <Notice tone="success">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <Card bodyClassName="p-0">
        {loading && rows.length === 0 ? (
          <Spinner label="Loading returns" />
        ) : rows.length === 0 ? (
          <EmptyState icon={PackageX} title="No return requests here">
            Requests show up once customers ask to return a delivered order (and returns are switched on).
          </EmptyState>
        ) : (
          <ul className="divide-y divide-[#E4E7EC]" aria-busy={loading}>
            {rows.map((r) => (
              <ReturnCard key={r.id} r={r} busy={busyId === r.id} setAction={setAction} onRetry={() => void retryRefund(r)} />
            ))}
          </ul>
        )}
        {pagination && <Pager pagination={pagination} onPage={setPage} busy={loading} noun="request" />}
      </Card>

      {action && (action.kind === 'approve' || action.kind === 'reject') && (
        <ReasonDialog
          title={action.kind === 'approve' ? 'Approve this return?' : 'Reject this return?'}
          description={
            action.kind === 'approve'
              ? 'The customer is e-mailed instructions to send the items back. Nothing is refunded or restocked yet.'
              : 'The return is closed and the customer is told why. Nothing is refunded and stock is unchanged.'
          }
          confirmLabel={action.kind === 'approve' ? 'Approve' : 'Reject'}
          danger={action.kind === 'reject'}
          reasonLabel={action.kind === 'reject' ? 'Reason (the customer sees this)' : 'Reason (kept in the record)'}
          onSubmit={(reason) =>
            patch(action.row.id, 'decision', { decision: action.kind, reason }, action.kind === 'approve' ? 'Return approved.' : 'Return rejected.')
          }
          onClose={() => setAction(null)}
        />
      )}

      {action?.kind === 'ship' && (
        <ReasonDialog
          title="Items are on their way back"
          description="Use this if the customer told you the parcel is sent. They can also mark it themselves."
          confirmLabel="Mark as shipped"
          reasonLabel="Tracking reference (optional)"
          minLength={0}
          onSubmit={(tracking) => patch(action.row.id, 'shipped', { trackingReference: tracking }, 'Marked as shipped.')}
          onClose={() => setAction(null)}
        />
      )}

      {action?.kind === 'receive' && (
        <ReasonDialog
          title="Goods received?"
          description="Use this when the parcel has arrived. Stock and money do not change yet: inspect the items next."
          confirmLabel="Confirm received"
          reasonLabel="Notes (optional)"
          minLength={0}
          onSubmit={(note) => patch(action.row.id, 'receive', { note }, 'Marked as received. Now inspect the items.')}
          onClose={() => setAction(null)}
        />
      )}

      {action?.kind === 'inspect' && (
        <InspectDialog row={action.row} onClose={() => setAction(null)} onDone={() => done('Inspection saved.')} />
      )}
      {action?.kind === 'refund' && <RefundDialog row={action.row} onClose={() => setAction(null)} onDone={done} />}
    </div>
  );
}

function ReturnCard({
  r,
  busy,
  setAction,
  onRetry,
}: {
  r: ReturnRow;
  busy: boolean;
  setAction: (a: Action) => void;
  onRetry: () => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const refundDue = r.status === 'Inspected' && r.refund.status == null;
  const refundOpen = r.status === 'Inspected' && ['pending', 'processing', 'failed'].includes(r.refund.status || '') && r.refund.method === 'razorpay';

  return (
    <li className="space-y-3 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-[#111111]">Order {r.orderNumber || r.orderId}</span>
        <StatusPill tone={STATUS_TONE[r.status] || 'neutral'}>{r.status}</StatusPill>
        {r.order && (
          <span className="text-[13px] text-[#626875]">
            {inr(r.order.total)} · {r.order.paymentMethod.toUpperCase()} · {r.order.paymentStatus}
          </span>
        )}
      </div>
      <p className="text-[13px] text-[#626875]">
        {r.customer?.name || 'Customer'} ({r.customer?.email}) · requested {when(r.requestedAt)}
      </p>

      <div className="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] px-3 py-2 text-[13px] text-[#344054]">
        <ul className="space-y-1">
          {r.items.map((item) => (
            <li key={item.orderItemId}>
              {item.quantity} of {item.orderedQuantity} × {item.name}
              {[item.size, item.color].filter(Boolean).length > 0 && ` (${[item.size, item.color].filter(Boolean).join(', ')})`} — {inr(item.unitPrice)} each
              {item.inspection && (
                <span className="ml-1 text-[#626875]">
                  → {item.inspection.label}
                  {item.inspection.refundable ? ', refundable' : ', not refundable'}
                  {item.inspection.restocked ? ', back in stock' : ', not restocked'}
                  {item.inspection.restockAuthorized ? ' (authorised)' : ''}
                  {item.inspection.note ? ` — “${item.inspection.note}”` : ''}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[14px] text-[#344054]">
        <span className="font-semibold text-[#111111]">Reason: </span>
        {r.reasonLabel || r.customerReason}
        {r.description ? ` — ${r.description}` : ''}
      </p>
      {r.decisionReason && (
        <p className="text-[14px] text-[#344054]">
          <span className="font-semibold text-[#111111]">Decision note: </span>
          {r.decisionReason}
        </p>
      )}
      {r.trackingReference && (
        <p className="text-[14px] text-[#344054]">
          <span className="font-semibold text-[#111111]">Customer’s tracking reference: </span>
          {r.trackingReference}
        </p>
      )}

      {r.refund.status && (
        <p className="text-[13px] text-[#626875]">
          {REFUND_TEXT[r.refund.status] || r.refund.status}
          {r.refund.amount != null && ` — ${inr(r.refund.amount)}`}
          {r.refund.calculated != null && r.refund.deduction ? ` (calculated ${inr(r.refund.calculated)}, deduction ${inr(r.refund.deduction)}${r.refund.deductionReason ? `: ${r.refund.deductionReason}` : ''})` : ''}
          {r.refund.method && r.refund.method !== 'razorpay' ? ` · paid by ${r.refund.method.replace('_', ' ')}${r.refund.reference ? `, ref ${r.refund.reference}` : ''}` : ''}
          {r.refund.error && r.refund.status === 'failed' ? ` · ${r.refund.error}` : ''}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {r.status === 'Requested' && (
          <>
            <button type="button" className={btnPrimary} onClick={() => setAction({ kind: 'approve', row: r })}>
              Approve
            </button>
            <button type="button" className={btnDanger} onClick={() => setAction({ kind: 'reject', row: r })}>
              Reject
            </button>
          </>
        )}
        {r.status === 'Approved' && (
          <button type="button" className={btnOutline} onClick={() => setAction({ kind: 'ship', row: r })}>
            Mark as shipped
          </button>
        )}
        {['Approved', 'Shipped'].includes(r.status) && (
          <button type="button" className={btnDark} onClick={() => setAction({ kind: 'receive', row: r })}>
            Mark goods received
          </button>
        )}
        {r.status === 'Received' && (
          <button type="button" className={btnPrimary} onClick={() => setAction({ kind: 'inspect', row: r })}>
            Inspect items
          </button>
        )}
        {refundDue && (
          <button type="button" className={btnPrimary} onClick={() => setAction({ kind: 'refund', row: r })}>
            Process refund
          </button>
        )}
        {refundOpen && (
          <button type="button" className={btnPrimary} onClick={onRetry} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {r.refund.status === 'failed' || r.refund.status === 'pending' ? 'Retry refund' : 'Check refund status'}
          </button>
        )}
        <button type="button" className="text-[13px] font-semibold text-[#626875] underline" onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? 'Hide history' : 'History'}
        </button>
      </div>

      {showHistory && (
        <ol className="space-y-1 border-l-2 border-[#E4E7EC] pl-4 text-[13px] text-[#344054]" aria-label="Return history">
          {r.history.map((h, i) => (
            <li key={i}>
              <span className="font-semibold text-[#111111]">{h.to}</span> · {when(h.at)} · {h.actorRole || 'system'}
              {h.note ? ` — ${h.note}` : ''}
            </li>
          ))}
        </ol>
      )}
    </li>
  );
}

function Overlay({ title, children, onClose, busy }: { title: string; children: React.ReactNode; onClose: () => void; busy?: boolean }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [busy, onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => !busy && onClose()} />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl border border-[#E4E7EC] bg-white p-6 shadow-xl">
        <h2 className="text-[20px] font-bold text-[#111111]">{title}</h2>
        {children}
      </div>
    </div>
  );
}

type Entry = { result: string; note: string; refundable: boolean; authorize: boolean };

function InspectDialog({ row, onClose, onDone }: { row: ReturnRow; onClose: () => void; onDone: () => Promise<void> }) {
  const [entries, setEntries] = useState<Record<string, Entry>>(() =>
    Object.fromEntries(row.items.map((i) => [i.orderItemId, { result: 'unused_original', note: '', refundable: true, authorize: false }]))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (id: string, patch: Partial<Entry>) => setEntries((e) => ({ ...e, [id]: { ...e[id], ...patch } }));

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await opsRequest(`/api/admin/returns/${row.id}/inspect`, {
        method: 'PATCH',
        body: JSON.stringify({
          inspections: row.items.map((i) => {
            const e = entries[i.orderItemId];
            return {
              orderItemId: i.orderItemId,
              result: e.result,
              note: e.note,
              refundable: e.refundable,
              ...(e.authorize ? { restock: true, authorizeRestock: true } : {}),
            };
          }),
        }),
      });
      await onDone();
    } catch (e) {
      setError(message(e));
      setBusy(false);
    }
  };

  return (
    <Overlay title="Inspect the returned items" onClose={onClose} busy={busy}>
      <p className="mt-2 text-[14px] text-[#626875]">
        Check each item. Only items judged “unused, original condition” go back into stock. Anything else stays out of stock unless you explicitly authorise it.
      </p>
      <div className="mt-4 space-y-4">
        {row.items.map((item) => {
          const e = entries[item.orderItemId];
          const unused = e.result === 'unused_original';
          return (
            <fieldset key={item.orderItemId} className="rounded-lg border border-[#E4E7EC] p-3">
              <legend className="px-1 text-[14px] font-semibold text-[#111111]">
                {item.quantity} × {item.name} {[item.size, item.color].filter(Boolean).length > 0 && `(${[item.size, item.color].filter(Boolean).join(', ')})`}
              </legend>
              <label className={labelClass} htmlFor={`res-${item.orderItemId}`}>
                Condition
              </label>
              <select
                id={`res-${item.orderItemId}`}
                className={fieldClass}
                value={e.result}
                onChange={(ev) => {
                  const next = RESULTS.find((r) => r.code === ev.target.value)!;
                  set(item.orderItemId, { result: next.code, refundable: next.refundable, authorize: false });
                }}
              >
                {RESULTS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </select>
              <label className="mt-3 flex items-center gap-2 text-[14px]">
                <input type="checkbox" checked={e.refundable} onChange={(ev) => set(item.orderItemId, { refundable: ev.target.checked })} />
                Refund this item
              </label>
              <textarea
                className={`${fieldClass} mt-2 h-auto py-2.5`}
                rows={2}
                maxLength={500}
                value={e.note}
                onChange={(ev) => set(item.orderItemId, { note: ev.target.value })}
                placeholder={unused ? 'Notes (optional)' : 'Inspection notes (required)'}
                aria-label={`Inspection notes for ${item.name}`}
              />
              <p className="mt-2 text-[13px] text-[#626875]">
                {unused ? 'Will be put back in stock.' : 'Will NOT be put back in stock.'}
              </p>
              {!unused && e.result !== 'incorrect_item' && (
                <label className="mt-1 flex items-start gap-2 text-[13px] text-[#8A540C]">
                  <input type="checkbox" className="mt-0.5" checked={e.authorize} onChange={(ev) => set(item.orderItemId, { authorize: ev.target.checked })} />
                  I authorise putting this item back in stock anyway
                </label>
              )}
            </fieldset>
          );
        })}
      </div>
      {error && (
        <Notice tone="error" className="mt-3">
          {error}
        </Notice>
      )}
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" className={btnOutline} onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className={btnPrimary} onClick={() => void submit()} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Save inspection
        </button>
      </div>
    </Overlay>
  );
}

function RefundDialog({ row, onClose, onDone }: { row: ReturnRow; onClose: () => void; onDone: (text: string) => Promise<void> }) {
  const [deduction, setDeduction] = useState('');
  const [deductionReason, setDeductionReason] = useState('');
  const [method, setMethod] = useState('upi');
  const [reference, setReference] = useState('');
  const [preview, setPreview] = useState<Breakdown | null>(row.refundPreview);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const cod = Boolean(row.order?.paidCod);
  const amount = Number(deduction) > 0 ? Number(deduction) : 0;

  // Refresh the breakdown from the server (it is the only source of the amount).
  useEffect(() => {
    let live = true;
    opsRequest(`/api/admin/returns/${row.id}`)
      .then((d) => live && d.return?.refundPreview && setPreview(d.return.refundPreview))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [row.id]);

  const final = preview && !preview.error ? Math.max(preview.calculated - amount, 0) : null;

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await opsRequest(`/api/admin/returns/${row.id}/refund`, {
        method: 'POST',
        body: JSON.stringify({
          deduction: amount || undefined,
          deductionReason: amount ? deductionReason : undefined,
          ...(cod ? { method, reference } : {}),
        }),
      });
      const r = res.return;
      await onDone(
        r.refundStatus === 'completed'
          ? `Refund of ${inr(r.amount)} recorded. The return is complete.`
          : r.refundStatus === 'not_applicable'
            ? 'No refund was due. The return is complete.'
            : `Refund of ${inr(r.amount)} sent to Razorpay. It completes when Razorpay confirms.`
      );
    } catch (e) {
      setError(message(e));
      setBusy(false);
    }
  };

  return (
    <Overlay title="Process the refund" onClose={onClose} busy={busy}>
      {!preview ? (
        <Spinner />
      ) : preview.error ? (
        <Notice tone="error" className="mt-3">
          {preview.error}
        </Notice>
      ) : (
        <div className="mt-3 rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-3 text-[13px] text-[#344054]">
          <p className="font-semibold text-[#111111]">How the amount is worked out (by the server)</p>
          <ul className="mt-1 space-y-0.5">
            {preview.lines.map((l) => (
              <li key={l.orderItemId}>
                {l.quantity} × {l.name}: {inr(l.goods)} − {inr(l.discount)} discount + {inr(l.tax)} GST = <strong>{inr(l.refund)}</strong>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[#626875]">Shipping is not refunded on a return.</p>
          <p className="mt-2 text-[15px] font-bold text-[#111111]">Calculated refund {inr(preview.calculated)}</p>
        </div>
      )}

      <div className="mt-4">
        <label className={labelClass} htmlFor="deduction">
          Deduction (₹, optional) — for example a pickup fee
        </label>
        <input id="deduction" className={`${fieldClass} w-40`} inputMode="decimal" value={deduction} onChange={(e) => setDeduction(e.target.value.replace(/[^0-9.]/g, '').slice(0, 10))} />
        {amount > 0 && (
          <textarea
            className={`${fieldClass} mt-2 h-auto py-2.5`}
            rows={2}
            maxLength={500}
            value={deductionReason}
            onChange={(e) => setDeductionReason(e.target.value)}
            placeholder="Reason for the deduction (required, shown in the record)"
            aria-label="Reason for the deduction"
          />
        )}
        {final != null && <p className="mt-2 text-[15px] font-bold text-[#111111]">Customer receives {inr(final)}</p>}
      </div>

      {cod ? (
        <div className="mt-4 space-y-2 rounded-lg border border-[#E4E7EC] p-3">
          <p className="text-[13px] text-[#626875]">Cash on delivery: pay the customer back yourself, then record how.</p>
          <label className={labelClass} htmlFor="method">
            Paid by
          </label>
          <select id="method" className={fieldClass} value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => (
              <option key={m.code} value={m.code}>
                {m.label}
              </option>
            ))}
          </select>
          <label className={labelClass} htmlFor="reference">
            Transaction reference
          </label>
          <input id="reference" className={fieldClass} value={reference} maxLength={100} onChange={(e) => setReference(e.target.value)} />
        </div>
      ) : (
        <p className="mt-4 text-[13px] text-[#626875]">Paid online: the refund goes through Razorpay to the customer’s original payment method.</p>
      )}

      {error && (
        <Notice tone="error" className="mt-3">
          {error}
        </Notice>
      )}
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" className={btnOutline} onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className={btnPrimary} onClick={() => void submit()} disabled={busy || !preview || Boolean(preview.error)}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {cod ? 'Record the refund' : 'Send refund'}
        </button>
      </div>
    </Overlay>
  );
}

/** Cancellations, returns and refunds at a glance, for a date range. */
function InsightsCard() {
  const [from, setFrom] = useState(daysAgoIso(29));
  const [to, setTo] = useState(todayIso());
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let live = true;
    setError('');
    opsRequest(`/api/admin/reports/returns${toQuery({ from, to })}`)
      .then((r) => live && setData(r.data))
      .catch((e) => live && setError(message(e)));
    return () => {
      live = false;
    };
  }, [open, from, to]);

  const cell = (label: string, value: string, hint?: string) => (
    <div className="rounded-lg border border-[#E4E7EC] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-[#626875]">{label}</p>
      <p className="text-[20px] font-bold text-[#111111]">{value}</p>
      {hint && <p className="text-[12px] text-[#626875]">{hint}</p>}
    </div>
  );
  const pct = (v: number | null) => (v == null ? '—' : `${v}%`);

  return (
    <Card
      title="Cancellations & returns at a glance"
      description="Counts come from the real records. Partial returns count once as a request and by units for rates."
      action={
        <button type="button" className={btnOutline} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <BarChart3 className="h-4 w-4" /> {open ? 'Hide' : 'Show'}
        </button>
      }
    >
      {!open ? (
        <p className="text-[13px] text-[#626875]">Open to see rates, refund totals and the most common reasons.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input type="date" aria-label="From date" className={`${fieldClass} w-44`} value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" aria-label="To date" className={`${fieldClass} w-44`} value={to} min={from} max={todayIso()} onChange={(e) => setTo(e.target.value)} />
          </div>
          {error && <Notice tone="error">{error}</Notice>}
          {!data && !error && <Spinner />}
          {data && !data.available && <Notice tone="warning">The database update for cancellations and returns has not been applied yet.</Notice>}
          {data && data.available && (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {cell('Cancellation requests', String(data.cancellations.requests), `${data.cancellations.wholeOrders} whole · ${data.cancellations.partial} partial`)}
                {cell('Orders cancelled', String(data.cancellations.ordersCancelled), `of ${data.cancellations.ordersPlaced} placed`)}
                {cell('Cancellation rate', pct(data.cancellations.cancellationRatePercent))}
                {cell('Return requests', String(data.returns.requests))}
                {cell('Pending decision', String(data.returns.pending))}
                {cell('Approved', String(data.returns.approved), `${data.returns.inProgress} in progress`)}
                {cell('Rejected', String(data.returns.rejected))}
                {cell('Completed', String(data.returns.completed))}
                {cell('Units returned', String(data.returns.unitsReturned), `of ${data.returns.unitsSold} sold`)}
                {cell('Return rate', pct(data.returns.returnRatePercent), 'units returned ÷ units sold')}
                {cell('Refunded', inr(data.refunds.refundedAmount))}
                {cell('Refunds pending', inr(data.refunds.pendingAmount), `${data.refunds.pendingCount} open · ${data.refunds.failedCount} failed`)}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-[13px] font-semibold text-[#111111]">Top return reasons</p>
                  {data.reasons.returns.length === 0 ? (
                    <p className="text-[13px] text-[#626875]">None in this period.</p>
                  ) : (
                    <ul className="space-y-0.5 text-[13px] text-[#344054]">
                      {data.reasons.returns.map((x) => (
                        <li key={x.code}>
                          {x.label}: <strong>{x.count}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mb-1 mt-3 text-[13px] font-semibold text-[#111111]">Top cancellation reasons</p>
                  {data.reasons.cancellation.length === 0 ? (
                    <p className="text-[13px] text-[#626875]">None in this period.</p>
                  ) : (
                    <ul className="space-y-0.5 text-[13px] text-[#344054]">
                      {data.reasons.cancellation.map((x) => (
                        <li key={x.code}>
                          {x.label}: <strong>{x.count}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="mb-1 text-[13px] font-semibold text-[#111111]">Most returned products</p>
                  {data.products.length === 0 ? (
                    <p className="text-[13px] text-[#626875]">None in this period.</p>
                  ) : (
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="text-[#626875]">
                          <th className="py-1 font-semibold">Product</th>
                          <th className="py-1 text-right font-semibold">Returned</th>
                          <th className="py-1 text-right font-semibold">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.products.map((p) => (
                          <Fragment key={p.productId}>
                            <tr className="border-t border-[#E4E7EC]">
                              <td className="py-1 pr-2">{p.name}</td>
                              <td className="py-1 text-right tabular-nums">
                                {p.unitsReturned} <span className="text-[#626875]">of {p.unitsSold}</span>
                              </td>
                              <td className="py-1 text-right tabular-nums">{pct(p.returnRatePercent)}</td>
                            </tr>
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

/** Owner-only: the store has no return period until you choose one. */
function PolicyCard({ onSaved }: { onSaved: (text: string) => void }) {
  const [enabled, setEnabled] = useState(false);
  const [days, setDays] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    opsRequest('/api/admin/settings')
      .then((res) => {
        const returns = res?.data?.settings?.returns;
        if (returns) {
          setEnabled(Boolean(returns.enabled));
          setDays(returns.windowDays ? String(returns.windowDays) : '');
        }
      })
      .catch((e) => setError(message(e)))
      .finally(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const windowDays = Number(days);
      if (enabled && (!Number.isInteger(windowDays) || windowDays < 1)) {
        throw new Error('Enter the number of days customers have to ask for a return.');
      }
      await opsRequest('/api/admin/settings/returns', {
        method: 'PUT',
        body: JSON.stringify(enabled ? { enabled: true, windowDays } : { enabled: false }),
      });
      onSaved('Return policy saved.');
    } catch (e) {
      setError(message(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Return policy"
      description="Customers cannot request a return until you switch this on and choose how many days after delivery they have. You decide the number."
    >
      {!loaded ? (
        <Spinner />
      ) : (
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex min-h-11 items-center gap-2 text-[14px] font-semibold text-[#111111]">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Accept return requests
          </label>
          <div>
            <label className={labelClass} htmlFor="return-days">
              Days after delivery
            </label>
            <input
              id="return-days"
              className={`${fieldClass} w-32`}
              inputMode="numeric"
              value={days}
              disabled={!enabled}
              onChange={(e) => setDays(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
            />
          </div>
          <button type="button" className={btnDark} onClick={() => void save()} disabled={saving}>
            Save policy
          </button>
        </div>
      )}
      {error && (
        <Notice tone="error" className="mt-3">
          {error}
        </Notice>
      )}
    </Card>
  );
}
