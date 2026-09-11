const LOCAL_API_URL =
  process.env.NEXT_PUBLIC_LOCAL_API_URL || 'http://localhost:5000';

const PRODUCTION_API_URL =
  process.env.NEXT_PUBLIC_PRODUCTION_API_URL ||
  'https://ardernby-backend.onrender.com';

const configuredApiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? PRODUCTION_API_URL
    : LOCAL_API_URL);

export const API_URL = configuredApiUrl.replace(/\/+$/, '');

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${API_URL}${normalizedPath}`;
}
