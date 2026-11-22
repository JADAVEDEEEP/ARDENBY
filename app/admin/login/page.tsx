'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import { KeyRound, LockKeyhole, Mail } from 'lucide-react';

import {
  adminApiRequest,
  AuthResponse,
  clearAdminToken,
  getCurrentAdmin,
  getAdminToken,
  isAdminRole,
  isSessionRejected,
  readToken,
  saveAdminToken,
  startAdminSession,
} from '@/components/admin/admin-auth';
import { adminDestination } from '@/lib/auth-redirect';
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

  // The page the admin originally asked for (?next=...), validated as an
  // admin-area path; anything else falls back to the role's dashboard.
  const requestedPage = () =>
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('next')
      : null;

  // Opening /admin/login while already signed in as an admin goes straight on.
  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const user = await getCurrentAdmin();

        if (cancelled) return;

        if (isAdminRole(user.role)) {
          // Make sure the server-side session cookie exists before moving on.
          if (!(await startAdminSession(token))) return;
          if (cancelled) return;
          router.replace(adminDestination(user.role, requestedPage()));
        } else {
          clearAdminToken();
        }
      } catch (err) {
        // Only a rejected session is discarded; a network error keeps it.
        if (isSessionRejected(err)) clearAdminToken();
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redirectByRole = async (token: string) => {
    saveAdminToken(token);

    const user = await getCurrentAdmin();

    if (!isAdminRole(user.role)) {
      clearAdminToken();
      throw new Error('This login is only for Admin and Super Admin users.');
    }

    if (!(await startAdminSession(token))) {
      clearAdminToken();
      throw new Error('Could not start the admin session. Please try again.');
    }

    router.replace(adminDestination(user.role, requestedPage()));
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
  <main className="fixed inset-0 h-dvh w-screen overflow-hidden bg-[#FFFFFF] text-[#11162B]">
    <div className="grid h-full w-full grid-cols-1 lg:grid-cols-2">

      {/* ================= LEFT BRAND PANEL ================= */}
      <section className="relative hidden h-full overflow-hidden bg-[#11162B] lg:block">

        <div className="absolute left-12 top-12 z-10">
          <p className="font-serif text-4xl tracking-[0.3em] text-white">
            KOVENIK
          </p>

          <div className="mt-3 flex items-center gap-3">
            <span className="h-px w-10 bg-[#CFCCF4]/50" />

            <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[#CFCCF4]">
              Admin
            </span>

            <span className="h-px w-10 bg-[#CFCCF4]/50" />
          </div>
        </div>

        <div className="absolute inset-x-12 top-1/2 z-10 -translate-y-1/2">
          <div className="max-w-xl">

            <p className="text-[12px] font-semibold uppercase tracking-[0.4em] text-[#CFCCF4]">
              Private Store Administration
            </p>

            <h2 className="mt-5 font-serif text-5xl leading-[1.08] text-white xl:text-6xl">
              Crafted for the
              <br />
              <span className="text-[#CFCCF4]">KOVENIK</span> experience.
            </h2>

            <p className="mt-6 max-w-md text-[16px] leading-7 text-[#C9CCDD]">
              Secure access to your products, orders, customers and store
              operations.
            </p>

            <div className="mt-9 flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#CFCCF4]" />
              <span className="h-px w-16 bg-[#CFCCF4]/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#CFCCF4]" />
            </div>

          </div>
        </div>

        <div className="absolute bottom-10 left-12 z-10">
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#C9CCDD]">
            KOVENIK · Private Administration
          </p>
        </div>
      </section>

      {/* ================= RIGHT LOGIN PANEL ================= */}
      <section className="relative flex h-full w-full items-center justify-center overflow-y-auto bg-[#F5F6FA] px-5 py-6 sm:px-8 lg:overflow-hidden lg:px-10">

        <div className="relative z-10 flex w-full max-w-[470px] flex-col items-center py-2">

          {/* KOVENIK LOGO */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center lg:hidden"
          >
            <h1 className="font-serif text-[28px] uppercase tracking-[0.28em] text-[#11162B]">
              KOVENIK
            </h1>

            <div className="mt-2 flex items-center gap-3">
              <span className="h-px w-9 bg-[#4338CA]/40" />

              <span className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[#2E2699]">
                Admin Portal
              </span>

              <span className="h-px w-9 bg-[#4338CA]/40" />
            </div>
          </motion.div>

          {/* HEADING */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-4 text-center lg:mt-0"
          >
            <h2 className="font-serif text-[30px] leading-tight text-[#11162B]">
              {step === "LOGIN"
                ? "Welcome Back"
                : "Verify Your Identity"}
            </h2>

            <p className="mx-auto mt-2 max-w-[350px] text-[14px] leading-6 text-[#5A6075]">
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

            <div className="relative rounded-2xl border border-[#E3E5EE] bg-white p-7 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">

              {/* CARD HEADER */}
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#2E2699]">
                    {step === "LOGIN"
                      ? "Secure Access"
                      : "Two-Step Verification"}
                  </p>
                </div>

                <span className="h-2 w-2 rounded-full bg-[#17603F]" />
              </div>

              {/* ================= LOGIN ================= */}
              {step === "LOGIN" ? (
                <form
                  className="space-y-5"
                  onSubmit={handleLogin}
                >

                  {/* EMAIL */}
                  <label className="block">

                    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.24em] text-[#5A6075]">
                      Email Address
                    </span>

                    <span className="flex h-14 items-center gap-3 rounded-xl border border-[#E3E5EE] bg-[#FFFFFF] px-4 transition focus-within:border-[#4338CA] focus-within:ring-1 focus-within:ring-[#4338CA]/20">

                      <Mail className="h-5 w-5 shrink-0 text-[#4338CA]" />

                      <input
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        className="min-w-0 flex-1 bg-transparent text-[16px] text-[#11162B] outline-none placeholder:text-[#5A6075]"
                        type="email"
                        autoComplete="email"
                        placeholder="admin@kovenik.com"
                      />

                    </span>
                  </label>

                  {/* PASSWORD */}
                  <label className="block">

                    <div className="mb-2 flex items-center justify-between">

                      <span className="text-[12px] font-bold uppercase tracking-[0.24em] text-[#5A6075]">
                        Password
                      </span>

                      <span className="text-[11px] uppercase tracking-[0.16em] text-[#5A6075]">
                        Protected
                      </span>

                    </div>

                    <span className="flex h-14 items-center gap-3 rounded-xl border border-[#E3E5EE] bg-[#FFFFFF] px-4 transition focus-within:border-[#4338CA] focus-within:ring-1 focus-within:ring-[#4338CA]/20">

                      <LockKeyhole className="h-5 w-5 shrink-0 text-[#4338CA]" />

                      <input
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        className="min-w-0 flex-1 bg-transparent text-[16px] text-[#11162B] outline-none placeholder:text-[#5A6075]"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                      />

                    </span>
                  </label>

                  {/* ERROR */}
                  {error && (
                    <div className="rounded-xl border border-[#9A2C1F]/30 bg-[#FBE3DF] px-4 py-3">
                      <p className="text-[13px] leading-5 text-[#9A2C1F]">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* SIGN IN */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-14 w-full rounded-xl bg-[#4338CA] text-[12px] font-bold uppercase tracking-[0.3em] text-white  transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? "Checking..." : "Sign In →"}
                  </button>

                  {/* FOOTER */}
                  <div className="flex items-center justify-center gap-2 pt-1">

                    <span className="h-px flex-1 bg-[#E3E5EE]" />

                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#5A6075]">
                      Authorized Personnel Only
                    </span>

                    <span className="h-px flex-1 bg-[#E3E5EE]" />

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
                    className="h-14 w-full rounded-xl border border-[#E3E5EE] bg-[#FFFFFF] px-4 text-center text-xl font-semibold tracking-[0.65em] text-[#11162B] outline-none transition focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA]/20"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="••••••"
                  />

                  <p className="text-center text-[13px] leading-5 text-[#5A6075]">
                    Enter the 6-digit code sent to your registered admin
                    email.
                  </p>

                  {error && (
                    <div className="rounded-xl border border-[#9A2C1F]/30 bg-[#FBE3DF] px-4 py-3">
                      <p className="text-[13px] leading-5 text-[#9A2C1F]">
                        {error}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="h-14 w-full rounded-xl bg-[#4338CA] text-[12px] font-bold uppercase tracking-[0.3em] text-white  transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="h-10 w-full text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5A6075] transition hover:text-[#11162B]"
                  >
                    ← Back to Login
                  </button>

                </form>
              )}

            </div>
          </motion.div>


        </div>
      </section>

    </div>
  </main>
);
}
