'use client';

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
    <>
      {/* ========================================================
          AUTHENTICATION MODAL
          ARDENBY — premium editorial / street-luxury redesign.
          Existing authentication, OTP and Google logic is preserved.
      ========================================================= */}
      <AnimatePresence>
        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[9999] flex min-h-screen w-screen items-center justify-center bg-black/[0.82] p-3 backdrop-blur-[9px] sm:p-5"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.985 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 flex max-h-[calc(100vh-24px)] w-[900px] max-w-full overflow-hidden rounded-[8px] bg-[#FCFBF8] shadow-[0_32px_100px_rgba(0,0,0,0.45)] sm:max-h-[calc(100vh-40px)]"
            >
              {/* Close */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-5 top-5 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#17130F] transition-all duration-200 hover:bg-white hover:text-[#A27A43] hover:scale-105"
                aria-label="Close"
              >
                <X className="h-[15px] w-[15px]" strokeWidth={1.6} />
              </button>

              {/* =====================================================
                  BRAND / EDITORIAL IMAGE PANEL
              ====================================================== */}
              <div
                className="relative hidden w-[48%] shrink-0 overflow-hidden bg-[#17130F] text-white lg:flex lg:flex-col lg:justify-between"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1603822241945-5bd84c6d81eb?fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000')",
                  backgroundSize: 'cover',
                  backgroundPosition: '72% center',
                }}
              >
                {/* Cinematic overlays — keeps the typography on clean negative space */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/15 to-black/85" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/5" />
                <div className="absolute inset-y-0 left-0 w-[68%] bg-gradient-to-r from-black/45 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-[#2B1D13]/10 mix-blend-multiply" />

                {/* Brand */}
                <div className="relative z-10 px-8 pt-8">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[31px] font-semibold uppercase leading-none tracking-[-0.055em] text-[#E7C98E]"
                      style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
                    >
                      ARDENBY
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="h-px w-7 bg-[#D3B276]" />
                    <span className="text-[7px] font-medium uppercase tracking-[0.42em] text-white/75">
                      WEAR YOUR ESSENCE
                    </span>
                  </div>
                </div>

                {/* Editorial copy */}
                <div className="relative z-10 flex flex-1 flex-col justify-center px-8 py-8">
                  <p className="mb-3 text-[8px] font-bold uppercase tracking-[0.34em] text-[#D8B978]">
                    Private Access
                  </p>

                  <h3
                    className="max-w-[255px] text-[38px] font-normal italic leading-[0.94] tracking-[-0.04em] text-white"
                    style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
                  >
                    More Than
                    <br />
                    Fashion.
                    <br />
                    A Feeling.
                  </h3>

                  <div className="mt-5 h-[2px] w-10 bg-[#D8B978]" />

                  <p className="mt-4 max-w-[235px] text-[8px] font-medium uppercase leading-[1.7] tracking-[0.20em] text-white/65">
                    Timeless pieces
                    <br />
                    for a bolder you.
                  </p>

                  <div className="mt-6 grid max-w-[285px] grid-cols-3 border-t border-white/20 pt-4">
                    <div className="text-left">
                      <Truck className="h-[15px] w-[15px] text-[#D8B978]" strokeWidth={1.3} />
                      <p className="mt-1.5 text-[6px] font-semibold uppercase tracking-[0.14em] text-white/90">Worldwide</p>
                    </div>
                    <div className="border-l border-white/15 pl-4 text-left">
                      <ShieldCheck className="h-[15px] w-[15px] text-[#D8B978]" strokeWidth={1.3} />
                      <p className="mt-1.5 text-[6px] font-semibold uppercase tracking-[0.14em] text-white/90">Secure</p>
                    </div>
                    <div className="border-l border-white/15 pl-4 text-left">
                      <RotateCcw className="h-[15px] w-[15px] text-[#D8B978]" strokeWidth={1.3} />
                      <p className="mt-1.5 text-[6px] font-semibold uppercase tracking-[0.14em] text-white/90">Returns</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-3">
                    <span className="text-[6px] uppercase tracking-[0.28em] text-white/70">
                      01 / 04
                    </span>
                    <span className="text-[6px] uppercase tracking-[0.30em] text-white/70">
                      EST. 2026
                    </span>
                  </div>
                </div>
              </div>

              {/* =====================================================
                  FORM PANEL
              ====================================================== */}
              <div className="relative flex min-h-[500px] flex-1 flex-col justify-center overflow-y-auto bg-[#FCFBF8] px-6 py-10 sm:px-10 lg:px-11">
                {/* Mobile brand */}
                <div className="mb-7 flex flex-col items-center lg:hidden">
                  <div className="relative inline-block">
                    <span
                      className="text-[28px] font-semibold uppercase leading-none tracking-[-0.055em] text-[#B28A56]"
                      style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
                    >
                      ARDENBY
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="h-px w-6 bg-[#C9A96E]" />
                    <span className="text-[6px] uppercase tracking-[0.4em] text-[#9B9185]">
                      WEAR YOUR ESSENCE
                    </span>
                    <span className="h-px w-6 bg-[#C9A96E]" />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {/* LOGIN */}
                  {step === 'LOGIN' && (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22 }}
                      className="mx-auto flex w-full max-w-[390px] flex-col justify-center"
                    >
                      <div className="mb-5">
                        <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.28em] text-[#A77A3E]">
                          Welcome Back
                        </p>

                        <h2
                          className="text-[25px] font-normal leading-[1.12] tracking-[-0.018em] text-[#17120E] sm:text-[27px]"
                          style={{
                            fontFamily: 'Georgia, Times New Roman, serif',
                            fontWeight: 400,
                          }}
                        >
                          Sign in to ARDENBY
                        </h2>

                        <p className="mt-2 max-w-[310px] text-[12px] leading-[1.55] text-[#81776D]">
                          Access your account and continue your style journey.
                        </p>
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-700"
                        >
                          {error}
                        </motion.div>
                      )}

                      <form onSubmit={handleEmailAuth} className="space-y-3">
                        <label className="block">
                          <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.20em] text-[#5F5750]">
                            Email Address
                          </span>

                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#A79D91]" strokeWidth={1.4} />

                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@example.com"
                              autoComplete="email"
                              className="h-[49px] w-full rounded-[3px] border border-[#DED6CD] bg-[#FFFFFF] py-3 pl-10 pr-4 text-[13px] text-[#1A0F0A] outline-none transition-all duration-200 focus:border-[#C9A96E] focus:bg-[#FFFDF9] focus:shadow-[0_0_0_3px_rgba(201,169,110,0.08)] placeholder:text-[#AEA59B]"
                            />
                          </div>
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.20em] text-[#5F5750]">
                            Password
                          </span>

                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#A79D91]" strokeWidth={1.4} />

                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your password"
                              autoComplete="current-password"
                              className="h-[49px] w-full rounded-[3px] border border-[#DED6CD] bg-[#FFFFFF] py-3 pl-10 pr-11 text-[13px] text-[#181614] outline-none transition-all duration-200 focus:border-[#C9A96E] focus:bg-[#FFFDF9] focus:shadow-[0_0_0_3px_rgba(201,169,110,0.08)] placeholder:text-[#AEA59B]"
                            />

                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#999087] transition hover:text-[#181614]"
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

                        <div className="flex items-center justify-between pt-0.5">
                          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#766B63]">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="h-[13px] w-[13px] accent-[#C9A96E]"
                            />
                            Remember me
                          </label>

                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            disabled={isLoading}
                            className="text-[12px] font-medium text-[#B28A56] transition-colors hover:text-[#1A0F0A] disabled:opacity-50"
                          >
                            Forgot password?
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[6px] bg-[#0A0A0A] px-6 text-[11px] font-bold tracking-[0.20em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.005] hover:bg-[#171717] hover:shadow-[0_14px_30px_rgba(10,10,10,0.24)] active:translate-y-0 active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-50"
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

                      <div className="my-3 flex items-center gap-3">
                        <div className="h-px flex-1 bg-[#E4DDD4]" />
                        <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-[#9B9185]">
                          OR
                        </span>
                        <div className="h-px flex-1 bg-[#E4DDD4]" />
                      </div>

                      <div className="group relative h-[46px] w-full">
                        {/* Visible luxury Google button */}
                        <div className="pointer-events-none absolute inset-0 flex h-[46px] w-full items-center justify-center gap-4 rounded-[3px] border border-[#E3DDD5] bg-white px-4 text-[12px] font-medium text-[#3A332E] transition-all duration-200 group-hover:border-[#C9A96E] group-hover:bg-[#FFFDF9]">
                          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.95h5.22a4.46 4.46 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.22Z"/>
                            <path fill="#34A853" d="M12 21.72c2.63 0 4.84-.87 6.45-2.35l-3.14-2.43c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.51A9.74 9.74 0 0 0 12 21.72Z"/>
                            <path fill="#FBBC05" d="M6.54 13.84A5.85 5.85 0 0 1 6.24 12c0-.64.11-1.26.3-1.84V7.65H3.3A9.74 9.74 0 0 0 2.28 12c0 1.57.38 3.05 1.02 4.35l3.24-2.51Z"/>
                            <path fill="#EA4335" d="M12 6.13c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.25 14.63 2.28 12 2.28a9.74 9.74 0 0 0-8.7 5.37l3.24 2.51C7.31 7.85 9.46 6.13 12 6.13Z"/>
                          </svg>
                          <span>Continue with Google</span>
                        </div>

                        {/* Real Google Identity Services button */}
                        <div
                          ref={googleButtonRef}
                          className={`absolute inset-0 z-10 h-[46px] w-full overflow-hidden opacity-[0.01] ${
                            isGoogleLoading ? 'cursor-wait' : 'cursor-pointer'
                          }`}
                          aria-label="Continue with Google"
                        />
                      </div>

                      {/* Trust strip */}
                      <div className="mt-4 grid grid-cols-3 border-t border-[#EDE5D8] pt-3">
                        <div className="text-center">
                          <Truck className="mx-auto h-[17px] w-[17px] text-[#C9A96E]" strokeWidth={1.4} />
                          <p className="mt-1.5 text-[7px] font-bold uppercase tracking-[0.09em] text-[#5F5750]">
                            Free Shipping
                          </p>
                        </div>

                        <div className="border-x border-[#EDE5D8] text-center">
                          <ShieldCheck className="mx-auto h-[17px] w-[17px] text-[#C9A96E]" strokeWidth={1.4} />
                          <p className="mt-1.5 text-[7px] font-bold uppercase tracking-[0.09em] text-[#5F5750]">
                            Secure
                          </p>
                        </div>

                        <div className="text-center">
                          <RotateCcw className="mx-auto h-[17px] w-[17px] text-[#C9A96E]" strokeWidth={1.4} />
                          <p className="mt-1.5 text-[7px] font-bold uppercase tracking-[0.09em] text-[#5F5750]">
                            Easy Returns
                          </p>
                        </div>
                      </div>

                    </motion.div>
                  )}

                  {/* OTP */}
                  {step === 'OTP' && (
                    <motion.div
                      key="otp"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.22 }}
                      className="mx-auto flex w-full max-w-[390px] flex-col justify-center"
                    >
                      <div className="mb-5 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-[#D6CDC0] bg-white">
                          <Mail className="h-5 w-5 text-[#C9A96E]" strokeWidth={1.4} />
                        </div>

                        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.3em] text-[#C9A96E]">
                          Secure Verification
                        </p>

                        <h2
                          className="mt-2 text-[28px] font-normal leading-none tracking-[-0.025em] text-[#1A0F0A] sm:text-[31px]"
                          style={{
                            fontFamily: 'Arial, Helvetica, sans-serif',
                            fontWeight: 400,
                          }}
                        >
                          Verify Your Email
                        </h2>

                        <p className="mx-auto mt-2 max-w-[330px] text-[12px] leading-5 text-[#81796F]">
                          Enter the six-digit code sent to your email.
                        </p>

                        <p className="mt-1 break-all text-xs font-bold text-[#27231F]">
                          {email}
                        </p>
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 border border-red-200 bg-red-50 p-2.5 text-center text-xs text-red-700"
                        >
                          {error}
                        </motion.div>
                      )}

                      <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                        <div
                          className="flex w-full justify-center gap-1.5 sm:gap-3"
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
                              className="h-11 w-11 min-w-0 border border-[#DED6CD] bg-white text-center text-base font-bold text-[#1A0F0A] outline-none transition focus:border-[#C9A96E] focus:bg-[#FFFDF9] focus:shadow-[0_0_0_3px_rgba(201,169,110,0.08)] sm:h-[50px] sm:w-[47px] sm:text-lg"
                              aria-label={`OTP digit ${index + 1}`}
                            />
                          ))}
                        </div>

                        <div className="flex items-center justify-between gap-3 text-[12px] text-[#7A6E65]">
                          {canResend ? (
                            <button
                              type="button"
                              onClick={handleResendOtp}
                              disabled={isLoading}
                              className="font-bold text-[#A07845] transition hover:text-[#181614] disabled:opacity-50"
                            >
                              RESEND OTP
                            </button>
                          ) : (
                            <span>
                              Resend in{' '}
                              <strong className="text-[#181614]">
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
                            className="transition hover:text-[#181614]"
                          >
                            ← Back to login
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={otp.join('').length !== 6 || isLoading}
                          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[3px] bg-[#0A0A0A] px-6 text-[11px] font-bold tracking-[0.18em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#151515] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                              VERIFYING...
                            </>
                          ) : (
                            <>
                              VERIFY &amp; CONTINUE
                              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                            </>
                          )}
                        </button>
                      </form>

                      <div className="mt-6 grid grid-cols-3 border-y border-[#EDE5D8] py-3.5 text-center">
                        <div>
                          <ShieldCheck className="mx-auto h-[17px] w-[17px] text-[#C9A96E]" strokeWidth={1.4} />
                          <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#9A8E82]">
                            Secure
                          </p>
                        </div>

                        <div className="border-x border-[#EDE5D8]">
                          <Clock3 className="mx-auto h-[17px] w-[17px] text-[#C9A96E]" strokeWidth={1.4} />
                          <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#9A8E82]">
                            Expires
                          </p>
                        </div>

                        <div>
                          <Inbox className="mx-auto h-[17px] w-[17px] text-[#C9A96E]" strokeWidth={1.4} />
                          <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#9A8E82]">
                            Check Spam
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* RESET PASSWORD */}
                  {step === 'RESET_PASSWORD' && (
                    <motion.div
                      key="reset-password"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.22 }}
                      className="mx-auto flex w-full max-w-[390px] flex-col justify-center"
                    >
                      <div className="mb-5 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-[#D6CDC0] bg-white">
                          <Lock className="h-5 w-5 text-[#C9A96E]" strokeWidth={1.4} />
                        </div>

                        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.3em] text-[#C9A96E]">
                          Secure Reset
                        </p>

                        <h2
                          className="mt-2 text-[28px] font-normal leading-none tracking-[-0.025em] text-[#1A0F0A] sm:text-[31px]"
                          style={{
                            fontFamily: 'Arial, Helvetica, sans-serif',
                            fontWeight: 400,
                          }}
                        >
                          Create New Password
                        </h2>

                        <p className="mx-auto mt-2 max-w-[330px] text-[12px] leading-5 text-[#81796F]">
                          Enter a new password for your ARDENBY account.
                        </p>

                        <p className="mt-1 break-all text-xs font-bold text-[#27231F]">
                          {email}
                        </p>
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 border border-red-200 bg-red-50 p-2.5 text-center text-xs text-red-700"
                        >
                          {error}
                        </motion.div>
                      )}

                      <form onSubmit={handleResetPassword} className="space-y-3.5">
                        <label className="block">
                          <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.20em] text-[#5F5750]">
                            New Password
                          </span>

                          <div className="relative">
                            <Lock
                              className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#A79D91]"
                              strokeWidth={1.4}
                            />

                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your new password"
                              autoComplete="new-password"
                              className="h-[49px] w-full rounded-[3px] border border-[#DED6CD] bg-white py-3 pl-10 pr-11 text-[13px] text-[#181614] outline-none transition-all duration-200 focus:border-[#C9A96E] focus:bg-[#FFFDF9] focus:shadow-[0_0_0_3px_rgba(201,169,110,0.08)] placeholder:text-[#AEA59B]"
                            />

                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#999087] transition hover:text-[#181614]"
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
                          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[3px] bg-[#0A0A0A] px-6 text-[11px] font-bold tracking-[0.18em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#151515] disabled:cursor-not-allowed disabled:opacity-50"
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
                          className="w-full text-center text-[12px] text-[#7A6E65] transition hover:text-[#181614]"
                        >
                          ← Back to login
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
