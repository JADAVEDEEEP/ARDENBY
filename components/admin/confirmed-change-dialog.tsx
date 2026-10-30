'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

import { errorMessage, superAdminRequest } from '@/lib/superadmin-api';
import { cn } from '@/lib/utils';

/**
 * Two-step confirmation used for role changes and for creating an Admin:
 *   1. write a reason  -> the server e-mails a 6-digit code to YOU
 *   2. type the code   -> the change is applied
 * The code is never shown on screen and works once, for this change only.
 */

export type ConfirmedResult = {
  notification?: { attempted: number; delivered: number; failed: number };
  inviteEmailSent?: boolean;
  message?: string;
  sessionsRevoked?: boolean;
};

const field =
  'w-full rounded-lg border border-[#E53935]/25 bg-[#111111] px-3 py-2 text-sm text-[#F7F7F7] outline-none transition focus:border-[#E53935]/70';

export function ConfirmedChangeDialog({
  title,
  body,
  subject,
  danger,
  requestPath,
  requestBody,
  applyPath,
  applyMethod,
  applyBody,
  extraFields,
  canStart = true,
  applyLabel,
  onCancel,
  onDone,
}: {
  title: string;
  body: ReactNode;
  subject?: string;
  danger?: boolean;
  requestPath: string;
  requestBody: (reason: string) => object;
  applyPath: string;
  applyMethod: 'PATCH' | 'POST';
  applyBody: (reason: string, confirmationId: string, code: string) => object;
  extraFields?: ReactNode;
  canStart?: boolean;
  applyLabel: string;
  onCancel: () => void;
  onDone: (result: ConfirmedResult) => void;
}) {
  const [step, setStep] = useState<'reason' | 'code'>('reason');
  const [reason, setReason] = useState('');
  const [code, setCode] = useState('');
  const [confirmationId, setConfirmationId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const first = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    first.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onCancel();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [busy, onCancel]);

  const sendCode = async () => {
    const text = reason.trim();
    if (text.length < 5) {
      setError('Please give a reason of at least 5 characters.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await superAdminRequest<{ confirmationId: string }>(requestPath, {
        method: 'POST',
        body: JSON.stringify(requestBody(text)),
      });
      setConfirmationId(res.confirmationId);
      setStep('code');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your e-mail.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await superAdminRequest<ConfirmedResult>(applyPath, {
        method: applyMethod,
        body: JSON.stringify(applyBody(reason.trim(), confirmationId, code)),
      });
      onDone(res);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={() => !busy && onCancel()} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cc-title"
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-xl border border-[#E53935]/30 bg-[#1A1A1A] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        <h2 id="cc-title" className="font-serif text-xl text-[#F7F7F7]">
          {title}
        </h2>
        <div className="mt-2 text-sm leading-6 text-[#BBBBBB]">{body}</div>
        {subject && <p className="mt-1 truncate text-xs text-[#7A7A7A]">{subject}</p>}

        {step === 'reason' ? (
          <div className="mt-4 space-y-4">
            {extraFields}
            <div>
              <label htmlFor="cc-reason" className="mb-1.5 block text-xs font-semibold text-[#E5E5E5]">
                Reason (kept in the audit log)
              </label>
              <textarea
                id="cc-reason"
                ref={first}
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={field}
              />
            </div>
            <p className="text-xs text-[#979797]">
              We will e-mail a confirmation code to your own address. Nothing changes until you enter it.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-[#BBBBBB]">
              A 6-digit code was sent to your e-mail. It works once and expires in 10 minutes.
            </p>
            <div>
              <label htmlFor="cc-code" className="mb-1.5 block text-xs font-semibold text-[#E5E5E5]">
                Confirmation code
              </label>
              <input
                id="cc-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={cn(field, 'text-center font-mono text-lg tracking-[0.4em]')}
              />
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-[#D98B7E]/40 bg-[#D98B7E]/10 px-3 py-2 text-sm text-[#E2A79D]">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-10 rounded-lg border border-[#E53935]/30 px-4 text-sm text-[#E5E5E5] transition hover:bg-[#272727]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void (step === 'reason' ? sendCode() : apply())}
            disabled={busy || (step === 'reason' && !canStart)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:opacity-60',
              danger ? 'bg-[#B5584A] text-white hover:bg-[#C4665A]' : 'bg-[#E53935] text-white hover:bg-[#C62E2B]'
            )}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {step === 'reason' ? 'Send me a code' : applyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export const describeResult = (result: ConfirmedResult, base: string) => {
  const parts = [base];
  const note = result.notification;
  if (note && note.attempted > 0) {
    parts.push(
      note.failed === 0
        ? `All ${note.delivered} Super Admins were notified by e-mail.`
        : `${note.delivered} of ${note.attempted} Super Admins were notified; ${note.failed} e-mail(s) could not be sent.`
    );
  }
  if (result.inviteEmailSent === false) {
    parts.push('The invitation e-mail could not be sent — ask them to use “Forgot password” on the admin sign-in page.');
  }
  return parts.join(' ');
};
