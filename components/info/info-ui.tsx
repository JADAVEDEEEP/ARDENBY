import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/* Shared building blocks for the policy / information pages (server components).
   Palette: black #111, white, light grey #F5F5F5, dark grey #555, deep red #C62828
   (red text on white passes WCAG AA at #C62828; the storefront's #E53935 does not). */

export const SITE_RED = '#C62828';

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10', className)}>{children}</div>;
}

export function Eyebrow({ children, tone = 'light' }: { children: ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <p
      className={cn(
        'flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.22em]',
        tone === 'dark' ? 'text-[#FF8A80]' : 'text-[#C62828]'
      )}
    >
      <span aria-hidden="true" className={cn('h-[2px] w-8', tone === 'dark' ? 'bg-[#FF8A80]' : 'bg-[#C62828]')} />
      {children}
    </p>
  );
}

/** The big page title. One <h1> per page. */
export function PageTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1
      className={cn(
        'font-oswald text-[clamp(44px,11.5vw,128px)] font-bold uppercase leading-[0.92] tracking-[-0.01em]',
        className
      )}
    >
      {children}
    </h1>
  );
}

const BUTTON =
  'inline-flex min-h-[52px] items-center justify-center gap-2 px-8 text-[14px] font-bold uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

const BUTTON_STYLES = {
  solid: 'bg-[#C62828] text-white hover:bg-[#A91F1F] focus-visible:outline-[#C62828]',
  dark: 'bg-[#111111] text-white hover:bg-[#C62828] focus-visible:outline-[#111111]',
  outline:
    'border-2 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white focus-visible:outline-[#111111]',
  light: 'bg-white text-[#111111] hover:bg-[#FFEBEE] focus-visible:outline-white',
} as const;

export function CtaLink({
  href,
  children,
  variant = 'solid',
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof BUTTON_STYLES;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(BUTTON, BUTTON_STYLES[variant], className)}>
      {children}
    </Link>
  );
}

/** Reading styles for long-form text: comfortable measure, 17px/1.8, red dash bullets. */
export const PROSE = cn(
  'max-w-[68ch] text-[17px] leading-[1.8] text-[#3A3A3A] md:text-[18px]',
  '[&_p+p]:mt-5 [&_p+ul]:mt-5 [&_p+ol]:mt-5 [&_ul+p]:mt-5 [&_ol+p]:mt-5',
  '[&_strong]:font-semibold [&_strong]:text-[#111111]',
  '[&_a]:font-semibold [&_a]:text-[#C62828] [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-[#A91F1F]',
  '[&_h3]:mb-3 [&_h3]:mt-9 [&_h3]:font-oswald [&_h3]:text-[22px] [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-[0.04em] [&_h3]:text-[#111111] [&_h3]:first:mt-0',
  '[&_ul]:space-y-3 [&_ul>li]:relative [&_ul>li]:pl-7',
  "[&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[0.8em] [&_ul>li]:before:h-[2px] [&_ul>li]:before:w-4 [&_ul>li]:before:bg-[#C62828] [&_ul>li]:before:content-['']",
  '[&_ol]:list-decimal [&_ol]:space-y-3 [&_ol]:pl-6 [&_ol>li]:pl-1 [&_ol>li]:marker:font-bold [&_ol>li]:marker:text-[#C62828]'
);

/** Highlighted important information. */
export function Callout({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside className={cn('my-7 max-w-[68ch] border-l-[4px] border-[#C62828] bg-[#F5F5F5] px-5 py-5 md:px-7', className)}>
      {title && (
        <p className="mb-2 font-oswald text-[18px] font-semibold uppercase tracking-[0.1em] text-[#111111]">{title}</p>
      )}
      <div className="text-[16px] leading-[1.75] text-[#333333] md:text-[17px] [&_a]:font-semibold [&_a]:text-[#C62828] [&_a]:underline [&_a]:underline-offset-4 [&_strong]:text-[#111111]">
        {children}
      </div>
    </aside>
  );
}

export interface LegalSectionDef {
  id: string;
  title: string;
  content: ReactNode;
}

/** Numbered legal document: contents list (sticky on desktop, collapsible on mobile) + sections. */
export function LegalDocument({ sections }: { sections: LegalSectionDef[] }) {
  return (
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="lg:self-start lg:sticky lg:top-[150px]">
        {/* Mobile: collapsed, in normal flow (never sticky, so it cannot cover the header). */}
        <details className="group mb-8 border border-[#E5E5E5] bg-[#F5F5F5] lg:hidden">
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-4 text-[15px] font-bold uppercase tracking-[0.14em] text-[#111111] [&::-webkit-details-marker]:hidden">
            Contents
            <span aria-hidden="true" className="text-xl transition-transform group-open:rotate-45">+</span>
          </summary>
          <ol className="border-t border-[#E5E5E5] py-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex min-h-[44px] items-center gap-3 px-4 text-[15px] text-[#333333] hover:text-[#C62828]">
                  <span className="w-6 font-oswald text-[#C62828]">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </details>

        <nav aria-label="Contents" className="hidden lg:block">
          <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.22em] text-[#555555]">On this page</p>
          <ol className="max-h-[calc(100vh-220px)] space-y-1 overflow-y-auto border-l-2 border-[#E5E5E5] pr-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="-ml-[2px] flex min-h-[40px] items-center gap-3 border-l-2 border-transparent py-1.5 pl-4 text-[15px] leading-snug text-[#333333] transition-colors hover:border-[#C62828] hover:text-[#C62828] focus-visible:border-[#C62828] focus-visible:outline-none focus-visible:text-[#C62828]"
                >
                  <span className="w-6 shrink-0 font-oswald text-[14px] text-[#C62828]">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      <div className="min-w-0">
        {sections.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            aria-labelledby={`${s.id}-title`}
            className="scroll-mt-[150px] border-t-2 border-[#111111] py-10 first:border-t-0 first:pt-0 md:py-14 md:first:pt-0"
          >
            <p aria-hidden="true" className="font-oswald text-[15px] font-semibold tracking-[0.2em] text-[#C62828]">
              {String(i + 1).padStart(2, '0')}
            </p>
            <h2
              id={`${s.id}-title`}
              className="mb-6 mt-1 font-oswald text-[clamp(30px,6.5vw,52px)] font-bold uppercase leading-[1] tracking-[0.01em] text-[#111111]"
            >
              {s.title}
            </h2>
            <div className={PROSE}>{s.content}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

