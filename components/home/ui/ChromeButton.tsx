import type { ButtonHTMLAttributes, ReactNode } from 'react';

import Link from 'next/link';

import { cn } from '@/lib/utils';

interface BaseProps {
  children: ReactNode;
  className?: string;
  href?: string;
}

type ButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps>;

const base =
  'chrome-focus group inline-flex min-h-[44px] items-center justify-center gap-2.5 rounded-full px-7 text-[12px] font-semibold uppercase tracking-[0.16em] transition duration-300';

/** Silver-outline pill button. Renders a link when `href` is set. */
export function ChromeButton({ children, className, href, ...rest }: ButtonProps) {
  const classes = cn(
    base,
    'border border-white/35 bg-white/[0.03] text-kv-head hover:border-white/70 hover:bg-white/10',
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
