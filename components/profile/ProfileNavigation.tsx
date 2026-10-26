'use client';

import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  Ticket,
  ShieldCheck,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import type { Section, UserProfile } from './types';

export const navItems = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'orders', label: 'My Orders', icon: ShoppingBag },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'account', label: 'Account Details', icon: User },
  { id: 'security', label: 'Security', icon: ShieldCheck },
] as const;

interface Props {
  user: UserProfile;
  displayName: string;
  initial: string;
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  onLogout: () => void;
  mobile?: boolean;
}

export function ProfileNavigation({
  user,
  displayName,
  initial,
  activeSection,
  onSectionChange,
  onLogout,
  mobile = false,
}: Props) {
  if (mobile) {
    return (
      <div className="mb-6 overflow-x-auto lg:hidden">
        <div className="flex min-w-max border-b border-[#222222]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`whitespace-nowrap border-b-2 px-3 pb-3 text-[9px] uppercase tracking-[0.14em] ${
                activeSection === item.id
                  ? 'border-[#E2E0DB] text-[#FFFFFF]'
                  : 'border-transparent text-[#5C5C5C]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="border-y border-[#222222] py-4">
        <div className="mb-4 flex items-center gap-3 px-1">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F4F0E8] font-serif text-base text-[#171717]">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold uppercase tracking-[0.08em]">
              {displayName}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-[#5C5C5C]">{user.email}</p>
          </div>
        </div>

        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`group relative flex w-full items-center gap-3 border-b border-[#222222] px-1 py-3 text-left transition ${
                  active ? 'text-[#FFFFFF]' : 'text-[#5C5C5C] hover:text-[#FFFFFF]'
                }`}
              >
                <span className={`absolute left-0 h-4 w-px transition ${
                  active ? 'bg-[#B08D57]' : 'bg-transparent group-hover:bg-[#B08D57]'
                }`} />
                <Icon className={`ml-2 h-[15px] w-[15px] ${active ? 'text-[#8C6D3A]' : ''}`} strokeWidth={1.5} />
                <span className="text-[11px] uppercase tracking-[0.13em]">{item.label}</span>
                {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#8C6D3A]" />}
              </button>
            );
          })}
        </nav>

        <button
          onClick={onLogout}
          className="mt-4 flex w-full items-center gap-3 px-1 py-3 text-left text-[11px] uppercase tracking-[0.13em] text-[#B3261E] transition hover:text-[#B3261E]"
        >
          <LogOut className="ml-2 h-[15px] w-[15px]" strokeWidth={1.5} />
          Logout
        </button>
      </div>
    </aside>
  );
}
