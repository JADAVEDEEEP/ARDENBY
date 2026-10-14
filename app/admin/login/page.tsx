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
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'email_verification'>('login');
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
  <main className="fixed inset-0 h-dvh w-screen overflow-hidden bg-[#07180D] text-[#F4F0E6]">
    <div className="grid h-full w-full grid-cols-1 lg:grid-cols-2">

      {/* ================= LEFT BRAND PANEL ================= */}
      <section className="relative hidden h-full overflow-hidden bg-[#07180D] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(200,169,107,0.12),transparent_32%),radial-gradient(circle_at_75%_80%,rgba(18,53,31,0.9),transparent_42%)]" />

        <div className="absolute inset-0 bg-gradient-to-br from-[#12351F]/80 via-[#07180D] to-[#07180D]" />

        <div className="absolute left-12 top-12 z-10">
          <p className="font-serif text-4xl tracking-[0.3em] text-[#F4F0E6]">
            KOVENIK
          </p>

          <div className="mt-3 flex items-center gap-3">
            <span className="h-px w-10 bg-[#C8A96B]" />

            <span className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[#C8A96B]">
              Admin
            </span>

            <span className="h-px w-10 bg-[#C8A96B]" />
          </div>
        </div>

        <div className="absolute inset-x-12 top-1/2 z-10 -translate-y-1/2">
          <div className="max-w-xl">

            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#C8A96B]">
              Private Store Administration
            </p>

            <h2 className="mt-5 font-serif text-5xl leading-[1.08] text-[#F4F0E6] xl:text-6xl">
              Crafted for the
              <br />
              <span className="text-[#C8A96B]">KOVENIK</span> experience.
            </h2>

            <p className="mt-6 max-w-md text-sm leading-7 text-[#B9C7BA]">
              Secure access to your products, orders, customers and store
              operations.
            </p>

            <div className="mt-9 flex items-center gap-3">
              <span className="h-1 w-1 rounded-full bg-[#C8A96B]" />
              <span className="h-px w-16 bg-[#B89A5A]/40" />
              <span className="h-1 w-1 rounded-full bg-[#C8A96B]" />
            </div>

          </div>
        </div>

        <div className="absolute bottom-10 left-12 z-10">
          <p className="text-[9px] uppercase tracking-[0.35em] text-[#718173]">
            KOVENIK · Private Administration
          </p>
        </div>
      </section>

      {/* ================= RIGHT LOGIN PANEL ================= */}
      <section className="relative flex h-full w-full items-center justify-center overflow-y-auto bg-[#0A2114] px-5 py-3 sm:px-8 lg:px-10">

        {/* Background lighting */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(200,169,107,0.12),transparent_28%),linear-gradient(180deg,#0D2415_0%,#07180D_100%)]" />

        <div className="relative z-10 flex w-full max-w-[470px] flex-col items-center py-2">

          {/* KOVENIK LOGO */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center"
          >
            <h1 className="font-serif text-[28px] uppercase tracking-[0.28em] text-[#F4F0E6]">
              KOVENIK
            </h1>

            <div className="mt-2 flex items-center gap-3">
              <span className="h-px w-9 bg-[#B89A5A]/55" />

              <span className="text-[9px] font-semibold uppercase tracking-[0.42em] text-[#C8A96B]">
                Admin Portal
              </span>

              <span className="h-px w-9 bg-[#B89A5A]/55" />
            </div>
          </motion.div>

          {/* HEADING */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-4 text-center"
          >
            <h2 className="font-serif text-[30px] leading-tight text-[#F4F0E6]">
              {step === "LOGIN"
                ? "Welcome Back"
                : "Verify Your Identity"}
            </h2>

            <p className="mx-auto mt-2 max-w-[350px] text-[12px] leading-6 text-[#9EAE9F]">
              {step === "LOGIN"
                ? "Sign in with your Admin or Super Admin account."
                : `Enter the 6-digit verification code sent to ${email
                    .trim()
                    .toLowerCase()}.`}
            </p>
          </motion.div>

          {/* LOGIN CARD */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative mt-5 w-full"
          >

            <div className="absolute -inset-[1px] rounded-[22px] bg-gradient-to-b from-[#C8A96B]/35 via-[#B89A5A]/10 to-transparent" />

            <div className="relative rounded-[21px] border border-[#C8A96B]/20 bg-[#0B1E13]/95 p-6 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">

              {/* CARD HEADER */}
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#C8A96B]">
                    {step === "LOGIN"
                      ? "Secure Access"
                      : "Two-Step Verification"}
                  </p>

                  <p className="mt-1 text-[11px] text-[#718173]">
                    KOVENIK private administration
                  </p>
                </div>

                <span className="h-2 w-2 rounded-full bg-[#C8A96B] shadow-[0_0_12px_rgba(200,169,107,0.65)]" />
              </div>

              {/* ================= LOGIN ================= */}
              {step === "LOGIN" ? (
                <form
                  className="space-y-5"
                  onSubmit={handleLogin}
                >

                  {/* EMAIL */}
                  <label className="block">

                    <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.24em] text-[#B9C7BA]">
                      Email Address
                    </span>

                    <span className="flex h-14 items-center gap-3 rounded-xl border border-[#B89A5A]/25 bg-[#07180D] px-4 transition focus-within:border-[#C8A96B] focus-within:ring-1 focus-within:ring-[#C8A96B]/20">

                      <Mail className="h-5 w-5 shrink-0 text-[#C8A96B]" />

                      <input
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        className="min-w-0 flex-1 bg-transparent text-[16px] text-[#F4F0E6] outline-none placeholder:text-[#657466]"
                        type="email"
                        autoComplete="email"
                        placeholder="admin@kovenik.com"
                      />

                    </span>
                  </label>

                  {/* PASSWORD */}
                  <label className="block">

                    <div className="mb-2 flex items-center justify-between">

                      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#B9C7BA]">
                        Password
                      </span>

                      <span className="text-[8px] uppercase tracking-[0.16em] text-[#657466]">
                        Protected
                      </span>

                    </div>

                    <span className="flex h-14 items-center gap-3 rounded-xl border border-[#B89A5A]/25 bg-[#07180D] px-4 transition focus-within:border-[#C8A96B] focus-within:ring-1 focus-within:ring-[#C8A96B]/20">

                      <LockKeyhole className="h-5 w-5 shrink-0 text-[#C8A96B]" />

                      <input
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        className="min-w-0 flex-1 bg-transparent text-[16px] text-[#F4F0E6] outline-none placeholder:text-[#657466]"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                      />

                    </span>
                  </label>

                  {/* ERROR */}
                  {error && (
                    <div className="rounded-xl border border-red-400/20 bg-red-950/20 px-4 py-3">
                      <p className="text-xs leading-5 text-red-300">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* SIGN IN */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-14 w-full rounded-xl bg-gradient-to-r from-[#B89A5A] via-[#C8A96B] to-[#B89A5A] text-[11px] font-bold uppercase tracking-[0.3em] text-[#07180D] shadow-[0_12px_30px_rgba(184,154,90,0.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? "Checking..." : "Sign In →"}
                  </button>

                  {/* FOOTER */}
                  <div className="flex items-center justify-center gap-2 pt-1">

                    <span className="h-px flex-1 bg-[#B89A5A]/10" />

                    <span className="text-[8px] uppercase tracking-[0.2em] text-[#596A5C]">
                      Authorized Personnel Only
                    </span>

                    <span className="h-px flex-1 bg-[#B89A5A]/10" />

                  </div>

                </form>
              ) : (

                /* ================= OTP ================= */
                <form
                  className="space-y-5"
                  onSubmit={handleVerifyOtp}
                >

                  <input
                    value={otp}
                    onChange={(event) =>
                      setOtp(
                        event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6)
                      )
                    }
                    className="h-14 w-full rounded-xl border border-[#B89A5A]/25 bg-[#07180D] px-4 text-center text-xl font-semibold tracking-[0.65em] text-[#F4F0E6] outline-none transition focus:border-[#C8A96B] focus:ring-1 focus:ring-[#C8A96B]/20"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="••••••"
                  />

                  <p className="text-center text-xs leading-5 text-[#8FA08F]">
                    Enter the 6-digit code sent to your registered admin
                    email.
                  </p>

                  {error && (
                    <div className="rounded-xl border border-red-400/20 bg-red-950/20 px-4 py-3">
                      <p className="text-xs leading-5 text-red-300">
                        {error}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="h-14 w-full rounded-xl bg-gradient-to-r from-[#B89A5A] to-[#C8A96B] text-[11px] font-bold uppercase tracking-[0.3em] text-[#07180D] shadow-[0_12px_30px_rgba(184,154,90,0.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? "Verifying..." : "Verify OTP →"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOtp("");
                      setError("");
                      setStep("LOGIN");
                    }}
                    className="h-9 w-full text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8FA08F] transition hover:text-[#C8A96B]"
                  >
                    ← Back to Login
                  </button>

                </form>
              )}

            </div>
          </motion.div>

          <p className="mt-4 text-center text-[8px] font-medium uppercase tracking-[0.35em] text-[#596A5C]">
            KOVENIK · Private Administration
          </p>

        </div>
      </section>

    </div>
  </main>
);
}
