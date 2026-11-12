import type { Metadata } from 'next';
import Link from 'next/link';

import { Callout, Container, Eyebrow, PageTitle } from '@/components/info/info-ui';
import { SupportContact } from '@/components/info/support-contact';

export const metadata: Metadata = {
  title: 'Size Guide | KOVENIK',
  description:
    'KOVENIK size guide: garment measurements in inches for tees, hoodies, shirts and bottoms, plus how to measure yourself and how our fits differ.',
  alternates: { canonical: '/size-guide' },
  robots: { index: true, follow: true },
};

// NEEDS APPROVAL: measurements below are draft figures typical for the fits described. Confirm them against
// the actual garment specs before relying on them (see TODO.md).

const TOPS = [
  ['S', '40', '27', '19'],
  ['M', '42', '28', '19.5'],
  ['L', '44', '29', '20'],
  ['XL', '46', '30', '20.5'],
  ['XXL', '48', '31', '21'],
];
const PLUS = [
  ['3XL', '50', '31.5', '21.5'],
  ['4XL', '52', '32', '22'],
  ['5XL', '54', '32.5', '22.5'],
];
const BOTTOMS = [
  ['S', '28', '40', '27'],
  ['M', '30', '41', '28'],
  ['L', '32', '42', '29'],
  ['XL', '34', '43', '30'],
  ['XXL', '36', '44', '31'],
];

function SizeTable({ title, head, rows }: { title: string; head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-left text-[15px]">
        <caption className="mb-3 text-left font-oswald text-[22px] font-semibold uppercase tracking-[0.06em] text-[#111111]">
          {title}
        </caption>
        <thead>
          <tr className="border-b-2 border-[#111111]">
            {head.map((h) => (
              <th key={h} scope="col" className="py-3 pr-4 text-[13px] font-bold uppercase tracking-[0.12em]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-[#E5E5E5]">
              <th scope="row" className="py-3 pr-4 font-bold">
                {r[0]}
              </th>
              {r.slice(1).map((c, i) => (
                <td key={i} className="py-3 pr-4 tabular-nums text-[#444444]">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SizeGuidePage() {
  return (
    <div className="bg-white text-[#111111]">
      <header className="bg-[#F7F5F2]">
        <Container className="py-12 md:py-16">
          <Eyebrow>Help · Fit</Eyebrow>
          <PageTitle className="mt-5">Size guide</PageTitle>
          <p className="mt-6 max-w-[58ch] text-[18px] leading-[1.65] text-[#444444] md:text-[20px]">
            All figures are garment measurements in inches, laid flat. If you are between sizes, go down for a closer
            fit and up for a roomier one.
          </p>
        </Container>
      </header>

      <Container className="space-y-14 py-12 md:py-16">
        <SizeTable title="Tees, shirts and hoodies" head={['Size', 'Chest', 'Length', 'Shoulder']} rows={TOPS} />
        <SizeTable title="Plus size tops" head={['Size', 'Chest', 'Length', 'Shoulder']} rows={PLUS} />
        <SizeTable title="Bottoms" head={['Size', 'Waist', 'Hip', 'Length']} rows={BOTTOMS} />

        <section aria-labelledby="fit-types">
          <h2 id="fit-types" className="font-oswald text-[26px] font-semibold uppercase tracking-[0.06em]">
            How our fits differ
          </h2>
          <dl className="mt-5 grid gap-6 md:grid-cols-3">
            {[
              ['Oversized', 'Boxy body, dropped shoulder and extra length. Most customers keep their usual size for the intended look.'],
              ['Regular', 'A classic straight cut that follows the body without clinging. True to size.'],
              ['Relaxed', 'Roomier than regular but less exaggerated than oversized. Easy movement and clean drape.'],
            ].map(([t, d]) => (
              <div key={t}>
                <dt className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#D7261E]">{t}</dt>
                <dd className="mt-2 text-[16px] leading-[1.6] text-[#444444]">{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Callout>
          Not sure which size to pick? <SupportContact /> with your height and usual size and we will help. Items can be
          returned or exchanged under our <Link href="/returns">returns policy</Link>.
        </Callout>
      </Container>
    </div>
  );
}
