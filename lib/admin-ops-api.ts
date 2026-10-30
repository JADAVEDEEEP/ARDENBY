import {
  AdminApiError,
  adminApiRequest,
  clearAdminToken,
  endAdminSession,
  getAdminToken,
} from '@/components/admin/admin-auth';
import { apiUrl } from '@/lib/api-url';
import { adminLoginUrl } from '@/lib/auth-redirect';

/**
 * Helpers for the review / returns / history / export / security screens.
 * Every call goes to the backend, which re-checks the login and role itself;
 * nothing here grants access.
 */

export type Pagination = { page: number; limit: number; total: number; totalPages: number };

const signOutIfRejected = (error: unknown) => {
  if (error instanceof AdminApiError && error.status === 401 && typeof window !== 'undefined') {
    clearAdminToken();
    void endAdminSession().finally(() => {
      window.location.replace(adminLoginUrl(window.location.pathname));
    });
  }
};

export async function opsRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    return await adminApiRequest<T>(path, options);
  } catch (error) {
    signOutIfRejected(error);
    throw error;
  }
}

export const toQuery = (values: Record<string, string | number | undefined | null>) => {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && String(value) !== '') qs.set(key, String(value));
  }
  const text = qs.toString();
  return text ? `?${text}` : '';
};

/**
 * Downloads a CSV. The token goes in the Authorization header (a plain link
 * could not carry it), so the file is fetched and then saved from memory.
 */
export async function downloadCsv(path: string, fallbackName: string) {
  const token = getAdminToken();
  let response: Response;

  try {
    response = await fetch(apiUrl(path), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new AdminApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new AdminApiError(data?.message || 'The export could not be created.', response.status);
    signOutIfRejected(error);
    throw error;
  }

  const disposition = response.headers.get('content-disposition') || '';
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] || fallbackName;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return name;
}

export const inr = (value: number | null | undefined) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    value || 0
  );

export const when = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';

export const todayIso = () => {
  // IST calendar day, matching how the backend buckets orders.
  const ist = new Date(Date.now() + 330 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
};

export const daysAgoIso = (days: number) => {
  const ist = new Date(Date.now() + 330 * 60 * 1000 - days * 86400000);
  return ist.toISOString().slice(0, 10);
};
