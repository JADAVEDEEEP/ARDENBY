'use client';



import { motion, AnimatePresence } from 'framer-motion';

import { X, Minus, Plus, ShoppingBag, Trash2, Tag, ArrowRight, ShieldCheck } from 'lucide-react';

import Link from 'next/link';

import { useCartStore, getCartSubtotal, getCartSavings } from '@/store/cart-store';

import { coupons } from '@/lib/data';

import { formatINR } from '@/lib/format';

import { useState, type MouseEvent } from 'react';

import { toast } from 'sonner';



const FREE_SHIP_THRESHOLD = 999;

const TIER_THRESHOLD = 3450;

const TIER_DISCOUNT = 10;



/*
 * Visual tokens (styling only)
 * gold       #C9A24B  warm metallic gold
 * champagne  #E8D3A0  highlights / hover
 * ivory      #F4EEDD  primary text
 * muted      #8F8878  secondary text
 * surface    #0F0E0C / #161411  near-black charcoal
 */

const GOLD_GRADIENT = 'linear-gradient(135deg,#A9812F 0%,#E3C673 48%,#C9A24B 100%)';



export function CartDrawer() {

  const { isOpen, closeCart, items, removeItem, updateQuantity, couponCode, applyCoupon, removeCoupon } = useCartStore();

  const [couponInput, setCouponInput] = useState('');



  const subtotal = getCartSubtotal(items);

  const savings = getCartSavings(items);

  const discount = couponCode

    ? (() => {

        const c = coupons.find((cp) => cp.code === couponCode);

        if (!c) return 0;

        if (subtotal < c.minOrder) return 0;

        if (c.discountType === 'percentage') {

          return Math.min(Math.round((subtotal * c.discountValue) / 100), c.maxDiscount);

        }

        return c.discountValue;

      })()

    : 0;

  const shipping = subtotal >= FREE_SHIP_THRESHOLD || subtotal === 0 ? 0 : 79;

  const gst = Math.round((subtotal - discount) * 0.05);

  const total = subtotal - discount + shipping + gst;



  const tierProgress = Math.min(100, (subtotal / TIER_THRESHOLD) * 100);

  const remaining = TIER_THRESHOLD - subtotal;



  const handleApplyCoupon = () => {

    const code = couponInput.trim().toUpperCase();

    const coupon = coupons.find((c) => c.code === code);

    if (!coupon) {

      toast.error('Invalid coupon code');

      return;

    }

    if (subtotal < coupon.minOrder) {

      toast.error(`Minimum order ${formatINR(coupon.minOrder)} required for ${coupon.code}`);

      return;

    }

    applyCoupon(code);

    toast.success(`Coupon ${coupon.code} applied!`);

    setCouponInput('');

  };



  const focusRing =

    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E8D3A0] focus-visible:ring-offset-0';


  const handleCheckoutClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('ardenby_token')
        : null;

    if (token) {
      closeCart();
      return;
    }

    e.preventDefault();

    toast.custom(
      (toastId) => (
        <div
          role="status"
          className="flex w-[min(92vw,420px)] items-start gap-3 rounded-xl border border-[#C9A24B]/70 bg-[#12100D] px-4 py-3.5 text-[#F4EEDD] shadow-[0_14px_40px_rgba(0,0,0,0.45),0_0_24px_rgba(201,162,75,0.16)] backdrop-blur-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#C9A24B]/60 bg-[#0A0908] text-[#E8D3A0]">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
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
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
      { duration: 3500 }
    );
  };


  return (

    <AnimatePresence>

      {isOpen && (

        <>

          <motion.div

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}

            className="fixed inset-0 bg-black/70 backdrop-blur-[2px] z-[110]"

            onClick={closeCart}

          />

          <motion.div

            initial={{ x: '100%' }}

            animate={{ x: 0 }}

            exit={{ x: '100%' }}

            transition={{ type: 'tween', duration: 0.3 }}

            className="fixed left-0 right-0 bottom-0 top-0 sm:left-auto sm:w-[500px] lg:w-[500px] bg-[#0A0908] text-[#F4EEDD] z-[120] flex flex-col min-h-0 overflow-hidden border-l border-[#C9A24B]/40 shadow-[-24px_0_60px_-20px_rgba(201,162,75,0.18)]"

            role="dialog"

            aria-label="Shopping cart"

          >

            {/* Mobile grab accent */}

            <div className="sm:hidden absolute left-1/2 top-1.5 h-[3px] w-12 -translate-x-1/2 rounded-full" style={{ background: GOLD_GRADIENT }} />



            {/* Header */}

            <div className="flex h-[76px] sm:h-[84px] shrink-0 items-center justify-between border-b border-[#C9A24B]/30 bg-[#0A0908] px-4 sm:px-5 pt-[env(safe-area-inset-top)]">

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#C9A24B]/60 bg-[#12100D]">

                  <ShoppingBag className="h-5 w-5 text-[#C9A24B]" strokeWidth={1.5} />

                </div>

                <div className="min-w-0">

                  <h2 className="font-display text-lg sm:text-xl font-semibold uppercase leading-none tracking-[0.18em] text-[#F4EEDD]">

                    Cart

                  </h2>

                  <p className="mt-1.5 text-[10px] uppercase tracking-[0.22em] text-[#8F8878]">

                    {items.length} {items.length === 1 ? 'Item' : 'Items'}

                  </p>

                </div>

              </div>

              <button

                onClick={closeCart}

                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-transparent text-[#F4EEDD] transition-colors duration-200 hover:border-[#C9A24B]/50 hover:text-[#E8D3A0] ${focusRing}`}

                aria-label="Close cart"

              >

                <X className="h-5 w-5" strokeWidth={1.5} />

              </button>

            </div>



            {items.length === 0 ? (

              <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">

                <div className="flex h-20 w-20 rotate-45 items-center justify-center border border-[#C9A24B]/60 bg-[#12100D]">

                  <ShoppingBag className="h-7 w-7 -rotate-45 text-[#C9A24B]" strokeWidth={1.25} />

                </div>

                <div>

                  <h3 className="font-display text-base font-semibold uppercase tracking-[0.2em] text-[#F4EEDD]">

                    Your cart is empty

                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-[#8F8878]">

                    Nothing here yet.

                    <br />

                    Discover pieces made for your essence.

                  </p>

                </div>

                <Link

                  href="/shop"

                  onClick={closeCart}

                  className={`group inline-flex items-center gap-2 border border-[#C9A24B] px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#E8D3A0] transition-colors duration-200 hover:bg-[#C9A24B] hover:text-[#0A0908] ${focusRing}`}

                >

                  Shop Now

                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />

                </Link>

              </div>

            ) : (

              <>

                {/* Progress (old unlock banner removed intentionally) */}

                {remaining > 0 && (

                  <div className="shrink-0 mx-3 sm:mx-4 mt-3 rounded-md border border-[#C9A24B]/40 bg-[#12100D] px-3.5 py-3">

                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C9A24B]">

                      Unlock your next benefit

                    </p>

                    <p className="mt-1.5 text-[13px] text-[#F4EEDD]">

                      Spend <span className="font-semibold">{formatINR(remaining)}</span> more to unlock{' '}

                      <span className="font-semibold">{TIER_DISCOUNT}% OFF</span>

                    </p>

                    <div className="mt-2.5 flex items-center gap-3">

                      <div

                        className="h-[5px] flex-1 overflow-hidden rounded-full border border-[#C9A24B]/25 bg-black"

                        role="progressbar"

                        aria-valuemin={0}

                        aria-valuemax={100}

                        aria-valuenow={Math.round(tierProgress)}

                      >

                        <div

                          className="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"

                          style={{ width: `${tierProgress}%`, background: GOLD_GRADIENT }}

                        />

                      </div>

                      <span className="text-[11px] font-medium tabular-nums text-[#E8D3A0]">

                        {Math.round(tierProgress)}%

                      </span>

                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-[#8F8878]">

                      <span>{formatINR(remaining)} to go</span>

                      <span className="truncate">

                        {TIER_DISCOUNT}% off on {formatINR(TIER_THRESHOLD)}+

                      </span>

                    </div>

                  </div>

                )}



                {/* Items */}

                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-3 space-y-2.5 overscroll-contain [scrollbar-width:thin] [scrollbar-color:#C9A24B55_transparent]">

                  {items.map((item) => (

                    <div

                      key={`${item.productId}-${item.size}-${item.color}`}

                      className="flex gap-3 rounded-md border border-[#C9A24B]/25 bg-[#12100D] p-2.5 transition-colors duration-200 hover:border-[#C9A24B]/55"

                    >

                      <div className="h-[104px] w-[84px] sm:h-[112px] sm:w-[92px] shrink-0 overflow-hidden rounded-[6px] border border-[#C9A24B]/50 bg-black p-[2px]">

                        {/* eslint-disable-next-line @next/next/no-img-element */}

                        <img

                          src={item.image}

                          alt={item.name}

                          className="h-full w-full rounded-[4px] object-cover"

                        />

                      </div>

                      <div className="flex min-w-0 flex-1 flex-col">

                        <h4 className="line-clamp-1 text-sm font-medium text-[#F4EEDD]">{item.name}</h4>

                        <p className="mt-0.5 truncate text-[11px] text-[#8F8878]">

                          Size: {item.size} · Color: {item.color}

                        </p>

                        <div className="mt-1.5 flex items-baseline gap-2">

                          <span className="text-[15px] font-semibold text-[#D9B65C]">{formatINR(item.price)}</span>

                          <span className="text-xs text-[#6F6a5d] line-through">{formatINR(item.mrp)}</span>

                        </div>

                        <div className="mt-auto flex items-center justify-between pt-2">

                          <div className="flex items-center rounded-full border border-[#C9A24B]/70 bg-black">

                            <button

                              onClick={() =>

                                updateQuantity(item.productId, item.size, item.color, item.quantity - 1)

                              }

                              className={`flex h-8 w-8 items-center justify-center rounded-full text-[#C9A24B] transition-colors duration-150 hover:bg-[#C9A24B]/15 hover:text-[#E8D3A0] active:scale-90 ${focusRing}`}

                              aria-label="Decrease quantity"

                            >

                              <Minus className="h-3.5 w-3.5" />

                            </button>

                            <span className="w-6 text-center text-xs font-medium tabular-nums text-[#F4EEDD]">

                              {item.quantity}

                            </span>

                            <button

                              onClick={() =>

                                updateQuantity(item.productId, item.size, item.color, item.quantity + 1)

                              }

                              className={`flex h-8 w-8 items-center justify-center rounded-full text-[#C9A24B] transition-colors duration-150 hover:bg-[#C9A24B]/15 hover:text-[#E8D3A0] active:scale-90 ${focusRing}`}

                              aria-label="Increase quantity"

                            >

                              <Plus className="h-3.5 w-3.5" />

                            </button>

                          </div>

                          <button

                            onClick={() => removeItem(item.productId, item.size, item.color)}

                            className={`flex h-9 w-9 items-center justify-center rounded-full text-[#8F8878] transition-colors duration-200 hover:text-[#D9B65C] ${focusRing}`}

                            aria-label={`Remove ${item.name}`}

                          >

                            <Trash2 className="h-4 w-4" strokeWidth={1.5} />

                          </button>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>



                {/* Coupon + Summary: scrolls internally when the viewport is short */}

                <div className="shrink-0 max-h-[46vh] overflow-y-auto overscroll-contain bg-[#0A0908] border-t border-[#C9A24B]/30">

                  {/* Coupon */}

                  <div className="px-3 sm:px-4 pt-3">

                    <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C9A24B]">

                      <Tag className="h-3.5 w-3.5" strokeWidth={1.5} />

                      Coupon code

                    </p>

                    {couponCode ? (

                      <div className="flex items-center justify-between gap-2 rounded-md border border-[#C9A24B]/60 bg-[#C9A24B]/10 px-3 py-2.5 transition-colors duration-300">

                        <div className="flex min-w-0 items-center gap-2.5">

                          <Tag className="h-4 w-4 shrink-0 text-[#C9A24B]" strokeWidth={1.5} />

                          <span className="truncate text-sm font-semibold uppercase tracking-[0.12em] text-[#F4EEDD]">

                            {couponCode}

                          </span>

                        </div>

                        <div className="flex shrink-0 items-center gap-1">

                          <span className="text-sm font-medium tabular-nums text-[#D9B65C]">

                            −{formatINR(discount)}

                          </span>

                          <button

                            onClick={() => {

                              removeCoupon();

                              toast.info('Coupon removed');

                            }}

                            className={`flex h-8 w-8 items-center justify-center rounded-full text-[#8F8878] transition-colors hover:text-[#E8D3A0] ${focusRing}`}

                            aria-label="Remove coupon"

                          >

                            <X className="h-4 w-4" />

                          </button>

                        </div>

                      </div>

                    ) : (

                      <div className="flex gap-2">

                        <input

                          value={couponInput}

                          onChange={(e) => setCouponInput(e.target.value)}

                          placeholder="Enter coupon code"

                          className="min-w-0 flex-1 rounded-md border border-[#C9A24B]/40 bg-[#12100D] px-3.5 py-2.5 text-sm text-[#F4EEDD] placeholder:text-[#8F8878] transition-colors duration-200 focus:border-[#E8D3A0] focus:outline-none focus:ring-1 focus:ring-[#E8D3A0]/60"

                        />

                        <button

                          onClick={handleApplyCoupon}

                          className={`shrink-0 rounded-md px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-[#0A0908] transition-[filter] duration-200 hover:brightness-110 active:brightness-95 ${focusRing}`}

                          style={{ background: GOLD_GRADIENT }}

                        >

                          Apply

                        </button>

                      </div>

                    )}

                  </div>



                  {/* Summary */}

                  <div className="mx-3 sm:mx-4 mt-3 rounded-md border border-[#C9A24B]/35 bg-[#12100D] px-3.5 py-3">

                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#F4EEDD]">

                      Order summary

                    </p>

                    <div className="space-y-1.5 text-[13px]">

                      <div className="flex justify-between">

                        <span className="text-[#8F8878]">Subtotal</span>

                        <span className="tabular-nums text-[#F4EEDD]">{formatINR(subtotal)}</span>

                      </div>

                      {discount > 0 && (

                        <div className="flex justify-between">

                          <span className="text-[#C9A24B]">Discount</span>

                          <span className="tabular-nums text-[#D9B65C]">−{formatINR(discount)}</span>

                        </div>

                      )}

                      <div className="flex justify-between">

                        <span className="text-[#8F8878]">Shipping</span>

                        <span className="tabular-nums text-[#F4EEDD]">

                          {shipping === 0 ? 'FREE' : formatINR(shipping)}

                        </span>

                      </div>

                      <div className="flex justify-between">

                        <span className="text-[#8F8878]">GST (5%)</span>

                        <span className="tabular-nums text-[#F4EEDD]">{formatINR(gst)}</span>

                      </div>

                    </div>

                    <div className="mt-3 flex items-baseline justify-between border-t border-[#C9A24B]/40 pt-3">

                      <span className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-[#F4EEDD]">

                        Total

                      </span>

                      <span className="font-display text-2xl font-bold tabular-nums text-[#E3C673]">

                        {formatINR(total)}

                      </span>

                    </div>

                  </div>



                  {savings > 0 && (

                    <div className="mx-3 sm:mx-4 mt-2.5 flex items-center justify-between rounded-md border border-[#C9A24B]/40 bg-[#C9A24B]/10 px-3.5 py-2.5">

                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C9A24B]">

                        You save

                      </span>

                      <span className="text-sm font-semibold tabular-nums text-[#E3C673]">

                        {formatINR(savings)}

                      </span>

                    </div>

                  )}

                  <div className="h-3" />

                </div>



                {/* Actions — always visible */}

                <div className="shrink-0 flex gap-2.5 border-t border-[#C9A24B]/30 bg-[#0A0908] px-3 sm:px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">

                  <Link

                    href="/cart"

                    onClick={closeCart}

                    className={`flex flex-1 items-center justify-center rounded-md border border-[#C9A24B]/70 bg-black py-3.5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#F4EEDD] transition-colors duration-200 hover:border-[#E8D3A0] hover:text-[#E8D3A0] ${focusRing}`}

                  >

                    View Cart

                  </Link>

                  <Link

                    href="/checkout"

                    onClick={handleCheckoutClick}

                    className={`group flex flex-[1.4] items-center justify-center gap-2 rounded-md py-3.5 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#0A0908] shadow-[0_0_24px_-6px_rgba(227,198,115,0.55)] transition-[filter,box-shadow] duration-200 hover:brightness-110 hover:shadow-[0_0_30px_-4px_rgba(227,198,115,0.7)] ${focusRing}`}

                    style={{ background: GOLD_GRADIENT }}

                  >

                    Checkout

                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />

                  </Link>

                </div>

              </>

            )}

          </motion.div>

        </>

      )}

    </AnimatePresence>

  );

}