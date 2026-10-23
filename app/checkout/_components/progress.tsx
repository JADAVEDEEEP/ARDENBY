'use client';

import { Check } from 'lucide-react';

// step: 1 = delivery in progress, 2 = payment in progress, 3 = confirmed.
const LABELS = [
  { label: 'Delivery', done: 'Completed', active: 'In progress', todo: 'Next' },
  { label: 'Payment', done: 'Completed', active: 'In progress', todo: 'Next' },
  { label: 'Confirmed', done: 'Done', active: 'Done', todo: 'Next' },
];

/** Desktop: three nodes joined by an progress track. */
export function StepProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol
      aria-label="Checkout progress"
      className="ck-panel flex w-full max-w-[400px] items-start px-6 py-4"
    >
      {LABELS.map((s, i) => {
        const n = i + 1;
        const done = n < step || step === 3;
        const active = n === step && step !== 3;
        const state = done ? s.done : active ? s.active : s.todo;

        return (
          <li
            key={s.label}
            aria-current={active ? 'step' : undefined}
            className="relative flex flex-1 flex-col items-center"
          >
            {i > 0 && (
              <span
                aria-hidden
                className="absolute right-1/2 top-[15px] h-[3px] w-full overflow-hidden rounded-full bg-white/10"
              >
                <span
                  className="ck-fill"
                  style={{ width: n <= step ? '100%' : '0%' }}
                />
              </span>
            )}
            <span
              className={`relative z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full text-sm font-medium transition-all duration-500 ${
                done
                  ? 'bg-[#C0C0C0] text-[#0A0A0A]'
                  : active
                    ? 'ck-node-active bg-white text-[#0A0A0A]'
                    : 'border border-[#3A3A3A] bg-[#0A0A0A] text-[#C0C0C0]/70'
              }`}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : n}
            </span>
            <span className={`mt-1.5 text-xs font-semibold ${done || active ? 'text-[#ffffff]' : 'text-[#C0C0C0]/70'}`}>
              {s.label}
            </span>
            <span className="text-[10px] text-[#C0C0C0]/70">{state}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Mobile: segmented bar + labels. */
export function SegmentedProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div aria-label="Checkout progress" role="group">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((n) => {
          const filled = n < step || step === 3 ? 100 : n === step ? 55 : 0;
          return (
            <span key={n} className="ck-track flex-1">
              <span className="ck-fill" style={{ width: `${filled}%` }} />
            </span>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs font-semibold">
        {LABELS.map((s, i) => {
          const n = i + 1;
          const done = n < step || step === 3;
          const active = n === step && step !== 3;
          return (
            <span
              key={s.label}
              aria-current={active ? 'step' : undefined}
              className={`flex flex-1 items-center gap-1 ${i === 1 ? 'justify-center' : i === 2 ? 'justify-end' : ''} ${
                done ? 'text-[#C0C0C0]' : active ? 'text-[#ffffff]' : 'text-[#C0C0C0]/70'
              }`}
            >
              {done && <Check className="h-3 w-3" strokeWidth={3} />}
              {s.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
