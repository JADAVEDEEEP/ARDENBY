import Link from 'next/link';

import { ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  /** When set, a "View all" link is shown on the right. */
  href?: string;
  align?: 'left' | 'center';
  className?: string;
}

/** Gold eyebrow + chrome Bodoni heading (+ optional View all). */
export function SectionHeading({
  eyebrow,
  title,
  href,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex items-end justify-between gap-4',
        align === 'center' && 'justify-center text-center',
        className
      )}
    >
      <div>
        {eyebrow && (
          <p
            className={cn(
              'mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-kv-gold',
              align === 'center' && 'justify-center'
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2 className="chrome-text font-bodoni text-[clamp(28px,4.2vw,56px)] font-medium uppercase leading-[1.02] tracking-[0.01em]">
          {title}
        </h2>
      </div>

      {href && (
        <Link
          href={href}
          className="chrome-focus group flex min-h-[44px] shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-kv-head transition-colors hover:text-white"
        >
          View all
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
