'use client';

import type { ReactNode } from 'react';
import type { useProfile } from '../../hooks/use-profile';
import { User, Mail, Phone, Users, Pencil, BadgeCheck } from 'lucide-react';
import { IconDisc, SectionTitle } from './metal';

type ProfileState = ReturnType<typeof useProfile>;

function InfoTile({ icon, label, value }: { icon: React.ElementType; label: string; value: ReactNode }) {
  return (
    <div className="kv-inner flex items-start gap-3 p-4">
      <IconDisc icon={icon} size={38} />
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9296A0]">{label}</p>
        <p className="mt-1 break-words text-[14px] text-white">{value}</p>
      </div>
    </div>
  );
}

function FieldBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="kv-field-label">{label}</span>
      {children}
    </label>
  );
}

const genderLabel = (g?: string | null) =>
  g ? g.charAt(0).toUpperCase() + g.slice(1) : 'Not specified';

export function AccountSection({ profile }: { profile: ProfileState }) {
  return (
    <section>
      <SectionTitle
        label="KOVENIK — ACCOUNT"
        title="Account Details"
        sub="Your personal information."
        action={
          !profile.editingAccount && (
            <button type="button" onClick={() => profile.setEditingAccount(true)} className="kv-btn-primary">
              <Pencil className="h-3.5 w-3.5" /> Edit details
            </button>
          )
        }
      />

      {!profile.editingAccount ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile icon={User} label="Full Name" value={profile.displayName} />
          <InfoTile
            icon={Mail}
            label="Email"
            value={
              <span className="inline-flex flex-wrap items-center gap-2">
                {profile.user?.email || 'Not available'}
                {profile.user?.email_verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#5FD08A]">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                )}
              </span>
            }
          />
          <InfoTile icon={Phone} label="Phone" value={profile.user?.phone || 'Not added'} />
          <InfoTile icon={Users} label="Gender" value={genderLabel(profile.user?.gender)} />
        </div>
      ) : (
        <form onSubmit={profile.updateAccount} className="kv-inner max-w-2xl space-y-5 p-4 sm:p-6">
          <FieldBlock label="Full Name">
            <input
              value={profile.fullName}
              onChange={(e) => profile.setFullName(e.target.value)}
              className="kv-input"
              required
            />
          </FieldBlock>

          <FieldBlock label="Email">
            <input value={profile.user?.email || ''} disabled className="kv-input" />
          </FieldBlock>

          <div className="grid gap-5 sm:grid-cols-2">
            <FieldBlock label="Phone">
              <input
                value={profile.phone}
                inputMode="numeric"
                onChange={(e) => profile.setPhone(e.target.value.replace(/\D/g, ''))}
                className="kv-input"
              />
            </FieldBlock>

            <FieldBlock label="Gender">
              <select value={profile.gender} onChange={(e) => profile.setGender(e.target.value)} className="kv-input">
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </FieldBlock>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button disabled={profile.sectionLoading} className="kv-btn-primary">
              {profile.sectionLoading ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => profile.setEditingAccount(false)} className="kv-btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
