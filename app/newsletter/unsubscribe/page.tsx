import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Container, Eyebrow } from '@/components/info/info-ui';

import { UnsubscribeClient } from './unsubscribe-client';

export const metadata: Metadata = {
  title: 'Unsubscribe | KOVENIK',
  robots: { index: false, follow: false },
};

export default function NewsletterUnsubscribePage() {
  return (
    <main className="bg-white py-16 text-[#111111] md:py-24">
      <Container className="max-w-[760px]">
        <Eyebrow>Newsletter</Eyebrow>
        <Suspense fallback={<p className="mt-6 text-[17px] text-[#444444]">Loading…</p>}>
          <UnsubscribeClient />
        </Suspense>
      </Container>
    </main>
  );
}
