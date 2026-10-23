'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import {
  BadgePercent,
  Bell,
  BarChart3,
  Boxes,
  CalendarDays,
  ChevronDown,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  Search,
  Settings,
  Star,
  Users,
  Warehouse,
  X,
} from 'lucide-react';

import { AdminUser } from '@/components/admin/admin-auth';
import {
  AccessDenied,
  AdminChecking,
  AdminUnreachable,
} from '@/components/admin/access-screens';
import { useAdminAccess } from '@/components/admin/use-admin-access';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /**
   * Routes that do not exist in the app yet are rendered as disabled
   * ("Soon") so nothing 404s. Set to false/remove once the page exists.
   */
  soon?: boolean;
};

const adminLinks: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, soon: true },
  { href: '/admin/orders', label: 'Orders', icon: PackageCheck },
  { href: '/admin/products', label: 'Products', icon: Boxes },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/customers', label: 'Customers', icon: Users, soon: true },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/admin/reviews', label: 'Reviews', icon: Star, soon: true },
  { href: '/admin/coupons', label: 'Coupons', icon: BadgePercent },
  { href: '/admin/settings', label: 'Settings', icon: Settings, soon: true },
];

const bottomLinks = ['/admin', '/admin/orders', '/admin/products'];

function isActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

function Wordmark({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  return (
    <span className="flex flex-col items-center leading-none">
      <span
        className={cn(
          'font-serif uppercase text-[#F4F0E6]',
          size === 'lg' ? 'text-[24px] tracking-[0.2em]' : 'text-[18px] tracking-[0.18em]'
        )}
      >
        Kovenik
      </span>
      <span
        className={cn(
          'font-semibold uppercase text-[#B89A5A]',
          size === 'lg' ? 'mt-2 text-[9px] tracking-[0.5em]' : 'mt-1 text-[8px] tracking-[0.45em]'
        )}
      >
        Admin
      </span>
    </span>
  );
}

function Avatar({ user, className }: { user: AdminUser | null; className?: string }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border border-[#B89A5A]/60 bg-[#2A2824] font-serif text-sm text-[#C8A96B]',
        className
      )}
    >
      {(user?.fullName?.charAt(0) || 'A').toUpperCase()}
    </span>
  );
}

function NavList({ pathname }: { pathname: string }) {
  return (
    <nav className="space-y-1" aria-label="Admin navigation">
      {adminLinks.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);

        const inner = (
          <>
            <span
              className={cn(
                'absolute inset-y-2 left-0 w-[3px] rounded-r bg-[#B89A5A] transition-opacity',
                active ? 'opacity-100' : 'opacity-0'
              )}
            />
            <Icon
              className={cn(
                'h-[18px] w-[18px] shrink-0 transition-colors',
                active ? 'text-[#C8A96B]' : 'text-[#A19B8C] group-hover:text-[#C8A96B]'
              )}
            />
            <span className="tracking-wide md:hidden lg:inline">{item.label}</span>
            {item.soon && (
              <span className="ml-auto rounded border border-[#B89A5A]/30 px-1.5 py-px text-[8px] font-semibold uppercase tracking-widest text-[#B89A5A]/80 md:hidden lg:inline">
                Soon
              </span>
            )}
          </>
        );

        const base =
          'group relative flex items-center gap-3.5 rounded-lg px-4 py-3 text-[13px] font-medium outline-none transition-colors md:justify-center md:px-0 lg:justify-start lg:px-4';

        if (item.soon) {
          return (
            <span
              key={item.href}
              title={`${item.label} — coming soon`}
              aria-disabled="true"
              className={cn(base, 'cursor-not-allowed text-[#827D71]/70')}
            >
              {inner}
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              base,
              'focus-visible:ring-1 focus-visible:ring-[#C8A96B]',
              active
                ? 'bg-[#373530]/70 text-[#F4F0E6]'
                : 'text-[#C8C0AD] hover:bg-[#2A2824]/70 hover:text-[#F4F0E6]'
            )}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}

function ProfileMenu({
  user,
  onLogout,
  compactName,
}: {
  user: AdminUser | null;
  onLogout: () => void;
  compactName?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 outline-none transition hover:bg-[#2A2824]/70 focus-visible:ring-1 focus-visible:ring-[#C8A96B]"
      >
        <Avatar user={user} className="h-9 w-9" />
        {!compactName && (
          <>
            <span className="hidden max-w-[120px] truncate text-sm font-medium text-[#F4F0E6] lg:block">
              {user?.fullName || 'Admin'}
            </span>
            <ChevronDown
              className={cn(
                'hidden h-4 w-4 text-[#B89A5A] transition-transform lg:block',
                open && 'rotate-180'
              )}
            />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-[#B89A5A]/30 bg-[#1C1B18] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          <div className="border-b border-[#B89A5A]/20 px-4 py-3">
            <p className="truncate text-sm font-semibold text-[#F4F0E6]">
              {user?.fullName || 'Admin'}
            </p>
            <p className="truncate text-xs text-[#A19B8C]">{user?.email || ''}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-[#EAE4D5] transition hover:bg-[#2A2824]"
          >
            <LogOut className="h-4 w-4 text-[#B89A5A]" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#B89A5A]/25 text-[#EAE4D5] outline-none transition hover:border-[#B89A5A]/60 hover:text-[#C8A96B] focus-visible:ring-1 focus-visible:ring-[#C8A96B]"
      >
        <Bell className="h-[18px] w-[18px]" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-[#B89A5A]/30 bg-[#1C1B18] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B89A5A]">
            Notifications
          </p>
          <p className="mt-3 text-sm text-[#C8C0AD]">You&apos;re all caught up.</p>
        </div>
      )}
    </div>
  );
}

function CommandSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const match = adminLinks.find((l) => !l.soon && l.label.toLowerCase().includes(q));
    if (match) {
      router.push(match.href);
      setQuery('');
    }
  };

  return (
    <form onSubmit={submit} role="search" className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B89A5A]" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search anything… (e.g. orders, products)"
        className="h-10 w-full rounded-lg border border-[#B89A5A]/25 bg-[#1C1B18]/80 pl-10 pr-3 text-sm text-[#F4F0E6] placeholder:text-[#827D71] outline-none transition focus:border-[#B89A5A]/70"
      />
    </form>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#131210] text-[#F4F0E6]">{children}</main>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const isLoginRoute = pathname === '/admin/login';

  // Verifies the stored session with the server before anything is shown. The
  // API enforces the role again on every request; this only picks the screen.
  const { status, user, retry, signOut } = useAdminAccess('admin', !isLoginRoute);
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open
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

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (status === 'denied') {
    return <AccessDenied onSwitchAccount={signOut} />;
  }

  if (status === 'retry') {
    return <AdminUnreachable onRetry={retry} />;
  }

  if (status !== 'allowed') {
    return <AdminChecking />;
  }

  const handleLogout = signOut;
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const bottomItems = adminLinks.filter((l) => bottomLinks.includes(l.href));

  return (
    <Frame>
      <div className="min-h-screen md:grid md:grid-cols-[76px_minmax(0,1fr)] lg:grid-cols-[264px_minmax(0,1fr)]">
        {/* Desktop / tablet sidebar */}
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-[#B89A5A]/20 bg-gradient-to-b from-[#131210] to-[#1C1B18] md:flex">
          <Link
            href="/admin"
            aria-label="KOVENIK Admin home"
            className="flex h-[88px] items-center justify-center border-b border-[#B89A5A]/20 outline-none focus-visible:ring-1 focus-visible:ring-[#C8A96B]"
          >
            <span className="lg:hidden font-serif text-xl tracking-widest text-[#C8A96B]">K</span>
            <span className="hidden lg:block">
              <Wordmark />
            </span>
          </Link>

          <div className="flex-1 overflow-y-auto px-2 py-5 lg:px-3">
            <NavList pathname={pathname} />
          </div>

          <div className="border-t border-[#B89A5A]/20 p-3">
            <div className="flex items-center gap-3 rounded-lg p-2 md:justify-center lg:justify-start">
              <Avatar user={user} className="h-9 w-9" />
              <div className="min-w-0 flex-1 md:hidden lg:block">
                <p className="truncate text-[13px] font-medium text-[#F4F0E6]">
                  {user?.fullName || 'Admin'}
                </p>
                <p className="truncate text-[11px] text-[#A19B8C]">{user?.email || 'Administrator'}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
                className="hidden rounded-md p-1.5 text-[#B89A5A] outline-none transition hover:bg-[#2A2824] hover:text-[#C8A96B] focus-visible:ring-1 focus-visible:ring-[#C8A96B] lg:block"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-col">
          {/* Mobile header */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#B89A5A]/20 bg-[#131210]/95 px-4 backdrop-blur md:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#EAE4D5] outline-none transition hover:bg-[#2A2824] focus-visible:ring-1 focus-visible:ring-[#C8A96B]"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/admin" aria-label="KOVENIK Admin home">
              <Wordmark size="sm" />
            </Link>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <ProfileMenu user={user} onLogout={handleLogout} compactName />
            </div>
          </header>

          {/* Desktop / tablet header */}
          <header className="sticky top-0 z-40 hidden h-[72px] items-center justify-between gap-6 border-b border-[#B89A5A]/20 bg-[#131210]/90 px-6 backdrop-blur md:flex lg:px-8">
            <CommandSearch />
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-lg border border-[#B89A5A]/25 px-3 py-2 text-xs text-[#EAE4D5] xl:flex">
                <CalendarDays className="h-4 w-4 text-[#B89A5A]" />
                {today}
              </span>
              <NotificationBell />
              <ProfileMenu user={user} onLogout={handleLogout} />
            </div>
          </header>

          <div className="min-w-0 flex-1 bg-[radial-gradient(ellipse_at_top_right,rgba(30,28,24,0.55),transparent_60%)] px-4 pb-28 pt-5 sm:px-6 md:pb-10 md:pt-8 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[#B89A5A]/25 bg-[#131210]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                active ? 'text-[#C8A96B]' : 'text-[#A19B8C]'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-[#A19B8C]"
        >
          <Menu className="h-5 w-5" />
          More
        </button>
      </nav>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden',
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        aria-hidden={!drawerOpen}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          className={cn(
            'absolute inset-0 bg-black/70 transition-opacity duration-300',
            drawerOpen ? 'opacity-100' : 'opacity-0'
          )}
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
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#B89A5A]/30 text-[#C8A96B] outline-none transition hover:bg-[#2A2824] focus-visible:ring-1 focus-visible:ring-[#C8A96B]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-5">
            <NavList pathname={pathname} />
          </div>

          <div className="border-t border-[#B89A5A]/20 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center gap-3">
              <Avatar user={user} className="h-10 w-10" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#F4F0E6]">
                  {user?.fullName || 'Admin'}
                </p>
                <p className="truncate text-xs text-[#A19B8C]">{user?.email || 'Administrator'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#B89A5A]/40 text-sm font-medium text-[#C8A96B] transition hover:bg-[#B89A5A] hover:text-[#131210]"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </aside>
      </div>
    </Frame>
  );
}