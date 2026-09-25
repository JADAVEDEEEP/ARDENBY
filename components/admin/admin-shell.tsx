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
      <main className="flex min-h-screen items-center justify-center bg-[#F5F2EB] text-[#1a1a1a]">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#b89b72]">
            ARDENBY
          </p>
          <p className="mt-3 text-sm text-[#736a60]">Checking admin access...</p>
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
    <div className="flex h-full min-h-screen flex-col justify-between p-6 bg-[#0f1115] text-[#d4cfc4]">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-8 border-b border-white/[0.08]">
          <Link href="/admin" className="flex items-center gap-3.5 group">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c8b391] to-[#9a7d53] font-serif text-lg text-white shadow-md shadow-black/40 group-hover:scale-105 transition-transform">
              A
            </span>
            <div>
              <span className="block font-serif text-base tracking-[0.2em] text-white uppercase">
                Ardenby
              </span>
              <span className="block text-[9px] uppercase tracking-[0.3em] text-[#c8b391] font-semibold mt-0.5">
                Luxury Admin
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white lg:hidden transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 space-y-1.5">
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
                  'flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs font-medium transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-[#c8b391]/20 to-transparent text-white border-l-4 border-[#c8b391] shadow-inner'
                    : 'text-[#9e9689] hover:bg-white/[0.04] hover:text-white'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    active ? 'text-[#c8b391]' : 'text-[#827a6e]'
                  )}
                />
                <span className="tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Logout Box */}
      <div className="pt-6 border-t border-white/[0.08]">
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c8b391]/15 text-[#c8b391] font-bold text-xs border border-[#c8b391]/30">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white tracking-wide">
                {user?.fullName || 'Admin User'}
              </p>
              <p className="truncate text-[10px] text-[#9e9689] mt-0.5">
                {user?.email || 'admin@ardenby.com'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold transition hover:bg-red-500 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout System
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F5F2EB] text-[#1a1c23]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        {/* Desktop Sidebar */}
        <aside className="hidden border-r border-[#E7DDD1] bg-[#0f1115] lg:block shadow-xl">
          {sidebarContent}
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sliding Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-[280px] bg-[#0f1115] transition-transform duration-300 ease-in-out lg:hidden shadow-2xl',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {sidebarContent}
        </aside>

        {/* Main Section */}
        <section className="min-w-0 flex flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E7DDD1] bg-[#F5F2EB]/90 px-6 py-4 backdrop-blur-md">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#b89b72]">
                Admin Console
              </p>
              <h1 className="mt-0.5 font-serif text-2xl font-bold text-slate-900 tracking-tight">
                {title}
              </h1>
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/[0.08] bg-white text-slate-800 shadow-sm transition hover:bg-[#FAF8F5] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </header>

          <div className="p-4 sm:p-6 lg:p-10 flex-1">{children}</div>
        </section>
      </div>
    </main>
  );
}