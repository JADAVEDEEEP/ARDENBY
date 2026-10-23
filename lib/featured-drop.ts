/* The "Featured drop" product, picked the same way on the Shop and Home heroes. */

/** Total sellable quantity: sum of variant inventory when variants carry it,
 *  otherwise the product-level inventory. */
export function getStockQty(p: any): number {
  const variants = Array.isArray(p.variants) ? p.variants : [];
  const withInventory = variants.filter(
    (v: any) => v && v.inventory !== undefined && v.inventory !== null && v.inventory !== ''
  );
  if (withInventory.length > 0) {
    return withInventory.reduce((sum: number, v: any) => sum + Number(v.inventory || 0), 0);
  }
  return Number(p.inventory || 0);
}

export function pickFeaturedDrop<T extends { name: string; images?: string[] }>(products: T[]): T | null {
  return (
    products.find((p) => /trapslayer/i.test(p.name) && p.images?.length) ??
    products.find((p) => p.images?.length && getStockQty(p) > 0) ??
    null
  );
}
