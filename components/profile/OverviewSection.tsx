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
    return 'border-[#5a2a2c] bg-[#2a1517] text-[#EF7B7B]';
  if (s === 'shipped') return 'border-[#2c4670] bg-[#14223a] text-[#9FC3FF]';
  if (s === 'delivered') return 'border-[#245a3a] bg-[#11261a] text-[#5FD08A]';
  return 'border-[#5a4a2a] bg-[#261f12] text-[#D6B06A]';
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
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#3a3d44] bg-[#121316]"
      style={{ width: size, height: size }}
    >
      {thumb?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb.image} alt={thumb.name || 'Order item'} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <ShoppingBag className="h-4 w-4 text-[#9296A0]" strokeWidth={1.7} />
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
      <span className="absolute left-[12.5%] right-[12.5%] top-[7px] h-px bg-[#3a3d44]" aria-hidden />
      <span
        className="absolute left-[12.5%] top-[7px] h-px bg-white/80"
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
                  ? 'border-[#D6B06A] bg-[#D6B06A]'
                  : done
                  ? 'border-white/80 bg-white/80'
                  : 'border-[#4a4d55] bg-[#17181c]'
              }`}
            />
            <span className={`mt-2 text-[11px] ${isCurrent ? 'font-semibold text-white' : done ? 'text-[#C6C9CF]' : 'text-[#9296A0]'}`}>
              {step}
            </span>
            <span className="mt-0.5 min-h-[14px] text-[10px] text-[#9296A0]">{isCurrent ? updated : ''}</span>
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
        <h3 className="text-[12px] font-bold uppercase tracking-[0.16em] text-white">{title}</h3>
        {sub && <p className="mt-1 text-[11px] text-[#9296A0]">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

function EmptyNote({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <IconDisc icon={Icon} size={44} />
      <p className="mt-3 text-[13px] font-semibold text-white">{title}</p>
      <p className="mt-1 max-w-[240px] text-[11px] leading-5 text-[#9296A0]">{text}</p>
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
      className="flex w-full min-h-[72px] items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.03] sm:gap-4 sm:px-5"
    >
      <Thumbnail thumb={thumbs[order.id]} size={48} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-white">Order #{order.order_number}</span>
        {orderSummary(thumbs[order.id]) && (
          <span className="mt-0.5 block truncate text-[12px] text-[#C6C9CF]">{orderSummary(thumbs[order.id])}</span>
        )}
        <span className="mt-0.5 block truncate text-[11px] text-[#9296A0]">
          {[
            fmtDate(order.created_at, true),
            String(order.payment_method).toLowerCase() === 'cod' ? 'Cash on delivery' : 'Online payment',
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-[14px] font-semibold tabular-nums text-white">{profile.money(order.total_amount)}</span>
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusPill(order.status)}`}>
          {order.status}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#9296A0]" />
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
        <span className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-[#3a3d44] bg-[radial-gradient(circle_at_50%_30%,#2e3036,#141518)]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <ShoppingBag className="h-6 w-6 text-[#9296A0]" strokeWidth={1.5} />
          )}
        </span>
        <span
          title={name}
          className="mt-2.5 line-clamp-2 min-h-[34px] break-words text-[12px] font-medium leading-[17px] text-white"
        >
          {name}
        </span>
        {item.price !== undefined && item.price !== null && (
          <span className="mt-0.5 block text-[12px] tabular-nums text-[#C6C9CF]">{profile.money(item.price)}</span>
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
                  <ArrowRight className="h-4 w-4 text-[#9296A0]" />
                </span>
                <span className="mt-5 text-[44px] font-extralight leading-none tracking-tight tabular-nums text-white">{pad(s.value)}</span>
                <span className="mt-4 block text-[13px] font-medium text-white">{s.title}</span>
                <span className="mt-0.5 block truncate text-[11px] text-[#9296A0]">{s.sub}</span>
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
                  <div className="mx-5 mb-4 rounded-2xl border border-[#3a3d44] bg-black/20 p-5">
                    <div className="flex items-start gap-4">
                      <Thumbnail thumb={thumbs[featured.id]} size={52} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" onClick={() => openOrder(featured.id)} className="text-[14px] font-semibold text-white hover:underline">
                            Order #{featured.order_number}
                          </button>
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusPill(featured.status)}`}>
                            {featured.status}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[12px] text-[#9296A0]">
                          {[orderSummary(thumbs[featured.id]), thumbs[featured.id] ? `${thumbs[featured.id].count} ${thumbs[featured.id].count === 1 ? 'item' : 'items'}` : null]
                            .filter(Boolean)
                            .join(' · ') || `Placed ${fmtDate(featured.created_at, true) ?? ''}`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[20px] font-semibold text-white">{profile.money(featured.total_amount)}</p>
                        <p className="mt-0.5 text-[11px] text-[#9296A0]">Placed {fmtDate(featured.created_at)}</p>
                      </div>
                    </div>
                    {stepIndex(featured.status) >= 0 ? (
                      <div className="mt-5">
                        <Tracker order={featured} />
                      </div>
                    ) : (
                      <p className="mt-4 text-[11px] text-[#9296A0]">Your order is being processed. Tracking begins once it is confirmed.</p>
                    )}
                  </div>
                )}
                {history.length > 0 && (
                  <div className="divide-y divide-[#2c2e34] border-t border-[#2c2e34]">
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
                    <p className="mt-2 text-[34px] font-light leading-none text-white">
                      {discountText} <span className="text-[16px] text-[#C6C9CF]">OFF</span>
                    </p>
                    {Number(coupon.min_order) > 0 && (
                      <p className="mt-2 text-[11px] text-[#C6C9CF]">
                        On orders above ₹{Number(coupon.min_order).toLocaleString('en-IN')}
                      </p>
                    )}
                    {coupon.expiry && fmtDate(coupon.expiry, true) && (
                      <p className="mt-0.5 text-[11px] text-[#9296A0]">Valid till {fmtDate(coupon.expiry, true)}</p>
                    )}
                  </div>
                  <div className="flex w-[52px] items-center justify-center border-l border-dashed border-[#4a4d55]">
                    <span className="-rotate-90 whitespace-nowrap text-[11px] font-bold tracking-[0.18em] text-[#D6B06A]">
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
            <div className="grid grid-cols-[0.8fr_1.2fr_0.9fr_1.5fr] divide-x divide-[#2c2e34]">
              {detailRows.map((r) => (
                <div key={r.label} className="flex min-w-0 items-start gap-3 p-5">
                  <IconDisc icon={r.icon} size={34} />
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9296A0]">{r.label}</p>
                    <p className="mt-1 line-clamp-3 break-words text-[13px] font-medium leading-[19px] text-white" title={r.value}>
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
                  <ArrowRight className="h-3.5 w-3.5 text-[#9296A0]" />
                </span>
                <span className="mt-3 text-[34px] font-extralight leading-none text-white">{pad(s.value)}</span>
                <span className="mt-2 text-[12px] text-[#C6C9CF]">{s.title}</span>
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
                  <p className="truncate text-[14px] font-semibold text-white">#{featured.order_number}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[#9296A0]">
                    {orderSummary(thumbs[featured.id]) ?? `Placed ${fmtDate(featured.created_at)}`}
                  </p>
                </div>
                <p className="shrink-0 text-[17px] font-semibold text-white">{profile.money(featured.total_amount)}</p>
              </div>
              {stepIndex(featured.status) >= 0 ? (
                <div className="mt-5">
                  <Tracker order={featured} />
                </div>
              ) : (
                <p className="mt-4 text-[11px] text-[#9296A0]">Your order is being processed.</p>
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
            <button type="button" onClick={() => go('orders')} className="inline-flex min-h-[44px] items-center gap-1 text-[12px] text-[#C6C9CF]">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <MetalCard>
            {orders.length === 0 ? (
              <EmptyNote icon={Package} title="No orders yet" text="Your purchases will appear here once you place your first order." />
            ) : history.length === 0 ? (
              <p className="p-4 text-[12px] text-[#9296A0]">No other orders.</p>
            ) : (
              <div className="divide-y divide-[#2c2e34]">
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
            <button type="button" onClick={() => go('wishlist')} className="inline-flex min-h-[44px] items-center gap-1 text-[12px] text-[#C6C9CF]">
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
                <p className="mt-1.5 text-[28px] font-light leading-none text-white">
                  {discountText} <span className="text-[14px] text-[#C6C9CF]">OFF</span>
                </p>
                {Number(coupon.min_order) > 0 && (
                  <p className="mt-1.5 text-[11px] text-[#C6C9CF]">Orders above ₹{Number(coupon.min_order).toLocaleString('en-IN')}</p>
                )}
                {coupon.expiry && fmtDate(coupon.expiry, true) && (
                  <p className="text-[11px] text-[#9296A0]">Valid till {fmtDate(coupon.expiry, true)}</p>
                )}
              </div>
              <div className="flex w-[116px] shrink-0 flex-col items-center justify-center gap-2 border-l border-dashed border-[#4a4d55] p-3">
                <span className="text-[11px] font-bold tracking-[0.14em] text-[#D6B06A]">{coupon.code}</span>
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
            <button type="button" onClick={() => go('account')} className="inline-flex min-h-[44px] items-center gap-1 text-[12px] text-[#C6C9CF]">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          </div>
          <MetalCard>
            <div className="divide-y divide-[#2c2e34]">
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
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9296A0]">{r.label}</p>
                    <p className={`mt-0.5 break-words text-[14px] ${r.label === 'Account Status' && r.value === 'Verified' ? 'text-[#5FD08A]' : 'text-white'}`}>
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
            <div className="divide-y divide-[#2c2e34]">
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
                  <span className="flex-1 text-[14px] text-white">{r.label}</span>
                  <ChevronRight className="h-4 w-4 text-[#9296A0]" />
                </button>
              ))}
            </div>
          </MetalCard>
        </div>

        <button
          type="button"
          onClick={profile.logout}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-[#6a2f31] bg-[#2a1517]/60 text-[13px] font-semibold text-[#EF7B7B]"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>

        <MetalCard className="p-4">
          <div className="flex items-center gap-3">
            <IconDisc icon={LifeBuoy} size={38} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-white">Need help?</p>
              <p className="text-[11px] text-[#9296A0]">Our team is here for orders and sizing.</p>
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
