'use client';

import { AlertCircle, ShieldCheck, X } from 'lucide-react';
import type { UserProfile } from './types';

export function ProfileHeader({ user, displayName }: { user: UserProfile; displayName: string }) {
  return (
    <header className="mb-7 border-b border-[#DCD5C9] pb-6 sm:mb-9 sm:pb-8">
      <p className="text-[9px] font-medium uppercase tracking-[0.34em] text-[#9A8060]">
        ARDENBY / PRIVATE ACCOUNT
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-[36px] leading-none tracking-[-0.03em] sm:text-[48px] lg:text-[56px]">
            My Account
          </h1>
          <p className="mt-3 max-w-xl text-[13px] leading-6 text-[#756F66]">
           account settings.
          </p>
        </div>
        <div className="hidden border-l border-[#DCD5C9] pl-5 text-right sm:block">
          <p className="text-[9px] uppercase tracking-[0.22em] text-[#9A8060]">Customer</p>
          <p className="mt-1 text-sm font-medium">{displayName}</p>
          <p className="mt-0.5 text-[11px] text-[#81796F]">{user.email}</p>
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
    <div className={`mb-6 flex items-center gap-3 border px-4 py-3 text-sm ${
      error
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-[#D7C7A7] bg-[#F3EEE4] text-[#554A3D]'
    }`}>
      {error ? <AlertCircle className="h-4 w-4 shrink-0" /> : <ShieldCheck className="h-4 w-4 shrink-0" />}
      <span>{error || message}</span>
      <button className="ml-auto shrink-0" onClick={onClear} aria-label="Dismiss message">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
