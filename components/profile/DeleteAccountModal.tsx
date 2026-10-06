'use client';

import type { useProfile } from '../../hooks/use-profile';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  X,
  ShieldAlert,
} from 'lucide-react';

type ProfileState = ReturnType<typeof useProfile>;

export function DeleteAccountModal({
  profile,
}: {
  profile: ProfileState;
}) {
  return (
    <>
      {profile.showDeleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">

          {/* Ambient gold glow */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C5A45D]/[0.07] blur-[100px]" />

          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#B99A5B]/35 bg-[#090909] shadow-[0_30px_100px_rgba(0,0,0,0.7)]">

            {/* Top metallic line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D8BD7A] to-transparent" />

            {/* Subtle background details */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.05]">
              <div className="absolute left-0 top-1/4 h-px w-full bg-[#D8BD7A]" />
              <div className="absolute left-0 top-3/4 h-px w-full bg-[#D8BD7A]" />
            </div>

            <div className="relative p-6 sm:p-8">

              {/* Close */}
              <button
                type="button"
                onClick={() => {
                  if (!profile.deleteLoading) {
                    profile.setShowDeleteModal(false);
                    profile.setDeletePassword('');
                    profile.setError('');
                  }
                }}
                disabled={profile.deleteLoading}
                aria-label="Close"
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#8F887D] transition hover:border-[#B99A5B]/40 hover:text-[#D8BD7A] disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              <div className="pr-10">

                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#B99A5B]/40 bg-[#111111] shadow-[0_0_25px_rgba(197,164,93,0.10)]">
                  <ShieldAlert
                    className="h-5 w-5 text-[#D8BD7A]"
                    strokeWidth={1.3}
                  />
                </div>

                <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-[#B99A5B]">
                  KOVENIK / DANGER ZONE
                </p>

                <h2 className="mt-3 font-serif text-2xl font-medium tracking-wide text-[#F2E7D0] sm:text-3xl">
                  Delete your account?
                </h2>

                <p className="mt-3 max-w-sm text-xs leading-6 text-[#938B80]">
                  This action will permanently remove your KOVENIK
                  account access and cannot be reversed.
                </p>
              </div>

              {/* Metallic divider */}
              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#B99A5B]/40" />

                <span className="h-1.5 w-1.5 rotate-45 border border-[#D8BD7A] bg-[#090909]" />

                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#B99A5B]/40" />
              </div>

              {/* GOOGLE ACCOUNT */}
              {profile.isGoogleAccount ? (
                <div className="rounded-xl border border-[#B99A5B]/20 bg-[#101010] p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#B99A5B]/30 bg-[#171717]">
                      <ShieldAlert
                        className="h-3.5 w-3.5 text-[#D8BD7A]"
                        strokeWidth={1.4}
                      />
                    </div>

                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#B99A5B]">
                        Google Account
                      </p>

                      <p className="mt-2 text-xs leading-5 text-[#A49C90]">
                        You signed in with Google. No password is required
                        to delete this account.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* EMAIL ACCOUNT */
                <div>
                  <label className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#A79F93]">
                    Enter your password
                  </label>

                  <div className="relative mt-2">
                    <input
                      type={
                        profile.showDeletePassword
                          ? 'text'
                          : 'password'
                      }
                      value={profile.deletePassword}
                      onChange={(e) => {
                        profile.setDeletePassword(e.target.value);
                        profile.setError('');
                      }}
                      placeholder="Your account password"
                      autoComplete="current-password"
                      disabled={profile.deleteLoading}
                      className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 pr-11 text-sm text-[#EEE5D5] outline-none placeholder:text-[#5F5A52] transition focus:border-[#B99A5B]/60 focus:bg-[#141414] disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        profile.setShowDeletePassword(
                          (prev) => !prev
                        )
                      }
                      disabled={profile.deleteLoading}
                      aria-label={
                        profile.showDeletePassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                      className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-[#756E65] transition hover:text-[#D8BD7A]"
                    >
                      {profile.showDeletePassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {profile.error && (
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-xs text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <span className="leading-5">
                    {profile.error}
                  </span>
                </div>
              )}

              {/* Buttons */}
              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={() => {
                    if (!profile.deleteLoading) {
                      profile.setShowDeleteModal(false);
                      profile.setDeletePassword('');
                      profile.setError('');
                    }
                  }}
                  disabled={profile.deleteLoading}
                  className="rounded-lg border border-[#B99A5B]/30 bg-transparent px-5 py-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#C8BBA7] transition hover:border-[#B99A5B]/60 hover:bg-[#B99A5B]/[0.06] hover:text-[#E0CA91] disabled:opacity-50"
                >
                  Keep Account
                </button>

                <button
                  type="button"
                  onClick={profile.deleteAccount}
                  disabled={
                    profile.deleteLoading ||
                    (!profile.isGoogleAccount &&
                      !profile.deletePassword.trim())
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-900/50 bg-[#5C2929] px-5 py-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#F5DCDC] transition hover:border-red-700/60 hover:bg-[#713333] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {profile.deleteLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}

                  {profile.deleteLoading
                    ? 'Deleting...'
                    : 'Delete Permanently'}
                </button>
              </div>

              {/* Warning */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="h-px w-8 bg-[#B99A5B]/20" />

                <p className="text-center text-[8px] font-medium uppercase tracking-[0.2em] text-[#70695F]">
                  This action cannot be undone
                </p>

                <span className="h-px w-8 bg-[#B99A5B]/20" />
              </div>
            </div>

            {/* Bottom metallic line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#B99A5B]/50 to-transparent" />
          </div>
        </div>
      )}
    </>
  );
}