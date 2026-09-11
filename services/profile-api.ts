import { apiUrl } from '@/lib/api-url';

export async function profileRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('ardenby_token')
      : null;

  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || 'Something went wrong'
    );
  }

  return data;
}

export function unwrap<T = any>(data: any, keys: string[]): T {
  for (const key of keys) {
    if (data?.[key] !== undefined) return data[key] as T;
  }
  return data as T;
}
