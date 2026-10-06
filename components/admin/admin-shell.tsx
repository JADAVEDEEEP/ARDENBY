'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  BadgePercent,
  Boxes,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  X,
} from 'lucide-react';

import {
  AdminUser,
  clearAdminToken,
  getAdminToken,
  getCurrentAdmin,
  isAdminRole,
} from '@/components/admin/admin-auth';
import { cn } from '@/lib/utils';

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Boxes },
  { href: '/admin/orders', label: 'Orders', icon: PackageCheck },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/coupons', label: 'Coupons', icon: BadgePercent },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<'checking' | 'allowed' | 'blocked'>(
    'checking'
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginRoute = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginRoute) {
      setStatus('allowed');
      return;
    }

    let cancelled = false;

    async function verifyAdmin() {
      const token = getAdminToken();

      if (!token) {
        router.replace('/admin/login');
        return;
      }

      try {
        const currentUser = await getCurrentAdmin();

        if (!isAdminRole(currentUser.role)) {
          clearAdminToken();
          router.replace('/admin/login');
          return;
        }

        if (!cancelled) {
          setUser(currentUser);
          setStatus('allowed');
        }
      } catch {
        clearAdminToken();
        router.replace('/admin/login');
      }
    }

    setStatus('checking');
    void verifyAdmin();

    return () => {
      cancelled = true;
    };
  }, [isLoginRoute, pathname, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const title = useMemo(() => {
    const activeLink = adminLinks
      .slice()
      .reverse()
      .find((link) =>
        link.href === '/admin'
          ? pathname === '/admin'
          : pathname.startsWith(link.href)
      );

    return activeLink?.label || 'Admin';
  }, [pathname]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (status !== 'allowed') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-[#F4EEDD]">
        <div className="text-center">
          <p className="font-serif text-2xl uppercase tracking-[0.3em] text-[#C9A24B]">
            KÖVENIK
          </p>
          <p className="mt-3 text-sm text-[#8F8878]">Checking admin access...</p>
        </div>
      </main>
    );
  }

  const handleLogout = () => {
    clearAdminToken();
    setUser(null);
    router.replace('/admin/login');
  };

  const sidebarContent = (
    <div className="flex h-full min-h-screen flex-col justify-between bg-gradient-to-b from-[#0A0908] via-[#080807] to-[#050505] p-6 text-[#F4EEDD]">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-[#C9A24B]/25 pb-7">
          <Link
            href="/admin"
            className="group flex flex-col items-center outline-none focus-visible:ring-1 focus-visible:ring-[#E3C673]"
          >
            <span className="font-serif text-[26px] uppercase leading-none tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-b from-[#F4E3B0] via-[#C9A24B] to-[#8E6F2A] transition-opacity group-hover:opacity-90">
              KÖVENIK
            </span>
            <span className="mt-2 block text-[9px] font-semibold uppercase tracking-[0.42em] text-[#C9A24B]">
              Luxury Admin
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="rounded-xl border border-[#C9A24B]/30 p-2 text-[#E8D3A0] outline-none transition-colors hover:bg-[#C9A24B]/10 hover:text-white focus-visible:ring-1 focus-visible:ring-[#E3C673] lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="mt-7 space-y-2">
          {adminLinks.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3.5 rounded-xl border px-4 py-3 text-[13px] font-medium outline-none transition-all duration-200 focus-visible:ring-1 focus-visible:ring-[#E3C673]',
                  active
                    ? 'border-[#C9A24B]/70 bg-gradient-to-r from-[#C9A24B]/20 via-[#12100D] to-[#0D0F0F] text-[#F4EEDD] shadow-[0_0_18px_rgba(201,162,75,0.22)]'
                    : 'border-transparent text-[#8F8878] hover:border-[#C9A24B]/25 hover:bg-[#C9A24B]/[0.05] hover:text-[#F4EEDD]'
                )}
              >
                <Icon
                  className={cn(
                    'h-[18px] w-[18px] transition-colors',
                    active
                      ? 'text-[#E3C673]'
                      : 'text-[#6f6858] group-hover:text-[#C9A24B]'
                  )}
                />
                <span className="tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Logout Box */}
      <div className="border-t border-[#C9A24B]/25 pt-6">
        <div className="rounded-2xl border border-[#C9A24B]/30 bg-gradient-to-br from-[#12100D] to-[#0A0908] p-4 shadow-[0_0_20px_rgba(201,162,75,0.08)]">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E8D3A0] to-[#B8903A] text-sm font-bold text-[#0A0908]">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold tracking-wide text-[#F4EEDD]">
                {user?.fullName || 'Admin User'}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-[#8F8878]">
                {user?.email || 'admin@ardenby.com'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-[#C9A24B]/40 bg-[#C9A24B]/[0.06] text-xs font-semibold text-[#E8D3A0] outline-none transition hover:bg-[#C9A24B] hover:text-[#0A0908] focus-visible:ring-1 focus-visible:ring-[#E3C673]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout System
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-[#F4EEDD]">
      <div className="grid min-h-screen lg:grid-cols-[272px_1fr]">
        {/* Desktop Sidebar */}
        <aside className="hidden border-r border-[#C9A24B]/30 bg-[#080807] shadow-[8px_0_40px_rgba(0,0,0,0.6)] lg:block">
          {sidebarContent}
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sliding Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] overflow-y-auto border-r border-[#C9A24B]/30 bg-[#080807] shadow-2xl transition-transform duration-300 ease-in-out lg:hidden',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {sidebarContent}
        </aside>

        {/* Main Section */}
        <section className="flex min-w-0 flex-col bg-[radial-gradient(ellipse_at_top_right,rgba(201,162,75,0.07),transparent_55%)]">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#C9A24B]/25 bg-[#050505]/90 px-4 py-3.5 backdrop-blur-md sm:px-6 sm:py-4">
            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#C9A24B]/40 bg-[#0D0F0F] text-[#E8D3A0] outline-none transition hover:bg-[#C9A24B]/10 focus-visible:ring-1 focus-visible:ring-[#E3C673] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile brand */}
            <div className="flex flex-col items-center lg:hidden">
              <span className="font-serif text-lg uppercase leading-none tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-b from-[#F4E3B0] via-[#C9A24B] to-[#8E6F2A]">
                KÖVENIK
              </span>
              <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.4em] text-[#C9A24B]">
                Luxury Admin
              </span>
            </div>

            {/* Desktop title */}
            <div className="hidden lg:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C9A24B]">
                Admin Console
              </p>
              <h1 className="mt-0.5 font-serif text-3xl font-semibold tracking-tight text-[#F4EEDD]">
                {title}
              </h1>
            </div>

            {/* Profile chip */}
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-[160px] truncate text-xs font-semibold text-[#F4EEDD]">
                  {user?.fullName || 'Admin User'}
                </p>
                <p className="text-[10px] text-[#8F8878]">Admin</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E8D3A0] to-[#B8903A] text-sm font-bold text-[#0A0908] shadow-[0_0_14px_rgba(201,162,75,0.35)]">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
            </div>
          </header>

          {/* Mobile page title */}
          <div className="border-b border-[#C9A24B]/15 px-4 pb-3 pt-4 lg:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C9A24B]">
              Admin Console
            </p>
            <h1 className="mt-0.5 font-serif text-2xl font-semibold tracking-tight text-[#F4EEDD]">
              {title}
            </h1>
          </div>

          <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
        </section>
      </div>
    </main>
  );
}