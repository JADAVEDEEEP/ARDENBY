/* ---------------------------------------------------------------------------
 *  KOVENIK brand lockup: the wordmark with the Rebel Bunny peeking from behind it.
 *  Used in the header, mobile drawer and footer. Size it with `className`.
 * ------------------------------------------------------------------------- */

import { KovenikLogo } from './kovenik-logo';

type KovenikBrandProps = {
  /** Sizes the logo svg, e.g. "h-[46px] w-[131px]". */
  className?: string;
  /** Kept for call-site compatibility; the bear mascot was replaced by the bunny inside the logo. */
  bearClassName?: string;
  /** Kept for call-site compatibility. */
  variant?: 'bust' | 'full';
};

export function KovenikBrand({ className }: KovenikBrandProps) {
  return (
    <span className="inline-flex items-center">
      <KovenikLogo layout="horizontal" className={className} />
    </span>
  );
}
