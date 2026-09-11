'use client';

import { Package, Heart, MapPin, Ticket, ArrowRight, ShieldCheck, User, Mail, Phone, ShoppingBag } from 'lucide-react';

export function OverviewSection({ profile }: { profile: any }) {
  const stats = [
    { title: 'Orders Placed', value: '0', icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50/80', borderColor: 'border-indigo-100', link: 'orders' },
    { title: 'Saved Pieces', value: '0', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50/80', borderColor: 'border-rose-100', link: 'wishlist' },
    { title: 'Saved Addresses', value: '0', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50/80', borderColor: 'border-emerald-100', link: 'addresses' },
    { title: 'Available Offers', value: '2', icon: Ticket, color: 'text-amber-600', bg: 'bg-amber-50/80', borderColor: 'border-amber-100', link: 'coupons' },
  ];

  return (
    <div className="space-y-5 select-none flex flex-col justify-between h-full">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden rounded-[12px] bg-gradient-to-r from-[#171717] via-[#262626] to-[#171717] px-6 py-6 text-white shadow-xs flex items-center">
        <div className="relative z-10 w-full flex flex-col justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-medium text-amber-300 border border-amber-400/30 bg-amber-400/10 mb-2.5 w-fit">
            <ShieldCheck className="h-3 w-3 text-amber-400" />
            <span>VERIFIED MEMBER</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-wide text-white">
            Welcome back, <span className="font-serif italic font-normal text-white">{profile?.displayName || 'Member'}</span>
          </h1>
        </div>
      </div>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              onClick={() => profile.setActiveSection(item.link)}
              className="group relative cursor-pointer overflow-hidden rounded-[10px] border border-[#E2DED8] bg-white p-3 shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs hover:border-[#C8C2B9] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-7 w-7 items-center justify-center rounded-md border ${item.borderColor} ${item.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                </div>
                <ArrowRight className="h-3 w-3 text-[#B0A79D] opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0.5" />
              </div>
              <div className="mt-2.5">
                <div className="text-lg sm:text-xl font-bold tracking-tight text-[#171717]">
                  {item.value}
                </div>
                <div className="text-[10px] font-medium text-[#6F6962]">
                  {item.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* LOWER CONTENT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* RECENT PURCHASES CARD */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-[10px] border border-[#E2DED8] bg-white p-4 shadow-2xs h-full">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2DED8]/80 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-[#8C827A]" />
                Recent Orders
              </h3>
              <button
                onClick={() => profile.setActiveSection('orders')}
                className="text-[11px] font-semibold text-[#171717] hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* EMPTY STATE */}
            <div className="py-5 text-center flex flex-col items-center justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF9F6] border border-[#E2DED8] mb-2">
                <Package className="h-4 w-4 text-[#8C827A]" />
              </div>
              <p className="text-xs font-semibold text-[#171717]">No orders placed yet</p>
              <p className="text-[10px] text-[#6F6962]">
                Your recent purchases will appear here once you buy.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => profile.setActiveSection('orders')}
              className="group/cta inline-flex items-center gap-1.5 rounded-[6px] bg-[#171717] px-4 py-2 text-[11px] font-semibold text-white transition-all hover:bg-[#262626]"
            >
              <span>EXPLORE COLLECTION</span>
              <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* PERSONAL INFORMATION CARD */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-[10px] border border-[#E2DED8] bg-white p-4 shadow-2xs h-full">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2DED8]/80 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[#8C827A]" />
                Personal Details
              </h3>
              <button
                onClick={() => profile.setActiveSection('account')}
                className="text-[11px] font-semibold text-[#171717] hover:underline flex items-center gap-1"
              >
                Edit <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="p-2 rounded-[6px] bg-[#FAF9F6] border border-[#E2DED8]/60 flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-[#8C827A] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-[#8C827A]">Full Name</p>
                  <p className="text-[10px] font-semibold text-[#171717] truncate">{profile?.displayName || 'N/A'}</p>
                </div>
              </div>

              <div className="p-2 rounded-[6px] bg-[#FAF9F6] border border-[#E2DED8]/60 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#8C827A] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-[#8C827A]">Email Address</p>
                  <p className="text-[10px] font-semibold text-[#171717] truncate">{profile?.user?.email || 'N/A'}</p>
                </div>
              </div>

              <div className="p-2 rounded-[6px] bg-[#FAF9F6] border border-[#E2DED8]/60 flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[#8C827A] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-[#8C827A]">Phone Number</p>
                  <p className="text-[10px] font-semibold text-[#171717] truncate">Not added</p>
                </div>
              </div>

              <div className="p-2 rounded-[6px] bg-[#FAF9F6] border border-[#E2DED8]/60 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-[#8C827A]">Account Status</p>
                  <p className="text-[10px] font-semibold text-emerald-600 truncate">Verified</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-center opacity-0 pointer-events-none">
            <button type="button" className="px-4 py-2 text-[11px]">Spacer</button>
          </div>
        </div>

      </div>
    </div>
  );
}