'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { KeyRound, LockKeyhole, Mail } from 'lucide-react';

import {
  adminApiRequest,
  AuthResponse,
  clearAdminToken,
  getCurrentAdmin,
  isAdminRole,
  isSuperAdminRole,
  readToken,
  saveAdminToken,
} from '@/components/admin/admin-auth';

type LoginStep = 'LOGIN' | 'OTP';

export default function AdminLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<LoginStep>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'email_verification'>(
    'login'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectByRole = async (token: string) => {
    saveAdminToken(token);

    const user = await getCurrentAdmin();

    if (!isAdminRole(user.role)) {
      clearAdminToken();
      throw new Error('This login is only for Admin and Super Admin users.');
    }

    router.replace(isSuperAdminRole(user.role) ? '/superadmin' : '/admin');
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Enter a valid admin email.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await adminApiRequest<AuthResponse>('/api/auth/', {
        method: 'POST',
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const token = readToken(response);

      if (token) {
        await redirectByRole(token);
        return;
      }

      setEmail(cleanEmail);
      setOtpPurpose(
        response.purpose === 'email_verification' ? 'email_verification' : 'login'
      );
      setOtp('');
      setStep('OTP');
    } catch (err: any) {
      setError(err?.message || 'Unable to continue.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6 digit OTP.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await adminApiRequest<AuthResponse>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp,
          purpose: otpPurpose,
        }),
      });

      const token = readToken(response);

      if (!token) {
        throw new Error('Authentication token was not returned by the server.');
      }

      await redirectByRole(token);
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="fixed inset-0 h-dvh w-screen overflow-hidden bg-[#f8f5f0]">
      <div className="grid h-full w-full grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden h-full w-full overflow-hidden bg-black lg:block">
          <img
            src="/ardenby-fashion.png"
            alt="ARDENBY Campaign"
            className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
          />
        </section>

        <section className="relative flex h-full w-full items-center justify-center overflow-y-auto bg-[#f8f5f0] px-8 sm:px-12 lg:px-16">
          <div className="flex w-full max-w-[380px] flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e2d7c7] bg-transparent">
                <span className="font-serif text-xl font-normal text-[#111]">
                  A
                </span>
              </div>

              <h1 className="mt-3 font-serif text-2xl font-normal uppercase tracking-[0.25em] text-[#1a1a1a]">
                ARDENBY
              </h1>

              <div className="flex items-center justify-center gap-3 pt-1.5">
                <span className="h-px w-5 bg-[#dfd0be]" />
                <span className="text-[8px] font-semibold uppercase tracking-[0.3em] text-[#a18158]">
                  Wear Your Essence
                </span>
                <span className="h-px w-5 bg-[#dfd0be]" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 space-y-1"
            >
              <h2 className="font-serif text-2xl font-normal text-[#1a1a1a]">
                Admin Access
              </h2>
              <p className="max-w-xs text-[11px] leading-relaxed text-[#736a60]">
                Sign in with an Admin or Super Admin account.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 w-full border border-[#e7ddd1] bg-white p-4 text-left"
            >
              {step === 'LOGIN' ? (
                <form className="space-y-3" onSubmit={handleLogin}>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8f8171]">
                      Email
                    </span>
                    <span className="flex h-11 items-center gap-2 border border-[#e7ddd1] bg-[#f8f5f0] px-3">
                      <Mail className="h-4 w-4 text-[#a18158]" />
                      <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                        type="email"
                        autoComplete="email"
                      />
                    </span>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8f8171]">
                      Password
                    </span>
                    <span className="flex h-11 items-center gap-2 border border-[#e7ddd1] bg-[#f8f5f0] px-3">
                      <LockKeyhole className="h-4 w-4 text-[#a18158]" />
                      <input
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                        type="password"
                        autoComplete="current-password"
                      />
                    </span>
                  </label>

                  {error && (
                    <p className="text-xs leading-5 text-red-700">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 w-full bg-[#111] text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? 'Checking...' : 'Continue'}
                  </button>
                </form>
              ) : (
                <form className="space-y-3" onSubmit={handleVerifyOtp}>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8f8171]">
                      OTP
                    </span>
                    <span className="flex h-11 items-center gap-2 border border-[#e7ddd1] bg-[#f8f5f0] px-3">
                      <KeyRound className="h-4 w-4 text-[#a18158]" />
                      <input
                        value={otp}
                        onChange={(event) =>
                          setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        className="min-w-0 flex-1 bg-transparent text-sm tracking-[0.35em] outline-none"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      />
                    </span>
                  </label>

                  {error && (
                    <p className="text-xs leading-5 text-red-700">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 w-full bg-[#111] text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOtp('');
                      setError('');
                      setStep('LOGIN');
                    }}
                    className="h-9 w-full text-xs font-semibold uppercase tracking-[0.2em] text-[#8f8171]"
                  >
                    Back to login
                  </button>
                </form>
              )}
            </motion.div>

            <div className="mt-8">
              <p className="text-[8px] font-medium uppercase tracking-[0.35em] text-[#a3988c]">
                ARDENBY - Wear Your Essence
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
