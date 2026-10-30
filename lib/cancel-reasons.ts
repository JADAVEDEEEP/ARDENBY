/**
 * Cancellation reasons a CUSTOMER can pick. The server only accepts these codes
 * (ArdenBy_Backend/utils/reasons.js); a test keeps the two lists identical.
 * The order page asks the API for its list; this copy is for screens that cannot
 * wait for a request (the small cancel dialog on the profile page).
 */
export const CUSTOMER_CANCEL_REASONS = [
  { code: 'changed_mind', label: 'I changed my mind' },
  { code: 'ordered_by_mistake', label: 'I ordered by mistake' },
  { code: 'found_cheaper', label: 'I found a better price elsewhere' },
  { code: 'wrong_size_ordered', label: 'I chose the wrong size or colour' },
  { code: 'delivery_too_slow', label: 'Delivery is taking too long' },
  { code: 'payment_issue', label: 'A problem with my payment' },
  { code: 'other', label: 'Other (please explain)' },
] as const;

export const NOTE_MIN_FOR_OTHER = 5;
export const NOTE_MAX = 500;

/** The first thing to fix before a cancellation can be sent, or null. */
export function validateCancelReason(reasonCode: string, note: string): string | null {
  if (!CUSTOMER_CANCEL_REASONS.some((r) => r.code === reasonCode)) return 'Please choose a reason for the cancellation.';
  const text = note.replace(/\s+/g, ' ').trim();
  if (reasonCode === 'other' && text.length < NOTE_MIN_FOR_OTHER) return 'Please explain the reason in a few words.';
  if (text.length > NOTE_MAX) return `Please keep the note under ${NOTE_MAX} characters.`;
  return null;
}
