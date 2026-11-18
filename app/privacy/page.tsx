import type { Metadata } from 'next';
import Link from 'next/link';

import { Callout, Container, Eyebrow, LegalDocument, PageTitle } from '@/components/info/info-ui';
import type { LegalSectionDef } from '@/components/info/info-ui';
import { SupportContact } from '@/components/info/support-contact';
import { BUSINESS, PRIVACY_UPDATED } from '@/lib/policy-facts';

export const metadata: Metadata = {
  title: 'Privacy Policy | KOVENIK',
  description:
    'How KOVENIK collects, uses, shares and protects your personal information, how payments and newsletter sign-ups are handled, and how to delete your account.',
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
};

// NEEDS APPROVAL (legal review): this text describes what the code actually does today
// (verified 2026-11-05). Retention periods, the registered entity and the Grievance Officer
// are not configured anywhere, so they are not stated. See
// docs/POLICY_PAGES_BUSINESS_INPUT_REQUIRED.md.

const sections: LegalSectionDef[] = [
  {
    id: 'information-we-collect',
    title: 'Information we collect',
    content: (
      <>
        <p>We collect only what we need to run your account, deliver your orders and look after you.</p>
        <h3>Information you give us</h3>
        <ul>
          <li>
            <strong>Account details:</strong> your name, email address and, if you add one, your phone number. If you
            register with a password we store it only in scrambled (hashed) form, never as plain text. If you sign in
            with Google we receive your name, email address and Google account identifier from Google.
          </li>
          <li>
            <strong>Delivery addresses</strong> you save or enter at checkout.
          </li>
          <li>
            <strong>Orders and returns:</strong> what you bought, amounts, payment method, order status, and any
            cancellation or return requests including the reason you give.
          </li>
          <li>
            <strong>Wishlist, cart, coupons and membership</strong> activity linked to your account.
          </li>
          <li>
            <strong>Reviews and support messages</strong> you choose to send us.
          </li>
        </ul>
        <h3>Information from your device</h3>
        <ul>
          <li>
            <strong>Location:</strong> only if you tap “Use current location” while adding an address, and only after
            your browser asks for your permission. You can refuse and type the address instead.
          </li>
          <li>
            <strong>Browser storage</strong> that keeps you signed in and remembers your guest cart (see “Cookies and
            similar technologies”).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use-it',
    title: 'How we use your information',
    content: (
      <>
        <p>We use your information to:</p>
        <ul>
          <li>create and secure your account, including sending one-time passcodes by email;</li>
          <li>take, pack, deliver, cancel, return and refund your orders;</li>
          <li>apply coupons and membership benefits you are entitled to;</li>
          <li>email you about your orders, cancellations, returns and refunds;</li>
          <li>send you our newsletter, but only if you sign up for it and confirm your email (see “Newsletter and marketing emails”);</li>
          <li>answer your questions and resolve problems;</li>
          <li>detect fraud and keep the website secure; and</li>
          <li>meet our legal, tax and accounting obligations.</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </>
    ),
  },
  {
    id: 'newsletter',
    title: 'Newsletter and marketing emails',
    content: (
      <>
        <p>
          Our newsletter is optional. You do not need an account to join, and joining is separate from placing an
          order. We email you updates, new arrivals and limited-drop announcements only if you ask us to.
        </p>
        <h3>How you subscribe (and give consent)</h3>
        <ul>
          <li>
            You enter your email address in the newsletter box on our website. The box tells you that you are agreeing
            to receive KOVENIK marketing emails.
          </li>
          <li>
            We then send one email with a confirmation link. <strong>You are not subscribed until you click it.</strong>{' '}
            The link works once and expires after 48 hours. If you did not sign up, ignore that email and you will not be
            subscribed.
          </li>
        </ul>
        <h3>What we store</h3>
        <ul>
          <li>Your email address and whether you are waiting to confirm, subscribed or unsubscribed.</li>
          <li>
            When you signed up, confirmed and (if you did) unsubscribed, and which part of the site you used, so that
            we can show that you agreed.
          </li>
          <li>
            Which version of the sign-up wording you saw, your browser type, and a scrambled (hashed) fingerprint of your
            internet address. We keep the fingerprint, not the internet address itself.
          </li>
        </ul>
        <p>
          We use this only to run the newsletter. We do not sell it or share it with anyone for their own marketing. Our
          email provider (Brevo) delivers the messages for us.
        </p>
        <h3>Unsubscribing</h3>
        <ul>
          <li>
            Every newsletter will carry an unsubscribe link, and many email apps also show their own “Unsubscribe”
            button. Either one stops our newsletter straight away, with no login and no reason needed.
          </li>
          <li>
            You can also ask us to unsubscribe you through our <Link href="/contact">contact page</Link>.
          </li>
          <li>
            Unsubscribing does not stop emails about your orders, returns, refunds or account security (such as
            one-time passcodes), because you need those.
          </li>
          <li>
            After you unsubscribe we keep your address marked “unsubscribed” so that we do not email you again by
            mistake. If you want it removed from our records completely, <SupportContact /> and tell us. If you ever
            sign up again, you will need to confirm your email again.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and similar technologies',
    content: (
      <>
        <p>
          KOVENIK stores a small amount of data in your browser so the shop works: a sign-in token that keeps you
          logged in, and your cart while you are not signed in. This is essential to the service and stays on your
          device until you sign out or clear your browser data.
        </p>
        <Callout title="No advertising trackers">
          At the time of writing, KOVENIK does not run advertising or third-party analytics trackers. If that changes,
          we will update this page before we begin.
        </Callout>
        <p>
          You can clear or block browser storage in your browser settings. If you do, you will need to sign in again
          and your guest cart will be emptied.
        </p>
      </>
    ),
  },
  {
    id: 'payments',
    title: 'Payment information and providers',
    content: (
      <>
        <p>
          Online payments are processed by <strong>Razorpay</strong> in Razorpay’s own secure payment window. Your
          card, UPI or net-banking details are entered there and are handled by Razorpay and your bank.{' '}
          <strong>KOVENIK does not see or store your full card number, CVV or UPI PIN.</strong>
        </p>
        <p>
          We keep the payment reference and status Razorpay gives us (for example “paid” or “refunded”) so that we can
          confirm your order and refund it correctly. If you choose cash on delivery, you pay the courier on arrival and
          no payment details are collected online.
        </p>
        <p>
          Razorpay’s handling of your data is governed by its own terms and privacy policy.
        </p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Data sharing and third-party services',
    content: (
      <>
        <p>
          We share information only with services that help us run KOVENIK, and only what each one needs:
        </p>
        <ul>
          <li>
            <strong>Razorpay</strong> — to take online payments and send refunds.
          </li>
          <li>
            <strong>Google</strong> — if you choose “Sign in with Google”.
          </li>
          <li>
            <strong>Ola Maps</strong> — address search and map lookups when you add an address; the text you type or
            the coordinates you share are sent to it.
          </li>
          <li>
            <strong>Email delivery provider (Brevo)</strong> — to send one-time passcodes, order emails and, if you have
            subscribed, our newsletter.
          </li>
          <li>
            <strong>Image hosting (Cloudinary)</strong> — to store and serve product, banner and review images.
          </li>
          <li>
            <strong>Cloud hosting and database providers</strong> — which store the website and its data on our behalf.
          </li>
          <li>
            <strong>Delivery partners</strong> — your name, phone number and delivery address, so that your parcel can
            reach you.
          </li>
        </ul>
        <p>
          We may also disclose information when the law requires it, or to protect our rights, customers and the
          website from fraud or abuse.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Data security',
    content: (
      <>
        <p>
          We protect your information with measures that include encrypted connections (HTTPS), hashed passwords,
          one-time passcodes where we need to verify you, rate limiting against brute-force attempts, and restricted access to
          administration tools.
        </p>
        <p>
          No system is completely secure. Please choose a strong, unique password and never share your one-time
          passcodes. If you think your account has been accessed without your permission,{' '}
          <SupportContact /> straight away.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights and account deletion',
    content: (
      <>
        <p>You are in control of your information. You can:</p>
        <ul>
          <li>
            <strong>View and update</strong> your name, phone number, addresses and security settings from your{' '}
            <Link href="/profile">profile</Link>.
          </li>
          <li>
            <strong>Delete your account</strong> yourself from the account settings in your profile.
          </li>
          <li>
            <strong>Ask us</strong> about the information we hold, or ask for a correction, through our{' '}
            <Link href="/contact">contact page</Link>.
          </li>
        </ul>
        <h3>What deleting your account does</h3>
        <p>
          When you delete your account (email accounts confirm with their password), your name, phone number, email
          address, password and Google link are erased and the account is closed, so you can no longer sign in. Past
          order and payment records are kept without your personal profile details because we need them for accounting,
          tax, returns and dispute purposes. Deleting your account does not cancel an order that is already in
          progress; cancel it first if you no longer want it.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    content: (
      <p>
        We may update this policy as KOVENIK grows or the law changes. The “Last updated” date at the top of this page
        always shows when it last changed. Significant changes will be highlighted on the website.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact information',
    content: (
      <>
        <p>
          For any privacy question or request, <SupportContact />.
        </p>
        {(BUSINESS.legalName || BUSINESS.address || BUSINESS.grievanceOfficer) && (
          <address className="mt-5 not-italic">
            {BUSINESS.legalName && <strong>{BUSINESS.legalName}</strong>}
            {BUSINESS.address && (
              <>
                <br />
                {BUSINESS.address}
              </>
            )}
            {BUSINESS.grievanceOfficer && (
              <>
                <br />
                Grievance Officer: {BUSINESS.grievanceOfficer}
              </>
            )}
          </address>
        )}
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-white text-[#111111]">
      <header className="border-b border-[#E5E5E5]">
        <Container className="py-14 md:py-20 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end lg:gap-16">
            <div>
              <Eyebrow>Legal · Privacy</Eyebrow>
              <PageTitle className="mt-6">
                Privacy <span className="text-[#C62828]">Policy</span>
              </PageTitle>
              <p className="mt-8 max-w-[60ch] text-[19px] leading-[1.65] text-[#444444] md:text-[22px]">
                What we collect, why we collect it, who helps us handle it, and the choices you have. Written in plain
                language, because your information is yours.
              </p>
              <p className="mt-6 text-[14px] font-semibold uppercase tracking-[0.16em] text-[#555555]">
                Last updated: <time dateTime="2026-11-16">{PRIVACY_UPDATED}</time>
              </p>
            </div>

            <aside aria-label="Privacy at a glance" className="bg-[#111111] p-7 text-white md:p-8">
              <p className="font-oswald text-[20px] font-semibold uppercase tracking-[0.12em] text-[#FF8A80]">At a glance</p>
              <ul className="mt-5 space-y-4 text-[16px] leading-[1.6]">
                <li>We never sell your personal information.</li>
                <li>Card and UPI details stay with Razorpay, not with us.</li>
                <li>No advertising trackers on the site today.</li>
                <li>You can delete your account yourself, any time.</li>
                <li>Newsletter emails only after you confirm, and you can unsubscribe in one click.</li>
              </ul>
            </aside>
          </div>
        </Container>
      </header>

      <Container className="py-12 md:py-20">
        <LegalDocument sections={sections} />
      </Container>
    </div>
  );
}
