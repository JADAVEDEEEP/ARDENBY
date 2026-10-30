'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Heart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { useProfile } from '../../hooks/use-profile';
import { apiUrl } from '@/lib/api-url';
import { normalizeApiProduct } from '@/lib/home-products';
import type { ApiProduct } from '@/lib/home-products';
import { useWishlistStore } from '@/store/wishlist-store';
import { WishlistCard, defaultSize, type ProductDetail } from '../../app/wishlist/wishlist-card';
import { EmptyPanel, SectionTitle } from './metal';

type ProfileState = ReturnType<typeof useProfile>;

export function WishlistSection({ profile }: { profile: ProfileState }) {
  const { items, remove, clear, syncFromApi } = useWishlistStore();

  const [details, setDetails] = useState<Record<string, ProductDetail>>({});
  const [chosenSizes, setChosenSizes] = useState<Record<string, string>>({});
  const [removing, setRemoving] = useState<string[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const requested = useRef(new Set<string>());

  // Keep the shared wishlist store fresh for the signed-in customer.
  useEffect(() => {
    void syncFromApi().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The wishlist only stores id/slug/price, so sizes and stock come from the product API.
  useEffect(() => {
    items.forEach((item) => {
      if (!item.slug || requested.current.has(item.productId)) return;
      requested.current.add(item.productId);

      fetch(apiUrl(`/api/products/${encodeURIComponent(item.slug)}`), { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then((data) => {
          const raw: ApiProduct | undefined = data?.product ?? data?.data?.product;
          if (!raw?.id) throw new Error('Unexpected product response');
          setDetails((d) => ({ ...d, [item.productId]: normalizeApiProduct(raw) }));
        })
        .catch(() => setDetails((d) => ({ ...d, [item.productId]: null })));
    });
  }, [items]);

  const sizeFor = (productId: string) => {
    const product = details[productId];
    return chosenSizes[productId] ?? (product ? defaultSize(product) : undefined);
  };

  const removeItem = (productId: string) => {
    setRemoving((r) => [...r, productId]);
    window.setTimeout(async () => {
      try {
        await remove(productId);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to remove from wishlist.');
      } finally {
        setRemoving((r) => r.filter((id) => id !== productId));
      }
    }, 200);
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      await clear();
      setConfirmClear(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to clear wishlist.');
    } finally {
      setClearing(false);
    }
  };

  const count = items.length;

  return (
    <section>
      <SectionTitle
        title={count ? `Wishlist · ${count} ${count === 1 ? 'piece' : 'pieces'} saved` : 'Wishlist'}
        sub="Pieces you've saved for later."
        action={
          count > 0 && !confirmClear && (
            <button type="button" onClick={() => setConfirmClear(true)} className="kv-btn-ghost kv-btn-sm">
              <Trash2 className="h-4 w-4" /> Clear wishlist
            </button>
          )
        }
      />

      {confirmClear && (
        <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-[#E5E5E5] bg-[#F5F5F5] px-4 py-4">
          <div>
            <p className="text-[17px] font-bold text-[#111111]">Remove all pieces?</p>
            <p className="text-[15px] text-[#666666]">This can&apos;t be undone.</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setConfirmClear(false)} disabled={clearing} className="kv-btn-ghost kv-btn-sm">
              Keep items
            </button>
            <button type="button" onClick={() => void clearAll()} disabled={clearing} className="kv-btn-danger kv-btn-sm">
              {clearing ? 'Clearing…' : 'Yes, clear all'}
            </button>
          </div>
        </div>
      )}

      {count === 0 ? (
        <EmptyPanel
          icon={Heart}
          title="Nothing saved yet"
          text="Save pieces you love and they will appear here."
          action={
            <button type="button" onClick={() => profile.router.push('/shop')} className="kv-btn-primary">
              Continue shopping <ArrowRight className="h-4 w-4" />
            </button>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-5 xl:grid-cols-3">
          {items.map((item) => (
            <WishlistCard
              key={item.productId}
              item={item}
              product={details[item.productId]}
              size={sizeFor(item.productId)}
              removing={removing.includes(item.productId)}
              onSize={(size) => setChosenSizes((s) => ({ ...s, [item.productId]: size }))}
              onRemove={() => removeItem(item.productId)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
