'use client';

import { COLLECTION_LINKS } from '@/components/layout/navbar-links';

import { CheckRow, ToggleRow } from './FilterControls';
import { ColourSwatches } from './ColourSwatches';
import { PriceRange } from './PriceRange';
import { SizeGrid } from './SizeGrid';
import {
  ALL_CATEGORY,
  COLLECTION_OPTIONS,
  toggleIn,
  type Facets,
  type Option,
  type ShopFilters,
} from './shop-filters';

export type GroupId =
  | 'category'
  | 'price'
  | 'size'
  | 'colour'
  | 'fit'
  | 'availability'
  | 'fabric'
  | 'print'
  | 'collection';

export type CategoryOption = { slug: string; name: string; count?: number };
export type FilterPatch = Partial<ShopFilters>;

export type GroupMeta = { id: GroupId; label: string; railLabel: string; defaultOpen: boolean };

export const GROUPS: GroupMeta[] = [
  { id: 'category', label: 'Category', railLabel: 'Category', defaultOpen: true },
  { id: 'price', label: 'Price', railLabel: 'Price', defaultOpen: true },
  { id: 'size', label: 'Size', railLabel: 'Size', defaultOpen: true },
  { id: 'colour', label: 'Colour', railLabel: 'Colour', defaultOpen: true },
  { id: 'fit', label: 'Fit type', railLabel: 'Fit Type', defaultOpen: true },
  { id: 'availability', label: 'Availability', railLabel: 'Availability', defaultOpen: true },
  { id: 'fabric', label: 'Fabric', railLabel: 'Fabric', defaultOpen: false },
  { id: 'print', label: 'Print type', railLabel: 'Print Type', defaultOpen: false },
  { id: 'collection', label: 'Drops', railLabel: 'Drops', defaultOpen: false },
];

/** Groups with no data behind them (e.g. no fabric on any product) are hidden. */
export function groupHasOptions(id: GroupId, facets: Facets): boolean {
  switch (id) {
    case 'fit':
      return facets.fits.length > 0;
    case 'fabric':
      return facets.fabrics.length > 0;
    case 'print':
      return facets.coverages.length > 0;
    case 'colour':
      return facets.colors.length > 0;
    case 'collection':
      return facets.collections.newArrival + facets.collections.limitedEdition > 0;
    default:
      return true;
  }
}

/** True when the group holds a selection (drives the gold dot in the mobile rail). */
export function groupActive(id: GroupId, f: ShopFilters): boolean {
  switch (id) {
    case 'category':
      return f.category !== ALL_CATEGORY || f.collections.includes('bestSeller');
    case 'price':
      return f.min !== null || f.max !== null;
    case 'size':
      return f.sizes.length > 0;
    case 'colour':
      return f.colors.length > 0;
    case 'fit':
      return f.fits.length > 0;
    case 'availability':
      return f.inStock || f.onSale;
    case 'fabric':
      return f.fabrics.length > 0;
    case 'print':
      return f.coverages.length > 0;
    case 'collection':
      return f.collections.some((c) => c !== 'bestSeller');
  }
}

function OptionList({
  options,
  selected,
  onToggle,
}: {
  options: Option[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div>
      {options.map((o) => (
        <CheckRow key={o.key} label={o.label} count={o.count} disabled={o.count === 0} checked={selected.includes(o.key)} onToggle={() => onToggle(o.key)} />
      ))}
    </div>
  );
}

/** The controls for one filter group. Shared by the desktop sidebar and the mobile sheet. */
export function GroupBody({
  id,
  filters,
  facets,
  categories,
  onChange,
}: {
  id: GroupId;
  filters: ShopFilters;
  facets: Facets;
  categories: CategoryOption[];
  onChange: (patch: FilterPatch) => void;
}) {
  switch (id) {
    case 'category': {
      // Brand collections vs. product types (same source as the navbar's collection links).
      const collectionSlugs = new Set<string>(COLLECTION_LINKS.map((c) => c.slug));
      // Plus Size is listed only once it has products (or while it is the selected category).
      const typeRows = categories.filter(
        (c) => !collectionSlugs.has(c.slug) && (c.slug !== 'plus-size' || (c.count ?? 0) > 0 || filters.category === c.slug)
      );
      const collectionRows = categories.filter((c) => collectionSlugs.has(c.slug));
      const row = (c: CategoryOption) => (
        <CheckRow
          key={c.slug}
          label={c.name}
          count={c.count}
          disabled={c.count === 0}
          checked={filters.category === c.slug}
          onToggle={() => onChange({ category: filters.category === c.slug ? ALL_CATEGORY : c.slug })}
        />
      );
      const heading = 'mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--soft)]';
      return (
        <div>
          <p className={heading}>Product type</p>
          {typeRows.map(row)}
          <p className={`${heading} mt-4`}>Collections</p>
          {collectionRows.map(row)}
          <CheckRow
            label="Best Sellers"
            count={facets.collections.bestSeller}
            disabled={facets.collections.bestSeller === 0}
            checked={filters.collections.includes('bestSeller')}
            onToggle={() => onChange({ collections: toggleIn(filters.collections, 'bestSeller') })}
          />
        </div>
      );
    }
    case 'price':
      return (
        <PriceRange
          min={filters.min}
          max={filters.max}
          bound={facets.priceMax}
          onChange={(min, max) => onChange({ min, max })}
        />
      );
    case 'size':
      return (
        <SizeGrid sizes={facets.sizes} selected={filters.sizes} onToggle={(s) => onChange({ sizes: toggleIn(filters.sizes, s) })} />
      );
    case 'colour':
      return (
        <ColourSwatches
          colors={facets.colors}
          selected={filters.colors}
          onToggle={(k) => onChange({ colors: toggleIn(filters.colors, k) })}
        />
      );
    case 'fit':
      return <OptionList options={facets.fits} selected={filters.fits} onToggle={(k) => onChange({ fits: toggleIn(filters.fits, k) })} />;
    case 'availability':
      return (
        <div>
          <ToggleRow label="In stock only" checked={filters.inStock} onToggle={() => onChange({ inStock: !filters.inStock })} />
          <ToggleRow label="On sale" checked={filters.onSale} onToggle={() => onChange({ onSale: !filters.onSale })} />
        </div>
      );
    case 'fabric':
      return (
        <OptionList options={facets.fabrics} selected={filters.fabrics} onToggle={(k) => onChange({ fabrics: toggleIn(filters.fabrics, k) })} />
      );
    case 'print':
      return (
        <OptionList
          options={facets.coverages}
          selected={filters.coverages}
          onToggle={(k) => onChange({ coverages: toggleIn(filters.coverages, k) })}
        />
      );
    case 'collection':
      return (
        <div>
          {COLLECTION_OPTIONS.filter((o) => o.key !== 'bestSeller').map((o) => (
            <CheckRow
              key={o.key}
              label={o.label}
              count={facets.collections[o.key]}
              disabled={facets.collections[o.key] === 0}
              checked={filters.collections.includes(o.key)}
              onToggle={() => onChange({ collections: toggleIn(filters.collections, o.key) })}
            />
          ))}
        </div>
      );
  }
}
