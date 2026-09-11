'use client';

import type { useProfile } from '../../hooks/use-profile';
import { MapPin, Plus, X } from 'lucide-react';
import { EmptyState, Field, Info, Panel, Stat } from './ui';

type ProfileState = ReturnType<typeof useProfile>;

export function AddressesSection({ profile }: { profile: ProfileState }) {
  return (
<Panel
                  title="Saved Addresses"
                  subtitle="Your preferred delivery destinations."
                  action={
                    <button
                      onClick={() => {
                        profile.resetAddressForm();
                        profile.setShowAddressForm(
                          true
                        );
                      }}
                      className="inline-flex items-center gap-2 bg-[#171717] px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Address
                    </button>
                  }
                >
                  {profile.showAddressForm && (
                    <form
                      onSubmit={profile.saveAddress}
                      className="mb-7 border-y border-[#DCD5C9] bg-[#F8F5EF] px-4 py-5 sm:px-6"
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <h3 className="font-serif text-xl">
                          {profile.editingAddressId
                            ? 'Edit Address'
                            : 'Add Address'}
                        </h3>

                        <button
                          type="button"
                          onClick={() => {
                            profile.setShowAddressForm(
                              false
                            );
                            profile.resetAddressForm();
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {[
                          [
                            'name',
                            'Full Name',
                          ],
                          [
                            'profile.phone',
                            'Phone',
                          ],
                          [
                            'pincode',
                            'Pincode',
                          ],
                          [
                            'city',
                            'City',
                          ],
                          [
                            'state',
                            'State',
                          ],
                        ].map(
                          ([
                            key,
                            label,
                          ]) => (
                            <label
                              key={key}
                              className="text-[10px] uppercase tracking-[0.12em] text-[#71695F]"
                            >
                              {label}

                              <input
                                required
                                value={
                                  profile.addressForm[
                                    key as keyof typeof profile.addressForm
                                  ] as string
                                }
                                onChange={(
                                  e
                                ) =>
                                  profile.setAddressForm(
                                    (
                                      prev
                                    ) => ({
                                      ...prev,
                                      [key]:
                                        e.target
                                          .value,
                                    })
                                  )
                                }
                                className="mt-2 w-full border-b border-[#CFC6B8] bg-transparent px-0 py-2.5 text-sm normal-case tracking-normal outline-none focus:border-[#171717]"
                              />
                            </label>
                          )
                        )}

                        <label className="text-[10px] uppercase tracking-[0.12em] text-[#71695F] sm:col-span-2">
                          Address

                          <textarea
                            required
                            rows={3}
                            value={
                              profile.addressForm.address
                            }
                            onChange={(
                              e
                            ) =>
                              profile.setAddressForm(
                                (prev) => ({
                                  ...prev,
                                  address:
                                    e.target
                                      .value,
                                })
                              )
                            }
                            className="mt-2 w-full resize-none border-b border-[#CFC6B8] bg-transparent px-0 py-2.5 text-sm normal-case tracking-normal outline-none focus:border-[#171717]"
                          />
                        </label>

                        <label className="text-[10px] uppercase tracking-[0.12em] text-[#71695F]">
                          Address Type

                          <select
                            value={
                              profile.addressForm.address_type
                            }
                            onChange={(
                              e
                            ) =>
                              profile.setAddressForm(
                                (prev) => ({
                                  ...prev,
                                  address_type:
                                    e.target
                                      .value,
                                })
                              )
                            }
                            className="mt-2 w-full border-b border-[#CFC6B8] bg-transparent py-2.5 text-sm normal-case tracking-normal outline-none"
                          >
                            <option>
                              Home
                            </option>
                            <option>
                              Work
                            </option>
                            <option>
                              Other
                            </option>
                          </select>
                        </label>

                        <label className="flex items-center gap-2 self-end pb-2 text-[10px] uppercase tracking-[0.1em] text-[#71695F]">
                          <input
                            type="checkbox"
                            checked={
                              profile.addressForm.is_default
                            }
                            onChange={(
                              e
                            ) =>
                              profile.setAddressForm(
                                (prev) => ({
                                  ...prev,
                                  is_default:
                                    e.target
                                      .checked,
                                })
                              )
                            }
                          />

                          Make default
                        </label>
                      </div>

                      <button
                        disabled={
                          profile.sectionLoading
                        }
                        className="mt-6 bg-[#171717] px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.15em] text-white disabled:opacity-50"
                      >
                        Save Address
                      </button>
                    </form>
                  )}

                  {profile.addresses.length ===
                  0 ? (
                    <EmptyState
                      icon={MapPin}
                      title="No saved profile.addresses"
                      text="Add an address for a faster checkout."
                    />
                  ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                      {profile.addresses.map(
                        (address) => (
                          <div
                            key={address.id}
                            className={`border-t-2 pt-4 ${
                              address.is_default
                                ? 'border-[#A98B62]'
                                : 'border-[#DCD5C9]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[9px] font-semibold uppercase tracking-[0.18em]">
                                {
                                  address.address_type
                                }
                              </p>

                              {address.is_default && (
                                <span className="text-[9px] uppercase tracking-[0.15em] text-[#9A8060]">
                                  Default
                                </span>
                              )}
                            </div>

                            <p className="mt-4 text-sm font-medium">
                              {
                                address.name
                              }
                            </p>

                            <p className="mt-1 text-[11px] text-[#81796F]">
                              {
                                address.phone
                              }
                            </p>

                            <p className="mt-3 max-w-md text-[12px] leading-5 text-[#4F4A44]">
                              {
                                address.address
                              }
                              ,{' '}
                              {
                                address.city
                              }
                              ,{' '}
                              {
                                address.state
                              }{' '}
                              —{' '}
                              {
                                address.pincode
                              }
                            </p>

                            <div className="mt-5 flex flex-wrap gap-4 text-[9px] font-semibold uppercase tracking-[0.13em]">
                              <button
                                onClick={() =>
                                  profile.editAddress(
                                    address
                                  )
                                }
                              >
                                Edit
                              </button>

                              {!address.is_default && (
                                <button
                                  onClick={() =>
                                    profile.setDefaultAddress(
                                      address.id
                                    )
                                  }
                                >
                                  Make Default
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  profile.deleteAddress(
                                    address.id
                                  )
                                }
                                className="text-[#9A4F4F]"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </Panel>
  );
}
