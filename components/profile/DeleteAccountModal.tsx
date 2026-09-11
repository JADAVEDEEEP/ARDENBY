'use client';

import type { useProfile } from '../../hooks/use-profile';
import { AlertCircle, Eye, EyeOff, Loader2, X } from 'lucide-react';

type ProfileState = ReturnType<typeof useProfile>;

export function DeleteAccountModal({ profile }: { profile: ProfileState }) {
  return (
    <>
      {profile.showDeleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-[2px]">
          <div className="relative w-full max-w-md bg-[#FBF9F5] p-6 shadow-2xl sm:p-8">

            {/* Close */}
            <button
              type="button"
              onClick={() => {
                if (!profile.deleteLoading) {
                  profile.setShowDeleteModal(
                    false
                  );

                  profile.setDeletePassword(
                    ''
                  );

                  profile.setError('');
                }
              }}
              disabled={profile.deleteLoading}
              className="absolute right-5 top-5 text-[#756E65] transition hover:text-[#171717] disabled:opacity-40"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="pr-8">
              <p className="text-[9px] uppercase tracking-[0.28em] text-[#9A4F4F]">
                ARDENBY / DANGER ZONE
              </p>

              <h2 className="mt-3 font-serif text-2xl">
                Delete your account?
              </h2>

              <p className="mt-3 text-xs leading-5 text-[#756E65]">
                This action will permanently
                remove your ARDENBY account
                access.
              </p>
            </div>

            {/* GOOGLE ACCOUNT */}
            {profile.isGoogleAccount ? (
              <div className="mt-6 border-y border-[#DDD6CB] py-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#9A8060]">
                  Google Account
                </p>

                <p className="mt-2 text-sm text-[#4F4A44]">
                  You signed in with Google.
                  No password is required to
                  delete this account.
                </p>
              </div>
            ) : (
              /* EMAIL ACCOUNT */
              <div className="mt-6">
                <label className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#5C554E]">
                  Enter your password
                </label>

                <div className="relative mt-2">
                  <input
                    type={
                      profile.showDeletePassword
                        ? 'text'
                        : 'password'
                    }
                    value={
                      profile.deletePassword
                    }
                    onChange={(e) => {
                      profile.setDeletePassword(
                        e.target.value
                      );
                      profile.setError('');
                    }}
                    placeholder="Your account password"
                    autoComplete="current-password"
                    disabled={
                      profile.deleteLoading
                    }
                    className="w-full border-b border-[#CFC6B8] bg-transparent px-0 py-3 pr-10 text-sm outline-none focus:border-[#171717] disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      profile.setShowDeletePassword(
                        (prev) => !prev
                      )
                    }
                    disabled={
                      profile.deleteLoading
                    }
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[#756E65]"
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

            {/* Modal profile.error */}
            {profile.error && (
              <div className="mt-4 flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                <span>
                  {profile.error}
                </span>
              </div>
            )}

            {/* Buttons */}
            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!profile.deleteLoading) {
                    profile.setShowDeleteModal(
                      false
                    );

                    profile.setDeletePassword(
                      ''
                    );

                    profile.setError('');
                  }
                }}
                disabled={
                  profile.deleteLoading
                }
                className="border border-[#BEB4A5] px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#4F4A44] transition hover:bg-[#F0ECE4] disabled:opacity-50"
              >
                Keep Account
              </button>

              <button
                type="button"
                onClick={
                  profile.deleteAccount
                }
                disabled={
                  profile.deleteLoading ||
                  (!profile.isGoogleAccount &&
                    !profile.deletePassword.trim())
                }
                className="inline-flex items-center justify-center gap-2 bg-[#9A4F4F] px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#7E3E3E] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {profile.deleteLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}

                {profile.deleteLoading
                  ? 'Deleting...'
                  : 'Delete Permanently'}
              </button>
            </div>

            <p className="mt-5 text-center text-[9px] uppercase tracking-[0.12em] text-[#9A9187]">
              This action cannot be undone
            </p>
          </div>
        </div>
      )}
    </>
  );
}
