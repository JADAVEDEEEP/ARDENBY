import type { Metadata } from 'next';
import { Suspense } from 'react';

import { MembershipClient } from './membership-client';

export const metadata: Metadata = {
  title: 'Membership | KÖVENIK',
  description: 'Join KÖVENIK MEMBER: one membership, a flat 15% off eligible products all year.',
  alternates: { canonical: '/membership' },
};

export default function MembershipPage() {
  return (
    <Suspense fallback={<main className="kv-page min-h-[60vh]" />}>
      <MembershipClient />
    </Suspense>
  );
}
