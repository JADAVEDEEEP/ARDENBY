'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const EXIT_MS = 220;

const SIZE_ROWS = [
  { size: 'S', length: 71, chest: 107, shoulder: 53, sleeve: 24 },
  { size: 'M', length: 74, chest: 112, shoulder: 55, sleeve: 25 },
  { size: 'L', length: 76, chest: 117, shoulder: 57, sleeve: 26 },
  { size: 'XL', length: 79, chest: 122, shoulder: 59, sleeve: 27 },
  { size: 'XXL', length: 80, chest: 127, shoulder: 61, sleeve: 28 },
];

const CSS = `
.kv-sg-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;
  padding:16px;background:rgba(10,10,10,.6);backdrop-filter:blur(2px);overscroll-behavior:contain;
  animation:kvSgFade ${EXIT_MS}ms ease both}
.kv-sg-overlay[data-state=closing]{animation:kvSgFadeOut ${EXIT_MS}ms ease both}
.kv-sg-panel{position:relative;width:100%;max-width:480px;max-height:calc(100dvh - 32px);overflow-y:auto;
  background:#fff;color:#111;border-radius:18px;padding:24px 24px 26px;box-shadow:0 24px 60px rgba(0,0,0,.35);
  animation:kvSgIn ${EXIT_MS + 60}ms cubic-bezier(.2,.8,.2,1) both}
.kv-sg-overlay[data-state=closing] .kv-sg-panel{animation:kvSgOut ${EXIT_MS}ms ease both}
@keyframes kvSgFade{from{opacity:0}to{opacity:1}}
@keyframes kvSgFadeOut{from{opacity:1}to{opacity:0}}
@keyframes kvSgIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}
@keyframes kvSgOut{from{opacity:1;transform:none}to{opacity:0;transform:translateY(10px) scale(.97)}}
.kv-sg-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #E5E5E5;border-radius:12px;overflow:hidden;font-size:14px}
.kv-sg-table th{background:#F4F4F4;font-weight:700;padding:11px 6px;border-bottom:1px solid #E5E5E5}
.kv-sg-table td{text-align:center;padding:10px 6px;border-bottom:1px solid #EEE}
.kv-sg-table th:not(:last-child),.kv-sg-table td:not(:last-child){border-right:1px solid #EEE}
.kv-sg-table tbody tr:last-child td{border-bottom:0}
.kv-sg-table td:first-child{font-weight:700}
@media (max-width:520px){
  .kv-sg-overlay{align-items:flex-end;padding:0}
  .kv-sg-panel{max-width:none;border-radius:18px 18px 0 0;padding:20px 16px calc(22px + env(safe-area-inset-bottom));
    max-height:92dvh;animation-name:kvSgSheet}
  .kv-sg-overlay[data-state=closing] .kv-sg-panel{animation-name:kvSgSheetOut}
  .kv-sg-table{font-size:12.5px}
  .kv-sg-table th{font-size:11.5px;padding:9px 3px}
}
@keyframes kvSgSheet{from{transform:translateY(100%)}to{transform:none}}
@keyframes kvSgSheetOut{from{transform:none}to{transform:translateY(100%)}}
@media (prefers-reduced-motion:reduce){
  .kv-sg-overlay,.kv-sg-panel{animation-duration:1ms!important}
}
`;

function Tee({ oversized }: { oversized: boolean }) {
  // Same body, wider torso and dropped shoulder / longer sleeves for oversized.
  const body = oversized
    ? 'M62 34 L38 44 L8 92 L34 106 L52 84 L52 176 L148 176 L148 84 L166 106 L192 92 L162 44 L138 34 Q100 52 62 34 Z'
    : 'M72 34 L48 44 L26 88 L46 98 L62 76 L62 172 L138 172 L138 76 L154 98 L174 88 L152 44 L128 34 Q100 50 72 34 Z';
  return (
    <svg viewBox="0 0 200 190" className="mx-auto block h-auto w-full max-w-[180px]" role="img"
      aria-label={oversized ? 'Oversized fit illustration' : 'Regular fit illustration'}>
      <path d={body} fill="#2B2B2B" stroke="#111" strokeWidth="2" strokeLinejoin="round" />
      <path d="M78 36 Q100 56 122 36" fill="none" stroke="#111" strokeWidth="5" strokeLinecap="round" />
      <text x="100" y="108" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" letterSpacing="1.5">KOVENIK</text>
      {/* chest span marker */}
      <line x1={oversized ? 52 : 62} y1="148" x2={oversized ? 148 : 138} y2="148" stroke="#E53935" strokeWidth="1.5" strokeDasharray="4 3" />
    </svg>
  );
}

export function SizeGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  // Mount on open; keep mounted through the exit animation.
  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setClosing(false);
      setMounted(true);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const t = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
      returnFocus.current?.focus?.();
    }, EXIT_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('button')?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>('button,[href],[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  return (
    <div
      className="kv-sg-overlay"
      data-state={closing ? 'closing' : 'open'}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{CSS}</style>
      <div ref={panelRef} className="kv-sg-panel" role="dialog" aria-modal="true" aria-labelledby="kv-sg-title">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close size guide"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-[#111] transition-colors hover:bg-black/5"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="kv-sg-title" className="pr-10 text-[26px] font-bold leading-tight">Size Guide</h2>
        <p className="mb-4 mt-1 text-[14px] text-[#5A5A5A]">Find your perfect fit for KOVENIK T-Shirts.</p>

        <table className="kv-sg-table">
          <thead>
            <tr>
              <th scope="col">Size</th>
              <th scope="col">Length (cm)</th>
              <th scope="col">Chest (cm)</th>
              <th scope="col">Shoulder (cm)</th>
              <th scope="col">Sleeve (cm)</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_ROWS.map((r) => (
              <tr key={r.size}>
                <td>{r.size}</td>
                <td>{r.length}</td>
                <td>{r.chest}</td>
                <td>{r.shoulder}</td>
                <td>{r.sleeve}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#E5E5E5] bg-[#E5E5E5]">
          {[
            { title: 'Regular Fit', text: 'Classic fit, closer to the body.', oversized: false },
            { title: 'Oversized Fit', text: 'Relaxed fit with a loose and baggy look.', oversized: true },
          ].map((fit) => (
            <figure key={fit.title} className="m-0 bg-[#F7F7F7] px-3 pb-4 pt-4 text-center">
              <figcaption>
                <p className="text-[16px] font-bold">{fit.title}</p>
                <p className="mx-auto mb-3 mt-1 max-w-[200px] text-[12.5px] leading-snug text-[#5A5A5A]">{fit.text}</p>
              </figcaption>
              <Tee oversized={fit.oversized} />
            </figure>
          ))}
        </div>

        <p className="mt-3 text-center text-[11.5px] text-[#828282]">
          Measurements are garment dimensions in cm and may vary by ±1 cm.
        </p>
      </div>
    </div>
  );
}
