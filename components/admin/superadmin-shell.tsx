'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Landmark, LayoutDashboard, LogOut, Menu, ScrollText, ShieldCheck, Users, X } from 'lucide-react';

import {
  AccessDenied,
  AdminChecking,
  AdminUnreachable,
} from '@/components/admin/access-screens';
import { useAdminAccess } from '@/components/admin/use-admin-access';
import { cn } from '@/lib/utils';

const superAdminLinks = [
  { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/superadmin/users', label: 'User Management', icon: Users },
  { href: '/superadmin/finance', label: 'Financial report', icon: Landmark },
  { href: '/superadmin/audit', label: 'Audit log', icon: ScrollText },
  { href: '/admin', label: 'Common Admin', icon: ShieldCheck },
];

function Wordmark() {
  return (
    <span className="flex flex-col items-center leading-none">
      <span className="font-serif text-[24px] uppercase tracking-[0.2em] text-[#F7F7F7]">
        Kovenik
      </span>
      <span className="mt-2 text-[9px] font-semibold uppercase tracking-[0.5em] text-[#E53935]">
        Super Admin
      </span>
    </span>
  );
}

function NavList({ pathname }: { pathname: string }) {
  return (
    <nav className="space-y-1" aria-label="Super admin navigation">
      {superAdminLinks.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === '/superadmin'
            ? pathname === '/superadmin'
            : item.href === '/admin'
              ? false
              : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-3.5 rounded-lg px-4 py-3 text-[13px] font-medium tracking-wide outline-none transition-colors focus-visible:ring-1 focus-visible:ring-[#E53935]',
              active
                ? 'bg-[#343434]/70 text-[#F7F7F7]'
                : 'text-[#BBBBBB] hover:bg-[#272727]/70 hover:text-[#F7F7F7]'
            )}
          >
            <span
              className={cn(
                'absolute inset-y-2 left-0 w-[3px] rounded-r bg-[#E53935] transition-opacity',
                active ? 'opacity-100' : 'opacity-0'
              )}
            />
            <Icon
              className={cn(
                'h-[18px] w-[18px] shrink-0',
                active ? 'text-[#E53935]' : 'text-[#979797] group-hover:text-[#E53935]'
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // A plain admin is sent to /admin; a customer sees the 403 screen. The API
  // re-checks the superadmin role on every request.
  const { status, user, retry, signOut } = useAdminAccess('superadmin');

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', esc);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', esc);
    };
  }, [drawerOpen]);

  if (status === 'denied') return <AccessDenied onSwitchAccount={signOut} />;
  if (status === 'retry') return <AdminUnreachable onRetry={retry} />;
  if (status !== 'allowed') return <AdminChecking label="Checking super admin access…" />;

  const title = pathname.startsWith('/superadmin/users') ? 'User Management' : 'Dashboard';

  const account = (
    <div className="border-t border-[#E53935]/20 p-4">
      <p className="truncate text-[13px] font-medium text-[#F7F7F7]">
        {user?.fullName || 'Super Admin'}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-[#979797]">{user?.email}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[#E53935]">
        {user?.role}
      </p>
      <button
        type="button"
        onClick={signOut}
        className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#E53935]/30 text-xs font-semibold text-[#E5E5E5] outline-none transition hover:bg-[#272727] focus-visible:ring-1 focus-visible:ring-[#E53935]"
      >
        <LogOut className="h-4 w-4 text-[#E53935]" />
        Logout
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#111111] text-[#F7F7F7]">
      <div className="min-h-screen lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-[#E53935]/20 bg-gradient-to-b from-[#111111] to-[#1A1A1A] lg:flex">
          <Link
            href="/superadmin"
            aria-label="Kovenik Super Admin home"
            className="flex h-[88px] items-center justify-center border-b border-[#E53935]/20"
          >
            <Wordmark />
          </Link>
          <div className="flex-1 overflow-y-auto px-3 py-5">
            <NavList pathname={pathname} />
          </div>
          {account}
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-[#E53935]/20 bg-[#111111]/90 px-4 backdrop-blur sm:px-6 lg:h-[72px] lg:px-8">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#E5E5E5] outline-none transition hover:bg-[#272727] focus-visible:ring-1 focus-visible:ring-[#E53935] lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#E53935]">
                Super Admin Console
              </p>
              <h1 className="truncate font-serif text-xl text-[#F7F7F7] lg:text-2xl">{title}</h1>
            </div>
          </header>

          <div className="min-w-0 flex-1 bg-[radial-gradient(ellipse_at_top_right,rgba(27, 27, 27,0.55),transparent_60%)] px-4 pb-10 pt-5 sm:px-6 md:pt-8 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </div>
        </div>
      </div>

      <div
        className={cn('fixed inset-0 z-50 lg:hidden', drawerOpen ? 'pointer-events-auto' : 'pointer-events-none')}
        aria-hidden={!drawerOpen}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          className={cn('absolute inset-0 bg-black/70 transition-opacity duration-300', drawerOpen ? 'opacity-100' : 'opacity-0')}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={cn(
            'absolute inset-y-0 left-0 flex h-full w-[300px] max-w-[85vw] flex-col border-r border-[#E53935]/30 bg-gradient-to-b from-[#1A1A1A] to-[#111111] shadow-2xl transition-transform duration-300 ease-out',
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-[88px] items-center justify-between border-b border-[#E53935]/20 px-5">
            <Wordmark />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E53935]/30 text-[#E53935] transition hover:bg-[#272727]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-5">
            <NavList pathname={pathname} />
          </div>
          {account}
        </aside>
      </div>
    </main>
  );
}
