/**
 * Pure helpers for the customer return form (no React, no network), so the
 * rules can be tested. The server repeats every one of these checks.
 */

export const REASON_MAX = 1000;
export const NOTE_MIN_FOR_OTHER = 5;

export type ReturnableItem = { orderItemId: string; name: string; quantity: number };

export type Selection = Record<string, { checked: boolean; quantity: number }>;

/** Nothing ticked yet; each line remembers its full available quantity as its default. */
export function initialSelection(items: ReturnableItem[]): Selection {
  const selection: Selection = {};
  for (const item of items) {
    selection[item.orderItemId] = { checked: false, quantity: item.quantity };
  }
  return selection;
}

const clean = (text: string) => text.replace(/\s+/g, ' ').trim();

/** The first problem a customer should fix, or null when the form is ready to send. */
export function validateReturn(
  items: ReturnableItem[],
  selection: Selection,
  reasonCode: string,
  description: string
): string | null {
  const chosen = items.filter((item) => selection[item.orderItemId]?.checked);
  if (chosen.length === 0) return 'Choose at least one item to return.';

  for (const item of chosen) {
    const quantity = selection[item.orderItemId].quantity;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > item.quantity) {
      return `Choose between 1 and ${item.quantity} of ${item.name}.`;
    }
  }

  if (!reasonCode) return 'Please choose a reason for the return.';
  const text = clean(description);
  if (reasonCode === 'other' && text.length < NOTE_MIN_FOR_OTHER) return 'Please explain the reason in a few words.';
  if (text.length > REASON_MAX) return `Please keep the description under ${REASON_MAX} characters.`;
  return null;
}

/** The ticked lines, as the API wants them. */
export function chosenItems(items: ReturnableItem[], selection: Selection) {
  return items
    .filter((item) => selection[item.orderItemId]?.checked)
    .map((item) => ({ orderItemId: item.orderItemId, quantity: selection[item.orderItemId].quantity }));
}

/** The body for POST /api/returns. No amount: the server works the refund out itself. */
export function buildReturnPayload(
  orderId: string,
  items: ReturnableItem[],
  selection: Selection,
  reasonCode: string,
  description: string
) {
  const text = clean(description);
  return {
    orderId,
    reasonCode,
    ...(text ? { description: text } : {}),
    items: chosenItems(items, selection),
  };
}
