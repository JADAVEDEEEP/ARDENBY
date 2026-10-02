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
  Clock3,
  Eye,
  EyeOff,
  Inbox,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';

const ARDENBY_LOGO_STYLE = {
  color: '#F5F3EE',
  fontFamily:
    'Bodoni MT, Didot, Cormorant Garamond, Times New Roman, serif',
  backgroundImage: `
    radial-gradient(circle at 3% 45%, #D4AF37 0 2px, transparent 2.5px),
    radial-gradient(circle at 7% 20%, #8B1E1E 0 1.5px, transparent 2px),
    radial-gradient(circle at 12% 75%, #A52A2A 0 3px, transparent 3.5px),
    radial-gradient(circle at 18% 8%, #D4AF37 0 2px, transparent 2.5px),
    radial-gradient(circle at 25% 92%, #8B1E1E 0 1.5px, transparent 2px),
    radial-gradient(circle at 34% 3%, #E6CA65 0 3px, transparent 3.5px),
    radial-gradient(circle at 43% 95%, #A52A2A 0 2px, transparent 2.5px),
    radial-gradient(circle at 52% 4%, #D4AF37 0 1.5px, transparent 2px),
    radial-gradient(circle at 62% 94%, #8B1E1E 0 3px, transparent 3.5px),
    radial-gradient(circle at 71% 7%, #D4AF37 0 2px, transparent 2.5px),
    radial-gradient(circle at 79% 91%, #A52A2A 0 2px, transparent 2.5px),
    radial-gradient(circle at 88% 15%, #E6CA65 0 3px, transparent 3.5px),
    radial-gradient(circle at 94% 48%, #D4AF37 0 2px, transparent 2.5px),
    radial-gradient(circle at 98% 78%, #8B1E1E 0 3px, transparent 3.5px)
  `,
  backgroundRepeat: 'no-repeat',
  textShadow: `
    2px 0 0 rgba(139,30,30,0.85),
    -2px 0 0 rgba(80,15,15,0.65),
    0 4px 0 rgba(212,175,55,0.45),
    0 8px 18px rgba(0,0,0,0.6)
  `,
};

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
        <div className="fixed inset-0 z-[9999] h-screen overflow-hidden bg-[#050505] text-[#F5F3EE]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-screen overflow-hidden bg-[#050505]"
          >
            <div className="pointer-events-none absolute inset-0 opacity-90" style={{ backgroundImage: `radial-gradient(circle at 50% -10%, rgba(212,175,55,.18), transparent 34%), radial-gradient(circle at 8% 55%, rgba(139,30,30,.10), transparent 28%), radial-gradient(circle at 92% 70%, rgba(212,175,55,.08), transparent 30%), linear-gradient(115deg, #050505 0%, #11100d 46%, #050505 100%)` }} />
            <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: `repeating-linear-gradient(105deg, transparent 0, transparent 5px, rgba(255,255,255,.08) 6px, transparent 7px), repeating-linear-gradient(15deg, transparent 0, transparent 9px, rgba(212,175,55,.04) 10px, transparent 11px)` }} />

            {/* Top brand bar */}
            <header className="relative z-20 flex h-[58px] items-center justify-between border-b border-[#3b3020] bg-black/30 px-5 backdrop-blur-xl sm:px-8 lg:px-12">
              <Link
                href="/"
                className="group relative inline-flex flex-col items-center justify-center"
                aria-label="Kovenik home"
              >
                <span
                  className="relative inline-block text-[31px] font-bold uppercase leading-none tracking-[-0.075em] transition-all duration-300 group-hover:scale-[1.015] sm:text-[35px]"
                  style={ARDENBY_LOGO_STYLE}
                >
                  KOVENIK
                </span>
                <span
                  className="absolute -bottom-[6px] left-1/2 h-[1px] w-0 -translate-x-1/2 transition-all duration-500 group-hover:w-[72%]"
                  style={{ backgroundColor: '#D4AF37' }}
                />
                <span
                  className="mt-1.5 text-[6.5px] uppercase tracking-[0.32em]"
                  style={{ color: '#D4AF37' }}
                >
                  Wear Your Essence
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#51452f] bg-black/30 text-[#c8bda8] backdrop-blur-md transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#F5F3EE]"
                aria-label="Close"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </header>

            {/* Premium wide authentication shell */}
            <main className="relative z-10 flex h-[calc(100vh-58px)] items-center justify-center overflow-hidden px-4 py-3 sm:px-8">
              <div className="w-full max-w-[1040px]">
                <div className="relative grid rounded-[4px] border border-[#4a3b25] bg-[#090908]/95 shadow-[0_30px_90px_rgba(0,0,0,.72),0_0_55px_rgba(212,175,55,.06)] backdrop-blur-2xl lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="relative hidden min-h-[500px] overflow-hidden border-r border-[#3d3222] bg-[#0d0c0a] lg:flex lg:flex-col lg:justify-between lg:p-10">
                    <div className="pointer-events-none absolute inset-0 opacity-80" style={{ backgroundImage: `radial-gradient(circle at 20% 15%, rgba(212,175,55,.16), transparent 30%), radial-gradient(circle at 85% 80%, rgba(139,30,30,.12), transparent 32%), linear-gradient(145deg, rgba(255,255,255,.025), transparent 45%)` }} />
                    <div className="pointer-events-none absolute -right-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border border-[#D4AF37]/10" />
                    <div className="pointer-events-none absolute -right-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border border-[#D4AF37]/10" />

                    <div className="relative z-10">
                      <p className="text-[8px] font-bold uppercase tracking-[0.38em] text-[#D4AF37]">
                        KOVENIK ATELIER
                      </p>
                      <div className="mt-5 h-px w-14 bg-[#D4AF37]/60" />
                      <h2 className="mt-6 max-w-[290px] text-[42px] font-normal leading-[0.94] tracking-[-0.045em] text-[#F5F3EE]" style={{ fontFamily: 'Bodoni MT, Didot, Cormorant Garamond, Times New Roman, serif' }}>
                        Wear Your
                        <span className="block text-[#D4AF37]">Essence.</span>
                      </h2>
                      <p className="mt-5 max-w-[270px] text-[11px] leading-5 text-[#938a7c]">
                        Your wardrobe, your identity, your signature. Enter the KOVENIK world and continue your style journey.
                      </p>
                    </div>

                    <div className="relative z-10">
                      <div className="mb-5 flex items-center gap-3">
                        <span className="h-px w-10 bg-[#D4AF37]/40" />
                        <span className="text-[7px] uppercase tracking-[0.28em] text-[#756b5d]">
                          EST. KOVENIK
                        </span>
                      </div>
                      <p className="text-[8px] uppercase tracking-[0.25em] text-[#625a4e]">
                        Crafted for the ones who stand apart.
                      </p>
                    </div>
                  </div>

                  <div className="relative overflow-visible px-6 py-5 sm:px-10 sm:py-6 lg:px-12 lg:py-7">
                  <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />
                  <div className="pointer-events-none absolute -left-24 -top-24 h-48 w-48 rounded-full bg-[#D4AF37]/[0.07] blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-[#8B1E1E]/[0.08] blur-3xl" />
                    <div className="mb-3 flex items-center justify-center gap-3 text-[7px] font-bold uppercase tracking-[0.42em] text-[#D4AF37]/80">
                  <span className="h-px w-8 bg-[#D4AF37]/40" />
                  KOVENIK ATELIER
                  <span className="h-px w-8 bg-[#D4AF37]/40" />
                </div>

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
                      <div className="mb-4 pt-2 text-center">
                        <h1
                          className="text-[32px] font-normal leading-none tracking-[-0.035em] text-[#FFFFFF] sm:text-[42px]"
                          style={{ fontFamily: 'Bodoni MT, Didot, Cormorant Garamond, Times New Roman, serif' }}
                        >
                          Sign in to KOVENIK
                        </h1>

                        <p className="mx-auto mt-1 max-w-[500px] text-[11px] leading-4 text-[#D6D0C7]">
                          Access your account and continue your style journey.
                        </p>
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-5 border border-red-900/60 bg-red-950/40 px-4 py-3 text-center text-xs text-red-300"
                        >
                          {error}
                        </motion.div>
                      )}

                      <form onSubmit={handleEmailAuth} className="mx-auto max-w-[620px] space-y-2.5">
                        <label className="block">
                          <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#E4DED5]">
                            Email Address
                          </span>

                          <div className="relative">
                            <Mail
                              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#81786b]"
                              strokeWidth={1.4}
                            />

                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@example.com"
                              autoComplete="email"
                              className="h-[44px] w-full rounded-[2px] border border-[#5a4d39] bg-[#11100e] px-11 text-[13px] text-[#FFFFFF] outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 placeholder:text-[#746c60]"
                            />
                          </div>
                        </label>

                        <label className="block">
                          <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#E4DED5]">
                            Password
                          </span>

                          <div className="relative">
                            <Lock
                              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#81786b]"
                              strokeWidth={1.4}
                            />

                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your password"
                              autoComplete="current-password"
                              className="h-[44px] w-full rounded-[2px] border border-[#5a4d39] bg-[#11100e] px-11 pr-12 text-[13px] text-[#FFFFFF] outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 placeholder:text-[#746c60]"
                            />

                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-[#928980] hover:text-[#F5F3EE]"
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
                          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[#a89e8e]">
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
                            className="text-[11px] font-semibold text-[#D4AF37] transition hover:text-[#F5F3EE] disabled:opacity-50"
                          >
                            Forgot password?
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex h-[46px] w-full items-center justify-center gap-3 rounded-[3px] bg-gradient-to-r from-[#7A1717] via-[#C7A24A] to-[#7A1717] px-6 text-[10px] font-bold tracking-[0.22em] text-[#120D08] shadow-[inset_0_1px_0_rgba(255,255,255,.28),0_8px_24px_rgba(180,130,45,.16)] transition duration-300 hover:from-[#8F2020] hover:via-[#D8B75C] hover:to-[#8F2020] hover:shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_12px_30px_rgba(190,140,55,.25)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
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

                      <div className="my-3 flex items-center gap-4">
                        <div className="h-px flex-1 bg-[#E1DBD3]" />
                        <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-[#746b5d]">
                          OR
                        </span>
                        <div className="h-px flex-1 bg-[#E1DBD3]" />
                      </div>

                      <div className="group relative mx-auto h-[44px] w-full max-w-[620px]">
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 rounded-[3px] border border-[#5a4d39] bg-[#11100e] text-[12px] font-medium text-[#FFFFFF] transition group-hover:border-[#BFA16E] group-hover:bg-[#15130f]">
                          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
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

                      <div className="mt-3 border-t border-[#342d23] pt-5 text-center">
                        <p className="text-[7px] uppercase tracking-[0.22em] text-[#71685b]">
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
                        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#59492f] bg-[#0d0d0c]">
                          <Mail className="h-5 w-5 text-[#B58A4B]" strokeWidth={1.4} />
                        </div>

                        <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
                          Secure Verification
                        </p>

                        <h1
                          className="text-[36px] font-normal leading-none tracking-[-0.03em] text-[#F5F3EE]"
                          style={{ fontFamily: 'Bodoni MT, Didot, Cormorant Garamond, Times New Roman, serif' }}
                        >
                          Verify Your Email
                        </h1>

                        <p className="mt-4 text-[12px] leading-5 text-[#9f9585]">
                          Enter the six-digit code sent to
                        </p>

                        <p className="mt-1 break-all text-[12px] font-semibold text-[#e9dfcf]">
                          {email}
                        </p>
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-5 border border-red-900/60 bg-red-950/40 px-4 py-3 text-center text-xs text-red-300"
                        >
                          {error}
                        </motion.div>
                      )}

                      <form onSubmit={handleVerifyOtp} className="mx-auto max-w-[600px] space-y-2.5">
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
                              className="h-12 w-11 border border-[#4a4031] bg-[#0d0d0c] text-center text-lg font-bold text-[#F5F3EE] outline-none transition focus:border-[#B58A4B] focus:ring-4 focus:ring-[#D4AF37]/10 sm:h-[52px] sm:w-[50px]"
                              aria-label={`OTP digit ${index + 1}`}
                            />
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#9c9282]">
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
                          className="flex h-[46px] w-full items-center justify-center gap-3 rounded-[3px] bg-gradient-to-r from-[#7A1717] via-[#C7A24A] to-[#7A1717] text-[10px] font-bold tracking-[0.2em] text-[#120D08] shadow-[inset_0_1px_0_rgba(255,255,255,.28),0_8px_24px_rgba(180,130,45,.16)] transition duration-300 hover:from-[#8F2020] hover:via-[#D8B75C] hover:to-[#8F2020] hover:shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_12px_30px_rgba(190,140,55,.25)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
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
                        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#59492f] bg-[#0d0d0c]">
                          <Lock className="h-5 w-5 text-[#B58A4B]" strokeWidth={1.4} />
                        </div>

                        <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
                          Secure Reset
                        </p>

                        <h1
                          className="text-[36px] font-normal leading-none tracking-[-0.03em] text-[#F5F3EE]"
                          style={{ fontFamily: 'Bodoni MT, Didot, Cormorant Garamond, Times New Roman, serif' }}
                        >
                          Create New Password
                        </h1>

                        <p className="mt-4 text-[12px] leading-5 text-[#9f9585]">
                          Create a new password for your KOVENIK account.
                        </p>
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-5 border border-red-900/60 bg-red-950/40 px-4 py-3 text-center text-xs text-red-300"
                        >
                          {error}
                        </motion.div>
                      )}

                      <form onSubmit={handleResetPassword} className="mx-auto max-w-[600px] space-y-2.5">
                        <label className="block">
                          <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#E4DED5]">
                            New Password
                          </span>

                          <div className="relative">
                            <Lock
                              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#81786b]"
                              strokeWidth={1.4}
                            />

                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your new password"
                              autoComplete="new-password"
                              className="h-[44px] w-full rounded-[2px] border border-[#5a4d39] bg-[#11100e] px-11 pr-12 text-[13px] text-[#FFFFFF] outline-none transition focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 placeholder:text-[#746c60]"
                            />

                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-[#928980] hover:text-[#F5F3EE]"
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
                          className="flex h-[46px] w-full items-center justify-center gap-3 rounded-[3px] bg-gradient-to-r from-[#7A1717] via-[#C7A24A] to-[#7A1717] text-[10px] font-bold tracking-[0.2em] text-[#120D08] shadow-[inset_0_1px_0_rgba(255,255,255,.28),0_8px_24px_rgba(180,130,45,.16)] transition duration-300 hover:from-[#8F2020] hover:via-[#D8B75C] hover:to-[#8F2020] hover:shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_12px_30px_rgba(190,140,55,.25)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
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
                          className="w-full text-center text-[11px] text-[#9c9282] hover:text-[#F5F3EE]"
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
