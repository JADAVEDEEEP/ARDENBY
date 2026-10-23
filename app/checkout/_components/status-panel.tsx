'use client';

import { AlertCircle, CheckCircle2, Loader2, RotateCcw, ShieldCheck } from 'lucide-react';
import type { Phase } from './shared';

// Live feedback for the async order / payment steps. Hidden while idle.
export function StatusPanel({
  phase,
  message,
  orderNumber,
  onRetry,
  onReset,
  retryLabel,
}: {
  phase: Phase;
  message: string;
  orderNumber: string | null;
  onRetry: () => void;
  onReset?: () => void;
  retryLabel: string;
}) {
  if (phase === 'idle' || phase === 'confirmed') return null;

  const failed = phase === 'failed';

  const copy: Record<string, { title: string; body: string }> = {
    creating: { title: 'Creating your order', body: 'Reserving stock and pricing your bag on the server.' },
    opening: { title: 'Opening Razorpay', body: 'Preparing the secure payment window. Button is locked.' },
    awaiting: {
      title: 'Complete payment in Razorpay',
      body: 'Finish the payment in the secure window. Closing it keeps your cart safe.',
    },
    verifying: { title: 'Verifying payment', body: 'Checking the payment signature with our server.' },
  };

  return (
    <section
      role={failed ? 'alert' : 'status'}
      aria-live="polite"
      className={`ck-panel overflow-hidden p-4 sm:p-5 ${failed ? 'border-[#2A2A2A]' : ''}`}
    >
      <div className="flex flex-wrap items-center gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            failed ? 'border border-white text-white' : 'border border-[#3A3A3A] text-[#C0C0C0]'
          }`}
        >
          {failed ? (
            <AlertCircle className="h-5 w-5" />
          ) : phase === 'verifying' ? (
            <ShieldCheck className="h-5 w-5" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#ffffff]">
            {failed ? 'Something went wrong' : copy[phase]?.title}
            {orderNumber && !failed && (
              <span className="ml-2 text-xs font-semibold text-[#C0C0C0]/70">{orderNumber}</span>
            )}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#C0C0C0] sm:text-sm">
            {failed ? message : copy[phase]?.body}
          </p>
          {!failed && (
            <span className="ck-track mt-3 block">
              <span
                className="ck-fill"
                style={{
                  width:
                    phase === 'creating' ? '25%' : phase === 'opening' ? '50%' : phase === 'awaiting' ? '70%' : '90%',
                }}
              />
            </span>
          )}
        </div>

        {failed && (
          <div className="flex w-full gap-2 sm:w-auto">
            <button type="button" onClick={onRetry} className="ck-ghost flex-1 sm:flex-none">
              <RotateCcw className="h-3.5 w-3.5" /> {retryLabel}
            </button>
            {onReset && (
              <button type="button" onClick={onReset} className="ck-ghost flex-1 sm:flex-none">
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export function ConfirmedCard({ orderNumber }: { orderNumber: string | null }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full ck-ico">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <p className="mt-6 text-[11px] font-medium tracking-[0.14em] text-[#C0C0C0]/70">ORDER CONFIRMATION</p>
      <h1 className="ck-heading mt-2 text-3xl sm:text-4xl">Order placed</h1>
      {orderNumber && (
        <p className="mt-3 text-sm font-medium tracking-wider text-[#C0C0C0]">{orderNumber}</p>
      )}
    </div>
  );
}
