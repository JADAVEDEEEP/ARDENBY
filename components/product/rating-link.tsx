import Link from 'next/link';
import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Average rating + review count from the live review data. Renders nothing
 * when the product has no reviews, so no rating is ever shown that is not real.
 * Clicking it opens that product's review section.
 */
export function RatingLink({
  slug,
  rating,
  reviewCount,
  className,
}: {
  slug: string;
  rating: number | string | null | undefined;
  reviewCount: number | string | null | undefined;
  className?: string;
}) {
  const average = Number(rating);
  const count = Number(reviewCount);
  if (!slug || !Number.isFinite(count) || count <= 0 || !Number.isFinite(average) || average <= 0) {
    return null;
  }

  return (
    <Link
      href={`/product/${encodeURIComponent(slug)}#reviews`}
      aria-label={`Rated ${average.toFixed(1)} out of 5 from ${count} ${count === 1 ? 'review' : 'reviews'}. Read reviews`}
      className={cn('relative z-10 inline-flex items-center gap-1 self-start hover:underline', className)}
    >
      <span className="flex items-center" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={cn(
              'h-3.5 w-3.5',
              n <= Math.round(average) ? 'fill-[#E53935] text-[#E53935]' : 'text-[#D2D2D2]'
            )}
          />
        ))}
      </span>
      <span className="text-[12px] font-medium text-[#111111]">{average.toFixed(1)}</span>
      <span className="text-[12px] text-[#5C5C5C]">({count})</span>
    </Link>
  );
}
