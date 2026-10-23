import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface ChromeRingProps {
  children: ReactNode;
  /** Ring thickness in px. */
  thickness?: number;
  /** Soft gold halo for the active item. */
  active?: boolean;
  className?: string;
  innerClassName?: string;
}

/** Circular conic-gradient chrome ring with a glare highlight over the content. */
export function ChromeRing({
  children,
  thickness = 3,
  active = false,
  className,
  innerClassName,
}: ChromeRingProps) {
  return (
    <span
      className={cn(
        'relative block rounded-full transition-shadow duration-300',
        active && 'shadow-[0_0_28px_2px_rgba(201,162,74,0.35)]',
        className
      )}
      style={{ background: 'var(--kv-chrome-ring)', padding: thickness }}
    >
      <span
        className={cn(
          'relative block h-full w-full overflow-hidden rounded-full bg-kv-surface2',
          innerClassName
        )}
      >
        {children}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(60%_40%_at_30%_14%,rgba(255,255,255,0.38),transparent_70%)]"
        />
      </span>
    </span>
  );
}
