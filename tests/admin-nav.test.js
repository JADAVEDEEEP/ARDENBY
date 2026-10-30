const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const shell = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'admin', 'admin-shell.tsx'),
  'utf8'
);

test('ordinary admin navigation has no Customers entry', () => {
  assert.ok(!/href:\s*'\/admin\/customers'/.test(shell));
});

test('review moderation, returns, stock history, exports and security are linked and exist', () => {
  for (const [href, dir] of [
    ['/admin/reviews', 'reviews'],
    ['/admin/returns', 'returns'],
    ['/admin/inventory/history', path.join('inventory', 'history')],
    ['/admin/exports', 'exports'],
    ['/admin/security', 'security'],
  ]) {
    assert.ok(shell.includes(`href: '${href}'`), href);
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'app', 'admin', dir, 'page.tsx')), dir);
  }
});

test('super admin navigation links the audit log and financial report, and they exist', () => {
  const superShell = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'admin', 'superadmin-shell.tsx'),
    'utf8'
  );
  for (const [href, dir] of [
    ['/superadmin/audit', 'audit'],
    ['/superadmin/finance', 'finance'],
  ]) {
    assert.ok(superShell.includes(`href: '${href}'`), href);
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'app', 'superadmin', dir, 'page.tsx')), dir);
  }
});

test('Analytics and Settings are real links, not "Soon" placeholders', () => {
  assert.match(shell, /href: '\/admin\/analytics'/);
  assert.match(shell, /href: '\/admin\/settings'/);
  assert.ok(!/soon/i.test(shell));
});

test('analytics and settings pages exist', () => {
  for (const page of ['analytics', 'settings']) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'app', 'admin', page, 'page.tsx')));
  }
});
