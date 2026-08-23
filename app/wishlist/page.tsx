'use client';

import Link from 'next/link';
import { Heart, Trash2 } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlist-store';
import { formatINR } from '@/lib/format';

export default function WishlistPage() {
  const { items, remove, clear } = useWishlistStore();
  return <div className="container-ardenby py-12"><div className="flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-olive font-semibold">Your collection</p><h1 className="font-display text-4xl font-bold mt-2">Wishlist</h1></div>{items.length > 0 && <button onClick={clear} className="text-sm text-destructive">Clear all</button>}</div>{items.length === 0 ? <div className="text-center py-24"><Heart className="h-12 w-12 mx-auto text-muted-foreground" /><p className="mt-4 text-muted-foreground">Your wishlist is empty.</p><Link href="/shop" className="inline-block mt-6 rounded-xl bg-ink text-cream px-6 py-3 font-semibold">Explore the shop</Link></div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">{items.map((item) => <div key={item.productId} className="relative"><Link href={`/product/${item.slug}`}><div className="aspect-[4/5] rounded-2xl overflow-hidden bg-muted"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div><h2 className="font-medium mt-3">{item.name}</h2><p className="font-bold mt-1">{formatINR(item.price)}</p></Link><button aria-label={`Remove ${item.name}`} onClick={() => remove(item.productId)} className="absolute top-3 right-3 rounded-full bg-cream p-2"><Trash2 className="h-4 w-4" /></button></div>)}</div>}</div>;
}
