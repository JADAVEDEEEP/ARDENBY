import type { Metadata } from 'next';
import Link from 'next/link';

import { Container, Eyebrow, PageTitle } from '@/components/info/info-ui';
import { BUSINESS } from '@/lib/policy-facts';

import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Contact Us | KOVENIK',
  description:
    'Get in touch with KOVENIK support about an order, a return, sizing or anything else. Send us a message and we will reply by email.',
  alternates: { canonical: '/contact' },
  robots: { index: true, follow: true },
};

// NEEDS APPROVAL: no support e-mail, phone, hours or postal address is configured, so none is shown.
// Set NEXT_PUBLIC_SUPPORT_EMAIL / _PHONE / _HOURS / NEXT_PUBLIC_BUSINESS_ADDRESS (frontend) and
// SUPPORT_INBOX_EMAIL (backend) to publish them. The form posts to POST /api/support, which
// refuses with an honest error until a support inbox is configured.

const quick = [
  { href: '/faqs', title: 'FAQ', text: 'Quick answers on orders, shipping and sizing.' },
  { href: '/orders', title: 'My orders', text: 'Track, cancel or return an order yourself.' },
  { href: '/returns', title: 'Returns & refunds', text: 'How returns and refunds work.' },
];

export default function ContactPage() {
  const hasDetails = BUSINESS.supportEmail || BUSINESS.supportPhone || BUSINESS.supportHours || BUSINESS.address;

  return (
    <div className="bg-white text-[#111111]">
      <header className="border-b border-[#E5E5E5]">
        <Container className="py-14 md:py-20 lg:py-24">
          <Eyebrow>Help · Contact</Eyebrow>
          <PageTitle className="mt-6">
            Let’s <span className="text-[#C62828]">talk</span>
          </PageTitle>
          <p className="mt-8 max-w-[52ch] text-[19px] leading-[1.65] text-[#444444] md:text-[22px]">
            A question about an order, a return or a fit? Send us a message and we will reply by email.
          </p>
        </Container>
      </header>

      <Container className="py-12 md:py-20">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-20">
          {/* Left: details */}
          <div className="order-2 space-y-12 lg:order-1">
            <section aria-labelledby="reach-title">
              <h2 id="reach-title" className="font-oswald text-[28px] font-bold uppercase tracking-[0.04em]">
                How to reach us
              </h2>
              <div className="mt-5 space-y-5 text-[17px] leading-[1.7] text-[#333333]">
                {BUSINESS.supportEmail && (
                  <p>
                    <span className="block text-[13px] font-bold uppercase tracking-[0.18em] text-[#C62828]">Email</span>
                    <a className="font-semibold underline underline-offset-4 hover:text-[#C62828]" href={`mailto:${BUSINESS.supportEmail}`}>
                      {BUSINESS.supportEmail}
                    </a>
                  </p>
                )}
                {BUSINESS.supportPhone && (
                  <p>
                    <span className="block text-[13px] font-bold uppercase tracking-[0.18em] text-[#C62828]">Phone</span>
                    <a className="font-semibold underline underline-offset-4 hover:text-[#C62828]" href={`tel:${BUSINESS.supportPhone.replace(/[^\d+]/g, '')}`}>
                      {BUSINESS.supportPhone}
                    </a>
                  </p>
                )}
                {BUSINESS.supportHours && (
                  <p>
                    <span className="block text-[13px] font-bold uppercase tracking-[0.18em] text-[#C62828]">Support hours</span>
                    {BUSINESS.supportHours}
                  </p>
                )}
                {BUSINESS.address && (
                  <p>
                    <span className="block text-[13px] font-bold uppercase tracking-[0.18em] text-[#C62828]">Location</span>
                    {BUSINESS.address}
                  </p>
                )}
                {!hasDetails && (
                  <p>
                    The form is the quickest way to reach our team. Your message goes straight to our support inbox and we
                    reply to the email address you enter.
                  </p>
                )}
              </div>
            </section>

            <section aria-labelledby="help-title" className="bg-[#F5F5F5] p-6 md:p-8">
              <h2 id="help-title" className="font-oswald text-[22px] font-bold uppercase tracking-[0.06em]">
                To help us help you
              </h2>
              <ul className="mt-4 space-y-3 text-[16px] leading-[1.65] text-[#333333]">
                <li>Include your order number if your question is about an order.</li>
                <li>Use the same email address as your KOVENIK account.</li>
                <li>Tell us what you expected and what happened instead.</li>
              </ul>
            </section>

            <nav aria-label="Self-service" className="border-t-2 border-[#111111]">
              {quick.map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="group flex min-h-[72px] items-center justify-between gap-4 border-b border-[#D9D9D9] py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C62828]"
                >
                  <span>
                    <span className="block font-oswald text-[22px] font-semibold uppercase tracking-[0.04em] group-hover:text-[#C62828]">{q.title}</span>
                    <span className="block text-[15px] text-[#555555]">{q.text}</span>
                  </span>
                  <span aria-hidden="true" className="text-[24px] text-[#C62828] transition-transform group-hover:translate-x-1">→</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: form */}
          <div className="order-1 lg:order-2">
            <h2 className="mb-8 font-oswald text-[clamp(32px,6vw,52px)] font-bold uppercase leading-[1]">Send a message</h2>
            <ContactForm />
          </div>
        </div>
      </Container>
    </div>
  );
}
