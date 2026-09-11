'use client';

import type { useProfile } from '../../hooks/use-profile';
import { Pencil } from 'lucide-react';
import { EmptyState, Field, Info, Panel, Stat } from './ui';

type ProfileState = ReturnType<typeof useProfile>;

export function AccountSection({ profile }: { profile: ProfileState }) {
  return (
<Panel
                  title="Account Details"
                  subtitle="Your personal information."
                >
                  {!profile.editingAccount ? (
                    <>
                      <div className="grid gap-x-10 gap-y-7 border-y border-[#E2DCD2] py-6 sm:grid-cols-2">
                        <Info
                          label="Full Name"
                          value={
                            profile.displayName
                          }
                        />

                        <Info
                          label="Email"
                          value={
                            profile.user.email ||
                            '—'
                          }
                        />

                        <Info
                          label="Phone"
                          value={
                            profile.user.phone ||
                            '—'
                          }
                        />

                        <Info
                          label="Gender"
                          value={
                            profile.user.gender ||
                            '—'
                          }
                        />
                      </div>

                      <button
                        onClick={() =>
                          profile.setEditingAccount(
                            true
                          )
                        }
                        className="mt-6 border border-[#BEB4A5] px-5 py-2.5 text-[9px] font-semibold uppercase tracking-[0.15em] hover:bg-[#171717] hover:text-white"
                      >
                        <Pencil className="mr-2 inline h-3.5 w-3.5" />

                        Edit Details
                      </button>
                    </>
                  ) : (
                    <form
                      onSubmit={
                        profile.updateAccount
                      }
                      className="max-w-2xl space-y-5"
                    >
                      <Field label="Full Name">
                        <input
                          value={
                            profile.fullName
                          }
                          onChange={(
                            e
                          ) =>
                            profile.setFullName(
                              e.target
                                .value
                            )
                          }
                          className="w-full border-b border-[#CFC6B8] bg-transparent px-0 py-3 text-sm outline-none focus:border-[#171717]"
                          required
                        />
                      </Field>

                      <Field label="Email">
                        <input
                          value={
                            profile.user.email ||
                            ''
                          }
                          disabled
                          className="w-full border-b border-[#CFC6B8] bg-transparent px-0 py-3 text-sm outline-none opacity-50"
                        />
                      </Field>

                      <Field label="Phone">
                        <input
                          value={
                            profile.phone
                          }
                          onChange={(
                            e
                          ) =>
                            profile.setPhone(
                              e.target.value.replace(
                                /\D/g,
                                ''
                              )
                            )
                          }
                          className="w-full border-b border-[#CFC6B8] bg-transparent px-0 py-3 text-sm outline-none focus:border-[#171717]"
                        />
                      </Field>

                      <Field label="Gender">
                        <select
                          value={
                            profile.gender
                          }
                          onChange={(
                            e
                          ) =>
                            profile.setGender(
                              e.target
                                .value
                            )
                          }
                          className="w-full border-b border-[#CFC6B8] bg-transparent px-0 py-3 text-sm outline-none focus:border-[#171717]"
                        >
                          <option value="">
                            Prefer not to
                            say
                          </option>

                          <option value="male">
                            Male
                          </option>

                          <option value="female">
                            Female
                          </option>

                          <option value="other">
                            Other
                          </option>
                        </select>
                      </Field>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          disabled={
                            profile.sectionLoading
                          }
                          className="bg-[#171717] px-5 py-2.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-white disabled:opacity-50"
                        >
                          Save Changes
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            profile.setEditingAccount(
                              false
                            )
                          }
                          className="border border-[#BEB4A5] px-5 py-2.5 text-[9px] uppercase tracking-[0.15em]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </Panel>
  );
}
