import { apiUrl } from '@/lib/api-url';

/** A failed call to the shop API. `status` 0 = the server could not be reached. */
export class CustomerApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'CustomerApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Calls the shop API as the signed-in customer. The token is the one the rest of
 * the site already stores. A rejected session signs the customer out the same way
 * the order page does. Nothing here decides eligibility or money: the server does.
 */
export async function customerRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ardenby_token') : null;
  if (!token) throw new CustomerApiError('Please sign in to continue.', 401);

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new CustomerApiError('We could not reach the server. Check your connection and try again.', 0);
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem('ardenby_token');
    window.dispatchEvent(new Event('ardenby-auth-changed'));
    throw new CustomerApiError('Your session has ended. Please sign in again.', 401);
  }
  if (response.status === 429) {
    throw new CustomerApiError('Too many attempts. Please wait a minute and try again.', 429);
  }
  if (!response.ok) {
    throw new CustomerApiError(data?.message || 'Something went wrong. Please try again.', response.status, data?.code);
  }
  return data as T;
}

export const errorText = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';
