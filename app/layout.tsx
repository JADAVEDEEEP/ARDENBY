import './globals.css';

import type { Metadata } from 'next';

import { Inter } from 'next/font/google';

import { Providers } from '@/components/providers';

import { SiteShell } from '@/components/layout/site-shell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://ardenby.com'
  ),

  title: 'ARDENBY — Wear Beyond Ordinary | Premium Men\'s Clothing',

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

  // ⭐ ARDENBY Favicon
 icons: {
  icon: '/icon.png',
},

  openGraph: {
    title: 'ARDENBY — Wear Beyond Ordinary',
    description:
      "Premium men's clothing. Oversized tees, graphic prints, hoodies, cargos & more.",
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
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}