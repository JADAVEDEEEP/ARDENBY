'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

import { isValidNewsletterEmail, subscribeToNewsletter } from '@/lib/newsletter-api';

export type NewsletterStatus = 'idle' | 'loading' | 'success' | 'error';

/** Wording shown next to the Join button. The server records which version the visitor saw
 *  (CONSENT_TEXT_VERSION in the backend); change both together if this text changes. */
export const NEWSLETTER_CONSENT_TEXT =
  'By joining you agree to receive KOVENIK marketing emails. We will email you once to confirm. Unsubscribe anytime.';

export function useNewsletterSubscribe() {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<NewsletterStatus>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;

    if (!isValidNewsletterEmail(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');
    const result = await subscribeToNewsletter(email, website);
    if (result.ok) {
      setStatus('success');
      setMessage(result.message || 'Almost there! Check your inbox for a confirmation email to finish joining.');
      setEmail('');
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };

  const onEmailChange = (value: string) => {
    setEmail(value);
    if (status === 'error') {
      setStatus('idle');
      setMessage('');
    }
  };

  return { email, setEmail: onEmailChange, website, setWebsite, status, message, handleSubscribe };
}
