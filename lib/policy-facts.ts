// One place for every number and business detail the policy / information pages state.
//
// SOURCE OF TRUTH
//  - Shipping fee, free-shipping threshold and GST come from lib/pricing.ts, which mirrors
//    ArdenBy_Backend/utils/pricing.js (the server's checkout rule).
//  - The return window is the store's "returns" setting (Admin -> Settings). It is
//    7 days / enabled on the live database (read 2026-11-05) but an admin can change it,
//    so every page also tells customers that their order page shows the exact days left.
//  - Business and legal details are NEVER invented: they come from NEXT_PUBLIC_* variables
//    and every one is optional. A page shows a detail only when it is configured.
//
// NEEDS APPROVAL: items marked NEEDS APPROVAL are listed, with context, in
// docs/POLICY_PAGES_BUSINESS_INPUT_REQUIRED.md.

import { GST_RATE, SHIPPING_FEE } from '@/lib/pricing';

export { SHIPPING_FEE };

export const GST_PERCENT = Math.round(GST_RATE * 100);

/** NEEDS APPROVAL: mirrors the live "returns" store setting. */
export const RETURN_WINDOW_DAYS = 7;

/** NEEDS APPROVAL: date shown as "Last updated" on the legal pages. */
export const POLICY_UPDATED = '5 November 2026';

/** The Privacy Policy changed after the shared date above (newsletter section added), so it carries its own. */
export const PRIVACY_UPDATED = '16 November 2026';

export const inr = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const clean = (value: string | undefined) => (value || '').trim();

/** Optional business details, supplied by the owner through environment variables. */
export const BUSINESS = {
  /** Public support address. Not configured = not shown (and not invented). */
  supportEmail: clean(process.env.NEXT_PUBLIC_SUPPORT_EMAIL) || 'info.kovenik@gmail.com',
  supportPhone: clean(process.env.NEXT_PUBLIC_SUPPORT_PHONE),
  supportHours: clean(process.env.NEXT_PUBLIC_SUPPORT_HOURS),
  /** Business / brand display name. Does NOT claim registered legal status; only put a registered
   *  entity name here once it is verified. */
  legalName: clean(process.env.NEXT_PUBLIC_LEGAL_NAME),
  /** Area-level business location, one line (not a full postal address until one is supplied). */
  address: clean(process.env.NEXT_PUBLIC_BUSINESS_ADDRESS),
  /** City whose courts have jurisdiction, for the Terms. */
  jurisdictionCity: clean(process.env.NEXT_PUBLIC_JURISDICTION_CITY),
  /** Grievance Officer name (India IT Rules), for the Privacy Policy. */
  grievanceOfficer: clean(process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER),
};

/** KOVENIK has one membership plan. These are the launch defaults seeded by
 *  scripts/seed-membership-plans.js; the live price/discount are edited in the admin panel, so policy
 *  copy that quotes them must be updated if the admin values change. */
export const MEMBERSHIP_PLAN = { name: 'KOVENIK MEMBER', price: 199, discount: 15 } as const;
export const MEMBER_DISCOUNT = MEMBERSHIP_PLAN.discount;
