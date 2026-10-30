'use client';

import Link from 'next/link';
import type {
  ClipboardEvent,
  Dispatch,
  FormEvent,
  KeyboardEvent,
  MutableRefObject,
  RefObject,
  SetStateAction,
} from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  X,
} from 'lucide-react';

const SERIF = 'var(--font-oswald), Impact, sans-serif';

const GOLD_TEXT_STYLE = {
  fontFamily: SERIF,
  color: '#E53935',
} as const;

const PHOTO_STYLE = {
  backgroundImage: "url('/images/hero-olive-graphic.jpg')",
  backgroundSize: 'cover',
} as const;

const METAL_BG = 'none';

const CARD_BG = 'none';

const INPUT_CLASS =
  'h-[48px] w-full rounded-[6px] border bg-[#FFFFFF] px-11 text-[14px] text-[#111111] outline-none transition focus:ring-4 placeholder:text-[#5C5C5C]';

const INPUT_OK_CLASS =
  'border-[#111111]/20 focus:border-[#111111]/60 focus:ring-[#111111]/15';

const INPUT_ERR_CLASS =
  'border-[#E53935] focus:border-[#E53935] focus:ring-[#E53935]/20';

const GOLD_BUTTON_CLASS =
  'flex h-[50px] w-full items-center justify-center gap-3 rounded-[6px] bg-[#E53935] px-6 text-[13px] font-bold tracking-[0.12em] text-[#FFFFFF] transition duration-200 hover:bg-[#C62828] hover:shadow-[0_8px_20px_rgba(229,57,53,0.28)] active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E53935]/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#E53935] disabled:hover:shadow-none';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FIELD_ERROR_CLASS = 'mt-1.5 text-[12px] font-medium text-[#C62828]';

const LABEL_CLASS =
  'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A4A4A]';

const ERROR_CLASS =
  'mb-5 rounded-[6px] border border-[#E53935]/40 bg-[#FDECEA] px-4 py-3 text-center text-[13px] font-medium text-[#B71C1C]';

type AuthStep = 'LOGIN' | 'OTP' | 'RESET_PASSWORD';
type OtpPurpose = 'login' | 'email_verification' | 'password_reset';

type NavbarAuthModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  step: AuthStep;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  otp: string[];
  setOtp: (otp: string[]) => void;
  setOtpPurpose: (purpose: OtpPurpose) => void;
  setResetToken: (token: string) => void;
  isLoading: boolean;
  isGoogleLoading: boolean;
  error: string;
  setError: (error: string) => void;
  otpTimer: number;
  canResend: boolean;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  rememberMe: boolean;
  setRememberMe: (remember: boolean) => void;
  googleButtonRef: RefObject<HTMLDivElement>;
  otpInputs: MutableRefObject<(HTMLInputElement | null)[]>;
  handleEmailAuth: (e: FormEvent) => void;
  handleForgotPassword: () => void;
  handleOtpChange: (value: string, index: number) => void;
  handleOtpKeyDown: (e: KeyboardEvent<HTMLInputElement>, index: number) => void;
  handleOtpPaste: (e: ClipboardEvent<HTMLDivElement>) => void;
  handleVerifyOtp: (e: FormEvent) => void;
  handleResendOtp: () => void;
  handleResetPassword: (e: FormEvent) => void;
  setStep: (step: AuthStep) => void;
};

function Wordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-start ${className}`}>
      <span
        className="text-[18px] font-bold uppercase leading-none tracking-[0.3em] text-[#F7F7F7]"
        style={{ fontFamily: SERIF }}
      >
        KOVENIK
      </span>
    </div>
  );
}

export function NavbarAuthModal({
  isOpen,
  setIsOpen,
  step,
  email,
  setEmail,
  password,
  setPassword,
  otp,
  setOtp,
  setOtpPurpose,
  setResetToken,
  isLoading,
  isGoogleLoading,
  error,
  setError,
  otpTimer,
  canResend,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  googleButtonRef,
  otpInputs,
  handleEmailAuth,
  handleForgotPassword,
  handleOtpChange,
  handleOtpKeyDown,
  handleOtpPaste,
  handleVerifyOtp,
  handleResendOtp,
  handleResetPassword,
  setStep,
}: NavbarAuthModalProps) {
  const [mounted, setMounted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => setMounted(true), []);

  // Clear stale inline errors whenever the modal closes or the step changes
  useEffect(() => {
    setFieldErrors({});
  }, [isOpen, step]);

  const validateLogin = () => {
    const next: { email?: string; password?: string } = {};
    const cleanEmail = email.trim();
    if (!cleanEmail) next.email = 'Email address is required.';
    else if (!EMAIL_RE.test(cleanEmail)) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Password is required.';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters.';
    setFieldErrors(next);
    return next;
  };

  const submitLogin = (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // block duplicate submissions while a request is in flight
    const problems = validateLogin();
    if (problems.email || problems.password) {
      setError('');
      const first = problems.email ? 'kv-login-email' : 'kv-login-password';
      document.getElementById(first)?.focus();
      return;
    }
    handleEmailAuth(e);
  };

  // Lock page scroll while the modal is open
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!mounted) return null;

  // Portaled to <body> so no transformed/filtered ancestor can shrink the fixed backdrop.
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="chrome-scope fixed inset-0 z-[1000] flex items-center justify-center p-0 text-[#111111] md:p-6"
          style={{ background: 'rgba(17,17,17,0.72)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex w-full justify-center"
            style={{ backgroundImage: METAL_BG }}
          >
            <main className="relative z-10 w-full max-w-[920px]">
              <div className="relative grid max-h-screen w-full grid-cols-1 overflow-y-auto overflow-x-hidden bg-[#F7F7F7] shadow-[0_40px_100px_rgba(0,0,0,0.35)] md:h-[580px] md:max-h-[calc(100vh-48px)] md:grid-cols-[42%_58%] md:overflow-hidden md:rounded-[6px] lg:grid-cols-2">
                {/* Close */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="absolute right-4 top-4 z-50 flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#E5E5E5] bg-white text-[#111111] shadow-sm transition hover:border-[#222222] hover:bg-[#F7F7F7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E53935]/30"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>

                {/* Photo / brand panel */}
                <div
                  className="relative h-[190px] overflow-hidden bg-[position:62%_4%] md:h-full md:bg-[position:62%_18%]"
                  style={PHOTO_STYLE}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(10,10,10,0.92)_0%,rgba(10,10,10,0.55)_28%,rgba(10,10,10,0)_58%,rgba(10,10,10,0.35)_100%)]" />

                  <Link
                    href="/"
                    aria-label="Kovenik home"
                    className="absolute left-5 top-5 z-[2] block md:left-8 md:top-8"
                  >
                    <Wordmark />
                  </Link>

                  <h2
                    className="absolute bottom-5 left-5 z-[2] text-[32px] font-bold leading-none text-[#F7F7F7] md:bottom-9 md:left-8 md:text-[40px] lg:left-9 lg:text-[48px]"
                    style={{ fontFamily: SERIF }}
                  >
                    Wear Your
                    <span className="block text-[#E53935]">Essence.</span>
                  </h2>
                </div>

                {/* Form panel */}
                <div
                  className="relative flex flex-col justify-center bg-[#F7F7F7] px-5 pb-8 pt-6 md:overflow-y-auto md:p-8 lg:p-12"
                  style={{ backgroundImage: CARD_BG }}
                >

                  <div className="relative">
                    <AnimatePresence mode="wait">
                      {/* LOGIN */}
                      {step === 'LOGIN' && (
                        <motion.div
                          key="login"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="mb-5 text-center">
                            <h1
                              className="text-[36px] font-bold leading-none tracking-[-0.01em] text-[#111111]"
                              style={{ fontFamily: SERIF }}
                            >
                              Welcome <span className="text-[#E53935]">Back</span>
                            </h1>
                            <p className="mx-auto mt-3 max-w-[340px] text-[14px] leading-5 text-[#4A4A4A]">
                              Sign in to your account and continue your style journey.
                            </p>
                          </div>

                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              role="alert"
                              className={ERROR_CLASS}
                            >
                              {error}
                            </motion.div>
                          )}

                          <form onSubmit={submitLogin} noValidate className="mx-auto max-w-[360px] space-y-4">
                            <label className="block">
                              <span className={LABEL_CLASS}>Email Address</span>

                              <div className="relative">
                                <Mail
                                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#E53935]"
                                  strokeWidth={1.4}
                                />

                                <input
                                  id="kv-login-email"
                                  type="email"
                                  value={email}
                                  onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
                                  }}
                                  placeholder="Email address"
                                  autoComplete="email"
                                  disabled={isLoading}
                                  aria-invalid={!!fieldErrors.email}
                                  aria-describedby={fieldErrors.email ? 'kv-login-email-err' : undefined}
                                  className={`${INPUT_CLASS} ${fieldErrors.email ? INPUT_ERR_CLASS : INPUT_OK_CLASS}`}
                                />
                              </div>
                              {fieldErrors.email && (
                                <p id="kv-login-email-err" role="alert" className={FIELD_ERROR_CLASS}>
                                  {fieldErrors.email}
                                </p>
                              )}
                            </label>

                            <label className="block">
                              <span className={LABEL_CLASS}>Password</span>

                              <div className="relative">
                                <Lock
                                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#E53935]"
                                  strokeWidth={1.4}
                                />

                                <input
                                  id="kv-login-password"
                                  type={showPassword ? 'text' : 'password'}
                                  value={password}
                                  onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
                                  }}
                                  placeholder="Password"
                                  autoComplete="current-password"
                                  disabled={isLoading}
                                  aria-invalid={!!fieldErrors.password}
                                  aria-describedby={fieldErrors.password ? 'kv-login-password-err' : undefined}
                                  className={`${INPUT_CLASS} pr-12 ${fieldErrors.password ? INPUT_ERR_CLASS : INPUT_OK_CLASS}`}
                                />

                                <button
                                  type="button"
                                  onClick={() => setShowPassword((v) => !v)}
                                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[#E53935] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/40"
                                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                                  ) : (
                                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                                  )}
                                </button>
                              </div>
                              {fieldErrors.password && (
                                <p id="kv-login-password-err" role="alert" className={FIELD_ERROR_CLASS}>
                                  {fieldErrors.password}
                                </p>
                              )}
                            </label>

                            <div className="flex items-center justify-between gap-3">
                              <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#4A4A4A]">
                                <input
                                  type="checkbox"
                                  checked={rememberMe}
                                  onChange={(e) => setRememberMe(e.target.checked)}
                                  className="h-3.5 w-3.5 accent-[#E53935]"
                                />
                                Remember me
                              </label>

                              <button
                                type="button"
                                onClick={handleForgotPassword}
                                disabled={isLoading}
                                className="shrink-0 text-[12px] font-semibold text-[#E53935] transition hover:text-[#111111] focus-visible:outline-none focus-visible:underline disabled:opacity-50"
                              >
                                Forgot password?
                              </button>
                            </div>

                            <button type="submit" disabled={isLoading} aria-busy={isLoading} className={GOLD_BUTTON_CLASS}>
                              {isLoading ? (
                                <>
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                  PLEASE WAIT...
                                </>
                              ) : (
                                <>
                                  CONTINUE
                                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                                </>
                              )}
                            </button>
                          </form>

                          <div className="mx-auto my-4 flex max-w-[360px] items-center gap-4">
                            <div className="h-px flex-1 bg-[#111111]/20" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#4A4A4A]">
                              OR
                            </span>
                            <div className="h-px flex-1 bg-[#111111]/20" />
                          </div>

                          <div
                            className={`group relative mx-auto h-[50px] w-full max-w-[360px] rounded-[6px] focus-within:ring-4 focus-within:ring-[#111111]/15 ${
                              isGoogleLoading ? 'opacity-70' : ''
                            }`}
                          >
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 rounded-[6px] border border-[#111111]/20 bg-[#FFFFFF]/80 text-[13px] font-medium text-[#111111] transition group-hover:border-[#111111]/60 group-hover:bg-[#F7F7F7]">
                              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.95h5.22a4.46 4.46 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.22Z"/>
                                <path fill="#34A853" d="M12 21.72c2.63 0 4.84-.87 6.45-2.35l-3.14-2.43c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.51A9.74 9.74 0 0 0 12 21.72Z"/>
                                <path fill="#FBBC05" d="M6.54 13.84A5.85 5.85 0 0 1 6.24 12c0-.64.11-1.26.3-1.84V7.65H3.3A9.74 9.74 0 0 0 2.28 12c0 1.57.38 3.05 1.02 4.35l3.24-2.51Z"/>
                                <path fill="#EA4335" d="M12 6.13c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.25 14.63 2.28 12 2.28a9.74 9.74 0 0 0-8.7 5.37l3.24 2.51C7.31 7.85 9.46 6.13 12 6.13Z"/>
                              </svg>
                              {isGoogleLoading ? 'Connecting to Google…' : 'Continue with Google'}
                            </div>

                            <div
                              ref={googleButtonRef}
                              className={`absolute inset-0 z-10 h-full w-full overflow-hidden opacity-[0.01] ${
                                isGoogleLoading ? 'cursor-wait' : 'cursor-pointer'
                              }`}
                              aria-label="Continue with Google"
                            />
                          </div>

                          <p className="mx-auto mt-5 max-w-[360px] text-center text-[12px] text-[#4A4A4A]">
                            New to KOVENIK? Enter your email and password above to create an account.
                          </p>
                        </motion.div>
                      )}

                      {/* OTP */}
                      {step === 'OTP' && (
                        <motion.div
                          key="otp"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="mb-8 text-center">
                            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#111111]/20 bg-[#FFFFFF]">
                              <Mail className="h-5 w-5 text-[#E53935]" strokeWidth={1.4} />
                            </div>

                            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#E53935]">
                              Secure Verification
                            </p>

                            <h1
                              className="text-[34px] font-normal leading-none tracking-[-0.03em] text-[#111111] sm:text-[38px]"
                              style={{ fontFamily: SERIF }}
                            >
                              Verify Your Email
                            </h1>

                            <p className="mt-4 text-[13px] leading-5 text-[#4A4A4A]">
                              Enter the six-digit code sent to
                            </p>

                            <p className="mt-1 break-all text-[13px] font-semibold text-[#4A4A4A]">
                              {email}
                            </p>
                          </div>

                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              role="alert"
                              className={ERROR_CLASS}
                            >
                              {error}
                            </motion.div>
                          )}

                          <form onSubmit={handleVerifyOtp} className="mx-auto max-w-[460px] space-y-4">
                            <div
                              className="flex justify-center gap-2 sm:gap-3"
                              onPaste={handleOtpPaste}
                            >
                              {otp.map((digit, index) => (
                                <input
                                  key={index}
                                  ref={(element) => {
                                    otpInputs.current[index] = element;
                                  }}
                                  type="text"
                                  inputMode="numeric"
                                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                                  maxLength={1}
                                  value={digit}
                                  onChange={(e) => handleOtpChange(e.target.value, index)}
                                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                  className="h-12 w-11 rounded-[6px] border border-[#111111]/20 bg-[#FFFFFF]/80 text-center text-lg font-bold text-[#111111] outline-none transition focus:border-[#111111]/60 focus:ring-4 focus:ring-[#111111]/15 sm:h-[54px] sm:w-[52px]"
                                  aria-label={`OTP digit ${index + 1}`}
                                />
                              ))}
                            </div>

                            <div className="flex items-center justify-between text-[12px] text-[#4A4A4A]">
                              {canResend ? (
                                <button
                                  type="button"
                                  onClick={handleResendOtp}
                                  disabled={isLoading}
                                  className="font-bold text-[#E53935] hover:text-[#111111] disabled:opacity-50"
                                >
                                  RESEND OTP
                                </button>
                              ) : (
                                <span>
                                  Resend in{' '}
                                  <strong className="text-[#111111]">
                                    00:{otpTimer < 10 ? `0${otpTimer}` : otpTimer}
                                  </strong>
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setError('');
                                  setOtp(Array(6).fill(''));
                                  setResetToken('');
                                  setOtpPurpose('login');
                                  setStep('LOGIN');
                                }}
                                className="hover:text-[#111111]"
                              >
                                ← Back to login
                              </button>
                            </div>

                            <button
                              type="submit"
                              disabled={otp.join('').length !== 6 || isLoading}
                              className={GOLD_BUTTON_CLASS}
                            >
                              {isLoading ? (
                                <>
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                  VERIFYING...
                                </>
                              ) : (
                                <>
                                  VERIFY & CONTINUE
                                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                                </>
                              )}
                            </button>
                          </form>
                        </motion.div>
                      )}

                      {/* RESET PASSWORD */}
                      {step === 'RESET_PASSWORD' && (
                        <motion.div
                          key="reset-password"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="mb-8 text-center">
                            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#111111]/20 bg-[#FFFFFF]">
                              <Lock className="h-5 w-5 text-[#E53935]" strokeWidth={1.4} />
                            </div>

                            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#E53935]">
                              Secure Reset
                            </p>

                            <h1
                              className="text-[34px] font-normal leading-none tracking-[-0.03em] text-[#111111] sm:text-[38px]"
                              style={{ fontFamily: SERIF }}
                            >
                              Create New Password
                            </h1>

                            <p className="mt-4 text-[13px] leading-5 text-[#4A4A4A]">
                              Create a new password for your KOVENIK account.
                            </p>
                          </div>

                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              role="alert"
                              className={ERROR_CLASS}
                            >
                              {error}
                            </motion.div>
                          )}

                          <form onSubmit={handleResetPassword} className="mx-auto max-w-[460px] space-y-4">
                            <label className="block">
                              <span className={LABEL_CLASS}>New Password</span>

                              <div className="relative">
                                <Lock
                                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#E53935]"
                                  strokeWidth={1.4}
                                />

                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="Enter your new password"
                                  autoComplete="new-password"
                                  className={`${INPUT_CLASS} pr-12`}
                                />

                                <button
                                  type="button"
                                  onClick={() => setShowPassword((v) => !v)}
                                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[#E53935] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/40"
                                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                                  ) : (
                                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                                  )}
                                </button>
                              </div>
                            </label>

                            <button
                              type="submit"
                              disabled={password.length < 8 || isLoading}
                              className={GOLD_BUTTON_CLASS}
                            >
                              {isLoading ? (
                                <>
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                  RESETTING...
                                </>
                              ) : (
                                <>
                                  RESET PASSWORD
                                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setError('');
                                setResetToken('');
                                setPassword('');
                                setOtp(Array(6).fill(''));
                                setOtpPurpose('login');
                                setStep('LOGIN');
                              }}
                              className="w-full text-center text-[12px] text-[#4A4A4A] hover:text-[#111111]"
                            >
                              ← Back to login
                            </button>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </main>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
