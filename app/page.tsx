'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, Truck, ShieldCheck, RefreshCw, Quote, ArrowUpRight } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { products, categories, heroSlides, editorialBanners } from '@/lib/data';

export default function HomePage() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((s) => (s + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const bestSellers = products.filter((p) => p.bestSeller).slice(0, 8);
  const newArrivals = products.filter((p) => p.newArrival).slice(0, 4);
  const trending = products.filter((p) => p.trending).slice(0, 4);

  return (
    <div className="flex flex-col bg-[#FAF9F6] text-[#121212] selection:bg-neutral-900 selection:text-white antialiased">
      
      {/* HERO SECTION */}
      <section className="relative h-[82vh] sm:h-[88vh] lg:h-[93vh] min-h-[600px] w-full overflow-hidden bg-[#0D0D0D]">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
            className="absolute inset-0"
          >
            <img
              src={heroSlides[slide].image}
              alt={heroSlides[slide].headline}
              className="w-full h-full object-cover opacity-75 object-center brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/30 to-black/20" />
          </motion.div>
        </AnimatePresence>

        <div className="relative h-full max-w-[1480px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-col justify-end pb-14 sm:pb-20 lg:pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-3xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="h-px w-8 bg-[#D4C5B9]/60" />
                <p className="text-[#D4C5B9] text-[11px] sm:text-xs font-semibold tracking-[0.35em] uppercase">
                  {heroSlides[slide].sub}
                </p>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-normal text-[#FAF9F6] leading-[0.98] tracking-tight mb-8 text-balance">
                {heroSlides[slide].headline}
              </h1>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href={heroSlides[slide].href}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#FAF9F6] text-[#0D0D0D] rounded-full text-xs font-semibold tracking-widest uppercase overflow-hidden transition-all duration-300 hover:bg-[#E8E4DC] hover:shadow-2xl"
                >
                  <span>{heroSlides[slide].cta}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center px-8 py-4 border border-white/20 text-[#FAF9F6] rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-white/10 hover:border-white/40 transition-all duration-300 backdrop-blur-xs"
                >
                  EXPLORE COLLECTION
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-8 right-6 lg:right-12 flex items-center gap-3 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === slide ? 'w-10 bg-[#FAF9F6]' : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="w-full bg-[#F3F1EC] pt-16 pb-20 border-b border-stone-200/80">
        <div className="max-w-[1480px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="text-center max-w-lg mx-auto mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Ardenby Standards</span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 uppercase font-serif mt-1">
              WHY ARDENBY
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-2 font-light tracking-wide">
              Crafted for everyday premium essentials.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { Icon: Truck, title: 'Free Shipping', desc: 'Free delivery on all orders above ₹999.' },
              { Icon: RefreshCw, title: 'Easy Returns', desc: 'Hassle-free 7-day return and exchange policy.' },
              { Icon: ShieldCheck, title: 'Safe Payment', desc: '100% protected and secure checkout process.' },
              { Icon: Star, title: 'Premium Quality', desc: 'Crafted with 240 GSM heavyweight premium cotton.' },
            ].map(({ Icon, title, desc }) => (
              <div 
                key={title} 
                className="group flex flex-col items-center text-center p-8 rounded-xl bg-white/80 backdrop-blur-xs border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="mb-5 p-3.5 rounded-full bg-[#FAF9F6] border border-stone-200 text-neutral-900 group-hover:scale-110 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                  <Icon className="h-5 w-5 stroke-[1.5]" />
                </div>
                <h3 className="text-xs font-bold tracking-widest text-neutral-900 uppercase mb-2">
                  {title}
                </h3>
                <p className="text-xs text-neutral-500 font-normal leading-relaxed max-w-[210px]">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="max-w-[1480px] mx-auto w-full px-5 sm:px-8 lg:px-12 py-20 lg:py-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-stone-200/80 pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Curated Silhouettes</span>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900 mt-1"
            >
              Shop by Category
            </motion.h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 md:mt-0 font-light max-w-xs">
            Find your fit. Every collection, every style.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {categories.slice(0, 4).map((cat, i) => {
            const catProduct = products.find((p) => p.category === cat.slug);
            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <Link href={`/shop?category=${cat.slug}`} className="group block h-full">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-neutral-200 border border-black/5">
                    {catProduct && (
                      <img
                        src={catProduct.images[0]}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-85 group-hover:opacity-95 transition-opacity duration-300" />
                    
                    <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-end text-white">
                      <p className="text-[10px] font-mono tracking-widest text-stone-300 uppercase mb-1">{cat.desc}</p>
                      <h3 className="font-serif text-xl sm:text-2xl font-normal tracking-wide text-white mb-3">
                        {cat.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-stone-200 group-hover:text-white transition-colors">
                        <span>Shop Now</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* EDITORIAL BANNER */}
      <section className="max-w-[1480px] mx-auto w-full px-5 sm:px-8 lg:px-12 pb-20 lg:pb-28">
        <Link href="/shop?category=supreme-edition" className="group block relative h-[400px] sm:h-[480px] lg:h-[540px] rounded-xl overflow-hidden bg-neutral-900 border border-black/10 shadow-2xl">
          <img
            src={editorialBanners.supreme}
            alt="Supreme Edition"
            className="w-full h-full object-cover opacity-80 transition-transform duration-1000 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
          
          <div className="absolute inset-0 flex items-center">
            <div className="p-8 sm:p-14 lg:p-20 max-w-xl text-white">
              <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-semibold tracking-[0.25em] uppercase text-stone-200 rounded-full mb-4">
                Limited Drop
              </span>
              <h2 className="font-serif text-4xl sm:text-6xl font-normal text-white leading-tight mb-4">
                Supreme Edition
              </h2>
              <p className="text-stone-300 mb-8 text-xs sm:text-sm lg:text-base leading-relaxed font-light">
                Heavyweight 240 GSM oversized cotton. Built to last, designed to stand out.
              </p>
              <span className="inline-flex items-center gap-3 px-8 py-4 bg-white text-neutral-900 rounded-full text-xs font-semibold tracking-widest uppercase transition-all duration-300 group-hover:bg-[#E8E4DC]">
                Shop the Drop <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* BEST SELLERS */}
      <section className="max-w-[1480px] mx-auto w-full px-5 sm:px-8 lg:px-12 pb-20 lg:pb-28">
        <div className="flex items-end justify-between mb-10 border-b border-stone-200/80 pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Community Favorites</span>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900 mt-1"
            >
              Best Sellers
            </motion.h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-light">Most loved by the ARDENBY fam</p>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-900 hover:text-neutral-500 transition-colors"
          >
            <span>View All</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {bestSellers.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="w-full bg-[#EFECE6] py-20 lg:py-28 border-y border-stone-200/80">
        <div className="max-w-[1480px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-end justify-between mb-10 border-b border-stone-300/60 pb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Fresh Release</span>
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900 mt-1"
              >
                New Arrivals
              </motion.h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-light">Fresh drops just landed</p>
            </div>
            <Link
              href="/shop"
              className="hidden sm:inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-900 hover:text-neutral-500 transition-colors"
            >
              <span>View All</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {newArrivals.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* TRENDING COLLECTION */}
      <section className="max-w-[1480px] mx-auto w-full px-5 sm:px-8 lg:px-12 py-20 lg:py-28">
        <div className="text-center max-w-lg mx-auto mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">On The Radar</span>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900 mt-1"
          >
            Trending Collection
          </motion.h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 font-light">What everyone is wearing right now</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {trending.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* WHY ARDENBY */}
      <section className="w-full bg-[#0D0D0D] text-[#FAF9F6] py-20 lg:py-28">
        <div className="max-w-[1480px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="text-center max-w-lg mx-auto mb-16">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Brand Philosophy</span>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-white mt-1"
            >
              Why ARDENBY
            </motion.h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2 font-light">Crafted with intention. Built for the bold.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/10 pt-12">
            {[
              {
                num: '01',
                title: 'Premium Fabrics',
                desc: '240 GSM heavyweight combed cotton. Pre-shrunk, bio-washed, and built to hold its shape wash after wash.',
              },
              {
                num: '02',
                title: 'Original Designs',
                desc: 'Every print is an original ARDENBY creation. No copies, no shortcuts — just bold, original artwork.',
              },
              {
                num: '03',
                title: 'Perfect Fit',
                desc: 'Engineered oversized silhouettes with drop-shoulder construction. Designed to drape, not hang.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="p-8 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <span className="font-serif text-4xl font-light text-neutral-600 block mb-6">{item.num}</span>
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-white mb-3">{item.title}</h3>
                <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="max-w-[1480px] mx-auto w-full px-5 sm:px-8 lg:px-12 py-20 lg:py-28">
        <div className="text-center max-w-lg mx-auto mb-16">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Testimonials</span>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900 mt-1 mb-3"
          >
            What Our Fam Says
          </motion.h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-xs text-neutral-500 font-medium">4.8/5 from 2,500+ reviews</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              name: 'Aarav Sharma',
              role: 'Verified Buyer',
              text: 'The Phantom Beige Oversized Tee is the best tee I have owned. The fabric weight is incredible and the fit is perfect. Worth every rupee.',
            },
            {
              name: 'Karan Patel',
              role: 'Verified Buyer',
              text: 'Bought the Eclipse Hoodie and I am blown away by the quality. The fleece is thick and warm, and the fit is exactly as shown. ARDENBY is my go-to now.',
            },
            {
              name: 'Vikram Reddy',
              role: 'Verified Buyer',
              text: 'The Savage Black Back Print gets me compliments every time I wear it. The print quality is top-notch and has not faded after 10+ washes.',
            },
          ].map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="p-8 rounded-xl bg-white border border-stone-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between"
            >
              <div>
                <Quote className="h-6 w-6 text-stone-400 mb-4 stroke-[1.5]" />
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-6 font-light">{review.text}</p>
              </div>
              <div className="flex items-center gap-3 border-t border-stone-100 pt-4">
                <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">{review.name}</h4>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider">{review.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* INSTAGRAM GRID */}
      <section className="max-w-[1480px] mx-auto w-full px-5 sm:px-8 lg:px-12 pb-20 lg:pb-28">
        <div className="text-center max-w-lg mx-auto mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900 mb-1"
          >
            @ardenby
          </motion.h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-light">Tag us to be featured. Wear beyond ordinary.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {products.slice(0, 6).map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              className="group relative aspect-square rounded-lg overflow-hidden bg-neutral-200 border border-black/5"
            >
              <img
                src={p.images[0]}
                alt={p.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2 text-center">
                <span className="text-white text-[11px] font-bold uppercase tracking-widest border border-white/40 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-xs">
                  Shop the Look
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}