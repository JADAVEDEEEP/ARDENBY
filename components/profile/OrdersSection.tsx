'use client';

import type { useProfile } from '../../hooks/use-profile';
import { Package } from 'lucide-react';
import { EmptyState, Field, Info, Panel, Stat } from './ui';

type ProfileState = ReturnType<typeof useProfile>;

export function OrdersSection({ profile }: { profile: ProfileState }) {
  return (
<Panel
                  title="My Orders"
                  subtitle="Your ARDENBY purchase history."
                >
                  {profile.orders.length ===
                  0 ? (
                    <EmptyState
                      icon={Package}
                      title="No profile.orders yet"
                      text="Your wardrobe journey starts here."
                      action="Continue Shopping"
                      onAction={() =>
                        profile.router.push('/')
                      }
                    />
                  ) : (
                    <div className="divide-y divide-[#E2DCD2]">
                      {profile.orders.map(
                        (order) => (
                          <div
                            key={order.id}
                            className="py-5 first:pt-0 last:pb-0"
                          >
                            <div className="grid gap-4 md:grid-cols-[1.4fr_0.7fr_0.7fr_auto] md:items-center">
                              <div>
                                <p className="text-[9px] uppercase tracking-[0.18em] text-[#9A8060]">
                                  Order
                                </p>

                                <p className="mt-1 text-sm font-medium">
                                  {
                                    order.order_number
                                  }
                                </p>

                                <p className="mt-1 text-[11px] text-[#81796F]">
                                  {new Date(
                                    order.created_at
                                  ).toLocaleDateString(
                                    'en-IN',
                                    {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    }
                                  )}
                                </p>
                              </div>

                              <Stat
                                label="Status"
                                value={
                                  order.status
                                }
                              />

                              <Stat
                                label="Total"
                                value={profile.money(
                                  order.total_amount
                                )}
                              />

                              <div className="flex flex-wrap gap-2 md:justify-end">
                                <button
                                  onClick={() =>
                                    profile.router.push(
                                      `/profile.orders/${order.id}`
                                    )
                                  }
                                  className="border border-[#BEB4A5] px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.13em] hover:bg-[#171717] hover:text-white"
                                >
                                  View Order
                                </button>

                                {[
                                  'Confirmed',
                                  'Processing',
                                  'Packed',
                                ].includes(
                                  order.status
                                ) && (
                                  <button
                                    onClick={() =>
                                      profile.cancelOrder(
                                        order.id
                                      )
                                    }
                                    className="px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-[#9A4F4F] hover:bg-red-50"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </Panel>
  );
}
