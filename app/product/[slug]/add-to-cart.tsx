'use client';

import { useState } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import type { Product, ProductColor, ProductSize } from '@/types';
import { useCartStore } from '@/store/cart-store';
import { toast } from 'sonner';

export function AddToCart({ product }: { product: Product }) {
  const [size, setSize] = useState<ProductSize>('M');
  const [color, setColor] = useState<ProductColor>(product.colors[0]);

  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      size,
      color,
      price: product.price,
      mrp: product.mrp,
    });

    toast.success('Added to cart');
  };

  return (
    <div className="mt-8 space-y-7">
      {/* SIZE */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
              Select Size
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Choose your usual size
            </p>
          </div>

          <button
            type="button"
            className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground underline underline-offset-4 transition-colors hover:text-ink"
          >
            Size Guide
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {product.sizes.map((item) => {
            const selected = size === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setSize(item)}
                aria-pressed={selected}
                className={[
                  'relative h-12 rounded-none border text-xs font-semibold',
                  'tracking-wide transition-all duration-300',
                  'focus:outline-none focus-visible:ring-2',
                  'focus-visible:ring-ink focus-visible:ring-offset-2',
                  selected
                    ? 'border-ink bg-ink text-cream'
                    : 'border-border bg-transparent text-ink hover:border-ink hover:bg-muted/40',
                ].join(' ')}
              >
                {item}

                {selected && (
                  <span className="absolute right-1.5 top-1.5">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* COLOR */}
      <div>
        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
            Color
          </p>

          <p className="mt-1 text-[11px] text-muted-foreground">
            Selected: <span className="font-medium text-ink">{color}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {product.colors.map((item) => {
            const selected = color === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setColor(item)}
                aria-pressed={selected}
                className={[
                  'min-h-11 rounded-none border px-4 py-2.5',
                  'text-[11px] font-medium uppercase tracking-[0.08em]',
                  'transition-all duration-300',
                  'focus:outline-none focus-visible:ring-2',
                  'focus-visible:ring-ink focus-visible:ring-offset-2',
                  selected
                    ? 'border-ink bg-ink text-cream'
                    : 'border-border bg-transparent text-muted-foreground hover:border-ink hover:text-ink',
                ].join(' ')}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* PURCHASE SUMMARY */}
      <div className="border-y border-border py-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Selected
          </span>

          <span className="text-xs font-medium text-ink">
            {color} / {size}
          </span>
        </div>
      </div>

      {/* ADD TO CART */}
      <button
        type="button"
        onClick={handleAddToCart}
        className="
          group relative flex w-full items-center justify-center gap-3
          overflow-hidden rounded-none
          bg-ink px-6 py-4
          text-[11px] font-semibold uppercase tracking-[0.18em]
          text-cream
          transition-all duration-300
          hover:bg-ink-soft
          hover:shadow-[0_14px_30px_rgba(20,20,18,0.14)]
          active:scale-[0.99]
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-ink
          focus-visible:ring-offset-2
        "
      >
        <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-500 group-hover:translate-x-0" />

        <ShoppingBag
          className="relative h-[17px] w-[17px] transition-transform duration-300 group-hover:-translate-y-0.5"
          strokeWidth={1.7}
        />

        <span className="relative">Add to Cart</span>
      </button>

      {/* SMALL TRUST MESSAGE */}
      <p className="text-center text-[10px] leading-relaxed tracking-wide text-muted-foreground">
        Premium packaging · Secure checkout · Easy returns
      </p>
    </div>
  );
}