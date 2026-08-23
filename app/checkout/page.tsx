'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

import { useCartStore, getCartSubtotal } from '@/store/cart-store';
import { formatINR } from '@/lib/format';

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [placed, setPlaced] = useState(false);
  const total = getCartSubtotal(items);

  if (placed) {
    return (
      <div className="container-ardenby py-24 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-olive" />

        <h1 className="font-display mt-5 text-4xl font-bold">
          Order Placed
        </h1>

        <p className="mt-3 text-muted-foreground">
          Thank you for shopping with ARDENBY.
        </p>

        <Link
          href="/shop"
          className="mt-7 inline-block rounded-xl bg-ink px-6 py-3 font-semibold text-cream"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container-ardenby py-24 text-center">
        <h1 className="font-display text-4xl font-bold">
          Your Cart is Empty
        </h1>

        <Link
          href="/shop"
          className="mt-7 inline-block rounded-xl bg-ink px-6 py-3 font-semibold text-cream"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  const fields = [
    ['name', 'Full name'],
    ['phone', 'Phone number'],
    ['address', 'Address'],
    ['city', 'City'],
    ['pincode', 'Pincode'],
  ];

  return (
    <div className="container-ardenby py-12">
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 text-sm text-ink-soft"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      <h1 className="font-display mt-7 text-4xl font-bold">Checkout</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          clearCart();
          setPlaced(true);
        }}
        className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]"
      >
        <div className="space-y-5">
          <h2 className="font-display text-2xl font-bold">
            Delivery Details
          </h2>

          {fields.map(([name, label]) => (
            <input
              key={name}
              name={name}
              required
              placeholder={label}
              className="w-full rounded-xl border border-border bg-transparent px-4 py-3.5 focus:border-olive focus:outline-none"
            />
          ))}

          <h2 className="font-display pt-5 text-2xl font-bold">
            Payment
          </h2>

          <select className="w-full rounded-xl border border-border bg-transparent px-4 py-3.5">
            <option>Cash on Delivery</option>
            <option>UPI / Card at Delivery</option>
          </select>
        </div>

        <aside className="h-fit rounded-2xl bg-muted p-6">
          <h2 className="font-display text-2xl font-bold">
            Order Total
          </h2>

          <div className="mt-6 flex justify-between">
            <span>{items.length} item(s)</span>
            <strong>{formatINR(total)}</strong>
          </div>

          <button
            type="submit"
            className="mt-7 w-full rounded-xl bg-ink py-4 font-semibold text-cream"
          >
            Place Order
          </button>
        </aside>
      </form>
    </div>
  );
}