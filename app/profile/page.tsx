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
} from 'lucide-react';

import { ProfileFeedback } from '../../components/profile/ProfileHeader';
import { ProfileContent } from '../../components/profile/ProfileContent';
import { DeleteAccountModal } from '../../components/profile/DeleteAccountModal';
import { useProfile } from '../../hooks/use-profile';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, color: '#171717', bg: '#FAF9F6' },
  { id: 'orders', label: 'My Orders', icon: Package, color: '#6366F1', bg: '#EEF2FF' },
  { id: 'wishlist', label: 'Wishlist', icon: Heart, color: '#F43F5E', bg: '#FFF1F2' },
  { id: 'addresses', label: 'Saved Addresses', icon: MapPin, color: '#10B981', bg: '#ECFDF5' },
  { id: 'coupons', label: 'Coupons & Offers', icon: Ticket, color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'account', label: 'Account Details', icon: User, color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'security', label: 'Security & Password', icon: ShieldCheck, color: '#06B6D4', bg: '#ECFEFF' },
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
    <div className="flex flex-col justify-between h-full select-none font-sans">
      <div>
        {/* USER PROFILE CARD */}
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-[#E2DED8] bg-[#FAF9F6] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#171717] text-xs font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[#171717]">
              {displayName}
            </p>
            <p className="truncate text-[11px] font-normal text-[#6F6962]">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="my-3 border-t border-[#E2DED8]/80" />

        {/* NAVIGATION ITEMS */}
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSectionChange(item.id)}
                className={`group flex h-10 w-full items-center justify-between rounded-lg px-3.5 text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#171717] text-white shadow-xs'
                    : 'text-[#6F6962] hover:bg-[#FAF9F6] hover:text-[#171717]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-150"
                    style={{
                      backgroundColor: isActive ? 'transparent' : item.bg,
                    }}
                  >
                    <Icon
                      className="h-4 w-4 stroke-[1.8]"
                      style={{
                        color: isActive ? '#FFFFFF' : item.color,
                      }}
                    />
                  </div>
                  <span className="text-[13px]">{item.label}</span>
                </div>

                <ChevronRight
                  className={`h-4 w-4 transition-all duration-150 ${
                    isActive
                      ? 'text-white translate-x-0.5'
                      : 'text-[#B0A79D] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                  }`}
                  strokeWidth={1.5}
                />
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-8">
        <div className="mb-3 border-t border-[#E2DED8]/80" />

        {/* LOGOUT BUTTON */}
        <button
          type="button"
          onClick={onLogout}
          className="group flex h-10 w-full items-center gap-3 rounded-lg px-3.5 text-xs font-medium text-[#B91C1C] transition-colors duration-150 hover:bg-[#FEF2F2]"
        >
          <LogOut className="h-4 w-4 stroke-[1.5] text-[#B91C1C]" />
          <span className="text-[13px]">Logout</span>
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
  }, [mobileMenuOpen]);

  if (profile.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F4F0]">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="font-serif text-2xl font-normal tracking-tight text-[#171717]">
              ARDENBY
            </div>
            <div className="mt-1 text-[8px] font-semibold tracking-[4px] text-[#8B8175]">
              WEAR YOUR ESSENCE
            </div>
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
      <main className="min-h-screen bg-[#F6F4F0] pt-6 pb-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          
          <ProfileFeedback
            error={profile.error}
            message={profile.message}
            onClear={() => {
              profile.setError('');
              profile.setMessage('');
            }}
          />

          {/* MOBILE HEADER BAR */}
          <div className="mb-6 flex items-center justify-between rounded-lg border border-[#E2DED8] bg-white p-3 shadow-xs lg:hidden">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-[#171717] text-white transition-transform duration-150 active:scale-95"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4 stroke-[2]" />
              </button>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[1.3px] text-[#96908A]">
                  MY ACCOUNT
                </p>
                <p className="text-xs font-semibold text-[#171717]">
                  {currentNav?.label}
                </p>
              </div>
            </div>

            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#171717] text-[11px] font-medium text-white">
              {profile.initial}
            </span>
          </div>

          {/* MOBILE DRAWER */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                onClick={() => setMobileMenuOpen(false)}
                className="absolute inset-0 bg-[#171717]/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              />

              <div className="absolute inset-y-0 left-0 w-full max-w-xs bg-white p-5 shadow-xl transition-transform animate-in slide-in-from-left duration-200 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[#E2DED8] pb-3">
                  <span className="font-serif text-base font-normal tracking-tight text-[#171717]">
                    ARDENBY
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FAF9F6] text-[#171717] active:scale-95"
                  >
                    <X className="h-4 w-4 stroke-[1.8]" />
                  </button>
                </div>

                <div className="mt-4 flex-1 overflow-y-auto">
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

          {/* EXACT SAME HEIGHT LOCKED GRID LAYOUT */}
          <div className="grid items-stretch gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            
            {/* DESKTOP SIDEBAR CONTAINER */}
            <aside className="hidden lg:flex flex-col">
              <div className="flex flex-col flex-1 rounded-xl border border-[#E2DED8] bg-white p-4 shadow-xs">
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

            {/* MAIN WORKSPACE / OVERVIEW CONTENT CONTAINER */}
            <section className="flex flex-col w-full min-w-0">
              <div className="flex flex-col flex-1 rounded-xl border border-[#E2DED8] bg-white p-6 sm:p-8 shadow-xs">
                <ProfileContent profile={profile} />
              </div>
            </section>

          </div>

        </div>
      </main>

      <DeleteAccountModal profile={profile} />
    </>
  );
}