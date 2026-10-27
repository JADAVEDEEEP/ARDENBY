'use client';

import { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const SWIPE_CLOSE_PX = 90;

/** Mobile bottom sheet on Radix Dialog: focus trap, Esc, overlay-tap close, body scroll lock,
 *  role="dialog" + aria-modal. Swipe down on the handle/header to dismiss. */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  headerAction,
  fixedHeight = false,
  footer,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  headerAction?: React.ReactNode;
  /** true = ~88% of the viewport (filters); false = fits its content (sort) */
  fixedHeight?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const dy = useRef(0);

  const move = (offset: number, animate: boolean) => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transition = animate ? 'transform 200ms ease-out' : 'none';
    el.style.transform = offset ? `translateY(${offset}px)` : '';
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[300] bg-[rgba(17,17,17,0.45)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          ref={sheetRef}
          aria-modal="true"
          aria-describedby={undefined}
          className={cn(
            'kvl fixed inset-x-0 bottom-0 z-[310] flex flex-col rounded-t-[20px] bg-[var(--ivory)] outline-none',
            'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom',
            fixedHeight ? 'h-[88dvh]' : 'max-h-[88dvh]'
          )}
        >
          <div
            className="touch-none"
            onTouchStart={(e) => {
              startY.current = e.touches[0].clientY;
              dy.current = 0;
            }}
            onTouchMove={(e) => {
              if (startY.current === null) return;
              dy.current = Math.max(0, e.touches[0].clientY - startY.current);
              move(dy.current, false);
            }}
            onTouchEnd={() => {
              if (startY.current === null) return;
              startY.current = null;
              if (dy.current > SWIPE_CLOSE_PX) onOpenChange(false);
              move(0, true);
            }}
          >
            <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-[var(--line)]" />
            <div className="flex items-center gap-4 border-b border-[var(--line)] px-5 pb-4 pt-3.5">
              <Dialog.Title className="flex-1 text-[17px] font-semibold text-[var(--ink)]">{title}</Dialog.Title>
              {headerAction}
              <Dialog.Close
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink)]"
              >
                <X className="h-4 w-4" aria-hidden />
              </Dialog.Close>
            </div>
          </div>
          {children}
          {footer && <div className="border-t border-[var(--line)] px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3.5">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
