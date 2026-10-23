'use client';

import { apiUrl } from '@/lib/api-url';

export type AdminRole = 'admin' | 'superadmin';

export interface AdminUser {
  id?: string;
  fullName: string;
  email: string;
  role?: string;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  user?: any;
  data?: any;
  requiresOTP?: boolean;
  requiresOtp?: boolean;
  otpRequired?: boolean;
  purpose?: 'login' | 'email_verification' | 'password_reset';
  message?: string;
}

export const ADMIN_TOKEN_KEY = 'ardenby_admin_token';

export const isAdminRole = (role?: string): role is AdminRole =>
  role === 'admin' || role === 'superadmin';

export const isSuperAdminRole = (role?: string) => role === 'superadmin';

export const getAdminToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;

export const saveAdminToken = (token: string) => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  window.dispatchEvent(new Event('ardenby-auth-changed'));
};

/**
 * Asks the Next.js server to issue the httpOnly admin-session cookie that the
 * middleware requires before it will serve any /admin page. The server confirms
 * the role with the backend first. Resolves true only when the cookie was issued.
 */
export async function startAdminSession(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/admin-session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function endAdminSession() {
  try {
    await fetch('/api/admin-session', { method: 'DELETE', credentials: 'same-origin' });
  } catch {
    // The cookie also expires on its own.
  }
}

export const clearAdminToken = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.dispatchEvent(new Event('ardenby-auth-changed'));
};

/** Failed API call; `status` is 0 when the server could not be reached. */
export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

/** The server rejected the session itself (missing / expired / revoked token). */
export const isSessionRejected = (error: unknown) =>
  error instanceof AdminApiError && error.status === 401;

export async function parseAdminResponse(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new AdminApiError(
      data?.message ||
        data?.error ||
        data?.errors?.[0]?.message ||
        'Unable to continue.',
      response.status
    );
  }

  return data;
}

export async function adminApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAdminToken();
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(apiUrl(endpoint), {
      ...options,
      headers,
    });
  } catch {
    throw new AdminApiError(
      'Unable to reach the server. Check your connection and try again.',
      0
    );
  }

  return (await parseAdminResponse(response)) as T;
}

export function readToken(response: AuthResponse) {
  return (
    response.token ||
    response.accessToken ||
    response.jwt ||
    response.data?.token ||
    response.data?.accessToken
  );
}

export function normalizeAdminUser(rawUser: any): AdminUser {
  return {
    id: rawUser?.id,
    fullName:
      rawUser?.full_name || rawUser?.fullName || rawUser?.name || 'Admin',
    email: rawUser?.email || '',
    role: rawUser?.role,
  };
}

export async function getCurrentAdmin() {
  const response = await adminApiRequest<{ user?: any; data?: any }>(
    '/api/users/me',
    { method: 'GET' }
  );

  return normalizeAdminUser(response.user || response.data || response);
}
