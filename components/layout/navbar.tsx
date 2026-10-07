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

import { apiUrl } from '@/lib/api-url';

import { NavbarHeader } from '@/components/layout/navbar-header';

import { NavbarMobileDrawer } from '@/components/layout/navbar-mobile-drawer';

import { NavbarAuthModal } from '@/components/layout/navbar-auth-modal';



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



const GUEST_CART_KEY = 'ardenby-cart-guest';

function saveGuestCart(items: any[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function loadGuestCart(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function loadAuthenticatedCart() {
  const token = getToken();
  if (!token) return;
  try {
    const response = await apiRequest<any>('/api/cart', { method: 'GET' });
    const rawItems = response?.items || response?.data?.items || response?.cart?.items || response?.data?.cart?.items || [];
    const serverItems = Array.isArray(rawItems)
      ? rawItems.map((item: any) => {
          const productId = String(item?.product_id || item?.productId || item?.product?.id || '');
          const variantId = String(item?.variant_id || item?.variantId || item?.variant?.id || '');
          const size = item?.size || item?.size_snapshot || item?.variant?.size;
          const color = item?.color || item?.color_snapshot || item?.variant?.color;
          const quantity = Number(item?.quantity || 1);
          const price = Number(item?.price_snapshot ?? item?.price ?? item?.product?.price ?? 0);
          const mrp = Number(item?.mrp_snapshot ?? item?.mrp ?? item?.product?.mrp ?? price);
          const image = item?.image_snapshot || item?.image || item?.product?.images?.[0] || '';
          const name = item?.name_snapshot || item?.name || item?.product?.name || 'Product';
          const slug = item?.slug_snapshot || item?.slug || item?.product?.slug || '';
          if (!productId || !variantId || !size || !color) return null;
          return { productId, variantId, slug, name, image, size, color, quantity: Math.max(1, quantity), price, mrp };
        }).filter(Boolean)
      : [];
    useCartStore.setState({ items: serverItems as any, couponCode: response?.coupon_code || response?.couponCode || null });
  } catch (error) {
    console.error('Failed to load authenticated cart:', error);
  }
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



export function Navbar() {

  const [mobileOpen, setMobileOpen] = useState(false);

  const [megaOpen, setMegaOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');



  const pathname = usePathname();

  const router = useRouter();



  const cartItems = useCartStore((s) => s.items);

  const openCart = useCartStore((s) => s.openCart);

  const closeCart = useCartStore((s) => s.closeCart);

  const cartCount = getCartCount(cartItems);

  // While logged out, keep the guest cart in its own storage key.
  // Logged-in user carts are never written into this guest key.
  useEffect(() => {
    if (!getToken()) {
      saveGuestCart(cartItems);
    }
  }, [cartItems]);


  const wishlistCount = useWishlistStore((s) => s.items.length);

  const syncWishlist = useWishlistStore((s) => s.syncFromApi);

  const clearWishlistLocal = useWishlistStore((s) => s.clearLocal);



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
      if (!cancelled) {
        setUser(null);
        clearWishlistLocal();
        useCartStore.setState({
          items: loadGuestCart() as any,
          couponCode: null,
        });
      }
      return;
    }



    try {

      const response = await apiRequest<{

        user?: any;

        data?: any;

      }>('/api/users/me', {

        method: 'GET',

      });



      const rawUser = response.user || response.data || response;



      if (cancelled) return;



      const role = String(rawUser.role || '').toLowerCase();



      setUser({

        id: rawUser.id,

        phone: rawUser.phone || '',

        fullName:

          rawUser.full_name ||

          rawUser.fullName ||

          rawUser.name ||

          '',

        email: rawUser.email || '',

        gender: rawUser.gender || 'other',

        isVerified:

          rawUser.email_verified === true ||

          rawUser.email_verified === 1 ||

          rawUser.isVerified === true,

        role: rawUser.role,

      });



      // Always load the current authenticated user's backend cart. No guest merge.
      await loadAuthenticatedCart();

      // Wishlist API is customer-only.

      if (role === 'customer') {

        await syncWishlist();

      } else {

        clearWishlistLocal();

      }

    } catch {

      clearToken();



      if (!cancelled) {

        setUser(null);

        clearWishlistLocal();

      }

    }

  };



  void loadUser();



  const syncAuthState = () => {

    void loadUser();

  };



  window.addEventListener(

    'ardenby-auth-changed',

    syncAuthState,

  );



  window.addEventListener(

    'storage',

    syncAuthState,

  );



  return () => {

    cancelled = true;



    window.removeEventListener(

      'ardenby-auth-changed',

      syncAuthState,

    );



    window.removeEventListener(

      'storage',

      syncAuthState,

    );

  };

}, [

  pathname,

  syncWishlist,

  clearWishlistLocal,

]);

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

        saveGuestCart(useCartStore.getState().items);
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



      saveGuestCart(useCartStore.getState().items);
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



      saveGuestCart(useCartStore.getState().items);
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

  // Keep the authenticated user's cart on the server.
  // Show only the separate guest cart after logout.
  useCartStore.setState({
    items: loadGuestCart() as any,
    couponCode: null,
  });

  clearWishlistLocal();



  setUser(null);



  window.dispatchEvent(

    new Event('ardenby-auth-changed')

  );



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

      <NavbarHeader

        setMobileOpen={setMobileOpen}

        megaOpen={megaOpen}

        setMegaOpen={setMegaOpen}

        handleSearchSubmit={handleSearchSubmit}

        searchQuery={searchQuery}

        setSearchQuery={setSearchQuery}

        handleOpenProfile={handleOpenProfile}

        user={user}

        wishlistCount={wishlistCount}

        cartCount={cartCount}

        openCart={openCart}

        closeCart={closeCart}

      />



      <NavbarMobileDrawer

        mobileOpen={mobileOpen}

        setMobileOpen={setMobileOpen}

        handleSearchSubmit={handleSearchSubmit}

        searchQuery={searchQuery}

        setSearchQuery={setSearchQuery}

        wishlistCount={wishlistCount}

        handleOpenProfile={handleOpenProfile}

        user={user}

      />



      <NavbarAuthModal

        isOpen={isOpen}

        setIsOpen={setIsOpen}

        step={step}

        email={email}

        setEmail={setEmail}

        password={password}

        setPassword={setPassword}

        otp={otp}

        setOtp={setOtp}

        setOtpPurpose={setOtpPurpose}

        setResetToken={setResetToken}

        isLoading={isLoading}

        isGoogleLoading={isGoogleLoading}

        error={error}

        setError={setError}

        otpTimer={otpTimer}

        canResend={canResend}

        showPassword={showPassword}

        setShowPassword={setShowPassword}

        rememberMe={rememberMe}

        setRememberMe={setRememberMe}

        googleButtonRef={googleButtonRef}

        otpInputs={otpInputs}

        handleEmailAuth={handleEmailAuth}

        handleForgotPassword={handleForgotPassword}

        handleOtpChange={handleOtpChange}

        handleOtpKeyDown={handleOtpKeyDown}

        handleOtpPaste={handleOtpPaste}

        handleVerifyOtp={handleVerifyOtp}

        handleResendOtp={handleResendOtp}

        handleResetPassword={handleResetPassword}

        setStep={setStep}

      />

    </>

  );

}





export default Navbar;
