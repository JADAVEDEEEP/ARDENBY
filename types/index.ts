export type ProductSize = 'S' | 'M' | 'L' | 'XL' | 'XXL';

export type ProductColor =
  | 'Black'
  | 'White'
  | 'Beige'
  | 'Olive'
  | 'Navy'
  | 'Royal Blue'
  | 'Sky Blue'
  | 'Lilac'
  | 'Red'
  | 'Green';

export type FabricType =
  | '100% Cotton'
  | 'Textured'
  | 'Pattern'
  | 'Printed'
  | 'Puff Print';

export type CoverageType = 'Front' | 'Back' | 'All Over';

export type FitType =
  | 'Oversized'
  | 'Regular'
  | 'Cargo'
  | 'Hoodie'
  | 'Jogger';

export type CategorySlug =
  | 'supreme-edition'
  | 'epic-thread'
  | 'ardenby-premium'
  | 'the-print-club'
  | 'top-wear'
  | 'plus-size'
  | 'bottom-wear'
  | 'all-products';

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
}

/* ==========================================
   PRODUCT VARIANT
========================================== */

export interface ProductVariant {
  id: string;
  product_id: string;
  size: ProductSize;
  color: ProductColor;
  inventory: number;
  sku?: string | null;
}

/* ==========================================
   PRODUCT
========================================== */

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  categoryLabel: string;
  fit: FitType;
  fabric: FabricType;
  coverage: CoverageType;

  colors: ProductColor[];
  sizes: ProductSize[];
  variants: ProductVariant[];

  images: string[];
  fabricImage: string;

  price: number;
  mrp: number;
  bestPrice: number;

  rating: number;
  reviewCount: number;
  reviews: Review[];

  description: string;
  fabricDetails: string;
  washCare: string;

  tags: string[];

  bestSeller: boolean;
  newArrival: boolean;
  trending: boolean;
  limitedEdition: boolean;

  inventory: number;
}

/* ==========================================
   CART ITEM
========================================== */

export interface CartItem {
  productId: string;
  variantId: string;

  slug: string;
  name: string;
  image: string;

  size: ProductSize;
  color: ProductColor;

  quantity: number;

  price: number;
  mrp: number;
}

/* ==========================================
   ADDRESS
========================================== */

export interface Address {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  address: string;
  city: string;
  state: string;
  type: 'Home' | 'Office' | 'Other';
  isDefault: boolean;
}

/* ==========================================
   ORDER
========================================== */

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: number;
  items: CartItem[];
  address: Address;
  paymentMethod: string;
}

/* ==========================================
   COUPON
========================================== */

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrder: number;
  maxDiscount: number;
  expiry: string;
  active: boolean;
}