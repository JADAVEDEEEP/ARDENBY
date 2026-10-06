'use client';



import Link from 'next/link';

import { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { Minus, Plus, ShoppingBag, Trash2, ArrowRight, ArrowLeft, Truck, RotateCcw, Tag } from 'lucide-react';

import { useCartStore, getCartSubtotal, getCartSavings } from '@/store/cart-store';

import { formatINR } from '@/lib/format';
import { toast } from 'sonner';





const GOLD_SURFACE =

  'bg-[linear-gradient(135deg,#B8903A_0%,#E6CF92_48%,#C9A24B_100%)] text-[#0A0A0A]';





type CouponBoxProps = {

  appliedCode?: string | null;

  onApply?: (code: string) => void | Promise<void>;

  onRemove?: () => void;

};



function CouponBox({ appliedCode, onApply, onRemove }: CouponBoxProps) {

  const [code, setCode] = useState('');

  if (!onApply) return null;



  return (

    <div className="border-t border-[#C9A24B]/20 mt-6 pt-5">

      <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#E6CF92] mb-3">

        <Tag className="h-3.5 w-3.5 stroke-[1.5]" /> Coupon code

      </p>



      {appliedCode ? (

        <div className="flex items-center justify-between rounded-lg border border-[#C9A24B]/40 bg-[#C9A24B]/5 px-4 py-3 text-sm">

          <span className="text-[#F3EBDD] font-medium tracking-wider">{appliedCode}</span>

          <button

            type="button"

            onClick={onRemove}

            className="text-xs uppercase tracking-widest text-[#C9A24B] hover:text-[#E6CF92] min-h-[44px] px-2"

          >

            Remove

          </button>

        </div>

      ) : (

        <div className="flex gap-2">

          <input

            value={code}

            onChange={(e) => setCode(e.target.value)}

            placeholder="Enter coupon code"

            className="min-w-0 flex-1 h-12 rounded-lg bg-[#0A0A0A] border border-[#C9A24B]/40 px-4 text-sm text-[#F3EBDD] placeholder:text-[#F3EBDD]/35 focus:outline-none focus:border-[#E6CF92] transition-colors"

          />

          <button

            type="button"

            onClick={() => code.trim() && onApply(code.trim())}

            className={`h-12 px-5 rounded-lg text-xs font-bold uppercase tracking-widest ${GOLD_SURFACE} hover:brightness-110 transition active:scale-[0.98]`}

          >

            Apply

          </button>

        </div>

      )}

    </div>

  );

}



export default function CartPage() {

  const { items, updateQuantity, removeItem } = useCartStore();

  const subtotal = getCartSubtotal(items);

  const savings = getCartSavings(items);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);



  return (

    <div className="min-h-screen bg-[#0A0A0A] text-[#F3EBDD] py-8 lg:py-14">

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">

        <header className="pb-5 mb-8 lg:mb-12 border-b border-[#C9A24B]/50">

          <div className="flex items-end justify-between gap-4">

            <div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#F3EBDD]">

                Shopping Bag <span className="text-[#C9A24B] text-2xl sm:text-3xl align-middle">✦</span>

              </h1>

            </div>

            {items.length > 0 && (

              <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#F3EBDD] pb-1.5 whitespace-nowrap">

                {String(itemCount).padStart(2, '0')} {itemCount === 1 ? 'Item' : 'Items'}

              </span>

            )}

          </div>

          <p className="mt-3 text-[10px] sm:text-xs uppercase tracking-[0.22em] text-[#C9A24B]">

            Review your pieces before they become yours

          </p>

        </header>



        {items.length === 0 ? (

          

          <motion.div

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            className="flex flex-col items-center text-center py-20 sm:py-28 rounded-3xl border border-[#C9A24B]/30 bg-[#141210]"

          >

            <div className="w-16 h-16 rounded-full border border-[#C9A24B]/60 flex items-center justify-center mb-6">

              <ShoppingBag className="h-7 w-7 text-[#C9A24B] stroke-[1.5]" />

            </div>

            <h2 className="font-serif text-2xl sm:text-3xl text-[#F3EBDD] mb-2 px-4">Your shopping bag is empty</h2>

            <p className="text-sm text-[#F3EBDD]/60 max-w-sm mb-8 px-6">

              Your next statement piece is waiting.

            </p>

            <Link

              href="/shop"

              className={`inline-flex items-center gap-2 min-h-[48px] px-8 rounded-full text-xs font-bold uppercase tracking-widest ${GOLD_SURFACE} shadow-[0_0_24px_rgba(201,162,75,0.25)] hover:brightness-110 transition`}

            >

              Explore Collections

              <ArrowRight className="h-4 w-4" />

            </Link>

          </motion.div>

        ) : (

          <div className="grid lg:grid-cols-[1.7fr_1fr] gap-8 lg:gap-12 items-start">

            <div className="space-y-4">

              <AnimatePresence>

                {items.map((item) => (

                  <motion.div

                    key={`${item.productId}-${item.size}-${item.color}`}

                    layout

                    initial={{ opacity: 0, y: 8 }}

                    animate={{ opacity: 1, y: 0 }}

                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}

                    transition={{ duration: 0.25 }}

                    className="group flex gap-4 sm:gap-6 rounded-2xl border border-[#C9A24B]/20 bg-[#141210] p-3 sm:p-5 hover:border-[#C9A24B]/55 hover:shadow-[0_0_28px_rgba(201,162,75,0.08)] transition-all duration-300"

                  >

                    <Link href={`/product/${item.slug}`} className="flex-shrink-0">

                      <div className="w-[88px] sm:w-[140px] aspect-[4/5] rounded-xl overflow-hidden bg-[#0A0A0A] border border-[#C9A24B]/40">

                        <img

                          src={item.image}

                          alt={item.name}

                          className="w-full h-full object-cover object-center"

                        />

                      </div>

                    </Link>



                    <div className="flex-1 min-w-0 flex flex-col">

                      <div className="flex items-start justify-between gap-2">

                        <Link

                          href={`/product/${item.slug}`}

                          className="font-medium text-[15px] sm:text-lg leading-snug text-[#F3EBDD] hover:text-[#E6CF92] transition-colors line-clamp-2"

                        >

                          {item.name}

                        </Link>

                        <button

                          aria-label={`Remove ${item.name}`}

                          onClick={() => removeItem(item.productId, item.size, item.color)}

                          className="flex-shrink-0 -mr-2 -mt-2 h-11 w-11 flex items-center justify-center text-[#F3EBDD]/40 hover:text-[#E6CF92] transition-colors"

                        >

                          <Trash2 className="h-[18px] w-[18px] stroke-[1.5]" />

                        </button>

                      </div>



                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[#F3EBDD]/60">

                        <span className="rounded-md border border-[#C9A24B]/25 bg-[#0A0A0A] px-2 py-0.5">

                          Size: {item.size}

                        </span>

                        <span className="h-1 w-1 rounded-full bg-[#C9A24B]" />

                        <span className="rounded-md border border-[#C9A24B]/25 bg-[#0A0A0A] px-2 py-0.5">

                          {item.color}

                        </span>

                      </div>



                      <div className="mt-auto pt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">

                        <div className="flex items-center rounded-full border border-[#C9A24B] bg-[#0A0A0A]">

                          <button

                            aria-label="Decrease quantity"

                            onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}

                            className="h-11 w-11 sm:h-10 sm:w-10 flex items-center justify-center text-[#C9A24B] hover:text-[#E6CF92] transition-colors active:scale-90"

                          >

                            <Minus className="h-4 w-4" />

                          </button>

                          <span className="w-8 text-center text-sm font-semibold text-[#F3EBDD]">{item.quantity}</span>

                          <button

                            aria-label="Increase quantity"

                            onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}

                            className="h-11 w-11 sm:h-10 sm:w-10 flex items-center justify-center text-[#C9A24B] hover:text-[#E6CF92] transition-colors active:scale-90"

                          >

                            <Plus className="h-4 w-4" />

                          </button>

                        </div>



                        <p className="text-lg sm:text-xl font-bold tracking-tight text-[#E6CF92]">

                          {formatINR(item.price * item.quantity)}

                        </p>

                      </div>

                    </div>

                  </motion.div>

                ))}

              </AnimatePresence>

            </div>

            <aside className="lg:sticky lg:top-28 rounded-3xl border border-[#C9A24B]/60 bg-[#141210] p-5 sm:p-8 shadow-[0_0_40px_rgba(201,162,75,0.10)]">

              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#F3EBDD]">

                Order Summary <span className="text-[#C9A24B] text-lg align-middle">✦</span>

              </h2>

              <p className="mt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-[#F3EBDD]/55 pb-5 border-b border-[#C9A24B]/30">

                Final step to wear your essence

              </p>



              <div className="space-y-4 mt-6 text-sm">

                <div className="flex justify-between text-[#F3EBDD]/75">

                  <span>Subtotal</span>

                  <span className="font-semibold text-[#F3EBDD]">{formatINR(subtotal)}</span>

                </div>



                {savings > 0 && (

                  <div className="flex justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-emerald-300/90">

                    <span>You Save</span>

                    <span className="font-semibold">-{formatINR(savings)}</span>

                  </div>

                )}



                <div className="flex justify-between gap-3 text-[#F3EBDD]/60">

                  <span>Estimated Shipping</span>

                  <span className="text-xs text-right text-[#F3EBDD]/50">Calculated at checkout</span>

                </div>

              </div>



              <div className="border-t border-[#C9A24B]/40 mt-6 pt-5 flex justify-between items-end">

                <div>

                  <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F3EBDD]">Total</span>

                  <p className="text-[10px] text-[#F3EBDD]/45 mt-1">Includes all applicable taxes</p>

                </div>

                <strong className="text-3xl sm:text-4xl font-bold tracking-tight text-[#E6CF92]">

                  {formatINR(subtotal)}

                </strong>

              </div>

              <CouponBox />



              <div className="mt-7 space-y-3">

                <Link

                  href="/shop"

                  className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-xl border border-[#C9A24B]/70 text-[#F3EBDD] text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#C9A24B]/10 hover:border-[#E6CF92] transition-colors"

                >

                  <ArrowLeft className="h-4 w-4 text-[#C9A24B]" />

                  Continue Shopping

                </Link>

                <Link

                  href="/checkout"

                  onClick={(e) => {
                    const authToken =
                      typeof window !== 'undefined'
                        ? localStorage.getItem('ardenby_token')
                        : null;

                    if (!authToken) {
                      e.preventDefault();

                      toast.custom(
                        (toastId) => (
                          <div
                            role="status"
                            className="flex w-[min(92vw,420px)] items-start gap-3 rounded-xl border border-[#C9A24B]/70 bg-[#12100D] px-4 py-3.5 text-[#F4EEDD] shadow-[0_14px_40px_rgba(0,0,0,0.45),0_0_24px_rgba(201,162,75,0.16)] backdrop-blur-md"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#C9A24B]/60 bg-[#0A0908] text-[#E8D3A0]">
                              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
                            </div>

                            <div className="min-w-0 flex-1 pt-0.5">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C9A24B]">
                                Login Required
                              </p>

                              <p className="mt-1 text-sm leading-relaxed text-[#F4EEDD]">
                                Please login to your account before checkout.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => toast.dismiss(toastId)}
                              aria-label="Dismiss notification"
                              className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8F8878] transition-colors hover:bg-[#C9A24B]/10 hover:text-[#E8D3A0]"
                            >
                              <span className="text-lg leading-none">×</span>
                            </button>
                          </div>
                        ),
                        { duration: 3500 }
                      );
                    }
                  }}

                  className={`w-full flex items-center justify-center gap-2 min-h-[52px] rounded-xl ${GOLD_SURFACE} text-xs sm:text-sm font-bold uppercase tracking-[0.18em] shadow-[0_0_28px_rgba(201,162,75,0.28)] hover:brightness-110 hover:shadow-[0_0_36px_rgba(201,162,75,0.4)] transition-all duration-300 active:scale-[0.99]`}
                >

                  Proceed to Checkout

                  <ArrowRight className="h-4 w-4" />

                </Link>

              </div>

              <div className="mt-7 pt-5 border-t border-[#C9A24B]/20 grid grid-cols-2 divide-x divide-[#C9A24B]/20 text-center">

                <div className="flex flex-col items-center gap-2 px-2">

                  <Truck className="h-5 w-5 text-[#C9A24B] stroke-[1.25]" />

                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#F3EBDD]/70">Complimentary Shipping</span>

                </div>

                <div className="flex flex-col items-center gap-2 px-2">

                  <RotateCcw className="h-5 w-5 text-[#C9A24B] stroke-[1.25]" />

                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#F3EBDD]/70">7-Day Returns</span>

                </div>

              </div>

            </aside>

          </div>

        )}

      </div>

    </div>

  );

}