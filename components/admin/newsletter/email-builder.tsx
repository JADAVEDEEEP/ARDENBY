'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Copy, Plus, Search, Trash2 } from 'lucide-react';

import { btnOutline, fieldClass, labelClass } from '@/components/admin/ui';
import { BLOCK_DEFS, BLOCK_ORDER, FONT_OPTIONS, newBlockId } from '@/lib/newsletter-campaign-api';
import type { Block, BlockType, Design, DesignStyle, Field, ProductHit } from '@/lib/newsletter-campaign-api';
import { newsletterApi } from '@/lib/newsletter-campaign-api';
import { cn } from '@/lib/utils';

const MAX_BLOCKS = 40;
const COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

function ColorField({ value, onChange, optional }: { value: string; onChange: (v: string) => void; optional?: boolean }) {
  const valid = COLOR_RE.test(value);
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label="Pick a colour"
        value={valid ? value : '#111111'}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="h-10 w-12 cursor-pointer rounded-md border border-[#D0D5DD] bg-white p-1"
      />
      <input
        className={`${fieldClass} max-w-[130px] font-mono`}
        value={value}
        maxLength={7}
        placeholder={optional ? 'Default' : '#111111'}
        aria-label="Colour code"
        aria-invalid={value !== '' && !valid}
        onChange={(e) => onChange(e.target.value)}
      />
      {optional && value && (
        <button type="button" className="text-[13px] font-semibold text-[#626875] underline" onClick={() => onChange('')}>
          Use default
        </button>
      )}
    </div>
  );
}

function ProductPicker({ value, onChange }: { value: string; onChange: (slug: string) => void }) {
  const [term, setTerm] = useState('');
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const latest = useRef(0);

  useEffect(() => {
    if (!open) return;
    const request = ++latest.current;
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const found = await newsletterApi.products(term);
        if (request === latest.current) setHits(found);
      } catch {
        if (request === latest.current) setHits([]);
      } finally {
        if (request === latest.current) setBusy(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [term, open]);

  return (
    <div>
      <div className="mb-2 text-[14px] text-[#344054]">
        {value ? (
          <>
            Selected: <strong className="break-all">{value}</strong>
          </>
        ) : (
          <span className="text-[#626875]">No product chosen yet.</span>
        )}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#98A2B3]" />
        <input
          className={`${fieldClass} pl-9`}
          placeholder="Search your catalogue by name"
          aria-label="Search products"
          value={term}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
        />
      </div>
      {open && (
        <ul className="mt-2 max-h-56 overflow-auto rounded-lg border border-[#E4E7EC] bg-white" role="listbox" aria-busy={busy}>
          {hits.length === 0 && <li className="px-3 py-3 text-[13px] text-[#626875]">{busy ? 'Searching…' : 'No products found.'}</li>}
          {hits.map((p) => (
            <li key={p.slug}>
              <button
                type="button"
                role="option"
                aria-selected={p.slug === value}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-[14px] hover:bg-[#F5F6F8]"
                onClick={() => {
                  onChange(p.slug);
                  setOpen(false);
                }}
              >
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  <span className="h-10 w-10 rounded bg-[#F2F4F7]" />
                )}
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-[#111111]">{p.name}</span>
                  <span className="block text-[12px] text-[#626875]">₹{p.price.toLocaleString('en-IN')}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FieldInput({ field, value, onChange, id }: { field: Field; value: string; onChange: (v: string) => void; id: string }) {
  switch (field.kind) {
    case 'textarea':
      return <textarea id={id} rows={5} maxLength={field.max} className={`${fieldClass} h-auto py-2.5`} value={value} onChange={(e) => onChange(e.target.value)} />;
    case 'select':
      return (
        <select id={id} className={fieldClass} value={value} onChange={(e) => onChange(e.target.value)}>
          {field.options!.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      );
    case 'color':
      return <ColorField value={value} onChange={onChange} optional />;
    case 'product':
      return <ProductPicker value={value} onChange={onChange} />;
    default:
      return (
        <input
          id={id}
          type={field.kind === 'url' ? 'url' : 'text'}
          inputMode={field.kind === 'url' ? 'url' : undefined}
          maxLength={field.kind === 'url' ? 2048 : field.max}
          className={fieldClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

/**
 * Visual email builder: an ordered list of content blocks, each with its own fields, plus brand style settings.
 * It edits plain data only (no HTML); the server validates, escapes and renders it.
 */
export function EmailBuilder({ design, onChange, disabled }: { design: Design; onChange: (next: Design) => void; disabled?: boolean }) {
  const [openId, setOpenId] = useState<string | null>(design.blocks[1]?.id ?? design.blocks[0]?.id ?? null);
  const [styleOpen, setStyleOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const setBlocks = (blocks: Block[]) => onChange({ ...design, blocks });
  const patch = (id: string, key: string, value: string) =>
    setBlocks(design.blocks.map((b) => (b.id === id ? { ...b, [key]: value } : b)));
  const move = (index: number, dir: -1 | 1) => {
    const next = [...design.blocks];
    const to = index + dir;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    setBlocks(next);
  };
  const remove = (id: string) => {
    setBlocks(design.blocks.filter((b) => b.id !== id));
    if (openId === id) setOpenId(null);
  };
  const copy = (index: number) => {
    const next = [...design.blocks];
    const clone = { ...next[index], id: newBlockId() };
    next.splice(index + 1, 0, clone);
    setBlocks(next);
    setOpenId(clone.id);
  };
  const add = (type: BlockType) => {
    const block = { id: newBlockId(), ...BLOCK_DEFS[type].make() } as Block;
    setBlocks([...design.blocks, block]);
    setOpenId(block.id);
    setAdding(false);
  };
  const setStyle = (key: keyof DesignStyle, value: string) => onChange({ ...design, style: { ...design.style, [key]: value } });

  const atLimit = design.blocks.length >= MAX_BLOCKS;

  return (
    <div className={cn('space-y-3', disabled && 'pointer-events-none opacity-60')} aria-disabled={disabled}>
      {/* brand style */}
      <section className="rounded-xl border border-[#E4E7EC] bg-white">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left text-[15px] font-bold text-[#111111]"
          onClick={() => setStyleOpen((v) => !v)}
          aria-expanded={styleOpen}
        >
          Fonts and colours
          <ChevronDown className={cn('h-4 w-4 transition-transform', styleOpen && 'rotate-180')} />
        </button>
        {styleOpen && (
          <div className="grid gap-4 border-t border-[#E4E7EC] p-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="style-font">Body font</label>
              <select id="style-font" className={fieldClass} value={design.style.font} onChange={(e) => setStyle('font', e.target.value)}>
                {FONT_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="style-heading-font">Heading font</label>
              <select id="style-heading-font" className={fieldClass} value={design.style.headingFont} onChange={(e) => setStyle('headingFont', e.target.value)}>
                {FONT_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            {(
              [
                ['textColor', 'Text colour'],
                ['headingColor', 'Heading colour'],
                ['accentColor', 'Accent colour'],
                ['pageColor', 'Page background'],
                ['cardColor', 'Email background'],
              ] as [keyof DesignStyle, string][]
            ).map(([key, label]) => (
              <div key={key}>
                <span className={labelClass}>{label}</span>
                <ColorField value={design.style[key]} onChange={(v) => setStyle(key, v)} />
              </div>
            ))}
            <p className="text-[12px] text-[#626875] sm:col-span-2">Email clients only support a few fonts, so the choices are limited on purpose.</p>
          </div>
        )}
      </section>

      {/* blocks */}
      <ol className="space-y-2" aria-label="Email content blocks">
        {design.blocks.map((block, index) => {
          const def = BLOCK_DEFS[block.type];
          const open = openId === block.id;
          const summary = String(block.text || block.label || block.productSlug || block.tagline || '').slice(0, 60);
          return (
            <li key={block.id} className="rounded-xl border border-[#E4E7EC] bg-white">
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => setOpenId(open ? null : block.id)}
                  aria-expanded={open}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F2F4F7] text-[12px] font-bold text-[#475467]">{index + 1}</span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-bold text-[#111111]">{def.label}</span>
                    {summary && !open && <span className="block truncate text-[12px] text-[#626875]">{summary}</span>}
                  </span>
                  <ChevronDown className={cn('ml-auto h-4 w-4 shrink-0 text-[#626875] transition-transform', open && 'rotate-180')} />
                </button>
                <div className="flex shrink-0 items-center">
                  <button type="button" aria-label={`Move ${def.label} up`} disabled={index === 0} onClick={() => move(index, -1)} className="rounded p-1.5 text-[#475467] hover:bg-[#F2F4F7] disabled:opacity-30">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label={`Move ${def.label} down`} disabled={index === design.blocks.length - 1} onClick={() => move(index, 1)} className="rounded p-1.5 text-[#475467] hover:bg-[#F2F4F7] disabled:opacity-30">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label={`Duplicate ${def.label}`} disabled={atLimit} onClick={() => copy(index)} className="rounded p-1.5 text-[#475467] hover:bg-[#F2F4F7] disabled:opacity-30">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label={`Delete ${def.label}`} onClick={() => remove(block.id)} className="rounded p-1.5 text-[#B42318] hover:bg-[#FEE4E2]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {open && (
                <div className="space-y-4 border-t border-[#E4E7EC] p-4">
                  <p className="text-[13px] text-[#626875]">{def.hint}</p>
                  {def.fields.map((field) => {
                    const id = `${block.id}-${field.key}`;
                    return (
                      <div key={field.key}>
                        <label className={labelClass} htmlFor={id}>
                          {field.label}
                          {field.required && <span className="text-[#B42318]"> *</span>}
                        </label>
                        <FieldInput id={id} field={field} value={String(block[field.key] ?? '')} onChange={(v) => patch(block.id, field.key, v)} />
                        {field.help && <p className="mt-1 text-[12px] text-[#626875]">{field.help}</p>}
                        {field.max && field.kind !== 'select' && field.kind !== 'color' && (
                          <p className="mt-1 text-right text-[11px] text-[#98A2B3]">{String(block[field.key] ?? '').length}/{field.max}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* add */}
      <div>
        <button type="button" className={btnOutline} onClick={() => setAdding((v) => !v)} disabled={atLimit} aria-expanded={adding}>
          <Plus className="h-4 w-4" /> Add a block
        </button>
        {atLimit && <span className="ml-3 text-[13px] text-[#626875]">An email can have at most {MAX_BLOCKS} blocks.</span>}
        {adding && (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {BLOCK_ORDER.map((type) => (
              <li key={type}>
                <button type="button" onClick={() => add(type)} className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2.5 text-left transition hover:border-[#111111]">
                  <span className="block text-[14px] font-bold text-[#111111]">{BLOCK_DEFS[type].label}</span>
                  <span className="block text-[12px] text-[#626875]">{BLOCK_DEFS[type].hint}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-[12px] text-[#626875]">
        The footer with the unsubscribe link and KOVENIK&apos;s postal address is added to every email automatically and cannot be removed.
      </p>
    </div>
  );
}
