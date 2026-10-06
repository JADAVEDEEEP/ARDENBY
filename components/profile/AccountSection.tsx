'use client';

import type { ReactNode } from 'react';
import type { useProfile } from '../../hooks/use-profile';
import { Pencil } from 'lucide-react';

type ProfileState = ReturnType<typeof useProfile>;

/* KOVENIK: surfaces #0A0A0A/#101010/#141414 · ivory #F3EBDD · gold #C9A24B · champagne #E6CF92 */
const GOLD_SURFACE =
  'bg-[linear-gradient(135deg,#9C7A32_0%,#E6CF92_45%,#B8903A_100%)] text-[#0A0A0A]';

const INPUT =
  'w-full min-h-[48px] rounded-lg border-[1px] border-[#C9A24B]/35 bg-[#0A0A0A] px-4 text-sm text-[#F3EBDD] placeholder:text-[#F3EBDD]/35 outline-none transition-colors focus:border-[#E6CF92] focus:shadow-[0_0_0_3px_rgba(201,162,75,0.12)]';

function InfoTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border-[1px] border-[#C9A24B]/20 bg-[#0D0D0D] px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">{label}</p>
      <p className="mt-1.5 break-words text-[14px] text-[#F3EBDD]">{value}</p>
    </div>
  );
}

function FieldBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function AccountSection({ profile }: { profile: ProfileState }) {
  return (
    <section>
      <p className="mb-5 text-[13px] text-[#F3EBDD]/60">Your personal information.</p>

      {!profile.editingAccount ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoTile label="Full Name" value={profile.displayName} />
            <InfoTile label="Email" value={profile.user?.email || '—'} />
            <InfoTile label="Phone" value={profile.user?.phone || '—'} />
            <InfoTile label="Gender" value={profile.user?.gender || '—'} />
          </div>

          <button
            type="button"
            onClick={() => profile.setEditingAccount(true)}
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-lg border-[1px] border-[#C9A24B]/60 px-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F3EBDD] transition-colors hover:border-[#E6CF92] hover:text-[#E6CF92]"
          >
            <Pencil className="h-3.5 w-3.5 text-[#C9A24B]" strokeWidth={1.6} />
            Edit Details
          </button>
        </>
      ) : (
        <form
          onSubmit={profile.updateAccount}
          className="max-w-2xl space-y-5 rounded-2xl border-[1px] border-[#C9A24B]/20 bg-[#0D0D0D] p-4 sm:p-6"
        >
          <FieldBlock label="Full Name">
            <input
              value={profile.fullName}
              onChange={(e) => profile.setFullName(e.target.value)}
              className={INPUT}
              required
            />
          </FieldBlock>

          <FieldBlock label="Email">
            <input
              value={profile.user?.email || ''}
              disabled
              className={`${INPUT} cursor-not-allowed opacity-50`}
            />
          </FieldBlock>

          <FieldBlock label="Phone">
            <input
              value={profile.phone}
              onChange={(e) => profile.setPhone(e.target.value.replace(/\D/g, ''))}
              className={INPUT}
            />
          </FieldBlock>

          <FieldBlock label="Gender">
            <select
              value={profile.gender}
              onChange={(e) => profile.setGender(e.target.value)}
              className={INPUT}
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </FieldBlock>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              disabled={profile.sectionLoading}
              className={`min-h-[46px] rounded-lg px-7 text-[10px] font-bold uppercase tracking-[0.16em] shadow-[0_0_18px_rgba(201,162,75,0.2)] transition hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 ${GOLD_SURFACE}`}
            >
              Save Changes
            </button>

            <button
              type="button"
              onClick={() => profile.setEditingAccount(false)}
              className="min-h-[46px] rounded-lg border-[1px] border-[#C9A24B]/50 px-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F3EBDD] transition-colors hover:border-[#E6CF92] hover:text-[#E6CF92]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}