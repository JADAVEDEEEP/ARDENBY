'use client';

import Link from 'next/link';
import { Lock, RefreshCw, ShieldAlert } from 'lucide-react';

const FRAME =
  'flex min-h-screen items-center justify-center bg-[#111111] px-4 text-[#F7F7F7]';

export function AdminChecking({ label = 'Checking admin access…' }: { label?: string }) {
  return (
    <main className={FRAME}>
      <div className="text-center">
        <p className="font-serif text-[24px] uppercase tracking-[0.2em]">Kovenik</p>
        <p className="mt-6 text-sm text-[#979797]">{label}</p>
      </div>
    </main>
  );
}

/** HTTP 403 page: signed in, but this account is not allowed in the admin area. */
export function AccessDenied({ onSwitchAccount }: { onSwitchAccount: () => void }) {
  return (
    <main className={FRAME}>
      <div className="w-full max-w-md rounded-2xl border border-[#E53935]/30 bg-[#111111] p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-[#E53935]" strokeWidth={1.5} />
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#E53935]">
          403 · Access denied
        </p>
        <h1 className="mt-3 font-serif text-2xl">This area is for store administrators</h1>
        <p className="mt-3 text-sm leading-6 text-[#979797]">
          The account you are signed in with does not have permission to open this page.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl border border-[#E53935]/40 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#E53935] transition hover:bg-[#272727]"
          >
            Back to store
          </Link>
          <button
            type="button"
            onClick={onSwitchAccount}
            className="rounded-xl bg-[#E53935] px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
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
      <div className="w-full max-w-md rounded-2xl border border-[#E53935]/30 bg-[#111111] p-8 text-center">
        <Lock className="mx-auto h-9 w-9 text-[#E53935]" strokeWidth={1.5} />
        <h1 className="mt-4 font-serif text-2xl">Can&apos;t verify your session</h1>
        <p className="mt-3 text-sm leading-6 text-[#979797]">
          We couldn&apos;t reach the server just now. You are still signed in. Please try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#E53935] px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </main>
  );
}
