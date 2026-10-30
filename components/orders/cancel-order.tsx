'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Loader2, XCircle } from 'lucide-react';

import { CustomerApiError, customerRequest, errorText } from '@/lib/customer-api';
import { formatINR } from '@/lib/format';
import { NOTE_MAX, validateCancelReason } from '@/lib/cancel-reasons';
import { ItemPicker, RefundBreakdown, type Breakdown, type PickableItem } from '@/components/orders/item-picker';
import { chosenItems, initialSelection, type Selection } from '@/lib/return-request';

type Options = {
  eligible: boolean;
  code: string;
  message: string;
  partialAvailable: boolean;
  reasons: { code: string; label: string }[];
  paidOnline: boolean;
  items: {
    orderItemId: string;
    name: string;
    image: string | null;
    size: string;
    color: string;
    quantity: number;
    cancelledQuantity: number;
    availableQuantity: number;
    unitPrice: number;
  }[];
  history: {
    id: string;
    reason: string;
    wholeOrder: boolean;
    refundAmount: number | null;
    at: string;
    refund: 'refunded' | 'in_progress' | null;
  }[];
};

const PANEL = 'rounded-2xl border border-[#E53935]/20 bg-[#F7F7F7] p-5 sm:p-6';
const LABEL = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E53935]';
const GHOST =
  'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[#C8211F] px-6 text-sm font-semibold tracking-wide text-[#C8211F] transition-colors hover:bg-[#C8211F] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8211F] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto';
const SOLID =
  'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#C8211F] px-6 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-[#A51B19] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8211F] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto';
const OUTLINE =
  'inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-[#111111]/25 px-6 text-sm font-semibold transition-colors hover:border-[#111111] disabled:opacity-50 sm:w-auto';

/** Cancel the whole order or only some items. The server decides what is allowed and what is refunded. */
export function CancelSection({ orderId, onChanged }: { orderId: string; onChanged: () => void | Promise<void> }) {
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoadError('');
    try {
      setOptions(await customerRequest<Options>(`/api/orders/${encodeURIComponent(orderId)}/cancel-options`));
    } catch (error) {
      if (!(error instanceof CustomerApiError && error.status === 401)) setLoadError(errorText(error));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return null;

  if (loadError && !options) {
    return (
      <section className={PANEL} aria-label="Cancellation">
        <p className="text-sm text-[#111111]/70" role="alert">
          {loadError}
        </p>
        <button type="button" onClick={() => void load()} className="mt-3 text-sm font-semibold text-[#E53935] underline">
          Try again
        </button>
      </section>
    );
  }
  if (!options) return null;

  const hasHistory = options.history.length > 0;
  const nothingToShow = !options.eligible && !hasHistory && !success && options.code !== 'SHIPPED';
  if (nothingToShow) return null;

  return (
    <>
      <section className={PANEL} aria-label="Cancellation">
        {success && (
          <p role="status" className="mb-4 rounded-lg border border-[#16845B]/30 bg-[#16845B]/10 px-3 py-2 text-sm font-medium text-[#0F6446]">
            {success}
          </p>
        )}

        {hasHistory && (
          <div className="mb-4">
            <p className={LABEL}>Cancelled</p>
            <ul className="mt-2 space-y-2">
              {options.history.map((h) => (
                <li key={h.id} className="rounded-xl border border-[#111111]/10 bg-white px-4 py-3 text-sm">
                  <span className="font-semibold">{h.wholeOrder ? 'Order cancelled' : 'Items cancelled'}</span>
                  <span className="text-[#111111]/60"> · {h.reason}</span>
                  {h.refundAmount ? (
                    <span className="block text-xs text-[#111111]/65">
                      Refund {formatINR(h.refundAmount)} — {h.refund === 'refunded' ? 'sent to your payment method' : 'on its way'}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        {options.eligible ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={LABEL}>Cancel</p>
              <p className="mt-1 text-sm text-[#111111]/75">
                Changed your mind? You can cancel this order, or only some of its items, until it is shipped.
              </p>
            </div>
            <button type="button" className={GHOST} onClick={() => { setSuccess(''); setOpen(true); }}>
              <XCircle className="h-4 w-4" aria-hidden /> Cancel order
            </button>
          </div>
        ) : (
          options.message &&
          options.code !== 'ALREADY_CANCELLED' && <p className="text-sm text-[#111111]/65">{options.message}</p>
        )}
      </section>

      {open && options.eligible && (
        <CancelDialog
          orderId={orderId}
          options={options}
          onClose={() => setOpen(false)}
          onDone={async (message) => {
            setOpen(false);
            setSuccess(message);
            await Promise.all([load(), onChanged()]);
          }}
        />
      )}
    </>
  );
}

function CancelDialog({
  orderId,
  options,
  onClose,
  onDone,
}: {
  orderId: string;
  options: Options;
  onClose: () => void;
  onDone: (message: string) => Promise<void>;
}) {
  const items: PickableItem[] = useMemo(
    () =>
      options.items
        .filter((item) => item.availableQuantity > 0)
        .map((item) => ({
          orderItemId: item.orderItemId,
          name: item.name,
          image: item.image,
          size: item.size,
          color: item.color,
          quantity: item.availableQuantity,
          unitPrice: item.unitPrice,
        })),
    [options]
  );

  // Starts with everything chosen: "Cancel order" means the whole order unless the customer unticks something.
  const [selection, setSelection] = useState<Selection>(() => {
    const all = initialSelection(items);
    for (const item of items) all[item.orderItemId] = { checked: true, quantity: item.quantity };
    return all;
  });
  const [reasonCode, setReasonCode] = useState('');
  const [note, setNote] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [estimate, setEstimate] = useState<{ amount: number; breakdown: Breakdown | null; wholeOrder: boolean } | null>(null);
  const [estimating, setEstimating] = useState(false);
  const first = useRef<HTMLInputElement>(null);

  const picked = useMemo(() => chosenItems(items, selection), [items, selection]);
  const problem = useMemo(() => {
    if (picked.length === 0) return 'Choose at least one item to cancel.';
    return validateCancelReason(reasonCode, note);
  }, [picked, reasonCode, note]);

  useEffect(() => {
    first.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [busy, onClose]);

  // The server works out the refund; this only asks and shows the answer.
  useEffect(() => {
    if (picked.length === 0) {
      setEstimate(null);
      return;
    }
    let cancelled = false;
    setEstimating(true);
    const timer = setTimeout(async () => {
      try {
        const result = await customerRequest<{ amount: number; breakdown: Breakdown | null; wholeOrder: boolean }>(
          `/api/orders/${encodeURIComponent(orderId)}/cancel-preview`,
          { method: 'POST', body: JSON.stringify({ items: picked }) }
        );
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
  }, [orderId, picked]);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await customerRequest<{ message: string }>(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reasonCode, note: note.trim() || undefined, items: picked }),
      });
      await onDone(data.message || 'Your cancellation was successful.');
    } catch (err) {
      setError(errorText(err));
      setStep('form');
      setBusy(false);
    }
  };

  const wholeOrder = estimate?.wholeOrder ?? items.every((i) => selection[i.orderItemId]?.checked && selection[i.orderItemId].quantity === i.quantity);
  const summary = picked
    .map((p) => `${p.quantity} × ${items.find((i) => i.orderItemId === p.orderItemId)?.name || 'item'}`)
    .join(', ');

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => !busy && onClose()} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-title"
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <header className="border-b border-[#111111]/10 px-5 py-4 sm:px-6">
          <p className={LABEL}>Cancel</p>
          <h2 id="cancel-title" className="mt-1 font-serif text-2xl">
            {step === 'form' ? 'Cancel order' : 'Are you sure?'}
          </h2>
          <p className="mt-1 text-xs text-[#111111]/60">
            {step === 'form' ? 'Choose what to cancel and tell us why.' : 'This cannot be undone.'}
          </p>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 sm:px-6">
          {step === 'form' ? (
            <>
              <ItemPicker
                legend="Items to cancel"
                items={items}
                selection={selection}
                onChange={setSelection}
                disabled={busy}
                firstRef={first}
              />

              <div>
                <label htmlFor="cancel-reason" className="mb-2 block text-sm font-semibold">
                  Why are you cancelling?
                </label>
                <select
                  id="cancel-reason"
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  disabled={busy}
                  className="min-h-[48px] w-full rounded-xl border border-[#111111]/20 bg-white px-3.5 text-sm outline-none transition focus:border-[#E53935] focus:ring-2 focus:ring-[#E53935]/20"
                >
                  <option value="">Choose a reason…</option>
                  {options.reasons.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cancel-note" className="mb-2 block text-sm font-semibold">
                  Anything else? <span className="font-normal text-[#111111]/55">(optional{reasonCode === 'other' ? ' — needed for “Other”' : ''})</span>
                </label>
                <textarea
                  id="cancel-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={busy}
                  rows={3}
                  maxLength={NOTE_MAX}
                  className="w-full rounded-xl border border-[#111111]/20 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#E53935] focus:ring-2 focus:ring-[#E53935]/20 disabled:bg-[#111111]/5"
                />
              </div>

              {options.paidOnline ? (
                estimating && !estimate ? (
                  <p className="flex items-center gap-2 text-sm text-[#111111]/60">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Working out your refund…
                  </p>
                ) : estimate?.breakdown ? (
                  <RefundBreakdown
                    breakdown={estimate.breakdown}
                    title="Your refund"
                    note="Goes back to your original payment method. Shipping is refunded only when the whole order is cancelled."
                  />
                ) : null
              ) : (
                <p className="rounded-xl bg-[#111111]/5 px-4 py-3 text-sm text-[#111111]/70">
                  No payment has been taken for this order, so there is nothing to refund.
                </p>
              )}

              {touched && problem && (
                <p role="alert" className="rounded-lg border border-[#D92D20]/30 bg-[#D92D20]/8 px-3 py-2 text-sm text-[#B42318]">
                  {problem}
                </p>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <p className="flex items-start gap-3 rounded-xl bg-[#C8211F]/8 p-4 text-sm text-[#7A1412]">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <span>
                  You are about to cancel <strong>{wholeOrder ? 'the whole order' : 'part of this order'}</strong>: {summary}.
                </span>
              </p>
              {options.paidOnline && estimate?.breakdown && (
                <p className="text-sm text-[#111111]/75">
                  We will refund <strong>{formatINR(estimate.breakdown.final)}</strong> to your original payment method.
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
              <button type="button" className={OUTLINE} onClick={onClose} disabled={busy}>
                Keep my order
              </button>
              <button
                type="button"
                className={SOLID}
                disabled={busy}
                onClick={() => {
                  setTouched(true);
                  if (!problem) setStep('confirm');
                }}
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <button type="button" className={OUTLINE} onClick={() => setStep('form')} disabled={busy}>
                Go back
              </button>
              <button type="button" className={SOLID} disabled={busy} onClick={() => void submit()}>
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Cancelling…
                  </>
                ) : (
                  'Yes, cancel'
                )}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
