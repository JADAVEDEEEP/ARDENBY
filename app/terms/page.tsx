import type { Metadata } from 'next';
import Link from 'next/link';

import { Callout, Container, Eyebrow, LegalDocument, PageTitle } from '@/components/info/info-ui';
import type { LegalSectionDef } from '@/components/info/info-ui';
import { SupportContact } from '@/components/info/support-contact';
import {
  BUSINESS,
  FREE_SHIPPING_THRESHOLD,
  GST_PERCENT,
  POLICY_UPDATED,
  SHIPPING_FEE,
  inr,
} from '@/lib/policy-facts';

export const metadata: Metadata = {
  title: 'Terms & Conditions | KOVENIK',
  description:
    'The terms that apply when you browse, register and shop at KOVENIK: orders, payments, cancellations, membership, intellectual property and more.',
  alternates: { canonical: '/terms' },
  robots: { index: true, follow: true },
};

// NEEDS APPROVAL (legal review): operational statements below match the code (orders, payments,
// cancellation rules, membership policy). Standard legal clauses (liability, IP, governing law)
// are conventional wording for an Indian online store and MUST be reviewed by a lawyer.
// The registered entity and the courts' city are not configured, so they are shown only if set.
// See docs/POLICY_PAGES_BUSINESS_INPUT_REQUIRED.md.

const sections: LegalSectionDef[] = [
  {
    id: 'using-the-website',
    title: 'Using the website',
    content: (
      <>
        <p>
          These terms apply to your use of the KOVENIK website and to every order you place through it. By browsing or
          buying you confirm that you have read them and agree to be bound by them. If you do not agree, please do not
          use the website.
        </p>
        <p>
          You agree to use the website lawfully and only for personal, non-commercial shopping. You must not try to
          interfere with its security, copy or scrape it at scale, or use it to harm others.
        </p>
      </>
    ),
  },
  {
    id: 'accounts',
    title: 'Account registration',
    content: (
      <>
        <p>
          You can browse without an account, but you need one to check out, track orders, save addresses and use your
          wishlist or membership. You can register with your email address and a password, or sign in with Google.
        </p>
        <ul>
          <li>Information you give us must be accurate and kept up to date.</li>
          <li>You are responsible for everything done through your account, so keep your password and one-time passcodes private.</li>
          <li>We may suspend or close an account that is used fraudulently, abusively or in breach of these terms.</li>
          <li>
            You can close your own account at any time from your <Link href="/profile">profile</Link>. See our{' '}
            <Link href="/privacy">Privacy Policy</Link> for what that removes.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'products-and-pricing',
    title: 'Product information and pricing',
    content: (
      <>
        <p>
          We try to describe and photograph every product accurately. Colours can look slightly different on different
          screens, and measurements can vary a little, so please use the size guide on the product page.
        </p>
        <p>
          All prices are in Indian Rupees (₹). At checkout, GST at {GST_PERCENT}% is calculated on the amount after any
          coupon, and shipping is added if it applies (see our <Link href="/shipping">Shipping &amp; Delivery Policy</Link>
          ). The final total is always shown before you pay.
        </p>
        <Callout title="Price at the time of order">
          The price you see when you place your order is the price you pay for that order. Prices, offers and
          availability can change at any time, but never for an order you have already placed.
        </Callout>
        <p>
          Some collections are produced in limited runs. A product can sell out, and we may remove products or change
          prices without notice. If we notice a clear pricing or listing error, we may cancel the affected order and
          refund any payment you made.
        </p>
      </>
    ),
  },
  {
    id: 'orders',
    title: 'Orders and order acceptance',
    content: (
      <>
        <p>
          Placing an order is an offer to buy. We accept it, and a contract is formed, when the order is confirmed: for
          online payment, once your payment is verified; for cash on delivery, once the order is placed. You will see the
          order in <Link href="/orders">your orders</Link> and receive a confirmation email.
        </p>
        <p>We may cancel an order, with a full refund of anything you paid, if for example:</p>
        <ul>
          <li>an item is out of stock;</li>
          <li>there is a problem with the delivery address;</li>
          <li>there is a problem with the payment; or</li>
          <li>we suspect fraud.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'payments',
    title: 'Payments',
    content: (
      <>
        <p>
          You can pay online through Razorpay (the methods available are shown in Razorpay’s payment window) or choose
          cash on delivery where it is offered at checkout. Online orders are confirmed only after the payment has been
          verified. If money is debited but you do not see a confirmed order, please contact us with your payment reference and we will investigate.
        </p>
        <p>
          You confirm that you are authorised to use the payment method you choose. Payment details are handled by
          Razorpay and your bank, not by KOVENIK; see our <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          Coupons and member discounts apply only as shown at checkout, only to eligible products, and cannot be
          exchanged for cash.
        </p>
      </>
    ),
  },
  {
    id: 'cancellations',
    title: 'Cancellations, returns and refunds',
    content: (
      <>
        <p>
          You can cancel an order yourself while it is still pending, confirmed or being processed. Once it has been
          packed, please contact support; once it has shipped it can no longer be cancelled, and you can use a return
          after delivery instead.
        </p>
        <p>
          Returns are accepted on delivered orders within the return window and are subject to inspection. Full details,
          including how refunds are calculated and paid, are in our{' '}
          <Link href="/returns">Return &amp; Refund Policy</Link>, which forms part of these terms.
        </p>
      </>
    ),
  },
  {
    id: 'shipping',
    title: 'Shipping and delivery',
    content: (
      <p>
        Orders under {inr(FREE_SHIPPING_THRESHOLD)} carry a {inr(SHIPPING_FEE)} shipping fee; orders of{' '}
        {inr(FREE_SHIPPING_THRESHOLD)} or more ship free, as do orders by eligible members. Please make sure your
        delivery address and phone number are correct. Delivery is described in our{' '}
        <Link href="/shipping">Shipping &amp; Delivery Policy</Link>.
      </p>
    ),
  },
  {
    id: 'membership',
    title: 'KOVENIK membership',
    content: (
      <>
        <p>
          Membership plans, prices and benefits are shown on the <Link href="/membership">membership page</Link> and
          apply for the plan’s stated duration.
        </p>
        <ul>
          <li>Buying the same plan again while you are a member renews it from the day your current term ends.</li>
          <li>Moving up to a higher plan starts it immediately and ends your lower plan; the unused part of the lower plan is not credited.</li>
          <li>You cannot buy a lower plan while a higher plan is active.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual property',
    content: (
      <p>
        The KOVENIK name, logo, artwork, product designs, photographs, text and the design of this website belong to
        KOVENIK or its licensors and are protected by law. You may view them for personal shopping use only. You may
        not copy, reproduce, modify, distribute or use them commercially, or use the KOVENIK name or logo, without our
        written permission.
      </p>
    ),
  },
  {
    id: 'responsibilities',
    title: 'Your responsibilities',
    content: (
      <ul>
        <li>Provide accurate account, address and contact details.</li>
        <li>Check your order before you pay and use the website honestly.</li>
        <li>Do not misuse coupons, create accounts to abuse offers, or file false cancellation or return requests.</li>
        <li>Do not post reviews that are unlawful, misleading or offensive.</li>
        <li>Follow the care instructions on the product.</li>
      </ul>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    content: (
      <>
        <p>
          We work hard to keep the website available and accurate, but it is provided on an “as is” and “as available”
          basis. To the fullest extent the law allows, KOVENIK is not liable for indirect or consequential loss, or for
          delays or failures caused by events beyond our reasonable control, including courier delays, payment-network
          outages and internet failures.
        </p>
        <p>
          Our total liability for any order is limited to the amount you paid for that order. Nothing in these terms
          limits your rights under consumer-protection law or excludes liability that cannot lawfully be excluded.
        </p>
      </>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing law and disputes',
    content: (
      <>
        <p>
          These terms are governed by the laws of India.
          {BUSINESS.jurisdictionCity
            ? ` Courts at ${BUSINESS.jurisdictionCity} have jurisdiction over any dispute, without affecting any right you have to approach a consumer forum.`
            : ' Any dispute is subject to the courts with jurisdiction under Indian law, without affecting any right you have to approach a consumer forum.'}
        </p>
        <p>
          If you have a complaint, please <SupportContact /> first. Most issues can be resolved quickly and informally.
        </p>
      </>
    ),
  },
  {
    id: 'changes-contact',
    title: 'Changes and contact',
    content: (
      <>
        <p>
          We may update these terms from time to time. The version on this page, with its “Last updated” date, applies
          to orders placed after that date.
        </p>
        <p>
          Questions about these terms? <SupportContact />.
        </p>
        {(BUSINESS.legalName || BUSINESS.address) && (
          <address className="mt-5 not-italic">
            {BUSINESS.legalName && <strong>{BUSINESS.legalName}</strong>}
            {BUSINESS.address && (
              <>
                <br />
                {BUSINESS.address}
              </>
            )}
          </address>
        )}
      </>
    ),
  },
];

const keyPoints = [
  { title: 'Prices in ₹', body: 'The price at the time you order is the price you pay for that order.' },
  { title: 'Confirmed on payment', body: 'Online orders are confirmed once payment is verified.' },
  { title: 'Cancel before dispatch', body: 'Cancel yourself until your order is packed; returns follow delivery.' },
];

export default function TermsPage() {
  return (
    <div className="bg-white text-[#111111]">
      <header className="bg-[#111111] text-white">
        <Container className="py-14 md:py-20 lg:py-24">
          <Eyebrow tone="dark">Legal · Terms</Eyebrow>
          <PageTitle className="mt-6 max-w-[11ch]">
            Terms &amp; <span className="text-[#FF8A80]">Conditions</span>
          </PageTitle>
          <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <p className="max-w-[56ch] text-[19px] leading-[1.65] text-[#D6D6D6] md:text-[22px]">
              The ground rules for shopping with KOVENIK: how orders, payments, cancellations and membership work, and
              what we each can expect.
            </p>
            <p className="shrink-0 text-[14px] font-semibold uppercase tracking-[0.16em] text-[#BDBDBD]">
              Last updated: <time dateTime="2026-11-05">{POLICY_UPDATED}</time>
            </p>
          </div>

          <ul className="mt-12 grid gap-px bg-white/15 md:grid-cols-3" aria-label="Key points">
            {keyPoints.map((k, i) => (
              <li key={k.title} className="bg-[#111111] py-6 md:px-6 md:first:pl-0">
                <p className="font-oswald text-[15px] font-semibold tracking-[0.2em] text-[#FF8A80]">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <p className="mt-1 font-oswald text-[24px] font-semibold uppercase tracking-[0.04em]">{k.title}</p>
                <p className="mt-2 text-[16px] leading-[1.6] text-[#D6D6D6]">{k.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </header>

      <Container className="py-12 md:py-20">
        <LegalDocument sections={sections} />
      </Container>
    </div>
  );
}
