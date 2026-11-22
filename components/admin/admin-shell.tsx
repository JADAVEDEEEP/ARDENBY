'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import {
  BadgeCheck,
  BadgePercent,
  Bell,
  BarChart3,
  Boxes,
  CalendarDays,
  ChevronDown,
  Download,
  FolderTree,
  History,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  PackageCheck,
  PackageX,
  Settings,
  ShieldCheck,
  Star,
  UserCog,
  Warehouse,
  X,
} from 'lucide-react';

import { AdminUser, adminApiRequest } from '@/components/admin/admin-auth';
import {
  AccessDenied,
  AdminChecking,
  AdminUnreachable,
} from '@/components/admin/access-screens';
import { useAdminAccess } from '@/components/admin/use-admin-access';
import { cn } from '@/lib/utils';

type NavChild = { href: string; label: string; exact?: boolean };

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Shown under the item while the visitor is inside that section. */
  children?: NavChild[];
};

const newsletterChildren: NavChild[] = [
  { href: '/admin/newsletter', label: 'Overview', exact: true },
  { href: '/admin/newsletter/subscribers', label: 'Subscribers' },
  { href: '/admin/newsletter/campaigns', label: 'Campaigns' },
  { href: '/admin/newsletter/templates', label: 'Email Templates' },
  { href: '/admin/newsletter/analytics', label: 'Campaign Analytics' },
];

// Customers (Super Admin only) is intentionally not listed. Reviews, Returns,
// Stock history, Exports and Security are listed; the backend decides what each
// role may do on them.
const adminLinks: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/orders', label: 'Orders', icon: PackageCheck },
  { href: '/admin/products', label: 'Products', icon: Boxes },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/images', label: 'Product images', icon: ImageIcon },
  { href: '/admin/membership', label: 'Membership', icon: BadgeCheck },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/admin/inventory/history', label: 'Stock history', icon: History },
  { href: '/admin/coupons', label: 'Coupons', icon: BadgePercent },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/returns', label: 'Returns', icon: PackageX },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail, children: newsletterChildren },
  { href: '/admin/exports', label: 'Exports', icon: Download },
  { href: '/admin/security', label: 'Security', icon: ShieldCheck },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const bottomLinks = ['/admin', '/admin/orders', '/admin/analytics'];

type Alert = { type: string; title: string; href: string };

function isActive(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

function isChildActive(pathname: string, child: NavChild) {
  return child.exact ? pathname === child.href : pathname.startsWith(child.href);
}

function pageTitle(pathname: string) {
  const item = adminLinks.find((l) => isActive(pathname, l.href));
  const child = item?.children?.find((c) => isChildActive(pathname, c));
  return child ? `${item?.label} · ${child.label}` : item?.label ?? 'Admin';
}

function Wordmark({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  return (
    <span className="flex flex-col items-center leading-none">
      <span
        className={cn(
          'font-oswald font-bold uppercase text-[#11162B]',
          size === 'lg' ? 'text-[26px] tracking-[0.2em]' : 'text-[20px] tracking-[0.18em]'
        )}
      >
        Kovenik
      </span>
      <span
        className={cn(
          'rounded-full bg-[#E6E5FA] px-2.5 py-1 font-semibold uppercase text-[#2E2699]',
          size === 'lg' ? 'mt-2 text-[12px] tracking-[0.5em]' : 'mt-1 text-[9px] tracking-[0.45em]'
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
        'flex shrink-0 items-center justify-center rounded-full bg-[#11162B] text-[15px] font-bold text-white',
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
        const open = Boolean(item.children) && active;
        // With sub-pages, the parent row is only "current" when none of its children is.
        const childCurrent = open && item.children!.some((c) => isChildActive(pathname, c));
        const highlighted = active && !childCurrent;
        return (
          <div key={item.href}>
            <Link
              href={item.href}
              title={item.label}
              aria-current={highlighted ? 'page' : undefined}
              aria-expanded={item.children ? open : undefined}
              className={cn(
                'group relative flex items-center gap-3.5 rounded-lg px-4 py-3 text-[15px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#4338CA] md:justify-center md:px-0 lg:justify-start lg:px-4',
                highlighted
                  ? 'bg-[#E6E5FA] text-[#2E2699]'
                  : active
                    ? 'bg-[#E6E5FA]/60 text-[#2E2699]'
                    : 'text-[#5A6075] hover:bg-[#F5F6FA] hover:text-[#11162B]'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="md:hidden lg:inline">{item.label}</span>
              {item.children && (
                <ChevronDown
                  aria-hidden="true"
                  className={cn('ml-auto h-4 w-4 transition-transform md:hidden lg:block', open && 'rotate-180')}
                />
              )}
            </Link>
            {open && (
              <ul className="mt-1 space-y-0.5 md:hidden lg:block" aria-label={`${item.label} sections`}>
                {item.children!.map((child) => {
                  const here = isChildActive(pathname, child);
                  return (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        aria-current={here ? 'page' : undefined}
                        className={cn(
                          'ml-6 flex items-center gap-2 rounded-md border-l border-[#E3E5EE] py-2 pl-4 pr-3 text-[15px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#4338CA]',
                          here ? 'bg-[#E6E5FA] font-semibold text-[#2E2699]' : 'text-[#5A6075] hover:bg-[#F5F6FA] hover:text-[#11162B]'
                        )}
                      >
                        {child.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);
  return ref;
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
  const ref = useDismiss(open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 outline-none transition hover:bg-[#F5F6FA] focus-visible:ring-2 focus-visible:ring-[#4338CA]"
      >
        <Avatar user={user} className="h-10 w-10" />
        {!compactName && (
          <>
            <span className="hidden max-w-[140px] truncate text-[15px] font-semibold text-[#11162B] lg:block">
              {user?.fullName || 'Admin'}
            </span>
            <ChevronDown
              className={cn('hidden h-4 w-4 text-[#5A6075] transition-transform lg:block', open && 'rotate-180')}
            />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[#E3E5EE] bg-white shadow-[0_12px_32px_rgba(16,24,40,0.14)]"
        >
          <div className="border-b border-[#E3E5EE] px-4 py-3">
            <p className="truncate text-[15px] font-semibold text-[#11162B]">{user?.fullName || 'Admin'}</p>
            <p className="truncate text-[14px] text-[#5A6075]">{user?.email || ''}</p>
          </div>
          <Link
            href="/admin/settings?tab=account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[15px] text-[#11162B] transition hover:bg-[#F5F6FA]"
          >
            <UserCog className="h-4 w-4 text-[#5A6075]" />
            Profile &amp; security
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[15px] text-[#11162B] transition hover:bg-[#F5F6FA]"
          >
            <LogOut className="h-4 w-4 text-[#4338CA]" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

// Alerts are derived live from orders / products on the server and filtered by
// the notification preferences saved in Settings. Nothing is invented here.
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [failed, setFailed] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));

  const load = useCallback(async () => {
    try {
      const res = await adminApiRequest<{ alerts?: Alert[] }>('/api/admin/alerts');
      setAlerts(res.alerts ?? []);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const count = alerts?.length ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void load();
        }}
        aria-label={count ? `Notifications, ${count} alerts` : 'Notifications'}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E3E5EE] bg-white text-[#11162B] outline-none transition hover:border-[#11162B] focus-visible:ring-2 focus-visible:ring-[#4338CA]"
      >
        <Bell className="h-[18px] w-[18px]" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#4338CA] px-1 text-[12px] font-bold text-white">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-[#E3E5EE] bg-white p-2 shadow-[0_12px_32px_rgba(16,24,40,0.14)]">
          <p className="px-3 py-2 text-[13px] font-semibold uppercase tracking-wider text-[#5A6075]">
            Alerts
          </p>
          {failed && <p className="px-3 pb-3 text-[15px] text-[#9A2C1F]">Could not load alerts.</p>}
          {!failed && alerts && alerts.length === 0 && (
            <p className="px-3 pb-3 text-[15px] text-[#5A6075]">You&apos;re all caught up.</p>
          )}
          {!failed &&
            alerts?.map((a) => (
              <Link
                key={a.type}
                href={a.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-[#11162B] transition hover:bg-[#F5F6FA]"
              >
                {a.title}
              </Link>
            ))}
          <Link
            href="/admin/settings?tab=notifications"
            onClick={() => setOpen(false)}
            className="mt-1 block border-t border-[#E3E5EE] px-3 py-2.5 text-[14px] font-semibold text-[#4338CA]"
          >
            Notification preferences
          </Link>
        </div>
      )}
    </div>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-[#F5F6FA] font-sans text-[#11162B]">{children}</main>;
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
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const title = pageTitle(pathname);

  const bottomItems = adminLinks.filter((l) => bottomLinks.includes(l.href));

  return (
    <Frame>
      <div className="min-h-screen md:grid md:grid-cols-[76px_minmax(0,1fr)] lg:grid-cols-[264px_minmax(0,1fr)]">
        {/* Desktop / tablet sidebar */}
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-[#E3E5EE] bg-white md:flex">
          <Link
            href="/admin"
            aria-label="KOVENIK Admin home"
            className="flex h-[84px] items-center justify-center border-b border-[#E3E5EE] outline-none focus-visible:ring-2 focus-visible:ring-[#4338CA]"
          >
            <span className="font-oswald text-2xl font-bold tracking-widest text-[#11162B] lg:hidden">K</span>
            <span className="hidden lg:block">
              <Wordmark />
            </span>
          </Link>

          <div className="flex-1 overflow-y-auto px-2 py-5 lg:px-3">
            <NavList pathname={pathname} />
          </div>

          <div className="border-t border-[#E3E5EE] p-3">
            <div className="flex items-center gap-3 rounded-lg p-2 md:justify-center lg:justify-start">
              <Avatar user={user} className="h-10 w-10 !text-white" />
              <div className="min-w-0 flex-1 md:hidden lg:block">
                <p className="truncate text-[15px] font-semibold text-[#11162B]">{user?.fullName || 'Admin'}</p>
                <p className="truncate text-[13px] text-[#5A6075]">{user?.email || 'Administrator'}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
                className="hidden rounded-md p-2 text-[#5A6075] outline-none transition hover:bg-[#F5F6FA] hover:text-[#11162B] focus-visible:ring-2 focus-visible:ring-[#4338CA] lg:block"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-col">
          {/* Mobile header */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#E3E5EE] bg-white px-4 md:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[#11162B] outline-none transition hover:bg-[#F5F6FA] focus-visible:ring-2 focus-visible:ring-[#4338CA]"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-[17px] font-bold text-[#11162B]">{title}</h2>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <ProfileMenu user={user} onLogout={handleLogout} compactName />
            </div>
          </header>

          {/* Desktop / tablet header */}
          <header className="sticky top-0 z-40 hidden h-[72px] items-center justify-between gap-6 border-b border-[#E3E5EE] bg-white px-6 md:flex lg:px-8">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[15px] text-[#5A6075]">
              <Link href="/admin" className="hover:text-[#11162B]">
                Admin
              </Link>
              <span aria-hidden>/</span>
              <span className="font-semibold text-[#11162B]">{title}</span>
            </nav>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-lg border border-[#E3E5EE] px-3 py-2 text-[14px] font-medium text-[#11162B] xl:flex">
                <CalendarDays className="h-4 w-4 text-[#4338CA]" />
                {today}
              </span>
              <NotificationBell />
              <ProfileMenu user={user} onLogout={handleLogout} />
            </div>
          </header>

          <div className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-10 md:pt-8 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[#E3E5EE] bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
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
                'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 text-[13px] font-semibold transition-colors',
                active ? 'text-[#4338CA]' : 'text-[#5A6075]'
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
          className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 text-[13px] font-semibold text-[#5A6075]"
        >
          <Menu className="h-5 w-5" />
          More
        </button>
      </nav>

      {/* Mobile drawer */}
      <div
        className={cn('fixed inset-0 z-50 md:hidden', drawerOpen ? 'pointer-events-auto' : 'pointer-events-none')}
        aria-hidden={!drawerOpen}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          className={cn(
            'absolute inset-0 bg-black/60 transition-opacity duration-300',
            drawerOpen ? 'opacity-100' : 'opacity-0'
          )}
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
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#E3E5EE] text-[#11162B] outline-none transition hover:bg-[#F5F6FA] focus-visible:ring-2 focus-visible:ring-[#4338CA]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-5">
            <NavList pathname={pathname} />
          </div>

          <div className="border-t border-[#E3E5EE] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center gap-3">
              <Avatar user={user} className="h-10 w-10 !text-white" />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-[#11162B]">{user?.fullName || 'Admin'}</p>
                <p className="truncate text-[13px] text-[#5A6075]">{user?.email || 'Administrator'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#E3E5EE] text-[15px] font-semibold text-[#11162B] transition hover:bg-[#F5F6FA]"
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
