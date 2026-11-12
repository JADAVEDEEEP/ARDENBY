'use client';

import React from 'react';

/* ---------------------------------------------------------------
   KOVENIK account design helpers (presentation only).
   Styles live in app/globals.css under the kv-* classes.
---------------------------------------------------------------- */

export const SERIF_STYLE = {
  fontFamily: 'var(--font-oswald), Impact, sans-serif',
} as const;

export function MetalCard({
  className = '',
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`kv-metal ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function IconDisc({
  icon: Icon,
  size = 40,
  className = '',
}: {
  icon: React.ElementType;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`kv-disc ${className}`} style={{ width: size, height: size }} aria-hidden>
      <Icon style={{ width: size * 0.45, height: size * 0.45 }} strokeWidth={1.7} />
    </span>
  );
}

export function memberSince(createdAt?: string | null) {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Member number derived from the real account (year joined + last 4 chars of the account id). */
export function memberCode(userId?: string, createdAt?: string | null) {
  const d = memberSince(createdAt);
  const tail = userId ? userId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() : '';
  const parts = ['KVN', d ? String(d.getFullYear()) : '', tail].filter(Boolean);
  return parts.join(' · ');
}

export function MembershipCard({
  name,
  userId,
  createdAt,
  compact = false,
  isMember = true,
}: {
  name: string;
  userId?: string;
  createdAt?: string | null;
  compact?: boolean;
  /** Inner Circle branding shows only for an active membership. */
  isMember?: boolean;
}) {
  const since = memberSince(createdAt);
  const sinceText = since
    ? `${String(since.getMonth() + 1).padStart(2, '0')} / ${String(since.getFullYear()).slice(-2)}`
    : null;
  const size = compact ? 'w-full max-w-[320px] p-4' : 'w-[360px] p-6';

  return (
    <div className="relative" aria-label={isMember ? 'KOVENIK Inner Circle membership card' : 'KOVENIK account card'}>
      <div className={`kv-card-face ${size} flex min-h-[170px] flex-col justify-between gap-5`}>
        <div className="flex items-start justify-between">
          <span className="text-[20px] font-bold tracking-[0.04em] text-white" style={SERIF_STYLE}>
            KOVENIK
          </span>
          {isMember && <span className="text-[13px] font-bold tracking-[0.1em] text-[#EF3535]">INNER CIRCLE</span>}
        </div>
        <div className="kv-chip h-8 w-11" />
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[20px] font-bold uppercase text-white" style={SERIF_STYLE}>
              {name}
            </p>
            <p className="mt-1 text-[13px] tracking-[0.08em] text-[#D1D1D1]">{memberCode(userId, createdAt)}</p>
          </div>
          {sinceText && (
            <div className="shrink-0 text-right">
              <p className="text-[12px] tracking-[0.08em] text-[#D1D1D1]">{isMember ? 'MEMBER SINCE' : 'CUSTOMER SINCE'}</p>
              <p className="text-[16px] font-semibold text-white">{sinceText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SectionTitle({
  title,
  sub,
  action,
}: {
  /** Kept for call-site compatibility; eyebrow labels were dropped for readability. */
  label?: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h2 className="kv-display text-[30px] sm:text-[40px]">{title}</h2>
        {sub && <p className="mt-2 text-[16px] text-[#666666]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyPanel({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="kv-metal flex flex-col items-center px-6 py-14 text-center">
      <IconDisc icon={icon} size={56} />
      <h3 className="kv-display mt-5 text-[24px]">{title}</h3>
      <p className="mt-2 max-w-xs text-[16px] leading-6 text-[#666666]">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
