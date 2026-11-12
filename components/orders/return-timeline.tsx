'use client';

import { Check, Clock3, X } from 'lucide-react';

import { formatINR } from '@/lib/format';

/**
 * Return & refund tracking. Everything here is drawn from what the SERVER sends
 * (/api/returns/order/:id -> request.tracking). The server only marks a stage done once
 * the real event is stored (admin action, customer action, Razorpay / RazorpayX webhook),
 * so this component never decides that something happened. Black / white / grey / red.
 */

export type TrackingStage = {
  key: string;
  label: string;
  state: 'done' | 'current' | 'upcoming' | 'rejected' | 'failed' | 'skipped';
  at: string | null;
  note: string | null;
};

export type Tracking = {
  outcome: 'in_progress' | 'rejected' | 'completed' | 'refund_failed';
  currentKey: string | null;
  stages: TrackingStage[];
  estimate: { text: string; basis: 'approval' | 'inspection' | null; from?: string; to?: string } | null;
  refund:
    | {
        amount: number | null;
        isEstimate: boolean;
        breakdown: { goods: number | null; shipping: number; codFee: number } | null;
        sellerFault: boolean;
        method: string | null;
        status: 'Pending' | 'Processing' | 'Refunded' | 'Failed' | null;
        utr: string | null;
        completedAt: string | null;
      }
    | null;
};

const STAGE_HELP: Record<string, string> = {
  decision: 'We review every request, usually within one working day.',
  shipped: 'Send the item(s) back and tell us on this page.',
  received: 'We will confirm as soon as your parcel reaches us.',
  inspection: 'We check the item(s) against your request.',
  refund_approved: 'Once the check passes, your refund is approved.',
  refund_processing: 'Your refund is sent to your chosen method.',
  refund_final: 'The money reaches you.',
};

const STATUS_TONE: Record<string, string> = {
  Pending: 'border-[#111111]/25 bg-white text-[#111111]',
  Processing: 'border-[#111111] bg-[#111111] text-white',
  Refunded: 'border-[#111111] bg-[#111111] text-white',
  Failed: 'border-[#E53935] bg-[#E53935] text-white',
};

const stamp = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

const dayOnly = (ymd?: string) =>
  ymd ? new Date(`${ymd}T00:00:00Z`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'UTC' }) : '';

function Dot({ state }: { state: TrackingStage['state'] }) {
  const base = 'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors';
  if (state === 'done') {
    return (
      <span className={`${base} border-[#111111] bg-[#111111] text-white`} aria-hidden>
        <Check className="h-4 w-4" strokeWidth={3} />
      </span>
    );
  }
  if (state === 'failed' || state === 'rejected') {
    return (
      <span className={`${base} border-[#E53935] bg-[#E53935] text-white`} aria-hidden>
        <X className="h-4 w-4" strokeWidth={3} />
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span className={`${base} border-[#E53935] bg-white`} aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-[#E53935] motion-safe:animate-pulse" />
      </span>
    );
  }
  if (state === 'skipped') {
    return (
      <span className={`${base} border-[#111111]/20 bg-[#F2F2F2] text-[#111111]/40`} aria-hidden>
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span className={`${base} border-[#111111]/20 bg-white text-[#111111]/35`} aria-hidden>
      <Clock3 className="h-3.5 w-3.5" />
    </span>
  );
}

const STATE_WORD: Record<TrackingStage['state'], string> = {
  done: 'Completed',
  current: 'In progress',
  upcoming: 'Upcoming',
  rejected: 'Rejected',
  failed: 'Failed',
  skipped: 'Not needed',
};

export function ReturnTimeline({ tracking }: { tracking: Tracking }) {
  const { stages, refund, estimate, outcome } = tracking;
  const current = stages.find((s) => s.state === 'current' || s.state === 'failed' || s.state === 'rejected');
  const headline =
    outcome === 'rejected'
      ? 'This return was not accepted'
      : outcome === 'refund_failed'
        ? 'Your refund needs another try'
        : outcome === 'completed'
          ? 'Your return is complete'
          : current
            ? current.label
            : 'Return in progress';

  const showMoney = refund && refund.amount != null && refund.amount > 0;
  const parts = refund?.breakdown;

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-[#111111]/15 bg-white" aria-label="Return and refund tracking">
      {/* Summary */}
      <div className="bg-[#111111] px-5 py-4 text-white sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#FF6A66]">Return tracking</p>
        <p className="mt-1 font-serif text-xl leading-snug sm:text-2xl">{headline}</p>
        {outcome === 'in_progress' && current && STAGE_HELP[current.key] && (
          <p className="mt-1 text-sm text-white/70">{STAGE_HELP[current.key]}</p>
        )}
      </div>

      {showMoney && refund && (
        <div className="grid gap-4 border-b border-[#111111]/10 bg-[#F7F7F7] px-5 py-4 sm:grid-cols-3 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111111]/55">
              {refund.isEstimate ? 'Expected refund' : 'Refund amount'}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#111111]">{formatINR(refund.amount ?? 0)}</p>
            {refund.isEstimate && <p className="mt-0.5 text-xs text-[#111111]/55">Final amount is confirmed after the check.</p>}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111111]/55">Refund to</p>
            <p className="mt-1 break-words text-sm font-semibold text-[#111111]">{refund.method || 'To be confirmed'}</p>
            {refund.status && (
              <span className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[refund.status]}`}>
                {refund.status}
              </span>
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111111]/55">
              {refund.status === 'Refunded' ? 'Refunded on' : 'Estimated refund date'}
            </p>
            {refund.status === 'Refunded' ? (
              <p className="mt-1 text-sm font-semibold text-[#111111]">{stamp(refund.completedAt) || 'Completed'}</p>
            ) : estimate?.from && estimate?.to ? (
              <p className="mt-1 text-sm font-semibold text-[#111111]">
                {dayOnly(estimate.from)} – {dayOnly(estimate.to)}
              </p>
            ) : (
              <p className="mt-1 text-sm text-[#111111]/70">After your return is inspected</p>
            )}
            {refund.utr && (
              <p className="mt-2 break-all text-xs text-[#111111]/70">
                UTR <span className="font-semibold text-[#111111]">{refund.utr}</span>
              </p>
            )}
          </div>

          {parts && (parts.shipping > 0 || parts.codFee > 0) && (
            <p className="rounded-lg border border-[#E53935]/25 bg-white px-3 py-2 text-xs text-[#111111]/75 sm:col-span-3">
              <span className="font-semibold text-[#E53935]">Seller-fault return:</span> your refund also includes
              {parts.shipping > 0 ? ` shipping ${formatINR(parts.shipping)}` : ''}
              {parts.shipping > 0 && parts.codFee > 0 ? ' and' : ''}
              {parts.codFee > 0 ? ` the COD handling fee ${formatINR(parts.codFee)}` : ''}.
            </p>
          )}
        </div>
      )}

      {estimate && outcome === 'in_progress' && (
        <p className="border-b border-[#111111]/10 px-5 py-3 text-xs text-[#111111]/70 sm:px-6">
          <span className="font-semibold text-[#111111]">Refund timeline:</span> {estimate.text}. Dates are an estimate and
          count working days (Monday to Friday).
        </p>
      )}

      {/* Stages */}
      <ol className="px-5 py-5 sm:px-6" aria-label="Return progress">
        {stages.map((stage, index) => {
          const last = index === stages.length - 1;
          const nextDone = !last && (stage.state === 'done' || stage.state === 'skipped');
          return (
            <li key={stage.key} className="relative flex gap-4 pb-6 last:pb-0" aria-current={stage.state === 'current' ? 'step' : undefined}>
              {!last && (
                <span
                  aria-hidden
                  className={`absolute left-4 top-8 -ml-px h-[calc(100%-2rem)] w-0.5 ${
                    nextDone ? 'bg-[#111111]' : 'border-l-2 border-dashed border-[#111111]/20'
                  }`}
                />
              )}
              <Dot state={stage.state} />
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p
                    className={`text-sm font-semibold ${
                      stage.state === 'upcoming' || stage.state === 'skipped'
                        ? 'text-[#111111]/45'
                        : stage.state === 'failed' || stage.state === 'rejected'
                          ? 'text-[#E53935]'
                          : 'text-[#111111]'
                    }`}
                  >
                    {stage.label}
                    <span className="sr-only"> — {STATE_WORD[stage.state]}</span>
                  </p>
                  {stage.state === 'done' && stage.at && (
                    <time dateTime={stage.at} className="text-xs tabular-nums text-[#111111]/55">
                      {stamp(stage.at)}
                    </time>
                  )}
                  {stage.state === 'current' && (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E53935]">Current stage</span>
                  )}
                </div>
                {stage.note && (
                  <p className={`mt-1 text-sm ${stage.state === 'failed' || stage.state === 'rejected' ? 'text-[#111111]/80' : 'text-[#111111]/60'}`}>
                    {stage.note}
                  </p>
                )}
                {stage.state === 'current' && !stage.note && STAGE_HELP[stage.key] && (
                  <p className="mt-1 text-sm text-[#111111]/60">{STAGE_HELP[stage.key]}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
