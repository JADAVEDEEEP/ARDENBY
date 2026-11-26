import './globals.css';

import type { Metadata } from 'next';

import { archivo, bodoni, inter, lora, manrope, oswald, serif, unbounded } from './fonts';

import { Providers } from '@/components/providers';

import { SiteShell } from '@/components/layout/site-shell';
import { IS_STAGING, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  ...(IS_STAGING ? { robots: { index: false, follow: false } } : {}),

  title: "KOVENIK — Wear Beyond Ordinary | Premium Men's Clothing",

  description:
    "Shop KOVENIK premium oversized tees, graphic prints, hoodies, cargos and joggers. Discover KOVENIK — premium men's streetwear crafted for the bold.",

  keywords: [
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
    title: 'KOVENIK — Wear Beyond Ordinary',
    description:
      "Premium men's streetwear. Oversized tees, graphic prints, hoodies, cargos & more.",
    type: 'website',
    siteName: 'KOVENIK',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} ${serif.variable} ${bodoni.variable} ${archivo.variable} ${oswald.variable} ${unbounded.variable} ${manrope.variable}`}>
      <body className="font-sans bg-white text-[#222222]">
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}