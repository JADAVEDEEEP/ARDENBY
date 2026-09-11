'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2, Tag, Truck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useCartStore, getCartSubtotal, getCartSavings } from '@/store/cart-store';
import { coupons } from '@/lib/data';
import { formatINR } from '@/lib/format';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { toast } from 'sonner';

const FREE_SHIP_THRESHOLD = 999;
const TIER_THRESHOLD = 3450;
const TIER_DISCOUNT = 10;

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={closeCart}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] bg-cream z-[60] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                <h2 className="font-display text-lg font-bold">
                  Cart {items.length > 0 && `(${items.length})`}
                </h2>
              </div>
              <button onClick={closeCart} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold mb-1">Your cart is empty</h3>
                  <p className="text-sm text-muted-foreground">Add some pieces to get started</p>
                </div>
                <Link
                  href="/shop"
                  onClick={closeCart}
                  className="px-6 py-3 bg-ink text-cream rounded-full text-sm font-semibold hover:bg-ink-soft transition-colors"
                >
                  Shop Now
                </Link>
              </div>
            ) : (
              <>
                {/* Progress bar */}
                {remaining > 0 && (
                  <div className="p-4 bg-sand/20 border-b border-border">
                    <p className="text-xs text-ink-soft mb-2">
                      Spend <span className="font-bold">{formatINR(remaining)}</span> more to unlock{' '}
                      <span className="font-bold">{TIER_DISCOUNT}% OFF</span>
                    </p>
                    <Progress value={tierProgress} className="h-2" />
                  </div>
                )}
                {remaining <= 0 && !couponCode && (
                  <div className="p-4 bg-olive/10 border-b border-border">
                    <p className="text-xs font-medium text-olive">
                      You unlocked 10% OFF! Use code ARDENBY10
                    </p>
                  </div>
                )}

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.size}-${item.color}`}
                      className="flex gap-3 p-3 bg-white rounded-xl border border-border/50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-24 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium line-clamp-1">{item.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.size} · {item.color}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold">{formatINR(item.price)}</span>
                          <span className="text-xs text-muted-foreground line-through">
                            {formatINR(item.mrp)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 border border-border rounded-full">
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.size, item.color, item.quantity - 1)
                              }
                              className="w-7 h-7 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-medium w-5 text-center">{item.quantity}</span>
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.size, item.color, item.quantity + 1)
                              }
                              className="w-7 h-7 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.productId, item.size, item.color)}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="p-4 border-t border-border">
                  {couponCode ? (
                    <div className="flex items-center justify-between p-3 bg-olive/10 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-olive" />
                        <span className="text-sm font-medium text-olive">{couponCode}</span>
                        <span className="text-xs text-muted-foreground">−{formatINR(discount)}</span>
                      </div>
                      <button
                        onClick={() => {
                          removeCoupon();
                          toast.info('Coupon removed');
                        }}
                        className="text-xs text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Coupon code"
                        className="flex-1 px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:outline-none focus:ring-1 focus:ring-ink"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="px-4 py-2.5 text-sm font-semibold bg-ink text-cream rounded-xl hover:bg-ink-soft transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="p-4 border-t border-border space-y-2 bg-white">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatINR(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-olive">Discount</span>
                      <span className="font-medium text-olive">−{formatINR(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">{shipping === 0 ? 'FREE' : formatINR(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST (5%)</span>
                    <span className="font-medium">{formatINR(gst)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-destructive">You Save</span>
                      <span className="font-medium text-destructive">{formatINR(savings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-lg">{formatINR(total)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-border flex gap-3">
                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="flex-1 py-3 text-center text-sm font-semibold border border-ink rounded-full hover:bg-ink hover:text-cream transition-colors"
                  >
                    View Cart
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="flex-1 py-3 text-center text-sm font-semibold bg-ink text-cream rounded-full hover:bg-ink-soft transition-colors flex items-center justify-center gap-2"
                  >
                    Checkout
                    <ArrowRight className="h-4 w-4" />
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
