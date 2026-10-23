import type { Metadata } from 'next';

import { SuperAdminShell } from '@/components/admin/superadmin-shell';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
export default function SuperAdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperAdminShell>{children}</SuperAdminShell>;
}
