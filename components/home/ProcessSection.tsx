import Link from 'next/link';

import { philosophy } from './home-content';

export function ProcessSection() {
  return (
    <section aria-labelledby="home-process" className="bg-kv-bg py-10 md:py-14">
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-6">
        <h2
          id="home-process"
          className="mb-6 max-w-[760px] font-oswald text-[26px] font-semibold uppercase leading-tight tracking-[0.06em] text-kv-ink md:mb-8 md:text-[36px]"
        >
          What defines a KOVENIK piece.
        </h2>

        <div className="grid gap-8 md:items-center md:gap-12">
          <div>
            <p className="max-w-[520px] text-[15px] leading-[1.6] text-kv-sub md:text-[17px]">
              Relaxed shapes and bold graphics, designed for everyday wear.
            </p>

            <ol className="mt-7 space-y-6">
              {philosophy.map((item) => (
                <li key={item.num} className="flex items-start gap-4">
                  <span className="font-oswald text-[26px] font-semibold leading-none text-kv-gold-text">{item.num}</span>
                  <div>
                    <h3 className="font-oswald text-[20px] font-semibold uppercase leading-tight tracking-[0.06em] text-kv-ink md:text-[22px]">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 max-w-[480px] text-[15px] leading-[1.6] text-kv-sub md:text-[17px]">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Link
              href="/shop"
              className="mt-8 inline-flex min-h-[48px] items-center bg-kv-ink px-8 text-[14px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-black md:min-h-[52px] md:text-[15px]"
            >
              Discover our values
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
