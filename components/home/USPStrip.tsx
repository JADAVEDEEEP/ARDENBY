import { Layers, Shirt, Star } from 'lucide-react';

const ITEMS = [
  { Icon: Layers, text: 'Oversized, relaxed fits' },
  { Icon: Star, text: 'Bold graphic designs' },
  { Icon: Shirt, text: 'Drop-shoulder cut' },
] as const;

export function USPStrip() {
  return (
    <section aria-label="Why KOVENIK" className="w-full bg-kv-band">
      <ul className="kv-gutter grid w-full grid-cols-3 gap-3 py-5 md:py-6">
        {ITEMS.map(({ Icon, text }) => (
          <li key={text} className="flex flex-col items-center gap-2 text-center md:flex-row md:justify-center md:gap-3">
            <Icon className="h-7 w-7 shrink-0 text-kv-gold" strokeWidth={1.4} aria-hidden="true" />
            <span className="text-[12px] font-bold uppercase leading-4 tracking-[0.04em] text-kv-ink md:text-[15px] md:leading-5 md:tracking-[0.06em]">
              {text}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
