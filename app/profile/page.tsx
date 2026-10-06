'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  User,
  Package,
  Heart,
  MapPin,
  Ticket,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  ArrowRight,
} from 'lucide-react';

import { ProfileFeedback } from '../../components/profile/ProfileHeader';
import { ProfileContent } from '../../components/profile/ProfileContent';
import { DeleteAccountModal } from '../../components/profile/DeleteAccountModal';
import { useProfile } from '../../hooks/use-profile';

/* ---------------------------------------------------------------
   KOVENIK tokens (visual only)
   canvas #050505 · surfaces #0A0A0A #101010 #141414
   ivory #F3EBDD · gold #C9A24B · champagne #E6CF92 · bronze #8A6A2B
---------------------------------------------------------------- */
const SERIF = { fontFamily: 'Bodoni MT, Didot, Times New Roman, serif' };
const GOLD_SURFACE =
  'bg-[linear-gradient(135deg,#9C7A32_0%,#E6CF92_45%,#B8903A_100%)] text-[#0A0A0A]';
const PANEL =
  'rounded-2xl border border-[#C9A24B]/20 bg-[linear-gradient(180deg,#141414_0%,#0A0A0A_100%)] shadow-[inset_0_1px_0_rgba(230,207,146,0.08)]';

/* Canvas: subtle gold glow + faint diagonal metallic lines */
const CANVAS_BG = {
  backgroundColor: '#050505',
  backgroundImage: [
    'radial-gradient(ellipse 60% 40% at 85% 0%, rgba(201,162,75,0.16), transparent 70%)',
    'radial-gradient(ellipse 40% 30% at 0% 100%, rgba(138,106,43,0.10), transparent 70%)',
    'repeating-linear-gradient(115deg, transparent 0 140px, rgba(201,162,75,0.035) 140px 141px)',
  ].join(','),
} as const;

/*
  Scoped dark override for <ProfileContent /> and <ProfileFeedback />.
  Their source wasn't provided, so this remaps their old light utility
  classes (white cards, cream fills, light borders, dark-on-light text)
  to the KOVENIK dark system. It touches presentation only.
  Once ProfileContent is restyled directly, delete this block.
*/
const DARK_SCOPE_CSS = `
.kv-scope [class*="bg-white"],
.kv-scope [class*="bg-[#FCFBF8]"],
.kv-scope [class*="bg-[#FAF9F6]"],
.kv-scope [class*="bg-[#F5F3EE]"],
.kv-scope [class*="bg-[#F7F5F0]"],
.kv-scope [class*="bg-[#FBFAF7]"],
.kv-scope [class*="bg-stone-"],
.kv-scope [class*="bg-neutral-50"],
.kv-scope [class*="bg-neutral-100"] {
  background: linear-gradient(180deg,#121212 0%,#0A0A0A 100%) !important;
}
.kv-scope [class*="border-[#DED9D0]"],
.kv-scope [class*="border-[#E7E2DA]"],
.kv-scope [class*="border-[#D9D3C9]"],
.kv-scope [class*="border-[#E6E1D9]"],
.kv-scope [class*="border-stone-"],
.kv-scope [class*="border-neutral-"],
.kv-scope .border {
  border-color: rgba(201,162,75,0.22) !important;
}
.kv-scope [class*="divide-"] > * { border-color: rgba(201,162,75,0.2) !important; }
.kv-scope [class*="text-[#171717]"],
.kv-scope [class*="text-[#403B36]"],
.kv-scope [class*="text-neutral-9"],
.kv-scope [class*="text-black"] { color: #F3EBDD !important; }
.kv-scope [class*="text-[#817970]"],
.kv-scope [class*="text-[#827A71]"],
.kv-scope [class*="text-[#6F6962]"],
.kv-scope [class*="text-[#91877D]"],
.kv-scope [class*="text-[#9A9187]"],
.kv-scope [class*="text-[#8D847B]"],
.kv-scope [class*="text-[#999087]"],
.kv-scope [class*="text-[#A0988E]"],
.kv-scope [class*="text-[#B7AEA4]"],
.kv-scope [class*="text-neutral-4"],
.kv-scope [class*="text-neutral-5"],
.kv-scope [class*="text-neutral-6"] { color: rgba(243,235,221,0.62) !important; }
.kv-scope [class*="text-[#A67C42]"],
.kv-scope [class*="text-[#C5A06A]"] { color: #C9A24B !important; }
/* old dark-filled buttons become metallic gold buttons */
.kv-scope button[class*="bg-[#171717]"],
.kv-scope a[class*="bg-[#171717]"] {
  background: linear-gradient(135deg,#9C7A32 0%,#E6CF92 45%,#B8903A 100%) !important;
  color: #0A0A0A !important;
  border-color: transparent !important;
}
.kv-scope button[class*="bg-[#171717]"] *,
.kv-scope a[class*="bg-[#171717]"] * { color: #0A0A0A !important; }
.kv-scope input, .kv-scope textarea, .kv-scope select {
  background: #0A0A0A !important;
  color: #F3EBDD !important;
  border-color: rgba(201,162,75,0.35) !important;
}
.kv-scope input::placeholder, .kv-scope textarea::placeholder { color: rgba(243,235,221,0.35) !important; }
.kv-scope [class*="hover:bg-"]:hover { background: rgba(201,162,75,0.08) !important; }
`;

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
  { id: 'coupons', label: 'Coupons & Offers', icon: Ticket },
  { id: 'account', label: 'Account Details', icon: User },
  { id: 'security', label: 'Security & Password', icon: ShieldCheck },
] as const;

function Avatar({ initial, size = 'md' }: { initial: string; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-9 w-9 text-[11px]' : 'h-12 w-12 text-sm';
  return (
    <div
      className={`relative flex ${dim} shrink-0 items-center justify-center rounded-full border border-[#C9A24B]/70 bg-[#050505] font-medium text-[#E6CF92] shadow-[0_0_14px_rgba(201,162,75,0.15)]`}
    >
      {initial}
      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0A0A0A] bg-emerald-500" />
    </div>
  );
}

function NavList({
  activeSection,
  onSectionChange,
}: {
  activeSection: string;
  onSectionChange: (section: any) => void;
}) {
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSectionChange(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`group flex min-h-[44px] w-full items-center justify-between rounded-lg border px-3 text-left transition-all duration-200 ${
              isActive
                ? 'border-[#C9A24B]/80 bg-[#C9A24B]/[0.08] text-[#F3EBDD] shadow-[0_0_16px_rgba(201,162,75,0.12)]'
                : 'border-transparent text-[#F3EBDD]/70 hover:border-[#C9A24B]/20 hover:bg-[#C9A24B]/[0.04] hover:text-[#F3EBDD]'
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon
                className={`h-[17px] w-[17px] ${
                  isActive ? 'text-[#E6CF92]' : 'text-[#C9A24B]/70 group-hover:text-[#E6CF92]'
                }`}
                strokeWidth={1.5}
              />
              <span className="text-[13px] font-medium">{item.label}</span>
            </span>
            <ChevronRight
              className={`h-3.5 w-3.5 ${isActive ? 'text-[#E6CF92]' : 'text-[#C9A24B]/50'}`}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </nav>
  );
}

export default function ProfilePage() {
  const profile = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ---------------- LOADING ---------------- */

  if (profile.loading) {
    return (
      <main className="min-h-screen" style={CANVAS_BG}>
        <div className="mx-auto max-w-[1360px] px-4 py-8 sm:px-8 lg:px-10">
          <div className="mb-8 border-b border-[#C9A24B]/25 pb-6">
            <div className="h-3 w-24 animate-pulse rounded bg-[#C9A24B]/15" />
            <div className="mt-4 h-9 w-52 animate-pulse rounded bg-[#C9A24B]/15" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
            <div className="hidden h-[520px] animate-pulse rounded-2xl bg-[#101010] lg:block" />
            <div className="h-[520px] animate-pulse rounded-2xl bg-[#101010]" />
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
    setMobileMenuOpen(false);
  };

  const currentNav = NAV_ITEMS.find((item) => item.id === profile.activeSection);

  return (
    <>
      <style>{DARK_SCOPE_CSS}</style>

      <main className="min-h-screen text-[#F3EBDD]" style={CANVAS_BG}>
        {/* ACCOUNT HERO */}
        <div className="border-b border-[#C9A24B]/25">
          <header className="mx-auto max-w-[1360px] px-4 pb-6 pt-7 sm:px-8 lg:px-10 lg:pb-8 lg:pt-10">
            <div className="flex items-end justify-between gap-6">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rotate-45 bg-[#C9A24B]" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C9A24B]">
                    KOVENIK / ACCOUNT
                  </p>
                </div>

                <h1
                  className="text-[34px] font-normal leading-none tracking-[-0.01em] sm:text-[44px] lg:text-[52px]"
                  style={SERIF}
                >
                  My Account
                </h1>

                <p className="mt-3 max-w-xl text-[13px] leading-6 text-[#F3EBDD]/60">
                  Manage your profile, orders, wishlist and personal preferences.
                </p>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A24B]/80">
                    Signed in as
                  </p>
                  <p className="mt-1 max-w-[240px] truncate text-[12px] text-[#F3EBDD]">
                    {profile.user?.email}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#C9A24B]/70 bg-[#050505] text-sm font-medium text-[#E6CF92]">
                  {profile.initial}
                </div>
              </div>
            </div>
          </header>
        </div>

        <div className="mx-auto max-w-[1360px] px-4 pb-14 pt-5 sm:px-8 lg:px-10 lg:pt-7">
          {/* FEEDBACK */}
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

          {/* MOBILE: compact profile + account menu card */}
          <div className={`mb-5 overflow-hidden lg:hidden ${PANEL}`}>
            <div className="flex items-center gap-3 p-4">
              <Avatar initial={profile.initial} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{profile.displayName}</p>
                <p className="truncate text-[11px] text-[#F3EBDD]/55">{profile.user?.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle account menu"
              className="flex min-h-[48px] w-full items-center justify-between border-t border-[#C9A24B]/20 px-4 text-left"
            >
              <span className="flex items-center gap-3">
                {mobileMenuOpen ? (
                  <X className="h-4 w-4 text-[#C9A24B]" strokeWidth={1.6} />
                ) : (
                  <Menu className="h-4 w-4 text-[#C9A24B]" strokeWidth={1.6} />
                )}
                <span className="text-[13px] font-medium text-[#E6CF92]">{currentNav?.label}</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 text-[#C9A24B] transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`}
                strokeWidth={1.6}
              />
            </button>

            {mobileMenuOpen && (
              <div className="border-t border-[#C9A24B]/20 p-3">
                <NavList activeSection={profile.activeSection} onSectionChange={handleSectionChange} />
                <div className="my-2 h-px bg-[#C9A24B]/20" />
                <button
                  type="button"
                  onClick={profile.logout}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-[13px] text-[#F3EBDD]/60 hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* WORKSPACE */}
          <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden lg:block lg:sticky lg:top-24">
              <div className={`p-5 ${PANEL}`}>
                <div className="flex items-center gap-3">
                  <Avatar initial={profile.initial} />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold">{profile.displayName}</p>
                    <p className="mt-0.5 truncate text-[11px] text-[#F3EBDD]/55">{profile.user?.email}</p>
                  </div>
                </div>

                <div className="my-5 h-px bg-[#C9A24B]/20" />

                <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C9A24B]">
                  Account
                </p>

                <NavList activeSection={profile.activeSection} onSectionChange={handleSectionChange} />

                <div className="my-4 h-px bg-[#C9A24B]/20" />

                <button
                  type="button"
                  onClick={profile.logout}
                  className="group flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-[#F3EBDD]/60 transition-colors hover:text-red-400"
                >
                  <LogOut
                    className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                    strokeWidth={1.5}
                  />
                  Logout
                </button>
              </div>

              <div className={`mt-4 p-5 ${PANEL}`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C9A24B]">
                  Wear your essence
                </p>
                <Link
                  href="/shop"
                  className={`mt-3 flex min-h-[44px] items-center justify-center gap-2 rounded-lg text-[11px] font-bold uppercase tracking-[0.16em] shadow-[0_0_18px_rgba(201,162,75,0.2)] transition hover:brightness-110 ${GOLD_SURFACE}`}
                >
                  Explore Collections
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </aside>

            {/* CONTENT */}
            <section className="min-w-0">
              <div className={PANEL}>
                <div className="flex items-center justify-between border-b border-[#C9A24B]/20 px-5 py-4 sm:px-7">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rotate-45 bg-[#C9A24B]" />
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C9A24B]">
                        Account Space
                      </p>
                    </div>
                    <h2 className="mt-1.5 text-[22px] font-normal text-[#F3EBDD]" style={SERIF}>
                      {currentNav?.label}
                    </h2>
                  </div>
                </div>

                {/* EXISTING DYNAMIC CONTENT (dark-scoped) */}
                <div className="kv-scope p-4 sm:p-6 lg:p-7">
                  <ProfileContent profile={profile} />
                </div>
              </div>
            </section>
          </div>

          {/* FOOTER */}
          <div className="mt-8 flex flex-col gap-2 border-t border-[#C9A24B]/20 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#C9A24B]">
              KOVENIK — WEAR YOUR ESSENCE
            </p>
            <p className="text-[11px] text-[#F3EBDD]/45">Your account &amp; personal information</p>
          </div>
        </div>
      </main>

      <DeleteAccountModal profile={profile} />
    </>
  );
}