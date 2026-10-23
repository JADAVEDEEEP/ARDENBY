'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  COUPON_CHANGE_EVENT,
  COUPON_STORAGE_KEY,
  syncCouponToServer,
  useCartStore,
} from '@/store/cart-store';
import { apiUrl } from '@/lib/api-url';
import {
  couponRuleFromResponse,
  type CouponRule,
} from '@/lib/pricing';

// Coupon state for the /cart page. It uses the same validate endpoint, server
// sync and localStorage record as CartDrawer, so both stay in step with each
// other and with checkout.

type StoredCoupon = { code: string; discount: number; rule?: CouponRule };

function readStoredCoupon(): StoredCoupon | null {
  if (typeof window === 'undefined') return null;

  try {
    // Coupons belong to a signed-in account; guests never hold one.
    if (!localStorage.getItem('ardenby_token')) return null;

    const raw = localStorage.getItem(COUPON_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const code =
      typeof parsed?.code === 'string' ? parsed.code.trim().toUpperCase() : '';
    const discount = Number(parsed?.discount);
    if (!code || !Number.isFinite(discount) || discount < 0) return null;

    const value = Number(parsed?.rule?.value);
    const rule: CouponRule | undefined =
      (parsed?.rule?.type === 'percentage' || parsed?.rule?.type === 'flat') &&
      Number.isFinite(value)
        ? {
            type: parsed.rule.type,
            value,
            maxDiscount:
              parsed.rule.maxDiscount == null
                ? null
                : Number(parsed.rule.maxDiscount),
            minOrder: Number(parsed.rule.minOrder) || 0,
          }
        : undefined;

    return { code, discount, rule };
  } catch {
    return null;
  }
}

function writeStoredCoupon(value: StoredCoupon | null) {
  try {
    if (value) localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(COUPON_STORAGE_KEY);
    window.dispatchEvent(new Event(COUPON_CHANGE_EVENT));
  } catch {
    // Storage unavailable: nothing to persist.
  }
}

export function useCartCoupon(subtotal: number) {
  const couponCode = useCartStore((s) => s.couponCode);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCouponFromStore = useCartStore((s) => s.removeCoupon);

  // Either the rule (preferred: discount derived from the live subtotal) or a
  // legacy fixed amount.
  const [rule, setRule] = useState<CouponRule | null>(null);
  const [legacyDiscount, setLegacyDiscount] = useState(0);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);

  useEffect(() => {
    const sync = () => {
      const stored = readStoredCoupon();
      setRule(stored?.rule ?? null);
      setLegacyDiscount(stored && !stored.rule ? stored.discount : 0);
    };

    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(COUPON_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(COUPON_CHANGE_EVENT, sync);
    };
  }, [couponCode]);

  const apply = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim().toUpperCase();
      if (inFlight.current) return false;

      if (!code) {
        setError('Please enter a coupon code.');
        return false;
      }
      if ((couponCode ?? '').toUpperCase() === code) {
        setError('This coupon is already applied to your bag.');
        return false;
      }

      const token = localStorage.getItem('ardenby_token');
      if (!token) {
        setError('Please sign in to apply a coupon.');
        return false;
      }
      if (subtotal <= 0) {
        setError('Add products to your bag first.');
        return false;
      }

      inFlight.current = true;
      setApplying(true);
      setError('');

      try {
        const response = await fetch(apiUrl('/api/coupons/validate'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code, subtotal }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(data?.message || data?.error || 'This coupon is not valid.');
          return false;
        }

        // Persist on the account's server cart so the order is priced from the
        // same coupon shown here.
        await syncCouponToServer(code);

        const nextRule = couponRuleFromResponse(data);
        const legacy = Number(
          data?.discount ?? data?.data?.discount ?? data?.coupon?.discount ?? 0
        );
        const discount =
          nextRule || !Number.isFinite(legacy)
            ? 0
            : Math.max(0, Math.min(legacy, subtotal));

        writeStoredCoupon({ code, discount, rule: nextRule ?? undefined });
        applyCoupon(code);
        return true;
      } catch (err) {
        setError(
          err instanceof Error && err.message && err.message !== 'AUTH_REQUIRED'
            ? err.message
            : 'Unable to apply coupon. Please try again.'
        );
        return false;
      } finally {
        inFlight.current = false;
        setApplying(false);
      }
    },
    [applyCoupon, couponCode, subtotal]
  );

  const remove = useCallback(() => {
    writeStoredCoupon(null);
    removeCouponFromStore();
    void syncCouponToServer(null).catch(() => undefined);
    setError('');
  }, [removeCouponFromStore]);

  const clearError = useCallback(() => setError(''), []);

  return {
    couponCode,
    /** Argument for calculateCartPricing(items, coupon). */
    pricingCoupon: couponCode ? rule ?? legacyDiscount : null,
    rule,
    applying,
    error,
    clearError,
    apply,
    remove,
  };
}
