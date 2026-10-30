'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, BellOff, Check, Heart, ShoppingBag, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return matches;
}

/* ------------------------------------------------------------------ */
/*  Glass-metallic toasts                                             */
/* ------------------------------------------------------------------ */

export type ToastPush = (t: Omit<KvToast, 'id'>, opts?: { replace?: boolean }) => void;

export type ToastVariant = 'stock' | 'low' | 'bag' | 'wish' | 'filter';

export type KvToast = {
  id: number;
  variant: ToastVariant;
  title: string;
  message: string;
  thumb?: string;
  duration?: number;
  actions?: { label: string; onClick?: () => void; href?: string; primary?: boolean }[];
};

const TOAST_STYLE: Record<
  ToastVariant,
  { bg: string; border: string; accent: string; bar: string }
> = {
  stock: { bg: '#FDECEA', border: 'rgba(179,38,30,.4)', accent: '#B3261E', bar: '#B3261E' },
  low: { bg: '#FDECEA', border: 'rgba(229, 57, 53,.55)', accent: '#E53935', bar: '#E53935' },
  bag: { bg: '#FFFFFF', border: '#E5E5E5', accent: '#111111', bar: '#E53935' },
  filter: { bg: '#FFFFFF', border: '#E5E5E5', accent: '#111111', bar: '#E53935' },
  wish: { bg: '#FFFFFF', border: '#E5E5E5', accent: '#111111', bar: '#E53935' },
};

export function useToasts() {
  const [toasts, setToasts] = useState<KvToast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((toast: Omit<KvToast, 'id'>, opts?: { replace?: boolean }) => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((t) => {
      const base = opts?.replace ? t.filter((x) => x.variant !== toast.variant) : t;
      return [...base, { ...toast, id }].slice(-3);
    });
    return id;
  }, []);

  return { toasts, push, dismiss };
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const cls = 'h-4 w-4';
  if (variant === 'stock') return <BellOff className={cls} aria-hidden />;
  if (variant === 'low') return <AlertTriangle className={cls} aria-hidden />;
  if (variant === 'bag') return <ShoppingBag className={cls} aria-hidden />;
  if (variant === 'wish') return <Heart className={cls} aria-hidden />;
  return <Check className={cls} aria-hidden />;
}

const TOAST_LABEL: Record<ToastVariant, string> = {
  stock: 'Out of stock',
  low: 'Low stock',
  bag: 'Added to bag',
  wish: 'Saved to wishlist',
  filter: 'Filter applied',
};

function ToastItem({ toast, onDismiss }: { toast: KvToast; onDismiss: (id: number) => void }) {
  const s = TOAST_STYLE[toast.variant];
  const duration = toast.duration ?? 6000;

  useEffect(() => {
    const t = window.setTimeout(() => onDismiss(toast.id), duration);
    return () => window.clearTimeout(t);
  }, [toast.id, duration, onDismiss]);

  return (
    <div
      role="status"
      className="kv-toast pointer-events-auto w-full p-3.5 pr-11 text-[#111111]"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      <div className="flex items-start gap-3">
        {toast.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={toast.thumb}
            alt=""
            className="h-11 w-11 shrink-0 rounded-[10px] border border-[#111111]/20 object-cover"
          />
        ) : (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
            style={{ borderColor: s.border, color: s.accent, background: 'rgba(17, 17, 17,.06)' }}
          >
            <ToastIcon variant={toast.variant} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p
            className="text-[10px] font-extrabold uppercase tracking-[0.2em]"
            style={{ color: s.accent }}
          >
            {TOAST_LABEL[toast.variant]}
          </p>
          <p className="mt-1 text-[13px] leading-snug text-[#111111]">{toast.message}</p>
          {toast.actions && toast.actions.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {toast.actions.map((a) => {
                const cls = cn(
                  'inline-flex min-h-[32px] items-center rounded-full border px-3.5 text-[10px] font-extrabold uppercase tracking-[0.14em] transition hover:brightness-125',
                  a.primary
                    ? 'border-transparent bg-[#222222] text-[#FFFFFF]'
                    : 'border-[#111111]/25 bg-transparent text-[#111111]'
                );
                return a.href ? (
                  <Link key={a.label} href={a.href} className={cls} onClick={() => onDismiss(toast.id)}>
                    {a.label}
                  </Link>
                ) : (
                  <button
                    key={a.label}
                    type="button"
                    className={cls}
                    onClick={() => {
                      a.onClick?.();
                      onDismiss(toast.id);
                    }}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-[#111111]/70 transition hover:text-[#111111]"
      >
        <X className="h-4 w-4" />
      </button>
      <span
        aria-hidden
        className="kv-toast-bar"
        style={{ background: s.bar, ['--dur' as string]: `${duration}ms` }}
      />
    </div>
  );
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: KvToast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 top-[172px] z-[200] flex flex-col gap-3 sm:left-auto sm:right-4 sm:w-[380px] lg:right-6 lg:top-[140px]"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
