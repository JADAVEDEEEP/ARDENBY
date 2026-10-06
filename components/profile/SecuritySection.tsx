'use client';

import { useState } from 'react';
import type { useProfile } from '../../hooks/use-profile';
import {
  CheckCircle2,
  LockKeyhole,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { apiUrl } from '@/lib/api-url';
import { Panel } from './ui';

type ProfileState = ReturnType<typeof useProfile>;

export function SecuritySection({
  profile,
}: {
  profile: ProfileState;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isChangingPassword, setIsChangingPassword] =
    useState(false);

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
      setPasswordError(
        'New password must be different from current password.'
      );
      return;
    }

    try {
      setIsChangingPassword(true);

      const token = localStorage.getItem('ardenby_token');

      if (!token) {
        throw new Error('Please login again.');
      }

      const response = await fetch(apiUrl('/api/users/me/password'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to change password.');
      }

      setPasswordMessage(
        data.message || 'Password changed successfully.'
      );

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
    <Panel
      title="Security"
      subtitle="Protect your KOVENIK account."
    >
      {/* =================================================
          CHANGE PASSWORD
      ================================================= */}

      {!profile.isGoogleAccount && (
        <div className="relative overflow-hidden border-t border-[#B99A5B]/30 pt-6">
          <div className="pointer-events-none absolute inset-0 opacity-[0.035]">
            <div className="absolute left-0 top-1/2 h-px w-full bg-[#D8BD7A]" />
            <div className="absolute right-1/4 top-0 h-full w-px bg-[#D8BD7A]" />
          </div>

          <div className="relative">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center border border-[#B99A5B]/30 bg-[#0B0B0B] sm:flex">
                <LockKeyhole
                  className="h-4 w-4 text-[#CDB272]"
                  strokeWidth={1.3}
                />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#B99A5B]">
                  PASSWORD
                </p>
                <h3 className="mt-1.5 font-serif text-xl font-medium text-[#F1E8D8] sm:text-2xl">
                  Change password
                </h3>
                <p className="mt-1.5 max-w-xl text-xs leading-5 text-[#81796F]">
                  Update your password to keep your KOVENIK account secure.
                </p>
              </div>
            </div>

            {/* Compact password form */}
            <div className="mt-6 grid max-w-3xl grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
              {/* Current Password */}
              <div>
                <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A18D6A]">
                  Current Password
                </label>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#756E65]"
                    strokeWidth={1.3}
                  />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    disabled={isChangingPassword}
                    className="h-11 w-full border border-[#3A3328] bg-[#090909] py-3 pl-9 pr-3 text-xs text-[#E9DFCE] outline-none transition placeholder:text-[#625C54] focus:border-[#B99A5B]/70 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A18D6A]">
                  New Password
                </label>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#756E65]"
                    strokeWidth={1.3}
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={isChangingPassword}
                    className="h-11 w-full border border-[#3A3328] bg-[#090909] py-3 pl-9 pr-3 text-xs text-[#E9DFCE] outline-none transition placeholder:text-[#625C54] focus:border-[#B99A5B]/70 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <p className="mt-1.5 text-[9px] tracking-wide text-[#625C54]">
                  Minimum 8 characters.
                </p>
              </div>

              {/* Confirm Password */}
              <div className="md:col-span-2 md:max-w-[calc(50%-0.625rem)]">
                <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A18D6A]">
                  Confirm New Password
                </label>
                <div className="relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#756E65]"
                    strokeWidth={1.3}
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={isChangingPassword}
                    className="h-11 w-full border border-[#3A3328] bg-[#090909] py-3 pl-9 pr-3 text-xs text-[#E9DFCE] outline-none transition placeholder:text-[#625C54] focus:border-[#B99A5B]/70 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Messages */}
              <div className="md:col-span-2">
                {passwordError && (
                  <div className="flex items-start gap-2 border border-[#743F3F]/60 bg-[#291717] px-3 py-2.5">
                    <AlertCircle
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C77C7C]"
                      strokeWidth={1.5}
                    />
                    <p className="text-[10px] leading-4 text-[#D69A9A]">
                      {passwordError}
                    </p>
                  </div>
                )}

                {passwordMessage && (
                  <div className="flex items-start gap-2 border border-[#B99A5B]/30 bg-[#19160F] px-3 py-2.5">
                    <CheckCircle2
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#CDB272]"
                      strokeWidth={1.5}
                    />
                    <p className="text-[10px] leading-4 text-[#D7C89F]">
                      {passwordMessage}
                    </p>
                  </div>
                )}
              </div>

              {/* Change Password */}
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="inline-flex h-10 items-center justify-center gap-2 border border-[#8F753E] bg-[#B09250] px-5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#0B0B0B] transition hover:bg-[#C3A965] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isChangingPassword ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LockKeyhole
                      className="h-3.5 w-3.5"
                      strokeWidth={1.5}
                    />
                  )}
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          DANGER ZONE
      ================================================= */}

      <div className="relative mt-8 overflow-hidden border-t border-[#5A3030]/70 pt-7">
        <div className="pointer-events-none absolute right-0 top-7 h-32 w-1/3 bg-gradient-to-l from-[#542727]/10 to-transparent" />

        <div className="relative">
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#A75C5C]">
            DANGER ZONE
          </p>

          <h3 className="mt-2 font-serif text-xl font-medium text-[#EADDD3] sm:text-2xl">
            Delete account
          </h3>

          <p className="mt-2 max-w-xl text-xs leading-5 text-[#81736C]">
            Permanently remove your KOVENIK customer access and associated account.
          </p>

          <button
            type="button"
            onClick={profile.openDeleteModal}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 border border-[#814545] bg-transparent px-5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#C98686] transition hover:border-[#A75C5C] hover:bg-[#421F1F] hover:text-[#E0A0A0]"
          >
            <Trash2
              className="h-3.5 w-3.5"
              strokeWidth={1.4}
            />
            Delete Account
          </button>
        </div>
      </div>
    </Panel>
  );
}
