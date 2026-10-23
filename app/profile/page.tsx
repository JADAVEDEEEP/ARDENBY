'use client';

import {
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
  Pencil,
  LifeBuoy,
} from 'lucide-react';

import { ProfileFeedback } from '../../components/profile/ProfileHeader';
import { ProfileContent } from '../../components/profile/ProfileContent';
import { DeleteAccountModal } from '../../components/profile/DeleteAccountModal';
import { MembershipCard, MetalCard, SERIF_STYLE } from '../../components/profile/metal';
import { useProfile } from '../../hooks/use-profile';
import { CustomerAuthGate } from '@/components/auth/customer-auth-gate';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, count: null },
  { id: 'orders', label: 'My Orders', icon: Package, count: 'orders' },
  { id: 'wishlist', label: 'Wishlist', icon: Heart, count: 'wishlist' },
  { id: 'addresses', label: 'Addresses', icon: MapPin, count: 'addresses' },
  { id: 'coupons', label: 'Coupons & Offers', icon: Ticket, count: 'coupons' },
  { id: 'account', label: 'Account Details', icon: User, count: null },
  { id: 'security', label: 'Security', icon: ShieldCheck, count: null },
] as const;

const MOBILE_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'wishlist', label: 'Saved' },
  { id: 'account', label: 'Profile' },
] as const;

function ProfilePageView() {
  const profile = useProfile();

  /* ---------------- LOADING ---------------- */

  if (profile.loading) {
    return (
      <main className="kv-page min-h-screen">
        <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8">
          <div className="h-[260px] animate-pulse rounded-[20px] bg-[#1C1E22] lg:h-[360px]" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[248px_minmax(0,1fr)]">
            <div className="hidden h-[480px] animate-pulse rounded-[20px] bg-[#1C1E22] lg:block" />
            <div className="h-[480px] animate-pulse rounded-[20px] bg-[#1C1E22]" />
          </div>
        </div>
      </main>
    );
  }

  if (!profile.user) return null;

  const handleSectionChange = (section: typeof profile.activeSection) => {
    profile.setError('');
    profile.setMessage('');
    profile.setActiveSection(section);
  };

  const counts: Record<string, number> = {
    orders: profile.orders.length,
    wishlist: profile.wishlist.length,
    addresses: profile.addresses.length,
    coupons: profile.coupons.length,
  };

  const firstName = profile.displayName.split(' ')[0];
  const email = profile.user.email;
  const verified = Boolean(profile.user.email_verified);
  const goContact = () => profile.router.push('/contact');
  const isOverview = profile.activeSection === 'overview';

  const memberSinceText = profile.user.created_at
    ? new Date(profile.user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null;

  const Tags = () => (
    <div className="flex flex-wrap gap-2">
      <span className="kv-pill">
        <Star className="h-3.5 w-3.5 fill-[#D6B06A] text-[#D6B06A]" strokeWidth={1.7} /> Inner Circle Member
      </span>
      {verified && (
        <span className="kv-pill !text-[#5FD08A]">
          <BadgeCheck className="h-3.5 w-3.5" strokeWidth={1.7} /> Verified
        </span>
      )}
      {email && (
        <span className="kv-pill hidden lg:inline-flex">
          <Mail className="h-3.5 w-3.5" strokeWidth={1.7} />
          <span className="truncate">{email}</span>
        </span>
      )}
    </div>
  );

  return (
    <>

      <main className="kv-page min-h-screen pb-14 pt-5 text-white lg:pt-8">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-8">
          {/* ================= HERO (DESKTOP) ================= */}
          <MetalCard className="hidden min-h-[360px] lg:block">
            <span
              className="kv-wordmark absolute -bottom-6 left-6 text-[200px]"
              style={SERIF_STYLE}
              aria-hidden
            >
              KOVENIK
            </span>
            <div className="relative grid min-h-[360px] grid-cols-[1fr_auto] items-center gap-8 px-12 py-10">
              <div className="min-w-0">
                <p className="kv-label">KOVENIK — MY ACCOUNT</p>
                <p className="mt-5 text-[18px] text-[#C6C9CF]">Welcome back,</p>
                <h1 className="truncate text-[84px] font-normal leading-[1.05] text-white" style={SERIF_STYLE}>
                  {firstName}.
                </h1>
                <p className="mt-3 max-w-md text-[14px] leading-6 text-[#C6C9CF]">
                  Your orders, saved pieces and Inner Circle privileges — all in one place.
                </p>
                <div className="mt-6">
                  <Tags />
                </div>
              </div>
              <div className="pr-10">
                <MembershipCard name={profile.displayName} userId={profile.user.id} createdAt={profile.user.created_at} />
              </div>
            </div>
          </MetalCard>

          {/* ================= HERO (MOBILE) ================= */}
          <MetalCard className="lg:hidden">
            <span
              className="kv-wordmark absolute -bottom-3 left-2 text-[84px]"
              style={SERIF_STYLE}
              aria-hidden
            >
              KOVENIK
            </span>
            <div className="relative p-5">
              <div className="flex items-start justify-between">
                <p className="kv-label">KOVENIK — MY ACCOUNT</p>
                <button
                  type="button"
                  onClick={() => handleSectionChange('account')}
                  aria-label="Edit account details"
                  className="kv-disc -mt-1 h-11 w-11"
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.7} />
                </button>
              </div>
              <p className="mt-3 text-[15px] text-[#C6C9CF]">Welcome back,</p>
              <h1 className="truncate text-[44px] font-normal leading-[1.1] text-white" style={SERIF_STYLE}>
                {firstName}.
              </h1>
              <div className="mt-5 flex justify-center overflow-hidden py-3 pr-10">
                <MembershipCard
                  compact
                  name={profile.displayName}
                  userId={profile.user.id}
                  createdAt={profile.user.created_at}
                />
              </div>
              <div className="mt-4">
                <Tags />
              </div>
            </div>
          </MetalCard>

          {/* ================= MOBILE TABS ================= */}
          <div
            role="tablist"
            aria-label="Account sections"
            className="mt-4 grid grid-cols-4 gap-1 rounded-full border border-[#33363D] bg-[#16171B] p-1 lg:hidden"
          >
            {MOBILE_TABS.map((tab) => {
              const active = profile.activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleSectionChange(tab.id)}
                  className={`min-h-[44px] rounded-full text-[12px] font-semibold transition ${
                    active ? 'bg-gradient-to-b from-white to-[#E9E9E6] text-[#0A0A0A]' : 'text-[#C6C9CF]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ================= BODY ================= */}
          <div className="mt-5 grid items-start gap-6 lg:mt-6 lg:grid-cols-[248px_minmax(0,1fr)]">
            {/* SIDEBAR (desktop only) */}
            <aside className="hidden space-y-5 lg:sticky lg:top-24 lg:block">
              <MetalCard className="p-4">
                <div className="flex items-center gap-3 px-1 pb-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#D6B06A] bg-[#121316] text-[15px] text-white" style={SERIF_STYLE}>
                    {profile.initial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-white">{profile.displayName}</p>
                    {memberSinceText && <p className="text-[11px] text-[#9296A0]">Member since {memberSinceText}</p>}
                  </div>
                </div>

                <nav className="space-y-1">
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
                        className={`flex min-h-[42px] w-full items-center gap-3 rounded-xl border px-3 text-left transition ${
                          active
                            ? 'border-[#42454C] bg-gradient-to-b from-[#34373d] to-[#24262b] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12)]'
                            : 'border-transparent text-[#C6C9CF] hover:bg-white/[0.04] hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                        <span className="flex-1 truncate text-[13px] font-medium">{item.label}</span>
                        {active ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#D6B06A]" />
                        ) : count !== null && count > 0 ? (
                          <span className="text-[11px] text-[#9296A0]">{count}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </nav>

                <div className="my-3 h-px bg-[#2c2e34]" />

                <button
                  type="button"
                  onClick={profile.logout}
                  className="flex min-h-[42px] w-full items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-[#EF7B7B] transition hover:bg-[#2a1517]"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.7} />
                  Log out
                </button>
              </MetalCard>

              <MetalCard className="p-5">
                <p className="kv-label">Concierge</p>
                <p className="mt-3 text-[17px] leading-snug text-white" style={SERIF_STYLE}>
                  Need a hand with an order?
                </p>
                <p className="mt-2 text-[11px] leading-5 text-[#9296A0]">
                  Sizing, exchanges or delivery — reach our team any time.
                </p>
                <button type="button" onClick={goContact} className="kv-btn-ghost mt-4 w-full">
                  <LifeBuoy className="h-4 w-4" /> Contact Support
                </button>
              </MetalCard>
            </aside>

            {/* MAIN */}
            <section className="min-w-0">
              <div className="kv-scope">
                <ProfileFeedback
                  error={profile.error}
                  message={profile.message}
                  onClear={() => {
                    profile.setError('');
                    profile.setMessage('');
                  }}
                />
              </div>

              {isOverview ? (
                <ProfileContent profile={profile} />
              ) : (
                <MetalCard>
                  <div className="kv-scope p-4 sm:p-6 lg:p-7">
                    <ProfileContent profile={profile} />
                  </div>
                </MetalCard>
              )}
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
