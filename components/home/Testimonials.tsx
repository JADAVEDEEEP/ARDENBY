import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

import { reviews } from './home-content';
import { ChromeRing } from './ui/ChromeRing';
import { Reveal } from './ui/Reveal';

/** Three monochrome glass cards. The middle card is raised on desktop. */
export function Testimonials() {
  return (
    <section
      aria-label="Customer reviews"
      className="bg-kv-bg px-4 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        <Reveal className="mb-10 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-kv-gold">
            Verified reviews
          </p>
          <h2 className="chrome-text font-bodoni text-[clamp(30px,4vw,52px)] font-medium uppercase leading-[1]">
            What our customers say
          </h2>
          <p className="mt-3 text-[13px] text-kv-muted">Real stories from real people</p>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3 md:items-start md:gap-6">
          {reviews.map((review, index) => (
            <Reveal key={review.name} delay={index * 0.12} className={cn(index === 1 && 'md:-mt-6')}>
            <article className="chrome-glass flex h-full flex-col rounded-2xl p-6 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-white/40">
              <div className="mb-4 flex items-center justify-between">
                <span aria-hidden="true" className="chrome-text font-bodoni text-[44px] leading-[0.6]">
                  &ldquo;
                </span>
                <div className="flex gap-0.5" role="img" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-[#dfe3e8] text-[#dfe3e8]" />
                  ))}
                </div>
              </div>

              <p className="flex-1 text-[14px] leading-[1.7] text-kv-body">{review.text}</p>

              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
                <ChromeRing
                  thickness={2}
                  className="h-10 w-10 shrink-0"
                  innerClassName="flex items-center justify-center bg-kv-bg font-bodoni text-[16px] text-kv-head"
                >
                  {review.name.charAt(0)}
                </ChromeRing>
                <div>
                  <p className="text-[13px] font-semibold text-kv-head">{review.name}</p>
                  <p className="text-[11px] text-kv-muted">{review.tag}</p>
                </div>
              </div>
            </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
