'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, Truck, ShieldCheck, RefreshCw, Quote } from 'lucide-react';
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
    <div className="flex flex-col">
      {/* Hero Carousel */}
      <section className="relative h-[70vh] lg:h-[85vh] min-h-[500px] overflow-hidden bg-ink">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroSlides[slide].image}
              alt={heroSlides[slide].headline}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="relative h-full container-ardenby flex flex-col justify-end pb-16 lg:pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl"
            >
              <p className="text-sand text-sm font-medium tracking-[0.3em] uppercase mb-3">
                {heroSlides[slide].sub}
              </p>
              <h1 className="font-display text-5xl lg:text-7xl xl:text-8xl font-bold text-cream leading-[0.95] mb-6 text-balance">
                {heroSlides[slide].headline}
              </h1>
              <div className="flex gap-3">
                <Link
                  href={heroSlides[slide].href}
                  className="px-7 py-3.5 bg-cream text-ink rounded-full text-sm font-semibold hover:bg-sand transition-colors flex items-center gap-2"
                >
                  {heroSlides[slide].cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/shop"
                  className="px-7 py-3.5 border border-cream/40 text-cream rounded-full text-sm font-semibold hover:bg-cream/10 transition-colors"
                >
                  EXPLORE COLLECTION
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Slide indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 lg:left-auto lg:right-8 lg:translate-x-0 flex gap-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === slide ? 'w-8 bg-cream' : 'w-1.5 bg-cream/40'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
   <section className="w-full bg-[#F5F3EF] pt-14 pb-20 border-b border-stone-200 mb-20">
  <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
    {/* Section Header - Vertical spacing reduced by ~40px */}
    <div className="text-center">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 uppercase font-serif">
        WHY ARDENBY
      </h2>
      <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-light tracking-wide">
        Crafted for everyday premium essentials.
      </p>
    </div>

    {/* Badges Grid - Uniform Gap & Spacing */}
    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { 
          Icon: Truck, 
          title: 'Free Shipping', 
          desc: 'Free delivery on all orders above ₹999.' 
        },
        { 
          Icon: RefreshCw, 
          title: 'Easy Returns', 
          desc: 'Hassle-free 7-day return and exchange policy.' 
        },
        { 
          Icon: ShieldCheck, 
          title: 'Safe Payment', 
          desc: '100% protected and secure checkout process.' 
        },
        { 
          Icon: Star, 
          title: 'Premium Quality', 
          desc: 'Crafted with 240 GSM heavyweight premium cotton.' 
        },
      ].map(({ Icon, title, desc }) => (
        <div 
          key={title} 
          className="flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-stone-200/60 shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 ease-in-out"
        >
          {/* Consistent Outline Icon Style (No solid filled background) */}
          <div className="mb-5 text-neutral-900">
            <Icon className="h-7 w-7 stroke-[1.5]" />
          </div>

          {/* Badge Title & Description */}
          <h3 className="text-sm font-semibold tracking-wide text-neutral-900 uppercase mb-2">
            {title}
          </h3>
          <p className="text-xs text-neutral-500 font-light leading-relaxed max-w-[220px]">
            {desc}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>
      {/* Shop by Category */}
      <section className="container-ardenby py-16 lg:py-24">
        <div className="text-center mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl lg:text-5xl font-bold mb-3"
          >
            Shop by Category
          </motion.h2>
          <p className="text-muted-foreground">Find your fit. Every collection, every style.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {categories.slice(0, 4).map((cat, i) => {
            const catProduct = products.find((p) => p.category === cat.slug);
            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/shop?category=${cat.slug}`} className="group block">
                  <div className="relative zoom-container product-aspect rounded-2xl overflow-hidden bg-muted">
                    {catProduct && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={catProduct.images[0]}
                        alt={cat.name}
                        className="w-full h-full object-cover zoom-img"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="font-display text-lg lg:text-xl font-bold text-cream mb-1">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-cream/70 mb-2">{cat.desc}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-sand font-medium group-hover:gap-2 transition-all">
                        Shop Now <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Editorial Banner */}
      <section className="container-ardenby pb-16 lg:pb-24">
        <Link href="/shop?category=supreme-edition" className="group block relative h-[300px] lg:h-[400px] rounded-3xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={editorialBanners.supreme}
            alt="Supreme Edition"
            className="w-full h-full object-cover zoom-img"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/70 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="p-8 lg:p-16 max-w-lg">
              <p className="text-sand text-sm font-medium tracking-[0.3em] uppercase mb-3">Limited Drop</p>
              <h2 className="font-display text-3xl lg:text-5xl font-bold text-cream mb-4">
                Supreme Edition
              </h2>
              <p className="text-cream/70 mb-6 text-sm lg:text-base">
                Heavyweight 240 GSM oversized cotton. Built to last, designed to stand out.
              </p>
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-cream text-ink rounded-full text-sm font-semibold group-hover:bg-sand transition-colors">
                Shop the Drop <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* Best Sellers */}
      <section className="container-ardenby pb-16 lg:pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl lg:text-5xl font-bold"
            >
              Best Sellers
            </motion.h2>
            <p className="text-muted-foreground mt-1">Most loved by the ARDENBY fam</p>
          </div>
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-1 text-sm font-medium hover:text-olive transition-colors"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {bestSellers.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="bg-cream-dark py-16 lg:py-24">
        <div className="container-ardenby">
          <div className="flex items-end justify-between mb-8">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-display text-3xl lg:text-5xl font-bold"
              >
                New Arrivals
              </motion.h2>
              <p className="text-muted-foreground mt-1">Fresh drops just landed</p>
            </div>
            <Link
              href="/shop"
              className="hidden sm:flex items-center gap-1 text-sm font-medium hover:text-olive transition-colors"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {newArrivals.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Collection */}
      <section className="container-ardenby py-16 lg:py-24">
        <div className="text-center mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl lg:text-5xl font-bold mb-3"
          >
            Trending Collection
          </motion.h2>
          <p className="text-muted-foreground">What everyone is wearing right now</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {trending.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* Why Ardenby */}
      <section className="bg-ink text-cream py-16 lg:py-24">
        <div className="container-ardenby">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl lg:text-5xl font-bold mb-3"
            >
              Why ARDENBY
            </motion.h2>
            <p className="text-cream/60">Crafted with intention. Built for the bold.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-ink-soft border border-ink-soft hover:border-sand transition-colors"
              >
                <span className="font-display text-5xl font-bold text-sand/30">{item.num}</span>
                <h3 className="font-display text-xl font-bold mt-4 mb-2">{item.title}</h3>
                <p className="text-cream/60 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="container-ardenby py-16 lg:py-24">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl lg:text-5xl font-bold mb-3"
          >
            What Our Fam Says
          </motion.h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-5 w-5 fill-sand text-sand" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">4.8/5 from 2,500+ reviews</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-white border border-border/50"
            >
              <Quote className="h-8 w-8 text-sand mb-4" />
              <p className="text-sm text-ink-soft leading-relaxed mb-5">{review.text}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-ink text-cream flex items-center justify-center font-bold text-sm">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{review.name}</h4>
                  <p className="text-xs text-muted-foreground">{review.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Instagram */}
      <section className="container-ardenby pb-16 lg:pb-24">
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl lg:text-5xl font-bold mb-3"
          >
            @ardenby
          </motion.h2>
          <p className="text-muted-foreground">Tag us to be featured. Wear beyond ordinary.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {products.slice(0, 6).map((p, i) => (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              className="group relative aspect-square rounded-xl overflow-hidden bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.images[0]}
                alt={p.name}
                className="w-full h-full object-cover zoom-img"
              />
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/40 transition-colors flex items-center justify-center">
                <span className="text-cream opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">
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
