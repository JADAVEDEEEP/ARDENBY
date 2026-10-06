'use client';

import type { useProfile } from '../../hooks/use-profile';
import {
  MapPin,
  Plus,
  X,
  Pencil,
  Trash2,
  Check,
  Home,
  Briefcase,
} from 'lucide-react';
import { EmptyState } from './ui';

type ProfileState = ReturnType<typeof useProfile>;

export function AddressesSection({ profile }: { profile: ProfileState }) {
  return (
    <section className="relative overflow-hidden border border-[#B9923B]/25 bg-[#080808] text-[#F4EFE4] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      {/* KOVENIK premium toast notifications — uses existing profile message/error state */}
      {(profile.message || profile.error) && (
        <div className="pointer-events-none fixed right-4 top-24 z-[9999] w-[min(380px,calc(100vw-2rem))] sm:right-6">
          <div
            role="status"
            className={`pointer-events-auto relative overflow-hidden border bg-[#0D0D0D]/95 px-4 py-3.5 shadow-[0_18px_55px_rgba(0,0,0,0.5)] backdrop-blur-xl ${
              profile.error
                ? 'border-red-400/25'
                : 'border-[#C9A34A]/40'
            }`}
          >
            <div
              className={`absolute inset-y-0 left-0 w-[3px] ${
                profile.error
                  ? 'bg-gradient-to-b from-red-300 via-red-500 to-red-800'
                  : 'bg-gradient-to-b from-[#F0D47A] via-[#C9A34A] to-[#76541F]'
              }`}
            />
            <div className="flex items-start gap-3 pl-1">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border ${
                  profile.error
                    ? 'border-red-400/25 bg-red-400/[0.07] text-red-300'
                    : 'border-[#C9A34A]/30 bg-[#C9A34A]/[0.07] text-[#E3C66B]'
                }`}
              >
                {profile.error ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-[8px] font-bold uppercase tracking-[0.22em] ${
                    profile.error ? 'text-red-300' : 'text-[#D7B75A]'
                  }`}
                >
                  {profile.error ? 'KOVENIK / ACTION FAILED' : 'KOVENIK / SUCCESS'}
                </p>
                <p className="mt-1 text-[12px] leading-5 text-[#F4EFE4]">
                  {profile.error || profile.message}
                </p>
              </div>

              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => profile.setError('')}
                className="shrink-0 text-[#706A61] transition hover:text-[#E3C66B]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Premium background details */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-[#C9A34A]/[0.055] blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-[#C9A34A]/[0.025] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E1C15F]/60 to-transparent" />
      </div>

      {/* Header */}
      <div className="relative flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:py-6">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.28em] text-[#C9A34A]">
            KOVENIK / ACCOUNT
          </p>
          <h2 className="mt-1.5 font-serif text-2xl font-semibold tracking-[-0.02em] text-[#F7F2E8] sm:text-[28px]">
            Saved Addresses
          </h2>
          <p className="mt-1.5 text-[11px] leading-5 text-[#8E897F]">
            Your preferred delivery destinations.
          </p>
        </div>

        <button
          onClick={() => {
            profile.resetAddressForm();
            profile.setShowAddressForm(true);
          }}
          className="group inline-flex w-fit items-center gap-2 border border-[#B9923B]/65 bg-gradient-to-b from-[#17130B] to-[#0B0B0B] px-4 py-2.5 text-[8px] font-bold uppercase tracking-[0.18em] text-[#D9B95C] transition-all duration-300 hover:border-[#E6CA70] hover:bg-[#C9A34A] hover:text-black hover:shadow-[0_0_26px_rgba(201,163,74,0.16)]"
        >
          <Plus className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" />
          Add Address
        </button>
      </div>

      <div className="relative p-4 sm:p-6">
        {/* Add / Edit form */}
        {profile.showAddressForm && (
          <form
            onSubmit={profile.saveAddress}
            className="mb-6 overflow-hidden border border-[#B9923B]/35 bg-[#101010] shadow-[0_18px_50px_rgba(0,0,0,0.32)]"
          >
            <div className="flex items-center justify-between border-b border-[#B9923B]/20 bg-[#0C0C0C] px-4 py-4 sm:px-6">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-[#B9923B]">
                  {profile.editingAddressId ? 'UPDATE DESTINATION' : 'NEW DESTINATION'}
                </p>
                <h3 className="mt-1 font-serif text-xl text-[#F5F0E7]">
                  {profile.editingAddressId ? 'Edit Address' : 'Add Address'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  profile.setShowAddressForm(false);
                  profile.resetAddressForm();
                }}
                className="inline-flex h-8 w-8 items-center justify-center border border-white/10 bg-white/[0.03] text-[#8D877D] transition hover:border-[#B9923B]/60 hover:text-[#E0C66A]"
                aria-label="Close address form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-x-7 gap-y-5 px-4 py-5 sm:grid-cols-2 sm:px-6 sm:py-6">
              {[
                ['name', 'Full Name'],
                ['phone', 'Phone'],
                ['pincode', 'Pincode'],
                ['city', 'City'],
                ['state', 'State'],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="block text-[8px] font-bold uppercase tracking-[0.19em] text-[#8F897E]"
                >
                  {label}
                  <input
                    required
                    value={
                      profile.addressForm[
                        key as keyof typeof profile.addressForm
                      ] as string
                    }
                    onChange={(e) =>
                      profile.setAddressForm((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    className="mt-2 w-full border border-white/[0.09] border-b-[#B9923B]/30 bg-[#080808] px-3 py-3 text-sm font-normal normal-case tracking-normal text-[#F5F0E7] outline-none transition placeholder:text-[#5E5951] focus:border-[#C9A34A]/70 focus:ring-1 focus:ring-[#C9A34A]/15"
                  />
                </label>
              ))}

              <label className="block text-[8px] font-bold uppercase tracking-[0.19em] text-[#8F897E] sm:col-span-2">
                Address
                <textarea
                  required
                  rows={3}
                  value={profile.addressForm.address}
                  onChange={(e) =>
                    profile.setAddressForm((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  className="mt-2 w-full resize-none border border-white/[0.09] border-b-[#B9923B]/30 bg-[#080808] px-3 py-3 text-sm font-normal normal-case leading-6 tracking-normal text-[#F5F0E7] outline-none transition focus:border-[#C9A34A]/70 focus:ring-1 focus:ring-[#C9A34A]/15"
                />
              </label>

              <label className="block text-[8px] font-bold uppercase tracking-[0.19em] text-[#8F897E]">
                Address Type
                <select
                  value={profile.addressForm.address_type}
                  onChange={(e) =>
                    profile.setAddressForm((prev) => ({
                      ...prev,
                      address_type: e.target.value,
                    }))
                  }
                  className="mt-2 w-full border border-white/[0.09] border-b-[#B9923B]/30 bg-[#080808] px-3 py-3 text-sm font-normal normal-case tracking-normal text-[#F5F0E7] outline-none focus:border-[#C9A34A]/70"
                >
                  <option className="bg-[#101010] text-white">Home</option>
                  <option className="bg-[#101010] text-white">Work</option>
                  <option className="bg-[#101010] text-white">Other</option>
                </select>
              </label>

              <label className="flex items-end gap-3 pb-2 text-[8px] font-bold uppercase tracking-[0.16em] text-[#918A7F]">
                <input
                  type="checkbox"
                  checked={profile.addressForm.is_default}
                  onChange={(e) =>
                    profile.setAddressForm((prev) => ({
                      ...prev,
                      is_default: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#C9A34A]"
                />
                Make default
              </label>
            </div>

            <div className="flex justify-end border-t border-white/[0.07] bg-[#0C0C0C] px-4 py-4 sm:px-6">
              <button
                disabled={profile.sectionLoading}
                className="inline-flex min-w-[155px] items-center justify-center gap-2 bg-gradient-to-r from-[#8A6728] via-[#E2C662] to-[#9A742A] px-5 py-3 text-[8px] font-black uppercase tracking-[0.19em] text-black shadow-[0_8px_25px_rgba(185,146,59,0.16)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                {profile.sectionLoading ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </form>
        )}

        {/* Address list */}
        {profile.addresses.length === 0 ? (
          <div className="border border-white/[0.08] bg-[#0D0D0D]">
            <EmptyState
              icon={MapPin}
              title="No saved addresses"
              text="Add an address for a faster checkout."
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {profile.addresses.map((address) => {
              const isDefault = Boolean(address.is_default);
              const isHome = address.address_type?.toLowerCase() === 'home';

              return (
                <article
                  key={address.id}
                  className={`group relative overflow-hidden border bg-[#0E0E0E] p-5 transition-all duration-300 sm:p-6 ${
                    isDefault
                      ? 'border-[#C9A34A]/65 shadow-[0_0_32px_rgba(185,146,59,0.07)]'
                      : 'border-white/[0.09] hover:border-[#B9923B]/45'
                  }`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-[2px] ${
                      isDefault
                        ? 'bg-gradient-to-r from-[#76541F] via-[#F0D47A] to-[#8C6728]'
                        : 'bg-gradient-to-r from-transparent via-[#B9923B]/25 to-transparent'
                    }`}
                  />

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center border border-[#B9923B]/30 bg-[#090909] text-[#D7B75A]">
                        {isHome ? (
                          <Home className="h-4 w-4" />
                        ) : (
                          <Briefcase className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D7B75A]">
                          {address.address_type}
                        </p>
                        <p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-[#68635B]">
                          Delivery destination
                        </p>
                      </div>
                    </div>

                    {isDefault && (
                      <span className="inline-flex items-center gap-1.5 border border-[#B9923B]/50 bg-[#B9923B]/[0.08] px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-[0.15em] text-[#E3C66B]">
                        <Check className="h-3 w-3" />
                        Default
                      </span>
                    )}
                  </div>

                  <div className="mt-6">
                    <p className="text-[15px] font-semibold text-[#F4EFE4]">
                      {address.name}
                    </p>
                    <p className="mt-1 text-[11px] tracking-wide text-[#8F8A82]">
                      {address.phone}
                    </p>
                    <div className="mt-4 border-l border-[#B9923B]/35 pl-3">
                      <p className="text-[12px] leading-5 text-[#BDB7AD]">
                        {address.address}, {address.city}, {address.state} — {address.pincode}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/[0.07] pt-4">
                    <button
                      onClick={() => profile.editAddress(address)}
                      className="inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.17em] text-[#D7B75A] transition hover:text-[#F0D47A]"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>

                    {!isDefault && (
                      <button
                        onClick={() => profile.setDefaultAddress(address.id)}
                        className="text-[8px] font-bold uppercase tracking-[0.17em] text-[#9F9688] transition hover:text-[#D7B75A]"
                      >
                        Make Default
                      </button>
                    )}

                    <button
                      onClick={() => profile.deleteAddress(address.id)}
                      className="inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.17em] text-[#9A6262] transition hover:text-[#D18A8A]"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
