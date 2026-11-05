'use client';

import { useState } from 'react';
import {
  ChevronDown,
  User,
  Package,
  Heart,
  MapPin,
  Ticket,
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  Star,
  Mail,
  BadgeCheck,
  LifeBuoy,
} from 'lucide-react';

import { ProfileFeedback } from '../../components/profile/ProfileHeader';
import { ProfileContent } from '../../components/profile/ProfileContent';
import { DeleteAccountModal } from '../../components/profile/DeleteAccountModal';
import { MembershipCard, SERIF_STYLE, memberCode } from '../../components/profile/metal';
import { useProfile } from '../../hooks/use-profile';
import { CustomerAuthGate } from '@/components/auth/customer-auth-gate';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, count: null },
  { id: 'orders', label: 'My Orders', icon: Package, count: 'orders' },
  { id: 'wishlist', label: 'Wishlist', icon: Heart, count: 'wishlist' },
  { id: 'addresses', label: 'Addresses', icon: MapPin, count: 'addresses' },
  { id: 'coupons', label: 'Coupons & Offers', icon: Ticket, count: 'coupons' },
  { id: 'membership', label: 'My Membership', icon: BadgeCheck, count: null },
  { id: 'account', label: 'Account Details', icon: User, count: null },
  { id: 'security', label: 'Security', icon: ShieldCheck, count: null },
] as const;

type NavId = (typeof NAV_ITEMS)[number]['id'];

function ProfilePageView() {
  const profile = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);

  /* ---------------- LOADING ---------------- */

  if (profile.loading) {
    return (
      <main className="kv-page min-h-screen">
        <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8">
          <div className="h-[200px] animate-pulse rounded bg-[#F5F5F5] lg:h-[300px]" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="hidden h-[480px] animate-pulse rounded bg-[#F5F5F5] lg:block" />
            <div className="h-[480px] animate-pulse rounded bg-[#F5F5F5]" />
          </div>
        </div>
      </main>
    );
  }

  if (!profile.user) return null;

  const handleSectionChange = (section: NavId) => {
    profile.setError('');
    profile.setMessage('');
    profile.setActiveSection(section);
    setMenuOpen(false);
  };

  const counts: Record<string, number> = {
    orders: profile.orders.length,
    wishlist: profile.wishlist.length,
    addresses: profile.addresses.length,
    coupons: profile.coupons.length,
  };

  const email = profile.user.email;
  const verified = Boolean(profile.user.email_verified);
  const goContact = () => profile.router.push('/contact');
  const isOverview = profile.activeSection === 'overview';
  const activeItem = NAV_ITEMS.find((n) => n.id === profile.activeSection) ?? NAV_ITEMS[0];

  const memberSinceText = profile.user.created_at
    ? new Date(profile.user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null;

  const tags = (
    <div className="flex flex-wrap gap-2">
      <span className="kv-pill">
        <Star className="h-4 w-4 fill-[#EF3535] text-[#EF3535]" strokeWidth={1.7} /> Inner Circle Member
      </span>
      {verified && (
        <span className="kv-pill">
          <BadgeCheck className="h-4 w-4" strokeWidth={1.7} /> Email verified
        </span>
      )}
      {email && (
        <span className="kv-pill">
          <Mail className="h-4 w-4 shrink-0" strokeWidth={1.7} />
          <span className="truncate">{email}</span>
        </span>
      )}
    </div>
  );

  const nav = (
    <nav aria-label="My account" className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = profile.activeSection === item.id;
        const count = item.count ? counts[item.count] : null;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSectionChange(item.id)}
            aria-current={active ? 'page' : undefined}
            className={`relative flex min-h-[48px] w-full items-center gap-3 rounded-[2px] px-4 text-left text-[16px] transition ${
              active ? 'bg-[#F5F5F5] font-bold text-[#111111]' : 'font-medium text-[#444444] hover:bg-[#F5F5F5]'
            }`}
          >
            {active && <span className="absolute inset-y-0 left-0 w-[3px] bg-[#EF3535]" aria-hidden />}
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.7} />
            <span className="flex-1 truncate">{item.label}</span>
            {count !== null && count > 0 &&
              (item.id === 'coupons' ? (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#111111] px-1.5 text-[13px] font-bold text-white">
                  {count}
                </span>
              ) : (
                <span className="text-[15px] font-medium text-[#666666]">{count}</span>
              ))}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      <main className="kv-page min-h-screen pb-16 pt-5 text-[#111111] lg:pt-8">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-8">
          {isOverview ? (
            <>
              {/* ================= BANNER (DESKTOP) ================= */}
              <div className="kv-metal hidden min-h-[280px] overflow-hidden lg:block">
                <span
                  className="kv-wordmark absolute -bottom-5 right-[-20px] text-[240px]"
                  style={SERIF_STYLE}
                  aria-hidden
                >
                  KOVENIK
                </span>
                <div className="relative grid min-h-[280px] grid-cols-[1fr_auto] items-center gap-10 px-12 py-10">
                  <div className="min-w-0">
                    <p className="text-[16px] font-bold text-[#C8211F]">My Account</p>
                    <h1 className="kv-display mt-2 text-[44px] xl:text-[52px]">Welcome back, {profile.displayName}</h1>
                    <p className="mt-3 max-w-xl text-[17px] leading-7 text-[#666666]">
                      Your orders, saved pieces and Inner Circle privileges — all in one place.
                    </p>
                    <div className="mt-6">{tags}</div>
                  </div>
                  <MembershipCard name={profile.displayName} userId={profile.user.id} createdAt={profile.user.created_at} />
                </div>
              </div>

              {/* ================= WELCOME CARD (MOBILE) ================= */}
              <div className="rounded bg-[#111111] p-5 text-white lg:hidden">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] text-[#D1D1D1]">Welcome back</p>
                  <span className="text-[13px] font-bold tracking-[0.08em] text-[#EF3535]">INNER CIRCLE</span>
                </div>
                <h1 className="mt-1 text-[32px] font-bold uppercase leading-[1.1]" style={SERIF_STYLE}>
                  {profile.displayName}
                </h1>
                <p className="mt-2 text-[15px] text-[#D1D1D1]">
                  {[memberSinceText && `Member since ${memberSinceText}`, memberCode(profile.user.id, profile.user.created_at)]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {email && (
                  <p className="mt-2 flex items-center gap-2 break-all text-[15px]">
                    {verified && <BadgeCheck className="h-4 w-4 shrink-0" />}
                    <span>
                      {email}
                      {verified ? ' · Verified' : ''}
                    </span>
                  </p>
                )}
              </div>
            </>
          ) : (
            /* ================= COMPACT STRIP ================= */
            <div className="hidden border-b border-[#E5E5E5] pb-5 lg:block">
              <nav aria-label="Breadcrumb" className="text-[15px] text-[#666666]">
                <button type="button" onClick={() => profile.router.push('/')} className="hover:text-[#111111]">
                  Home
                </button>
                <span className="mx-2">/</span>
                <button type="button" onClick={() => handleSectionChange('overview')} className="hover:text-[#111111]">
                  My Account
                </button>
                <span className="mx-2">/</span>
                <span className="font-semibold text-[#111111]">{activeItem.label}</span>
              </nav>
              <div className="mt-1 flex items-center justify-between gap-4">
                <h1 className="kv-display text-[40px]">My Account</h1>
                <span className="kv-pill !bg-[#111111] !text-white">
                  <Star className="h-4 w-4 fill-[#EF3535] text-[#EF3535]" strokeWidth={1.7} /> Inner Circle Member
                </span>
              </div>
            </div>
          )}

          {/* ================= MOBILE ACCOUNT MENU ================= */}
          <div className="relative mt-4 lg:hidden">
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="account-menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex min-h-[56px] w-full items-center justify-between rounded-[4px] border border-[#E5E5E5] bg-[#F5F5F5] px-4 text-left"
            >
              <span className="min-w-0">
                <span className="block text-[13px] text-[#666666]">My Account</span>
                <span className="block truncate text-[16px] font-bold text-[#111111]">{activeItem.label}</span>
              </span>
              <span className="flex items-center gap-1 text-[16px] font-semibold text-[#111111]">
                Menu <ChevronDown className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>
            {menuOpen && (
              <div id="account-menu" className="mt-2 rounded-[4px] border border-[#E5E5E5] bg-white p-2">
                {nav}
                <div className="my-2 h-px bg-[#E5E5E5]" />
                <button
                  type="button"
                  onClick={profile.logout}
                  className="flex min-h-[48px] w-full items-center gap-3 px-4 text-[16px] font-semibold text-[#C8211F]"
                >
                  <LogOut className="h-[18px] w-[18px]" strokeWidth={1.7} /> Log out
                </button>
              </div>
            )}
          </div>

          {/* ================= BODY ================= */}
          <div className="mt-5 grid items-start gap-8 lg:mt-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* SIDEBAR (desktop only) */}
            <aside className="hidden space-y-5 lg:sticky lg:top-24 lg:block">
              <div className="rounded-[4px] border border-[#E5E5E5] bg-white p-4">
                <div className="flex items-center gap-3 border-b border-[#E5E5E5] px-1 pb-4">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#EF3535] bg-white text-[18px] font-bold text-[#111111]"
                    style={SERIF_STYLE}
                  >
                    {profile.initial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-bold text-[#111111]">{profile.displayName}</p>
                    {memberSinceText && <p className="text-[14px] text-[#666666]">Member since {memberSinceText}</p>}
                  </div>
                </div>

                <div className="mt-3">{nav}</div>

                <div className="my-3 h-px bg-[#E5E5E5]" />

                <button
                  type="button"
                  onClick={profile.logout}
                  className="flex min-h-[48px] w-full items-center gap-3 rounded-[2px] px-4 text-[16px] font-semibold text-[#C8211F] transition hover:bg-[#F5F5F5]"
                >
                  <LogOut className="h-[18px] w-[18px]" strokeWidth={1.7} />
                  Log out
                </button>
              </div>

              <div className="rounded-[4px] border border-[#E5E5E5] bg-[#F5F5F5] p-5">
                <p className="kv-display text-[22px]">Need a hand?</p>
                <p className="mt-2 text-[15px] leading-6 text-[#666666]">
                  Sizing, returns or delivery — reach our team any time.
                </p>
                <button type="button" onClick={goContact} className="kv-btn-ghost mt-4 w-full">
                  <LifeBuoy className="h-4 w-4" /> Contact support
                </button>
              </div>
            </aside>

            {/* MAIN */}
            <section className="min-w-0">
              <ProfileFeedback
                error={profile.error}
                message={profile.message}
                onClear={() => {
                  profile.setError('');
                  profile.setMessage('');
                }}
              />
              <ProfileContent profile={profile} />
            </section>
          </div>
        </div>
      </main>

      <DeleteAccountModal profile={profile} />
    </>
  );
}

// Customer-only page: signed-out visitors are asked to sign in and brought back here.
export default function ProfilePage() {
  return (
    <CustomerAuthGate title="Sign in to view your account">
      <ProfilePageView />
    </CustomerAuthGate>
  );
}
