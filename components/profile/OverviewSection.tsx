'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Package,
  Heart,
  MapPin,
  Ticket,
  ArrowRight,
  ChevronRight,
  User,
  Mail,
  Phone,
  Lock,
  Pencil,
  Copy,
  Check,
  Truck,
  ShieldCheck,
  ShoppingBag,
  LifeBuoy,
  LogOut,
} from 'lucide-react';
import type { useProfile } from '../../hooks/use-profile';
import { profileRequest, unwrap } from '../../services/profile-api';
import { IconDisc, MetalCard } from './metal';

type ProfileState = ReturnType<typeof useProfile>;

const STEPS = ['Confirmed', 'Packed', 'Shipped', 'Delivered'] as const;
const CLOSED = ['Cancelled', 'Delivered', 'Returned'];

/* ---------- helpers (all derived from real API data) ---------- */

const fmtDate = (raw?: string | null, withYear = false) => {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  });
};

const stepIndex = (status: string) => STEPS.findIndex((s) => s === status);

function statusPill(status: string) {
  const s = status.toLowerCase();
  if (s === 'cancelled' || s === 'canceled')
    return 'border-[#B3261E] bg-[#F4F0E8] text-[#B3261E]';
  if (s === 'shipped') return 'border-[#2B5BA8] bg-[#2B5BA8] text-[#2B5BA8]';
  if (s === 'delivered') return 'border-[#1B7A43] bg-[#EAE5DA] text-[#1B7A43]';
  return 'border-[#B08D57] bg-[#F4F0E8] text-[#8C6D3A]';
}

type Thumb = { image: string | null; name: string | null; count: number };

/** Order list API has no items, so read each shown order's detail from the existing order API. */
function useOrderThumbs(ids: string[]) {
  const [thumbs, setThumbs] = useState<Record<string, Thumb>>({});
  const key = ids.join('|');

  useEffect(() => {
    let alive = true;
    ids.forEach(async (id) => {
      try {
        const data = await profileRequest(`/api/orders/${encodeURIComponent(id)}`);
        const order = unwrap<any>(data, ['order', 'data']);
        const items: any[] = Array.isArray(order?.items) ? order.items : [];
        if (!alive) return;
        setThumbs((t) => ({
          ...t,
          [id]: {
            image: items[0]?.product_image || null,
            name: items[0]?.product_name || null,
            count: items.length,
          },
        }));
      } catch {
        /* thumbnail is optional; the order row still renders */
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return thumbs;
}

function Thumbnail({ thumb, size = 44 }: { thumb?: Thumb; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E2E0DB] bg-[#F4F0E8]"
      style={{ width: size, height: size }}
    >
      {thumb?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb.image} alt={thumb.name || 'Order item'} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <ShoppingBag className="h-4 w-4 text-[#5C5C5C]" strokeWidth={1.7} />
      )}
    </span>
  );
}

function orderSummary(thumb?: Thumb) {
  if (!thumb?.name) return null;
  return thumb.count > 1 ? `${thumb.name} + ${thumb.count - 1} more` : thumb.name;
}

function Tracker({ order }: { order: ProfileState['orders'][number] }) {
  const current = stepIndex(order.status);
  const updated = fmtDate((order as any).updated_at);
  return (
    <ol className="relative grid grid-cols-4">
      <span className="absolute left-[12.5%] right-[12.5%] top-[7px] h-px bg-[#EAE5DA]" aria-hidden />
      <span
        className="absolute left-[12.5%] top-[7px] h-px bg-[#171717]/80"
        style={{ width: `${Math.max(current, 0) * 25}%` }}
        aria-hidden
      />
      {STEPS.map((step, i) => {
        const done = i < current;
        const isCurrent = i === current;
        return (
          <li key={step} className="relative flex flex-col items-center text-center">
            <span
              className={`h-[15px] w-[15px] rounded-full border-2 ${
                isCurrent
                  ? 'border-[#B08D57] bg-[#B08D57]'
                  : done
                  ? 'border-[#171717]/80 bg-[#171717]/80'
                  : 'border-[#D6D0C2] bg-[#F4F0E8]'
              }`}
            />
            <span className={`mt-2 text-[11px] ${isCurrent ? 'font-semibold text-[#171717]' : done ? 'text-[#4A4A4A]' : 'text-[#5C5C5C]'}`}>
              {step}
            </span>
            <span className="mt-0.5 min-h-[14px] text-[10px] text-[#5C5C5C]">{isCurrent ? updated : ''}</span>
          </li>
        );
      })}
    </ol>
  );
}

function SectionHead({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#171717]">{title}</h3>
        {sub && <p className="mt-1 text-[11px] text-[#5C5C5C]">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

function EmptyNote({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <IconDisc icon={Icon} size={44} />
      <p className="mt-3 text-[13px] font-semibold text-[#171717]">{title}</p>
      <p className="mt-1 max-w-[240px] text-[11px] leading-5 text-[#5C5C5C]">{text}</p>
    </div>
  );
}

/* ---------- component ---------- */

export function OverviewSection({ profile }: { profile: ProfileState }) {
  const [copied, setCopied] = useState(false);

  const orders = profile.orders ?? [];
  const wishlist = (profile.wishlist ?? []) as any[];
  const addresses = profile.addresses ?? [];
  const coupons = (profile.coupons ?? []) as any[];

  const featured = orders.find((o) => !CLOSED.includes(o.status)) ?? null;
  const history = orders.filter((o) => o !== featured).slice(0, 3);
  const shown = [featured, ...history].filter(Boolean) as typeof orders;
  const thumbs = useOrderThumbs(shown.map((o) => o.id));

  const inTransit = orders.filter((o) => o.status === 'Shipped').length;
  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0] ?? null;
  const coupon = coupons[0] ?? null;

  const earliestExpiry = useMemo(() => {
    const dates = coupons
      .map((c) => (c.expiry ? new Date(c.expiry) : null))
      .filter((d): d is Date => !!d && !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    return dates[0] ? fmtDate(dates[0].toISOString()) : null;
  }, [coupons]);

  const stats = [
    {
      title: 'Orders Placed',
      value: orders.length,
      sub: inTransit > 0 ? `${inTransit} in transit` : 'None in transit',
      icon: Package,
      section: 'orders',
    },
    {
      title: 'Saved Pieces',
      value: wishlist.length,
      sub: wishlist.length === 1 ? '1 piece' : `${wishlist.length} pieces`,
      icon: Heart,
      section: 'wishlist',
    },
    {
      title: 'Saved Addresses',
      value: addresses.length,
      sub: addresses.some((a) => a.is_default) ? 'Default set' : addresses.length ? 'No default set' : 'None saved',
      icon: MapPin,
      section: 'addresses',
    },
    {
      title: 'Available Offers',
      value: coupons.length,
      sub: earliestExpiry ? `Ends ${earliestExpiry}` : coupons.length ? 'Active now' : 'None right now',
      icon: Ticket,
      section: 'coupons',
    },
  ];

  const pad = (n: number) => String(n).padStart(2, '0');
  const go = (section: any) => profile.setActiveSection(section);
  const openOrder = (id: string) => profile.router.push(`/orders/${id}`);
  const openProduct = (item: any) =>
    profile.router.push(item.slug ? `/product/${item.slug}` : `/products/${item.product_id}`);

  const addressText = defaultAddress
    ? [defaultAddress.address, defaultAddress.city, [defaultAddress.state, defaultAddress.pincode].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', ')
    : null;
  const phone = profile.user?.phone || null;

  const discountText = coupon
    ? coupon.discount_type === 'percentage'
      ? `${Number(coupon.discount_value)}%`
      : `₹${Number(coupon.discount_value || 0).toLocaleString('en-IN')}`
    : '';

  const copyCode = async () => {
    if (!coupon?.code) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      profile.setError('Unable to copy the code. Please copy it manually.');
    }
  };

  /* ---------- shared blocks ---------- */

  const OrderRow = ({ order }: { order: (typeof orders)[number] }) => (
    <button
      type="button"
      onClick={() => openOrder(order.id)}
      className="flex w-full min-h-[72px] items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[#171717]/[0.03] sm:gap-4 sm:px-5"
    >
      <Thumbnail thumb={thumbs[order.id]} size={48} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-[#171717]">Order #{order.order_number}</span>
        {orderSummary(thumbs[order.id]) && (
          <span className="mt-0.5 block truncate text-[12px] text-[#4A4A4A]">{orderSummary(thumbs[order.id])}</span>
        )}
        <span className="mt-0.5 block truncate text-[11px] text-[#5C5C5C]">
          {[
            fmtDate(order.created_at, true),
            String(order.payment_method).toLowerCase() === 'cod' ? 'Cash on delivery' : 'Online payment',
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-[14px] font-semibold tabular-nums text-[#171717]">{profile.money(order.total_amount)}</span>
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusPill(order.status)}`}>
          {order.status}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#5C5C5C]" />
    </button>
  );

  const WishTile = ({ item }: { item: any }) => {
    const image = item.primary_image?.trim() || item.image_url?.trim() || item.product_image?.trim() || null;
    const name = item.product_name || item.name || 'Product';
    return (
      <button
        type="button"
        onClick={() => openProduct(item)}
        className="group min-w-0 text-left"
      >
        <span className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-[#E2E0DB] bg-[#F4F0E8]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <ShoppingBag className="h-6 w-6 text-[#5C5C5C]" strokeWidth={1.5} />
          )}
        </span>
        <span
          title={name}
          className="mt-2.5 line-clamp-2 min-h-[34px] break-words text-[12px] font-medium leading-[17px] text-[#171717]"
        >
          {name}
        </span>
        {item.price !== undefined && item.price !== null && (
          <span className="mt-0.5 block text-[12px] tabular-nums text-[#4A4A4A]">{profile.money(item.price)}</span>
        )}
      </button>
    );
  };

  const detailRows = [
    { icon: User, label: 'Full Name', value: profile.user?.full_name || profile.displayName },
    { icon: Mail, label: 'Email', value: profile.user?.email || 'Not available' },
    { icon: Phone, label: 'Phone', value: phone || 'Not added' },
    { icon: MapPin, label: defaultAddress?.address_type ? `Default Address · ${defaultAddress.address_type}` : 'Default Address', value: addressText || 'No address saved' },
  ];

  return (
    <div>
      {/* =================== DESKTOP =================== */}
      <div className="hidden space-y-6 lg:block">
        <div className="grid grid-cols-4 gap-5">
          {stats.map((s) => (
            <MetalCard key={s.title} className="kv-stat">
              <button type="button" onClick={() => go(s.section)} className="flex w-full flex-col p-5 text-left">
                <span className="flex items-center justify-between">
                  <IconDisc icon={s.icon} size={38} />
                  <ArrowRight className="h-4 w-4 text-[#5C5C5C]" />
                </span>
                <span className="mt-5 text-[44px] font-extralight leading-none tracking-tight tabular-nums text-[#171717]">{pad(s.value)}</span>
                <span className="mt-4 block text-[13px] font-medium text-[#171717]">{s.title}</span>
                <span className="mt-0.5 block truncate text-[11px] text-[#5C5C5C]">{s.sub}</span>
              </button>
            </MetalCard>
          ))}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-6">
          {/* Order history */}
          <MetalCard>
            <div className="p-5">
              <SectionHead
                title="Order History"
                sub="Track, return or reorder your pieces"
                right={
                  <button type="button" onClick={() => go('orders')} className="kv-btn-ghost !min-h-[38px]">
                    View all orders <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                }
              />
            </div>

            {orders.length === 0 ? (
              <EmptyNote icon={Package} title="No orders yet" text="Your purchases will appear here once you place your first order." />
            ) : (
              <>
                {featured && (
                  <div className="mx-5 mb-4 rounded-2xl border border-[#E2E0DB] bg-[#F4F0E8] p-5">
                    <div className="flex items-start gap-4">
                      <Thumbnail thumb={thumbs[featured.id]} size={52} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" onClick={() => openOrder(featured.id)} className="text-[14px] font-semibold text-[#171717] hover:underline">
                            Order #{featured.order_number}
                          </button>
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusPill(featured.status)}`}>
                            {featured.status}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[12px] text-[#5C5C5C]">
                          {[orderSummary(thumbs[featured.id]), thumbs[featured.id] ? `${thumbs[featured.id].count} ${thumbs[featured.id].count === 1 ? 'item' : 'items'}` : null]
                            .filter(Boolean)
                            .join(' · ') || `Placed ${fmtDate(featured.created_at, true) ?? ''}`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[20px] font-semibold text-[#171717]">{profile.money(featured.total_amount)}</p>
                        <p className="mt-0.5 text-[11px] text-[#5C5C5C]">Placed {fmtDate(featured.created_at)}</p>
                      </div>
                    </div>
                    {stepIndex(featured.status) >= 0 ? (
                      <div className="mt-5">
                        <Tracker order={featured} />
                      </div>
                    ) : (
                      <p className="mt-4 text-[11px] text-[#5C5C5C]">Your order is being processed. Tracking begins once it is confirmed.</p>
                    )}
                  </div>
                )}
                {history.length > 0 && (
                  <div className="divide-y divide-[#E2E0DB] border-t border-[#E2E0DB]">
                    {history.map((o) => (
                      <OrderRow key={o.id} order={o} />
                    ))}
                  </div>
                )}
              </>
            )}
          </MetalCard>

          {/* Wishlist + coupon */}
          <div className="space-y-6">
            <MetalCard>
              <div className="p-5">
                <SectionHead
                  title="Wishlist"
                  sub={`${wishlist.length} saved ${wishlist.length === 1 ? 'piece' : 'pieces'}`}
                  right={
                    <button type="button" onClick={() => go('wishlist')} aria-label="Open wishlist" className="kv-disc h-9 w-9">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  }
                />
                {wishlist.length === 0 ? (
                  <EmptyNote icon={Heart} title="Nothing saved yet" text="Save pieces you love and they will appear here." />
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {wishlist.slice(0, 2).map((item) => (
                      <WishTile key={item.product_id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            </MetalCard>

            <MetalCard className="kv-ticket">
              {coupon ? (
                <div className="flex">
                  <div className="min-w-0 flex-1 p-5">
                    <p className="kv-label">Your Offer</p>
                    <p className="mt-2 text-[34px] font-light leading-none text-[#171717]">
                      {discountText} <span className="text-[16px] text-[#4A4A4A]">OFF</span>
                    </p>
                    {Number(coupon.min_order) > 0 && (
                      <p className="mt-2 text-[11px] text-[#4A4A4A]">
                        On orders above ₹{Number(coupon.min_order).toLocaleString('en-IN')}
                      </p>
                    )}
                    {coupon.expiry && fmtDate(coupon.expiry, true) && (
                      <p className="mt-0.5 text-[11px] text-[#5C5C5C]">Valid till {fmtDate(coupon.expiry, true)}</p>
                    )}
                  </div>
                  <div className="flex w-[52px] items-center justify-center border-l border-dashed border-[#D6D0C2]">
                    <span className="-rotate-90 whitespace-nowrap text-[11px] font-bold tracking-[0.18em] text-[#8C6D3A]">
                      {coupon.code}
                    </span>
                  </div>
                </div>
              ) : (
                <EmptyNote icon={Ticket} title="No offers right now" text="Active coupon codes will show here and can be applied from the cart." />
              )}
            </MetalCard>
          </div>
        </div>

        {/* Personal details */}
        <div>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <SectionHead title="Personal Details" sub="Used for orders, delivery and account security" />
            <div className="flex gap-2">
              {!profile.isGoogleAccount && (
                <button type="button" onClick={() => go('security')} className="kv-btn-ghost !min-h-[38px]">
                  <Lock className="h-3.5 w-3.5" /> Change password
                </button>
              )}
              <button type="button" onClick={() => go('account')} className="kv-btn-primary !min-h-[38px]">
                <Pencil className="h-3.5 w-3.5" /> Edit details
              </button>
            </div>
          </div>
          <MetalCard>
            <div className="grid grid-cols-[0.8fr_1.2fr_0.9fr_1.5fr] divide-x divide-[#E2E0DB]">
              {detailRows.map((r) => (
                <div key={r.label} className="flex min-w-0 items-start gap-3 p-5">
                  <IconDisc icon={r.icon} size={34} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#5C5C5C]">{r.label}</p>
                    <p className="mt-1 line-clamp-3 break-words text-[13px] font-medium leading-[19px] text-[#171717]" title={r.value}>
                      {r.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </MetalCard>
        </div>
      </div>

      {/* =================== MOBILE =================== */}
      <div className="space-y-5 lg:hidden">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <MetalCard key={s.title} className="kv-stat">
              <button type="button" onClick={() => go(s.section)} className="flex min-h-[44px] w-full flex-col p-4 text-left">
                <span className="flex items-center justify-between">
                  <IconDisc icon={s.icon} size={34} />
                  <ArrowRight className="h-3.5 w-3.5 text-[#5C5C5C]" />
                </span>
                <span className="mt-3 text-[34px] font-extralight leading-none text-[#171717]">{pad(s.value)}</span>
                <span className="mt-2 text-[12px] text-[#4A4A4A]">{s.title}</span>
              </button>
            </MetalCard>
          ))}
        </div>

        {featured && (
          <div>
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="kv-label">Active Order</p>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusPill(featured.status)}`}>
                {featured.status}
              </span>
            </div>
            <MetalCard className="p-4">
              <div className="flex items-center gap-3">
                <Thumbnail thumb={thumbs[featured.id]} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[#171717]">#{featured.order_number}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[#5C5C5C]">
                    {orderSummary(thumbs[featured.id]) ?? `Placed ${fmtDate(featured.created_at)}`}
                  </p>
                </div>
                <p className="shrink-0 text-[17px] font-semibold text-[#171717]">{profile.money(featured.total_amount)}</p>
              </div>
              {stepIndex(featured.status) >= 0 ? (
                <div className="mt-5">
                  <Tracker order={featured} />
                </div>
              ) : (
                <p className="mt-4 text-[11px] text-[#5C5C5C]">Your order is being processed.</p>
              )}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => openOrder(featured.id)} className="kv-btn-ghost">
                  Order details
                </button>
                <button type="button" onClick={() => openOrder(featured.id)} className="kv-btn-primary">
                  <Truck className="h-4 w-4" /> Track
                </button>
              </div>
            </MetalCard>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="kv-label">Order History</p>
            <button type="button" onClick={() => go('orders')} className="inline-flex min-h-[44px] items-center gap-1 text-[12px] text-[#4A4A4A]">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <MetalCard>
            {orders.length === 0 ? (
              <EmptyNote icon={Package} title="No orders yet" text="Your purchases will appear here once you place your first order." />
            ) : history.length === 0 ? (
              <p className="p-4 text-[12px] text-[#5C5C5C]">No other orders.</p>
            ) : (
              <div className="divide-y divide-[#E2E0DB]">
                {history.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </div>
            )}
          </MetalCard>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="kv-label">Wishlist</p>
            <button type="button" onClick={() => go('wishlist')} className="inline-flex min-h-[44px] items-center gap-1 text-[12px] text-[#4A4A4A]">
              {wishlist.length} {wishlist.length === 1 ? 'piece' : 'pieces'} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {wishlist.length === 0 ? (
            <MetalCard>
              <EmptyNote icon={Heart} title="Nothing saved yet" text="Save pieces you love and they will appear here." />
            </MetalCard>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {wishlist.slice(0, 2).map((item) => (
                <WishTile key={item.product_id} item={item} />
              ))}
            </div>
          )}
        </div>

        {coupon && (
          <MetalCard className="kv-ticket">
            <div className="flex items-stretch">
              <div className="min-w-0 flex-1 p-4">
                <p className="kv-label">Your Offer</p>
                <p className="mt-1.5 text-[28px] font-light leading-none text-[#171717]">
                  {discountText} <span className="text-[14px] text-[#4A4A4A]">OFF</span>
                </p>
                {Number(coupon.min_order) > 0 && (
                  <p className="mt-1.5 text-[11px] text-[#4A4A4A]">Orders above ₹{Number(coupon.min_order).toLocaleString('en-IN')}</p>
                )}
                {coupon.expiry && fmtDate(coupon.expiry, true) && (
                  <p className="text-[11px] text-[#5C5C5C]">Valid till {fmtDate(coupon.expiry, true)}</p>
                )}
              </div>
              <div className="flex w-[116px] shrink-0 flex-col items-center justify-center gap-2 border-l border-dashed border-[#D6D0C2] p-3">
                <span className="text-[11px] font-bold tracking-[0.14em] text-[#8C6D3A]">{coupon.code}</span>
                <button type="button" onClick={copyCode} className="kv-btn-primary !min-h-[44px] !px-4">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </MetalCard>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="kv-label">Personal Details</p>
            <button type="button" onClick={() => go('account')} className="inline-flex min-h-[44px] items-center gap-1 text-[12px] text-[#4A4A4A]">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          </div>
          <MetalCard>
            <div className="divide-y divide-[#E2E0DB]">
              {[
                ...detailRows,
                {
                  icon: ShieldCheck,
                  label: 'Account Status',
                  value: profile.user?.email_verified ? 'Verified' : 'Not verified',
                },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-3 p-4">
                  <IconDisc icon={r.icon} size={36} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#5C5C5C]">{r.label}</p>
                    <p className={`mt-0.5 break-words text-[14px] ${r.label === 'Account Status' && r.value === 'Verified' ? 'text-[#1B7A43]' : 'text-[#171717]'}`}>
                      {r.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </MetalCard>
        </div>

        <div>
          <p className="kv-label mb-2 px-1">Settings</p>
          <MetalCard>
            <div className="divide-y divide-[#E2E0DB]">
              {[
                { icon: User, label: 'Account Details', section: 'account' },
                { icon: MapPin, label: 'Saved Addresses', section: 'addresses' },
                { icon: Lock, label: 'Security & Password', section: 'security' },
              ].map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => go(r.section)}
                  className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left"
                >
                  <IconDisc icon={r.icon} size={34} />
                  <span className="flex-1 text-[14px] text-[#171717]">{r.label}</span>
                  <ChevronRight className="h-4 w-4 text-[#5C5C5C]" />
                </button>
              ))}
            </div>
          </MetalCard>
        </div>

        <button
          type="button"
          onClick={profile.logout}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-[#B3261E] bg-[#F4F0E8]/60 text-[13px] font-semibold text-[#B3261E]"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>

        <MetalCard className="p-4">
          <div className="flex items-center gap-3">
            <IconDisc icon={LifeBuoy} size={38} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-[#171717]">Need help?</p>
              <p className="text-[11px] text-[#5C5C5C]">Our team is here for orders and sizing.</p>
            </div>
            <button type="button" onClick={() => profile.router.push('/contact')} className="kv-btn-ghost">
              Contact
            </button>
          </div>
        </MetalCard>
      </div>
    </div>
  );
}
