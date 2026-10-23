'use client';

import type { useProfile } from '../../hooks/use-profile';
import { MapPin, Plus, X, Pencil, Trash2, Check, Home, Briefcase } from 'lucide-react';
import { EmptyPanel, IconDisc, SectionTitle } from './metal';

type ProfileState = ReturnType<typeof useProfile>;

const TEXT_FIELDS: [string, string][] = [
  ['name', 'Full Name'],
  ['phone', 'Phone'],
  ['pincode', 'Pincode'],
  ['city', 'City'],
  ['state', 'State'],
];

export function AddressesSection({ profile }: { profile: ProfileState }) {
  const dismiss = () => {
    profile.setError('');
    profile.setMessage('');
  };

  return (
    <section>
      {/* Toast — uses the existing profile message/error state */}
      {(profile.message || profile.error) && (
        <div className="pointer-events-none fixed right-4 top-24 z-[9999] w-[min(380px,calc(100vw-2rem))] sm:right-6">
          <div
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-[#1C1E22] px-4 py-3.5 shadow-[0_18px_55px_rgba(0,0,0,0.6)] ${
              profile.error ? 'border-[#6a2f31]' : 'border-[#42454C]'
            }`}
          >
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                profile.error ? 'bg-[#2a1517] text-[#EF7B7B]' : 'bg-[#11261a] text-[#5FD08A]'
              }`}
            >
              {profile.error ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            </span>
            <p className="min-w-0 flex-1 text-[13px] leading-5 text-white">{profile.error || profile.message}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={dismiss}
              className="flex h-8 w-8 shrink-0 items-center justify-center text-[#9296A0] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <SectionTitle
        label="KOVENIK — ACCOUNT"
        title="Saved Addresses"
        sub="Your preferred delivery destinations."
        action={
          <button
            type="button"
            onClick={() => {
              profile.resetAddressForm();
              profile.setShowAddressForm(true);
            }}
            className="kv-btn-primary"
          >
            <Plus className="h-4 w-4" /> Add Address
          </button>
        }
      />

      {profile.showAddressForm && (
        <form onSubmit={profile.saveAddress} className="kv-inner mb-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#2c2e34] px-4 py-4 sm:px-6">
            <div>
              <p className="kv-label">{profile.editingAddressId ? 'Update destination' : 'New destination'}</p>
              <h3 className="mt-1 text-[20px] text-white" style={{ fontFamily: 'Bodoni MT, Didot, serif' }}>
                {profile.editingAddressId ? 'Edit Address' : 'Add Address'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                profile.setShowAddressForm(false);
                profile.resetAddressForm();
              }}
              className="kv-disc h-11 w-11"
              aria-label="Close address form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-x-6 gap-y-5 px-4 py-5 sm:grid-cols-2 sm:px-6 sm:py-6">
            {TEXT_FIELDS.map(([key, label]) => (
              <label key={key} className="block">
                <span className="kv-field-label">{label}</span>
                <input
                  required
                  value={profile.addressForm[key as keyof typeof profile.addressForm] as string}
                  onChange={(e) => profile.setAddressForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="kv-input"
                />
              </label>
            ))}

            <label className="block">
              <span className="kv-field-label">Address Type</span>
              <select
                value={profile.addressForm.address_type}
                onChange={(e) => profile.setAddressForm((prev) => ({ ...prev, address_type: e.target.value }))}
                className="kv-input"
              >
                <option>Home</option>
                <option>Work</option>
                <option>Other</option>
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="kv-field-label">Address</span>
              <textarea
                required
                rows={3}
                value={profile.addressForm.address}
                onChange={(e) => profile.setAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                className="kv-input"
              />
            </label>

            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-[13px] text-[#C6C9CF] sm:col-span-2">
              <input
                type="checkbox"
                checked={profile.addressForm.is_default}
                onChange={(e) => profile.setAddressForm((prev) => ({ ...prev, is_default: e.target.checked }))}
                className="h-4 w-4 accent-[#D6B06A]"
              />
              Make this my default address
            </label>
          </div>

          <div className="flex justify-end border-t border-[#2c2e34] px-4 py-4 sm:px-6">
            <button disabled={profile.sectionLoading} className="kv-btn-primary min-w-[160px]">
              <Check className="h-4 w-4" />
              {profile.sectionLoading ? 'Saving…' : 'Save Address'}
            </button>
          </div>
        </form>
      )}

      {profile.addresses.length === 0 ? (
        <EmptyPanel icon={MapPin} title="No saved addresses" text="Add an address for a faster checkout." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profile.addresses.map((address) => {
            const isDefault = Boolean(address.is_default);
            const isHome = address.address_type?.toLowerCase() === 'home';
            const Icon = isHome ? Home : Briefcase;

            return (
              <article
                key={address.id}
                className={`kv-inner relative flex min-w-0 flex-col p-5 ${isDefault ? '!border-[#D6B06A]/60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <IconDisc icon={Icon} size={38} />
                    <p className="truncate text-[12px] font-semibold uppercase tracking-[0.16em] text-white">
                      {address.address_type || 'Address'}
                    </p>
                  </div>
                  {isDefault && (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#5a4a2a] bg-[#261f12] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#D6B06A]">
                      <Check className="h-3 w-3" /> Default
                    </span>
                  )}
                </div>

                <div className="mt-5 flex-1">
                  <p className="text-[15px] font-semibold text-white">{address.name}</p>
                  <p className="mt-0.5 text-[12px] text-[#9296A0]">{address.phone}</p>
                  <p className="mt-3 break-words border-l border-[#42454C] pl-3 text-[13px] leading-6 text-[#C6C9CF]">
                    {address.address}, {address.city}, {address.state} — {address.pincode}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 border-t border-[#2c2e34] pt-2">
                  <button
                    type="button"
                    onClick={() => profile.editAddress(address)}
                    className="inline-flex min-h-[44px] items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white hover:text-[#D6B06A]"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  {!isDefault && (
                    <button
                      type="button"
                      onClick={() => profile.setDefaultAddress(address.id)}
                      className="min-h-[44px] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C6C9CF] hover:text-[#D6B06A]"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => profile.deleteAddress(address.id)}
                    className="ml-auto inline-flex min-h-[44px] items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#EF7B7B] hover:text-[#ff9a9a]"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
