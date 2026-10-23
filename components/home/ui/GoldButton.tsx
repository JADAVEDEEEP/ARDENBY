import type { ButtonHTMLAttributes, ReactNode } from 'react';

import Link from 'next/link';

import { cn } from '@/lib/utils';

interface BaseProps {
  children: ReactNode;
  className?: string;
  href?: string;
  /** Render as a non-interactive span (for use inside an existing link). */
  asText?: boolean;
}

type ButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps>;

const base =
  'chrome-focus gold-fill gold-sheen group inline-flex min-h-[44px] items-center justify-center gap-2.5 rounded-full px-7 text-[12px] font-bold uppercase tracking-[0.16em] shadow-[0_10px_28px_-10px_rgba(201,162,74,0.65)] transition duration-300 hover:brightness-110';

/** Primary gold CTA. Gold is reserved for CTAs and tiny accents. */
export function GoldButton({
  children,
  className,
  href,
  asText,
  ...rest
}: ButtonProps) {
  const classes = cn(base, className);

  if (asText) {
    return <span className={classes}>{children}</span>;
  }

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
