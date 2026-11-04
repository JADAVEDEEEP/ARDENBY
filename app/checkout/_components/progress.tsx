'use client';

import { Check } from 'lucide-react';

// step: 1 = delivery in progress, 2 = payment in progress, 3 = confirmed.
const LABELS = ['Delivery', 'Payment', 'Confirmation'] as const;

/** Desktop: three numbered circles joined by lines. The active step is black with a red ring. */
export function StepProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol aria-label="Checkout progress" className="flex items-center gap-3">
      {LABELS.map((label, i) => {
        const n = i + 1;
        const done = n < step || step === 3;
        const active = n === step && step !== 3;
        return (
          <li key={label} aria-current={active ? 'step' : undefined} className="flex items-center gap-3">
            {i > 0 && (
              <span
                aria-hidden
                className={`h-[2px] w-10 xl:w-14 ${done || active ? 'bg-[#111111]' : 'bg-[#E5E5E5]'}`}
              />
            )}
            <span className="flex items-center gap-2.5">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-bold ${
                  active
                    ? 'bg-[#111111] text-white ring-[3px] ring-[#EF3535]/40 ring-offset-2'
                    : done
                      ? 'bg-[#111111] text-white'
                      : 'border-2 border-[#BDBDBD] bg-white text-[#666666]'
                }`}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : n}
              </span>
              <span className={`text-[16px] ${active || done ? 'font-bold text-[#111111]' : 'text-[#666666]'}`}>
                {label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Mobile: "Step 1 of 3 · Delivery / Next: Payment" + a 3-segment bar. */
export function SegmentedProgress({ step }: { step: 1 | 2 | 3 }) {
  const current = LABELS[step - 1];
  const next: string | null = (LABELS as readonly string[])[step] ?? null;
  return (
    <div aria-label="Checkout progress" role="group">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-[16px] font-bold text-[#111111]">
          Step {step} of 3 · {current}
        </p>
        {next && <p className="text-[15px] text-[#666666]">Next: {next}</p>}
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className="ck-track flex-1">
            <span className="ck-fill" style={{ width: n <= step ? '100%' : '0%' }} />
          </span>
        ))}
      </div>
    </div>
  );
}
