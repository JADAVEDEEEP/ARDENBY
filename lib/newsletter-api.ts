import { apiUrl } from '@/lib/api-url';

/** Same rules the server applies (it is the authority; this only saves a round trip). */
const EMAIL_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function isValidNewsletterEmail(value: string): boolean {
  const email = value.trim();
  return email.length >= 6 && email.length <= 254 && EMAIL_PATTERN.test(email);
}

export interface NewsletterResult {
  ok: boolean;
  message: string;
  code?: string;
  alreadyConfirmed?: boolean;
}

async function post(path: string, body: Record<string, unknown>): Promise<NewsletterResult> {
  try {
    const response = await fetch(apiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as {
      message?: unknown;
      code?: unknown;
      alreadyConfirmed?: unknown;
    };
    const message = typeof data.message === 'string' ? data.message : '';
    if (response.ok) {
      return { ok: true, message, alreadyConfirmed: data.alreadyConfirmed === true };
    }
    return {
      ok: false,
      message: message || (response.status === 429 ? 'Too many attempts. Please wait a few minutes and try again.' : 'Something went wrong. Please try again.'),
      code: typeof data.code === 'string' ? data.code : undefined,
    };
  } catch {
    return { ok: false, message: 'We could not reach the server. Check your connection and try again.' };
  }
}

/** `website` is a hidden honeypot field: real visitors leave it empty. */
export const subscribeToNewsletter = (email: string, website = '') =>
  post('/api/newsletter/subscribe', { email: email.trim(), source: 'home', website });

export const confirmNewsletter = (token: string) => post('/api/newsletter/confirm', { token });

export const unsubscribeNewsletter = (token: string) => post('/api/newsletter/unsubscribe', { token });
