'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

import { Notice, btnDanger, btnOutline, btnPrimary, fieldClass, labelClass } from '@/components/admin/ui';
import { message } from '@/lib/admin-ops-api';

/**
 * Confirmation for actions that cannot be undone (sending, cancelling, deleting).
 * `typeToConfirm` makes the admin type a word (for example SEND) before the button works, so a real
 * campaign can never go out by a stray click.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  danger,
  typeToConfirm,
  children,
  onConfirm,
  onClose,
}: {
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  typeToConfirm?: string;
  children?: ReactNode;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const first = useRef<HTMLInputElement | HTMLButtonElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const ready = !typeToConfirm || typed.trim() === typeToConfirm;

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError('');
    try {
      await onConfirm();
    } catch (e) {
      setError(message(e));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => !busy && onClose()} />
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="relative max-h-[90vh] w-full max-w-md overflow-auto rounded-xl border border-[#E3E5EE] bg-white p-6 shadow-xl">
        <h2 id="confirm-title" className="text-[20px] font-bold text-[#11162B]">
          {title}
        </h2>
        {description && <div className="mt-2 text-[15px] leading-6 text-[#5A6075]">{description}</div>}
        {children && <div className="mt-4">{children}</div>}

        {typeToConfirm && (
          <div className="mt-4">
            <label className={labelClass} htmlFor="confirm-type">
              Type <strong>{typeToConfirm}</strong> to confirm
            </label>
            <input
              id="confirm-type"
              ref={first as React.RefObject<HTMLInputElement>}
              className={fieldClass}
              value={typed}
              autoComplete="off"
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void submit()}
            />
          </div>
        )}

        {error && (
          <Notice tone="error" className="mt-3">
            {error}
          </Notice>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" className={btnOutline} onClick={onClose} disabled={busy} ref={typeToConfirm ? undefined : (first as React.RefObject<HTMLButtonElement>)}>
            Cancel
          </button>
          <button type="button" className={danger ? btnDanger : btnPrimary} onClick={() => void submit()} disabled={!ready || busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
