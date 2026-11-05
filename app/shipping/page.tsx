import type { Metadata } from 'next';
import Link from 'next/link';

import { Callout, Container, CtaLink, Eyebrow, PageTitle, PROSE } from '@/components/info/info-ui';
import { SupportContact } from '@/components/info/support-contact';
import { FREE_SHIPPING_THRESHOLD, GST_PERCENT, SHIPPING_FEE, inr } from '@/lib/policy-facts';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | KOVENIK',
  description:
    'KOVENIK shipping charges, free-shipping rules, how your order moves from packed to delivered, and what to do about delays or address problems.',
  alternates: { canonical: '/shipping' },
  robots: { index: true, follow: true },
};

// NEEDS APPROVAL: the shipping fee, free-shipping threshold and Gold free delivery come from the
// real checkout rule (utils/pricing.js, membership plans). NO processing time, delivery time, courier
// name, delivery area, delivery-attempt count or lost-parcel remedy is configured anywhere, so none is
// promised here. See docs/POLICY_PAGES_BUSINESS_INPUT_REQUIRED.md.

const journey = [
  {
    step: 'Ordered',
    text: 'Your order is placed. Online orders are confirmed once payment is verified; cash on delivery orders are confirmed when placed.',
  },
  {
    step: 'Packed',
    text: 'We prepare and pack your items. From here the order can no longer be cancelled from your account.',
  },
  {
    step: 'Shipped',
    text: 'Your parcel is handed to the delivery partner. A shipped order can no longer be cancelled.',
  },
  {
    step: 'Out for delivery',
    text: 'Your parcel is on its final leg. Keep your phone nearby so the courier can reach you.',
  },
  {
    step: 'Delivered',
    text: 'It is with you. Your return window starts when the order is marked delivered.',
  },
];

const faqish = [
  {
    q: 'Delivery attempts',
    a: (
      <>
        The delivery partner uses the address and phone number on your order. Please be reachable, and for cash on
        delivery make sure someone can pay on arrival. If a delivery cannot be completed, <SupportContact /> and we will
        help sort out the next step.
      </>
    ),
  },
  {
    q: 'Incorrect or incomplete address',
    a: (
      <>
        Check your address carefully before paying. If you notice a mistake, tell us immediately: an order that is still
        pending, confirmed or processing can be cancelled from <Link href="/orders">your orders</Link> and placed again
        with the right address. Once an order has shipped, the address cannot be changed from the website.
      </>
    ),
  },
  {
    q: 'Delayed or lost shipments',
    a: (
      <>
        If your order has not moved for longer than you expected, or the tracking status looks wrong, <SupportContact />{' '}
        with your order number. We will look into it with the delivery partner and update you.
      </>
    ),
  },
];

export default function ShippingPage() {
  return (
    <div className="bg-white text-[#111111]">
      {/* Hero + the three numbers that matter */}
      <header className="bg-[#F5F5F5]">
        <Container className="py-14 md:py-20 lg:py-24">
          <Eyebrow>Policy · Shipping</Eyebrow>
          <PageTitle className="mt-6">
            Shipping <span className="text-[#C62828]">&amp;</span> Delivery
          </PageTitle>
          <p className="mt-8 max-w-[58ch] text-[19px] leading-[1.65] text-[#444444] md:text-[22px]">
            What delivery costs, when it is free, and how your order travels from our hands to yours.
          </p>

          <dl className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="bg-white p-7 md:p-8">
              <dt className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#555555]">Orders under {inr(FREE_SHIPPING_THRESHOLD)}</dt>
              <dd className="mt-3 font-oswald text-[clamp(48px,8vw,72px)] font-bold leading-none text-[#111111]">{inr(SHIPPING_FEE)}</dd>
              <dd className="mt-3 text-[16px] leading-[1.6] text-[#555555]">Flat shipping fee, added at checkout.</dd>
            </div>
            <div className="bg-[#C62828] p-7 text-white md:p-8">
              <dt className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/85">{inr(FREE_SHIPPING_THRESHOLD)} and above</dt>
              <dd className="mt-3 font-oswald text-[clamp(48px,8vw,72px)] font-bold uppercase leading-none">Free</dd>
              <dd className="mt-3 text-[16px] leading-[1.6] text-white/90">Shipping is free on the order subtotal at or above this amount.</dd>
            </div>
            <div className="bg-[#111111] p-7 text-white md:p-8">
              <dt className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#FF8A80]">Gold members</dt>
              <dd className="mt-3 font-oswald text-[clamp(48px,8vw,72px)] font-bold uppercase leading-none">Free</dd>
              <dd className="mt-3 text-[16px] leading-[1.6] text-[#D6D6D6]">
                Free shipping on eligible orders, whatever the order value.
              </dd>
            </div>
          </dl>
        </Container>
      </header>

      {/* Journey */}
      <section aria-labelledby="journey-title" className="border-b border-[#E5E5E5] py-14 md:py-20">
        <Container>
          <Eyebrow>The journey</Eyebrow>
          <h2
            id="journey-title"
            className="mt-4 max-w-[16ch] font-oswald text-[clamp(34px,7vw,64px)] font-bold uppercase leading-[0.98]"
          >
            From order to your door
          </h2>

          <ol className="relative mt-12 space-y-0 lg:grid lg:grid-cols-5 lg:gap-6 lg:space-y-0">
            {/* Desktop connecting line */}
            <span aria-hidden="true" className="absolute left-0 right-0 top-[27px] hidden h-[2px] bg-[#E5E5E5] lg:block" />
            {journey.map((j, i) => (
              <li key={j.step} className="relative flex gap-5 pb-10 last:pb-0 lg:block lg:pb-0">
                {/* Mobile connecting line */}
                {i < journey.length - 1 && (
                  <span aria-hidden="true" className="absolute left-[27px] top-14 h-[calc(100%-3.5rem)] w-[2px] bg-[#E5E5E5] lg:hidden" />
                )}
                <span
                  className={
                    'relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 font-oswald text-[20px] font-bold ' +
                    (i === journey.length - 1
                      ? 'border-[#C62828] bg-[#C62828] text-white'
                      : 'border-[#111111] bg-white text-[#111111]')
                  }
                >
                  {i + 1}
                </span>
                <div className="lg:mt-6">
                  <h3 className="font-oswald text-[24px] font-semibold uppercase tracking-[0.04em]">{j.step}</h3>
                  <p className="mt-2 max-w-[34ch] text-[16px] leading-[1.7] text-[#444444]">{j.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <Callout title="About delivery time" className="mt-14 max-w-[78ch]">
            We do not promise a fixed number of days for processing or delivery, because it depends on the item, your
            location and the delivery partner. The most reliable guide is the live status of your order in{' '}
            <Link href="/orders">your orders</Link>.
          </Callout>
        </Container>
      </section>

      {/* Charges in detail */}
      <section aria-labelledby="charges-title" className="py-14 md:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-20">
            <div>
              <Eyebrow>Charges</Eyebrow>
              <h2
                id="charges-title"
                className="mt-4 font-oswald text-[clamp(34px,6vw,56px)] font-bold uppercase leading-[0.98]"
              >
                How shipping is charged
              </h2>
            </div>
            <div className={PROSE}>
              <ul>
                <li>
                  <strong>Order subtotal below {inr(FREE_SHIPPING_THRESHOLD)}:</strong> a flat {inr(SHIPPING_FEE)}.
                </li>
                <li>
                  <strong>Order subtotal of {inr(FREE_SHIPPING_THRESHOLD)} or more:</strong> free.
                </li>
                <li>
                  <strong>Gold membership:</strong> free shipping on eligible orders. See the{' '}
                  <Link href="/membership">membership page</Link> for plans.
                </li>
                <li>
                  <strong>Coupons:</strong> the free-shipping threshold is measured on your subtotal <em>before</em> a
                  coupon is applied, so a coupon never turns a free-shipping order into a paid one.
                </li>
                <li>
                  <strong>GST:</strong> {GST_PERCENT}% GST is calculated on the amount after any coupon and is shown
                  separately from shipping in your order summary.
                </li>
              </ul>
              <p>The exact shipping amount for your cart is always shown at checkout before you pay.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Tracking + problems */}
      <section aria-labelledby="tracking-title" className="bg-[#F5F5F5] py-14 md:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-20">
            <div>
              <Eyebrow>Tracking</Eyebrow>
              <h2
                id="tracking-title"
                className="mt-4 font-oswald text-[clamp(34px,6vw,56px)] font-bold uppercase leading-[0.98]"
              >
                Follow your order
              </h2>
              <CtaLink href="/orders" variant="dark" className="mt-8">
                Go to my orders
              </CtaLink>
            </div>
            <div className={PROSE}>
              <p>
                Sign in and open <Link href="/orders">your orders</Link> to see where each order is: Ordered, Packed,
                Shipped, Out for delivery or Delivered. We also email you when an order is confirmed, cancelled,
                returned or refunded.
              </p>
              <p>
                The website does not currently show a courier tracking number. If you need more detail on a shipped
                order, <SupportContact />.
              </p>
            </div>
          </div>

          <div className="mt-16 grid gap-px bg-[#D9D9D9] md:grid-cols-3">
            {faqish.map((f) => (
              <article key={f.q} className="bg-white p-7 md:p-8">
                <h3 className="font-oswald text-[24px] font-semibold uppercase leading-tight tracking-[0.03em]">{f.q}</h3>
                <p className="mt-4 text-[16px] leading-[1.75] text-[#444444] [&_a]:font-semibold [&_a]:text-[#C62828] [&_a]:underline [&_a]:underline-offset-4">
                  {f.a}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-[#111111] py-14 text-white md:py-16">
        <Container className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <p className="max-w-[24ch] font-oswald text-[clamp(30px,5vw,48px)] font-bold uppercase leading-[1]">
            Something not right with a delivery?
          </p>
          <CtaLink href="/contact" variant="light">
            Contact support
          </CtaLink>
        </Container>
      </section>
    </div>
  );
}
