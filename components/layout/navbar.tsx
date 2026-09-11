'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  User,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Truck,
  ShieldCheck,
  RotateCcw,
  Clock3,
  Inbox,
} from 'lucide-react';

import { useCartStore, getCartCount } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { products } from '@/lib/data';
import { apiUrl } from '@/lib/api-url';

export interface UserProfile {
  id?: string;
  phone?: string;
  fullName: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  isVerified?: boolean;
  role?: string;
}

interface ApiResponse {
  message?: string;
  token?: string;
  accessToken?: string;
  jwt?: string;
  user?: any;
  data?: any;
  requiresOtp?: boolean;
  otpRequired?: boolean;
  purpose?: 'login' | 'email_verification' | 'password_reset';
  resetToken?: string;
}

const getToken = () =>
  typeof window !== 'undefined'
    ? localStorage.getItem('ardenby_token')
    : null;

const saveToken = (token: string) => {
  localStorage.setItem('ardenby_token', token);
};

const clearToken = () => {
  localStorage.removeItem('ardenby_token');
};

async function parseResponse(response: Response): Promise<ApiResponse> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.errors?.[0]?.message ||
      'Something went wrong. Please try again.';
    throw new Error(message);
  }

  return data;
}

async function apiRequest<T = ApiResponse>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(endpoint), {
    ...options,
    headers,
  });

  return (await parseResponse(response)) as T;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

const megaMenu = [
  {
    title: 'Supreme Edition',
    slug: 'supreme-edition',
    desc: 'Heavyweight oversized cotton',
    featured: products.filter((p) => p.category === 'supreme-edition').slice(0, 3),
  },
  {
    title: 'Epic Thread',
    slug: 'epic-thread',
    desc: 'Graphic & printed tees',
    featured: products.filter((p) => p.category === 'epic-thread').slice(0, 3),
  },
  {
    title: 'Ardenby Premium',
    slug: 'ardenby-premium',
    desc: 'Long-staple cotton essentials',
    featured: products.filter((p) => p.category === 'ardenby-premium').slice(0, 3),
  },
  {
    title: 'The Print Club',
    slug: 'the-print-club',
    desc: 'Bold prints & puff graphics',
    featured: products.filter((p) => p.category === 'the-print-club').slice(0, 3),
  },
];

const topNavItems = [
  { label: 'SUPREME EDITION', slug: 'supreme-edition' },
  { label: 'EPIC THREAD', slug: 'epic-thread' },
  { label: 'ARDENBY PREMIUM', slug: 'ardenby-premium' },
  { label: 'THE PRINT CLUB', slug: 'the-print-club' },
  { label: 'TOP WEAR', slug: 'top-wear' },
  { label: 'PLUS SIZE', slug: 'plus-size' },
  { label: 'BOTTOM WEAR', slug: 'bottom-wear' },
  { label: 'ALL PRODUCTS', slug: 'all-products' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const pathname = usePathname();
  const router = useRouter();

  const cartItems = useCartStore((s) => s.items);
  const openCart = useCartStore((s) => s.openCart);
  const cartCount = getCartCount(cartItems);

  const wishlistCount = useWishlistStore((s) => s.items.length);

  // ============================================================
  // AUTH STATE
  // Navbar owns only authentication UI.
  // Logged-in account data lives on /profile.
  // ============================================================

  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const [step, setStep] = useState<'LOGIN' | 'OTP' | 'RESET_PASSWORD'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'email_verification' | 'password_reset'>('login');
  const [resetToken, setResetToken] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpTimer, setOtpTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleInitializedRef = useRef(false);

  // DESIGN-ONLY UI STATE
  // Purely cosmetic — not sent to the API, does not affect auth logic.
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  // ============================================================
  // LOAD AUTHENTICATED USER
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      const token = getToken();

      if (!token) {
        if (!cancelled) setUser(null);
        return;
      }

      try {
        const response = await apiRequest<{ user?: any; data?: any }>(
          '/api/users/me',
          { method: 'GET' }
        );

        const rawUser = response.user || response.data || response;

        if (!cancelled) {
          setUser({
            id: rawUser.id,
            phone: rawUser.phone || '',
            fullName: rawUser.full_name || rawUser.fullName || rawUser.name || '',
            email: rawUser.email || '',
            gender: rawUser.gender || 'other',
            isVerified:
              rawUser.email_verified === true ||
              rawUser.email_verified === 1 ||
              rawUser.isVerified === true,
            role: rawUser.role,
          });
        }
      } catch {
        clearToken();
        if (!cancelled) setUser(null);
      }
    };

    void loadUser();

    const syncAuthState = () => {
      void loadUser();
    };
    window.addEventListener('ardenby-auth-changed', syncAuthState);
    window.addEventListener('storage', syncAuthState);

    return () => {
      cancelled = true;
      window.removeEventListener('ardenby-auth-changed', syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, [pathname]);

  // ============================================================
  // ESC KEY
  // ============================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // ============================================================
  // OTP TIMER
  // ============================================================

  useEffect(() => {
    if (!isOpen || step !== 'OTP' || otpTimer <= 0) return;

    const interval = window.setInterval(() => {
      setOtpTimer((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isOpen, step, otpTimer]);

  useEffect(() => {
    if (otpTimer === 0) setCanResend(true);
  }, [otpTimer]);

  // ============================================================
  // OPEN PROFILE ICON
  // ============================================================

  const handleOpenProfile = () => {
    setError('');

    if (user && getToken()) {
      router.push('/profile');
      return;
    }

    setUser(null);
    setEmail('');
    setPassword('');
    setOtp(Array(6).fill(''));
    setOtpPurpose('login');
    setResetToken('');
    setStep('LOGIN');
    setIsOpen(true);
  };

  // ============================================================
  // EMAIL + PASSWORD AUTH
  // POST /api/auth/
  // ============================================================

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // ONE AUTH FLOW: backend decides whether this is login or registration
      // by checking whether the email already exists.
      const response = await apiRequest<ApiResponse>('/api/auth/', {
        method: 'POST',
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const token =
        response.token ||
        response.accessToken ||
        response.jwt ||
        response.data?.token ||
        response.data?.accessToken;

      if (token) {
        saveToken(token);
        window.dispatchEvent(new Event('ardenby-auth-changed'));
        setIsOpen(false);
        router.push('/');
        return;
      }

      const purpose =
        response.purpose ||
        response.data?.purpose ||
        (response.requiresOTP || response.data?.requiresOTP
          ? 'email_verification'
          : 'login');

      setOtpPurpose(
        purpose === 'email_verification' ? 'email_verification' : 'login'
      );
      setEmail(cleanEmail);
      setOtp(Array(6).fill(''));
      setOtpTimer(30);
      setCanResend(false);
      setStep('OTP');

      setTimeout(() => otpInputs.current[0]?.focus(), 50);
    } catch (err: any) {
      setError(err?.message || 'Unable to continue.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // FORGOT PASSWORD — REQUEST OTP
  // POST /api/auth/forgot-password
  // ============================================================

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await apiRequest<ApiResponse>(
        '/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      setEmail(cleanEmail);
      setPassword('');
      setOtp(Array(6).fill(''));
      setOtpPurpose('password_reset');
      setResetToken('');
      setOtpTimer(30);
      setCanResend(false);
      setStep('OTP');

      setTimeout(() => otpInputs.current[0]?.focus(), 50);

      if (response.message) {
        // Keep the existing UI unchanged; backend response is handled silently.
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to send password reset OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // OTP INPUT
  // ============================================================

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);
    setError('');

    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const value = e.clipboardData.getData('text').trim();

    if (!/^\d{6}$/.test(value)) return;

    e.preventDefault();
    setOtp(value.split(''));
    otpInputs.current[5]?.focus();
  };

  // ============================================================
  // VERIFY OTP
  // POST /api/auth/verify-otp
  // ============================================================

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const enteredOtp = otp.join('');

    if (enteredOtp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await apiRequest<ApiResponse>(
        '/api/auth/verify-otp',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp: enteredOtp,
            purpose: otpPurpose,
          }),
        }
      );

      // PASSWORD RESET FLOW:
      // OTP verification returns a short-lived resetToken.
      // Do NOT save it as the normal login JWT.
      if (otpPurpose === 'password_reset') {
        const token =
          response.resetToken ||
          response.data?.resetToken;

        if (!token) {
          throw new Error('Password reset token was not returned by the server.');
        }

        setResetToken(token);
        setOtp(Array(6).fill(''));
        setOtpTimer(0);
        setCanResend(false);
        setError('');
        setStep('RESET_PASSWORD');
        return;
      }

      const token =
        response.token ||
        response.accessToken ||
        response.jwt ||
        response.data?.token ||
        response.data?.accessToken;

      if (!token) {
        throw new Error('Authentication token was not returned by the server.');
      }

      saveToken(token);

      const me = await apiRequest<any>('/api/users/me', {
        method: 'GET',
      });

      const rawUser = me.user || me.data || me;

      setUser({
        id: rawUser.id,
        phone: rawUser.phone || '',
        fullName: rawUser.full_name || rawUser.fullName || rawUser.name || '',
        email: rawUser.email || email.trim().toLowerCase(),
        gender: rawUser.gender || 'other',
        isVerified: true,
        role: rawUser.role,
      });

      // IMPORTANT:
      // No success page. No account modal.
      // Directly return to the ARDENBY home/customer dashboard.
      window.dispatchEvent(new Event('ardenby-auth-changed'));
      setIsOpen(false);
      setOtp(Array(6).fill(''));
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // RESEND OTP
  // POST /api/auth/resend-otp
  // ============================================================

  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;

    setError('');
    setIsLoading(true);

    try {
      await apiRequest<ApiResponse>('/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          purpose: otpPurpose,
        }),
      });

      setOtp(Array(6).fill(''));
      setOtpTimer(30);
      setCanResend(false);
      setTimeout(() => otpInputs.current[0]?.focus(), 50);
    } catch (err: any) {
      setError(err?.message || 'Unable to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // RESET PASSWORD
  // POST /api/auth/reset-password
  // ============================================================

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetToken) {
      setError('Password reset session has expired. Please request a new OTP.');
      setStep('LOGIN');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await apiRequest<ApiResponse>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          resetToken,
          newPassword: password,
        }),
      });

      // Reset complete → return directly to the existing login screen.
      setResetToken('');
      setPassword('');
      setOtp(Array(6).fill(''));
      setOtpPurpose('login');
      setError('');
      setStep('LOGIN');
    } catch (err: any) {
      setError(err?.message || 'Unable to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // GOOGLE LOGIN — GOOGLE IDENTITY SERVICES
  // POST /api/auth/google
  // ============================================================

  const handleGoogleCredential = async (credential: string) => {
    setError('');
    setIsGoogleLoading(true);

    try {
      const response = await apiRequest<ApiResponse>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });

      const token =
        response.token ||
        response.accessToken ||
        response.jwt ||
        response.data?.token ||
        response.data?.accessToken;

      if (!token) {
        throw new Error('Authentication token was not returned by the server.');
      }

      saveToken(token);

      const me = await apiRequest<any>('/api/users/me', {
        method: 'GET',
      });

      const rawUser = me.user || me.data || me;

      setUser({
        id: rawUser.id,
        phone: rawUser.phone || '',
        fullName: rawUser.full_name || rawUser.fullName || rawUser.name || '',
        email: rawUser.email || '',
        gender: rawUser.gender || 'other',
        isVerified: true,
        role: rawUser.role,
      });

      window.dispatchEvent(new Event('ardenby-auth-changed'));
      setIsOpen(false);
      router.push('/');
    } catch (err: any) {
      clearToken();
      setUser(null);
      setError(err?.message || 'Google login failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || step !== 'LOGIN') return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setError('Google sign-in is not configured. Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID.');
      return;
    }

    let cancelled = false;

    const initializeGoogle = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) {
        return;
      }

      const googleId = window.google.accounts.id;

      if (!googleInitializedRef.current) {
        googleId.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              void handleGoogleCredential(response.credential);
            } else {
              setError('Google did not return a valid credential.');
            }
          },
        });

        googleInitializedRef.current = true;
      }

      googleButtonRef.current.innerHTML = '';

      googleId.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 390,
      });
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    ) as HTMLScriptElement | null;

    const script = existingScript || document.createElement('script');

    if (!existingScript) {
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener('load', initializeGoogle);

    return () => {
      cancelled = true;
      script.removeEventListener('load', initializeGoogle);
    };
  }, [isOpen, step]);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    clearToken();
    setUser(null);
    window.dispatchEvent(new Event('ardenby-auth-changed'));
    setEmail('');
    setPassword('');
    setOtp(Array(6).fill(''));
    setOtpPurpose('login');
    setError('');
    setStep('LOGIN');
    setIsOpen(false);
    router.push('/');
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ======================================================
          MAIN NAVBAR
      ====================================================== */}

      <header className="sticky top-0 z-40 bg-white  border-neutral-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="flex h-16 lg:h-[68px] items-center justify-between gap-4">

            {/* Mobile Menu */}
            <button
              className="lg:hidden p-2 -ml-2 text-neutral-800"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Brand */}
            <Link
              href="/"
              className="flex items-center gap-2 select-none group flex-shrink-0"
            >
              <div className="flex flex-col leading-none">
                <span
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-[-0.08em] text-transparent bg-clip-text bg-gradient-to-b from-black via-neutral-700 to-black transition-all duration-300 group-hover:opacity-80"
                  style={{
                    fontFamily: 'Bodoni MT, Didot, Times New Roman, serif',
                  }}
                >
                  ARDENBY
                </span>

                <div className="mt-1 flex items-center gap-2">
                  <div className="h-px w-4 sm:w-5 bg-neutral-300" />
                  <span className="text-[7px] uppercase tracking-[0.4em] text-neutral-500">
                    WEAR YOUR ESSENCE
                  </span>
                  <div className="h-px w-4 sm:w-5 bg-neutral-300" />
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center px-4">
              {topNavItems.map((item) => (
                <div
                  key={item.slug}
                  className="relative py-5"
                  onMouseEnter={() => {
                    if (
                      item.slug === 'supreme-edition' ||
                      item.slug === 'epic-thread'
                    ) {
                      setMegaOpen(true);
                    }
                  }}
                  onMouseLeave={() => setMegaOpen(false)}
                >
                  <Link
                    href={`/shop?category=${item.slug}`}
                    className="text-[11px] xl:text-[12px] font-bold text-neutral-800 hover:text-[#1A80E6] transition-colors leading-tight text-center block max-w-[85px] tracking-tight uppercase"
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </nav>

            {/* Search + Actions */}
            <div className="flex items-center gap-3 xl:gap-4">
              <form
                onSubmit={handleSearchSubmit}
                className="hidden md:block relative w-44"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Try searching "T-shirt"'
                  className="w-full pl-4 pr-10 py-2 text-xs bg-neutral-50 rounded-lg border border-purple-300 focus:border-purple-600 focus:outline-none focus:bg-white text-neutral-800 placeholder-neutral-400 transition-all"
                />

                <button
                  type="submit"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-800"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>

              {/* Profile */}
              <button
                type="button"
                onClick={handleOpenProfile}
                className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors hidden sm:block text-neutral-700"
                aria-label={user ? 'My profile' : 'Login'}
                title={user ? 'My profile' : 'Login'}
              >
                <User className="h-5 w-5" />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors relative text-neutral-700"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />

                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors relative text-neutral-700"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" />

                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================
            MEGA MENU
        ===================================================== */}
        <AnimatePresence>
          {megaOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 w-full bg-white  border-neutral-200 shadow-xl py-6 z-50 hidden lg:block"
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={() => setMegaOpen(false)}
            >
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-4 gap-8">
                {megaMenu.map((col) => (
                  <div key={col.slug}>
                    <Link
                      href={`/shop?category=${col.slug}`}
                      className="block mb-2"
                    >
                      <h3 className="font-bold text-sm text-neutral-900 hover:text-[#1A80E6] transition-colors">
                        {col.title}
                      </h3>

                      <p className="text-xs text-neutral-500">{col.desc}</p>
                    </Link>

                    <div className="space-y-2 mt-3">
                      {col.featured.map((p) => (
                        <Link
                          key={p.id}
                          href={`/product/${p.slug}`}
                          className="flex items-center gap-2 group p-1 rounded-md hover:bg-neutral-50 transition-colors"
                        >
                          <div className="w-10 h-12 rounded overflow-hidden bg-neutral-100 flex-shrink-0">
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <span className="text-xs font-medium text-neutral-700 group-hover:text-[#1A80E6] line-clamp-2">
                            {p.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ========================================================
          MOBILE DRAWER
      ========================================================= */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 lg:hidden overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between p-4  border-neutral-200">
                  <span
                    className="font-bold text-xl uppercase tracking-tight"
                    style={{
                      fontFamily: 'Bodoni MT, Didot, Times New Roman, serif',
                    }}
                  >
                    ARDENBY
                  </span>

                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1 text-neutral-600"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Search */}
                <div className="p-4  border-neutral-100">
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder='Search "T-shirt"'
                      className="w-full pl-3 pr-8 py-2 text-xs bg-neutral-50 rounded-md border border-purple-300 focus:outline-none"
                    />

                    <button
                      type="submit"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-600"
                      aria-label="Search"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </form>
                </div>

                {/* Categories */}
                <div className="p-4 space-y-1">
                  {topNavItems.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/shop?category=${item.slug}`}
                      className="block py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-800 hover:text-[#1A80E6]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Footer */}
              <div className="p-4 border-t border-neutral-200 bg-neutral-50 space-y-2">
                <Link
                  href="/wishlist"
                  className="block text-xs font-semibold text-neutral-700"
                >
                  Wishlist ({wishlistCount})
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleOpenProfile();
                  }}
                  className="block w-full text-left text-xs font-semibold text-neutral-700"
                >
                  {user ? 'My Profile' : 'Login / Sign Up'}
                </button>

                <Link
                  href="/orders"
                  className="block text-xs font-semibold text-neutral-700"
                >
                  Orders
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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

export default Navbar;
