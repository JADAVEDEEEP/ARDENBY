'use client';

import { useCutout } from '@/hooks/use-cutout';
import { cn } from '@/lib/utils';

import { SafeImage } from './SafeImage';

/** Fades the rectangular photo edges into the dark plinth. */
const VIGNETTE =
  'radial-gradient(ellipse 78% 78% at 50% 46%, #000 52%, transparent 100%)';

interface ProductImageProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  /** Extra classes for the garment (transforms, hover zoom). */
  className?: string;
  /** `circle` zooms the garment so it fills a round category ring. */
  fit?: 'contain' | 'circle';
  /** Used once if the photo itself 404s. */
  fallback?: string;
  /** Fade the photo edges into the dark card (rectangular frames only). */
  vignette?: boolean;
}

/** Product photo that never shows as a hard white box: a transparent cut-out
 *  floating with a drop-shadow when the photo allows it, otherwise the photo
 *  inside a soft vignette that melts into the dark card. */
export function ProductImage({
  src,
  alt,
  sizes,
  priority,
  className,
  fit = 'contain',
  fallback,
  vignette = true,
}: ProductImageProps) {
  const cut = useCutout(src);

  if (cut.status === 'loading') {
    return <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-white/[0.03]" />;
  }

  if (cut.status === 'cutout') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={cut.url}
        alt={alt}
        draggable={false}
        className={cn(
          'absolute inset-0 h-full w-full select-none object-contain drop-shadow-[0_22px_22px_rgba(0,0,0,0.65)]',
          fit === 'circle' ? 'p-[10%]' : 'p-[6%]',
          className
        )}
      />
    );
  }

  return (
    <SafeImage
      src={src}
      fallback={fallback}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      draggable={false}
      className={cn('select-none object-cover object-top', className)}
      style={vignette ? { WebkitMaskImage: VIGNETTE, maskImage: VIGNETTE } : undefined}
    />
  );
}
