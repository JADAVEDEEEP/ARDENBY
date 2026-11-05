import type { Metadata } from 'next';
import Link from 'next/link';

import { Callout, Container, CtaLink, Eyebrow, PageTitle, PROSE } from '@/components/info/info-ui';
import { SupportContact } from '@/components/info/support-contact';
import { RETURN_WINDOW_DAYS } from '@/lib/policy-facts';

export const metadata: Metadata = {
  title: 'Return & Refund Policy | KOVENIK',
  description:
    'How KOVENIK returns, cancellations and refunds work: who can return, the return window, how to request a return, and how refunds are calculated and paid.',
  alternates: { canonical: '/returns' },
  robots: { index: true, follow: true },
};

// NEEDS APPROVAL: every rule below is taken from the live backend
// (return.service.js, cancellation.service.js, refund-calc.service.js, notification templates,
// store_settings "returns" = enabled / 7 days read 2026-11-05).
// NOT configured anywhere, therefore NOT promised: refund timeline in days, who pays return
// shipping, a list of non-returnable products, the return-to address, and exchanges (none exist).
// See docs/POLICY_PAGES_BUSINESS_INPUT_REQUIRED.md.

const steps = [
  {
    title: 'Request',
    text: 'Open your delivered order in My Orders, choose the item(s) and quantity, pick a reason and submit the return request.',
  },
  {
    title: 'Review',
    text: 'We review the request and email you our decision. If it is approved, you will get instructions for the next step.',
  },
  {
    title: 'Send it back',
    text: 'Pack the item(s) in original condition with tags, send them to us, then tap “I have sent the items” on your order page. You can add a tracking number.',
  },
  {
    title: 'Inspection',
    text: 'When your parcel arrives we check every returned item one by one and email you the result.',
  },
  {
    title: 'Refund',
    text: 'For items that pass inspection, your refund is calculated by our system and sent to you. You are emailed at each stage.',
  },
];

const eligible = [
  'The order has been delivered.',
  `You request the return within ${RETURN_WINDOW_DAYS} days of delivery.`,
  'The items are unused, unwashed and in original condition with tags.',
  'The reason is one we accept: wrong product, wrong size, damaged, defective, quality issue, or different from the description.',
];

const notEligible = [
  'The order has not been delivered yet (use cancellation instead).',
  'The return window for the order has ended.',
  'The items were already returned, cancelled or are part of another return request.',
  'The items fail inspection: for example used or washed, or not the product we sent.',
];

export default function ReturnsPage() {
  return (
    <div className="bg-white text-[#111111]">
      {/* Hero with the window as the hero number */}
      <header className="border-b border-[#E5E5E5]">
        <Container className="py-14 md:py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end lg:gap-16">
            <div>
              <Eyebrow>Policy · Returns</Eyebrow>
              <PageTitle className="mt-6">
                Return <span className="text-[#C62828]">&amp;</span> Refund
              </PageTitle>
              <p className="mt-8 max-w-[56ch] text-[19px] leading-[1.65] text-[#444444] md:text-[22px]">
                Changed your mind before it ships, or something is not right once it arrives? Here is exactly how
                cancellations, returns and refunds work.
              </p>
            </div>
            <div className="bg-[#111111] p-8 text-white">
              <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#FF8A80]">Return window</p>
              <p className="mt-3 font-oswald text-[clamp(72px,12vw,120px)] font-bold leading-[0.9]">{RETURN_WINDOW_DAYS}</p>
              <p className="font-oswald text-[28px] font-semibold uppercase tracking-[0.06em]">days from delivery</p>
              <p className="mt-4 text-[15px] leading-[1.6] text-[#D6D6D6]">
                Your order page always shows how many days you have left.
              </p>
            </div>
          </div>
        </Container>
      </header>

      {/* Steps */}
      <section aria-labelledby="steps-title" className="py-14 md:py-20">
        <Container>
          <Eyebrow>How to return</Eyebrow>
          <h2
            id="steps-title"
            className="mt-4 max-w-[14ch] font-oswald text-[clamp(34px,7vw,64px)] font-bold uppercase leading-[0.98]"
          >
            Five steps, tracked online
          </h2>

          <ol className="mt-12 grid gap-0 border-t-2 border-[#111111] md:grid-cols-2 lg:grid-cols-5">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="relative border-b border-[#E5E5E5] py-8 md:pr-6 lg:border-b-0 lg:border-r lg:px-6 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
              >
                <span className="font-oswald text-[56px] font-bold leading-none text-[#C62828]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 font-oswald text-[24px] font-semibold uppercase tracking-[0.04em]">{s.title}</h3>
                <p className="mt-3 text-[16px] leading-[1.7] text-[#444444]">{s.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <CtaLink href="/orders">Start a return from my orders</CtaLink>
          </div>
        </Container>
      </section>

      {/* Eligibility */}
      <section aria-labelledby="eligibility-title" className="bg-[#F5F5F5] py-14 md:py-20">
        <Container>
          <Eyebrow>Eligibility</Eyebrow>
          <h2
            id="eligibility-title"
            className="mt-4 font-oswald text-[clamp(34px,7vw,64px)] font-bold uppercase leading-[0.98]"
          >
            What can be returned
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="border-t-[6px] border-[#111111] bg-white p-7 md:p-9">
              <h3 className="font-oswald text-[26px] font-semibold uppercase tracking-[0.04em]">Eligible when</h3>
              <ul className="mt-5 space-y-4">
                {eligible.map((t) => (
                  <li key={t} className="flex gap-3 text-[17px] leading-[1.65] text-[#333333]">
                    <span aria-hidden="true" className="mt-[3px] flex h-6 w-6 shrink-0 items-center justify-center bg-[#111111] text-[14px] font-bold text-white">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t-[6px] border-[#C62828] bg-white p-7 md:p-9">
              <h3 className="font-oswald text-[26px] font-semibold uppercase tracking-[0.04em]">Not eligible when</h3>
              <ul className="mt-5 space-y-4">
                {notEligible.map((t) => (
                  <li key={t} className="flex gap-3 text-[17px] leading-[1.65] text-[#333333]">
                    <span aria-hidden="true" className="mt-[3px] flex h-6 w-6 shrink-0 items-center justify-center bg-[#C62828] text-[14px] font-bold text-white">✕</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Callout title="Non-returnable items" className="mt-10 max-w-[78ch] bg-white">
            No product category is excluded from returns on the website today. Whether a returned item is refundable
            depends on the inspection result above.
          </Callout>
        </Container>
      </section>

      {/* Refunds, cancellation, exchange */}
      <section className="py-14 md:py-20">
        <Container className="space-y-16 md:space-y-24">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-20">
            <div>
              <Eyebrow>Refunds</Eyebrow>
              <h2 className="mt-4 font-oswald text-[clamp(34px,6vw,56px)] font-bold uppercase leading-[0.98]">
                How refunds work
              </h2>
            </div>
            <div className={PROSE}>
              <h3>What you get back</h3>
              <p>
                The refund for a returned item is calculated by our system, never typed in by hand. It is the price of
                the returned item, less its share of any coupon discount, plus its share of the GST you paid. It can
                never be more than you paid.
              </p>
              <ul>
                <li>
                  <strong>Shipping is not refunded</strong> on a return after delivery.
                </li>
                <li>
                  If an inspection finds a problem, an amount may be deducted; this only ever lowers the refund, and a
                  reason is recorded.
                </li>
                <li>Items that fail inspection may not be refunded.</li>
              </ul>
              <h3>How it is paid</h3>
              <ul>
                <li>
                  <strong>Paid online:</strong> refunded to the original payment method through Razorpay. How soon it
                  shows in your account depends on Razorpay and your bank.
                </li>
                <li>
                  <strong>Cash on delivery:</strong> we arrange a manual payout (such as UPI or bank transfer) and
                  will contact you for the details we need.
                </li>
              </ul>
              <p>
                We do not state a fixed number of days for refunds because the last step depends on the payment network.
                You are emailed when the refund is started and when it is completed.
              </p>
            </div>
          </div>

          <div className="grid gap-8 border-t-2 border-[#111111] pt-16 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-20 md:pt-24">
            <div>
              <Eyebrow>Cancellations</Eyebrow>
              <h2 className="mt-4 font-oswald text-[clamp(34px,6vw,56px)] font-bold uppercase leading-[0.98]">
                Cancel before dispatch
              </h2>
            </div>
            <div className={PROSE}>
              <ul>
                <li>
                  <strong>Pending, confirmed or processing:</strong> you can cancel the whole order, or individual items
                  and quantities, from <Link href="/orders">your orders</Link>.
                </li>
                <li>
                  <strong>Packed:</strong> it can no longer be cancelled from your account. <SupportContact /> and we
                  will see what is possible.
                </li>
                <li>
                  <strong>Shipped:</strong> it cannot be cancelled. After delivery, use a return.
                </li>
              </ul>
              <p>
                If you paid online, a cancelled order is refunded to the original payment method. When an entire order is
                cancelled before dispatch, shipping is refunded too. A cash-on-delivery order has nothing to refund,
                because you have not paid yet.
              </p>
            </div>
          </div>

          <div className="grid gap-8 border-t-2 border-[#111111] pt-16 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-20 md:pt-24">
            <div>
              <Eyebrow>Exchanges</Eyebrow>
              <h2 className="mt-4 font-oswald text-[clamp(34px,6vw,56px)] font-bold uppercase leading-[0.98]">
                No exchanges, for now
              </h2>
            </div>
            <div className={PROSE}>
              <p>
                We do not offer direct exchanges at the moment. If you need a different size, request a return for the
                original item (if it is eligible) and place a new order for the size you want. Stock for the new size is
                not held while a return is processed, so you may prefer to order first.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-[#111111] py-14 text-white md:py-16">
        <Container className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <p className="max-w-[22ch] font-oswald text-[clamp(30px,5vw,48px)] font-bold uppercase leading-[1]">
            Not sure what applies to you?
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CtaLink href="/faqs" variant="light">Read the FAQ</CtaLink>
            <CtaLink href="/contact" variant="solid">Contact support</CtaLink>
          </div>
        </Container>
      </section>
    </div>
  );
}
