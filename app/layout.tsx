import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AnnouncementBar } from '@/components/layout/announcement-bar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ARDENBY — Wear Beyond Ordinary | Premium Men's Clothing",
  description:
    "Shop premium oversized tees, graphic prints, hoodies, cargos and joggers. Find your style with ARDENBY — luxury men's fashion crafted for the bold.",
  keywords: [
    'men clothing',
    'oversized t-shirts',
    'graphic tees',
    'hoodies',
    'cargo pants',
    'joggers',
    'premium fashion',
    'ARDENBY',
  ],
  openGraph: {
    title: 'ARDENBY — Wear Beyond Ordinary',
    description: "Premium men's clothing. Oversized tees, graphic prints, hoodies, cargos & more.",
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-cream text-ink">
        <Providers>
          <AnnouncementBar />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
