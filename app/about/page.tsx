import type { Metadata } from 'next';
import Image from 'next/image';

import { Container, CtaLink, Eyebrow } from '@/components/info/info-ui';

export const metadata: Metadata = {
  title: 'About KOVENIK | Premium Men’s Clothing',
  description:
    'KOVENIK is premium men’s clothing crafted for the bold: heavyweight fabrics, relaxed drop-shoulder cuts and original limited-edition artwork. Est. 2026, India.',
  alternates: { canonical: '/about' },
  robots: { index: true, follow: true },
};

// NEEDS APPROVAL: only statements that already appear on the live site / in the brand's own imagery are
// used: "premium men's clothing crafted for the bold", "Est. 2026 · India", 240 GSM heavyweight combed
// cotton, drop-shoulder silhouette, original DTF and puff graphics in limited runs, relaxed cuts and
// minimalist luxury aesthetics, the fit-study callouts (bio-washed, pre-shrunk). No founder story,
// factory, sourcing, sustainability or certification claim is made. See
// docs/POLICY_PAGES_BUSINESS_INPUT_REQUIRED.md.

const values = [
  { n: '01', title: 'Considered', text: 'Every cut, print and detail is decided on purpose. If it does not earn its place, it is left out.' },
  { n: '02', title: 'Built to last', text: 'Heavyweight fabric and clean construction, made for the pieces you reach for every week.' },
  { n: '03', title: 'Original', text: 'Our artwork is drawn for KOVENIK and released in exclusive runs, not borrowed from a catalogue.' },
  { n: '04', title: 'Straightforward', text: 'Clear prices, clear policies and a team you can actually reach when something needs fixing.' },
];

export default function AboutPage() {
  return (
    <div className="overflow-x-clip bg-white text-[#111111]">
      {/* 1. Opening: oversized statement + offset image */}
      <header>
        <Container className="pb-12 pt-12 md:pb-20 md:pt-20">
          <div className="grid items-end gap-10 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-7">
              <Eyebrow>About KOVENIK · Est. 2026 · India</Eyebrow>
              <h1 className="mt-6 font-oswald text-[clamp(52px,10.5vw,168px)] font-bold uppercase leading-[0.88] tracking-[-0.015em]">
                Wear
                <br />
                beyond
                <br />
                <span className="text-[#C62828]">ordinary.</span>
              </h1>
            </div>
            <div className="md:col-span-5">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#111111] md:translate-y-10">
                <Image
                  src="/images/hero-dtf-back-print.jpg"
                  alt="A model seen from behind in a white oversized KOVENIK tee with a large crane-and-waves back print"
                  fill
                  priority
                  sizes="(min-width: 768px) 42vw, 100vw"
                  className="object-cover object-[60%_50%]"
                />
              </div>
            </div>
          </div>
        </Container>
      </header>

      {/* 2. Introduction */}
      <section aria-labelledby="intro-title" className="py-16 md:py-28">
        <Container>
          <div className="grid gap-8 md:grid-cols-12">
            <p className="font-oswald text-[15px] font-semibold uppercase tracking-[0.22em] text-[#C62828] md:col-span-3">Who we are</p>
            <div className="md:col-span-8 md:col-start-5">
              <h2 id="intro-title" className="font-oswald text-[clamp(32px,6vw,68px)] font-bold uppercase leading-[1]">
                Premium men’s clothing crafted for the bold.
              </h2>
              <p className="mt-8 max-w-[56ch] text-[19px] leading-[1.75] text-[#3A3A3A] md:text-[21px]">
                KOVENIK makes everyday clothing with the confidence of a fashion label: high-density fabrics, relaxed
                cuts and a minimal, luxurious finish. Our pieces are made for people who would rather choose their own
                direction than follow one.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Philosophy on black, with a tall image */}
      <section aria-labelledby="philosophy-title" className="bg-[#111111] text-white">
        <Container className="py-16 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-5">
              <Eyebrow tone="dark">Philosophy</Eyebrow>
              <h2 id="philosophy-title" className="mt-5 font-oswald text-[clamp(36px,7vw,84px)] font-bold uppercase leading-[0.95]">
                Quiet <span className="text-[#FF8A80]">confidence</span>
              </h2>
              <p className="mt-8 max-w-[44ch] text-[18px] leading-[1.75] text-[#D6D6D6] md:text-[20px]">
                Minimalist luxury is not about more. It is about the right silhouette, a heavyweight hand-feel and one
                bold idea on the chest or back. Clothes that look considered and feel effortless, worn on repeat.
              </p>
            </div>
            <div className="md:col-span-6 md:col-start-7">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#222222] md:aspect-[5/6]">
                <Image
                  src="/images/hero-olive-graphic.jpg"
                  alt="A model in an olive pocket tee against a sunlit stone wall"
                  fill
                  loading="lazy"
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover object-[55%_30%]"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Design approach: asymmetric pair */}
      <section aria-labelledby="design-title" className="py-16 md:py-28">
        <Container>
          <div className="grid gap-10 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-5 md:pt-24">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#111111]">
                <Image
                  src="/images/hero-black-tee.jpg"
                  alt="A model seated on concrete steps in a black KOVENIK graphic tee and cargo trousers"
                  fill
                  loading="lazy"
                  sizes="(min-width: 768px) 42vw, 100vw"
                  className="object-cover object-[48%_40%]"
                />
              </div>
            </div>
            <div className="md:col-span-6 md:col-start-7">
              <Eyebrow>Design approach</Eyebrow>
              <h2 id="design-title" className="mt-5 font-oswald text-[clamp(34px,6.5vw,76px)] font-bold uppercase leading-[0.98]">
                Silhouette first. Artwork with intent.
              </h2>
              <div className="mt-8 max-w-[52ch] space-y-5 text-[18px] leading-[1.75] text-[#3A3A3A] md:text-[20px]">
                <p>
                  We start with the shape: a drop-shoulder silhouette with dropped armholes, cut for a relaxed drape that
                  holds its line through the day.
                </p>
                <p>
                  Then the artwork. Our graphics are original, produced with high-density DTF and puff techniques, and
                  released as limited-edition drops in exclusive runs.
                </p>
              </div>
              <ul className="mt-10 grid grid-cols-2 gap-px bg-[#D9D9D9]">
                <li className="bg-white py-5 pr-4">
                  <p className="font-oswald text-[34px] font-bold leading-none text-[#C62828]">Drop</p>
                  <p className="mt-2 text-[15px] text-[#555555]">shoulder silhouette</p>
                </li>
                <li className="bg-white py-5 pl-5">
                  <p className="font-oswald text-[34px] font-bold leading-none text-[#C62828]">Limited</p>
                  <p className="mt-2 text-[15px] text-[#555555]">edition artwork drops</p>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Quality & craftsmanship */}
      <section aria-labelledby="quality-title" className="bg-[#F5F5F5] py-16 md:py-28">
        <Container>
          <div className="grid items-center gap-12 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#111111]">
                <Image
                  src="/images/fit-study.png"
                  alt="KOVENIK fit study: a model in a cream oversized tee with callouts for the drop-shoulder fit, signature branding and 240 GSM cotton fabric"
                  fill
                  loading="lazy"
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="md:col-span-5 md:col-start-8">
              <Eyebrow>Quality &amp; craftsmanship</Eyebrow>
              <h2 id="quality-title" className="mt-5 font-oswald text-[clamp(34px,6vw,68px)] font-bold uppercase leading-[0.98]">
                Fabric you can feel
              </h2>
              <p className="mt-7 max-w-[46ch] text-[18px] leading-[1.75] text-[#3A3A3A] md:text-[20px]">
                Our tees are cut from custom heavyweight combed cotton at 240 GSM, bio-washed and pre-shrunk, so they keep
                their structure wash after wash.
              </p>
              <dl className="mt-9 grid grid-cols-2 gap-6 border-t-2 border-[#111111] pt-6">
                <div>
                  <dt className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#555555]">Weight</dt>
                  <dd className="mt-1 font-oswald text-[40px] font-bold leading-none">240 GSM</dd>
                </div>
                <div>
                  <dt className="text-[13px] font-bold uppercase tracking-[0.18em] text-[#555555]">Finish</dt>
                  <dd className="mt-1 font-oswald text-[28px] font-bold uppercase leading-[1.1]">Bio-washed, pre-shrunk</dd>
                </div>
              </dl>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. Values */}
      <section aria-labelledby="values-title" className="py-16 md:py-28">
        <Container>
          <Eyebrow>Values</Eyebrow>
          <h2 id="values-title" className="mt-5 max-w-[14ch] font-oswald text-[clamp(36px,7vw,84px)] font-bold uppercase leading-[0.95]">
            What we stand for
          </h2>
          <ol className="mt-12 grid border-t-2 border-[#111111] sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <li key={v.n} className="border-b border-[#E5E5E5] py-8 sm:pr-8 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0">
                <span className="font-oswald text-[15px] font-semibold tracking-[0.2em] text-[#C62828]">{v.n}</span>
                <h3 className="mt-3 font-oswald text-[28px] font-bold uppercase tracking-[0.03em]">{v.title}</h3>
                <p className="mt-3 text-[17px] leading-[1.7] text-[#444444]">{v.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* 7. Closing statement */}
      <section aria-labelledby="closing-title" className="bg-[#C62828] text-white">
        <Container className="py-20 md:py-32">
          <h2 id="closing-title" className="max-w-[12ch] font-oswald text-[clamp(48px,12vw,168px)] font-bold uppercase leading-[0.88] tracking-[-0.01em]">
            Choose your own direction.
          </h2>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <CtaLink href="/shop" variant="light">Shop the collection</CtaLink>
            <CtaLink href="/contact" variant="dark">Get in touch</CtaLink>
          </div>
        </Container>
      </section>
    </div>
  );
}
