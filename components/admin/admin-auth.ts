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

export const ADMIN_TOKEN_KEY = 'ardenby_token';

export const isAdminRole = (role?: string): role is AdminRole =>
  role === 'admin' || role === 'superadmin';

export const isSuperAdminRole = (role?: string) => role === 'superadmin';

export const getAdminToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;

export const saveAdminToken = (token: string) => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  window.dispatchEvent(new Event('ardenby-auth-changed'));
};

export const clearAdminToken = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.dispatchEvent(new Event('ardenby-auth-changed'));
};

export async function parseAdminResponse(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        data?.errors?.[0]?.message ||
        'Unable to continue.'
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

  const response = await fetch(apiUrl(endpoint), {
    ...options,
    headers,
  });

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
