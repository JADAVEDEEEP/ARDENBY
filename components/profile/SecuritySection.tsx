'use client';

import { useState } from 'react';
import type { useProfile } from '../../hooks/use-profile';
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { apiUrl } from '@/lib/api-url';
import { IconDisc, SectionTitle } from './metal';

type ProfileState = ReturnType<typeof useProfile>;

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled: boolean;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="kv-field-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className="kv-input !pr-14"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={show}
          className="absolute right-0 top-0 flex h-[52px] w-12 items-center justify-center text-[#444444]"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-[15px] text-[#111111]">
      <span
        aria-hidden
        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
          ok ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#BDBDBD]'
        }`}
      >
        {ok && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      {children}
      <span className="sr-only">{ok ? ' — met' : ' — not met yet'}</span>
    </li>
  );
}

export function SecuritySection({ profile }: { profile: ProfileState }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = async () => {
    setPasswordMessage('');
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const token = localStorage.getItem('ardenby_token');
      if (!token) throw new Error('Please login again.');

      const response = await fetch(apiUrl('/api/users/me/password'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to change password.');

      setPasswordMessage(data.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordError(error.message || 'Something went wrong.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <section className="space-y-8">
      <SectionTitle title="Security" sub="Keep your KOVENIK account protected." />

      {profile.isGoogleAccount ? (
        <div className="kv-inner flex items-start gap-4 p-5">
          <IconDisc icon={ShieldCheck} size={44} />
          <div>
            <p className="text-[18px] font-bold text-[#111111]">Signed in with Google</p>
            <p className="mt-1 text-[16px] leading-6 text-[#666666]">
              Your password is managed by Google, so there is nothing to change here.
            </p>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleChangePassword();
          }}
          className="kv-inner p-5 sm:p-8"
        >
          <div className="flex items-start gap-4">
            <IconDisc icon={LockKeyhole} size={44} className="!bg-[#F5F5F5]" />
            <div>
              <h2 className="kv-display text-[26px]">Change password</h2>
              <p className="mt-1 text-[16px] text-[#666666]">Use a password you don&apos;t use anywhere else.</p>
            </div>
          </div>

          <div className="mt-6 grid max-w-3xl gap-x-6 gap-y-5 md:grid-cols-2">
            <div className="md:col-span-1">
              <PasswordField
                id="sec-current"
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Enter current password"
                disabled={isChangingPassword}
                autoComplete="current-password"
              />
            </div>
            <div className="hidden md:block" />
            <PasswordField
              id="sec-new"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Enter new password"
              disabled={isChangingPassword}
              autoComplete="new-password"
            />
            <PasswordField
              id="sec-confirm"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter new password"
              disabled={isChangingPassword}
              autoComplete="new-password"
            />

            <ul className="flex flex-wrap gap-x-6 gap-y-2 rounded-[4px] bg-[#F5F5F5] px-4 py-3 md:col-span-2" aria-label="Password requirements">
              <Rule ok={newPassword.length >= 8}>At least 8 characters</Rule>
              <Rule ok={newPassword.length > 0 && newPassword === confirmPassword}>New passwords match</Rule>
            </ul>

            <div className="md:col-span-2">
              {passwordError && (
                <div role="alert" className="flex items-start gap-2 rounded-[4px] border border-[#C8211F] px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#C8211F]" />
                  <p className="text-[15px] leading-5 text-[#C8211F]">{passwordError}</p>
                </div>
              )}
              {passwordMessage && (
                <div role="status" className="flex items-start gap-2 rounded-[4px] border border-[#111111] bg-[#F5F5F5] px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#111111]" />
                  <p className="text-[15px] leading-5 text-[#111111]">{passwordMessage}</p>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <button type="submit" disabled={isChangingPassword} className="kv-btn-primary w-full sm:w-auto">
                {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                {isChangingPassword ? 'Changing…' : 'Change password'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="rounded-[4px] border border-[#C8211F] bg-white p-5 sm:p-8">
        <h2 className="text-[22px] font-bold text-[#C8211F]">Danger zone</h2>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[18px] font-bold text-[#111111]">Delete account</p>
            <p className="mt-1 max-w-xl text-[16px] leading-6 text-[#666666]">
              Permanently removes your KOVENIK account, order history, wishlist and saved addresses. This can&apos;t be undone.
            </p>
          </div>
          <button type="button" onClick={profile.openDeleteModal} className="kv-btn-danger shrink-0">
            Delete account…
          </button>
        </div>
      </div>
    </section>
  );
}
