export function formatINR(amount: number): string {
  // Whole rupees stay plain (₹600); paise always show two digits (₹283.50).
  const whole = Number.isInteger(amount);
  return (
    '₹' +
    amount.toLocaleString('en-IN', whole ? undefined : { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

export function discountPercent(mrp: number, price: number): number {
  return Math.round(((mrp - price) / mrp) * 100);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
