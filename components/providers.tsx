'use client';

import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CartDrawer } from '@/features/cart/cart-drawer';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      {children}
      <CartDrawer />
      <Toaster position="top-center" richColors />
    </TooltipProvider>
  );
}
