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
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-[#F4F0E8] px-4 py-3.5  ${
              profile.error ? 'border-[#B3261E]' : 'border-[#D6D0C2]'
            }`}
          >
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                profile.error ? 'bg-[#F4F0E8] text-[#B3261E]' : 'bg-[#EAE5DA] text-[#1B7A43]'
              }`}
            >
              {profile.error ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            </span>
            <p className="min-w-0 flex-1 text-[13px] leading-5 text-[#171717]">{profile.error || profile.message}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={dismiss}
              className="flex h-8 w-8 shrink-0 items-center justify-center text-[#5C5C5C] hover:text-[#171717]"
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
          <div className="flex items-center justify-between border-b border-[#E2E0DB] px-4 py-4 sm:px-6">
            <div>
              <p className="kv-label">{profile.editingAddressId ? 'Update destination' : 'New destination'}</p>
              <h3 className="mt-1 text-[20px] text-[#171717]" style={{ fontFamily: 'Bodoni MT, Didot, serif' }}>
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

            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-[13px] text-[#4A4A4A] sm:col-span-2">
              <input
                type="checkbox"
                checked={profile.addressForm.is_default}
                onChange={(e) => profile.setAddressForm((prev) => ({ ...prev, is_default: e.target.checked }))}
                className="h-4 w-4 accent-[#B08D57]"
              />
              Make this my default address
            </label>
          </div>

          <div className="flex justify-end border-t border-[#E2E0DB] px-4 py-4 sm:px-6">
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
                className={`kv-inner relative flex min-w-0 flex-col p-5 ${isDefault ? '!border-[#B08D57]/60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <IconDisc icon={Icon} size={38} />
                    <p className="truncate text-[12px] font-semibold uppercase tracking-[0.16em] text-[#171717]">
                      {address.address_type || 'Address'}
                    </p>
                  </div>
                  {isDefault && (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#B08D57] bg-[#F4F0E8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8C6D3A]">
                      <Check className="h-3 w-3" /> Default
                    </span>
                  )}
                </div>

                <div className="mt-5 flex-1">
                  <p className="text-[15px] font-semibold text-[#171717]">{address.name}</p>
                  <p className="mt-0.5 text-[12px] text-[#5C5C5C]">{address.phone}</p>
                  <p className="mt-3 break-words border-l border-[#D6D0C2] pl-3 text-[13px] leading-6 text-[#4A4A4A]">
                    {address.address}, {address.city}, {address.state} — {address.pincode}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 border-t border-[#E2E0DB] pt-2">
                  <button
                    type="button"
                    onClick={() => profile.editAddress(address)}
                    className="inline-flex min-h-[44px] items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#171717] hover:text-[#8C6D3A]"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  {!isDefault && (
                    <button
                      type="button"
                      onClick={() => profile.setDefaultAddress(address.id)}
                      className="min-h-[44px] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4A4A4A] hover:text-[#8C6D3A]"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => profile.deleteAddress(address.id)}
                    className="ml-auto inline-flex min-h-[44px] items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B3261E] hover:text-[#B3261E]"
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
