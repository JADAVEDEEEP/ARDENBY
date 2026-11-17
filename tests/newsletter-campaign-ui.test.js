const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (...p) => fs.readFileSync(path.join(root, ...p), 'utf8');
const exists = (...p) => fs.existsSync(path.join(root, ...p));
const backend = (...p) => fs.readFileSync(path.join(root, '..', 'ArdenBy_Backend', ...p), 'utf8');

test('Newsletter sidebar lists Overview, Subscribers, Campaigns, Email Templates and Campaign Analytics, and every page exists', () => {
  const shell = read('components', 'admin', 'admin-shell.tsx');
  for (const [href, label, file] of [
    ['/admin/newsletter', 'Overview', ['app', 'admin', 'newsletter', 'page.tsx']],
    ['/admin/newsletter/subscribers', 'Subscribers', ['app', 'admin', 'newsletter', 'subscribers', 'page.tsx']],
    ['/admin/newsletter/campaigns', 'Campaigns', ['app', 'admin', 'newsletter', 'campaigns', 'page.tsx']],
    ['/admin/newsletter/templates', 'Email Templates', ['app', 'admin', 'newsletter', 'templates', 'page.tsx']],
    ['/admin/newsletter/analytics', 'Campaign Analytics', ['app', 'admin', 'newsletter', 'analytics', 'page.tsx']],
  ]) {
    assert.ok(shell.includes(`href: '${href}', label: '${label}'`), `${label} is in the sidebar`);
    assert.ok(exists(...file), `${label} page exists`);
  }
  assert.ok(exists('app', 'admin', 'newsletter', 'campaigns', '[id]', 'page.tsx'), 'campaign editor');
  assert.ok(exists('app', 'admin', 'newsletter', 'templates', '[id]', 'page.tsx'), 'template editor');
});

test('the existing subscriber management page is kept, with its manual-unsubscribe safeguards', () => {
  const page = read('app', 'admin', 'newsletter', 'subscribers', 'page.tsx');
  assert.ok(page.includes('ReasonDialog') && page.includes('confirm: true'));
  assert.ok(page.includes('/api/admin/newsletter/export.csv'));
});

test('builder block types, fonts and limits match the backend validator (the server stays the authority)', () => {
  const api = read('lib', 'newsletter-campaign-api.ts');
  const be = backend('services', 'newsletter-email.service.js');
  const beTypes = /const BLOCK_TYPES = \[([\s\S]*?)\];/.exec(be)[1].match(/"([a-z_]+)"/g).map((s) => s.replace(/"/g, ''));
  const feTypes = /export const BLOCK_ORDER: BlockType\[\] = \[([\s\S]*?)\];/.exec(api)[1].match(/'([a-z_]+)'/g).map((s) => s.replace(/'/g, ''));
  assert.deepEqual([...feTypes].sort(), [...beTypes].sort());
  const beFonts = /const FONTS = \{([\s\S]*?)\};/.exec(be)[1].match(/^\s+([a-z]+):/gm).map((s) => s.replace(/[\s:]/g, ''));
  const feFonts = /FONT_OPTIONS: \[string, string\]\[\] = \[([\s\S]*?)\];/.exec(api)[1].match(/\['([a-z]+)'/g).map((s) => s.replace(/[\['"]/g, ''));
  assert.deepEqual([...feFonts].sort(), [...beFonts].sort());
  for (const placeholder of ['Write your headline', 'Write your message here.']) {
    assert.ok(api.includes(placeholder) && be.includes(placeholder) && backend('services', 'newsletter-campaign.service.js').includes(placeholder));
  }
  assert.match(api, /MAX_BLOCKS|40/);
});

test('every block in the builder offers the spacing control and the product block reads real catalogue data', () => {
  const api = read('lib', 'newsletter-campaign-api.ts');
  assert.equal((api.match(/\bspacing\b/g) || []).length >= 9, true);
  assert.ok(/kind: 'product'/.test(api));
  assert.ok(!/price:\s*\d/.test(api), 'no hard-coded product prices');
  assert.ok(!/% off|free shipping|discount/i.test(api), 'no invented offers in the builder defaults');
});

test('sending needs typing SEND; scheduling and cancelling use a confirmation dialog', () => {
  const page = read('app', 'admin', 'newsletter', 'campaigns', '[id]', 'page.tsx');
  assert.ok(page.includes('typeToConfirm="SEND"'), 'send-now requires typing SEND');
  assert.ok(/dialog === 'schedule'/.test(page) && /dialog === 'cancel'/.test(page) && /dialog === 'test'/.test(page));
  assert.ok(page.includes('confirm: true'), 'explicit confirm flag is sent');
  assert.ok(page.includes('expectedRecipients'), 'the count the admin saw is sent back to the server');
  assert.ok(page.includes('isOwner'), 'the page adapts to the role');
  assert.ok(/available to a <strong>Super Admin<\/strong> only/.test(page), 'Admin is told who can send');
});

test('the preview runs in a sandboxed frame and nothing renders admin-written HTML directly', () => {
  assert.ok(read('components', 'admin', 'newsletter', 'email-preview.tsx').includes('sandbox=""'));
  for (const file of [
    ['components', 'admin', 'newsletter', 'email-builder.tsx'],
    ['components', 'admin', 'newsletter', 'email-preview.tsx'],
    ['app', 'admin', 'newsletter', 'campaigns', '[id]', 'page.tsx'],
    ['app', 'admin', 'newsletter', 'page.tsx'],
    ['app', 'admin', 'newsletter', 'analytics', 'page.tsx'],
  ]) {
    assert.ok(!read(...file).includes('dangerouslySetInnerHTML'), file.join('/'));
  }
});

test('analytics never invents open or click statistics and shows a dash when Brevo has not reported', () => {
  const api = read('lib', 'newsletter-campaign-api.ts');
  assert.ok(/delivered: number \| null/.test(api) && /bounced: number \| null/.test(api));
  assert.ok(/deliveryRate: number \| null/.test(api));
  for (const file of [
    ['app', 'admin', 'newsletter', 'page.tsx'],
    ['app', 'admin', 'newsletter', 'analytics', 'page.tsx'],
    ['app', 'admin', 'newsletter', 'campaigns', '[id]', 'page.tsx'],
  ]) {
    const text = read(...file);
    assert.ok(!/openRate|clickRate|opened|clicked/i.test(text), `${file.join('/')} must not show open / click figures`);
    assert.ok(/not available over SMTP|Needs the Brevo|Brevo/.test(text));
  }
});

test('the campaign screens talk only to the protected admin newsletter API', () => {
  const api = read('lib', 'newsletter-campaign-api.ts');
  const urls = [...api.matchAll(/`\$\{base\}[^`]*`/g)].length;
  assert.ok(urls >= 15);
  assert.ok(api.includes("const base = '/api/admin/newsletter'"));
  assert.ok(!/fetch\(/.test(api), 'goes through the authenticated admin request helper');
});

test('super admin audit filter lists the campaign actions', () => {
  const audit = read('app', 'superadmin', 'audit', 'page.tsx');
  for (const a of ['newsletter.campaign.send', 'newsletter.campaign.schedule', 'newsletter.campaign.cancel', 'newsletter.campaign.test_send', 'newsletter.template.create', 'export.newsletter_campaign']) {
    assert.ok(audit.includes(`'${a}'`), a);
  }
});
