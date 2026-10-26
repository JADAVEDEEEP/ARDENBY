import Link from 'next/link';

import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  id?: string;
  title: string;
  /** Optional right-hand link, e.g. VIEW ALL. */
  href?: string;
  linkLabel?: string;
  align?: 'center' | 'left';
  className?: string;
}

/** Oswald uppercase section title (36px desktop / 26px mobile) with an optional link. */
export function SectionHeader({ id, title, href, linkLabel = 'View all', align = 'center', className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-6 flex items-end gap-4 md:mb-8', align === 'center' && !href ? 'justify-center' : 'justify-between', className)}>
      <h2
        id={id}
        className={cn(
          'min-w-0 font-oswald font-semibold uppercase leading-tight text-kv-ink md:text-[36px] md:tracking-[0.06em]',
          href ? 'whitespace-nowrap text-[clamp(19px,5.6vw,26px)] tracking-[0.04em]' : 'text-[26px] tracking-[0.06em]',
          align === 'center' && !href && 'text-center'
        )}
      >
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="inline-flex min-h-[48px] shrink-0 items-center border-b-2 border-kv-ink text-[14px] font-bold uppercase tracking-[0.12em] text-kv-ink transition-colors hover:border-kv-gold-text hover:text-kv-gold-text"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
