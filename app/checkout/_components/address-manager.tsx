'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Building2,
  Home,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  apiRequest,
  friendlyError,
  unwrap,
  validateAddress,
  type Address,
  type AddressErrors,
  type AddressForm,
} from './shared';

const EMPTY_FORM: AddressForm = {
  name: '',
  phone: '',
  pincode: '',
  address: '',
  city: '',
  state: '',
  address_type: 'Home',
  is_default: false,
};

function TypeIcon({ type, className }: { type: string; className?: string }) {
  const t = (type || '').toLowerCase();
  if (t === 'home') return <Home className={className} />;
  if (t === 'work') return <Building2 className={className} />;
  return <MapPin className={className} />;
}

const ICON_TONE: Record<string, string> = {
  home: 'ck-ico-blue',
  work: 'ck-ico-violet',
};

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
      <span className="text-xs font-semibold tracking-wide text-[#C0C0C0]">{label}</span>
      {children}
      {error && (
        <span role="alert" className="flex items-center gap-1 text-xs text-[#ffffff]">
          <AlertCircle className="h-3 w-3" /> {error}
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

  const modal = (
    <div className="ck-scope fixed inset-0 z-[9500] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-modal-title"
        className="ck-panel flex w-full max-w-xl flex-col overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 1.5rem)' }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#2A2A2A] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-medium tracking-[0.14em] text-[#C0C0C0]">
              {editingId ? 'UPDATE ADDRESS' : 'NEW ADDRESS'}
            </p>
            <h3 id="address-modal-title" className="mt-0.5 text-xl font-medium text-[#ffffff]">
              {editingId ? 'Edit address' : 'Add address'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3A3A3A] text-[#C0C0C0] hover:border-[#C0C0C0] hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            // Rendered via a portal: stop React from bubbling the submit to
            // the checkout <form>, which would place an order.
            e.preventDefault();
            e.stopPropagation();
            if (saving) return;
            const found = validateAddress(form);
            setErrors(found);
            if (Object.keys(found).length === 0) onSubmit();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
         <div className="ck-scroll min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors.name}>
              {input('name', 'e.g. Aarav Mehta')}
            </Field>
            <Field label="Phone number" error={errors.phone}>
              {input('phone', '+91 98765 43210', 'tel', 'tel')}
            </Field>
            <Field label="Pincode" error={errors.pincode}>
              {input('pincode', '380015', 'text', 'numeric')}
            </Field>
            <Field label="City" error={errors.city}>
              {input('city', 'Ahmedabad')}
            </Field>
            <Field label="State" error={errors.state}>
              {input('state', 'Gujarat')}
            </Field>
            <Field label="Address type">
              <select
                value={form.address_type}
                onChange={(e) => set({ address_type: e.target.value })}
                className="ck-input"
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </Field>
          </div>

          <Field label="Address" error={errors.address}>
            <textarea
              rows={3}
              value={form.address}
              onChange={(e) => set({ address: e.target.value })}
              placeholder="House / flat no., street, area"
              aria-invalid={Boolean(errors.address)}
              className="ck-input resize-none"
            />
          </Field>

          <label className="flex items-center gap-3 text-sm text-[#C0C0C0]">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => set({ is_default: e.target.checked })}
              className="h-4 w-4 accent-[#C0C0C0]"
            />
            Make this my default address
          </label>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2  border border-[#2A2A2A] bg-[#0A0A0A] px-4 py-3 text-sm text-[#ffffff]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

         </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-[#2A2A2A] bg-[#0A0A0A] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button type="button" onClick={onClose} disabled={saving} className="ck-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2  ck-cta !w-auto ! !px-6 !py-3 !text-xs hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving…' : error ? 'Retry save' : editingId ? 'Save changes' : 'Save address'}
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
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C0C0C0]/70">
          Saved addresses
        </p>

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3  border border-[#2A2A2A] bg-[#0A0A0A] px-4 py-3 text-sm text-[#ffffff]"
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
            className="flex min-h-[140px] items-center justify-center  border border-[#2A2A2A] bg-white/[0.03]"
            aria-busy="true"
            aria-label="Loading addresses"
          >
            <Loader2 className="h-6 w-6 animate-spin text-[#C0C0C0]" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_0.7fr]">
            {addresses.map((a) => {
              const on = selectedAddressId === a.id;
              const tone = ICON_TONE[(a.address_type || '').toLowerCase()] || 'ck-ico-cyan';

              return (
                <div key={a.id} className="ck-tile flex flex-col" data-on={on}>
                  <button
                    type="button"
                    onClick={() => onSelect(a)}
                    role="radio"
                    aria-checked={on}
                    className="flex-1  p-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`ck-ico flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}
                      >
                        <TypeIcon type={a.address_type} className="h-5 w-5" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#ffffff]">{a.name}</p>
                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#C0C0C0]/70">
                          {a.address_type || 'Address'}
                          {a.is_default && ' · Default'}
                        </p>
                      </div>

                      <span
                        aria-hidden
                        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          on ? 'border-[#C0C0C0] bg-[#C0C0C0]/15' : 'border-[#3A3A3A]'
                        }`}
                      >
                        {on && <span className="ck-radio-dot h-2.5 w-2.5 rounded-full" />}
                      </span>
                    </div>

                    <p className="mt-3 text-[13px] leading-relaxed text-[#C0C0C0]">
                      {a.address}
                      <br />
                      {a.city}, {a.state} {a.pincode}
                    </p>
                    <p className="mt-1.5 text-xs text-[#C0C0C0]/70">{a.phone}</p>
                  </button>

                  <div className="flex items-center justify-between gap-2 border-t border-[#2A2A2A] px-4 py-2">
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C0C0C0] hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <span className="flex items-center gap-1">
                      {!a.is_default && (
                        <button
                          type="button"
                          onClick={() => void makeDefault(a.id)}
                          disabled={saving}
                          aria-label="Make default address"
                          title="Make default"
                          className=" p-1.5 text-[#C0C0C0]/70 hover:bg-white/10 hover:text-white disabled:opacity-40"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void removeAddress(a.id)}
                        disabled={saving}
                        aria-label="Delete address"
                        title="Delete"
                        className=" p-1.5 text-[#C0C0C0]/70 hover:bg-[#ffffff]/15 hover:text-[#ffffff] disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={openAdd}
              className="group flex min-h-[120px] flex-col items-center justify-center gap-2  border border-dashed border-[#3A3A3A] text-[11px] font-medium uppercase tracking-[0.14em] text-[#C0C0C0] transition hover:border-[#C0C0C0] hover:text-white"
            >
              <span className="ck-chip-chrome flex h-9 w-9 items-center justify-center rounded-full transition group-hover:rotate-90">
                <Plus className="h-5 w-5" />
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
