'use client';

import { useState, useEffect } from 'react';
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
  LayoutDashboard,
  ArrowUpRight,
} from 'lucide-react';

import { ProfileFeedback } from '../../components/profile/ProfileHeader';
import { ProfileContent } from '../../components/profile/ProfileContent';
import { DeleteAccountModal } from '../../components/profile/DeleteAccountModal';
import { useProfile } from '../../hooks/use-profile';

const NAV_ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
  },
  {
    id: 'orders',
    label: 'My Orders',
    icon: Package,
  },
  {
    id: 'wishlist',
    label: 'Wishlist',
    icon: Heart,
  },
  {
    id: 'addresses',
    label: 'Saved Addresses',
    icon: MapPin,
  },
  {
    id: 'coupons',
    label: 'Coupons & Offers',
    icon: Ticket,
  },
  {
    id: 'account',
    label: 'Account Details',
    icon: User,
  },
  {
    id: 'security',
    label: 'Security & Password',
    icon: ShieldCheck,
  },
] as const;

function SidebarNav({
  user,
  displayName,
  initial,
  activeSection,
  onSectionChange,
  onLogout,
}: {
  user: any;
  displayName: string;
  initial: string;
  activeSection: string;
  onSectionChange: (section: any) => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* PROFILE IDENTITY */}
        <div className="mb-7">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#171717] text-sm font-medium text-white">
              {initial}

              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#8C9A75]" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-[#171717]">
                {displayName}
              </p>

              <p className="mt-0.5 truncate text-[11px] text-[#827A71]">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="mt-5 h-px w-full bg-[#E7E2DA]" />
        </div>

        {/* ACCOUNT LABEL */}
        <div className="mb-3 px-1">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9A9187]">
            Account
          </p>
        </div>

        {/* NAVIGATION */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSectionChange(item.id)}
                className={`group relative flex h-11 w-full items-center justify-between px-3 text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-[#171717] text-white'
                    : 'text-[#6F6962] hover:bg-[#F7F5F0] hover:text-[#171717]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-[16px] w-[16px] ${
                      isActive
                        ? 'text-[#C5A06A]'
                        : 'text-[#817970] group-hover:text-[#171717]'
                    }`}
                    strokeWidth={1.5}
                  />

                  <span className="text-[12px] font-medium tracking-[0.01em]">
                    {item.label}
                  </span>
                </div>

                <ChevronRight
                  className={`h-3.5 w-3.5 transition-all duration-200 ${
                    isActive
                      ? 'translate-x-0 text-[#C5A06A]'
                      : 'translate-x-1 text-[#B7AEA4] opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                  }`}
                  strokeWidth={1.5}
                />
              </button>
            );
          })}
        </nav>
      </div>

      {/* LOGOUT */}
      <div className="mt-8">
        <div className="mb-4 h-px w-full bg-[#E7E2DA]" />

        <button
          type="button"
          onClick={onLogout}
          className="group flex h-10 w-full items-center gap-3 px-3 text-[12px] font-medium text-[#827A71] transition-colors duration-200 hover:text-[#A33A32]"
        >
          <LogOut
            className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
            strokeWidth={1.5}
          />

          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const profile = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  /* ---------------- LOADING ---------------- */

  if (profile.loading) {
    return (
      <main className="min-h-screen bg-[#F5F3EE]">
        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-12">
          {/* HEADER SKELETON */}
          <div className="mb-10 border-b border-[#DED9D0] pb-6">
            <div className="h-3 w-24 animate-pulse bg-[#E6E1D9]" />
            <div className="mt-4 h-9 w-52 animate-pulse bg-[#E6E1D9]" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="hidden h-[600px] animate-pulse bg-white lg:block" />

            <div className="min-h-[600px] animate-pulse bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (!profile.user) return null;

  const handleSectionChange = (
    section: typeof profile.activeSection,
  ) => {
    profile.setError('');
    profile.setMessage('');
    profile.setActiveSection(section);
    setMobileMenuOpen(false);
  };

  const currentNav = NAV_ITEMS.find(
    (item) => item.id === profile.activeSection,
  );

  return (
    <>
      <main className="min-h-screen bg-[#F5F3EE] text-[#171717]">
        <div className="mx-auto max-w-[1500px] px-5 pb-16 pt-7 sm:px-8 lg:px-12 lg:pt-10">
          {/* ================================================
              PAGE HEADER
          ================================================= */}

          <header className="mb-7 border-b border-[#DED9D0] pb-6 sm:mb-9">
            <div className="flex items-end justify-between gap-6">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-px w-7 bg-[#A67C42]" />

                  <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#91877D]">
                    ARDENBY / ACCOUNT
                  </p>
                </div>

                <h1
                  className="text-[32px] font-normal leading-none tracking-[-0.035em] sm:text-[40px]"
                  style={{
                    fontFamily:
                      'Bodoni MT, Didot, Times New Roman, serif',
                  }}
                >
                  My Account
                </h1>

                <p className="mt-3 max-w-xl text-[12px] leading-5 text-[#817970]">
                  Manage your profile, orders, wishlist and personal
                  preferences.
                </p>
              </div>

              {/* DESKTOP ACCOUNT MARK */}
              <div className="hidden items-center gap-3 sm:flex">
                <div className="text-right">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9B9288]">
                    Signed in as
                  </p>

                  <p className="mt-1 max-w-[190px] truncate text-[11px] font-medium text-[#403B36]">
                    {profile.user?.email}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D9D3C9] bg-white text-xs font-medium">
                  {profile.initial}
                </div>
              </div>
            </div>
          </header>

          {/* FEEDBACK */}
          <ProfileFeedback
            error={profile.error}
            message={profile.message}
            onClear={() => {
              profile.setError('');
              profile.setMessage('');
            }}
          />

          {/* ================================================
              MOBILE ACCOUNT BAR
          ================================================= */}

          <div className="mb-5 flex items-center justify-between border border-[#DED9D0] bg-white px-4 py-3 lg:hidden">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center bg-[#171717] text-white transition-transform active:scale-95"
                aria-label="Open account menu"
              >
                <Menu className="h-4 w-4" strokeWidth={1.7} />
              </button>

              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#999087]">
                  MY ACCOUNT
                </p>

                <p className="mt-0.5 text-[12px] font-semibold text-[#171717]">
                  {currentNav?.label}
                </p>
              </div>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171717] text-[10px] font-medium text-white">
              {profile.initial}
            </div>
          </div>

          {/* ================================================
              MOBILE DRAWER
          ================================================= */}

          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                onClick={() => setMobileMenuOpen(false)}
                className="absolute inset-0 bg-[#171717]/45 backdrop-blur-[2px]"
              />

              <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-[330px] flex-col bg-[#FCFBF8] p-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#DED9D0] pb-4">
                  <div>
                    <span
                      className="text-lg tracking-[-0.03em]"
                      style={{
                        fontFamily:
                          'Bodoni MT, Didot, Times New Roman, serif',
                      }}
                    >
                      ARDENBY
                    </span>

                    <p className="mt-0.5 text-[7px] font-semibold tracking-[0.25em] text-[#968D83]">
                      WEAR YOUR ESSENCE
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-8 w-8 items-center justify-center border border-[#DED9D0] bg-white"
                    aria-label="Close account menu"
                  >
                    <X
                      className="h-4 w-4 text-[#171717]"
                      strokeWidth={1.5}
                    />
                  </button>
                </div>

                <div className="mt-6 flex-1 overflow-y-auto">
                  <SidebarNav
                    user={profile.user}
                    displayName={profile.displayName}
                    initial={profile.initial}
                    activeSection={profile.activeSection}
                    onSectionChange={handleSectionChange}
                    onLogout={profile.logout}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================================================
              MAIN ACCOUNT WORKSPACE
          ================================================= */}

          <div className="grid items-stretch gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* DESKTOP SIDEBAR */}

            <aside className="hidden lg:flex">
              <div className="flex min-h-[650px] w-full flex-col border border-[#DED9D0] bg-white p-5">
                <SidebarNav
                  user={profile.user}
                  displayName={profile.displayName}
                  initial={profile.initial}
                  activeSection={profile.activeSection}
                  onSectionChange={handleSectionChange}
                  onLogout={profile.logout}
                />
              </div>
            </aside>

            {/* MAIN CONTENT */}

            <section className="min-w-0">
              <div className="min-h-[650px] border border-[#DED9D0] bg-white">
                {/* CONTENT TOP BAR */}

                <div className="flex items-center justify-between border-b border-[#E7E2DA] px-5 py-4 sm:px-7">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#A67C42]" />

                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8D847B]">
                        Account Space
                      </p>
                    </div>

                    <h2
                      className="mt-1.5 text-[20px] font-normal tracking-[-0.025em] text-[#171717]"
                      style={{
                        fontFamily:
                          'Bodoni MT, Didot, Times New Roman, serif',
                      }}
                    >
                      {currentNav?.label}
                    </h2>
                  </div>

                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="text-[9px] uppercase tracking-[0.15em] text-[#AAA198]">
                      ARDENBY
                    </span>

                    <ArrowUpRight
                      className="h-3.5 w-3.5 text-[#A67C42]"
                      strokeWidth={1.4}
                    />
                  </div>
                </div>

                {/* EXISTING DYNAMIC CONTENT */}

                <div className="p-5 sm:p-7 lg:p-8">
                  <ProfileContent profile={profile} />
                </div>
              </div>
            </section>
          </div>

          {/* ================================================
              FOOTER MICRO COPY
          ================================================= */}

          <div className="mt-6 flex flex-col gap-2 border-t border-[#DED9D0] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[9px] uppercase tracking-[0.16em] text-[#A0988E]">
              ARDENBY — WEAR YOUR ESSENCE
            </p>

            <p className="text-[10px] text-[#A0988E]">
              Your account & personal information
            </p>
          </div>
        </div>
      </main>

      <DeleteAccountModal profile={profile} />
    </>
  );
}