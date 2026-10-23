'use client';

import { useState } from 'react';
import type { useProfile } from '../../hooks/use-profile';
import { CheckCircle2, LockKeyhole, Trash2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { apiUrl } from '@/lib/api-url';
import { IconDisc, SectionTitle } from './metal';

type ProfileState = ReturnType<typeof useProfile>;

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  hint,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled: boolean;
  hint?: string;
  autoComplete: string;
}) {
  return (
    <div>
      <label className="kv-field-label">{label}</label>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9296A0]" strokeWidth={1.7} />
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className="kv-input !pl-11"
        />
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-[#9296A0]">{hint}</p>}
    </div>
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
    <section className="space-y-6">
      <SectionTitle label="KOVENIK — SECURITY" title="Security" sub="Protect your KOVENIK account." />

      {profile.isGoogleAccount ? (
        <div className="kv-inner flex items-start gap-4 p-5">
          <IconDisc icon={ShieldCheck} size={42} />
          <div>
            <p className="text-[14px] font-semibold text-white">Signed in with Google</p>
            <p className="mt-1 text-[13px] leading-6 text-[#9296A0]">
              Your password is managed by Google, so there is nothing to change here.
            </p>
          </div>
        </div>
      ) : (
        <div className="kv-inner p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <IconDisc icon={LockKeyhole} size={42} />
            <div>
              <p className="kv-label">Password</p>
              <h3 className="mt-1.5 text-[22px] text-white" style={{ fontFamily: 'Bodoni MT, Didot, serif' }}>
                Change password
              </h3>
              <p className="mt-1 text-[13px] text-[#9296A0]">Update your password to keep your account secure.</p>
            </div>
          </div>

          <div className="mt-6 grid max-w-3xl gap-x-5 gap-y-5 md:grid-cols-2">
            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter current password"
              disabled={isChangingPassword}
              autoComplete="current-password"
            />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Enter new password"
              disabled={isChangingPassword}
              hint="Minimum 8 characters."
              autoComplete="new-password"
            />
            <div className="md:col-span-1">
              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm new password"
                disabled={isChangingPassword}
                autoComplete="new-password"
              />
            </div>

            <div className="md:col-span-2">
              {passwordError && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-[#5a2a2c] bg-[#2a1517] px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#EF7B7B]" />
                  <p className="text-[12px] leading-5 text-[#EF7B7B]">{passwordError}</p>
                </div>
              )}
              {passwordMessage && (
                <div role="status" className="flex items-start gap-2 rounded-xl border border-[#245a3a] bg-[#11261a] px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5FD08A]" />
                  <p className="text-[12px] leading-5 text-[#5FD08A]">{passwordMessage}</p>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <button type="button" onClick={handleChangePassword} disabled={isChangingPassword} className="kv-btn-primary">
                {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                {isChangingPassword ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="kv-inner !border-[#4a2a2c] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#EF7B7B]">Danger zone</p>
        <h3 className="mt-2 text-[22px] text-white" style={{ fontFamily: 'Bodoni MT, Didot, serif' }}>
          Delete account
        </h3>
        <p className="mt-2 max-w-xl text-[13px] leading-6 text-[#9296A0]">
          Permanently remove your KOVENIK customer access and associated account.
        </p>
        <button type="button" onClick={profile.openDeleteModal} className="kv-btn-danger mt-5">
          <Trash2 className="h-4 w-4" /> Delete Account
        </button>
      </div>
    </section>
  );
}
