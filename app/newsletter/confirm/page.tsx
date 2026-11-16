import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Container, Eyebrow } from '@/components/info/info-ui';

import { ConfirmClient } from './confirm-client';

export const metadata: Metadata = {
  title: 'Confirm your email | KOVENIK',
  robots: { index: false, follow: false },
};

export default function NewsletterConfirmPage() {
  return (
    <main className="bg-white py-16 text-[#111111] md:py-24">
      <Container className="max-w-[760px]">
        <Eyebrow>Newsletter</Eyebrow>
        <Suspense fallback={<p className="mt-6 text-[17px] text-[#444444]">Loading…</p>}>
          <ConfirmClient />
        </Suspense>
      </Container>
    </main>
  );
}
