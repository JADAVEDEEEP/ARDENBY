// Rules used by the customer cancel / return forms (lib/return-request.ts and
// lib/cancel-reasons.ts). The server repeats each one; these keep the screen honest.
// TypeScript is stripped with the compiler the project already ships.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const load = (file) => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'lib', file), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } });
  const mod = { exports: {} };
  new Function('module', 'exports', outputText)(mod, mod.exports);
  return mod.exports;
};

const { initialSelection, validateReturn, buildReturnPayload, chosenItems, REASON_MAX } = load('return-request.ts');
const cancel = load('cancel-reasons.ts');

const items = [
  { orderItemId: 'a', name: 'Tee', quantity: 2 },
  { orderItemId: 'b', name: 'Cap', quantity: 1 },
];

test('nothing is ticked at the start, each line remembers its full available quantity', () => {
  assert.deepEqual(initialSelection(items), {
    a: { checked: false, quantity: 2 },
    b: { checked: false, quantity: 1 },
  });
});

test('return form is blocked until an item and a reason are chosen ("Other" needs an explanation)', () => {
  const sel = initialSelection(items);
  assert.match(validateReturn(items, sel, 'wrong_size', ''), /at least one item/i);

  sel.a.checked = true;
  assert.match(validateReturn(items, sel, '', 'too small'), /reason/i);
  assert.equal(validateReturn(items, sel, 'wrong_size', ''), null, 'a description is optional for a listed reason');
  assert.match(validateReturn(items, sel, 'other', '   '), /explain/i);
  assert.equal(validateReturn(items, sel, 'other', 'The stitching came apart'), null);
  assert.match(validateReturn(items, sel, 'wrong_size', 'x'.repeat(REASON_MAX + 1)), /under/i);
});

test('quantities must stay between 1 and what is still available', () => {
  const sel = initialSelection(items);
  for (const bad of [3, 0, 1.5, -1]) {
    sel.a = { checked: true, quantity: bad };
    assert.match(validateReturn(items, sel, 'wrong_size', ''), /between 1 and 2/, String(bad));
  }
  sel.a = { checked: true, quantity: 2 };
  assert.equal(validateReturn(items, sel, 'wrong_size', ''), null);
});

test('only ticked lines are sent, with a reason code and tidy text, and NEVER an amount', () => {
  const sel = initialSelection(items);
  sel.b.checked = true;
  const payload = buildReturnPayload('order-1', items, sel, 'damaged', '  Torn   seam \n at the cuff ');
  assert.deepEqual(payload, {
    orderId: 'order-1',
    reasonCode: 'damaged',
    description: 'Torn seam at the cuff',
    items: [{ orderItemId: 'b', quantity: 1 }],
  });
  assert.ok(!/amount|refund|price|total/i.test(JSON.stringify(payload)), 'the server works out the money');
  assert.deepEqual(chosenItems(items, sel), [{ orderItemId: 'b', quantity: 1 }]);
  assert.ok(!('description' in buildReturnPayload('o', items, sel, 'damaged', '   ')), 'empty description is left out');
});

test('cancel form needs a listed reason; "Other" needs words', () => {
  assert.match(cancel.validateCancelReason('', ''), /reason/i);
  assert.match(cancel.validateCancelReason('nonsense', ''), /reason/i);
  assert.equal(cancel.validateCancelReason('changed_mind', ''), null);
  assert.match(cancel.validateCancelReason('other', 'no'), /explain/i);
  assert.equal(cancel.validateCancelReason('other', 'Found it cheaper nearby'), null);
  assert.match(cancel.validateCancelReason('changed_mind', 'x'.repeat(cancel.NOTE_MAX + 1)), /under/i);
});

test("the website's cancel reasons are exactly the server's (a drift would make a valid choice fail)", () => {
  const server = require(path.join(__dirname, '..', '..', 'ArdenBy_Backend', 'utils', 'reasons.js'));
  assert.deepEqual(
    cancel.CUSTOMER_CANCEL_REASONS.map((r) => [r.code, r.label]),
    server.CUSTOMER_CANCEL_REASONS.map((r) => [r.code, r.label])
  );
});

test('the order page includes the cancel and return sections and reloads after a change', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'app', 'orders', '[id]', 'page.tsx'), 'utf8');
  assert.match(page, /<CancelSection orderId=\{order\.id\} onChanged=\{\(\) => load\(\)\} \/>/);
  assert.match(page, /<ReturnSection orderId=\{order\.id\} onChanged=\{\(\) => load\(\)\} \/>/);
});

test('admin orders no longer sends a bare "Cancelled" status: it opens the reason dialog', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'app', 'admin', 'orders', 'page.tsx'), 'utf8');
  assert.match(page, /status === "Cancelled"\) \{\s*setCancelDialogOpen\(true\);\s*return;/);
  assert.match(page, /<AdminCancelDialog/);
});


test("admin refund screens: history panel and the Razorpay status check are wired and cannot send money", () => {
  const read = (f) => require("fs").readFileSync(require("path").join(__dirname, "..", f), "utf8");
  const orders = read("app/admin/orders/page.tsx");
  assert.match(orders, /import \{ RefundHistory \} from "@\/components\/admin\/refund-history"/);
  assert.match(orders, /<RefundHistory[\s\S]*orderId=/);

  const panel = read("components/admin/refund-history.tsx");
  assert.match(panel, /\/refunds\/check/, "uses the read-only check endpoint");
  assert.match(panel, /Check refund status/);
  assert.ok(!/retry-refund|refund-retry/.test(panel), "the panel never calls a retry (money-sending) endpoint");

  const returns = read("app/admin/returns/page.tsx");
  assert.match(returns, /refund-check/);
  assert.match(returns, /row\.refund\.status === 'processing'/, "a refund Razorpay already holds is only checked, never retried");
});
