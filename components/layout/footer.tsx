'use client';

import Link from 'next/link';
import { Instagram, Twitter, Facebook, Youtube, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const footerLinks = {
  Categories: [
    { label: 'Supreme Edition', href: '/shop?category=supreme-edition' },
    { label: 'Epic Thread', href: '/shop?category=epic-thread' },
    { label: 'Ardenby Premium', href: '/shop?category=ardenby-premium' },
    { label: 'The Print Club', href: '/shop?category=the-print-club' },
    { label: 'Bottom Wear', href: '/shop?category=bottom-wear' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Sustainability', href: '/sustainability' },
  ],
  Support: [
    { label: 'Contact Us', href: '/contact' },
    { label: 'Shipping Policy', href: '/shipping' },
    { label: 'Returns & Exchange', href: '/returns' },
    { label: 'FAQs', href: '/faqs' },
    { label: 'Track Order', href: '/orders' },
  ],
};

const marqueeText = 'WEAR BEYOND ORDINARY';

export function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success('Welcome to the ARDENBY Fam! Check your inbox for 10% off.');
    setEmail('');
  };

  return (
    <footer className="bg-ink text-cream">
      {/* Newsletter */}
      <div className="container-ardenby py-16 lg:py-20 border-b border-ink-soft">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-bold mb-3">Join the ARDENBY Fam</h2>
          <p className="text-cream/60 mb-8">
            Get early access to drops, exclusive offers, and 10% off your first order.
          </p>
         <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
  <input
    type="email"
    required
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="Enter your email"
    className="w-full min-w-0 flex-1 px-5 py-3.5 rounded-full bg-ink-soft text-cream border border-ink-soft focus:outline-none focus:border-sand placeholder:text-cream/40"
  />
  <button
    type="submit"
    className="w-full sm:w-auto shrink-0 px-6 py-4 rounded-full bg-cream text-ink font-semibold hover:bg-sand transition-colors flex items-center justify-center gap-2"
  >
    Subscribe
    <ArrowRight className="h-4 w-4" />
  </button>
</form>
        </div>
      </div>

      {/* Links */}
      <div className="container-ardenby py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
           <Link href="/" className="flex items-center gap-2 select-none group">
  <div className="flex flex-col leading-none">
    <span
      className="text-2xl lg:text-3xl font-bold uppercase tracking-[-0.08em] text-white"
      style={{ fontFamily: "Didot, Bodoni MT, serif" }}
    >
      ARDENBY
    </span>

    <div className="mt-1 flex items-center gap-2">
      <div className="h-px w-5 bg-white/40" />
      <span className="text-[8px] uppercase tracking-[0.35em] text-white/80">
        WEAR YOUR ESSENCE
      </span>
      <div className="h-px w-5 bg-white/40" />
    </div>
  </div>
</Link>
            <p className="text-cream/50 text-sm mt-3 max-w-xs">
              Premium men's clothing crafted for the bold. Wear beyond ordinary.
            </p>
            <div className="flex gap-3 mt-5">
              {[
                { Icon: Instagram, href: '#' },
                { Icon: Twitter, href: '#' },
                { Icon: Facebook, href: '#' },
                { Icon: Youtube, href: '#' },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-full bg-ink-soft flex items-center justify-center hover:bg-sand hover:text-ink transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream/50 hover:text-cream transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom marquee */}
      <div className="border-t border-ink-soft py-5 overflow-hidden">
<div className="flex w-max animate-[marquee_36s_linear_infinite] gap-8">
    {Array.from({ length: 32 }).map((_, i) => (
      <span
        key={i}
        className="font-display text-2xl lg:text-3xl font-bold tracking-widest text-cream/80 whitespace-nowrap"
      >
        {marqueeText}
        <span className="text-sand mx-6">/</span>
      </span>
    ))}
  </div>
</div>

      {/* Copyright */}
      <div className="container-ardenby py-6 border-t border-ink-soft">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-cream/40">
          <p>© 2025 ARDENBY. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-cream transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-cream transition-colors">Terms</Link>
            <Link href="/admin" className="hover:text-cream transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
