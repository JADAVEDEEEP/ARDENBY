'use client';

import { useEffect } from 'react';

/** Publishes the sticky site header's real height as --header-h on :root, and keeps it
 *  current when the header resizes (breakpoint change, search row, fonts loading). */
export function useHeaderHeight() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('body header');
    if (!header) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty('--header-h', `${Math.round(header.getBoundingClientRect().height)}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      root.style.removeProperty('--header-h');
    };
  }, []);
}
