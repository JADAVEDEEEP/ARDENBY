import './globals.css';

import type { Metadata } from 'next';

import {
  Archivo,
  Bodoni_Moda,
  Cormorant_Garamond,
  Inter,
  Manrope,
  Unbounded,
} from 'next/font/google';

import { Providers } from '@/components/providers';

import { SiteShell } from '@/components/layout/site-shell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

// Display serif for the chrome homepage, navbar and footer.
const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-bodoni',
  display: 'swap',
});

// Archivo with the width axis (wdth 62-125) for the extended hero headline.
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
});

// Category page: Unbounded for the hero title, Manrope for UI text.
const unbounded = Unbounded({
  subsets: ['latin'],
  weight: ['800'],
  variable: '--font-unbounded',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
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
    <html lang="en" className={`${inter.variable} ${serif.variable} ${bodoni.variable} ${archivo.variable} ${unbounded.variable} ${manrope.variable}`}>
      <body className="font-sans bg-[#050505] text-ink">
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}