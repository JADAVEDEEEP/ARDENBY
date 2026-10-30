'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

import { Notice, btnDanger, btnOutline, btnPrimary, fieldClass, labelClass } from '@/components/admin/ui';
import { message } from '@/lib/admin-ops-api';

/**
 * A small confirmation dialog that asks for a written reason. The server
 * enforces the same minimum length, so this only saves a round trip.
 */
export function ReasonDialog({
  title,
  description,
  confirmLabel,
  reasonLabel = 'Reason',
  minLength = 5,
  danger,
  extra,
  onSubmit,
  onClose,
}: {
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  reasonLabel?: string;
  minLength?: number;
  danger?: boolean;
  extra?: ReactNode;
  onSubmit: (reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [busy, onClose]);

  const submit = async () => {
    const text = reason.trim();
    if (text.length < minLength) {
      setError(`Please enter at least ${minLength} characters.`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSubmit(text);
    } catch (e) {
      setError(message(e));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => !busy && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reason-title"
        className="relative w-full max-w-md rounded-xl border border-[#E4E7EC] bg-white p-6 shadow-xl"
      >
        <h2 id="reason-title" className="text-[20px] font-bold text-[#111111]">
          {title}
        </h2>
        {description && <div className="mt-2 text-[14px] leading-6 text-[#626875]">{description}</div>}
        {extra && <div className="mt-4">{extra}</div>}

        <label className={`${labelClass} mt-4`} htmlFor="reason-text">
          {reasonLabel}
        </label>
        <textarea
          id="reason-text"
          ref={ref}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          className={`${fieldClass} h-auto py-2.5`}
        />

        {error && (
          <Notice tone="error" className="mt-3">
            {error}
          </Notice>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" className={btnOutline} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={danger ? btnDanger : btnPrimary} onClick={() => void submit()} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
