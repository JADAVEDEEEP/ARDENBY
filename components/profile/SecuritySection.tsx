'use client';

import { useState } from 'react';

import type { useProfile } from '../../hooks/use-profile';

import { LockKeyhole, Trash2 } from 'lucide-react';

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

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        'Please fill in all password fields.'
      );
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        'New password must be at least 8 characters.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        'New passwords do not match.'
      );
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

      const token =
        localStorage.getItem('ardenby_token');

      if (!token) {
        throw new Error('Please login again.');
      }

      const response = await fetch(
        apiUrl('/api/users/me/password'),
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to change password.'
        );
      }

      setPasswordMessage(
        data.message ||
          'Password changed successfully.'
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordError(
        error.message ||
          'Something went wrong.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Panel
      title="Security"
      subtitle="Protect your ARDENBY account."
    >
      {/* =================================================
          CHANGE PASSWORD
      ================================================= */}

      <div className="border-t border-[#DCD5C9] pt-7">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#81796F]">
          Password
        </p>

        <h3 className="mt-2 font-serif text-xl">
          Change password
        </h3>

        <p className="mt-2 max-w-xl text-xs leading-5 text-[#81796F]">
          Update your password to keep your ARDENBY account secure.
        </p>

        <div className="mt-5 max-w-md space-y-3">

          {/* Current Password */}

          <div>
            <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.14em] text-[#81796F]">
              Current Password
            </label>

            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9A9288]" />

              <input
                type="password"
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(e.target.value)
                }
                placeholder="Enter current password"
                className="w-full border border-[#DCD5C9] bg-transparent py-3 pl-9 pr-3 text-xs outline-none transition focus:border-[#A99A83]"
              />
            </div>
          </div>

          {/* New Password */}

          <div>
            <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.14em] text-[#81796F]">
              New Password
            </label>

            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9A9288]" />

              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Enter new password"
                className="w-full border border-[#DCD5C9] bg-transparent py-3 pl-9 pr-3 text-xs outline-none transition focus:border-[#A99A83]"
              />
            </div>
          </div>

          {/* Confirm Password */}

          <div>
            <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.14em] text-[#81796F]">
              Confirm New Password
            </label>

            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9A9288]" />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm new password"
                className="w-full border border-[#DCD5C9] bg-transparent py-3 pl-9 pr-3 text-xs outline-none transition focus:border-[#A99A83]"
              />
            </div>
          </div>

          {/* Error */}

          {passwordError && (
            <p className="text-[10px] leading-4 text-[#9A4F4F]">
              {passwordError}
            </p>
          )}

          {/* Success */}

          {passwordMessage && (
            <p className="text-[10px] leading-4 text-green-700">
              {passwordMessage}
            </p>
          )}

          {/* Change Password Button */}

          <button
            type="button"
            onClick={handleChangePassword}
            disabled={isChangingPassword}
            className="mt-2 inline-flex items-center gap-2 border border-[#1E1E1E] px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#1E1E1E] transition hover:bg-[#1E1E1E] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LockKeyhole className="h-3.5 w-3.5" />

            {isChangingPassword
              ? 'Changing...'
              : 'Change Password'}
          </button>
        </div>
      </div>

      {/* =================================================
          DANGER ZONE
      ================================================= */}

      <div className="mt-8 border-t border-[#DCD5C9] pt-7">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#9A4F4F]">
          Danger Zone
        </p>

        <h3 className="mt-2 font-serif text-xl">
          Delete account
        </h3>

        <p className="mt-2 max-w-xl text-xs leading-5 text-[#81796F]">
          Permanently remove your ARDENBY customer
          access and associated account.
        </p>

        <button
          type="button"
          onClick={profile.openDeleteModal}
          className="mt-4 inline-flex items-center gap-2 border border-[#D9BABA] px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9A4F4F] transition hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Account
        </button>
      </div>
    </Panel>
  );
}
