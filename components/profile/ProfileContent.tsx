'use client';

import { Loader2 } from 'lucide-react';
import type { useProfile } from '../../hooks/use-profile';
import { OverviewSection } from './OverviewSection';
import { OrdersSection } from './OrdersSection';
import { WishlistSection } from './WishlistSection';
import { AddressesSection } from './AddressesSection';
import { CouponsSection } from './CouponsSection';
import { AccountSection } from './AccountSection';
import { SecuritySection } from './SecuritySection';

type ProfileState = ReturnType<typeof useProfile>;

export function ProfileContent({ profile }: { profile: ProfileState }) {
  return (
    <section className="min-w-0">
      {profile.sectionLoading && (
        <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#8A8176]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Updating account
        </div>
      )}

      {profile.activeSection === 'overview' && <OverviewSection profile={profile} />}
      {profile.activeSection === 'orders' && <OrdersSection profile={profile} />}
      {profile.activeSection === 'wishlist' && <WishlistSection profile={profile} />}
      {profile.activeSection === 'addresses' && <AddressesSection profile={profile} />}
      {profile.activeSection === 'coupons' && <CouponsSection profile={profile} />}
      {profile.activeSection === 'account' && <AccountSection profile={profile} />}
      {profile.activeSection === 'security' && <SecuritySection profile={profile} />}
    </section>
  );
}
