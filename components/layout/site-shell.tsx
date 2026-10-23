'use client';

import { usePathname } from 'next/navigation';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AnnouncementBar } from '@/components/layout/announcement-bar';


export function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";

  const isPrivateArea =
    pathname.startsWith('/admin') || pathname.startsWith('/superadmin');

  const isHome = pathname === '/';

  // Single product page only: no newsletter/footer (the footer contains the newsletter).
  const isProduct = pathname.startsWith('/product/');

  if (isPrivateArea) {
    return <>{children}</>;
  }

  return (
    <>
      {/* One continuous cosmic sky behind navbar, sections, footer and toasts.
          Home only: inner pages keep their own light layouts. */}
    

      {/* The home page is dark end to end, so the translucent navbar sits on
          dark instead of the cream body background (which turned it grey). */}
      <div
        className={
          isHome ? 'relative bg-kv-bg' : pathname === '/shop' ? 'kv-shop-shell relative' : 'relative'
        }
      >
        <AnnouncementBar />
        <Navbar />

        <main className="min-h-screen">
          {children}
        </main>

        {!isProduct && <Footer />}
      </div>
    </>
  );
}
