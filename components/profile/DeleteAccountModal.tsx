'use client';

import type { useProfile } from '../../hooks/use-profile';
import { AlertCircle, Eye, EyeOff, Loader2, X, ShieldAlert } from 'lucide-react';

type ProfileState = ReturnType<typeof useProfile>;

export function DeleteAccountModal({ profile }: { profile: ProfileState }) {
  if (!profile.showDeleteModal) return null;

  const close = () => {
    if (!profile.deleteLoading) {
      profile.setShowDeleteModal(false);
      profile.setDeletePassword('');
      profile.setError('');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kv-delete-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
    >
      <div className="kv-metal w-full max-w-md">
        <div className="p-6 sm:p-8">
          <button
            type="button"
            onClick={close}
            disabled={profile.deleteLoading}
            aria-label="Close"
            className="kv-disc absolute right-4 top-4 h-11 w-11 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>

          <span className="kv-disc mb-5 h-12 w-12">
            <ShieldAlert className="h-5 w-5 text-[#EF7B7B]" strokeWidth={1.7} />
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#EF7B7B]">KOVENIK — Danger zone</p>
          <h2
            id="kv-delete-title"
            className="mt-3 text-[28px] font-normal leading-tight text-white"
            style={{ fontFamily: 'Bodoni MT, Didot, serif' }}
          >
            Delete your account?
          </h2>
          <p className="mt-3 text-[13px] leading-6 text-[#C6C9CF]">
            This will permanently remove your KOVENIK account access and cannot be reversed.
          </p>

          <div className="my-6 h-px bg-[#33363D]" />

          {profile.isGoogleAccount ? (
            <div className="kv-inner flex items-start gap-3 p-4">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#D6B06A]" strokeWidth={1.7} />
              <div>
                <p className="kv-label">Google account</p>
                <p className="mt-2 text-[13px] leading-5 text-[#C6C9CF]">
                  You signed in with Google. No password is required to delete this account.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="kv-delete-password" className="kv-field-label">
                Enter your password
              </label>
              <div className="relative">
                <input
                  id="kv-delete-password"
                  type={profile.showDeletePassword ? 'text' : 'password'}
                  value={profile.deletePassword}
                  onChange={(e) => {
                    profile.setDeletePassword(e.target.value);
                    profile.setError('');
                  }}
                  placeholder="Your account password"
                  autoComplete="current-password"
                  disabled={profile.deleteLoading}
                  className="kv-input !pr-12"
                />
                <button
                  type="button"
                  onClick={() => profile.setShowDeletePassword((prev) => !prev)}
                  disabled={profile.deleteLoading}
                  aria-label={profile.showDeletePassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[#9296A0] hover:text-white"
                >
                  {profile.showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {profile.error && (
            <div role="alert" className="mt-5 flex items-start gap-3 rounded-xl border border-[#5a2a2c] bg-[#2a1517] px-4 py-3 text-[12px] text-[#EF7B7B]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="leading-5">{profile.error}</span>
            </div>
          )}

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button type="button" onClick={close} disabled={profile.deleteLoading} className="kv-btn-ghost">
              Keep Account
            </button>
            <button
              type="button"
              onClick={profile.deleteAccount}
              disabled={profile.deleteLoading || (!profile.isGoogleAccount && !profile.deletePassword.trim())}
              className="kv-btn-danger"
            >
              {profile.deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {profile.deleteLoading ? 'Deleting…' : 'Delete Permanently'}
            </button>
          </div>

          <p className="mt-5 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-[#9296A0]">
            This action cannot be undone
          </p>
        </div>
      </div>
    </div>
  );
}
