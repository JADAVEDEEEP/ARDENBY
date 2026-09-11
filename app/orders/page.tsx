import Link from 'next/link';

export default function OrdersPage() {
  return <div className="container-ardenby py-16 max-w-3xl"><p className="text-xs uppercase tracking-widest text-olive font-semibold">Account</p><h1 className="font-display text-4xl font-bold mt-2">Your orders</h1><div className="rounded-2xl bg-muted p-10 text-center mt-10"><p className="text-muted-foreground">Sign in to view your order history and track deliveries.</p><Link href="/profile" className="inline-block mt-6 rounded-xl bg-ink text-cream px-6 py-3 font-semibold">Go to account</Link></div></div>;
}
