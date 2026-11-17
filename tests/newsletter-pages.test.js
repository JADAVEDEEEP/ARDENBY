const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (...p) => fs.readFileSync(path.join(__dirname, '..', ...p), 'utf8');

test('privacy policy explains newsletter consent, stored data and unsubscribing', () => {
  const privacy = read('app', 'privacy', 'page.tsx');
  assert.ok(privacy.includes("id: 'newsletter'"), 'newsletter section exists');
  for (const phrase of [
    'You are not subscribed until you click it',
    'expires after 48 hours',
    'unsubscribe link',
    'hashed',
    'Brevo',
    'confirm your email again',
  ]) {
    assert.ok(privacy.includes(phrase), `privacy policy mentions: ${phrase}`);
  }
  // It must keep its own date, not borrow the Terms page date.
  assert.ok(privacy.includes('PRIVACY_UPDATED'));
  assert.ok(!privacy.includes('POLICY_UPDATED'));
});

test('privacy policy never invents business details', () => {
  const privacy = read('app', 'privacy', 'page.tsx');
  assert.ok(!/Krishna|Ranip|Ahmedabad|\b38\d{4}\b/.test(privacy), 'no hard-coded address or PIN code');
});

test('admin Newsletter page: unsubscribe needs a confirmation dialog with a reason and can never subscribe', () => {
  const page = read('app', 'admin', 'newsletter', 'subscribers', 'page.tsx');
  assert.ok(page.includes('ReasonDialog'), 'uses the confirmation dialog');
  assert.ok(page.includes('confirm: true'), 'sends the explicit confirmation flag');
  assert.ok(page.includes('/unsubscribe'), 'calls the unsubscribe endpoint');
  assert.ok(!/\/(activate|resubscribe|subscribe)\b/.test(page.replace('/api/admin/newsletter', '')), 'no subscribe / activate call');
  assert.ok(page.includes("s.status === 'active' || s.status === 'pending'"), 'only offered for active / pending rows');
});

test('super admin audit filter lists the newsletter actions', () => {
  const audit = read('app', 'superadmin', 'audit', 'page.tsx');
  for (const action of ['newsletter.unsubscribe', 'newsletter.view_list', 'export.newsletter']) {
    assert.ok(audit.includes(`'${action}'`), action);
  }
});

test('confirm and unsubscribe pages exist, are noindex and use a button (POST), not an automatic call', () => {
  for (const dir of ['confirm', 'unsubscribe']) {
    const page = read('app', 'newsletter', dir, 'page.tsx');
    assert.ok(/robots:\s*\{\s*index:\s*false/.test(page), `${dir} is noindex`);
    const client = read('app', 'newsletter', dir, `${dir}-client.tsx`);
    assert.ok(client.includes('onClick'), `${dir} needs a click`);
    assert.ok(!/useEffect/.test(client), `${dir} must not act automatically on page load (mail scanners pre-fetch links)`);
  }
});
