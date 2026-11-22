'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Notice, Spinner, btnDanger, btnOutline, fieldClass, labelClass } from '@/components/admin/ui';
import { inr, message, opsRequest } from '@/lib/admin-ops-api';

type Options = {
  eligible: boolean;
  code: string;
  message: string;
  reasons: { code: string; label: string }[];
  paidOnline: boolean;
  items: {
    orderItemId: string;
    name: string;
    size: string;
    color: string;
    quantity: number;
    cancelledQuantity: number;
    availableQuantity: number;
    unitPrice: number;
  }[];
  history: { id: string; by: string; reason: string; wholeOrder: boolean; refundAmount: number | null; at: string }[];
};

type Preview = {
  wholeOrder: boolean;
  refundable: boolean;
  amount: number;
  breakdown: null | {
    lines: { orderItemId: string; name: string; quantity: number; goods: number; discount: number; tax: number; refund: number }[];
    shipping: number;
    final: number;
    includesShipping: boolean;
  };
};

/**
 * Admin cancellation: a reason is mandatory; the whole order or only some items
 * and quantities. The refund is worked out by the server and shown before the
 * admin confirms. Nothing here decides who may cancel what: the server does.
 */
export function AdminCancelDialog({
  orderId,
  orderNumber,
  onClose,
  onDone,
}: {
  orderId: string;
  orderNumber: string;
  onClose: () => void;
  onDone: (text: string) => Promise<void> | void;
}) {
  const [options, setOptions] = useState<Options | null>(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [reasonCode, setReasonCode] = useState('');
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    opsRequest<Options>(`/api/orders/admin/${encodeURIComponent(orderId)}/cancel-options`)
      .then((data) => {
        if (!live) return;
        setOptions(data);
        const all: Record<string, number> = {};
        for (const item of data.items) if (item.availableQuantity > 0) all[item.orderItemId] = item.availableQuantity;
        setPicked(all);
      })
      .catch((e) => live && setError(message(e)));
    return () => {
      live = false;
    };
  }, [orderId]);

  const items = useMemo(
    () => Object.entries(picked).filter(([, q]) => q > 0).map(([orderItemId, quantity]) => ({ orderItemId, quantity })),
    [picked]
  );

  // The server works out the refund for exactly this selection.
  useEffect(() => {
    if (!options?.eligible || items.length === 0) {
      setPreview(null);
      return;
    }
    let live = true;
    const timer = setTimeout(() => {
      opsRequest<Preview>(`/api/orders/admin/${encodeURIComponent(orderId)}/cancel-preview`, {
        method: 'POST',
        body: JSON.stringify({ items }),
      })
        .then((p) => live && setPreview(p))
        .catch(() => live && setPreview(null));
    }, 300);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [orderId, options, items]);

  const problem =
    items.length === 0
      ? 'Choose at least one item.'
      : !reasonCode
        ? 'Choose a reason.'
        : reasonCode === 'other' && note.trim().length < 5
          ? 'Explain the reason in a few words.'
          : '';

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await opsRequest<{ message: string }>(`/api/orders/admin/${encodeURIComponent(orderId)}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reasonCode, note: note.trim() || undefined, items }),
      });
      await onDone(res.message || 'Order cancelled.');
    } catch (e) {
      setError(message(e));
      setStep('form');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => !busy && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-cancel-title"
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#E3E5EE] bg-white p-6 shadow-xl"
      >
        <h2 id="admin-cancel-title" className="text-[20px] font-bold text-[#11162B]">
          Cancel order {orderNumber}
        </h2>

        {!options && !error && <Spinner label="Loading" />}

        {options && !options.eligible && (
          <div className="mt-4 space-y-3">
            <Notice tone="warning">{options.message}</Notice>
            <button type="button" className={btnOutline} onClick={onClose}>
              Close
            </button>
          </div>
        )}

        {options?.eligible && step === 'form' && (
          <div className="mt-4 space-y-5">
            <fieldset>
              <legend className={labelClass}>Items to cancel</legend>
              <ul className="space-y-2">
                {options.items
                  .filter((item) => item.availableQuantity > 0)
                  .map((item) => {
                    const quantity = picked[item.orderItemId] || 0;
                    return (
                      <li key={item.orderItemId} className="flex items-center justify-between gap-3 rounded-lg border border-[#E3E5EE] px-3 py-2">
                        <label className="flex min-w-0 flex-1 items-center gap-2 text-[15px]">
                          <input
                            type="checkbox"
                            checked={quantity > 0}
                            onChange={(e) =>
                              setPicked((p) => ({ ...p, [item.orderItemId]: e.target.checked ? item.availableQuantity : 0 }))
                            }
                          />
                          <span className="min-w-0 truncate">
                            {item.name} <span className="text-[#5A6075]">({[item.size, item.color].filter(Boolean).join(', ')})</span>
                          </span>
                        </label>
                        <select
                          aria-label={`Quantity of ${item.name}`}
                          className="h-10 rounded-lg border border-[#E3E5EE] bg-white px-2 text-[15px]"
                          value={quantity}
                          onChange={(e) => setPicked((p) => ({ ...p, [item.orderItemId]: Number(e.target.value) }))}
                        >
                          {Array.from({ length: item.availableQuantity + 1 }, (_, n) => (
                            <option key={n} value={n}>
                              {n === 0 ? '—' : `${n} of ${item.availableQuantity}`}
                            </option>
                          ))}
                        </select>
                      </li>
                    );
                  })}
              </ul>
            </fieldset>

            <div>
              <label className={labelClass} htmlFor="admin-cancel-reason">
                Reason (recorded in the audit log)
              </label>
              <select id="admin-cancel-reason" className={fieldClass} value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
                <option value="">Choose a reason…</option>
                {options.reasons.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </select>
              <textarea
                className={`${fieldClass} mt-2 h-auto py-2.5`}
                rows={2}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={reasonCode === 'other' ? 'Explain the reason' : 'Notes (optional)'}
                aria-label="Cancellation notes"
              />
            </div>

            {options.paidOnline ? (
              preview?.breakdown && (
                <div className="rounded-lg border border-[#E3E5EE] bg-[#F5F6FA] p-3 text-[14px] text-[#5A6075]">
                  <p className="font-semibold text-[#11162B]">Refund the server will send</p>
                  <ul className="mt-1 space-y-0.5">
                    {preview.breakdown.lines.map((l) => (
                      <li key={l.orderItemId}>
                        {l.quantity} × {l.name}: {inr(l.goods)} − {inr(l.discount)} discount + {inr(l.tax)} GST = <strong>{inr(l.refund)}</strong>
                      </li>
                    ))}
                    {preview.breakdown.includesShipping && <li>Shipping: {inr(preview.breakdown.shipping)}</li>}
                  </ul>
                  <p className="mt-2 text-[15px] font-bold text-[#11162B]">Total {inr(preview.breakdown.final)}</p>
                  <p className="mt-1 text-[13px] text-[#5A6075]">
                    {preview.wholeOrder ? 'Every remaining item is cancelled, so shipping is refunded too.' : 'Part of the order stays; shipping is not refunded.'}
                  </p>
                </div>
              )
            ) : (
              <p className="text-[14px] text-[#5A6075]">Nothing was paid online for this order, so there is no refund.</p>
            )}

            {error && <Notice tone="error">{error}</Notice>}
            {problem && items.length >= 0 && error === '' && <p className="text-[14px] text-[#5A6075]">{problem}</p>}

            <div className="flex justify-end gap-3">
              <button type="button" className={btnOutline} onClick={onClose}>
                Keep order
              </button>
              <button type="button" className={btnDanger} disabled={Boolean(problem)} onClick={() => setStep('confirm')}>
                Continue
              </button>
            </div>
          </div>
        )}

        {options?.eligible && step === 'confirm' && (
          <div className="mt-4 space-y-4">
            <Notice tone="warning">
              {preview?.wholeOrder ? 'The whole order will be cancelled' : 'Part of the order will be cancelled'}
              {preview?.breakdown ? ` and ${inr(preview.breakdown.final)} refunded through Razorpay` : ''}. Stock goes back for the cancelled quantities. The customer is e-mailed. This cannot be undone.
            </Notice>
            {error && <Notice tone="error">{error}</Notice>}
            <div className="flex justify-end gap-3">
              <button type="button" className={btnOutline} onClick={() => setStep('form')} disabled={busy}>
                Back
              </button>
              <button type="button" className={btnDanger} onClick={() => void submit()} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Cancel now
              </button>
            </div>
          </div>
        )}

        {error && !options && (
          <div className="mt-4 space-y-3">
            <Notice tone="error">{error}</Notice>
            <button type="button" className={btnOutline} onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
