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
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Crown,
  Eye,
  EyeOff,
  Gem,
  Lock,
  Mail,
  Sparkles,
  X,
} from 'lucide-react';

const SERIF = 'Bodoni MT, Didot, Cormorant Garamond, Times New Roman, serif';

const GOLD_TEXT_STYLE = {
  fontFamily: SERIF,
  backgroundImage:
    'linear-gradient(180deg, #F3DFA2 0%, #D4AF37 45%, #8F6B1E 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.55))',
} as const;

const PHOTO_STYLE = {
  backgroundImage: "url('/images/hero-olive-graphic.jpg')",
  backgroundSize: 'cover',
  backgroundPosition: 'center top',
} as const;

const METAL_BG = `
  radial-gradient(circle at 50% -10%, rgba(212,175,55,.14), transparent 38%),
  radial-gradient(circle at 10% 60%, rgba(32,92,62,.35), transparent 45%),
  radial-gradient(circle at 92% 75%, rgba(212,175,55,.07), transparent 35%),
  linear-gradient(135deg, #03130d 0%, #082519 48%, #031009 100%)
`;

const CARD_BG = `
  linear-gradient(160deg, rgba(14,48,34,.96) 0%, rgba(5,24,16,.97) 55%, rgba(3,16,10,.98) 100%)
`;

const INPUT_CLASS =
  'h-[50px] w-full rounded-[6px] border border-[#8f7a3e]/60 bg-[#04150e]/80 px-11 text-[14px] text-[#F5F3EE] outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/15 placeholder:text-[#8a9a8f]';

const GOLD_BUTTON_CLASS =
  'flex h-[52px] w-full items-center justify-center gap-3 rounded-[6px] bg-gradient-to-b from-[#E6CB7A] via-[#C9A344] to-[#9A7424] px-6 text-[13px] font-bold tracking-[0.12em] text-[#0A1A12] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_10px_28px_rgba(212,175,55,.2)] transition duration-300 hover:from-[#F0D98E] hover:via-[#D6B24F] hover:to-[#A98027] hover:shadow-[inset_0_1px_0_rgba(255,255,255,.55),0_14px_34px_rgba(212,175,55,.32)] disabled:cursor-not-allowed disabled:opacity-50';

const LABEL_CLASS =
  'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#E4DED5]';

const ERROR_CLASS =
  'mb-5 rounded-[4px] border border-red-900/60 bg-red-950/40 px-4 py-3 text-center text-xs text-red-300';

const FEATURES = [
  { icon: Crown, label: 'Premium Quality' },
  { icon: Gem, label: 'Exclusive Drops' },
  { icon: Sparkles, label: 'Limited Editions' },
];

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
    <div className={`flex flex-col items-center ${className}`}>
      <span
        className="text-[34px] font-semibold uppercase leading-none tracking-[-0.02em] sm:text-[40px]"
        style={GOLD_TEXT_STYLE}
      >
        KOVENIK
      </span>
      <span className="mt-2 text-[8px] font-semibold uppercase tracking-[0.42em] text-[#D4AF37]">
        Wear Your Essence
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
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] h-screen overflow-hidden bg-[#031009] text-[#F5F3EE]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-screen overflow-y-auto overflow-x-hidden"
            style={{ backgroundImage: METAL_BG }}
          >
            {/* Brushed-metal texture */}
            <div
              className="pointer-events-none fixed inset-0 opacity-[0.10]"
              style={{
                backgroundImage: `repeating-linear-gradient(105deg, transparent 0, transparent 5px, rgba(255,255,255,.08) 6px, transparent 7px), repeating-linear-gradient(15deg, transparent 0, transparent 9px, rgba(212,175,55,.05) 10px, transparent 11px)`,
              }}
            />

            {/* Close */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="fixed right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-[#8f7a3e]/70 bg-black/40 text-[#E6CB7A] backdrop-blur-md transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#F5F3EE] sm:right-6 sm:top-6"
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>

            <main className="relative z-10 flex min-h-screen items-center justify-center p-0 lg:p-8">
              <div className="relative grid w-full max-w-[1180px] overflow-hidden border-[#8f7a3e]/60 bg-[#04150e] shadow-[0_30px_90px_rgba(0,0,0,.7),0_0_60px_rgba(212,175,55,.07)] lg:min-h-[640px] lg:grid-cols-[1.05fr_0.95fr] lg:border">
                {/* Photo / brand panel */}
                <div
                  className="relative flex min-h-[250px] flex-col justify-between overflow-hidden lg:min-h-full lg:p-12"
                  style={PHOTO_STYLE}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#031009]/70 via-[#05261a]/35 to-[#031009] lg:bg-gradient-to-tr lg:from-[#031009]/90 lg:via-[#05261a]/30 lg:to-[#031009]/50" />
                  <div className="pointer-events-none absolute inset-0 bg-[#0b3a26]/25 mix-blend-multiply" />

                  <Link
                    href="/"
                    aria-label="Kovenik home"
                    className="relative z-10 flex justify-center pt-5 lg:block lg:pt-0"
                  >
                    <Wordmark className="lg:items-start" />
                  </Link>

                  <div className="relative z-10 hidden lg:block">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#D4AF37]">
                      KOVENIK ATELIER
                    </p>
                    <div className="mt-4 h-px w-16 bg-[#D4AF37]/70" />
                    <h2
                      className="mt-6 max-w-[320px] text-[56px] font-normal leading-[0.95] tracking-[-0.03em] text-[#F5F3EE]"
                      style={{ fontFamily: SERIF }}
                    >
                      Wear Your
                      <span className="block text-[#D4AF37]">Essence.</span>
                    </h2>
                    <p className="mt-5 max-w-[300px] text-[13px] leading-6 text-[#cfd6cf]">
                      Your wardrobe, your identity, your signature. Enter the KOVENIK world and continue your style journey.
                    </p>

                    <ul className="mt-8 space-y-3">
                      {FEATURES.map(({ icon: Icon, label }) => (
                        <li key={label} className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/60 bg-black/30">
                            <Icon className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.4} />
                          </span>
                          <span className="text-[12px] text-[#E4DED5]">{label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="relative z-10 hidden lg:block">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="h-px w-10 bg-[#D4AF37]/50" />
                      <span className="text-[9px] uppercase tracking-[0.3em] text-[#c9c2b0]">
                        EST. KOVENIK
                      </span>
                    </div>
                    <p className="text-[9px] uppercase tracking-[0.25em] text-[#a8b0a6]">
                      Crafted for the ones who stand apart.
                    </p>
                  </div>
                </div>

                {/* Form panel */}
                <div
                  className="relative -mt-8 rounded-t-[22px] border-t border-[#8f7a3e]/60 px-6 pb-8 pt-8 sm:px-12 lg:mt-0 lg:flex lg:flex-col lg:justify-center lg:rounded-none lg:border-l lg:border-t-0 lg:px-14 lg:py-12"
                  style={{ backgroundImage: CARD_BG }}
                >
                  <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />
                  <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#D4AF37]/[0.07] blur-3xl" />

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
                          <div className="mb-6 text-center">
                            <div className="mx-auto mb-5 hidden h-px w-14 bg-[#D4AF37]/60 lg:block" />
                            <h1
                              className="text-[34px] font-normal leading-none tracking-[-0.03em] text-[#F5F3EE] sm:text-[40px]"
                              style={{ fontFamily: SERIF }}
                            >
                              Welcome <span className="text-[#D4AF37]">Back</span>
                            </h1>
                            <p className="mx-auto mt-3 max-w-[340px] text-[13px] leading-5 text-[#D6D0C7]">
                              Sign in to your account and continue your style journey.
                            </p>
                          </div>

                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={ERROR_CLASS}
                            >
                              {error}
                            </motion.div>
                          )}

                          <form onSubmit={handleEmailAuth} className="mx-auto max-w-[460px] space-y-3.5">
                            <label className="block">
                              <span className={LABEL_CLASS}>Email Address</span>

                              <div className="relative">
                                <Mail
                                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b7a265]"
                                  strokeWidth={1.4}
                                />

                                <input
                                  type="email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="Email address"
                                  autoComplete="email"
                                  className={INPUT_CLASS}
                                />
                              </div>
                            </label>

                            <label className="block">
                              <span className={LABEL_CLASS}>Password</span>

                              <div className="relative">
                                <Lock
                                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b7a265]"
                                  strokeWidth={1.4}
                                />

                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="Password"
                                  autoComplete="current-password"
                                  className={`${INPUT_CLASS} pr-12`}
                                />

                                <button
                                  type="button"
                                  onClick={() => setShowPassword((v) => !v)}
                                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-[#b7a265] hover:text-[#F5F3EE]"
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

                            <div className="flex items-center justify-between">
                              <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#b9c2b8]">
                                <input
                                  type="checkbox"
                                  checked={rememberMe}
                                  onChange={(e) => setRememberMe(e.target.checked)}
                                  className="h-3.5 w-3.5 accent-[#D4AF37]"
                                />
                                Remember me
                              </label>

                              <button
                                type="button"
                                onClick={handleForgotPassword}
                                disabled={isLoading}
                                className="text-[12px] font-semibold text-[#D4AF37] transition hover:text-[#F5F3EE] disabled:opacity-50"
                              >
                                Forgot password?
                              </button>
                            </div>

                            <button type="submit" disabled={isLoading} className={GOLD_BUTTON_CLASS}>
                              {isLoading ? (
                                <>
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A1A12]/20 border-t-[#0A1A12]" />
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

                          <div className="mx-auto my-5 flex max-w-[460px] items-center gap-4">
                            <div className="h-px flex-1 bg-[#8f7a3e]/50" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#b9c2b8]">
                              OR
                            </span>
                            <div className="h-px flex-1 bg-[#8f7a3e]/50" />
                          </div>

                          <div className="group relative mx-auto h-[50px] w-full max-w-[460px]">
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 rounded-[6px] border border-[#8f7a3e]/70 bg-[#04150e]/80 text-[13px] font-medium text-[#F5F3EE] transition group-hover:border-[#D4AF37] group-hover:bg-[#0a2418]">
                              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.95h5.22a4.46 4.46 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.22Z"/>
                                <path fill="#34A853" d="M12 21.72c2.63 0 4.84-.87 6.45-2.35l-3.14-2.43c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.51A9.74 9.74 0 0 0 12 21.72Z"/>
                                <path fill="#FBBC05" d="M6.54 13.84A5.85 5.85 0 0 1 6.24 12c0-.64.11-1.26.3-1.84V7.65H3.3A9.74 9.74 0 0 0 2.28 12c0 1.57.38 3.05 1.02 4.35l3.24-2.51Z"/>
                                <path fill="#EA4335" d="M12 6.13c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.25 14.63 2.28 12 2.28a9.74 9.74 0 0 0-8.7 5.37l3.24 2.51C7.31 7.85 9.46 6.13 12 6.13Z"/>
                              </svg>
                              Continue with Google
                            </div>

                            <div
                              ref={googleButtonRef}
                              className={`absolute inset-0 z-10 h-full w-full overflow-hidden opacity-[0.01] ${
                                isGoogleLoading ? 'cursor-wait' : 'cursor-pointer'
                              }`}
                              aria-label="Continue with Google"
                            />
                          </div>

                          <div className="mx-auto mt-6 max-w-[460px] border-t border-[#8f7a3e]/30 pt-4 text-center">
                            <p className="text-[8px] uppercase tracking-[0.25em] text-[#8a9a8f]">
                              KOVENIK · WEAR YOUR ESSENCE
                            </p>
                          </div>
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
                            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#8f7a3e]/70 bg-[#04150e]">
                              <Mail className="h-5 w-5 text-[#D4AF37]" strokeWidth={1.4} />
                            </div>

                            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
                              Secure Verification
                            </p>

                            <h1
                              className="text-[34px] font-normal leading-none tracking-[-0.03em] text-[#F5F3EE] sm:text-[38px]"
                              style={{ fontFamily: SERIF }}
                            >
                              Verify Your Email
                            </h1>

                            <p className="mt-4 text-[13px] leading-5 text-[#b9c2b8]">
                              Enter the six-digit code sent to
                            </p>

                            <p className="mt-1 break-all text-[13px] font-semibold text-[#F0E6CF]">
                              {email}
                            </p>
                          </div>

                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
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
                                  className="h-12 w-11 rounded-[6px] border border-[#8f7a3e]/60 bg-[#04150e]/80 text-center text-lg font-bold text-[#F5F3EE] outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/15 sm:h-[54px] sm:w-[52px]"
                                  aria-label={`OTP digit ${index + 1}`}
                                />
                              ))}
                            </div>

                            <div className="flex items-center justify-between text-[12px] text-[#b9c2b8]">
                              {canResend ? (
                                <button
                                  type="button"
                                  onClick={handleResendOtp}
                                  disabled={isLoading}
                                  className="font-bold text-[#D4AF37] hover:text-[#F5F3EE] disabled:opacity-50"
                                >
                                  RESEND OTP
                                </button>
                              ) : (
                                <span>
                                  Resend in{' '}
                                  <strong className="text-[#F5F3EE]">
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
                                className="hover:text-[#F5F3EE]"
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
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A1A12]/20 border-t-[#0A1A12]" />
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
                            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#8f7a3e]/70 bg-[#04150e]">
                              <Lock className="h-5 w-5 text-[#D4AF37]" strokeWidth={1.4} />
                            </div>

                            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
                              Secure Reset
                            </p>

                            <h1
                              className="text-[34px] font-normal leading-none tracking-[-0.03em] text-[#F5F3EE] sm:text-[38px]"
                              style={{ fontFamily: SERIF }}
                            >
                              Create New Password
                            </h1>

                            <p className="mt-4 text-[13px] leading-5 text-[#b9c2b8]">
                              Create a new password for your KOVENIK account.
                            </p>
                          </div>

                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
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
                                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b7a265]"
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
                                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-[#b7a265] hover:text-[#F5F3EE]"
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
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A1A12]/20 border-t-[#0A1A12]" />
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
                              className="w-full text-center text-[12px] text-[#b9c2b8] hover:text-[#F5F3EE]"
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
    </AnimatePresence>
  );
}
