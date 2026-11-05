import {
  FREE_SHIPPING_THRESHOLD,
  GST_PERCENT,
  MEMBERSHIP_PLANS,
  RETURN_WINDOW_DAYS,
  SHIPPING_FEE,
  inr,
} from '@/lib/policy-facts';

// NEEDS APPROVAL: every answer restates behaviour that exists in the code today (checkout rule,
// cancellation/return services, membership plans, profile features). Nothing here promises a delivery
// or refund timeline, an exchange, or membership perks that are not built yet (early access,
// birthday coupons). See docs/POLICY_PAGES_BUSINESS_INPUT_REQUIRED.md.

export const FAQ_CATEGORIES = [
  'Orders & Payments',
  'Shipping & Delivery',
  'Returns & Refunds',
  'Products & Sizing',
  'Membership',
  'Account & Security',
] as const;

export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export interface FaqItem {
  id: string;
  category: FaqCategory;
  q: string;
  /** Plain text (also used for the FAQPage structured data). Paragraphs separated by \n\n. */
  a: string;
  /** Optional internal link shown under the answer. */
  link?: { href: string; label: string };
}

const planLine = MEMBERSHIP_PLANS.map((p) => `${p.name} (${inr(p.price)}, ${p.discount}% off eligible products${p.freeShipping ? ', free shipping' : ''})`).join('; ');

export const FAQS: FaqItem[] = [
  // ---- Orders & Payments
  {
    id: 'payment-methods',
    category: 'Orders & Payments',
    q: 'How can I pay for my order?',
    a: 'You can pay online in Razorpay’s secure payment window, where the methods available to you (such as UPI and cards) are shown, or choose cash on delivery at checkout where it is offered.',
  },
  {
    id: 'card-safety',
    category: 'Orders & Payments',
    q: 'Does KOVENIK store my card or UPI details?',
    a: 'No. Online payments are entered and processed in Razorpay’s window, so KOVENIK never sees or stores your full card number, CVV or UPI PIN.',
    link: { href: '/privacy', label: 'Read the Privacy Policy' },
  },
  {
    id: 'account-needed',
    category: 'Orders & Payments',
    q: 'Do I need an account to place an order?',
    a: 'You can browse and fill your cart without one, but you need to sign in (or register) to check out so that your order, addresses and tracking are saved to you.',
  },
  {
    id: 'gst-total',
    category: 'Orders & Payments',
    q: 'Why is GST added to my total?',
    a: `GST at ${GST_PERCENT}% is calculated on your amount after any coupon is applied and is added at checkout, shown on its own line together with any shipping fee. The final total is always visible before you pay.`,
  },
  {
    id: 'coupons',
    category: 'Orders & Payments',
    q: 'How do I use a coupon?',
    a: 'Enter your coupon code in your cart. It is checked against its rules (such as a minimum order value) and the discount is shown straight away. Coupons cannot be exchanged for cash.',
  },
  {
    id: 'order-confirmation',
    category: 'Orders & Payments',
    q: 'How do I know my order was placed?',
    a: 'You will see it in My Orders and we send a confirmation email. Online orders are confirmed once your payment is verified; cash on delivery orders are confirmed when placed.',
    link: { href: '/orders', label: 'Go to my orders' },
  },
  {
    id: 'payment-debited',
    category: 'Orders & Payments',
    q: 'Money was debited but I cannot see my order. What should I do?',
    a: 'Please contact us with your payment reference and the email on your account. We will investigate straight away.',
    link: { href: '/contact', label: 'Contact support' },
  },
  {
    id: 'cancel-order',
    category: 'Orders & Payments',
    q: 'Can I cancel my order?',
    a: 'Yes, while it is still pending, confirmed or processing. Open My Orders and cancel the whole order or individual items. Once an order is packed, please contact support; once it has shipped it cannot be cancelled and you can use a return after delivery.',
    link: { href: '/returns', label: 'Return & Refund Policy' },
  },

  // ---- Shipping & Delivery
  {
    id: 'shipping-cost',
    category: 'Shipping & Delivery',
    q: 'How much does shipping cost?',
    a: `Orders with a subtotal below ${inr(FREE_SHIPPING_THRESHOLD)} have a flat ${inr(SHIPPING_FEE)} shipping fee. Orders of ${inr(FREE_SHIPPING_THRESHOLD)} or more ship free, and so do eligible orders from Gold members.`,
    link: { href: '/shipping', label: 'Shipping & Delivery Policy' },
  },
  {
    id: 'free-shipping-coupon',
    category: 'Shipping & Delivery',
    q: 'Does a coupon affect free shipping?',
    a: `No. The ${inr(FREE_SHIPPING_THRESHOLD)} free-shipping threshold is measured on your subtotal before a coupon is applied.`,
  },
  {
    id: 'delivery-time',
    category: 'Shipping & Delivery',
    q: 'How long will delivery take?',
    a: 'We do not promise a fixed number of days, because delivery depends on the item, your location and the delivery partner. The status of your order in My Orders (Ordered, Packed, Shipped, Out for delivery, Delivered) is the best guide.',
  },
  {
    id: 'track-order',
    category: 'Shipping & Delivery',
    q: 'How do I track my order?',
    a: 'Sign in and open My Orders to see the current status of each order. We also email you when an order is confirmed, cancelled, returned or refunded. The website does not currently show a courier tracking number.',
    link: { href: '/orders', label: 'Go to my orders' },
  },
  {
    id: 'wrong-address',
    category: 'Shipping & Delivery',
    q: 'I entered the wrong address. What can I do?',
    a: 'Tell us immediately. An order that is still pending, confirmed or processing can be cancelled from My Orders and placed again with the right address. After it ships, the address cannot be changed from the website.',
    link: { href: '/contact', label: 'Contact support' },
  },

  // ---- Returns & Refunds
  {
    id: 'return-window',
    category: 'Returns & Refunds',
    q: 'How long do I have to return an item?',
    a: `Returns can be requested on delivered orders within ${RETURN_WINDOW_DAYS} days of delivery. The window starts when your order is marked delivered, and your order page shows how many days are left.`,
    link: { href: '/returns', label: 'Return & Refund Policy' },
  },
  {
    id: 'how-to-return',
    category: 'Returns & Refunds',
    q: 'How do I start a return?',
    a: 'Open your delivered order in My Orders, choose the item(s) and quantity, pick a reason and submit. We email you our decision. If it is approved, pack the item(s) in original condition with tags, send them back and tap “I have sent the items” on your order page.',
    link: { href: '/orders', label: 'Go to my orders' },
  },
  {
    id: 'refund-how',
    category: 'Returns & Refunds',
    q: 'How and when will I be refunded?',
    a: 'Refunds start after your returned items are received and inspected. Online payments are refunded to the original payment method through Razorpay; for cash on delivery we arrange a manual payout such as UPI or bank transfer. We do not state a fixed number of days because the final step depends on the payment network, but we email you when your refund is started and when it is completed.',
  },
  {
    id: 'refund-amount',
    category: 'Returns & Refunds',
    q: 'How much is refunded?',
    a: 'The price of the returned item, less its share of any coupon discount, plus its share of the GST you paid. Shipping is not refunded on a return after delivery, and an amount may be deducted if inspection finds a problem.',
  },
  {
    id: 'exchange',
    category: 'Returns & Refunds',
    q: 'Can I exchange an item for another size?',
    a: 'We do not offer direct exchanges at the moment. If an item is eligible, request a return and place a new order for the size you want.',
  },

  // ---- Products & Sizing
  {
    id: 'size-guide',
    category: 'Products & Sizing',
    q: 'How do I find my size?',
    a: 'Every product page has a size guide with measurements. KOVENIK fits are relaxed, so compare the measurements with a garment you already own and like.',
    link: { href: '/shop', label: 'Browse the shop' },
  },
  {
    id: 'fabric',
    category: 'Products & Sizing',
    q: 'What are the T-shirts made of?',
    a: 'Our heavyweight tees are cut from 240 GSM combed cotton in a drop-shoulder silhouette. Details for each piece are on its product page.',
  },
  {
    id: 'limited-drops',
    category: 'Products & Sizing',
    q: 'Are limited-edition designs restocked?',
    a: 'Limited edition drop artwork is released in exclusive runs. When a size or design shows as sold out on its product page, it is not available to order.',
  },
  {
    id: 'reviews',
    category: 'Products & Sizing',
    q: 'Who can review a product?',
    a: 'Only customers who have received an item can review it, so reviews come from real buyers.',
  },

  // ---- Membership
  {
    id: 'membership-plans',
    category: 'Membership',
    q: 'What membership plans are there?',
    a: `KOVENIK offers ${planLine}. Each plan runs for one year. Full benefits are listed on the membership page.`,
    link: { href: '/membership', label: 'See membership plans' },
  },
  {
    id: 'membership-upgrade',
    category: 'Membership',
    q: 'Can I renew or upgrade my membership?',
    a: 'Buying the same plan again renews it from the day your current term ends. Moving to a higher plan starts it immediately and ends your lower plan; the unused part of the lower plan is not credited. A lower plan cannot be bought while a higher one is active.',
  },
  {
    id: 'membership-shipping',
    category: 'Membership',
    q: 'Which membership gives free shipping?',
    a: 'Gold gives free shipping on eligible orders. Every order of ' + inr(FREE_SHIPPING_THRESHOLD) + ' or more ships free for everyone.',
  },

  // ---- Account & Security
  {
    id: 'sign-in',
    category: 'Account & Security',
    q: 'How do I sign in?',
    a: 'Use your email and password, or choose Sign in with Google. We email a one-time passcode when we need to verify your email address.',
  },
  {
    id: 'forgot-password',
    category: 'Account & Security',
    q: 'I forgot my password.',
    a: 'Choose “Forgot password” in the sign-in window. We email you a one-time passcode so you can set a new password. You can also change your password any time from your profile.',
  },
  {
    id: 'delete-account',
    category: 'Account & Security',
    q: 'How do I delete my account?',
    a: 'Open your profile and use the delete account option; email accounts confirm with their password. Your personal details are erased and you can no longer sign in. Past order records are kept without your profile details for accounting and returns. Cancel any order you no longer want first.',
    link: { href: '/privacy', label: 'Read the Privacy Policy' },
  },
  {
    id: 'stay-safe',
    category: 'Account & Security',
    q: 'How can I keep my account safe?',
    a: 'Use a strong, unique password and never share your one-time passcodes with anyone. KOVENIK will never ask for your password or card PIN.',
  },
];
