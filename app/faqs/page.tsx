import type { Metadata } from 'next';

import { Container, Eyebrow, PageTitle } from '@/components/info/info-ui';

import { FaqClient } from './faq-client';
import { FAQS } from './faq-data';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | KOVENIK',
  description:
    'Answers about KOVENIK orders and payments, shipping, returns and refunds, sizing, membership and your account. Search or browse by topic.',
  alternates: { canonical: '/faqs' },
  robots: { index: true, follow: true },
};

export default function FaqsPage() {
  // FAQPage structured data: every question and answer below is visible on the page.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/\n\n/g, ' ') },
    })),
  };

  return (
    <div className="bg-white text-[#111111]">
      <header className="bg-[#111111] text-white">
        <Container className="py-14 md:py-20 lg:py-24">
          <Eyebrow tone="dark">Help · FAQ</Eyebrow>
          <PageTitle className="mt-6">
            Questions, <span className="text-[#FF8A80]">answered</span>
          </PageTitle>
          <p className="mt-8 max-w-[56ch] text-[19px] leading-[1.65] text-[#D6D6D6] md:text-[22px]">
            Search, or pick a topic. Every answer reflects how KOVENIK actually works today.
          </p>
        </Container>
      </header>

      <FaqClient />

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </div>
  );
}
