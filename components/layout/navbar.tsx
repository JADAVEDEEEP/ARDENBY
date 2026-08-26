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
  Mail,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Ticket,
  HelpCircle,
  LogOut,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useCartStore, getCartCount } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { categories, products } from '@/lib/data';
import { cn } from '@/lib/utils';

export interface UserProfile {
  phone: string;
  fullName: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  isVerified: boolean;
}

const authService = {
  sendOtp: async (phone: string): Promise<boolean> => {
    return new Promise((resolve) => setTimeout(() => resolve(true), 1200));
  },
  
  verifyOtp: async (phone: string, otp: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (otp === '123456' || otp.length === 6) {
          resolve(true);
        } else {
          reject(new Error('Invalid 6-digit verification code'));
        }
      }, 1200);
    });
  },

  saveProfile: async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          phone: profileData.phone || '',
          fullName: profileData.fullName || '',
          email: profileData.email || '',
          gender: profileData.gender || 'male',
          isVerified: true,
        });
      }, 1000);
    });
  }
};


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


  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'PROFILE' | 'ACCOUNT'>('PHONE');
  
  // Form State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  // ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Timer countdown for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && step === 'OTP' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [isOpen, step, timer]);

  // Open modal handler
  const handleOpenModal = () => {
    setIsOpen(true);
    if (user?.isVerified) {
      setStep('ACCOUNT');
    } else {
      setStep('PHONE');
    }
  };

  // Step 1: Send OTP
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authService.sendOtp(phone);
      setIsLoading(false);
      setTimer(30);
      setCanResend(false);
      setStep('OTP');
    } catch {
      setIsLoading(false);
      setError('Failed to send OTP. Please try again.');
    }
  };

  // Step 2: OTP Handlers
  const handleOtpChange = (val: string, index: number) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    if (val && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      setOtp(pasteData.split(''));
      otpInputs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authService.verifyOtp(phone, enteredOtp);
      setIsLoading(false);
      setStep('PROFILE');
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Invalid verification code');
    }
  };

  // Step 3: Profile Submit
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      setError('Please fill in all details');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const updatedUser = await authService.saveProfile({ phone, fullName, email, gender });
      setIsLoading(false);
      setUser(updatedUser);
      setStep('ACCOUNT');
    } catch {
      setIsLoading(false);
      setError('Failed to save profile information.');
    }
  };

  // Step 4: Logout
  const handleLogout = () => {
    setUser(null);
    setPhone('');
    setOtp(Array(6).fill(''));
    setFullName('');
    setEmail('');
    setStep('PHONE');
    setIsOpen(false);
  };

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="flex h-16 lg:h-[68px] items-center justify-between gap-4">
            
            {/* Mobile Hamburger */}
            <button
              className="lg:hidden p-2 -ml-2 text-neutral-800"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Original Brand Logo */}
            <Link href="/" className="flex items-center gap-2 select-none group flex-shrink-0">
              <div className="flex flex-col leading-none">
                <span
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-[-0.08em] text-transparent bg-clip-text bg-gradient-to-b from-black via-neutral-700 to-black transition-all duration-300 group-hover:opacity-80"
                  style={{ fontFamily: 'Bodoni MT, Didot, Times New Roman, serif' }}
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

            {/* Horizontal Text Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center px-4">
              {topNavItems.map((item) => (
                <div
                  key={item.slug}
                  className="relative py-5"
                  onMouseEnter={() => {
                    if (item.slug === 'supreme-edition' || item.slug === 'epic-thread') {
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

            {/* Inline Search Bar & Right Action Icons */}
            <div className="flex items-center gap-3 xl:gap-4">
              <form onSubmit={handleSearchSubmit} className="hidden md:block relative w-44">
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

              {/* Account / Profile Modal Trigger */}
              <button
                type="button"
                onClick={handleOpenModal}
                className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors hidden sm:block text-neutral-700"
                aria-label="Account"
              >
                <User className="h-5 w-5" />
              </button>

              {/* Wishlist Link with Badge */}
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

              {/* Cart Drawer Trigger with Badge */}
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

        {/* Mega Menu Dropdown */}
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
                    <Link href={`/shop?category=${col.slug}`} className="block mb-2">
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

      {/* Mobile Drawer Navigation */}
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
                    style={{ fontFamily: 'Bodoni MT, Didot, Times New Roman, serif' }}
                  >
                    ARDENBY
                  </span>
                  <button onClick={() => setMobileOpen(false)} className="p-1 text-neutral-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Search Input */}
                <div className="p-4 border-b border-neutral-100">
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder='Search "T-shirt"'
                      className="w-full pl-3 pr-8 py-2 text-xs bg-neutral-50 rounded-md border border-purple-300 focus:outline-none"
                    />
                    <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-600">
                      <Search className="h-4 w-4" />
                    </button>
                  </form>
                </div>

                {/* Mobile Category Links */}
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

              {/* Mobile Footer Links */}
              <div className="p-4 border-t border-neutral-200 bg-neutral-50 space-y-2">
                <Link href="/wishlist" className="block text-xs font-semibold text-neutral-700">
                  Wishlist ({wishlistCount})
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleOpenModal();
                  }}
                  className="block w-full text-left text-xs font-semibold text-neutral-700"
                >
                  My Profile
                </button>
                <Link href="/orders" className="block text-xs font-semibold text-neutral-700">
                  Orders
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* LUXURY MODAL POPUP */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
            
            {/* Dark Blurred Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full sm:max-w-[520px] bg-[#FBF9F5] rounded-t-3xl sm:rounded-3xl border border-[#E8E2D8] shadow-2xl p-6 sm:p-8 text-[#1A1A1A] max-h-[90vh] overflow-y-auto"
            >
              {/* Top Header */}
              <div className="flex items-center justify-between border-b border-[#EAE6DE] pb-4 mb-6">
                <div className="flex flex-col">
                  <span className="font-serif text-lg tracking-[0.25em] font-extrabold uppercase text-[#1A1A1A]">
                    ARDENBY
                  </span>
                  <span className="text-[8px] tracking-[0.3em] uppercase text-[#A08C75] font-medium -mt-1">
                    Wear Your Essence
                  </span>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-[#EAE6DE] text-[#5C554E] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* STEP ANIMATIONS CONTAINER */}
              <AnimatePresence mode="wait">
                
                {/* STEP 1: MOBILE NUMBER */}
                {step === 'PHONE' && (
                  <motion.div
                    key="step-phone"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="font-serif text-2xl font-normal text-[#1A1A1A]">Welcome to ARDENBY</h2>
                      <p className="text-xs text-[#756E65] mt-1">Enter your mobile number to continue.</p>
                    </div>

                    {error && (
                      <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-[#5C554E] block">
                          Mobile Number
                        </label>
                        <div className="flex items-center bg-[#EFECE6] border border-[#E2DCCE] rounded-xl overflow-hidden focus-within:border-[#C2A382] focus-within:ring-1 focus-within:ring-[#C2A382] transition-all">
                          <span className="px-3.5 py-3 text-xs font-semibold text-[#1A1A1A] border-r border-[#E2DCCE] bg-[#EAE6DE]/50">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 10 digit number"
                            className="w-full bg-transparent px-3.5 py-3 text-xs text-[#1A1A1A] placeholder-[#A0988E] focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={phone.length < 10 || isLoading}
                        className="w-full bg-[#1A1A1A] text-white rounded-xl py-3.5 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 hover:bg-[#2A2A2A] transition-all disabled:opacity-50"
                      >
                        {isLoading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>SEND OTP</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="pt-1 text-center">
                      <button 
                        type="button" 
                        className="text-xs text-[#A08C75] hover:text-[#1A1A1A] transition-colors underline"
                      >
                        Continue with Email
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: OTP VERIFICATION */}
                {step === 'OTP' && (
                  <motion.div
                    key="step-otp"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="font-serif text-2xl font-normal text-[#1A1A1A]">Verify your number</h2>
                      <p className="text-xs text-[#756E65] mt-1">
                        We've sent a 6-digit OTP to <span className="font-semibold text-[#1A1A1A]">+91 {phone}</span>{' '}
                        <button 
                          onClick={() => setStep('PHONE')} 
                          className="text-[#C2A382] font-semibold underline ml-1"
                        >
                          Change
                        </button>
                      </p>
                    </div>

                    {error && (
                      <motion.div 
                        initial={{ x: -6 }} 
                        animate={{ x: [0, -6, 6, -6, 0] }}
                        className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl text-center"
                      >
                        {error}
                      </motion.div>
                    )}

                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                      <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (otpInputs.current[idx] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(e.target.value, idx)}
                            onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                            className="w-11 h-12 text-center text-base font-semibold bg-[#EFECE6] border border-[#E2DCCE] rounded-xl focus:outline-none focus:border-[#C2A382] focus:ring-1 focus:ring-[#C2A382] transition-all"
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#756E65]">
                        {canResend ? (
                          <button
                            type="button"
                            onClick={() => { setTimer(30); setCanResend(false); }}
                            className="text-[#C2A382] font-semibold underline"
                          >
                            Resend OTP
                          </button>
                        ) : (
                          <span>Resend code in <strong className="text-[#1A1A1A]">00:{timer < 10 ? `0${timer}` : timer}</strong></span>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={otp.join('').length < 6 || isLoading}
                        className="w-full bg-[#1A1A1A] text-white rounded-xl py-3.5 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 hover:bg-[#2A2A2A] transition-all disabled:opacity-50"
                      >
                        {isLoading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>VERIFY & CONTINUE</span>
                            <ShieldCheck className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* STEP 3: COMPLETE PROFILE */}
                {step === 'PROFILE' && (
                  <motion.div
                    key="step-profile"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div>
                      <h2 className="font-serif text-2xl font-normal text-[#1A1A1A]">Complete your ARDENBY profile</h2>
                      <p className="text-xs text-[#756E65] mt-1">Provide details for a personalized shopping experience.</p>
                    </div>

                    {error && (
                      <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-[#5C554E] block">
                          Full Name
                        </label>
                        <div className="relative flex items-center">
                          <User className="absolute left-3.5 w-4 h-4 text-[#A0988E]" />
                          <input
                            required
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full bg-[#EFECE6] border border-[#E2DCCE] rounded-xl pl-10 pr-4 py-3 text-xs text-[#1A1A1A] placeholder-[#A0988E] focus:outline-none focus:border-[#C2A382] focus:ring-1 focus:ring-[#C2A382] transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-[#5C554E] block">
                          Email Address
                        </label>
                        <div className="relative flex items-center">
                          <Mail className="absolute left-3.5 w-4 h-4 text-[#A0988E]" />
                          <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="w-full bg-[#EFECE6] border border-[#E2DCCE] rounded-xl pl-10 pr-4 py-3 text-xs text-[#1A1A1A] placeholder-[#A0988E] focus:outline-none focus:border-[#C2A382] focus:ring-1 focus:ring-[#C2A382] transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-[#5C554E] block">
                          Gender
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'male', label: 'Male' },
                            { id: 'female', label: 'Female' },
                            { id: 'other', label: 'Prefer not to say' }
                          ].map((g) => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => setGender(g.id as any)}
                              className={`py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                                gender === g.id 
                                  ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-sm' 
                                  : 'bg-[#EFECE6] border-[#E2DCCE] text-[#756E65] hover:border-[#C2A382]'
                              }`}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#1A1A1A] text-white rounded-xl py-3.5 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 hover:bg-[#2A2A2A] transition-all mt-2"
                      >
                        {isLoading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>CONTINUE</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* STEP 4: MY ACCOUNT */}
                {step === 'ACCOUNT' && user && (
                  <motion.div
                    key="step-account"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-4 bg-[#EFECE6] p-4 rounded-2xl border border-[#E2DCCE]">
                      <div className="w-12 h-12 rounded-full bg-[#1A1A1A] text-[#FBF9F5] flex items-center justify-center font-serif text-lg font-bold shadow-md">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#A08C75] font-semibold block">
                          WELCOME BACK
                        </span>
                        <h3 className="font-serif text-xl font-medium text-[#1A1A1A] leading-tight">
                          {user.fullName}
                        </h3>
                        <p className="text-xs text-[#756E65] mt-0.5">+91 {user.phone}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {[
                        { label: 'MY ORDERS', icon: ShoppingBag, detail: 'View history & track packages' },
                        { label: 'WISHLIST', icon: Heart, detail: 'Saved luxury items' },
                        { label: 'SAVED ADDRESSES', icon: MapPin, detail: 'Manage delivery locations' },
                        { label: 'ACCOUNT DETAILS', icon: User, detail: 'Personal info & preferences' },
                        { label: 'COUPONS', icon: Ticket, detail: 'Exclusive member rewards' },
                        { label: 'HELP & SUPPORT', icon: HelpCircle, detail: 'Assistance & concierge' },
                      ].map((item, index) => (
                        <motion.button
                          key={item.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                          onClick={() => setIsOpen(false)}
                          className="group w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#EAE6DE] transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#EFECE6] group-hover:bg-white text-[#1A1A1A] transition-colors">
                              <item.icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#1A1A1A] tracking-wider">{item.label}</p>
                              <p className="text-[10px] text-[#756E65]">{item.detail}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#A0988E] group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      ))}
                    </div>

                    <div className="border-t border-[#EAE6DE] pt-3">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>LOGOUT</span>
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </>
  );
}