
'use client';

import {
  Package,
  Heart,
  MapPin,
  Ticket,
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
  Phone,
  ShoppingBag,
} from 'lucide-react';

export function OverviewSection({ profile }: { profile: any }) {
  const orders = Array.isArray(profile?.orders)
    ? [...profile.orders]
    : [];

  const stats = [
    {
      title: 'Orders Placed',
      value: String(orders.length),
      icon: Package,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50/80',
      borderColor: 'border-indigo-100',
      link: 'orders',
    },
    {
      title: 'Saved Pieces',
      value: String(profile?.wishlist?.length ?? 0),
      icon: Heart,
      color: 'text-rose-600',
      bg: 'bg-rose-50/80',
      borderColor: 'border-rose-100',
      link: 'wishlist',
    },
    {
      title: 'Saved Addresses',
      value: String(profile?.addresses?.length ?? 0),
      icon: MapPin,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50/80',
      borderColor: 'border-emerald-100',
      link: 'addresses',
    },
    {
      title: 'Available Offers',
      value: String(profile?.coupons?.length ?? 0),
      icon: Ticket,
      color: 'text-amber-600',
      bg: 'bg-amber-50/80',
      borderColor: 'border-amber-100',
      link: 'coupons',
    },
  ];

  const getOrderId = (order: any) =>
    String(
      order.orderNumber ??
        order.order_number ??
        order.orderId ??
        order.id ??
        order._id ??
        'Order'
    );

  const getOrderDate = (order: any) => {
    const rawDate =
      order.createdAt ??
      order.created_at ??
      order.orderDate ??
      order.order_date;

    if (!rawDate) return 'Date unavailable';

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return 'Date unavailable';
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getOrderAmount = (order: any) => {
    const amount =
      order.totalAmount ??
      order.total_amount ??
      order.grandTotal ??
      order.grand_total ??
      order.total ??
      order.amount;

    if (
      amount === undefined ||
      amount === null ||
      !Number.isFinite(Number(amount))
    ) {
      return '—';
    }

    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const getOrderStatus = (order: any) =>
    String(
      order.status ??
        order.orderStatus ??
        order.order_status ??
        'Processing'
    );

  const getStatusStyle = (status: string) => {
    const value = status.toLowerCase();

    if (value.includes('deliver') || value.includes('complete')) {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (value.includes('cancel') || value.includes('fail')) {
      return 'border-red-200 bg-red-50 text-red-700';
    }

    if (value.includes('ship') || value.includes('transit')) {
      return 'border-blue-200 bg-blue-50 text-blue-700';
    }

    return 'border-amber-200 bg-amber-50 text-amber-800';
  };

  return (
    <div className="flex h-full flex-col space-y-5 select-none">

      {/* HERO SECTION */}
      <div className="relative flex items-center overflow-hidden rounded-[12px] bg-gradient-to-r from-[#171717] via-[#262626] to-[#171717] px-6 py-6 text-white shadow-sm">
        <div className="relative z-10 flex w-full flex-col justify-center">
          <div className="mb-2.5 inline-flex w-fit items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-medium text-amber-300">
            <ShieldCheck className="h-3 w-3 text-amber-400" />
            <span>MEMBER</span>
          </div>

          <h1 className="text-xl font-semibold tracking-wide text-white sm:text-2xl">
            Welcome back,{' '}
            <span className="font-serif font-normal italic text-white">
              {profile?.displayName || 'Member'}
            </span>
          </h1>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((item, index) => {
          const Icon = item.icon;

          return (
            <button
              type="button"
              key={index}
              onClick={() => profile.setActiveSection(item.link)}
              className="group flex flex-col justify-between rounded-[10px] border border-[#E2DED8] bg-white p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-[#C8C2B9] hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-md border ${item.borderColor} ${item.bg}`}
                >
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>

                <ArrowRight className="h-3 w-3 text-[#B0A79D] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </div>

              <div className="mt-3">
                <div className="text-lg font-bold tracking-tight text-[#171717] sm:text-xl">
                  {item.value}
                </div>

                <div className="text-[10px] font-medium text-[#6F6962]">
                  {item.title}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* LOWER CONTENT */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">

        {/* RECENT ORDERS */}
        <div className="flex h-full flex-col rounded-[10px] border border-[#E2DED8] bg-white p-4 shadow-sm sm:p-5 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-[#E2DED8]/80 pb-3">
            <div>
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#171717]">
                <ShoppingBag className="h-4 w-4 text-[#A88943]" />
                Recent Orders
              </h3>

              <p className="mt-1 text-[10px] text-[#8C827A]">
                Your latest purchases
              </p>
            </div>

            <button
              type="button"
              onClick={() => profile.setActiveSection('orders')}
              className="inline-flex items-center gap-1 rounded-md border border-[#D8C59A]/60 px-3 py-2 text-[10px] font-semibold text-[#6F5520] transition hover:bg-[#F5EEDC]"
            >
              View All
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#E2DED8] bg-[#FAF9F6]">
                <Package className="h-5 w-5 text-[#A88943]" />
              </div>

              <p className="text-sm font-semibold text-[#171717]">
                No orders yet
              </p>

              <p className="mt-1 max-w-[230px] text-xs leading-5 text-[#8C827A]">
                Your purchases will appear here when you place your first order.
              </p>

              <button
                type="button"
                onClick={() => profile.setActiveSection('orders')}
                className="mt-4 rounded-md bg-[#171717] px-4 py-2.5 text-[10px] font-semibold tracking-wide text-white transition hover:bg-[#343434]"
              >
                VIEW MY ORDERS
              </button>
            </div>
          ) : (
            <div className="mt-3 divide-y divide-[#E2DED8]/80">
              {orders.slice(0, 3).map((order: any, index: number) => {
                const status = getOrderStatus(order);

                return (
                  <div
                    key={order.id ?? order._id ?? order.orderId ?? index}
                    className="flex items-center gap-3 py-3 first:pt-1 last:pb-1"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D8C59A]/50 bg-[#FAF7F0]">
                      <Package className="h-4 w-4 text-[#A88943]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-[#171717]">
                        Order #{getOrderId(order).slice(-10)}
                      </p>

                      <p className="mt-1 text-[10px] text-[#8C827A]">
                        {getOrderDate(order)}
                      </p>

                      <span
                        className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold ${getStatusStyle(status)}`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-[#171717]">
                        {getOrderAmount(order)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PERSONAL DETAILS */}
        <div className="flex h-full flex-col rounded-[10px] border border-[#E2DED8] bg-white p-4 shadow-sm sm:p-5 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2DED8]/80 pb-2.5">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#171717]">
                <User className="h-3.5 w-3.5 text-[#8C827A]" />
                Personal Details
              </h3>

              <button
                type="button"
                onClick={() => profile.setActiveSection('account')}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#171717] hover:underline"
              >
                Edit
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">

              {/* FULL NAME */}
              <div className="flex items-center gap-2 rounded-[6px] border border-[#E2DED8]/60 bg-[#FAF9F6] p-2">
                <User className="h-3.5 w-3.5 shrink-0 text-[#8C827A]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-[#8C827A]">
                    Full Name
                  </p>
                  <p className="truncate text-[10px] font-semibold text-[#171717]">
                    {profile?.displayName || 'N/A'}
                  </p>
                </div>
              </div>

              {/* EMAIL */}
              <div className="flex items-center gap-2 rounded-[6px] border border-[#E2DED8]/60 bg-[#FAF9F6] p-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-[#8C827A]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-[#8C827A]">
                    Email Address
                  </p>
                  <p className="truncate text-[10px] font-semibold text-[#171717]">
                    {profile?.user?.email || 'N/A'}
                  </p>
                </div>
              </div>

              {/* PHONE */}
              <div className="flex items-center gap-2 rounded-[6px] border border-[#E2DED8]/60 bg-[#FAF9F6] p-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-[#8C827A]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-[#8C827A]">
                    Phone Number
                  </p>
                  <p className="truncate text-[10px] font-semibold text-[#171717]">
                    {profile?.user?.phone ??
                      profile?.user?.phoneNumber ??
                      'Not added'}
                  </p>
                </div>
              </div>

              {/* ACCOUNT STATUS */}
              <div className="flex items-center gap-2 rounded-[6px] border border-[#E2DED8]/60 bg-[#FAF9F6] p-2">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-[#8C827A]">
                    Account Status
                  </p>
                  <p className="truncate text-[10px] font-semibold text-emerald-600">
                    Verified
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
