import {
  AdminApiError,
  adminApiRequest,
  clearAdminToken,
  endAdminSession,
} from '@/components/admin/admin-auth';
import { adminLoginUrl } from '@/lib/auth-redirect';

export type OrderStatusCount = { status: string; count: number };

export type DashboardData = {
  generatedAt: string;
  range: number;
  stats: {
    totalCustomers: number;
    totalProducts: number;
    totalOrders: number;
    totalCommonAdmins: number;
    totalSuperAdmins: number;
    totalRevenue: number;
  };
  revenue: {
    paidOrders: number;
    today: number;
    last7Days: number;
    last30Days: number;
    last7DaysChange: number | null;
    last30DaysChange: number | null;
    averageOrderValue: number;
  };
  orders: {
    today: number;
    last7Days: number;
    last30Days: number;
    byStatus: OrderStatusCount[];
    byPaymentStatus: OrderStatusCount[];
  };
  series: { date: string; orders: number; revenue: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customer: string;
    customerEmail: string | null;
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
    createdAt: string;
  }[];
  products: {
    total: number;
    outOfStock: number;
    lowStock: number;
    lowStockLimit: number;
    unitsInStock: number;
    topSelling: { productId: string; name: string; units: number; revenue: number }[];
  };
  customers: {
    total: number;
    newLast7Days: number;
    newLast30Days: number;
    verified: number;
    withOrders: number;
    deactivated: number;
  };
};

export type SuperAdminUser = {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  role: 'customer' | 'admin' | 'superadmin';
  authProvider: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UsersResponse = {
  users: SuperAdminUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary: { total: number; customers: number; admins: number; superadmins: number; inactive: number };
};

/**
 * Calls a Super Admin endpoint. A rejected session (expired / revoked token)
 * clears the stored login and sends the user back to the admin login.
 */
export async function superAdminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    return await adminApiRequest<T>(`/api/superadmin${path}`, options);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401 && typeof window !== 'undefined') {
      clearAdminToken();
      void endAdminSession().finally(() => {
        window.location.replace(adminLoginUrl(window.location.pathname));
      });
    }
    throw error;
  }
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';

export const formatInr = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);

export const formatDate = (iso: string, withTime = false) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
