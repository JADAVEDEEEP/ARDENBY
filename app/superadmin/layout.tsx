import { SuperAdminShell } from '@/components/admin/superadmin-shell';

export default function SuperAdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperAdminShell>{children}</SuperAdminShell>;
}
