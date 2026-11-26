'use client';

import Link from 'next/link';

import { KovenikWordmark } from '@/components/layout/kovenik-wordmark';
import { Lock, RefreshCw, ShieldAlert } from 'lucide-react';

const FRAME =
  'flex min-h-screen items-center justify-center bg-[#FFFFFF] px-4 text-[#11162B]';

export function AdminChecking({ label = 'Checking admin access…' }: { label?: string }) {
  return (
    <main className={FRAME}>
      <div className="text-center">
        <div className="flex justify-center"><KovenikWordmark height={56} /></div>
        <p className="mt-6 text-[15px] text-[#5A6075]">{label}</p>
      </div>
    </main>
  );
}

/** HTTP 403 page: signed in, but this account is not allowed in the admin area. */
export function AccessDenied({ onSwitchAccount }: { onSwitchAccount: () => void }) {
  return (
    <main className={FRAME}>
      <div className="w-full max-w-md rounded-2xl border border-[#E3E5EE] bg-[#FFFFFF] p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-[#4338CA]" strokeWidth={1.5} />
        <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.3em] text-[#4338CA]">
          403 · Access denied
        </p>
        <h1 className="mt-3 font-serif text-2xl">This area is for store administrators</h1>
        <p className="mt-3 text-[15px] leading-6 text-[#5A6075]">
          The account you are signed in with does not have permission to open this page.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl border border-[#E3E5EE] px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#4338CA] transition hover:bg-[#FFFFFF]"
          >
            Back to store
          </Link>
          <button
            type="button"
            onClick={onSwitchAccount}
            className="rounded-xl bg-[#4338CA] px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
          >
            Use an admin account
          </button>
        </div>
      </div>
    </main>
  );
}

/** The server could not be reached: nobody is signed out, the check is just retried. */
export function AdminUnreachable({ onRetry }: { onRetry: () => void }) {
  return (
    <main className={FRAME}>
      <div className="w-full max-w-md rounded-2xl border border-[#E3E5EE] bg-[#FFFFFF] p-8 text-center">
        <Lock className="mx-auto h-9 w-9 text-[#4338CA]" strokeWidth={1.5} />
        <h1 className="mt-4 font-serif text-2xl">Can&apos;t verify your session</h1>
        <p className="mt-3 text-[15px] leading-6 text-[#5A6075]">
          We couldn&apos;t reach the server just now. You are still signed in. Please try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#4338CA] px-5 py-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </main>
  );
}
