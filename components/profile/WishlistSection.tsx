'use client';

import type { useProfile } from '../../hooks/use-profile';
import { ShoppingBag, Heart } from 'lucide-react';
import { EmptyState, Field, Info, Panel, Stat } from './ui';

type ProfileState = ReturnType<typeof useProfile>;

export function WishlistSection({ profile }: { profile: ProfileState }) {
  return (
<Panel
                  title="Wishlist"
                  subtitle="Pieces you've chosen to keep close."
                >
                  {profile.wishlist.length ===
                  0 ? (
                    <EmptyState
                      icon={Heart}
                      title="Nothing saved yet"
                      text="Save pieces you love and they will appear here."
                      action="Explore Collection"
                      onAction={() =>
                        profile.router.push('/')
                      }
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                      {profile.wishlist.map(
                        (item) => (
                          <div
                            key={
                              item.product_id
                            }
                            className="group"
                          >
                            <div className="relative overflow-hidden bg-[#ECE8E0]">
                              {item.image_url ||
                              item.product_image ? (
                                <img
                                  src={
                                    item.image_url ||
                                    item.product_image
                                  }
                                  alt={
                                    item.product_name ||
                                    item.name ||
                                    'Product'
                                  }
                                  className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                                />
                              ) : (
                                <div className="flex aspect-[4/5] items-center justify-center">
                                  <ShoppingBag className="h-7 w-7 text-[#A0988E]" />
                                </div>
                              )}
                            </div>

                            <div className="pt-3">
                              <p className="text-[11px] font-medium leading-4">
                                {item.product_name ||
                                  item.name ||
                                  'ARDENBY Product'}
                              </p>

                              {item.price !==
                                undefined && (
                                <p className="mt-1 text-[11px] text-[#6F685F]">
                                  {profile.money(
                                    item.price
                                  )}
                                </p>
                              )}

                              <button
                                onClick={() =>
                                  profile.router.push(
                                    `/products/${item.product_id}`
                                  )
                                }
                                className="mt-3 text-[9px] uppercase tracking-[0.16em] underline underline-offset-4"
                              >
                                View piece
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
