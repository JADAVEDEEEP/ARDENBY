'use client';

import Link from 'next/link';
import { Instagram, Twitter, Facebook, Youtube, ArrowRight, ChevronDown } from 'lucide-react';
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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success('Welcome to the ARDENBY Fam! Check your inbox for 10% off.');
    setEmail('');
  };

  const toggleAccordion = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <footer className="bg-[#0A0A0A] text-stone-200 border-t border-neutral-800">
      {/* Newsletter Section */}
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 py-16 lg:py-20 border-b border-neutral-900">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-200/80 mb-2 block font-mono">
            Exclusive Privilege
          </span>
          <h2 className="font-serif text-3xl lg:text-5xl font-normal text-white mb-4 tracking-tight">
            Join the ARDENBY Fam
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 font-light mb-8 max-w-lg mx-auto leading-relaxed">
            Get early access to limited drops, runway insights, and 10% off your inaugural order.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full min-w-0 flex-1 px-5 py-3.5 rounded-full bg-neutral-900/90 text-white text-xs sm:text-sm border border-neutral-800 focus:outline-none focus:border-white placeholder:text-neutral-600 transition-colors"
            />
            <button
              type="submit"
              className="w-full sm:w-auto shrink-0 px-8 py-3.5 rounded-full bg-white text-neutral-900 text-xs font-semibold uppercase tracking-widest hover:bg-stone-200 transition-all duration-300 flex items-center justify-center gap-2 group shadow-md"
            >
              Subscribe
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>

      {/* Main Links Grid */}
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand Bio */}
          <div className="md:col-span-2 space-y-4 pr-0 md:pr-6">
            <Link href="/" className="inline-block select-none group">
              <div className="flex flex-col leading-none">
                <span
                  className="text-2xl lg:text-3xl font-bold uppercase tracking-[-0.08em] text-white"
                  style={{ fontFamily: 'Didot, Bodoni MT, serif' }}
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
            <p className="text-xs sm:text-sm text-neutral-400 font-light max-w-sm leading-relaxed">
              Premium men's clothing crafted for the bold. High-density fabrics, relaxed cuts, and minimalist luxury aesthetics.
            </p>
            {/* Social Links */}
            <div className="flex gap-3 pt-2">
              {[
                { Icon: Instagram, href: '#' },
                { Icon: Twitter, href: '#' },
                { Icon: Facebook, href: '#' },
                { Icon: Youtube, href: '#' },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all duration-300"
                >
                  <Icon className="h-4 w-4 stroke-[1.5]" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav Column Accordions (Mobile) / Dynamic Columns (Desktop) */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="border-b border-neutral-900 md:border-none pb-4 md:pb-0">
              {/* Mobile Accordion Trigger */}
              <button
                onClick={() => toggleAccordion(title)}
                className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-white mb-0 md:mb-5 text-left md:pointer-events-none"
              >
                <span>{title}</span>
                <ChevronDown
                  className={`h-4 w-4 text-neutral-500 transition-transform duration-300 md:hidden ${
                    openSections[title] ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Links List */}
              <ul
                className={`space-y-3 mt-3 md:mt-0 transition-all duration-300 overflow-hidden ${
                  openSections[title] ? 'max-h-64 opacity-100' : 'max-h-0 md:max-h-none opacity-0 md:opacity-100'
                }`}
              >
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm text-neutral-400 hover:text-white transition-colors duration-200 font-light"
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

      {/* Infinite Marquee Ticker */}
      <div className="border-t border-b border-neutral-900 py-4 overflow-hidden bg-black/40">
        <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-10">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="flex items-center gap-10 whitespace-nowrap">
              <span className="font-serif text-lg sm:text-2xl font-normal tracking-widest text-neutral-400">
                {marqueeText}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-200/40" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-neutral-500 font-mono">
          <p>© 2026 ARDENBY. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-neutral-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-neutral-300 transition-colors">
              Terms of Service
            </Link>
            <Link href="/admin" className="hover:text-neutral-300 transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}