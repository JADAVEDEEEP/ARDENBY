import { categories } from '@/lib/data';

import { categoryImage } from './home-assets';
import { Reveal } from './ui/Reveal';
import { SafeImage } from './ui/SafeImage';

interface EditorialStatementProps {
  fallbacks: Record<string, string | undefined>;
}

/** Inline chrome-bordered capsule image that sits inside the statement. */
function Pill({
  index,
  fallbacks,
}: {
  index: number;
  fallbacks: Record<string, string | undefined>;
}) {
  const cat = categories[index % 4];

  return (
    <span
      aria-hidden="true"
      className="mx-[0.12em] inline-block h-[0.78em] w-[1.7em] translate-y-[0.04em] rounded-full p-[2px] align-middle"
      style={{ background: 'var(--kv-chrome-ring)' }}
    >
      <span className="relative block h-full w-full overflow-hidden rounded-full bg-kv-surface2">
        <SafeImage
          src={categoryImage(cat.slug)}
          fallback={fallbacks[cat.slug]}
          alt=""
          fill
          sizes="120px"
          className="object-cover"
        />
      </span>
    </span>
  );
}

export function EditorialStatement({ fallbacks }: EditorialStatementProps) {
  return (
    <section className="bg-kv-bg px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
      <Reveal className="mx-auto max-w-[1200px]">
        <p className="mb-7 text-center text-[11px] font-semibold uppercase tracking-[0.34em] text-kv-gold">
          Kovenik
        </p>
        <h2 className="chrome-text text-center font-bodoni text-[clamp(26px,4.4vw,58px)] font-medium uppercase leading-[1.34] tracking-[0.02em] [text-wrap:balance] lg:leading-[1.28]">
          Elevate your fashion game <Pill index={0} fallbacks={fallbacks} /> with
          our expertly <Pill index={1} fallbacks={fallbacks} /> curated collection{' '}
          <Pill index={2} fallbacks={fallbacks} /> of high-end pieces.{' '}
          <Pill index={3} fallbacks={fallbacks} /> Discover the perfect outfit for
          any occasion, from casual <Pill index={0} fallbacks={fallbacks} /> to
          formal.
        </h2>
      </Reveal>
    </section>
  );
}
