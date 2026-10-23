'use client';

import React from 'react';

/* ---------------------------------------------------------------
   KOVENIK "black metal" account design system (presentation only)
---------------------------------------------------------------- */

export const SERIF_STYLE = {
  fontFamily: 'Bodoni MT, Didot, "Playfair Display", "Times New Roman", serif',
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
      <Icon style={{ width: size * 0.42, height: size * 0.42 }} strokeWidth={1.7} />
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
}: {
  name: string;
  userId?: string;
  createdAt?: string | null;
  compact?: boolean;
}) {
  const since = memberSince(createdAt);
  const sinceText = since
    ? `${String(since.getMonth() + 1).padStart(2, '0')} / ${String(since.getFullYear()).slice(-2)}`
    : null;
  const w = compact ? 'w-[230px] h-[144px] p-4' : 'w-[340px] h-[212px] p-6';

  return (
    <div className="kv-scene relative" aria-label="KOVENIK Inner Circle membership card">
      {/* soft floor shadow */}
      <div
        className="absolute -bottom-6 left-6 right-0 h-8 rounded-[50%] bg-black/70 blur-xl"
        aria-hidden
      />
      <div className="kv-card3d relative">
        {/* layered second card */}
        <div
          className={`kv-card-face absolute ${compact ? 'left-5 top-3' : 'left-10 top-6'} ${w} opacity-70`}
          aria-hidden
        />
        <div className={`kv-card-face ${w} flex flex-col justify-between`}>
          <div className="flex items-start justify-between">
            <span className={`font-bold tracking-[0.06em] text-white ${compact ? 'text-[13px]' : 'text-[18px]'}`}>
              KOVENIK
            </span>
            <span className={`font-semibold tracking-[0.2em] text-[#D6B06A] ${compact ? 'text-[7px]' : 'text-[9px]'}`}>
              INNER CIRCLE
            </span>
          </div>
          <div className={`kv-chip ${compact ? 'h-6 w-8' : 'h-8 w-11'}`} />
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p
                className={`truncate uppercase text-[#E8EAEE] ${compact ? 'text-[16px]' : 'text-[22px]'}`}
                style={SERIF_STYLE}
              >
                {name}
              </p>
              <p className={`mt-1 tracking-[0.18em] text-[#9296A0] ${compact ? 'text-[7px]' : 'text-[9px]'}`}>
                {memberCode(userId, createdAt)}
              </p>
            </div>
            {sinceText && (
              <div className="shrink-0 text-right">
                <p className={`tracking-[0.18em] text-[#9296A0] ${compact ? 'text-[6px]' : 'text-[8px]'}`}>MEMBER SINCE</p>
                <p className={`font-semibold text-white ${compact ? 'text-[10px]' : 'text-[13px]'}`}>{sinceText}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SectionTitle({
  label,
  title,
  sub,
  action,
}: {
  label?: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {label && <p className="kv-label">{label}</p>}
        <h2 className="mt-2 text-[28px] font-normal leading-tight text-white sm:text-[32px]" style={SERIF_STYLE}>
          {title}
        </h2>
        {sub && <p className="mt-1.5 text-[13px] text-[#9296A0]">{sub}</p>}
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
    <div className="kv-inner flex flex-col items-center px-6 py-14 text-center">
      <IconDisc icon={icon} size={56} />
      <h3 className="mt-5 text-[22px] text-white" style={SERIF_STYLE}>
        {title}
      </h3>
      <p className="mt-2 max-w-xs text-[13px] leading-6 text-[#9296A0]">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
