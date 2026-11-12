// Single source of truth for cart / checkout pricing.
// Mirrors ArdenBy_Backend/utils/pricing.js — keep both in sync.
//
//   subtotal        = sum(price * qty)
//   taxableAmount   = subtotal - couponDiscount
//   shipping        = SHIPPING_FEE flat per order; free for an active KOVENIK member
//                     (TEMPORARY until Shiprocket; no minimum order value / threshold)
//   gst             = round(taxableAmount * GST_RATE)
//   total           = taxableAmount + shipping + gst
//   totalSavings    = productSavings (mrp - price) + couponDiscount

export const SHIPPING_FEE = 49;
export const GST_RATE = 0.05;

// Cash on delivery (mirrors the backend): flat handling fee + GST on the fee, COD only
// while the goods value (after any coupon, before GST / shipping / the fee) is within
// the limit. The server enforces both; this is display and early feedback.
export const COD_FEE = 29;
export const COD_MAX_ORDER_VALUE = 3000;
export const COD_LIMIT_MESSAGE =
  'COD is available only for orders up to ₹3,000. Please choose online payment.';

type PricedItem = { price: number; mrp?: number; quantity: number };

// The coupon *rule* is what gets stored/shared — never a cart-specific amount.
// The discount is always derived from the current subtotal, so it cannot go stale.
export type CouponRule = {
  type: 'percentage' | 'flat';
  value: number;
  maxDiscount: number | null;
  minOrder: number;
};

// Builds a rule from the /api/coupons/validate response (`data.coupon` row).
export function couponRuleFromResponse(data: any): CouponRule | null {
  const c = data?.coupon ?? data?.data?.coupon;
  const type = String(c?.discount_type ?? '').toLowerCase();
  const value = Number(c?.discount_value);
  if ((type !== 'percentage' && type !== 'flat') || !Number.isFinite(value)) {
    return null;
  }
  const max = c?.max_discount;
  return {
    type,
    value,
    // 0 (the column default) and NULL both mean "no cap".
    maxDiscount:
      max === null || max === undefined || !(Number(max) > 0)
        ? null
        : Number(max),
    minOrder: Number(c?.min_order) || 0,
  };
}

// Mirrors ArdenBy_Backend/utils/pricing.js calculateCouponDiscount.
export function calculateCouponDiscount(
  rule: CouponRule,
  subtotal: number
): number {
  if (subtotal <= 0 || subtotal < rule.minOrder) return 0;
  let discount =
    rule.type === 'percentage' ? (subtotal * rule.value) / 100 : rule.value;
  if (rule.type === 'percentage' && rule.maxDiscount !== null) {
    discount = Math.min(discount, rule.maxDiscount);
  }
  return roundMoney(Math.max(0, Math.min(discount, subtotal)));
}

export function roundMoney(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

export function calculateCartPricing(
  items: PricedItem[],
  coupon: CouponRule | number | null = null,
  // Active-member benefit that waives the shipping fee. The flag comes from the BACKEND
  // (/api/membership/my-pricing); this is display only, the server applies the real rule
  // when the order is created.
  options: { freeShipping?: boolean; cod?: boolean } = {}
) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  const productSavings = roundMoney(
    items.reduce(
      (sum, item) =>
        sum + Math.max(0, (item.mrp ?? item.price) - item.price) * item.quantity,
      0
    )
  );

  // A plain number is a legacy fixed amount (stored before rules were saved).
  const rawDiscount =
    coupon && typeof coupon === 'object'
      ? calculateCouponDiscount(coupon, subtotal)
      : Number(coupon) || 0;
  const discount = roundMoney(Math.max(0, Math.min(rawDiscount, subtotal)));
  const taxableAmount = roundMoney(subtotal - discount);
  const shipping = subtotal === 0 || options.freeShipping ? 0 : SHIPPING_FEE;
  const gst = Math.round(taxableAmount * GST_RATE);
  const codAvailable = taxableAmount <= COD_MAX_ORDER_VALUE;
  const codFee = options.cod && subtotal > 0 ? COD_FEE : 0;
  const codFeeTax = roundMoney(codFee * GST_RATE);
  const total = roundMoney(taxableAmount + shipping + gst + codFee + codFeeTax);

  return {
    subtotal,
    productSavings,
    discount,
    taxableAmount,
    shipping,
    gst,
    codAvailable,
    codFee,
    codFeeTax,
    total,
    totalSavings: roundMoney(productSavings + discount),
  };
}
