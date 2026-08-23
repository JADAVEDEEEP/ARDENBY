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
  if (placed) return <div className="container-ardenby py-24 text-center"><CheckCircle2 className="h-14 w-14 text-olive mx-auto" /><h1 className="font-display text-4xl font-bold mt-5">Order placed</h1><p className="text-muted-foreground mt-3">Thank you for shopping with ARDENBY.</p><Link href="/shop" className="inline-block mt-7 rounded-xl bg-ink text-cream px-6 py-3 font-semibold">Continue shopping</Link></div>;
  if (!items.length) return <div className="container-ardenby py-24 text-center"><h1 className="font-display text-4xl font-bold">Your cart is empty</h1><Link href="/shop" className="inline-block mt-7 rounded-xl bg-ink text-cream px-6 py-3 font-semibold">Shop now</Link></div>;
  return <div className="container-ardenby py-12"><Link href="/cart" className="inline-flex items-center gap-2 text-sm text-ink-soft"><ArrowLeft className="h-4 w-4" /> Back to cart</Link><h1 className="font-display text-4xl font-bold mt-7">Checkout</h1><form onSubmit={(event) => { event.preventDefault(); clearCart(); setPlaced(true); }} className="grid lg:grid-cols-[1fr_360px] gap-10 mt-10"><div className="space-y-5"><h2 className="font-display text-2xl font-bold">Delivery details</h2>{[['name','Full name'],['phone','Phone number'],['address','Address'],['city','City'],['pincode','Pincode']].map(([name, label]) => <input key={name} name={name} required placeholder={label} className="w-full rounded-xl border border-border bg-transparent px-4 py-3.5 focus:outline-none focus:border-olive" />)}<h2 className="font-display text-2xl font-bold pt-5">Payment</h2><select className="w-full rounded-xl border border-border bg-transparent px-4 py-3.5"><option>Cash on delivery</option><option>UPI / Card at delivery</option></select></div><aside className="rounded-2xl bg-muted p-6 h-fit"><h2 className="font-display text-2xl font-bold">Order total</h2><div className="flex justify-between mt-6"><span>{items.length} item(s)</span><strong>{formatINR(total)}</strong></div><button type="submit" className="w-full rounded-xl bg-ink text-cream py-4 mt-7 font-semibold">Place order</button></aside></form></div>;
}
