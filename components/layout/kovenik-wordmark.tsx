import { cn } from '@/lib/utils';

/**
 * The one KOVENIK logo: red diamond + Oswald Bold wordmark. Header, mobile menu and footer all use this,
 * so the logo stays identical everywhere. Pick a size with `size`; the colours live here only.
 * (The old bunny/crown artwork is still in kovenik-logo.tsx and the public assets, just not used here.)
 */
const SIZES = {
  sm: 'text-[20px] gap-[7px]',
  md: 'text-[24px] gap-2 md:text-[28px] md:gap-2.5',
  lg: 'text-[30px] gap-2.5 md:text-[36px] md:gap-3',
} as const;

const DIAMOND = { sm: 'h-[7px] w-[7px]', md: 'h-[8px] w-[8px] md:h-[9px] md:w-[9px]', lg: 'h-[10px] w-[10px] md:h-[11px] md:w-[11px]' } as const;

export function KovenikWordmark({ size = 'md', className }: { size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      aria-label="KOVENIK"
      className={cn('inline-flex items-center whitespace-nowrap font-oswald font-bold uppercase leading-none tracking-[0.1em] text-[#111]', SIZES[size], className)}
    >
      <span aria-hidden="true" className={cn('shrink-0 rotate-45 bg-[#d92b2b]', DIAMOND[size])} />
      <span aria-hidden="true">Kovenik</span>
    </span>
  );
}
