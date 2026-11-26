/**
 * The 34 catalogue products imported from the KVK photo set. They are identified by their database ids
 * ("ard-kvk-<code>"); nothing about them (name, price, images, colours) is stored in the frontend.
 */
export const NEW_COLLECTION_ID_PREFIX = 'ard-kvk-';

type HasId = { id?: unknown };

export const isNewCollection = (p: HasId | null | undefined): boolean =>
  String(p?.id ?? '').startsWith(NEW_COLLECTION_ID_PREFIX);

/**
 * The round-neck tees (ard-kvk-101 ... ard-kvk-110) are shot on a plain studio wall. The polo, premium and
 * trouser photos carry design-number / fit text in the background, so they are not used as tile covers.
 */
export const hasPlainBackground = (p: HasId | null | undefined): boolean =>
  /^ard-kvk-\d+$/.test(String(p?.id ?? ''));

// ids look like ard-kvk-polo-101 / ard-kvk-101 (round neck) / ard-kvk-vip-101 / ard-kvk-tt-101
const typeOf = (id: string): string => {
  const rest = id.slice(NEW_COLLECTION_ID_PREFIX.length);
  return /^\d+$/.test(rest) ? 'tee' : rest.split('-')[0];
};

/** The new products in a stable, varied order: one of each type in turn (polo, tee, premium, trousers, ...). */
export function interleaveNewCollection<T extends HasId>(list: T[]): T[] {
  const buckets = new Map<string, T[]>();
  [...list]
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .forEach((p) => {
      const key = typeOf(String(p.id));
      buckets.set(key, [...(buckets.get(key) ?? []), p]);
    });
  const lanes = Array.from(buckets.values());
  const out: T[] = [];
  for (let i = 0; lanes.some((l) => i < l.length); i++) {
    for (const lane of lanes) if (i < lane.length) out.push(lane[i]);
  }
  return out;
}

/** New products first (varied order), every other product after them in its existing order. Nothing is dropped. */
export function prioritizeNewCollection<T extends HasId>(list: T[]): T[] {
  const fresh = list.filter(isNewCollection);
  if (fresh.length === 0) return list;
  return [...interleaveNewCollection(fresh), ...list.filter((p) => !isNewCollection(p))];
}
