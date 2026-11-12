import { Instagram, Youtube } from 'lucide-react';

import { cn } from '@/lib/utils';

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/* Real profile URLs come from env (NEXT_PUBLIC_INSTAGRAM_URL / _X_URL / _YOUTUBE_URL). A network with no
 * URL is not shown at all, so there are never dead "#" buttons. */
const url = (v: string | undefined) => (v && /^https?:\/\//i.test(v.trim()) ? v.trim() : '');

const LINKS = [
  { label: 'Instagram', href: url(process.env.NEXT_PUBLIC_INSTAGRAM_URL), icon: <Instagram className="h-5 w-5" strokeWidth={1.6} /> },
  { label: 'X', href: url(process.env.NEXT_PUBLIC_X_URL), icon: <XIcon className="h-[18px] w-[18px]" /> },
  { label: 'YouTube', href: url(process.env.NEXT_PUBLIC_YOUTUBE_URL), icon: <Youtube className="h-5 w-5" strokeWidth={1.6} /> },
].filter((l) => l.href);

export const HAS_SOCIAL_LINKS = LINKS.length > 0;

/** Round charcoal social buttons (44px tap targets). Shared by the footer and the side menu. */
export function SocialLinks({ className }: { className?: string }) {
  if (!HAS_SOCIAL_LINKS) return null;
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {LINKS.map(({ label, href, icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-kv-ink text-white transition-colors duration-200 hover:bg-kv-gold hover:text-white"
        >
          {icon}
        </a>
      ))}
    </div>
  );
}
