'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Monitor, Smartphone } from 'lucide-react';

import { Notice } from '@/components/admin/ui';
import { message } from '@/lib/admin-ops-api';
import { newsletterApi } from '@/lib/newsletter-campaign-api';
import type { Design } from '@/lib/newsletter-campaign-api';
import { cn } from '@/lib/utils';

type Device = 'desktop' | 'mobile';

/**
 * Live preview of the email exactly as the server renders it (the same code that builds the real email),
 * inside a sandboxed frame: no scripts, no access to this page. Desktop and mobile widths.
 * The compliance footer (unsubscribe link, postal address) always appears, because the server adds it.
 */
export function EmailPreview({
  design,
  subject,
  preheader,
  className,
  onWarnings,
}: {
  design: Design;
  subject: string;
  preheader: string;
  className?: string;
  onWarnings?: (warnings: string[]) => void;
}) {
  const [device, setDevice] = useState<Device>('desktop');
  const [html, setHtml] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);

  useEffect(() => {
    const request = ++latest.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await newsletterApi.preview({ design, subject, preheader });
        if (request !== latest.current) return;
        setHtml(result.html);
        setWarnings(result.warnings || []);
        onWarnings?.(result.warnings || []);
        setError('');
      } catch (e) {
        if (request === latest.current) setError(message(e)); // keep the last good preview on screen
      } finally {
        if (request === latest.current) setLoading(false);
      }
    }, 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design, subject, preheader]);

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-[#E3E5EE] bg-white p-0.5" role="group" aria-label="Preview size">
          {(
            [
              ['desktop', 'Desktop', Monitor],
              ['mobile', 'Mobile', Smartphone],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setDevice(key)}
              aria-pressed={device === key}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors',
                device === key ? 'bg-[#11162B] text-white' : 'text-[#5A6075] hover:bg-[#F5F6FA]'
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        {loading && (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-[#5A6075]" role="status">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating
          </span>
        )}
      </div>

      {error && (
        <Notice tone="error" className="mb-3">
          {error}
        </Notice>
      )}
      {warnings.length > 0 && (
        <Notice tone="warning" className="mb-3">
          <ul className="list-disc space-y-1 pl-4">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Notice>
      )}

      <div className="min-h-[420px] flex-1 overflow-auto rounded-xl border border-[#E3E5EE] bg-[#F5F6FA] p-3">
        {html ? (
          <iframe
            title="Email preview"
            sandbox=""
            srcDoc={html}
            className={cn('mx-auto block h-[640px] max-w-full rounded-md border-0 bg-white shadow-sm transition-[width]', device === 'mobile' ? 'w-[375px]' : 'w-[640px]')}
          />
        ) : (
          <p className="p-6 text-center text-[14px] text-[#5A6075]">{loading ? 'Building preview…' : 'The preview appears here.'}</p>
        )}
      </div>
    </div>
  );
}
