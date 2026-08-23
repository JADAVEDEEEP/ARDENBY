'use client';

import { Megaphone } from 'lucide-react';

const messages = [
  'FREE SHIPPING ABOVE ₹999',
  'BUY 3 FOR ₹1199',
  'NEW ARRIVALS DROPPED',
  'LIMITED EDITION — ECLIPSE HOODIE',
  'USE CODE ARDENBY10 FOR 10% OFF',
];

export function AnnouncementBar() {
  const repeated = [...messages, ...messages, ...messages, ...messages];
  return (
    <div className="bg-ink text-cream py-2.5 overflow-hidden border-b border-ink-soft">
      <div className="marquee-track gap-12">
        {repeated.map((msg, i) => (
          <div key={i} className="flex items-center gap-3 whitespace-nowrap">
            <Megaphone className="h-3.5 w-3.5 text-sand" />
            <span className="text-xs font-medium tracking-[0.2em] uppercase">{msg}</span>
            <span className="text-sand">/</span>
          </div>
        ))}
      </div>
    </div>
  );
}
