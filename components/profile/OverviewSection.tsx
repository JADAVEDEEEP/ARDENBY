'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronRight, Copy, Heart, MapPin, Package, ShoppingBag, Ticket } from 'lucide-react';
import type { useProfile } from '../../hooks/use-profile';
import { IconDisc } from './metal';
import { OrderStatusChip, Thumb, fmtDate, useOrderDetails } from './order-ui';

type ProfileState = ReturnType<typeof useProfile>;

function PanelHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="kv-display text-[24px] sm:text-[28px]">{title}</h2>
        {sub && <p className="mt-1 text-[15px] text-[#666666]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function OverviewSection({ profile }: { profile: ProfileState }) {
  const [copied, setCopied] = useState(false);

  const orders = profile.orders ?? [];
  const wishlist = (profile.wishlist ?? []) as any[];
  const addresses = profile.addresses ?? [];
  const coupons = useMemo(() => (profile.coupons ?? []) as any[], [profile.coupons]);

  const recent = orders.slice(0, 3);
  const details = useOrderDetails(recent.map((o) => o.id));

  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0] ?? null;
  const coupon = coupons[0] ?? null;

  const earliestExpiry = useMemo(() => {
    const dates = coupons
      .map((c) => (c.expiry ? new Date(c.expiry) : null))
      .filter((d): d is Date => !!d && !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    return dates[0] ? fmtDate(dates[0].toISOString(), true) : null;
  }, [coupons]);

  const inTransit = orders.filter((o) => o.status === 'Shipped').length;

  const stats = [
    {
      title: 'Orders',
      value: orders.length,
      sub: orders.length === 0 ? 'No orders yet' : inTransit > 0 ? `${inTransit} in transit` : 'View order history',
      icon: Package,
      section: 'orders',
    },
    {
      title: 'Wishlist',
      value: wishlist.length,
      sub: wishlist.length ? 'Saved pieces' : 'Nothing saved yet',
      icon: Heart,
      section: 'wishlist',
    },
    {
      title: 'Saved addresses',
      value: addresses.length,
      sub: addresses.length ? (defaultAddress?.is_default ? 'Default set' : 'No default set') : 'None saved yet',
      icon: MapPin,
      section: 'addresses',
    },
    {
      title: 'Available offer',
      value: coupons.length,
      sub: earliestExpiry ? `Ends ${earliestExpiry}` : coupons.length ? 'Active now' : 'None right now',
      icon: Ticket,
      section: 'coupons',
      accent: coupons.length > 0,
    },
  ];

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
  const verified = Boolean(profile.user?.email_verified);

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

  return (
    <div className="space-y-6 lg:space-y-8">
      <h2 className="kv-display text-[30px] sm:text-[36px]">Overview</h2>

      {/* ---------- summary cards ---------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {stats.map((s) => (
          <button
            key={s.title}
            type="button"
            onClick={() => go(s.section)}
            className="kv-inner group flex min-h-[44px] w-full flex-col p-4 text-left transition hover:border-[#111111] lg:p-5"
          >
            <span className="flex items-center justify-between">
              <IconDisc icon={s.icon} size={40} />
              <ArrowRight className="h-4 w-4 text-[#666666] transition group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span
              className={`kv-display mt-4 text-[40px] tabular-nums lg:text-[48px] ${s.accent ? '!text-[#C8211F]' : ''}`}
            >
              {s.value}
            </span>
            <span className="mt-2 text-[16px] font-bold text-[#111111]">{s.title}</span>
            <span className="mt-0.5 text-[14px] leading-5 text-[#666666]">{s.sub}</span>
          </button>
        ))}
      </div>

      {/* ---------- recent orders + wishlist ---------- */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-8">
        <section className="kv-inner p-5 sm:p-6" aria-labelledby="recent-orders">
          <PanelHead
            title="Recent orders"
            sub="Track, return or reorder your pieces"
            action={
              orders.length > 0 && (
                <button type="button" onClick={() => go('orders')} className="kv-btn-ghost kv-btn-sm">
                  View all orders
                </button>
              )
            }
          />

          {orders.length === 0 ? (
            <div className="mt-5 flex flex-col items-center rounded-[4px] bg-[#F5F5F5] px-6 py-10 text-center">
              <IconDisc icon={Package} size={56} />
              <p className="mt-4 text-[20px] font-bold text-[#111111]">No orders yet</p>
              <p className="mt-1 text-[16px] text-[#666666]">Your wardrobe journey starts here.</p>
              <button type="button" onClick={() => profile.router.push('/shop')} className="kv-btn-primary mt-5">
                Continue shopping <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-[#E5E5E5] border-y border-[#E5E5E5]">
              {recent.map((order) => {
                const detail = details[order.id];
                const first = detail?.items?.[0];
                const more = (detail?.items?.length ?? 0) - 1;
                return (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() => openOrder(order.id)}
                      className="flex w-full min-h-[76px] items-center gap-3 py-3 text-left"
                    >
                      <Thumb src={first?.product_image} alt={first?.product_name} size={56} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[16px] font-bold text-[#111111]">#{order.order_number}</span>
                        <span className="block truncate text-[15px] text-[#666666]">
                          {first ? `${first.product_name}${more > 0 ? ` + ${more} more` : ''}` : fmtDate(order.created_at, true)}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-[16px] font-bold tabular-nums text-[#111111]">
                          {profile.money(order.total_amount)}
                        </span>
                        <OrderStatusChip status={order.status} />
                      </span>
                      <ChevronRight className="hidden h-4 w-4 shrink-0 text-[#666666] sm:block" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="kv-inner p-5 sm:p-6" aria-labelledby="wishlist-preview">
          <PanelHead
            title="Wishlist"
            sub={`${wishlist.length} saved ${wishlist.length === 1 ? 'piece' : 'pieces'}`}
            action={
              wishlist.length > 0 && (
                <button type="button" onClick={() => go('wishlist')} className="min-h-[44px] text-[16px] font-semibold text-[#111111] underline underline-offset-4">
                  View all{wishlist.length > 3 ? ` (${wishlist.length})` : ''}
                </button>
              )
            }
          />
          {wishlist.length === 0 ? (
            <div className="mt-5 flex flex-col items-center rounded-[4px] bg-[#F5F5F5] px-6 py-10 text-center">
              <IconDisc icon={Heart} size={56} />
              <p className="mt-4 text-[20px] font-bold text-[#111111]">Nothing saved yet</p>
              <p className="mt-1 text-[16px] text-[#666666]">Save pieces you love and they will appear here.</p>
            </div>
          ) : (
            <ul className="mt-5 grid grid-cols-3 gap-3">
              {wishlist.slice(0, 3).map((item) => {
                const image = item.primary_image?.trim() || item.image_url?.trim() || item.product_image?.trim() || null;
                const name = item.product_name || item.name || 'Product';
                return (
                  <li key={item.product_id} className="min-w-0">
                    <button type="button" onClick={() => openProduct(item)} className="group block w-full text-left">
                      <span className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[2px] border border-[#E5E5E5] bg-[#F5F5F5]">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image} alt={name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                        ) : (
                          <ShoppingBag className="h-6 w-6 text-[#666666]" strokeWidth={1.5} />
                        )}
                      </span>
                      <span title={name} className="mt-2 line-clamp-2 break-words text-[15px] font-semibold leading-5 text-[#111111]">
                        {name}
                      </span>
                      {item.price !== undefined && item.price !== null && (
                        <span className="mt-0.5 block text-[15px] tabular-nums text-[#444444]">{profile.money(item.price)}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* ---------- offer + personal details ---------- */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-8">
        <section aria-label="Your offer" className="kv-inner flex min-w-0 overflow-hidden">
          {coupon ? (
            <>
              <div className="min-w-0 flex-1 p-5 sm:p-6">
                <p className="text-[16px] font-bold text-[#C8211F]">Your offer</p>
                <p className="kv-display mt-1 text-[44px] leading-none sm:text-[52px]">{discountText} off</p>
                <p className="mt-3 text-[15px] leading-6 text-[#666666]">
                  {Number(coupon.min_order) > 0 && <>On orders above ₹{Number(coupon.min_order).toLocaleString('en-IN')}</>}
                  {Number(coupon.min_order) > 0 && coupon.expiry && ' · '}
                  {coupon.expiry && fmtDate(coupon.expiry, true) && <>Valid till {fmtDate(coupon.expiry, true)}</>}
                </p>
              </div>
              <div className="flex w-[132px] shrink-0 flex-col items-center justify-center gap-3 border-l-2 border-dashed border-[#BDBDBD] p-3 sm:w-[160px]">
                <span className="break-all text-center text-[15px] font-bold tracking-[0.06em] text-[#111111]">{coupon.code}</span>
                <button type="button" onClick={copyCode} className="kv-btn-primary kv-btn-sm !px-3">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy code'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center px-6 py-10 text-center">
              <IconDisc icon={Ticket} size={48} />
              <p className="mt-3 text-[18px] font-bold text-[#111111]">No offers right now</p>
              <p className="mt-1 text-[15px] text-[#666666]">Active coupon codes will show here.</p>
            </div>
          )}
        </section>

        <section aria-labelledby="personal-details" className="kv-inner p-5 sm:p-6">
          <PanelHead
            title="Personal details"
            action={
              <button type="button" onClick={() => go('account')} className="min-h-[44px] text-[16px] font-semibold text-[#111111] underline underline-offset-4">
                Edit details
              </button>
            }
          />
          <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-[14px] text-[#666666]">Full name</dt>
              <dd className="mt-0.5 text-[16px] font-bold text-[#111111]">{profile.user?.full_name || profile.displayName}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[14px] text-[#666666]">Email{verified ? ' · Verified' : ''}</dt>
              <dd className="mt-0.5 break-all text-[16px] font-bold text-[#111111]">{profile.user?.email || 'Not available'}</dd>
            </div>
            <div>
              <dt className="text-[14px] text-[#666666]">Phone</dt>
              <dd className="mt-0.5 text-[16px] text-[#111111]">
                {phone ? (
                  <span className="font-bold">{phone}</span>
                ) : (
                  <>
                    Not added ·{' '}
                    <button type="button" onClick={() => go('account')} className="font-semibold underline underline-offset-4">
                      Add phone
                    </button>
                  </>
                )}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[14px] text-[#666666]">Default address</dt>
              <dd className="mt-0.5 text-[16px] text-[#111111]">
                {addressText ? (
                  <span className="font-bold">{addressText}</span>
                ) : (
                  <>
                    None saved ·{' '}
                    <button type="button" onClick={() => go('addresses')} className="font-semibold underline underline-offset-4">
                      Add address
                    </button>
                  </>
                )}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
