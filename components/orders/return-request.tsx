'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Clock3, Loader2, PackageX, RotateCcw, Truck, XCircle } from 'lucide-react';

import { CustomerApiError, customerRequest, errorText } from '@/lib/customer-api';
import { formatINR } from '@/lib/format';
import { ReturnTimeline, type Tracking } from '@/components/orders/return-timeline';
import { ItemPicker, RefundBreakdown, type Breakdown, type PickableItem } from '@/components/orders/item-picker';
import {
  REASON_MAX,
  buildReturnPayload,
  chosenItems,
  initialSelection,
  isValidUpi,
  UPI_HELP,
  validateReturn,
  type Selection,
} from '@/lib/return-request';

type ReturnItem = PickableItem & { orderedQuantity: number };

type ReturnRow = {
  id: string;
  status: string;
  customerStatus: string;
  note: string;
  reason: string;
  decisionReason: string | null;
  requestedAt: string | null;
  trackingReference: string | null;
  refund: {
    state: 'refunded' | 'in_progress' | 'none';
    amount: number;
    /** COD (UPI payout) refunds only: the four plain states. */
    status?: 'pending' | 'processing' | 'refunded' | 'failed';
    note?: string;
    method?: string;
    destination?: string;
    reference?: string | null;
  } | null;
  refundTo?: { method: string; destination: string } | null;
  /** Stage-by-stage tracking built by the server from stored events only. */
  tracking?: Tracking;
  canMarkShipped: boolean;
  items: { orderItemId: string; name: string; size: string; color: string; quantity: number; outcome: string | null }[];
  timeline: { status: string; label: string; at: string }[];
};

type ReturnState = {
  policy: { enabled: boolean; windowDays: number };
  eligible: boolean;
  reason: string | null;
  message: string;
  daysLeft: number | null;
  reasons: { code: string; label: string }[];
  items: ReturnItem[];
  requests: ReturnRow[];
};

const PANEL = 'rounded-2xl border border-[#E53935]/20 bg-[#F7F7F7] p-5 sm:p-6';
const LABEL = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E53935]';
const BUTTON =
  'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#E53935] px-6 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-[#C62E2B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E53935] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto';
const OUTLINE =
  'inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-[#111111]/25 px-6 text-sm font-semibold transition-colors hover:border-[#111111] disabled:opacity-50 sm:w-auto';

const STATUS_STYLE: Record<string, { icon: typeof Clock3; tone: string }> = {
  Requested: { icon: Clock3, tone: 'border-[#C47A16]/40 bg-[#C47A16]/10 text-[#8A540C]' },
  Approved: { icon: CheckCircle2, tone: 'border-[#16845B]/40 bg-[#16845B]/10 text-[#0F6446]' },
  Shipped: { icon: Truck, tone: 'border-[#2563EB]/40 bg-[#2563EB]/10 text-[#1D4ED8]' },
  Received: { icon: CheckCircle2, tone: 'border-[#2563EB]/40 bg-[#2563EB]/10 text-[#1D4ED8]' },
  Inspected: { icon: CheckCircle2, tone: 'border-[#2563EB]/40 bg-[#2563EB]/10 text-[#1D4ED8]' },
  Completed: { icon: CheckCircle2, tone: 'border-[#16845B]/40 bg-[#16845B]/10 text-[#0F6446]' },
  Rejected: { icon: XCircle, tone: 'border-[#D92D20]/40 bg-[#D92D20]/10 text-[#B42318]' },
};

const REFUND_LABEL = { pending: 'Pending', processing: 'Processing', refunded: 'Refunded', failed: 'Failed' } as const;
const REFUND_TONE = {
  pending: 'border-[#C47A16]/40 bg-[#C47A16]/10 text-[#8A540C]',
  processing: 'border-[#2563EB]/40 bg-[#2563EB]/10 text-[#1D4ED8]',
  refunded: 'border-[#16845B]/40 bg-[#16845B]/10 text-[#0F6446]',
  failed: 'border-[#D92D20]/40 bg-[#D92D20]/10 text-[#B42318]',
} as const;

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

/** Return requests of one order: the status of each, and the form for a new one. */
export function ReturnSection({
  orderId,
  isCod = false,
  onChanged,
}: {
  orderId: string;
  /** Cash-on-delivery orders are refunded to a UPI ID, which the form must collect. */
  isCod?: boolean;
  onChanged?: () => void | Promise<void>;
}) {
  const [state, setState] = useState<ReturnState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoadError('');
    try {
      setState(await customerRequest<ReturnState>(`/api/returns/order/${encodeURIComponent(orderId)}`));
    } catch (error) {
      if (!(error instanceof CustomerApiError && error.status === 401)) setLoadError(errorText(error));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Keep the tracking in step with admin actions and payment webhooks: refresh while a return
  // is still moving, and again whenever the customer comes back to the tab.
  const moving = Boolean(
    state?.requests.some(
      (r) => !['Completed', 'Rejected'].includes(r.status) || ['pending', 'processing'].includes(String(r.refund?.status || '')) || r.tracking?.outcome === 'in_progress'
    )
  );
  useEffect(() => {
    if (!moving) return;
    const timer = setInterval(() => void load(), 45000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [moving, load]);

  if (loading && !state) {
    return (
      <section className={PANEL} aria-busy="true" aria-label="Returns">
        <div className="flex items-center gap-2 text-sm text-[#111111]/60">
          <Loader2 className="h-4 w-4 animate-spin text-[#E53935]" /> Checking return options…
        </div>
      </section>
    );
  }

  if (loadError && !state) {
    return (
      <section className={PANEL} aria-label="Returns">
        <p className="text-sm text-[#111111]/70" role="alert">
          {loadError}
        </p>
        <button type="button" onClick={() => void load()} className="mt-3 text-sm font-semibold text-[#E53935] underline">
          Try again
        </button>
      </section>
    );
  }
  if (!state) return null;

  const refresh = async () => {
    await Promise.all([load(), onChanged?.()]);
  };

  const hasRequests = state.requests.length > 0;
  const showCallout = state.eligible && state.items.length > 0;
  const closedNote =
    !state.eligible && ['RETURNS_CLOSED', 'UNAVAILABLE'].includes(state.reason || '') && !hasRequests
      ? 'Returns are not open right now. Please contact support if you need help with this order.'
      : !state.eligible && state.reason === 'WINDOW_ENDED'
        ? state.message
        : '';

  if (!hasRequests && !showCallout && !closedNote) return null;

  return (
    <>
      {success && (
        <p role="status" className="rounded-lg border border-[#16845B]/30 bg-[#16845B]/10 px-3 py-2 text-sm font-medium text-[#0F6446]">
          {success}
        </p>
      )}

      {state.requests.map((request) => (
        <RequestCard key={request.id} request={request} onChanged={refresh} setSuccess={setSuccess} />
      ))}

      {showCallout && (
        <section className={PANEL} aria-label="Returns">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={LABEL}>Returns</p>
              <p className="mt-1 text-sm text-[#111111]/75">
                {hasRequests ? 'You can return other items from this order' : 'Something not right? You can return items from this order'}
                {state.daysLeft != null ? ` for the next ${state.daysLeft} day${state.daysLeft === 1 ? '' : 's'}` : ''}.
              </p>
            </div>
            <button type="button" className={BUTTON} onClick={() => { setSuccess(''); setOpen(true); }}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Request a return
            </button>
          </div>
        </section>
      )}

      {closedNote && (
        <section className={PANEL} aria-label="Returns">
          <p className="flex items-start gap-2 text-sm text-[#111111]/65">
            <PackageX className="mt-0.5 h-4 w-4 shrink-0 text-[#E53935]" aria-hidden /> {closedNote}
          </p>
        </section>
      )}

      {open && showCallout && (
        <ReturnDialog
          orderId={orderId}
          isCod={isCod}
          items={state.items}
          reasons={state.reasons}
          onClose={() => setOpen(false)}
          onSubmitted={async () => {
            setOpen(false);
            setSuccess('Your return request has been sent. We will review it and update you here.');
            await refresh();
          }}
        />
      )}
    </>
  );
}

function RequestCard({
  request,
  onChanged,
  setSuccess,
}: {
  request: ReturnRow;
  onChanged: () => Promise<void>;
  setSuccess: (text: string) => void;
}) {
  const style = STATUS_STYLE[request.status] || STATUS_STYLE.Requested;
  const Icon = style.icon;
  const [tracking, setTracking] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const markShipped = async () => {
    setBusy(true);
    setError('');
    try {
      await customerRequest(`/api/returns/${encodeURIComponent(request.id)}/shipped`, {
        method: 'PATCH',
        body: JSON.stringify({ trackingReference: tracking.trim() || undefined }),
      });
      setSuccess('Thank you. We have noted that your items are on their way back.');
      await onChanged();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <section className={PANEL} aria-label="Return status">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={LABEL}>Return</p>
          <p className="mt-1 text-xs text-[#111111]/55">Requested {when(request.requestedAt)}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${style.tone}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden /> {request.customerStatus}
        </span>
      </div>

      <p className="mt-3 text-sm text-[#111111]/75">{request.note}</p>

      <ul className="mt-4 divide-y divide-[#111111]/10 rounded-xl border border-[#111111]/10 bg-white">
        {request.items.map((item) => (
          <li key={item.orderItemId} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="min-w-0">
              <span className="block truncate font-medium">{item.name}</span>
              <span className="text-xs text-[#111111]/55">{[item.size, item.color].filter(Boolean).join(' · ')}</span>
              {item.outcome && <span className="block text-xs text-[#111111]/65">Check result: {item.outcome}</span>}
            </span>
            <span className="shrink-0 text-xs font-semibold text-[#111111]/70">Qty {item.quantity}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-[#111111]/70">
        <span className="font-semibold text-[#111111]">Your reason: </span>
        <span className="break-words">{request.reason}</span>
      </p>
      {request.decisionReason && (
        <p className="mt-2 text-sm text-[#111111]/70">
          <span className="font-semibold text-[#111111]">Our note: </span>
          <span className="break-words">{request.decisionReason}</span>
        </p>
      )}
      {request.trackingReference && (
        <p className="mt-2 text-sm text-[#111111]/70">
          <span className="font-semibold text-[#111111]">Your tracking number: </span>
          {request.trackingReference}
        </p>
      )}

      {request.tracking ? (
        <ReturnTimeline tracking={request.tracking} />
      ) : request.refund?.status && request.refund.amount > 0 ? (
        <div className="mt-3 rounded-xl border border-[#111111]/10 bg-white p-4 text-sm" aria-label="Refund">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">Refund {formatINR(request.refund.amount)}</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${REFUND_TONE[request.refund.status]}`}>
              {REFUND_LABEL[request.refund.status]}
            </span>
          </div>
          <p className="mt-1.5 text-[#111111]/70">{request.refund.note}</p>
          <p className="mt-1 text-xs text-[#111111]/55">
            Refund method: {request.refund.method || 'UPI'}
            {request.refund.destination ? ` · ${request.refund.destination}` : ''}
            {request.refund.reference ? ` · Reference ${request.refund.reference}` : ''}
          </p>
        </div>
      ) : request.refund && request.refund.state !== 'none' && request.refund.amount > 0 ? (
        <p className="mt-3 text-sm font-medium text-[#111111]">
          {request.refund.state === 'refunded'
            ? `Your refund of ${formatINR(request.refund.amount)} has been issued.`
            : `Your refund of ${formatINR(request.refund.amount)} is being processed. It can take a few days to reach you.`}
        </p>
      ) : request.refundTo ? (
        <p className="mt-3 text-xs text-[#111111]/60">
          Refund method: {request.refundTo.method} · {request.refundTo.destination}
        </p>
      ) : null}

      {request.canMarkShipped && (
        <div className="mt-4 rounded-xl border border-[#111111]/10 bg-white p-4">
          <p className="text-sm font-semibold">Sent the items back?</p>
          <label htmlFor={`track-${request.id}`} className="mt-2 block text-xs text-[#111111]/60">
            Tracking number (optional)
          </label>
          <input
            id={`track-${request.id}`}
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            maxLength={100}
            disabled={busy}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-[#111111]/20 px-3.5 text-sm outline-none focus:border-[#E53935] focus:ring-2 focus:ring-[#E53935]/20"
          />
          {error && (
            <p role="alert" className="mt-2 text-sm text-[#B42318]">
              {error}
            </p>
          )}
          <button type="button" className={`${BUTTON} mt-3`} onClick={() => void markShipped()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Truck className="h-4 w-4" aria-hidden />}
            I have sent the items
          </button>
        </div>
      )}

      {!request.tracking && request.timeline.length > 0 && (
        <ol className="mt-5 space-y-2 border-l-2 border-[#E53935]/25 pl-4" aria-label="Return progress">
          {request.timeline.map((step, index) => (
            <li key={`${step.status}-${index}`} className="text-xs text-[#111111]/70">
              <span className="font-semibold text-[#111111]">{step.label}</span> · {when(step.at)}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ReturnDialog({
  orderId,
  isCod,
  items,
  reasons,
  onClose,
  onSubmitted,
}: {
  orderId: string;
  isCod: boolean;
  items: ReturnItem[];
  reasons: { code: string; label: string }[];
  onClose: () => void;
  onSubmitted: () => Promise<void>;
}) {
  const [selection, setSelection] = useState<Selection>(() => initialSelection(items));
  const [reasonCode, setReasonCode] = useState('');
  const [description, setDescription] = useState('');
  const [upiId, setUpiId] = useState('');
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [estimate, setEstimate] = useState<{ estimate: number; breakdown: Breakdown | null } | null>(null);
  const [estimating, setEstimating] = useState(false);
  const firstFocus = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFocus.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, submitting]);

  const problem = useMemo(
    () => validateReturn(items, selection, reasonCode, description, { required: isCod, value: upiId }),
    [items, selection, reasonCode, description, isCod, upiId]
  );
  const picked = useMemo(() => chosenItems(items, selection), [items, selection]);

  // The server works out the refund estimate; the screen only shows it.
  useEffect(() => {
    if (picked.length === 0) {
      setEstimate(null);
      return;
    }
    let cancelled = false;
    setEstimating(true);
    const timer = setTimeout(async () => {
      try {
        const result = await customerRequest<{ estimate: number; breakdown: Breakdown | null }>('/api/returns/preview', {
          method: 'POST',
          body: JSON.stringify({ orderId, items: picked, reasonCode: reasonCode || undefined }),
        });
        if (!cancelled) setEstimate(result);
      } catch {
        if (!cancelled) setEstimate(null);
      } finally {
        if (!cancelled) setEstimating(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId, picked, reasonCode]);

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await customerRequest('/api/returns', {
        method: 'POST',
        body: JSON.stringify(buildReturnPayload(orderId, items, selection, reasonCode, description, isCod ? upiId : undefined)),
      });
      await onSubmitted();
    } catch (err) {
      setError(errorText(err));
      setStep('form');
      setSubmitting(false);
    }
  };

  const reasonLabel = reasons.find((r) => r.code === reasonCode)?.label || '';

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => !submitting && onClose()} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-title"
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <header className="border-b border-[#111111]/10 px-5 py-4 sm:px-6">
          <p className={LABEL}>Return</p>
          <h2 id="return-title" className="mt-1 font-serif text-2xl">
            {step === 'form' ? 'Request a return' : 'Review your request'}
          </h2>
          <p className="mt-1 text-xs text-[#111111]/60">
            {step === 'form' ? 'Choose what you want to send back and tell us why.' : 'Check the details, then send it.'}
          </p>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 sm:px-6">
          {step === 'form' ? (
            <>
              <ItemPicker
                legend="Items to return"
                items={items}
                selection={selection}
                onChange={setSelection}
                disabled={submitting}
                firstRef={firstFocus}
              />

              <div>
                <label htmlFor="return-reason-code" className="mb-2 block text-sm font-semibold">
                  Why are you returning this?
                </label>
                <select
                  id="return-reason-code"
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  disabled={submitting}
                  className="min-h-[48px] w-full rounded-xl border border-[#111111]/20 bg-white px-3.5 text-sm outline-none transition focus:border-[#E53935] focus:ring-2 focus:ring-[#E53935]/20"
                >
                  <option value="">Choose a reason…</option>
                  {reasons.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="return-description" className="mb-2 block text-sm font-semibold">
                  Tell us more <span className="font-normal text-[#111111]/55">(optional{reasonCode === 'other' ? ' — needed for “Other”' : ''})</span>
                </label>
                <textarea
                  id="return-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  rows={3}
                  maxLength={REASON_MAX}
                  placeholder="For example: the size is too small."
                  className="w-full rounded-xl border border-[#111111]/20 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#E53935] focus:ring-2 focus:ring-[#E53935]/20 disabled:bg-[#111111]/5"
                />
                <p className="mt-1 text-right text-xs text-[#111111]/55">
                  {description.length}/{REASON_MAX}
                </p>
              </div>

              {isCod && (
                <div>
                  <label htmlFor="return-upi" className="mb-2 block text-sm font-semibold">
                    Your UPI ID for the refund
                  </label>
                  <input
                    id="return-upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    disabled={submitting}
                    inputMode="email"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={100}
                    placeholder="name@bank"
                    aria-invalid={touched && !isValidUpi(upiId)}
                    aria-describedby="return-upi-help"
                    className="min-h-[48px] w-full rounded-xl border border-[#111111]/20 bg-white px-3.5 text-sm outline-none transition focus:border-[#E53935] focus:ring-2 focus:ring-[#E53935]/20"
                  />
                  <p id="return-upi-help" className="mt-1 text-xs text-[#111111]/60">
                    You paid cash on delivery, so we send your refund to this UPI ID. {touched && !isValidUpi(upiId) ? UPI_HELP : ''}
                  </p>
                </div>
              )}

              {estimating && !estimate ? (
                <p className="flex items-center gap-2 text-sm text-[#111111]/60">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Working out your refund…
                </p>
              ) : estimate?.breakdown ? (
                <RefundBreakdown
                  breakdown={estimate.breakdown}
                  title="Estimated refund"
                  note={
                    estimate.breakdown.sellerFault
                      ? 'This is an estimate. Because this is our mistake, your refund includes shipping and any COD handling fee. We confirm the final amount after we check the items.'
                      : 'This is an estimate. We confirm the final amount after we check the items. Shipping charges are not refunded on a return.'
                  }
                />
              ) : null}

              {touched && problem && (
                <p role="alert" className="rounded-lg border border-[#D92D20]/30 bg-[#D92D20]/8 px-3 py-2 text-sm text-[#B42318]">
                  {problem}
                </p>
              )}
            </>
          ) : (
            <div className="space-y-4 text-sm">
              <ul className="divide-y divide-[#111111]/10 rounded-xl border border-[#111111]/10">
                {picked.map((p) => {
                  const item = items.find((i) => i.orderItemId === p.orderItemId);
                  return (
                    <li key={p.orderItemId} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="min-w-0 truncate font-medium">{item?.name}</span>
                      <span className="shrink-0 text-xs font-semibold text-[#111111]/70">Qty {p.quantity}</span>
                    </li>
                  );
                })}
              </ul>
              <p>
                <span className="font-semibold">Reason: </span>
                {reasonLabel}
                {description.trim() ? ` — ${description.trim()}` : ''}
              </p>
              {isCod && (
                <p>
                  <span className="font-semibold">Refund to UPI: </span>
                  {upiId.trim().toLowerCase()}
                </p>
              )}
              {estimate?.breakdown && (
                <p>
                  <span className="font-semibold">Estimated refund: </span>
                  {formatINR(estimate.estimate)} <span className="text-xs text-[#111111]/55">(confirmed after we check the items)</span>
                </p>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-lg border border-[#D92D20]/30 bg-[#D92D20]/8 px-3 py-2 text-sm text-[#B42318]">
              {error}
            </p>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-[#111111]/10 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          {step === 'form' ? (
            <>
              <button type="button" onClick={onClose} disabled={submitting} className={OUTLINE}>
                Cancel
              </button>
              <button
                type="button"
                className={BUTTON}
                onClick={() => {
                  setTouched(true);
                  if (!problem) setStep('review');
                }}
              >
                {`Review request${picked.length > 0 ? ` (${picked.length} item${picked.length === 1 ? '' : 's'})` : ''}`}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setStep('form')} disabled={submitting} className={OUTLINE}>
                Go back
              </button>
              <button type="button" onClick={() => void submit()} disabled={submitting} className={BUTTON}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending…
                  </>
                ) : (
                  'Send return request'
                )}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
