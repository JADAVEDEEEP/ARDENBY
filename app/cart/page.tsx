'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore, getCartSubtotal, getCartSavings } from '@/store/cart-store';
import { formatINR } from '@/lib/format';

export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCartStore();
  const subtotal = getCartSubtotal(items);
  const savings = getCartSavings(items);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 py-10 lg:py-16">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Page Header */}
        <div className="border-b border-stone-200 pb-6 mb-8 lg:mb-12 flex items-baseline justify-between">
          <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-neutral-900">
            Shopping Bag
          </h1>
          {items.length > 0 && (
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              {items.reduce((acc, item) => acc + item.quantity, 0)} {items.reduce((acc, item) => acc + item.quantity, 0) === 1 ? 'Item' : 'Items'}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 sm:py-32 text-center border border-dashed border-stone-300 rounded-2xl bg-white/60"
          >
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-5">
              <ShoppingBag className="h-7 w-7 text-neutral-400 stroke-[1.5]" />
            </div>
            <h2 className="font-serif text-2xl font-normal text-neutral-900 mb-2">
              Your bag is currently empty
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mb-8 font-light">
              Your cart is waiting for something good. Discover our latest heavyweight drops and signature essentials.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white text-xs font-semibold uppercase tracking-widest rounded-full hover:bg-neutral-800 transition-all duration-300 shadow-md"
            >
              Continue Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : (
          /* Cart Grid */
          <div className="grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-10 lg:gap-14 items-start">
            {/* Items List */}
            <div className="space-y-6">
              <AnimatePresence>
                {items.map((item, idx) => (
                  <motion.div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.03 }}
                    className="flex gap-4 sm:gap-6 border-b border-stone-200/80 pb-6 group"
                  >
                    {/* Product Image */}
                    <Link href={`/product/${item.slug}`} className="flex-shrink-0">
                      <div className="w-24 sm:w-32 aspect-[4/5] rounded-lg overflow-hidden bg-neutral-100 border border-black/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                      <div>
                        <div className="flex justify-between items-start gap-3">
                          <Link
                            href={`/product/${item.slug}`}
                            className="font-medium text-sm sm:text-base text-neutral-900 hover:text-neutral-500 transition-colors line-clamp-1"
                          >
                            {item.name}
                          </Link>

                          {/* Remove Item Trigger */}
                          <button
                            aria-label={`Remove ${item.name}`}
                            onClick={() => removeItem(item.productId, item.size, item.color)}
                            className="text-neutral-400 hover:text-red-600 transition-colors p-1 -mr-1"
                          >
                            <Trash2 className="h-4 w-4 stroke-[1.5]" />
                          </button>
                        </div>

                        {/* Variants */}
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-neutral-500 font-mono">
                          <span className="bg-stone-100 px-2 py-0.5 rounded text-[11px] border border-stone-200/60">
                            Size: {item.size}
                          </span>
                          <span>•</span>
                          <span>{item.color}</span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between mt-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-stone-300 rounded-md bg-white">
                          <button
                            aria-label="Decrease quantity"
                            onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                            className="p-2 sm:px-2.5 text-neutral-600 hover:text-black hover:bg-stone-100 transition-colors rounded-l-md"
                          >
                            <Minus className="h-3.5 w-3.5 stroke-[2]" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold font-mono text-neutral-900">
                            {item.quantity}
                          </span>
                          <button
                            aria-label="Increase quantity"
                            onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                            className="p-2 sm:px-2.5 text-neutral-600 hover:text-black hover:bg-stone-100 transition-colors rounded-r-md"
                          >
                            <Plus className="h-3.5 w-3.5 stroke-[2]" />
                          </button>
                        </div>

                        {/* Item Total Price */}
                        <div className="text-right">
                          <p className="font-semibold text-sm sm:text-base text-neutral-900 tracking-tight">
                            {formatINR(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  ← Continue Browsing
                </Link>
              </div>
            </div>

            {/* Desktop Sticky Order Summary */}
            <aside className="lg:sticky lg:top-28 rounded-2xl bg-white border border-stone-200/80 p-6 sm:p-8 shadow-sm">
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-neutral-900 border-b border-stone-100 pb-4">
                Order Summary
              </h2>

              <div className="space-y-3.5 mt-6 text-xs sm:text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900 font-mono">{formatINR(subtotal)}</span>
                </div>

                {savings > 0 && (
                  <div className="flex justify-between text-emerald-700 bg-emerald-50/70 px-3 py-2 rounded-lg border border-emerald-100">
                    <span className="font-medium">You Save</span>
                    <span className="font-semibold font-mono">-{formatINR(savings)}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-500">
                  <span>Estimated Shipping</span>
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-mono">Calculated at Checkout</span>
                </div>
              </div>

              <div className="border-t border-stone-200/80 mt-6 pt-5 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-semibold uppercase tracking-wider text-neutral-900">Total</span>
                  <p className="text-[10px] text-neutral-400">Includes all applicable taxes</p>
                </div>
                <strong className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight font-mono">
                  {formatINR(subtotal)}
                </strong>
              </div>

              {/* Checkout Button */}
              <Link
                href="/checkout"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white py-4 mt-8 font-semibold text-xs sm:text-sm uppercase tracking-widest hover:bg-neutral-800 transition-all duration-300 shadow-md active:scale-[0.99]"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Link>

              <div className="mt-6 border-t border-stone-100 pt-4 text-center">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400">
                  Complimentary Shipping & 7-Day Returns
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}