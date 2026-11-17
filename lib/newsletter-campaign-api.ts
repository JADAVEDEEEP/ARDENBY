import { opsRequest, toQuery } from '@/lib/admin-ops-api';
import type { Pagination } from '@/lib/admin-ops-api';

/* Types + calls for the newsletter campaign screens. Every request goes to the backend, which re-checks the login and the
   role itself (Super Admin only: recipients, test sends, scheduling, sending, cancelling, per-recipient reports).
   Nothing here grants access. */

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'partially_failed' | 'failed' | 'cancelled';

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  sending: 'Sending',
  sent: 'Sent',
  partially_failed: 'Partially failed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export type BlockType =
  | 'header'
  | 'hero'
  | 'heading'
  | 'paragraph'
  | 'product_image'
  | 'product_details'
  | 'button'
  | 'banner'
  | 'divider'
  | 'footer';

export type Block = { id: string; type: BlockType; [field: string]: string | number | boolean | undefined };

export type DesignStyle = {
  font: string;
  headingFont: string;
  textColor: string;
  headingColor: string;
  accentColor: string;
  pageColor: string;
  cardColor: string;
};

export type Design = { style: DesignStyle; blocks: Block[] };

export const DEFAULT_STYLE: DesignStyle = {
  font: 'helvetica',
  headingFont: 'helvetica',
  textColor: '#333333',
  headingColor: '#111111',
  accentColor: '#C62828',
  pageColor: '#F2F2F0',
  cardColor: '#FFFFFF',
};

export const FONT_OPTIONS: [string, string][] = [
  ['helvetica', 'Helvetica / Arial'],
  ['georgia', 'Georgia (serif)'],
  ['impact', 'Impact (bold display)'],
];

export type CampaignStats = {
  queued: number;
  pending: number;
  sent: number;
  failed: number;
  skipped: number;
  /** null = no provider (Brevo webhook) data yet. Never 0-as-a-guess. */
  delivered: number | null;
  bounced: number | null;
  complaints: number | null;
  unsubscribed: number;
  providerData: boolean;
  acceptanceRate: number | null;
  deliveryRate: number | null;
  bounceRate: number | null;
  unsubscribeRate: number | null;
  completionSeconds: number | null;
};

export type Audience = { type: 'all_active' | 'selected' | 'source'; source: string | null; ids?: number[]; selectedCount?: number };

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  status: CampaignStatus;
  audience: Audience;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  totalRecipients: number;
  errorNote: string | null;
  createdAt: string;
  updatedAt: string;
  design?: Design;
  stats?: CampaignStats;
};

export type Template = { id: string; name: string; subject: string; preheader: string; createdAt: string; updatedAt: string; design?: Design };

export type Overview = {
  subscribers: { total: number; active: number };
  campaigns: { total: number; draft: number; scheduled: number; sending: number; sent: number; failed: number; cancelled: number };
  emails: { queued: number; sent: number; failed: number; delivered: number | null; bounced: number | null; unsubscribed: number };
  rates: { acceptance: number | null; delivery: number | null; bounce: number | null; unsubscribe: number | null };
  providerData: boolean;
  performance: { id: string; name: string; sent: number; failed: number; bounced: number | null; unsubscribed: number }[];
  recent: Campaign[];
};

export type RecipientRow = {
  id: string;
  email: string;
  status: string;
  attempts: number;
  errorKind: string | null;
  error: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  bouncedAt: string | null;
};

export type ProductHit = { slug: string; name: string; price: number; image: string };

const json = (body: unknown) => ({ body: JSON.stringify(body) });
const base = '/api/admin/newsletter';

export const newsletterApi = {
  overview: () => opsRequest<{ overview: Overview }>(`${base}/overview`).then((r) => r.overview),

  listCampaigns: (q: { page?: number; limit?: number; status?: string; search?: string }) =>
    opsRequest<{ campaigns: Campaign[]; pagination: Pagination }>(`${base}/campaigns${toQuery(q)}`),
  getCampaign: (id: string) => opsRequest<{ campaign: Campaign }>(`${base}/campaigns/${encodeURIComponent(id)}`).then((r) => r.campaign),
  createCampaign: (data: Record<string, unknown>) =>
    opsRequest<{ campaign: Campaign }>(`${base}/campaigns`, { method: 'POST', ...json(data) }).then((r) => r.campaign),
  updateCampaign: (id: string, data: Record<string, unknown>) =>
    opsRequest<{ campaign: Campaign }>(`${base}/campaigns/${encodeURIComponent(id)}`, { method: 'PUT', ...json(data) }).then((r) => r.campaign),
  duplicateCampaign: (id: string) =>
    opsRequest<{ campaign: Campaign }>(`${base}/campaigns/${encodeURIComponent(id)}/duplicate`, { method: 'POST' }).then((r) => r.campaign),

  preview: (data: { design: Design; subject: string; preheader: string }) =>
    opsRequest<{ html: string; text: string; warnings: string[] }>(`${base}/preview`, { method: 'POST', ...json(data) }),
  products: (search: string) => opsRequest<{ products: ProductHit[] }>(`${base}/products${toQuery({ search })}`).then((r) => r.products),

  audienceCount: (id: string) => opsRequest<{ recipients: number }>(`${base}/campaigns/${encodeURIComponent(id)}/audience-count`).then((r) => r.recipients),
  sources: () => opsRequest<{ sources: { source: string; active: number }[] }>(`${base}/sources`).then((r) => r.sources),
  sendTest: (id: string, to?: string[]) =>
    opsRequest<{ message: string }>(`${base}/campaigns/${encodeURIComponent(id)}/test`, { method: 'POST', ...json({ to }) }),
  schedule: (id: string, data: { scheduledAt: string; confirm: boolean; expectedRecipients: number }) =>
    opsRequest<{ campaign: Campaign }>(`${base}/campaigns/${encodeURIComponent(id)}/schedule`, { method: 'POST', ...json(data) }).then((r) => r.campaign),
  send: (id: string, data: { confirm: boolean; expectedRecipients: number }) =>
    opsRequest<{ campaign: Campaign }>(`${base}/campaigns/${encodeURIComponent(id)}/send`, { method: 'POST', ...json(data) }).then((r) => r.campaign),
  cancel: (id: string) =>
    opsRequest<{ campaign: Campaign }>(`${base}/campaigns/${encodeURIComponent(id)}/cancel`, { method: 'POST' }).then((r) => r.campaign),
  recipients: (id: string, q: { page?: number; limit?: number; status?: string }) =>
    opsRequest<{ recipients: RecipientRow[]; pagination: Pagination }>(`${base}/campaigns/${encodeURIComponent(id)}/recipients${toQuery(q)}`),

  listTemplates: () => opsRequest<{ templates: Template[] }>(`${base}/templates`).then((r) => r.templates),
  getTemplate: (id: string) => opsRequest<{ template: Template }>(`${base}/templates/${encodeURIComponent(id)}`).then((r) => r.template),
  createTemplate: (data: Record<string, unknown>) =>
    opsRequest<{ template: Template }>(`${base}/templates`, { method: 'POST', ...json(data) }).then((r) => r.template),
  updateTemplate: (id: string, data: Record<string, unknown>) =>
    opsRequest<{ template: Template }>(`${base}/templates/${encodeURIComponent(id)}`, { method: 'PUT', ...json(data) }).then((r) => r.template),
  deleteTemplate: (id: string) => opsRequest(`${base}/templates/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

/** A neutral starting design. It contains no offers, prices or claims: only prompts to write. */
export const starterDesign = (): Design => ({
  style: { ...DEFAULT_STYLE },
  blocks: [
    { id: 'b1', type: 'header', padding: 'md', logoUrl: '', tagline: '', align: 'center' },
    { id: 'b2', type: 'heading', padding: 'md', text: 'Write your headline', align: 'left', size: 'lg', color: '' },
    { id: 'b3', type: 'paragraph', padding: 'md', text: 'Write your message here.', align: 'left', size: 'md', color: '' },
  ],
});

// ---- builder block catalogue (mirrors the backend validator; the server is the authority) ----

export type FieldKind = 'text' | 'textarea' | 'url' | 'select' | 'color' | 'product';
export type Field = { key: string; label: string; kind: FieldKind; options?: [string, string][]; max?: number; help?: string; required?: boolean };

const PADDING: [string, string][] = [['none', 'None'], ['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']];
const ALIGN: [string, string][] = [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']];
const spacing: Field = { key: 'padding', label: 'Spacing', kind: 'select', options: PADDING };

export const BLOCK_DEFS: Record<BlockType, { label: string; hint: string; fields: Field[]; make: () => Omit<Block, 'id'> }> = {
  header: {
    label: 'Logo and header',
    hint: 'KOVENIK wordmark, or your own logo image.',
    fields: [
      { key: 'logoUrl', label: 'Logo image link (optional)', kind: 'url', help: 'https:// link. Leave empty to use the KOVENIK wordmark.' },
      { key: 'tagline', label: 'Tagline (optional)', kind: 'text', max: 80 },
      { key: 'align', label: 'Alignment', kind: 'select', options: ALIGN },
      spacing,
    ],
    make: () => ({ type: 'header', padding: 'md', logoUrl: '', tagline: '', align: 'center' }),
  },
  hero: {
    label: 'Hero image',
    hint: 'A full-width image at the top.',
    fields: [
      { key: 'imageUrl', label: 'Image link', kind: 'url', required: true, help: 'https:// link to an image you host (for example on Cloudinary).' },
      { key: 'alt', label: 'Image description', kind: 'text', max: 150 },
      { key: 'linkUrl', label: 'Click goes to (optional)', kind: 'url' },
      spacing,
    ],
    make: () => ({ type: 'hero', padding: 'none', imageUrl: '', alt: '', linkUrl: '' }),
  },
  heading: {
    label: 'Heading',
    hint: 'A large title.',
    fields: [
      { key: 'text', label: 'Heading text', kind: 'text', max: 150, required: true },
      { key: 'size', label: 'Size', kind: 'select', options: [['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large'], ['xl', 'Extra large']] },
      { key: 'align', label: 'Alignment', kind: 'select', options: ALIGN },
      { key: 'color', label: 'Colour (optional)', kind: 'color' },
      spacing,
    ],
    make: () => ({ type: 'heading', padding: 'md', text: '', align: 'left', size: 'lg', color: '' }),
  },
  paragraph: {
    label: 'Paragraph',
    hint: 'Body text. A blank line starts a new paragraph.',
    fields: [
      { key: 'text', label: 'Text', kind: 'textarea', max: 2000, required: true },
      { key: 'size', label: 'Size', kind: 'select', options: [['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']] },
      { key: 'align', label: 'Alignment', kind: 'select', options: ALIGN },
      { key: 'color', label: 'Colour (optional)', kind: 'color' },
      spacing,
    ],
    make: () => ({ type: 'paragraph', padding: 'md', text: '', align: 'left', size: 'md', color: '' }),
  },
  product_image: {
    label: 'Product image',
    hint: 'A product photo with an optional caption.',
    fields: [
      { key: 'imageUrl', label: 'Image link', kind: 'url', required: true },
      { key: 'alt', label: 'Image description', kind: 'text', max: 150 },
      { key: 'caption', label: 'Caption (optional)', kind: 'text', max: 150 },
      { key: 'linkUrl', label: 'Click goes to (optional)', kind: 'url' },
      spacing,
    ],
    make: () => ({ type: 'product_image', padding: 'md', imageUrl: '', alt: '', caption: '', linkUrl: '' }),
  },
  product_details: {
    label: 'Product details',
    hint: 'Name, price and photo are read live from your catalogue. Nothing is typed by hand.',
    fields: [
      { key: 'productSlug', label: 'Product', kind: 'product', required: true },
      { key: 'ctaLabel', label: 'Button text (optional)', kind: 'text', max: 40 },
      spacing,
    ],
    make: () => ({ type: 'product_details', padding: 'md', productSlug: '', ctaLabel: '' }),
  },
  button: {
    label: 'Button (CTA)',
    hint: 'A call-to-action button.',
    fields: [
      { key: 'label', label: 'Button text', kind: 'text', max: 40, required: true },
      { key: 'url', label: 'Link', kind: 'url', required: true, help: 'https:// link, or a site path such as /shop' },
      { key: 'align', label: 'Alignment', kind: 'select', options: ALIGN },
      { key: 'bg', label: 'Button colour (optional)', kind: 'color' },
      { key: 'color', label: 'Text colour (optional)', kind: 'color' },
      spacing,
    ],
    make: () => ({ type: 'button', padding: 'md', label: '', url: '', align: 'center', bg: '', color: '' }),
  },
  banner: {
    label: 'Promotional banner',
    hint: 'A coloured panel. Write only what you really offer.',
    fields: [
      { key: 'text', label: 'Banner text', kind: 'text', max: 120, required: true },
      { key: 'subtext', label: 'Sub-text (optional)', kind: 'text', max: 200 },
      { key: 'bg', label: 'Background colour', kind: 'color' },
      { key: 'color', label: 'Text colour', kind: 'color' },
      { key: 'linkUrl', label: 'Click goes to (optional)', kind: 'url' },
      spacing,
    ],
    make: () => ({ type: 'banner', padding: 'md', text: '', subtext: '', bg: '#111111', color: '#FFFFFF', linkUrl: '' }),
  },
  divider: {
    label: 'Divider',
    hint: 'A thin line.',
    fields: [{ key: 'color', label: 'Colour (optional)', kind: 'color' }, spacing],
    make: () => ({ type: 'divider', padding: 'md', color: '' }),
  },
  footer: {
    label: 'Footer note',
    hint: 'Extra small print. The unsubscribe link and postal address are always added automatically below it.',
    fields: [
      { key: 'text', label: 'Note', kind: 'textarea', max: 500, required: true },
      { key: 'align', label: 'Alignment', kind: 'select', options: ALIGN },
      spacing,
    ],
    make: () => ({ type: 'footer', padding: 'md', text: '', align: 'center' }),
  },
};

export const BLOCK_ORDER: BlockType[] = ['header', 'hero', 'heading', 'paragraph', 'product_image', 'product_details', 'button', 'banner', 'divider', 'footer'];

export const newBlockId = () => `b${Math.random().toString(36).slice(2, 9)}`;

export const PLACEHOLDER_TEXTS = ['Write your headline', 'Write your message here.'];

export const formatDuration = (seconds: number | null | undefined) => {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ${seconds % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

export const pct = (value: number | null | undefined) => (value === null || value === undefined ? '—' : `${value}%`);
export const num = (value: number | null | undefined) => (value === null || value === undefined ? '—' : value.toLocaleString('en-IN'));
