'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';

import { Notice, btnOutline, btnPrimary, fieldClass, labelClass } from '@/components/admin/ui';
import { opsRequest, message } from '@/lib/admin-ops-api';
import { BANNER_MAX_BYTES, BANNER_TYPES, isSafeBannerLink, type AdminBanner } from '@/lib/banner-api';

/** ISO (UTC) -> value for <input type="datetime-local"> in the admin's own time zone. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** datetime-local value (admin's time zone) -> ISO string, or '' when empty. */
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : '');

function ImagePicker({
  id,
  label,
  hint,
  existingUrl,
  file,
  frameClass,
  onPick,
  onError,
  optional,
  onRemove,
}: {
  id: string;
  label: string;
  hint: string;
  existingUrl: string | null;
  file: File | null;
  frameClass: string;
  onPick: (file: File | null) => void;
  onError: (text: string) => void;
  optional?: boolean;
  onRemove?: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;
    if (!BANNER_TYPES.includes(picked.type)) return onError('Please choose a JPG, PNG, WEBP or AVIF image.');
    if (picked.size > BANNER_MAX_BYTES) return onError('Each image must be 5 MB or smaller.');
    onError('');
    onPick(picked);
  };

  const shown = preview || existingUrl;

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {optional && <span className="ml-1 font-normal text-[#626875]">(optional)</span>}
      </label>
      <div className={`relative overflow-hidden rounded-lg border border-dashed border-[#D0D5DD] bg-[#F5F6F8] ${frameClass}`}>
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt={`${label} preview`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center text-[13px] text-[#626875]">
            <ImagePlus className="h-6 w-6" />
            No image chosen
          </div>
        )}
      </div>
      <p className="mt-1.5 text-[12px] text-[#626875]">{hint}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <label htmlFor={id} className={`${btnOutline} cursor-pointer`}>
          {shown ? 'Replace image' : 'Choose image'}
        </label>
        {onRemove && existingUrl && !file && (
          <button type="button" className={btnOutline} onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
      <input id={id} type="file" accept={BANNER_TYPES.join(',')} onChange={choose} className="sr-only" />
    </div>
  );
}

export function BannerFormDialog({
  banner,
  nextOrder,
  onSaved,
  onClose,
}: {
  banner: AdminBanner | null;
  nextOrder: number;
  onSaved: (text: string) => void;
  onClose: () => void;
}) {
  const editing = Boolean(banner);
  const [name, setName] = useState(banner?.name ?? '');
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl ?? '');
  const [startAt, setStartAt] = useState(toLocalInput(banner?.startAt ?? null));
  const [endAt, setEndAt] = useState(toLocalInput(banner?.endAt ?? null));
  const [sortOrder, setSortOrder] = useState(String(banner?.sortOrder ?? nextOrder));
  const [active, setActive] = useState(banner?.active ?? true);
  const [image, setImage] = useState<File | null>(null);
  const [mobileImage, setMobileImage] = useState<File | null>(null);
  const [removeMobile, setRemoveMobile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [busy, onClose]);

  const validate = () => {
    if (!name.trim()) return 'Banner title is required.';
    if (name.trim().length > 200) return 'Banner title must be at most 200 characters.';
    if (!editing && !image) return 'Please choose a banner image.';
    if (linkUrl.trim() && !isSafeBannerLink(linkUrl.trim())) {
      return 'Destination link must be a full http(s) URL or a path starting with /.';
    }
    if (startAt && endAt && new Date(endAt) <= new Date(startAt)) return 'End date must be after the start date.';
    const order = Number(sortOrder);
    if (sortOrder === '' || !Number.isInteger(order) || order < 0 || order > 9999) {
      return 'Display order must be a whole number from 0 to 9999.';
    }
    return '';
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);

    const body = new FormData();
    body.set('name', name.trim());
    body.set('linkUrl', linkUrl.trim());
    body.set('startAt', fromLocalInput(startAt));
    body.set('endAt', fromLocalInput(endAt));
    body.set('sortOrder', String(Number(sortOrder)));
    body.set('active', String(active));
    if (image) body.set('image', image);
    if (mobileImage) body.set('mobileImage', mobileImage);
    if (removeMobile && !mobileImage) body.set('removeMobileImage', 'true');

    setBusy(true);
    setError('');
    try {
      const result = await opsRequest<{ message?: string }>(
        editing ? `/api/admin/banners/${banner!.id}` : '/api/admin/banners',
        { method: editing ? 'PUT' : 'POST', body }
      );
      onSaved(result.message || 'Banner saved.');
    } catch (e) {
      setError(message(e));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 md:items-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => !busy && onClose()} />
      <form
        onSubmit={submit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="banner-form-title"
        className="relative my-4 w-full max-w-3xl rounded-xl border border-[#E4E7EC] bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-[#E4E7EC] px-5 py-4 md:px-6">
          <h2 id="banner-form-title" className="text-[20px] font-bold text-[#111111]">
            {editing ? 'Edit banner' : 'New banner'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#626875] hover:bg-[#F5F6F8]"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid gap-6 p-5 md:grid-cols-2 md:p-6">
          <div className="space-y-5">
            <ImagePicker
              id="banner-image"
              label="Desktop image"
              hint="Landscape, about 1800 x 1200 px (3:2). JPG, PNG, WEBP or AVIF, up to 5 MB. Keep the key content in the middle: the slider crops to its column."
              existingUrl={banner?.imageUrl ?? null}
              file={image}
              frameClass="aspect-[9/7]"
              onPick={setImage}
              onError={setError}
            />
            <ImagePicker
              id="banner-mobile-image"
              label="Mobile image"
              optional
              hint="Portrait, about 1200 x 1500 px (4:5). Phones use the desktop image when this is empty."
              existingUrl={removeMobile ? null : banner?.mobileImageUrl ?? null}
              file={mobileImage}
              frameClass="aspect-[4/5] max-w-[240px]"
              onPick={(f) => {
                setMobileImage(f);
                setRemoveMobile(false);
              }}
              onError={setError}
              onRemove={() => setRemoveMobile(true)}
            />
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="banner-name" className={labelClass}>
                Banner title
              </label>
              <input
                id="banner-name"
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
                placeholder="New collection"
                className={fieldClass}
              />
              <p className="mt-1.5 text-[12px] text-[#626875]">Shown to screen readers and used to identify the banner here.</p>
            </div>

            <div>
              <label htmlFor="banner-link" className={labelClass}>
                Destination link
                <span className="ml-1 font-normal text-[#626875]">(optional)</span>
              </label>
              <input
                id="banner-link"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                maxLength={2048}
                placeholder="/shop or https://..."
                className={fieldClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="banner-start" className={labelClass}>
                  Starts
                </label>
                <input id="banner-start" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="banner-end" className={labelClass}>
                  Ends
                </label>
                <input id="banner-end" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className={fieldClass} />
              </div>
            </div>
            <p className="-mt-3 text-[12px] text-[#626875]">Your local time. Leave empty for no start or end limit.</p>

            <div>
              <label htmlFor="banner-order" className={labelClass}>
                Display order
              </label>
              <input
                id="banner-order"
                type="number"
                inputMode="numeric"
                min={0}
                max={9999}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={fieldClass}
              />
              <p className="mt-1.5 text-[12px] text-[#626875]">Lower numbers show first.</p>
            </div>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[14px] font-semibold text-[#111111]">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-5 w-5 accent-[#E53935]"
              />
              Active (show on the homepage when within its dates)
            </label>
          </div>
        </div>

        {error && (
          <div className="px-5 pb-2 md:px-6">
            <Notice tone="error">{error}</Notice>
          </div>
        )}

        <footer className="flex justify-end gap-3 border-t border-[#E4E7EC] px-5 py-4 md:px-6">
          <button type="button" className={btnOutline} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={btnPrimary} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? 'Save changes' : 'Create banner'}
          </button>
        </footer>
      </form>
    </div>
  );
}
