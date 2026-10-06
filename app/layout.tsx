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
    process.env.NEXT_PUBLIC_SITE_URL || 'https://kovenik.in'
  ),

  title: "KÖVENIK — Wear Beyond Ordinary | Premium Men's Clothing",

  description:
    "Shop KÖVENIK premium oversized tees, graphic prints, hoodies, cargos and joggers. Discover KÖVENIK — premium men's streetwear crafted for the bold.",

  keywords: [
    'KÖVENIK',
    'KOVENIK',
    'KOVENIK clothing',
    'KOVENIK streetwear',
    'men clothing',
    'oversized t-shirts',
    'graphic tees',
    'hoodies',
    'cargo pants',
    'joggers',
    'premium fashion',
    'premium streetwear',
  ],

  icons: {
    icon: [
      {
        url: '/image.png',
        type: 'image/png',
        sizes: '600x600',
      },
    ],
    apple: [
      {
        url: '/image.png',
        type: 'image/png',
        sizes: '512x512',
      },
    ],
  },

  openGraph: {
    title: 'KÖVENIK — Wear Beyond Ordinary',
    description:
      "Premium men's streetwear. Oversized tees, graphic prints, hoodies, cargos & more.",
    type: 'website',
    siteName: 'KÖVENIK',
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