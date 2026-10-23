'use client';

import { useState } from 'react';
import type { ComponentProps } from 'react';

import Image from 'next/image';

type SafeImageProps = Omit<ComponentProps<typeof Image>, 'src'> & {
  src: string;
  /** Used once if `src` fails to load. */
  fallback?: string;
};

/** next/image that falls back once to another source if the first one 404s. */
export function SafeImage({ src, fallback, alt, ...rest }: SafeImageProps) {
  const [current, setCurrent] = useState(src);
  const [prevSrc, setPrevSrc] = useState(src);

  // Reset if the parent hands us a different source.
  if (src !== prevSrc) {
    setPrevSrc(src);
    setCurrent(src);
  }

  return (
    <Image
      {...rest}
      src={current}
      alt={alt}
      onError={() => {
        if (fallback && current !== fallback) setCurrent(fallback);
      }}
    />
  );
}
