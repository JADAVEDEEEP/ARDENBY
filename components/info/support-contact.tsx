import Link from 'next/link';

import { BUSINESS } from '@/lib/policy-facts';

/** Inline "how to reach us" text for legal copy. Shows the support e-mail only when the
 *  owner has configured one; otherwise it points to the contact form. Never invents an address. */
export function SupportContact({ label = 'contact page' }: { label?: string }) {
  return (
    <>
      {BUSINESS.supportEmail ? (
        <>
          email us at <a href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a> or use our{' '}
        </>
      ) : (
        <>use our </>
      )}
      <Link href="/contact">{label}</Link>
    </>
  );
}
