'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ShieldCheck, Truck, CreditCard, ShoppingBag } from 'lucide-react';
import { useCartStore, getCartSubtotal } from '@/store/cart-store';
import { formatINR } from '@/lib/format';

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [placed, setPlaced] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const total = getCartSubtotal(items);

  if (placed) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 flex items-center justify-center py-20 px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full bg-white border border-stone-200/80 rounded-2xl p-8 sm:p-12 text-center shadow-sm"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 stroke-[1.5]" />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
            Order Confirmation
          </span>
          <h1 className="font-serif text-3xl font-normal text-neutral-900 mt-1 mb-3">
            Order Placed
          </h1>

          <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed mb-8">
            Thank you for shopping with ARDENBY. Your order details and tracking link have been dispatched to your email.
          </p>

          <Link
            href="/shop"
            className="w-full inline-flex items-center justify-center py-4 bg-neutral-900 text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-neutral-800 transition-all duration-300 shadow-md"
          >
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 flex items-center justify-center py-20 px-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center border border-dashed border-stone-300 rounded-2xl p-10 bg-white/60"
        >
          <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-6 w-6 text-neutral-400 stroke-[1.5]" />
          </div>
          <h1 className="font-serif text-2xl font-normal text-neutral-900 mb-2">
            Your Cart is Empty
          </h1>
          <p className="text-xs text-neutral-500 mb-6">
            Please add items to your shopping bag before proceeding to checkout.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-neutral-900 text-white text-xs font-semibold uppercase tracking-widest rounded-full hover:bg-neutral-800 transition-all duration-300"
          >
            Shop Now
          </Link>
        </motion.div>
      </div>
    );
  }

  const fields = [
    { name: 'name', label: 'Full name', placeholder: 'e.g. Alexander Pierce' },
    { name: 'phone', label: 'Phone number', placeholder: '+91 98765 43210' },
    { name: 'address', label: 'Address', placeholder: 'House/Flat No., Street Name' },
    { name: 'city', label: 'City', placeholder: 'e.g. Mumbai' },
    { name: 'pincode', label: 'Pincode', placeholder: '400001' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 py-10 lg:py-16">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Navigation Link */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Cart
        </Link>

        <div className="border-b border-stone-200 pb-6 mt-6 mb-10">
          <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-neutral-900">
            Checkout
          </h1>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            clearCart();
            setPlaced(true);
          }}
          className="grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-10 lg:gap-14 items-start"
        >
          {/* Main Delivery & Payment Details */}
          <div className="space-y-10">
            {/* Delivery Section */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-stone-100 pb-4">
                <Truck className="h-4 w-4 text-neutral-500" />
                <h2 className="font-serif text-xl font-normal text-neutral-900">
                  Delivery Details
                </h2>
              </div>

              <div className="grid gap-5">
                {fields.map(({ name, label, placeholder }) => (
                  <div key={name} className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 font-mono">
                      {label} *
                    </label>
                    <input
                      name={name}
                      required
                      placeholder={placeholder}
                      className="w-full rounded-xl border border-stone-300 bg-stone-50/30 px-4 py-3 text-xs sm:text-sm text-neutral-900 placeholder:text-stone-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all duration-200"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-stone-100 pb-4">
                <CreditCard className="h-4 w-4 text-neutral-500" />
                <h2 className="font-serif text-xl font-normal text-neutral-900">
                  Payment Method
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPayment('cod')}
                  className={`flex flex-col p-4 border rounded-xl text-left transition-all duration-200 ${
                    selectedPayment === 'cod'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                      : 'border-stone-300 bg-stone-50/30 text-neutral-700 hover:border-neutral-900'
                  }`}
                >
                  <span className="text-xs font-semibold tracking-wide uppercase">
                    Cash on Delivery
                  </span>
                  <span className={`text-[10px] mt-1 ${selectedPayment === 'cod' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                    Pay in cash upon arrival
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPayment('upi')}
                  className={`flex flex-col p-4 border rounded-xl text-left transition-all duration-200 ${
                    selectedPayment === 'upi'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                      : 'border-stone-300 bg-stone-50/30 text-neutral-700 hover:border-neutral-900'
                  }`}
                >
                  <span className="text-xs font-semibold tracking-wide uppercase">
                    UPI / Card at Delivery
                  </span>
                  <span className={`text-[10px] mt-1 ${selectedPayment === 'upi' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                    Digital payment via POS/QR
                  </span>
                </button>
              </div>

              {/* Fixed hidden select element using onChange */}
              <select className="sr-only" value={selectedPayment === 'cod' ? 'Cash on Delivery' : 'UPI / Card at Delivery'} onChange={() => {}}>
                <option>Cash on Delivery</option>
                <option>UPI / Card at Delivery</option>
              </select>
            </div>
          </div>

          {/* Sticky Summary & Items Overview Sidebar */}
          <aside className="lg:sticky lg:top-28 space-y-6">
            <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="font-serif text-xl font-normal text-neutral-900 border-b border-stone-100 pb-4">
                Order Summary
              </h2>

              {/* Items List Mini Preview */}
              <div className="max-h-60 overflow-y-auto divide-y divide-stone-100 my-4 pr-1">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.size}-${item.color}`} className="py-3 flex items-center gap-3">
                    <div className="w-12 h-14 rounded bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-medium text-neutral-900 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                        Qty: {item.quantity} · Size: {item.size}
                      </p>
                    </div>
                    <span className="text-xs font-semibold font-mono text-neutral-900">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-200/80 pt-4 space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Items Count</span>
                  <span className="font-semibold text-neutral-900 font-mono">
                    {items.reduce((acc, item) => acc + item.quantity, 0)} unit(s)
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-emerald-700 uppercase tracking-wider text-[10px] font-mono">
                    Complimentary
                  </span>
                </div>
              </div>

              <div className="border-t border-stone-200/80 mt-5 pt-4 flex justify-between items-baseline">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">Total Payable</span>
                <strong className="text-xl font-bold text-neutral-900 font-mono tracking-tight">
                  {formatINR(total)}
                </strong>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white py-4 mt-6 font-semibold text-xs uppercase tracking-widest hover:bg-neutral-800 transition-all duration-300 shadow-md active:scale-[0.99]"
              >
                Place Order
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-neutral-400 uppercase tracking-wider border-t border-stone-100 pt-4">
                <ShieldCheck className="h-3.5 w-3.5 text-neutral-500" />
                256-Bit Encrypted Secure Checkout
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}