import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

type GlassPanelProps = HTMLAttributes<HTMLDivElement>;

/** Frosted glass surface (see `.chrome-glass` in globals.css). */
export function GlassPanel({ className, ...props }: GlassPanelProps) {
  return <div className={cn('chrome-glass rounded-2xl', className)} {...props} />;
}
