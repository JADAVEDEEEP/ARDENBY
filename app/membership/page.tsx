import type { Metadata } from 'next';
import { Suspense } from 'react';

import { MembershipClient } from './membership-client';

export const metadata: Metadata = {
  title: 'Membership | KÖVENIK',
  description: 'Join KÖVENIK Bronze, Silver or Gold for member pricing, early access and more.',
  alternates: { canonical: '/membership' },
};

export default function MembershipPage() {
  return (
    <Suspense fallback={<main className="kv-page min-h-[60vh]" />}>
      <MembershipClient />
    </Suspense>
  );
}
