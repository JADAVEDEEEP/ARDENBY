import { cn } from '@/lib/utils';

export interface ChipOption {
  id: string;
  label: string;
}

interface FilterChipsProps {
  options: readonly ChipOption[];
  active: string;
  onChange: (id: string) => void;
  label: string;
}

/** Pill filter chips. Scroll sideways on mobile (no visible scrollbar). */
export function FilterChips({ options, active, onChange, label }: FilterChipsProps) {
  return (
    <div role="group" aria-label={label} className="kv-rail -mx-[clamp(16px,3vw,48px)] mb-6 flex gap-2 overflow-x-auto px-[clamp(16px,3vw,48px)] md:mx-0 md:flex-wrap md:px-0">
      {options.map((option) => {
        const isActive = option.id === active;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={isActive}
            className={cn(
              'inline-flex min-h-[48px] shrink-0 items-center rounded-full border px-5 text-[14px] font-bold uppercase tracking-[0.08em] transition-colors',
              isActive
                ? 'border-kv-ink bg-kv-ink text-white'
                : 'border-kv-line bg-kv-bg text-kv-ink hover:border-kv-gold-text hover:text-kv-gold-text'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
