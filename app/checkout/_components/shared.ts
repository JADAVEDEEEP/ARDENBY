import { apiUrl } from '@/lib/api-url';

export type Address = {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  address: string;
  city: string;
  state: string;
  address_type: string;
  is_default: boolean;
};

export type AddressForm = {
  name: string;
  phone: string;
  pincode: string;
  address: string;
  city: string;
  state: string;
  address_type: string;
  is_default: boolean;
};

export type PaymentId = 'online' | 'cod';

// Where the order flow currently is. Drives the status panel, the button
// labels and the duplicate-submit lock.
export type Phase =
  | 'idle'
  | 'creating' // POST /api/orders
  | 'opening' // loading Razorpay / creating the gateway order
  | 'awaiting' // Razorpay window is open
  | 'verifying' // server-side signature check
  | 'confirmed'
  | 'failed';

export async function apiRequest(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('ardenby_token') : null;

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
    throw new Error(data?.message || data?.error || 'Something went wrong');
  }

  return data;
}

export function unwrap<T = any>(data: any, keys: string[]): T {
  for (const key of keys) {
    if (data?.[key] !== undefined) return data[key] as T;
  }
  return data as T;
}

export function friendlyError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (error.message === 'AUTH_REQUIRED') return 'Please sign in to continue.';
    if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
      return 'Network problem. Check your connection and try again.';
    }
    if (error.message) return error.message;
  }
  return fallback;
}

export type AddressErrors = Partial<Record<keyof AddressForm, string>>;

export function validateAddress(form: AddressForm): AddressErrors {
  const errors: AddressErrors = {};
  const phoneDigits = form.phone.replace(/\D/g, '');

  if (form.name.trim().length < 2) errors.name = 'Enter the recipient’s full name.';
  if (phoneDigits.length < 10 || phoneDigits.length > 13) {
    errors.phone = 'Enter a valid 10-digit phone number.';
  }
  if (!/^[1-9]\d{5}$/.test(form.pincode.trim())) {
    errors.pincode = 'Pincode must be 6 digits.';
  }
  if (form.address.trim().length < 6) errors.address = 'Enter your house no., street and area.';
  if (!form.city.trim()) errors.city = 'Enter your city.';
  if (!form.state.trim()) errors.state = 'Enter your state.';

  return errors;
}
