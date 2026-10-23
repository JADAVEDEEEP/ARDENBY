'use client';

import { useEffect, useState } from 'react';

import { cutoutImage } from '@/lib/cutout';

export type CutoutState =
  | { status: 'loading'; url: null }
  | { status: 'cutout'; url: string }
  | { status: 'photo'; url: null };

/** Resolves a transparent cut-out for a product photo.
 *  `photo` means it could not be cut out and the original should be shown. */
export function useCutout(src: string | undefined): CutoutState {
  const [state, setState] = useState<{ src?: string; url: string | null; done: boolean }>({
    done: false,
    url: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (!src) return;
    cutoutImage(src).then((url) => {
      if (!cancelled) setState({ src, url, done: true });
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!src) return { status: 'photo', url: null };
  if (state.src !== src || !state.done) return { status: 'loading', url: null };
  return state.url ? { status: 'cutout', url: state.url } : { status: 'photo', url: null };
}
