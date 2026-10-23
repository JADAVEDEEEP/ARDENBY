'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

import { toast } from 'sonner';

/** Newsletter submit + sonner toasts. Shared by the homepage Newsletter section
 *  and the footer form (same logic as the original footer handler). */
export function useNewsletterSubscribe() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }

    setSubscribed(true);

    toast.success('Welcome to the Kovenik Fam! Check your inbox for 10% off.');

    setEmail('');
  };

  return { email, setEmail, subscribed, handleSubscribe };
}
