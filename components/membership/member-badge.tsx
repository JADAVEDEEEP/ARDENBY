import { cn } from '@/lib/utils';

export const MEMBER_RED = '#C8211F';

/**
 * The one KOVENIK membership mark: an all-red shield with a K, and "MEMBER" underneath.
 * Used everywhere (header, cards, product page, cart, checkout, profile) so it never varies.
 * `size` is the shield height in px; the label scales with it.
 */
export function MemberBadge({
  size = 28,
  label = true,
  tone = 'brand',
  className,
}: {
  size?: number;
  label?: boolean;
  /** `brand` is the red mark; `ink` is the same shield in neutral black (price areas). */
  tone?: 'brand' | 'ink';
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex flex-col items-center leading-none', className)}
      style={{ color: tone === 'ink' ? '#111111' : MEMBER_RED }}
      role="img"
      aria-label="KOVENIK Member"
    >
      <svg
        width={size * 0.86}
        height={size}
        viewBox="0 0 24 28"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M12 1.5 21.5 4.8v9.1c0 5.6-3.9 9.6-9.5 12.6C6.4 23.5 2.5 19.500 2.5 13.900V4.800L12 1.500Z"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M8.600 8v11M8.600 13.700 15.200 8M10.900 12l4.600 7" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label && (
        <span
          className="mt-[3px] font-bold uppercase"
          style={{ fontSize: Math.max(7, Math.round(size * 0.27)), letterSpacing: '0.18em', paddingLeft: '0.18em' }}
        >
          Member
        </span>
      )}
    </span>
  );
}
