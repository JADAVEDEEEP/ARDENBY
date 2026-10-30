'use client';

import type { ComponentType, ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Inbox, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * KOVENIK admin design system (presentation only).
 *
 * Page #F5F6F8 · surface #FFFFFF · text #111111 / #626875 · border #E4E7EC
 * accent #E53935 · success #16845B · warning #C47A16 · error #D92D20
 */

export const fieldClass =
  'h-11 w-full rounded-lg border border-[#E4E7EC] bg-white px-3.5 text-[15px] text-[#111111] outline-none transition placeholder:text-[#98A0AE] focus:border-[#E53935] focus:ring-2 focus:ring-[#E53935]/15 disabled:cursor-not-allowed disabled:bg-[#F5F6F8] disabled:text-[#626875]';

export const labelClass = 'mb-1.5 block text-[13px] font-semibold text-[#111111]';

const btnBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-[14px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#E53935]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export const btnPrimary = cn(btnBase, 'bg-[#E53935] text-white hover:bg-[#C62E2B]');
export const btnDark = cn(btnBase, 'bg-[#111111] text-white hover:bg-[#2A2A2A]');
export const btnOutline = cn(
  btnBase,
  'border border-[#D0D5DD] bg-white text-[#111111] hover:border-[#111111]'
);
export const btnDanger = cn(
  btnBase,
  'border border-[#D92D20]/40 bg-white text-[#D92D20] hover:bg-[#D92D20] hover:text-white'
);

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="text-[30px] font-bold leading-tight tracking-tight text-[#111111] md:text-[38px]">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-[15px] text-[#626875]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn('rounded-xl border border-[#E4E7EC] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]', className)}
    >
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E4E7EC] px-5 py-4 md:px-6">
          <div className="min-w-0">
            {title && <h2 className="text-[18px] font-bold text-[#111111]">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-[#626875]">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn('p-5 md:p-6', bodyClassName)}>{children}</div>
    </section>
  );
}

export function Notice({
  tone,
  children,
  className,
}: {
  tone: 'success' | 'error' | 'warning' | 'info';
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    success: 'border-[#16845B]/30 bg-[#16845B]/8 text-[#0F6446]',
    error: 'border-[#D92D20]/30 bg-[#D92D20]/8 text-[#B42318]',
    warning: 'border-[#C47A16]/30 bg-[#C47A16]/10 text-[#8A540C]',
    info: 'border-[#E4E7EC] bg-[#F5F6F8] text-[#626875]',
  }[tone];
  const Icon = tone === 'success' ? CheckCircle2 : AlertTriangle;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2.5 rounded-lg border px-4 py-3 text-[14px] font-medium', styles, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  children,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F6F8] text-[#626875]">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-3 text-[16px] font-semibold text-[#111111]">{title}</p>
      {children && <p className="mt-1 max-w-sm text-[14px] text-[#626875]">{children}</p>}
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-[14px] text-[#626875]" role="status">
      <Loader2 className="h-4 w-4 animate-spin text-[#E53935]" />
      {label}…
    </div>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: 'success' | 'warning' | 'error' | 'neutral' | 'accent';
  children: ReactNode;
}) {
  const styles = {
    success: 'bg-[#16845B]/10 text-[#0F6446]',
    warning: 'bg-[#C47A16]/12 text-[#8A540C]',
    error: 'bg-[#D92D20]/10 text-[#B42318]',
    accent: 'bg-[#E53935]/10 text-[#C62E2B]',
    neutral: 'bg-[#F2F4F7] text-[#475467]',
  }[tone];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold', styles)}>
      {children}
    </span>
  );
}
