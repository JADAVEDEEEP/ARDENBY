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
  const pathname = usePathname();

  const isPrivateArea =
    pathname.startsWith('/admin') || pathname.startsWith('/superadmin');

  if (isPrivateArea) {
    return <>{children}</>;
  }

  return (
    <>
      <AnnouncementBar />
      <Navbar />

      <main className="min-h-screen">
        {children}
      </main>

      <Footer />
    </>
  );
}
