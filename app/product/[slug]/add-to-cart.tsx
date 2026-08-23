'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import type { Product, ProductColor, ProductSize } from '@/types';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';

export function AddToCart({ product }: { product: Product }) {
  const [size, setSize] = useState<ProductSize>('M');
  const [color, setColor] = useState<ProductColor>(product.colors[0]);
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div className="mt-8 space-y-5">
      <div><p className="text-sm font-semibold mb-2">Size</p><div className="flex gap-2">{product.sizes.map((item) => <button key={item} onClick={() => setSize(item)} className={`h-10 w-12 rounded-lg border text-sm ${size === item ? 'bg-ink text-cream border-ink' : 'border-border'}`}>{item}</button>)}</div></div>
      <div><p className="text-sm font-semibold mb-2">Color: {color}</p><div className="flex gap-2 flex-wrap">{product.colors.map((item) => <button key={item} onClick={() => setColor(item)} className={`px-3 py-2 rounded-lg border text-sm ${color === item ? 'bg-ink text-cream border-ink' : 'border-border'}`}>{item}</button>)}</div></div>
      <button onClick={() => { addItem({ productId: product.id, slug: product.slug, name: product.name, image: product.images[0], size, color, price: product.price, mrp: product.mrp }); toast.success('Added to cart'); }} className="w-full rounded-xl bg-ink text-cream py-4 font-semibold flex items-center justify-center gap-2 hover:bg-ink-soft"><ShoppingBag className="h-5 w-5" /> Add to cart</button>
    </div>
  );
}
