'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { useProfile } from '../../hooks/use-profile';
import { AlertCircle, BadgeCheck, Check, ChevronDown, Mail, Pencil, Phone, User, Users } from 'lucide-react';
import { IconDisc, SectionTitle } from './metal';

type ProfileState = ReturnType<typeof useProfile>;

function InfoTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="kv-inner flex min-h-[120px] items-start gap-4 p-5">
      <IconDisc icon={icon} size={44} className="!bg-[#F5F5F5]" />
      <div className="min-w-0">
        <p className="text-[15px] text-[#666666]">{label}</p>
        <p className="mt-1 break-words text-[20px] font-bold leading-6 text-[#111111]">{value}</p>
        {hint && <div className="mt-1.5 text-[15px] text-[#666666]">{hint}</div>}
      </div>
    </div>
  );
}

const genderLabel = (g?: string | null) => (g ? g.charAt(0).toUpperCase() + g.slice(1) : 'Not specified');

export function AccountSection({ profile }: { profile: ProfileState }) {
  const [phoneError, setPhoneError] = useState('');
  const verified = Boolean(profile.user?.email_verified);

  const submit = (e: React.FormEvent) => {
    const digits = profile.phone.replace(/\D/g, '');
    if (digits.length > 0 && digits.length !== 10) {
      e.preventDefault();
      setPhoneError('Enter a 10-digit mobile number');
      return;
    }
    setPhoneError('');
    void profile.updateAccount(e);
  };

  return (
    <section>
      <SectionTitle
        title="Account details"
        sub="Your personal information."
        action={
          !profile.editingAccount && (
            <button type="button" onClick={() => profile.setEditingAccount(true)} className="kv-btn-primary">
              <Pencil className="h-4 w-4" /> Edit details
            </button>
          )
        }
      />

      {!profile.editingAccount ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoTile icon={User} label="Full name" value={profile.displayName} />
          <InfoTile
            icon={Mail}
            label="Email"
            value={profile.user?.email || 'Not available'}
            hint={
              verified && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#111111]">
                  <Check className="h-4 w-4" strokeWidth={2.5} /> Verified
                </span>
              )
            }
          />
          <InfoTile
            icon={Phone}
            label="Phone"
            value={profile.user?.phone || 'Not added'}
            hint={!profile.user?.phone && 'Add a number for delivery updates'}
          />
          <InfoTile icon={Users} label="Gender" value={genderLabel(profile.user?.gender)} />
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="max-w-2xl space-y-5">
          <div>
            <label htmlFor="acc-name" className="kv-field-label">Full name</label>
            <input
              id="acc-name"
              value={profile.fullName}
              onChange={(e) => profile.setFullName(e.target.value)}
              className="kv-input"
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label htmlFor="acc-email" className="kv-field-label">Email</label>
            <input id="acc-email" value={profile.user?.email || ''} readOnly className="kv-input" />
            {verified && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[15px] text-[#666666]">
                <BadgeCheck className="h-4 w-4" /> Verified · your sign-in email
              </p>
            )}
          </div>

          <div>
            <label htmlFor="acc-phone" className="kv-field-label">
              Phone <span className="font-normal text-[#666666]">(optional)</span>
            </label>
            <div className="flex">
              <span className="flex min-h-[52px] items-center rounded-l-[2px] border border-r-0 border-[#BDBDBD] bg-[#F5F5F5] px-4 text-[16px]">
                +91
              </span>
              <input
                id="acc-phone"
                value={profile.phone}
                inputMode="numeric"
                autoComplete="tel-national"
                onChange={(e) => {
                  setPhoneError('');
                  profile.setPhone(e.target.value.replace(/\D/g, ''));
                }}
                aria-invalid={Boolean(phoneError)}
                aria-describedby={phoneError ? 'acc-phone-error' : undefined}
                className="kv-input !rounded-l-none"
              />
            </div>
            {phoneError && (
              <p id="acc-phone-error" role="alert" className="kv-error">
                <AlertCircle className="h-4 w-4 shrink-0" /> {phoneError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="acc-gender" className="kv-field-label">
              Gender <span className="font-normal text-[#666666]">(optional)</span>
            </label>
            <div className="relative">
              <select
                id="acc-gender"
                value={profile.gender}
                onChange={(e) => profile.setGender(e.target.value)}
                className="kv-input appearance-none !pr-10"
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button disabled={profile.sectionLoading} className="kv-btn-primary sm:min-w-[180px]">
              {profile.sectionLoading ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPhoneError('');
                profile.setEditingAccount(false);
              }}
              className="kv-btn-ghost"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
