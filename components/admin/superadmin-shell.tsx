'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

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

function isActive(pathname: string, href: string) {
  if (href === '/superadmin') return pathname === '/superadmin';
  if (href === '/admin') return false;
  return pathname.startsWith(href);
}

function Wordmark() {
  return (
    <span className="flex flex-col items-center leading-none">
      <span className="font-oswald text-[26px] font-bold uppercase tracking-[0.2em] text-[#11162B]">
        Kovenik
      </span>
      <span className="mt-2 rounded-full bg-[#4338CA] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-white">
        Super Admin
      </span>
    </span>
  );
}

function Avatar({ name, className }: { name?: string; className?: string }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-[#11162B] text-sm font-bold text-white',
        className
      )}
    >
      {(name?.charAt(0) || 'S').toUpperCase()}
    </span>
  );
}

function NavList({ pathname }: { pathname: string }) {
  return (
    <nav className="space-y-1" aria-label="Super admin navigation">
      {superAdminLinks.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-3.5 rounded-lg px-4 py-3 text-[15px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#4338CA]',
              active
                ? 'bg-[#E6E5FA] text-[#2E2699]'
                : 'text-[#5A6075] hover:bg-[#F5F6FA] hover:text-[#11162B]'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
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

  const title =
    superAdminLinks.find((l) => isActive(pathname, l.href))?.label ?? 'Dashboard';

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const account = (
    <div className="border-t border-[#E3E5EE] p-3">
      <div className="flex items-center gap-3 rounded-lg p-2">
        <Avatar name={user?.fullName} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-[#11162B]">
            {user?.fullName || 'Super Admin'}
          </p>
          <p className="truncate text-[12px] text-[#5A6075]">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          aria-label="Log out"
          title="Log out"
          className="rounded-md p-2 text-[#5A6075] outline-none transition hover:bg-[#F5F6FA] hover:text-[#11162B] focus-visible:ring-2 focus-visible:ring-[#4338CA]"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F5F6FA] font-sans text-[#11162B]">
      <div className="min-h-screen lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-[#E3E5EE] bg-white lg:flex">
          <Link
            href="/superadmin"
            aria-label="Kovenik Super Admin home"
            className="flex h-[84px] items-center justify-center border-b border-[#E3E5EE] outline-none focus-visible:ring-2 focus-visible:ring-[#4338CA]"
          >
            <Wordmark />
          </Link>
          <div className="flex-1 overflow-y-auto px-3 py-5">
            <NavList pathname={pathname} />
          </div>
          {account}
        </aside>

        <div className="flex min-w-0 flex-col">
          {/* Mobile header */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#E3E5EE] bg-white px-4 lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[#11162B] outline-none transition hover:bg-[#F5F6FA] focus-visible:ring-2 focus-visible:ring-[#4338CA]"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-[17px] font-bold text-[#11162B]">{title}</h2>
            <Avatar name={user?.fullName} className="h-10 w-10" />
          </header>

          {/* Desktop header (same as Admin) */}
          <header className="sticky top-0 z-40 hidden h-[72px] items-center justify-between gap-6 border-b border-[#E3E5EE] bg-white px-8 lg:flex">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[14px] text-[#5A6075]">
              <Link href="/superadmin" className="hover:text-[#11162B]">
                Super Admin
              </Link>
              <span aria-hidden>/</span>
              <span className="font-semibold text-[#11162B]">{title}</span>
            </nav>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-lg border border-[#E3E5EE] px-3 py-2 text-[14px] font-medium text-[#11162B] xl:flex">
                <CalendarDays className="h-4 w-4 text-[#4338CA]" />
                {today}
              </span>
              <span className="flex items-center gap-2.5 py-1 pl-1 pr-2">
                <Avatar name={user?.fullName} className="h-10 w-10" />
                <span className="max-w-[160px] truncate text-[14px] font-semibold text-[#11162B]">
                  {user?.fullName || 'Super Admin'}
                </span>
              </span>
            </div>
          </header>

          <div className="min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-6 md:pt-8 lg:px-8">
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
          className={cn('absolute inset-0 bg-[#11162B]/60 transition-opacity duration-300', drawerOpen ? 'opacity-100' : 'opacity-0')}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={cn(
            'absolute inset-y-0 left-0 flex h-full w-[300px] max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out',
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-[84px] items-center justify-between border-b border-[#E3E5EE] px-5">
            <Wordmark />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#E3E5EE] text-[#11162B] transition hover:bg-[#F5F6FA]"
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
