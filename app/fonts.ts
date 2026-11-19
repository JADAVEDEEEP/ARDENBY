// Self-hosted fonts (latin subset). They live in app/fonts so the build never has to download
// them from Google, which made production builds on Vercel fail intermittently.
import localFont from 'next/font/local';

export const inter = localFont({
  src: [{ path: './fonts/inter-normal-100-900.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-inter',
  display: 'swap',
});

// Lora 500: headings on the light storefront (italic gold accent word).
export const lora = localFont({
  src: [
    { path: './fonts/lora-normal-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/lora-italic-500.woff2', weight: '500', style: 'italic' },
  ],
  variable: '--font-lora',
  display: 'swap',
});

export const serif = localFont({
  src: [{ path: './fonts/serif-normal-400-700.woff2', weight: '400 700', style: 'normal' }],
  variable: '--font-serif',
  display: 'swap',
});

// Display serif for the chrome homepage, navbar and footer.
export const bodoni = localFont({
  src: [{ path: './fonts/bodoni-normal-400-900.woff2', weight: '400 900', style: 'normal' }],
  variable: '--font-bodoni',
  display: 'swap',
});

// Oswald: uppercase headings on the storefront.
export const oswald = localFont({
  src: [{ path: './fonts/oswald-normal-500-700.woff2', weight: '500 700', style: 'normal' }],
  variable: '--font-oswald',
  display: 'swap',
});

// Archivo (with the width axis) is the storefront body font.
export const archivo = localFont({
  src: [{ path: './fonts/archivo-normal-100-900.woff2', weight: '100 900', style: 'normal' }],
  declarations: [{ prop: 'font-stretch', value: '62% 125%' }],
  variable: '--font-archivo',
  display: 'swap',
});

// Category page: Unbounded for the hero title, Manrope for UI text.
export const unbounded = localFont({
  src: [{ path: './fonts/unbounded-normal-800.woff2', weight: '800', style: 'normal' }],
  variable: '--font-unbounded',
  display: 'swap',
});

export const manrope = localFont({
  src: [{ path: './fonts/manrope-normal-400-800.woff2', weight: '400 800', style: 'normal' }],
  variable: '--font-manrope',
  display: 'swap',
});
