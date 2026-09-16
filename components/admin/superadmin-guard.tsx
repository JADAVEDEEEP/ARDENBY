'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  getCurrentAdmin,
  isSuperAdminRole,
} from '@/components/admin/admin-auth';

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifySuperAdmin() {
      try {
        const user = await getCurrentAdmin();

        if (!isSuperAdminRole(user.role)) {
          router.replace('/admin');
          return;
        }

        if (!cancelled) setAllowed(true);
      } catch {
        router.replace('/admin/login');
      }
    }

    void verifySuperAdmin();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!allowed) {
    return (
      <div className="rounded-md border border-[#e7ddd1] bg-white p-5 text-sm text-[#736a60]">
        Checking super admin access...
      </div>
    );
  }

  return <>{children}</>;
}
