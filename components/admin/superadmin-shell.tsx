'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  LogOut,
  Shield,
  Users,
} from 'lucide-react';

import {
  AdminUser,
  clearAdminToken,
  getAdminToken,
  getCurrentAdmin,
  isSuperAdminRole,
} from '@/components/admin/admin-auth';
import { cn } from '@/lib/utils';

const superAdminLinks = [
  { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/superadmin/users', label: 'User Management', icon: Users },
];

export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verifySuperAdmin() {
      const token = getAdminToken();

      if (!token) {
        router.replace('/admin/login');
        return;
      }

      try {
        const currentUser = await getCurrentAdmin();

        if (!isSuperAdminRole(currentUser.role)) {
          router.replace('/admin');
          return;
        }

        if (!cancelled) {
          setUser(currentUser);
          setChecking(false);
        }
      } catch {
        clearAdminToken();
        router.replace('/admin/login');
      }
    }

    setChecking(true);
    void verifySuperAdmin();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f5f0] text-[#1a1a1a]">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a18158]">
            ARDENBY
          </p>
          <p className="mt-3 text-sm text-[#736a60]">
            Checking super admin access...
          </p>
        </div>
      </main>
    );
  }

  const handleLogout = () => {
    clearAdminToken();
    setUser(null);
    router.replace('/admin/login');
  };

  return (
    <main className="min-h-screen bg-[#f8f5f0] text-[#171717]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-[#e7ddd1] bg-[#111] text-white">
          <div className="flex h-full min-h-[220px] flex-col p-5">
            <Link href="/superadmin" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#b89b72]">
                <Shield className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-serif text-lg uppercase tracking-[0.16em]">
                  Super Admin
                </span>
                <span className="block text-[10px] uppercase tracking-[0.22em] text-[#c8b391]">
                  Ardenby
                </span>
              </span>
            </Link>

            <nav className="mt-8 space-y-1">
              {superAdminLinks.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === '/superadmin'
                    ? pathname === '/superadmin'
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex h-10 items-center gap-3 rounded-md px-3 text-sm text-[#d8d0c4] transition hover:bg-white/10 hover:text-white',
                      active && 'bg-white text-[#111] hover:bg-white hover:text-[#111]'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}

              <Link
                href="/admin"
                className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-[#d8d0c4] transition hover:bg-white/10 hover:text-white"
              >
                <LayoutDashboard className="h-4 w-4" />
                Common Admin
              </Link>
            </nav>

            <div className="mt-auto border-t border-white/10 pt-4">
              <p className="text-xs font-medium text-white">
                {user?.fullName || 'Super Admin'}
              </p>
              <p className="mt-1 truncate text-[11px] text-[#c8b391]">
                {user?.email}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#8f8171]">
                {user?.role}
              </p>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-white/15 text-xs font-semibold text-white transition hover:bg-white hover:text-[#111]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="border-b border-[#e7ddd1] bg-[#f8f5f0]/90 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a18158]">
              Super Admin Console
            </p>
            <h1 className="mt-1 font-serif text-2xl text-[#171717]">
              Super Admin
            </h1>
          </header>

          <div className="p-5">{children}</div>
        </section>
      </div>
    </main>
  );
}
