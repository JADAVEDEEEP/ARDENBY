export type Section =
  | 'overview'
  | 'orders'
  | 'wishlist'
  | 'addresses'
  | 'coupons'
  | 'account'
  | 'security';

export interface UserProfile {
  id?: string;
  full_name?: string;
  email?: string;
  phone?: string | null;
  gender?: string | null;
  email_verified?: boolean;
  is_active?: boolean;
  role?: string;
  auth_provider?: 'email' | 'google' | string;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  shipping_amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  coupon_code?: string | null;
  created_at: string;
}

export interface WishlistItem {
  product_id: string;
  product_name?: string;
  name?: string;
  price?: number;
  image_url?: string;
  product_image?: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  address: string;
  city: string;
  state: string;
  address_type: string;
  is_default: boolean;
}

export interface AddressForm {
  name: string;
  phone: string;
  pincode: string;
  address: string;
  city: string;
  state: string;
  address_type: string;
  is_default: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  min_order: number;
  max_discount?: number;
  expiry: string;
  active: boolean;
}
