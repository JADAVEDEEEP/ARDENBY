'use client';

import { useEffect, useMemo, useState } from 'react';

import { fetchMemberPricing, fetchPreviewPricing, type MemberPricing } from '@/lib/membership-api';

// One shared fetch for every price on the page (cards, product page, cart, checkout).
// This is DISPLAY ONLY: the server recomputes the payable price at cart and checkout.
//
//   active member      -> member + prices (KOVENIK MEMBER)
//   everyone else      -> preview (KOVENIK MEMBER price) so we can say "Join and save Rs X"
//                         (guests, non-members, expired members; never applied to payable prices)
const EMPTY: MemberPricing = { member: null, prices: {}, preview: null };
const listeners = new Set<(value: MemberPricing) => void>();
let cached: MemberPricing = EMPTY;
let preview: MemberPricing['preview'] = null;
let previewLoadedAt = 0;
let inFlight: Promise<void> | null = null;
let loadedAt = 0;
const MAX_AGE_MS = 60_000;

const signedIn = () => {
  try {
    return Boolean(localStorage.getItem('ardenby_token'));
  } catch {
    return false;
  }
};

const publish = (value: MemberPricing) => {
  cached = value;
  listeners.forEach((l) => l(value));
};

async function loadPreview(): Promise<MemberPricing['preview']> {
  if (preview && Date.now() - previewLoadedAt < MAX_AGE_MS) return preview;
  try {
    const data = await fetchPreviewPricing();
    preview = data.plan ? { planName: data.plan.name, prices: data.prices } : null;
    previewLoadedAt = Date.now();
  } catch {
    // Quietly show regular prices only.
  }
  return preview;
}

function refresh(force = false) {
  if (inFlight) return;
  if (!force && loadedAt && Date.now() - loadedAt < MAX_AGE_MS) return;

  inFlight = (async () => {
    let member: MemberPricing['member'] = null;
    let prices: Record<string, number> = {};
    if (signedIn()) {
      try {
        const data = await fetchMemberPricing();
        member = data.member;
        prices = data.prices || {};
      } catch {
        // Treated as a non-member until it can be loaded; the server still prices the order.
      }
    }
    loadedAt = Date.now();
    publish({ member, prices, preview: member ? null : await loadPreview() });
  })().finally(() => {
    inFlight = null;
  });
}

export function useMemberPricing(): MemberPricing {
  const [value, setValue] = useState<MemberPricing>(cached);

  useEffect(() => {
    listeners.add(setValue);
    setValue(cached);
    refresh();

    // Login, logout and storage changes (another tab, purchase) re-check straight away.
    const onAuth = () => refresh(true);
    window.addEventListener('ardenby-auth-changed', onAuth);
    window.addEventListener('ardenby-membership-changed', onAuth);
    window.addEventListener('storage', onAuth);
    return () => {
      listeners.delete(setValue);
      window.removeEventListener('ardenby-auth-changed', onAuth);
      window.removeEventListener('ardenby-membership-changed', onAuth);
      window.removeEventListener('storage', onAuth);
    };
  }, []);

  return value;
}

/** Cart/checkout lines with the member price applied (never higher than the line's own price). */
export function useMemberCartItems<T extends { productId: string; price: number }>(items: T[]) {
  const pricing = useMemberPricing();

  return useMemo(() => {
    // `regularPrice` is the line's own price before the member price replaced it.
    const priced: Array<T & { regularPrice?: number }> = items.map((item) => {
      const memberPrice = pricing.prices[item.productId];
      return memberPrice !== undefined && memberPrice < item.price
        ? { ...item, price: memberPrice, regularPrice: item.price }
        : item;
    });
    const qty = (item: T) => Number((item as { quantity?: number }).quantity) || 0;
    return {
      items: priced,
      member: pricing.member,
      freeShipping: pricing.member?.freeDelivery === true,
      // Savings already included in the prices above (active members only).
      memberSavings: items.reduce((sum, item, i) => sum + (item.price - priced[i].price) * qty(item), 0),
      // What KOVENIK MEMBER would save a non-member on this bag (display only).
      joinSavings: pricing.member
        ? 0
        : items.reduce((sum, item) => {
            const p = pricing.preview?.prices[item.productId];
            return p !== undefined && p < item.price ? sum + (item.price - p) * qty(item) : sum;
          }, 0),
    };
  }, [items, pricing]);
}
