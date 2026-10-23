'use client';

import { useEffect, useState } from 'react';

/** True only for hover-capable fine pointers (desktop) and when the user has
 *  not asked for reduced motion. Gate tilt/parallax effects on this. */
export function useFinePointer(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setEnabled(fine.matches && !reduce.matches);

    update();
    fine.addEventListener('change', update);
    reduce.addEventListener('change', update);

    return () => {
      fine.removeEventListener('change', update);
      reduce.removeEventListener('change', update);
    };
  }, []);

  return enabled;
}
