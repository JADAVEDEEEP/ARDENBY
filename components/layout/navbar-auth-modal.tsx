'use client';

import { KovenikWordmark } from './kovenik-wordmark';
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
  backgroundImage: "url('/images/login-photo.jpg')",
  backgroundSize: 'cover',
  filter: 'grayscale(1)',
} as const;

/** Photo edges: a curved right edge on desktop, a curved bottom edge on mobile. */
const PHOTO_CLIP_DESKTOP = 'ellipse(100% 87% at 0% 50%)';
const PHOTO_CLIP_MOBILE = 'ellipse(82% 100% at 50% 0%)';

const BRAND_LETTERS = ['K', 'O', 'V', 'E', 'N', 'I', 'K'];

const METAL_BG = 'none';

const CARD_BG = 'none';

const INPUT_CLASS =
  'h-[54px] w-full rounded-none border bg-[#EFEFEF] px-4 text-[15px] text-[#111111] outline-none transition focus:bg-[#F5F5F5] placeholder:text-[#6B6B6B]';

const INPUT_OK_CLASS =
  'border-transparent focus:border-[#111111]';

const INPUT_ERR_CLASS =
  'border-[#C62828] focus:border-[#C62828]';

const GOLD_BUTTON_CLASS =
  'flex h-[56px] w-full items-center justify-center gap-3 rounded-none bg-[#C62828] px-6 text-[15px] font-bold tracking-[0.2em] text-[#FFFFFF] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition duration-200 hover:bg-[#B71C1C] active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C62828]/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#C62828]';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FIELD_ERROR_CLASS = 'mt-1.5 text-[12px] font-medium text-[#C62828]';

const LABEL_CLASS =
  'mb-1.5 block text-[13px] font-bold text-[#222222]';

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
      <KovenikWordmark height={56} />
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
        <div className="chrome-scope fixed inset-0 z-[1000] overflow-y-auto bg-white text-[#111111]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-full"
            style={{ backgroundImage: METAL_BG }}
          >
            <main className="relative z-10 min-h-full">
              <div className="relative grid min-h-screen w-full grid-cols-1 lg:h-screen lg:grid-cols-[46%_auto_minmax(0,1fr)]">
                {/* Close: always visible, 44px, calls the existing close logic */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="fixed right-3 top-3 z-[1010] flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#111111] shadow-[0_2px_10px_rgba(0,0,0,0.25)] transition hover:bg-[#F2F2F2] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C62828]/40 lg:right-5 lg:top-5"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" strokeWidth={1.8} />
                </button>

                {/* Photo: black and white, curved bottom (mobile) / right edge (desktop) */}
                <div aria-hidden="true" className="relative h-[190px] lg:h-full">
                  <div
                    className="absolute inset-0 bg-[position:50%_10%] [clip-path:var(--clip-m)] lg:[clip-path:var(--clip-d)]"
                    style={{
                      ...PHOTO_STYLE,
                      ['--clip-m' as string]: PHOTO_CLIP_MOBILE,
                      ['--clip-d' as string]: PHOTO_CLIP_DESKTOP,
                    }}
                  />
                </div>

                {/* Vertical outlined brand letters (desktop only) */}
                <div aria-hidden="true" className="hidden select-none flex-col items-center justify-between px-6 lg:flex">
                  {BRAND_LETTERS.map((letter, i) => (
                    <span
                      key={i}
                      className="font-sans text-[clamp(64px,11.5vh,112px)] font-light leading-none text-transparent [-webkit-text-stroke:1px_#8A8A8A]"
                    >
                      {letter}
                    </span>
                  ))}
                </div>

                {/* Form panel */}
                <div
                  className="relative flex flex-col items-center justify-center bg-white px-6 pb-10 pt-6 lg:overflow-y-auto lg:px-10 lg:py-12"
                  style={{ backgroundImage: CARD_BG }}
                >
                  <div className="relative w-full max-w-[420px]">
                    <Link
                      href="/"
                      onClick={() => setIsOpen(false)}
                      aria-label="Kovenik home"
                      className="mx-auto mb-3 block w-fit"
                    >
                      <KovenikWordmark height={54} />
                    </Link>

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
                          <div className="mb-6 text-center">
                            <h1
                              className="text-[40px] font-normal uppercase leading-none tracking-[0.18em] text-[#111111] md:text-[44px]"
                              style={{ fontFamily: 'var(--font-inter), Arial, sans-serif' }}
                            >
                              Log in
                            </h1>
                            <span aria-hidden="true" className="mx-auto mt-5 block h-[3px] w-[72px] bg-[#C62828]" />
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

                          <form onSubmit={submitLogin} noValidate className="w-full space-y-4">
                            <label className="block">
                              <span className={LABEL_CLASS}>Email address</span>

                              <div className="relative">
                                <input
                                  id="kv-login-email"
                                  type="email"
                                  value={email}
                                  onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
                                  }}
                                  placeholder="you@example.com"
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
                                <input
                                  id="kv-login-password"
                                  type={showPassword ? 'text' : 'password'}
                                  value={password}
                                  onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
                                  }}
                                  placeholder="Enter password"
                                  autoComplete="current-password"
                                  disabled={isLoading}
                                  aria-invalid={!!fieldErrors.password}
                                  aria-describedby={fieldErrors.password ? 'kv-login-password-err' : undefined}
                                  className={`${INPUT_CLASS} pr-12 ${fieldErrors.password ? INPUT_ERR_CLASS : INPUT_OK_CLASS}`}
                                />

                                <button
                                  type="button"
                                  onClick={() => setShowPassword((v) => !v)}
                                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[#555555] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C62828]/40"
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
                                  className="h-3.5 w-3.5 accent-[#C62828]"
                                />
                                Remember me
                              </label>

                              <button
                                type="button"
                                onClick={handleForgotPassword}
                                disabled={isLoading}
                                className="shrink-0 text-[12px] font-medium text-[#B71C1C] underline underline-offset-2 transition hover:text-[#111111] focus-visible:outline-none disabled:opacity-50"
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
                                'LOG IN'
                              )}
                            </button>
                          </form>

                          <p className="my-3 text-center text-[12px] text-[#555555]">or</p>

                          <div
                            className={`group relative mx-auto h-[50px] w-full rounded-none focus-within:ring-4 focus-within:ring-[#111111]/15 ${
                              isGoogleLoading ? 'opacity-70' : ''
                            }`}
                          >
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 rounded-none border border-[#111111] bg-[#FFFFFF] text-[14px] font-semibold text-[#111111] transition group-hover:bg-[#F5F5F5]">
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

                          <p className="mt-5 text-center text-[12px] leading-5 text-[#555555]">
                            By continuing, you agree to our{' '}
                            <Link href="/terms" onClick={() => setIsOpen(false)} className="text-[#B71C1C] underline underline-offset-2">
                              Terms
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" onClick={() => setIsOpen(false)} className="text-[#B71C1C] underline underline-offset-2">
                              Privacy Policy
                            </Link>
                            .
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

                          <form onSubmit={handleVerifyOtp} className="mx-auto w-full space-y-4">
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
                                  className="h-12 w-11 rounded-none border border-[#111111]/20 bg-[#EFEFEF] text-center text-lg font-bold text-[#111111] outline-none transition focus:border-[#111111]/60 focus:ring-4 focus:ring-[#111111]/15 sm:h-[54px] sm:w-[52px]"
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

                          <form onSubmit={handleResetPassword} className="mx-auto w-full space-y-4">
                            <label className="block">
                              <span className={LABEL_CLASS}>New Password</span>

                              <div className="relative">
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
                                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[#555555] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C62828]/40"
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
