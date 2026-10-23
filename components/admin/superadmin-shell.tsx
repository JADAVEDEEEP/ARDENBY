'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, LogOut, Menu, ShieldCheck, Users, X } from 'lucide-react';

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
  { href: '/admin', label: 'Common Admin', icon: ShieldCheck },
];

function Wordmark() {
  return (
    <span className="flex flex-col items-center leading-none">
      <span className="font-serif text-[24px] uppercase tracking-[0.2em] text-[#F4F0E6]">
        Kovenik
      </span>
      <span className="mt-2 text-[9px] font-semibold uppercase tracking-[0.5em] text-[#B89A5A]">
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
              'group relative flex items-center gap-3.5 rounded-lg px-4 py-3 text-[13px] font-medium tracking-wide outline-none transition-colors focus-visible:ring-1 focus-visible:ring-[#C8A96B]',
              active
                ? 'bg-[#373530]/70 text-[#F4F0E6]'
                : 'text-[#C8C0AD] hover:bg-[#2A2824]/70 hover:text-[#F4F0E6]'
            )}
          >
            <span
              className={cn(
                'absolute inset-y-2 left-0 w-[3px] rounded-r bg-[#B89A5A] transition-opacity',
                active ? 'opacity-100' : 'opacity-0'
              )}
            />
            <Icon
              className={cn(
                'h-[18px] w-[18px] shrink-0',
                active ? 'text-[#C8A96B]' : 'text-[#A19B8C] group-hover:text-[#C8A96B]'
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
    <div className="border-t border-[#B89A5A]/20 p-4">
      <p className="truncate text-[13px] font-medium text-[#F4F0E6]">
        {user?.fullName || 'Super Admin'}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-[#A19B8C]">{user?.email}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[#B89A5A]">
        {user?.role}
      </p>
      <button
        type="button"
        onClick={signOut}
        className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#B89A5A]/30 text-xs font-semibold text-[#EAE4D5] outline-none transition hover:bg-[#2A2824] focus-visible:ring-1 focus-visible:ring-[#C8A96B]"
      >
        <LogOut className="h-4 w-4 text-[#B89A5A]" />
        Logout
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#131210] text-[#F4F0E6]">
      <div className="min-h-screen lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-[#B89A5A]/20 bg-gradient-to-b from-[#131210] to-[#1C1B18] lg:flex">
          <Link
            href="/superadmin"
            aria-label="Kovenik Super Admin home"
            className="flex h-[88px] items-center justify-center border-b border-[#B89A5A]/20"
          >
            <Wordmark />
          </Link>
          <div className="flex-1 overflow-y-auto px-3 py-5">
            <NavList pathname={pathname} />
          </div>
          {account}
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-[#B89A5A]/20 bg-[#131210]/90 px-4 backdrop-blur sm:px-6 lg:h-[72px] lg:px-8">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#EAE4D5] outline-none transition hover:bg-[#2A2824] focus-visible:ring-1 focus-visible:ring-[#C8A96B] lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#B89A5A]">
                Super Admin Console
              </p>
              <h1 className="truncate font-serif text-xl text-[#F4F0E6] lg:text-2xl">{title}</h1>
            </div>
          </header>

          <div className="min-w-0 flex-1 bg-[radial-gradient(ellipse_at_top_right,rgba(30,28,24,0.55),transparent_60%)] px-4 pb-10 pt-5 sm:px-6 md:pt-8 lg:px-8">
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
            'absolute inset-y-0 left-0 flex h-full w-[300px] max-w-[85vw] flex-col border-r border-[#B89A5A]/30 bg-gradient-to-b from-[#1C1B18] to-[#131210] shadow-2xl transition-transform duration-300 ease-out',
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-[88px] items-center justify-between border-b border-[#B89A5A]/20 px-5">
            <Wordmark />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#B89A5A]/30 text-[#C8A96B] transition hover:bg-[#2A2824]"
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
