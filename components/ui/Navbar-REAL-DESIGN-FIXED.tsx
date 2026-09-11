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
  purpose?: 'login' | 'email_verification';
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

  const [step, setStep] = useState<'LOGIN' | 'OTP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'email_verification'>('login');

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
        (response.requiresOtp || response.data?.requiresOtp
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
  // Uses the same POST /api/auth/ endpoint.
  // ============================================================

  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;

    setError('');
    setIsLoading(true);

    try {
      await apiRequest<ApiResponse>('/api/auth/', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
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
        width: 420,
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

      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
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
              className="absolute top-full left-0 w-full bg-white border-b border-neutral-200 shadow-xl py-6 z-50 hidden lg:block"
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
                <div className="flex items-center justify-between p-4 border-b border-neutral-200">
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
                <div className="p-4 border-b border-neutral-100">
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
          Premium editorial redesign — no rounded main container.
          Existing auth/API/OTP/Google logic preserved.
      ========================================================= */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-[#090807]/75 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 grid h-[100dvh] w-full overflow-hidden bg-[#F7F4EE] text-[#181614] shadow-[0_28px_90px_rgba(0,0,0,0.4)] sm:h-[min(640px,calc(100dvh-28px))] sm:max-w-[980px] lg:grid-cols-[39%_61%]"
            >
              {/* Close */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 z-40 flex h-9 w-9 items-center justify-center border border-black/10 bg-white/95 text-[#28231F] transition hover:bg-[#181614] hover:text-white sm:right-5 sm:top-5"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* =====================================================
                  BRAND SIDE
              ====================================================== */}
              <div className="relative hidden overflow-hidden bg-[#211A14] lg:flex lg:flex-col lg:justify-between">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(190,150,95,0.28),transparent_38%)]" />
                <div className="absolute bottom-0 left-0 right-0 h-[55%] bg-gradient-to-t from-black/70 to-transparent" />

                <div className="relative p-8 xl:p-10">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[24px] font-bold tracking-[-0.07em] text-white"
                      style={{ fontFamily: 'Bodoni MT, Didot, Times New Roman, serif' }}
                    >
                      ARDENBY
                    </span>
                    <span className="h-px w-7 bg-[#C7A675]" />
                  </div>
                  <p className="mt-1 text-[7px] uppercase tracking-[0.38em] text-white/45">
                    Wear Your Essence
                  </p>
                </div>

                <div className="relative px-8 pb-9 xl:px-10">
                  <p className="mb-3 text-[8px] font-bold uppercase tracking-[0.32em] text-[#D3B487]">
                    Private Access
                  </p>
                  <h3 className="font-serif text-[52px] font-normal leading-[0.84] tracking-[-0.045em] text-white xl:text-[60px]">
                    Wear
                    <br />
                    Your
                    <br />
                    Essence.
                  </h3>
                  <div className="mt-6 h-px w-12 bg-[#C7A675]" />
                  <p className="mt-4 max-w-[245px] text-[12px] leading-5 text-white/55">
                    A considered wardrobe for people who choose to stand apart.
                  </p>
                </div>

                <div className="relative mx-8 mb-7 border-t border-white/15 pt-4 xl:mx-10">
                  <span className="text-[7px] uppercase tracking-[0.28em] text-white/35">
                    ARDENBY / EST. 2025
                  </span>
                </div>
              </div>

              {/* =====================================================
                  FORM SIDE
              ====================================================== */}
              <div className="flex min-h-0 flex-col overflow-y-auto bg-[#F7F4EE] px-5 pb-7 pt-16 sm:px-9 sm:py-10 md:px-12 lg:px-14">

                {/* Mobile brand */}
                <div className="mb-7 lg:hidden">
                  <div className="flex items-center justify-center gap-3">
                    <span className="h-px w-7 bg-[#B28A56]" />
                    <span
                      className="text-[27px] font-bold tracking-[-0.07em]"
                      style={{ fontFamily: 'Bodoni MT, Didot, Times New Roman, serif' }}
                    >
                      ARDENBY
                    </span>
                    <span className="h-px w-7 bg-[#B28A56]" />
                  </div>
                  <p className="mt-1 text-center text-[7px] uppercase tracking-[0.38em] text-[#9B9185]">
                    Wear Your Essence
                  </p>
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
                      className="mx-auto w-full max-w-[430px] lg:flex lg:flex-1 lg:flex-col lg:justify-center"
                    >
                      <div className="mb-6">
                        <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-[#A07845]">
                          Welcome Back
                        </p>
                        <h2 className="mt-2 font-serif text-[34px] font-normal leading-none tracking-[-0.035em] sm:text-[38px]">
                          Sign in to ARDENBY
                        </h2>
                        <p className="mt-2 text-[12px] leading-5 text-[#81796F]">
                          Continue to your account and discover your collection.
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

                      <form onSubmit={handleEmailAuth} className="space-y-4">
                        <label className="block">
                          <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.22em] text-[#70685E]">
                            Email Address
                          </span>
                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A79D91]" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@example.com"
                              autoComplete="email"
                              className="h-[50px] w-full border border-[#D6CDC0] bg-white pl-10 pr-4 text-[14px] text-[#181614] outline-none transition placeholder:text-[#ADA49A] focus:border-[#A07845] focus:ring-1 focus:ring-[#A07845]"
                            />
                          </div>
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.22em] text-[#70685E]">
                            Password
                          </span>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A79D91]" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your password"
                              autoComplete="current-password"
                              className="h-[50px] w-full border border-[#D6CDC0] bg-white pl-10 pr-11 text-[14px] text-[#181614] outline-none transition placeholder:text-[#ADA49A] focus:border-[#A07845] focus:ring-1 focus:ring-[#A07845]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#999087] hover:text-[#181614]"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </label>

                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-[11px] text-[#746C63]">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="h-3.5 w-3.5 rounded-none border-[#CFC5B8] text-[#A07845] focus:ring-1 focus:ring-[#A07845]"
                            />
                            Remember me
                          </label>

                          <button
                            type="button"
                            className="text-[11px] font-semibold text-[#A07845] hover:text-[#181614]"
                          >
                            Forgot password?
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex h-[50px] w-full items-center justify-center gap-3 bg-[#181614] text-[9px] font-bold tracking-[0.22em] text-white transition hover:bg-[#302C28] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              PLEASE WAIT...
                            </>
                          ) : (
                            <>
                              LOGIN / CONTINUE
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </form>

                      <div className="my-5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-[#DDD4C8]" />
                        <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-[#9B9185]">OR</span>
                        <div className="h-px flex-1 bg-[#DDD4C8]" />
                      </div>

                      <div className="w-full overflow-hidden">
                        <div
                          ref={googleButtonRef}
                          className={`flex min-h-[50px] w-full items-center justify-center overflow-hidden transition-opacity ${
                            isGoogleLoading ? 'opacity-70' : 'opacity-100'
                          }`}
                          aria-label="Continue with Google"
                        />
                      </div>

                      <div className="mt-5 grid grid-cols-3 border-t border-[#DDD4C8] pt-4">
                        <div className="text-center">
                          <Truck className="mx-auto h-3.5 w-3.5 text-[#A07845]" />
                          <p className="mt-1.5 text-[7px] font-bold uppercase tracking-[0.1em] text-[#70685E]">Free Shipping</p>
                        </div>
                        <div className="border-x border-[#DDD4C8] text-center">
                          <ShieldCheck className="mx-auto h-3.5 w-3.5 text-[#A07845]" />
                          <p className="mt-1.5 text-[7px] font-bold uppercase tracking-[0.1em] text-[#70685E]">Secure</p>
                        </div>
                        <div className="text-center">
                          <RotateCcw className="mx-auto h-3.5 w-3.5 text-[#A07845]" />
                          <p className="mt-1.5 text-[7px] font-bold uppercase tracking-[0.1em] text-[#70685E]">Easy Returns</p>
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
                      className="mx-auto w-full max-w-[430px] lg:flex lg:flex-1 lg:flex-col lg:justify-center"
                    >
                      <div className="mb-7 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-[#D6CDC0] bg-white">
                          <Mail className="h-5 w-5 text-[#A07845]" />
                        </div>

                        <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-[#A07845]">
                          Secure Verification
                        </p>

                        <h2 className="mt-2 font-serif text-[32px] font-normal leading-none tracking-[-0.03em] sm:text-[36px]">
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

                      <form onSubmit={handleVerifyOtp} className="space-y-5">
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
                              className="h-11 w-11 min-w-0 border border-[#D6CDC0] bg-white text-center text-base font-bold text-[#181614] outline-none transition focus:border-[#A07845] focus:ring-1 focus:ring-[#A07845] sm:h-13 sm:w-12 sm:text-lg"
                              aria-label={`OTP digit ${index + 1}`}
                            />
                          ))}
                        </div>

                        <div className="flex items-center justify-between gap-3 text-[11px] text-[#746C63]">
                          {canResend ? (
                            <button
                              type="button"
                              onClick={handleResendOtp}
                              disabled={isLoading}
                              className="font-bold text-[#A07845] underline underline-offset-2 disabled:opacity-50"
                            >
                              RESEND OTP
                            </button>
                          ) : (
                            <span>
                              Resend in <strong className="text-[#181614]">00:{otpTimer < 10 ? `0${otpTimer}` : otpTimer}</strong>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setError('');
                              setOtp(Array(6).fill(''));
                              setStep('LOGIN');
                            }}
                            className="underline underline-offset-2 hover:text-[#181614]"
                          >
                            ← Back to login
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={otp.join('').length !== 6 || isLoading}
                          className="flex h-[50px] w-full items-center justify-center gap-2 bg-[#181614] text-[9px] font-bold tracking-[0.2em] text-white transition hover:bg-[#302C28] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              VERIFYING...
                            </>
                          ) : (
                            <>
                              VERIFY &amp; CONTINUE
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </form>

                      <div className="mt-7 grid grid-cols-3 border-y border-[#DDD4C8] py-4 text-center">
                        <div>
                          <ShieldCheck className="mx-auto h-3.5 w-3.5 text-[#A07845]" />
                          <p className="mt-1.5 text-[7px] font-bold uppercase tracking-[0.1em] text-[#70685E]">Secure</p>
                        </div>
                        <div className="border-x border-[#DDD4C8]">
                          <Clock3 className="mx-auto h-3.5 w-3.5 text-[#A07845]" />
                          <p className="mt-1.5 text-[7px] font-bold uppercase tracking-[0.1em] text-[#70685E]">Expires</p>
                        </div>
                        <div>
                          <Inbox className="mx-auto h-3.5 w-3.5 text-[#A07845]" />
                          <p className="mt-1.5 text-[7px] font-bold uppercase tracking-[0.1em] text-[#70685E]">Check Spam</p>
                        </div>
                      </div>
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
