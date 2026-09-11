'use client';

import React from 'react';

export function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl">{title}</h2>
          {subtitle && <p className="text-xs text-[#756E65] mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  onAction,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="py-14 text-center border border-dashed border-[#D8D0C4] rounded-xl">
      <Icon className="w-8 h-8 mx-auto text-[#A08C75]" />
      <h3 className="font-serif text-xl mt-4">{title}</h3>
      <p className="text-xs text-[#756E65] mt-2">{text}</p>
      {action && onAction && (
        <button onClick={onAction} className="mt-5 bg-[#1A1A1A] text-white px-5 py-2.5 rounded-lg text-xs">
          {action}
        </button>
      )}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-[#A08C75]">{label}</p>
      <p className="text-xs font-semibold mt-1 break-words">{value}</p>
    </div>
  );
}

export function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[#A08C75]">{label}</p>
      <p className="text-sm mt-1">{value}</p>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs">
      <span className="block mb-1.5 text-[#5C554E]">{label}</span>
      {children}
    </label>
  );
}
