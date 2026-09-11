'use client';

import type { useProfile } from '../../hooks/use-profile';
import { Ticket } from 'lucide-react';
import { EmptyState, Field, Info, Panel, Stat } from './ui';

type ProfileState = ReturnType<typeof useProfile>;

export function CouponsSection({ profile }: { profile: ProfileState }) {
  return (
<Panel
                  title="Offers"
                  subtitle="Applicable promotions and ARDENBY benefits."
                >
                  <div className="border-y border-[#DCD5C9] py-12 text-center">
                    <Ticket
                      className="mx-auto h-6 w-6 text-[#A98B62]"
                      strokeWidth={1.3}
                    />

                    <h3 className="mt-4 font-serif text-2xl">
                      Your offers
                    </h3>

                    <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#81796F]">
                      Applicable offers and
                      promotions will appear
                      here. Available coupon
                      codes can be entered
                      from the cart.
                    </p>
                  </div>
                </Panel>
  );
}
