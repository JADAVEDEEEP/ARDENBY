import { apiUrl } from '@/lib/api-url';
import { customerRequest } from '@/lib/customer-api';

/** A membership plan as the public API returns it. Everything comes from the database. */
export interface MembershipBenefit {
  id: string;
  type: string;
  value: number | null;
  description: string;
  active: boolean;
}

export interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  durationDays: number;
  tierRank: number;
  freeDelivery: boolean;
  discountPercent: number;
  active: boolean;
  benefits: MembershipBenefit[];
}

export interface MembershipTerm {
  id: string;
  planId: string;
  planName: string;
  planSlug: string;
  tierRank: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

export interface MembershipHistoryRow {
  id: string;
  planName: string;
  planSlug: string;
  status: string;
  paymentStatus: string;
  amount: number | null;
  startDate: string | null;
  endDate: string | null;
  purchasedAt: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
}

export interface MyMembership {
  current:
    | (MembershipTerm & { discountPercent: number; freeDelivery: boolean; benefits: MembershipBenefit[] })
    | null;
  queued: MembershipTerm | null;
  birthday: string | null;
  history: MembershipHistoryRow[];
}

export interface MemberPricing {
  member: { planName: string; planSlug: string; tierRank: number; discountPercent: number; freeDelivery: boolean } | null;
  /** Active member's price per product (only products the plan actually reduces). */
  prices: Record<string, number>;
  /** Entry-tier price for everyone who is not an active member ("Join and save"). */
  preview: { planName: string; prices: Record<string, number> } | null;
}

export interface MemberPreviewPricing {
  plan: { name: string; slug: string; price: number; discountPercent: number; freeDelivery: boolean } | null;
  prices: Record<string, number>;
}

/** Active plans for the /membership page. Throws if the server cannot be reached. */
export async function fetchMembershipPlans(signal?: AbortSignal): Promise<MembershipPlan[]> {
  const response = await fetch(apiUrl('/api/membership/plans'), { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`Membership API failed with status ${response.status}`);
  const data = (await response.json()) as { plans?: MembershipPlan[] };
  return Array.isArray(data.plans) ? data.plans : [];
}

export const fetchMyMembership = () => customerRequest<{ success: true } & MyMembership>('/api/membership/my');

export const fetchMemberPricing = () =>
  customerRequest<{ success: true; member: MemberPricing['member']; prices: Record<string, number> }>('/api/membership/my-pricing');

export async function fetchPreviewPricing(): Promise<MemberPreviewPricing> {
  const response = await fetch(apiUrl('/api/membership/preview-pricing'), { cache: 'no-store' });
  if (!response.ok) throw new Error(`Membership preview failed with status ${response.status}`);
  const data = (await response.json()) as Partial<MemberPreviewPricing>;
  return { plan: data.plan ?? null, prices: data.prices ?? {} };
}

export const saveBirthday = (birthday: string) =>
  customerRequest('/api/membership/birthday', { method: 'PUT', body: JSON.stringify({ birthday }) });

export const PURCHASE_STATUS: Record<string, string> = {
  active: 'Active',
  pending: 'Pending payment',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export const PAYMENT_STATUS: Record<string, string> = {
  none: 'No payment',
  created: 'Awaiting payment',
  paid: 'Paid',
  failed: 'Failed',
  refund_pending: 'Refund pending',
  refunded: 'Refunded',
};

export const benefitIcon = (type: string) => type.toLowerCase();

export const formatDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

/** Benefit types that exist in plan data but are not built yet. Hidden from customer-facing
 *  lists so nothing is promised that does not work. Remove a type here once it is implemented. */
const UNBUILT_BENEFIT_TYPES = new Set(['EARLY_ACCESS', 'BIRTHDAY_COUPON', 'BIRTHDAY_REWARD']);
export const isBenefitLive = (b: { type: string }) => !UNBUILT_BENEFIT_TYPES.has(b.type.toUpperCase());

/** Plan taglines come from the plan table and may still mention unbuilt perks (e.g. "early access").
 *  Hide such a line instead of promising it; update the plan text in the database/admin later. */
export const liveText = (text: string | null | undefined) =>
  text && !/early access|birthday/i.test(text) ? text : '';
