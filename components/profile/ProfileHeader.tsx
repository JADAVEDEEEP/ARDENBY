'use client';

import { AlertCircle, ShieldCheck, X } from 'lucide-react';
import type { UserProfile } from './types';

export function ProfileHeader({ user, displayName }: { user: UserProfile; displayName: string }) {
  return (
    <header className="mb-7 border-b border-[#222222] pb-6 sm:mb-9 sm:pb-8">
      <p className="text-[9px] font-medium uppercase tracking-[0.34em] text-[#8C6D3A]">
        KOVENIK / PRIVATE ACCOUNT
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-[36px] leading-none tracking-[-0.03em] sm:text-[48px] lg:text-[56px]">
            My Account
          </h1>
          <p className="mt-3 max-w-xl text-[13px] leading-6 text-[#5C5C5C]">
           account settings.
          </p>
        </div>
        <div className="hidden border-l border-[#222222] pl-5 text-right sm:block">
          <p className="text-[9px] uppercase tracking-[0.22em] text-[#8C6D3A]">Customer</p>
          <p className="mt-1 text-sm font-medium">{displayName}</p>
          <p className="mt-0.5 text-[11px] text-[#5C5C5C]">{user.email}</p>
        </div>
      </div>
    </header>
  );
}

export function ProfileFeedback({
  error,
  message,
  onClear,
}: {
  error: string;
  message: string;
  onClear: () => void;
}) {
  if (!error && !message) return null;

  return (
    <div role={error ? 'alert' : 'status'}
      className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-[13px] ${
      error
        ? 'border-[#B3261E] bg-[#F4F0E8] text-[#B3261E]'
        : 'border-[#1B7A43] bg-[#EAE5DA] text-[#1B7A43]'
    }`}>
      {error ? <AlertCircle className="h-4 w-4 shrink-0" /> : <ShieldCheck className="h-4 w-4 shrink-0" />}
      <span>{error || message}</span>
      <button type="button" className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center" onClick={onClear} aria-label="Dismiss message">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
