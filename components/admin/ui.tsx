'use client';

import type { ComponentType, ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Inbox, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * KOVENIK admin design system (presentation only).
 *
 * Page #F5F6FA · surface #FFFFFF · text #11162B / #5A6075 · border #F5F6FA
 * accent #4338CA · success #17603F · warning #7A4F00 · error #9A2C1F
 */

export const fieldClass =
  'h-11 w-full rounded-lg border border-[#E3E5EE] bg-white px-3.5 text-[15px] text-[#11162B] outline-none transition placeholder:text-[#5A6075] focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 disabled:cursor-not-allowed disabled:bg-[#F5F6FA] disabled:text-[#5A6075]';

export const labelClass = 'mb-1.5 block text-[14px] font-semibold text-[#11162B]';

const btnBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-[15px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#4338CA]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export const btnPrimary = cn(btnBase, 'bg-[#4338CA] text-white hover:bg-[#4338CA]');
export const btnDark = cn(btnBase, 'bg-[#11162B] text-white hover:bg-[#11162B]');
export const btnOutline = cn(
  btnBase,
  'border border-[#E3E5EE] bg-white text-[#11162B] hover:border-[#E3E5EE]'
);
export const btnDanger = cn(
  btnBase,
  'border border-[#9A2C1F]/40 bg-white text-[#9A2C1F] hover:bg-[#FBE3DF]'
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
        <h1 className="text-[30px] font-bold leading-tight tracking-tight text-[#11162B] md:text-[38px]">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-[15px] text-[#5A6075]">{subtitle}</p>}
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
      className={cn('rounded-xl border border-[#E3E5EE] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]', className)}
    >
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E3E5EE] px-5 py-4 md:px-6">
          <div className="min-w-0">
            {title && <h2 className="text-[18px] font-bold text-[#11162B]">{title}</h2>}
            {description && <p className="mt-0.5 text-[14px] text-[#5A6075]">{description}</p>}
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
    success: 'border-[#17603F]/30 bg-[#17603F]/8 text-[#17603F]',
    error: 'border-[#9A2C1F]/30 bg-[#FBE3DF]/8 text-[#9A2C1F]',
    warning: 'border-[#7A4F00]/30 bg-[#7A4F00]/10 text-[#7A4F00]',
    info: 'border-[#E3E5EE] bg-[#F5F6FA] text-[#5A6075]',
  }[tone];
  const Icon = tone === 'success' ? CheckCircle2 : AlertTriangle;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2.5 rounded-lg border px-4 py-3 text-[15px] font-medium', styles, className)}
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
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F6FA] text-[#5A6075]">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-3 text-[16px] font-semibold text-[#11162B]">{title}</p>
      {children && <p className="mt-1 max-w-sm text-[15px] text-[#5A6075]">{children}</p>}
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-[15px] text-[#5A6075]" role="status">
      <Loader2 className="h-4 w-4 animate-spin text-[#4338CA]" />
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
    success: 'bg-[#17603F]/10 text-[#17603F]',
    warning: 'bg-[#7A4F00]/12 text-[#7A4F00]',
    error: 'bg-[#FBE3DF]/10 text-[#9A2C1F]',
    accent: 'bg-[#4338CA]/10 text-[#4338CA]',
    neutral: 'bg-[#F5F6FA] text-[#5A6075]',
  }[tone];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-semibold', styles)}>
      {children}
    </span>
  );
}
