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

/** Pill filter chips, left-aligned in one row. Scroll sideways when they do not fit (no visible scrollbar). */
export function FilterChips({ options, active, onChange, label }: FilterChipsProps) {
  return (
    <div role="group" aria-label={label} className="kv-rail flex gap-3 overflow-x-auto px-3 py-3 md:px-[clamp(16px,3vw,48px)]">
      {options.map((option) => {
        const isActive = option.id === active;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={isActive}
            className={cn(
              'inline-flex min-h-[40px] shrink-0 items-center rounded-full border px-5 text-[14px] font-semibold transition-colors',
              isActive
                ? 'border-kv-ink bg-kv-ink text-white'
                : 'border-kv-line bg-kv-bg text-kv-ink hover:border-kv-ink'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
