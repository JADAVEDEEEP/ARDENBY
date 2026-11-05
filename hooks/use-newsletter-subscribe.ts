'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

/** Newsletter sign-up is NOT built yet: there is no endpoint and nothing is stored. Until it is,
 *  the forms are disabled and say so honestly. When a real endpoint exists, set NEWSLETTER_AVAILABLE
 *  to true and implement the submit below. Never show a "subscribed" message without a stored result. */
export const NEWSLETTER_AVAILABLE = false;
export const NEWSLETTER_UNAVAILABLE_TEXT = 'Newsletter sign-up is not available yet. Please check back soon.';

export function useNewsletterSubscribe() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault(); // nothing is submitted or stored
  };

  return { email, setEmail, subscribed: false, available: NEWSLETTER_AVAILABLE, handleSubscribe };
}
