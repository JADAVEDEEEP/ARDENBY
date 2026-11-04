'use client';

import { useRef, useState } from 'react';
import { AlertCircle, Check, ChevronDown, MapPin, Plus, X } from 'lucide-react';
import type { useProfile } from '../../hooks/use-profile';
import { EmptyPanel, SectionTitle } from './metal';
import { CurrentLocationButton, type PickedAddress } from './CurrentLocationButton';

type ProfileState = ReturnType<typeof useProfile>;

const STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
  'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
];

const TYPES = ['Home', 'Work', 'Other'] as const;

// Google returns names like "National Capital Territory of Delhi"; map them onto the select's options.
const STATE_ALIASES: Record<string, string> = {
  'national capital territory of delhi': 'Delhi',
  'nct of delhi': 'Delhi',
  orissa: 'Odisha',
  uttaranchal: 'Uttarakhand',
  pondicherry: 'Puducherry',
  'jammu & kashmir': 'Jammu and Kashmir',
  'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'andaman & nicobar islands': 'Andaman and Nicobar Islands',
};

const matchState = (raw: string) => {
  const key = raw.trim().toLowerCase();
  return STATES.find((s) => s.toLowerCase() === key) ?? STATE_ALIASES[key] ?? '';
};

const tenDigits = (value: string) => value.replace(/\D/g, '').slice(-10);

const maskPhone = (value: string) => {
  const d = tenDigits(value);
  return d.length === 10 ? `+91 ${d.slice(0, 2)}•••• ••${d.slice(8)}` : value;
};

type Errors = Partial<Record<'name' | 'phone' | 'pincode' | 'flat' | 'area' | 'city' | 'state', string>>;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="kv-error">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {message}
    </p>
  );
}

export function AddressesSection({ profile }: { profile: ProfileState }) {
  const [flat, setFlat] = useState('');
  const [building, setBuilding] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = profile.addressForm;
  const deleteTarget = profile.addresses.find((a) => a.id === deleteId) ?? null;

  const setField = (patch: Partial<typeof form>) => profile.setAddressForm((prev) => ({ ...prev, ...patch }));

  // The API stores one address line, so compose it from the address inputs.
  const compose = (f: string, b: string, a: string, l: string) =>
    [f, b, a, l].map((part) => part.trim()).filter(Boolean).join(', ');

  const updateLines = (next: { flat?: string; building?: string; area?: string; landmark?: string }) => {
    const f = next.flat ?? flat;
    const b = next.building ?? building;
    const a = next.area ?? area;
    const l = next.landmark ?? landmark;
    if (next.flat !== undefined) setFlat(next.flat);
    if (next.building !== undefined) setBuilding(next.building);
    if (next.area !== undefined) setArea(next.area);
    if (next.landmark !== undefined) setLandmark(next.landmark);
    setField({ address: compose(f, b, a, l) });
    setErrors((e) => ({ ...e, flat: undefined, area: undefined }));
  };

  // Values we last filled from the map, so a later pick only replaces what the user has not typed over.
  const autoFilled = useRef({ flat: '', building: '', landmark: '' });

  const applyPicked = (picked: PickedAddress) => {
    const nextFlat = !flat.trim() || flat === autoFilled.current.flat ? picked.flat : flat;
    const nextLandmark = !landmark.trim() || landmark === autoFilled.current.landmark ? picked.landmark : landmark;
    const pickedBuilding = picked.building ?? '';
    const nextBuilding = !building.trim() || building === autoFilled.current.building ? pickedBuilding || building : building;
    autoFilled.current = { flat: picked.flat, building: pickedBuilding, landmark: picked.landmark };
    // Only overwrite what Google identified; keep anything the customer already typed otherwise.
    const matchedState = matchState(picked.state);
    updateLines({ flat: nextFlat, building: nextBuilding, area: picked.area || area, landmark: nextLandmark });
    setField({
      city: picked.city || form.city,
      pincode: picked.pincode || form.pincode,
      state: matchedState || form.state,
    });
    setErrors((e) => ({ ...e, pincode: undefined, city: undefined, state: undefined }));
  };

  const closeForm = () => {
    profile.setShowAddressForm(false);
    profile.resetAddressForm();
    setFlat('');
    setBuilding('');
    setArea('');
    setLandmark('');
    setErrors({});
    autoFilled.current = { flat: '', building: '', landmark: '' };
  };

  const openAdd = () => {
    profile.resetAddressForm();
    setFlat('');
    setBuilding('');
    setArea('');
    setLandmark('');
    setErrors({});
    autoFilled.current = { flat: '', building: '', landmark: '' };
    profile.setShowAddressForm(true);
  };

  const openEdit = (address: ProfileState['addresses'][number]) => {
    profile.editAddress(address);
    // A saved address is one string: first part is the building, the rest is the area.
    const [first, ...rest] = String(address.address).split(',').map((p) => p.trim());
    setFlat(first || '');
    setBuilding('');
    setArea(rest.join(', '));
    setLandmark('');
    setErrors({});
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = 'Enter the recipient’s full name.';
    if (tenDigits(form.phone).length !== 10) next.phone = 'Enter a 10-digit mobile number.';
    if (!/^[1-9]\d{5}$/.test(form.pincode.trim())) next.pincode = 'Enter a valid 6-digit PIN code';
    if (!flat.trim()) next.flat = 'Enter your flat, house no. or building.';
    if (!area.trim()) next.area = 'Enter your area, street or locality.';
    if (!form.city.trim()) next.city = 'Enter your city.';
    if (!form.state.trim()) next.state = 'Select your state.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    void profile.saveAddress(e);
  };

  const describe = (id: string) => (errors[id as keyof Errors] ? `err-${id}` : undefined);

  return (
    <section>
      <SectionTitle
        title="Saved addresses"
        sub="Your delivery destinations for a faster checkout."
        action={
          !profile.showAddressForm && (
            <button type="button" onClick={openAdd} className="kv-btn-primary">
              <Plus className="h-4 w-4" /> Add new address
            </button>
          )
        }
      />

      {profile.addresses.length === 0 && !profile.showAddressForm ? (
        <EmptyPanel icon={MapPin} title="No saved addresses" text="Add an address for a faster checkout." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profile.addresses.map((address) => {
            const isDefault = Boolean(address.is_default);
            return (
              <article
                key={address.id}
                className={`flex min-w-0 flex-col rounded-[4px] bg-white p-5 ${
                  isDefault ? 'border-2 border-[#111111]' : 'border border-[#E5E5E5]'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-[2px] border border-[#E5E5E5] bg-[#F5F5F5] px-2.5 py-1 text-[14px] font-semibold text-[#111111]">
                    {address.address_type || 'Address'}
                  </span>
                  {isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#111111] px-2.5 py-1 text-[14px] font-semibold text-white">
                      <Check className="h-3.5 w-3.5" /> Default
                    </span>
                  )}
                </div>

                <div className="mt-4 flex-1">
                  <p className="text-[19px] font-bold text-[#111111]">{address.name}</p>
                  <p className="mt-2 break-words text-[16px] leading-6 text-[#444444]">
                    {address.address}
                    <br />
                    {address.city}, {address.state} {address.pincode}
                  </p>
                  <p className="mt-2 text-[16px] text-[#666666]">Phone: {maskPhone(address.phone)}</p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#E5E5E5] pt-4">
                  <button type="button" onClick={() => openEdit(address)} className="kv-btn-ghost kv-btn-sm">
                    Edit
                  </button>
                  {!isDefault && (
                    <button type="button" onClick={() => profile.setDefaultAddress(address.id)} className="kv-btn-ghost kv-btn-sm">
                      Set as default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteId(address.id)}
                    className="kv-link-danger min-h-[44px] px-2"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <div
          role="alertdialog"
          aria-label="Confirm delete address"
          className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[4px] border border-[#E5E5E5] bg-[#F5F5F5] px-5 py-4"
        >
          <div>
            <p className="text-[18px] font-bold text-[#111111]">
              Delete your {deleteTarget.address_type || 'saved'} address?
            </p>
            <p className="text-[15px] text-[#666666]">You can add it again any time.</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setDeleteId(null)} className="kv-btn-ghost kv-btn-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                const id = deleteTarget.id;
                setDeleteId(null);
                await profile.deleteAddress(id);
              }}
              className="kv-btn-sm inline-flex items-center justify-center rounded-[2px] bg-[#C8211F] px-4 text-[15px] font-semibold text-white hover:bg-[#a51a18]"
            >
              Delete address
            </button>
          </div>
        </div>
      )}

      {profile.showAddressForm && (
        <form
          onSubmit={submit}
          noValidate
          aria-labelledby="address-form-title"
          className="mt-8 rounded-[4px] border border-[#E5E5E5] bg-white p-5 sm:p-8"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="address-form-title" className="kv-display text-[28px] sm:text-[32px]">
                {profile.editingAddressId ? 'Edit address' : 'Add a new address'}
              </h2>
              <p className="mt-1 text-[16px] text-[#666666]">All fields are required unless marked optional.</p>
            </div>
            <button type="button" onClick={closeForm} aria-label="Close address form" className="kv-disc h-11 w-11">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <CurrentLocationButton onPick={applyPicked} />

            <div>
              <label htmlFor="addr-name" className="kv-field-label">Full name</label>
              <input
                id="addr-name"
                value={form.name}
                onChange={(e) => {
                  setField({ name: e.target.value });
                  setErrors((x) => ({ ...x, name: undefined }));
                }}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={describe('name')}
                autoComplete="name"
                className="kv-input"
              />
              <FieldError id="err-name" message={errors.name} />
            </div>

            <div>
              <label htmlFor="addr-phone" className="kv-field-label">Mobile number</label>
              <div className="flex">
                <span className="flex min-h-[52px] items-center rounded-l-[2px] border border-r-0 border-[#BDBDBD] bg-[#F5F5F5] px-4 text-[16px]">
                  +91
                </span>
                <input
                  id="addr-phone"
                  inputMode="numeric"
                  value={tenDigits(form.phone)}
                  onChange={(e) => {
                    setField({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) });
                    setErrors((x) => ({ ...x, phone: undefined }));
                  }}
                  placeholder="10-digit mobile number"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={describe('phone')}
                  autoComplete="tel-national"
                  className="kv-input !rounded-l-none"
                />
              </div>
              <FieldError id="err-phone" message={errors.phone} />
            </div>

            <div>
              <label htmlFor="addr-pin" className="kv-field-label">PIN code</label>
              <input
                id="addr-pin"
                inputMode="numeric"
                value={form.pincode}
                onChange={(e) => {
                  setField({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) });
                  setErrors((x) => ({ ...x, pincode: undefined }));
                }}
                aria-invalid={Boolean(errors.pincode)}
                aria-describedby={describe('pincode')}
                autoComplete="postal-code"
                className="kv-input"
              />
              <FieldError id="err-pincode" message={errors.pincode} />
            </div>

            <div>
              <label htmlFor="addr-flat" className="kv-field-label">Flat, house no., building</label>
              <input
                id="addr-flat"
                value={flat}
                onChange={(e) => updateLines({ flat: e.target.value })}
                placeholder="e.g. B-204, Shivalik Residency"
                aria-invalid={Boolean(errors.flat)}
                aria-describedby={describe('flat')}
                className="kv-input"
              />
              <FieldError id="err-flat" message={errors.flat} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="addr-building" className="kv-field-label">
                Building, apartment, society <span className="font-normal text-[#666666]">(optional)</span>
              </label>
              <input
                id="addr-building"
                value={building}
                onChange={(e) => updateLines({ building: e.target.value })}
                placeholder="e.g. Safal Parivesh"
                autoComplete="off"
                className="kv-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="addr-area" className="kv-field-label">Area, street, locality</label>
              <input
                id="addr-area"
                value={area}
                onChange={(e) => updateLines({ area: e.target.value })}
                placeholder="e.g. Satellite Road"
                aria-invalid={Boolean(errors.area)}
                aria-describedby={describe('area')}
                className="kv-input"
              />
              <FieldError id="err-area" message={errors.area} />
            </div>

            <div>
              <label htmlFor="addr-landmark" className="kv-field-label">
                Landmark <span className="font-normal text-[#666666]">(optional)</span>
              </label>
              <input
                id="addr-landmark"
                value={landmark}
                onChange={(e) => updateLines({ landmark: e.target.value })}
                placeholder="e.g. near Jodhpur Cross Road"
                className="kv-input"
              />
            </div>

            <div>
              <label htmlFor="addr-city" className="kv-field-label">City</label>
              <input
                id="addr-city"
                value={form.city}
                onChange={(e) => {
                  setField({ city: e.target.value });
                  setErrors((x) => ({ ...x, city: undefined }));
                }}
                aria-invalid={Boolean(errors.city)}
                aria-describedby={describe('city')}
                autoComplete="address-level2"
                className="kv-input"
              />
              <FieldError id="err-city" message={errors.city} />
            </div>

            <div>
              <label htmlFor="addr-state" className="kv-field-label">State</label>
              <div className="relative">
                <select
                  id="addr-state"
                  value={form.state}
                  onChange={(e) => {
                    setField({ state: e.target.value });
                    setErrors((x) => ({ ...x, state: undefined }));
                  }}
                  aria-invalid={Boolean(errors.state)}
                  aria-describedby={describe('state')}
                  autoComplete="address-level1"
                  className="kv-input appearance-none !pr-10"
                >
                  <option value="">Select state</option>
                  {form.state && !STATES.includes(form.state) && <option value={form.state}>{form.state}</option>}
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden />
              </div>
              <FieldError id="err-state" message={errors.state} />
            </div>

            <fieldset>
              <legend className="kv-field-label">Address type</legend>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => {
                  const on = (form.address_type || 'Home').toLowerCase() === t.toLowerCase();
                  return (
                    <label
                      key={t}
                      className={`flex min-h-[52px] cursor-pointer items-center gap-2 rounded-full border px-5 text-[16px] font-semibold ${
                        on ? 'border-2 border-[#111111] text-[#111111]' : 'border-[#BDBDBD] text-[#444444]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address-type"
                        value={t}
                        checked={on}
                        onChange={() => setField({ address_type: t })}
                        className="h-4 w-4 accent-[#111111]"
                      />
                      {t}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <label className="flex min-h-[48px] cursor-pointer items-center gap-3 text-[16px] text-[#111111] sm:col-span-2">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setField({ is_default: e.target.checked })}
                className="h-5 w-5 accent-[#111111]"
              />
              Make this my default address
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button disabled={profile.sectionLoading} className="kv-btn-primary sm:min-w-[180px]">
              {profile.sectionLoading ? 'Saving…' : 'Save address'}
            </button>
            <button type="button" onClick={closeForm} className="kv-btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
