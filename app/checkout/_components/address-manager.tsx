'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, Plus, RotateCcw, X } from 'lucide-react';
import {
  apiRequest,
  friendlyError,
  unwrap,
  validateAddress,
  type Address,
  type AddressErrors,
  type AddressForm,
} from './shared';
import { CurrentLocationButton, SavedPinNotice, type PickedAddress } from '../../../components/profile/CurrentLocationButton';
import { pincodeMismatch } from '../../../lib/ola-client';

const EMPTY_FORM: AddressForm = {
  name: '',
  phone: '',
  pincode: '',
  address: '',
  city: '',
  state: '',
  address_type: 'Home',
  is_default: false,
  latitude: null,
  longitude: null,
};

/** Masked phone, e.g. +91 98•••• ••10. Falls back to the stored value if it is not 10 digits. */
function maskPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `+91 ${d.slice(0, 2)}•••• ••${d.slice(8)}` : value;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[15px] font-semibold text-[#111111]">{label}</span>
      {children}
      {error && (
        <span role="alert" className="flex items-center gap-1.5 text-[14px] font-medium text-[#C8211F]">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </span>
      )}
    </label>
  );
}

function AddressModal({
  editingId,
  form,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  editingId: string | null;
  form: AddressForm;
  saving: boolean;
  error: string;
  onChange: (patch: Partial<AddressForm>) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [errors, setErrors] = useState<AddressErrors>({});
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, saving]);

  const set = (patch: Partial<AddressForm>) => {
    onChange(patch);
    setErrors((cur) => {
      const next = { ...cur };
      (Object.keys(patch) as (keyof AddressForm)[]).forEach((k) => delete next[k]);
      return next;
    });
  };

  // The checkout form keeps one free-text address line, so compose it from the picked parts.
  // Fields Google could not identify are left as the customer typed them.
  const applyPicked = (p: PickedAddress) => {
    const line = [p.flat, p.building, p.area, p.landmark].filter(Boolean).join(', ');
    const patch: Partial<AddressForm> = {};
    if (line) patch.address = line;
    if (p.city) patch.city = p.city;
    if (p.state) patch.state = p.state;
    if (p.pincode) patch.pincode = p.pincode;
    if (p.latitude != null && p.longitude != null) {
      patch.latitude = p.latitude;
      patch.longitude = p.longitude;
    }
    set(patch);
  };

  const input = (name: keyof AddressForm, placeholder: string, type = 'text', mode?: 'numeric' | 'tel') => (
    <input
      type={type}
      inputMode={mode}
      value={String(form[name])}
      onChange={(e) => set({ [name]: e.target.value } as Partial<AddressForm>)}
      placeholder={placeholder}
      aria-invalid={Boolean(errors[name])}
      className="ck-input"
      autoComplete="off"
    />
  );

  const sectionLabel = 'text-[13px] font-semibold uppercase tracking-[0.08em] text-[#666666]';

  const modal = (
    <div className="ck-scope fixed inset-0 z-[9500] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-modal-title"
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-[16px] border border-[#E5E5E5] bg-white md:max-w-5xl"
        style={{ maxHeight: 'calc(100dvh - 1.5rem)' }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#E5E5E5] px-5 py-4 sm:px-6">
          <div>
            <h3 id="address-modal-title" className="ck-h">
              {editingId ? 'Edit address' : 'Add new address'}
            </h3>
            <p className="mt-0.5 text-[14px] text-[#666666]">Pin your location on the map, then confirm your details.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E5E5E5] text-[#111111] hover:border-[#111111] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          noValidate
          onSubmit={async (e) => {
            // Rendered via a portal: stop React from bubbling the submit to
            // the checkout <form>, which would place an order.
            e.preventDefault();
            e.stopPropagation();
            if (saving || checking) return;
            const found = validateAddress(form);
            if (Object.keys(found).length === 0) {
              setChecking(true);
              const mismatch = await pincodeMismatch(form);
              setChecking(false);
              if (mismatch) found.pincode = mismatch;
            }
            setErrors(found);
            if (Object.keys(found).length === 0) onSubmit();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
         <div className="ck-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain md:grid md:grid-cols-2 md:items-start">
          {/* Left: find the place */}
          <section aria-label="Location" className="space-y-3 border-b border-[#E5E5E5] p-5 sm:p-6 md:border-b-0 md:border-r">
            <p className={sectionLabel}>1 · Find your location</p>
            <CurrentLocationButton onPick={applyPicked} inputClassName="ck-input" />
            <SavedPinNotice latitude={form.latitude} longitude={form.longitude} onClear={() => set({ latitude: null, longitude: null })} />
          </section>

          {/* Right: confirm the details */}
          <section aria-label="Delivery details" className="space-y-4 p-5 sm:p-6">
            <p className={sectionLabel}>2 · Delivery details</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.name}>
                {input('name', 'e.g. Aarav Mehta')}
              </Field>
              <Field label="Phone number" error={errors.phone}>
                {input('phone', '+91 98765 43210', 'tel', 'tel')}
              </Field>
            </div>

            <Field label="Address" error={errors.address}>
              <textarea
                rows={3}
                value={form.address}
                onChange={(e) => set({ address: e.target.value })}
                placeholder="House / flat no., building, street, area"
                aria-invalid={Boolean(errors.address)}
                className="ck-input resize-none"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pincode" error={errors.pincode}>
                {input('pincode', '380015', 'text', 'numeric')}
              </Field>
              <Field label="City" error={errors.city}>
                {input('city', 'Ahmedabad')}
              </Field>
            </div>
            <Field label="State" error={errors.state}>
              {input('state', 'Gujarat')}
            </Field>

            <fieldset className="space-y-1.5">
              <legend className="text-[15px] font-semibold text-[#111111]">Address type</legend>
              <div role="radiogroup" aria-label="Address type" className="grid grid-cols-3 gap-2">
                {['Home', 'Work', 'Other'].map((type) => {
                  const active = form.address_type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => set({ address_type: type })}
                      className={`min-h-[44px] border text-[15px] font-semibold transition-colors ${
                        active ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#BDBDBD] bg-white text-[#111111] hover:border-[#111111]'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="flex min-h-[44px] items-center gap-3 text-[16px] text-[#111111]">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => set({ is_default: e.target.checked })}
                className="h-5 w-5 accent-[#111111]"
              />
              Make this my default address
            </label>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-[4px] border border-[#C8211F] bg-white px-4 py-3 text-[15px] text-[#C8211F]"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </section>
         </div>

          <div className="flex shrink-0 flex-row gap-3 border-t border-[#E5E5E5] bg-[#FFFFFF] px-5 py-4 sm:justify-end sm:px-6">
            <button type="button" onClick={onClose} disabled={saving} className="ck-ghost flex-1 sm:flex-none">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || checking}
              className="ck-cta !w-auto !px-6 flex-1 sm:flex-none"
            >
              {(saving || checking) && <Loader2 className="h-4 w-4 animate-spin" />}
              {checking ? 'Checking address…' : saving ? 'Saving…' : error ? 'Retry save' : editingId ? 'Save changes' : 'Save address'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  // Portal: the checkout page is itself a <form>; nesting forms breaks submit.
  return createPortal(modal, document.body);
}

export function AddressManager({
  selectedAddressId,
  onSelect,
}: {
  selectedAddressId: string | null;
  onSelect: (address: Address | null) => void;
}) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const busy = useRef(false); // duplicate-submit lock for save / delete / default

  const loadAddresses = async (preferredId?: string | null) => {
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/api/addresses');
      const next = unwrap<Address[]>(data, ['addresses', 'data']) || [];

      setAddresses(next);

      const preferred = preferredId && next.find((a) => a.id === preferredId);
      const defaultAddress = next.find((a) => a.is_default);

      onSelect(preferred || defaultAddress || next[0] || null);
    } catch (err) {
      setError(friendlyError(err, 'Unable to load saved addresses.'));
      setAddresses([]);
      onSelect(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAddresses(selectedAddressId);
    // Load once when checkout mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setModalError('');
    setForm({ ...EMPTY_FORM, is_default: addresses.length === 0 });
    setModalOpen(true);
  };

  const openEdit = (a: Address) => {
    setEditingId(a.id);
    setModalError('');
    setForm({
      name: a.name,
      phone: a.phone,
      pincode: a.pincode,
      address: a.address,
      city: a.city,
      state: a.state,
      address_type: a.address_type || 'Home',
      is_default: Boolean(a.is_default),
      latitude: a.latitude ?? null,
      longitude: a.longitude ?? null,
    });
    setModalOpen(true);
  };

  const saveAddress = async () => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setModalError('');

    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        pincode: form.pincode.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        addressType: form.address_type,
        isDefault: form.is_default,
        latitude: form.latitude,
        longitude: form.longitude,
      };

      let preferredAddressId: string | null = editingId;

      if (editingId) {
        await apiRequest(`/api/addresses/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        const created = await apiRequest('/api/addresses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const createdAddress = created?.address || created?.data || created;
        preferredAddressId = createdAddress?.id || createdAddress?._id || null;
      }

      setModalOpen(false);
      await loadAddresses(preferredAddressId);
    } catch (err) {
      setModalError(friendlyError(err, 'Unable to save address.'));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const removeAddress = async (id: string) => {
    if (busy.current || !addresses.find((a) => a.id === id)) return;
    busy.current = true;
    setSaving(true);
    setError('');

    try {
      await apiRequest(`/api/addresses/${id}`, { method: 'DELETE' });

      const remaining = addresses.filter((a) => a.id !== id);
      setAddresses(remaining);
      onSelect(remaining.find((a) => a.is_default) || remaining[0] || null);
    } catch (err) {
      setError(friendlyError(err, 'Unable to delete address.'));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const makeDefault = async (id: string) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');

    try {
      await apiRequest(`/api/addresses/${id}/default`, { method: 'PATCH' });

      const data = await apiRequest('/api/addresses');
      const next = unwrap<Address[]>(data, ['addresses', 'data']) || [];
      setAddresses(next);

      onSelect(
        next.find((a) => a.id === selectedAddressId) ||
          next.find((a) => a.is_default) ||
          next[0] ||
          null
      );
    } catch (err) {
      setError(friendlyError(err, 'Unable to update default address.'));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const needsSignIn = /sign in/i.test(error);

  return (
    <>
      <div className="space-y-3">

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-[#C8211F] bg-white px-4 py-3 text-[15px] text-[#C8211F]"
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </span>
            {needsSignIn ? (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('ardenby-open-auth'))}
                className="ck-ghost"
              >
                Sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void loadAddresses(selectedAddressId)}
                disabled={loading}
                className="ck-ghost"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Retry
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div
            className="flex min-h-[140px] items-center justify-center rounded-[8px] border border-[#E5E5E5] bg-[#F5F5F5]"
            aria-busy="true"
            aria-label="Loading addresses"
          >
            <Loader2 className="h-6 w-6 animate-spin text-[#4A4A4A]" />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {addresses.map((a) => {
              const on = selectedAddressId === a.id;

              return (
                <div key={a.id} className="ck-tile flex min-w-0 flex-col" data-on={on}>
                  <button
                    type="button"
                    onClick={() => onSelect(a)}
                    role="radio"
                    aria-checked={on}
                    className="flex-1 rounded-t-[8px] p-4 text-left sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                          on ? 'border-[#111111]' : 'border-[#BDBDBD]'
                        }`}
                      >
                        {on && <span className="h-3 w-3 rounded-full bg-[#111111]" />}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="break-words text-[16px] font-bold leading-6 text-[#111111]">{a.name}</p>
                          <span className="rounded-full border border-[#E5E5E5] bg-[#F5F5F5] px-2.5 py-0.5 text-[12px] font-semibold text-[#111111]">
                            {a.address_type || 'Address'}
                          </span>
                          {Boolean(a.is_default) && (
                            <span className="rounded-full bg-[#111111] px-2.5 py-0.5 text-[12px] font-semibold text-white">Default</span>
                          )}
                        </div>
                        <p className="mt-2 break-words text-[15px] leading-6 text-[#555555]">
                          {a.address}
                          <br />
                          {a.city}, {a.state} {a.pincode}
                        </p>
                        <p className="mt-1.5 text-[15px] text-[#555555]">{maskPhone(a.phone)}</p>
                      </div>
                    </div>
                  </button>

                  <div className="flex flex-wrap items-center gap-x-4 border-t border-[#EDEDED] px-4 pl-[52px] sm:pl-[56px] sm:pr-5">
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      className="min-h-[44px] text-[15px] font-semibold text-[#111111] underline underline-offset-4"
                    >
                      Edit
                    </button>
                    {!a.is_default && (
                      <button
                        type="button"
                        onClick={() => void makeDefault(a.id)}
                        disabled={saving}
                        className="min-h-[44px] text-[15px] font-medium text-[#444444] underline underline-offset-4 disabled:opacity-40"
                      >
                        Set as default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void removeAddress(a.id)}
                      disabled={saving}
                      className="ml-auto min-h-[44px] text-[15px] font-semibold text-[#C8211F] underline underline-offset-4 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={openAdd}
              className="group flex min-h-[52px] items-center justify-center gap-2.5 rounded-[8px] border border-dashed border-[#BDBDBD] bg-[#FAFAFA] px-4 text-[15px] font-semibold text-[#111111] transition hover:border-[#111111] md:col-span-2"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#111111] text-white">
                <Plus className="h-4 w-4" />
              </span>
              Add new address
            </button>
          </div>
        )}
      </div>

      {modalOpen && (
        <AddressModal
          editingId={editingId}
          form={form}
          saving={saving}
          error={modalError}
          onChange={(patch) => setForm((cur) => ({ ...cur, ...patch }))}
          onClose={() => setModalOpen(false)}
          onSubmit={() => void saveAddress()}
        />
      )}
    </>
  );
}
