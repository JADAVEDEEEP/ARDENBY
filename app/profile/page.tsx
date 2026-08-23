'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  return <div className="container-ardenby py-16 max-w-xl"><div className="text-center"><p className="text-xs uppercase tracking-widest text-olive font-semibold">Your ARDENBY account</p><h1 className="font-display text-4xl font-bold mt-2">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1></div><div className="flex gap-2 bg-muted rounded-xl p-1 mt-8"><button onClick={() => setMode('login')} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${mode === 'login' ? 'bg-cream shadow-sm' : ''}`}>Login</button><button onClick={() => setMode('register')} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${mode === 'register' ? 'bg-cream shadow-sm' : ''}`}>Register</button></div><form onSubmit={(event) => event.preventDefault()} className="space-y-4 mt-7">{mode === 'register' && <input required placeholder="Full name" className="w-full rounded-xl border border-border bg-transparent px-4 py-3.5" />}<input required type="email" placeholder="Email address" className="w-full rounded-xl border border-border bg-transparent px-4 py-3.5" /><input required type="password" placeholder="Password" className="w-full rounded-xl border border-border bg-transparent px-4 py-3.5" /><button className="w-full rounded-xl bg-ink text-cream py-4 font-semibold">{mode === 'login' ? 'Login' : 'Create account'}</button></form><p className="text-center text-sm text-muted-foreground mt-6"><Link href="/orders" className="hover:text-olive">View your orders</Link></p></div>;
}
