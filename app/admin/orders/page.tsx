'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from 'lucide-react';

import { apiUrl } from '@/lib/api-url';

type OrderItem = {
  id?: string;
  product_id?: string;
  productId?: string;
  product_name?: string;
  productName?: string;
  name?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  total?: number;
  size?: string;
  color?: string;
};

type Order = {
  id?: string;
  order_id?: string;
  orderId?: string;

  customer_id?: string;
  customerId?: string;
  user_id?: string;
  userId?: string;

  customer_name?: string;
  customerName?: string;
  customer_email?: string;
  customerEmail?: string;
  email?: string;
  phone?: string;
  customer_phone?: string;

  total?: number;
  total_amount?: number;
  totalAmount?: number;
  grand_total?: number;
  grandTotal?: number;
  amount?: number;

  status?: string;

  created_at?: string;
  createdAt?: string;
  date?: string;

  shipping_address?: any;
  shippingAddress?: any;
  address?: any;

  items?: OrderItem[];
  order_items?: OrderItem[];
  orderItems?: OrderItem[];
};

const STATUS_OPTIONS = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('ardenby_token')
      : null;

  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...(options?.headers || {}),
    },
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

function arrayFrom<T>(data: any, key: string): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getOrderId(order: Order) {
  return order.order_id || order.orderId || order.id || '';
}

function getCustomer(order: Order) {
  return (
    order.customer_name ||
    order.customerName ||
    order.customer_email ||
    order.customerEmail ||
    order.email ||
    'Customer'
  );
}

function getCustomerEmail(order: Order) {
  return (
    order.customer_email ||
    order.customerEmail ||
    order.email ||
    ''
  );
}

function getAmount(order: Order) {
  const value = Number(
    order.total ??
      order.total_amount ??
      order.totalAmount ??
      order.grand_total ??
      order.grandTotal ??
      order.amount ??
      0
  );

  return Number.isFinite(value) ? value : 0;
}

function getDate(order: Order) {
  return (
    order.created_at ||
    order.createdAt ||
    order.date ||
    ''
  );
}

function getItems(order: Order) {
  return (
    order.items ||
    order.order_items ||
    order.orderItems ||
    []
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusStyles(status?: string) {
  const value = String(status || '').toLowerCase();

  if (value.includes('cancel')) {
    return {
      className: 'bg-[#fff0f0] text-[#c45353]',
      icon: XCircle,
    };
  }

  if (value.includes('deliver') || value.includes('complete')) {
    return {
      className: 'bg-[#edf8f0] text-[#32804c]',
      icon: CheckCircle2,
    };
  }

  if (value.includes('ship')) {
    return {
      className: 'bg-[#edf5ff] text-[#4c7da9]',
      icon: Truck,
    };
  }

  if (value.includes('process')) {
    return {
      className: 'bg-[#f0f4ff] text-[#6179ad]',
      icon: PackageCheck,
    };
  }

  return {
    className: 'bg-[#fff7e8] text-[#a87932]',
    icon: Clock3,
  };
}

function getAddress(order: Order) {
  const address =
    order.shipping_address ||
    order.shippingAddress ||
    order.address;

  if (!address) return '';

  if (typeof address === 'string') return address;

  if (typeof address === 'object') {
    return [
      address.name,
      address.address,
      address.address1,
      address.address_line1,
      address.city,
      address.state,
      address.pincode,
      address.zip,
    ]
      .filter(Boolean)
      .join(', ');
  }

  return '';
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] =
    useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadOrders() {
    try {
      setLoading(true);
      setError('');

      const response = await request<any>(
        '/api/orders/admin/all'
      );

      const nextOrders = arrayFrom<Order>(
        response,
        'orders'
      );

      setOrders(nextOrders);

      if (nextOrders.length > 0) {
        const firstId = getOrderId(nextOrders[0]);

        setSelectedOrderId((current) =>
          current &&
          nextOrders.some(
            (order) =>
              getOrderId(order) === current
          )
            ? current
            : firstId
        );
      } else {
        setSelectedOrderId('');
      }
    } catch (err: any) {
      setError(
        err?.message ||
          'Unable to load orders.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return orders;

    return orders.filter((order) => {
      const id = getOrderId(order).toLowerCase();
      const name = getCustomer(order).toLowerCase();
      const email = getCustomerEmail(order).toLowerCase();
      const orderStatus = String(
        order.status || ''
      ).toLowerCase();

      return (
        id.includes(query) ||
        name.includes(query) ||
        email.includes(query) ||
        orderStatus.includes(query)
      );
    });
  }, [orders, search]);

  const selectedOrder = useMemo(
    () =>
      orders.find(
        (order) =>
          getOrderId(order) ===
          selectedOrderId
      ) || null,
    [orders, selectedOrderId]
  );

  useEffect(() => {
    if (selectedOrder) {
      setStatus(selectedOrder.status || 'Pending');
    }
  }, [selectedOrder]);

  const totals = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter(
        (order) =>
          String(order.status || '').toLowerCase() ===
          'pending'
      ).length,
      processing: orders.filter(
        (order) =>
          String(order.status || '').toLowerCase() ===
          'processing'
      ).length,
      shipped: orders.filter(
        (order) =>
          String(order.status || '').toLowerCase() ===
          'shipped'
      ).length,
      delivered: orders.filter((order) =>
        String(order.status || '')
          .toLowerCase()
          .includes('deliver')
      ).length,
    };
  }, [orders]);

  async function updateOrderStatus() {
    if (!selectedOrderId || !status) return;

    try {
      setUpdating(true);
      setError('');
      setSuccess('');

      await request(
        `/api/orders/admin/${encodeURIComponent(
          selectedOrderId
        )}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }
      );

      setOrders((current) =>
        current.map((order) =>
          getOrderId(order) ===
          selectedOrderId
            ? { ...order, status }
            : order
        )
      );

      setSuccess(
        `Order #${selectedOrderId} status updated.`
      );
    } catch (err: any) {
      setError(
        err?.message ||
          'Unable to update order status.'
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="min-h-full bg-[#f5f6f7] p-4 sm:p-5 lg:p-6">
      {/* HEADER */}
      <section className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a77c45]">
            Store Management
          </p>

          <h1 className="mt-1 font-serif text-3xl tracking-tight text-[#202428] sm:text-4xl">
            Orders
          </h1>

          <p className="mt-2 text-sm text-[#899198]">
            View customer orders and manage their status.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="flex h-10 w-fit items-center gap-2 rounded-lg border border-[#dfe4e8] bg-white px-4 text-xs font-medium text-[#596169] transition hover:border-[#c7ced4] disabled:opacity-60"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              loading ? 'animate-spin' : ''
            }`}
          />
          Refresh
        </button>
      </section>

      {/* MESSAGES */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700">
          {success}
        </div>
      )}

      {/* ORDER SUMMARY */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <OrderStat
          title="All Orders"
          value={loading ? '—' : totals.all}
          icon={ShoppingBag}
        />

        <OrderStat
          title="Pending"
          value={loading ? '—' : totals.pending}
          icon={Clock3}
        />

        <OrderStat
          title="Processing"
          value={loading ? '—' : totals.processing}
          icon={PackageCheck}
        />

        <OrderStat
          title="Shipped"
          value={loading ? '—' : totals.shipped}
          icon={Truck}
        />

        <OrderStat
          title="Delivered"
          value={loading ? '—' : totals.delivered}
          icon={CheckCircle2}
        />
      </section>

      {/* ORDERS + DETAIL */}
      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(330px,0.75fr)]">
        {/* ORDER LIST */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-[#e1e5e8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.025)]">
          <div className="flex flex-col gap-3 border-b border-[#edf0f2] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="text-sm font-semibold text-[#343a40]">
                All Orders
              </h2>

              <p className="mt-1 text-[10px] text-[#929aa1]">
                {filteredOrders.length} order
                {filteredOrders.length === 1
                  ? ''
                  : 's'}
              </p>
            </div>

            <div className="relative w-full sm:max-w-[260px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#929aa1]" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search order or customer..."
                className="h-9 w-full rounded-lg border border-[#e1e5e8] bg-[#fafbfc] pl-9 pr-3 text-[11px] outline-none focus:border-[#aeb8c0]"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse bg-[#f4f6f7]"
                />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex min-h-[260px] items-center justify-center px-6 text-center">
              <div>
                <ShoppingBag className="mx-auto h-7 w-7 text-[#aeb5bb]" />

                <p className="mt-3 text-sm font-medium text-[#555e65]">
                  No orders found
                </p>

                <p className="mt-1 text-xs text-[#969da3]">
                  {search
                    ? 'Try another search.'
                    : 'Orders will appear here when available.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="border-b border-[#edf0f2] bg-[#fafbfc] text-left text-[9px] uppercase tracking-[0.08em] text-[#929aa1]">
                    <th className="px-5 py-3 font-medium">
                      Order
                    </th>
                    <th className="px-3 py-3 font-medium">
                      Customer
                    </th>
                    <th className="px-3 py-3 font-medium">
                      Date
                    </th>
                    <th className="px-3 py-3 font-medium">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right font-medium">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map(
                    (order, index) => {
                      const id = getOrderId(order);
                      const statusInfo =
                        statusStyles(order.status);
                      const StatusIcon =
                        statusInfo.icon;

                      return (
                        <tr
                          key={`${id}-${index}`}
                          onClick={() =>
                            setSelectedOrderId(id)
                          }
                          className={`cursor-pointer border-b border-[#f0f2f3] transition last:border-0 ${
                            id === selectedOrderId
                              ? 'bg-[#faf6f0]'
                              : 'hover:bg-[#fafbfc]'
                          }`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f2eee8]">
                                <ShoppingBag className="h-3.5 w-3.5 text-[#9a7447]" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#343a40]">
                                  Order #{index + 1}
                                </p>
                                <p className="mt-0.5 max-w-[150px] truncate text-[9px] text-[#a0a6ab]">
                                  {id || 'Order reference'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="max-w-[190px] truncate px-3 py-4 text-xs text-[#687078]">
                            {getCustomer(order)}
                          </td>

                          <td className="px-3 py-4 text-[10px] text-[#929aa1]">
                            {shortDateOnly(
                              getDate(order)
                            )}
                          </td>

                          <td className="px-3 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-semibold ${statusInfo.className}`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {order.status ||
                                'Pending'}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right text-xs font-semibold text-[#343a40]">
                            {formatMoney(
                              getAmount(order)
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ORDER DETAIL */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-[#e1e5e8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.025)]">
          <div className="border-b border-[#edf0f2] p-4 sm:p-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#a77c45]">
              Order Details
            </p>

            <div className="mt-1 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#343a40]">
                  {selectedOrder
                    ? 'Order Details'
                    : 'Select an order'}
                </h2>

                {selectedOrder && (
                  <p className="mt-1 max-w-[210px] truncate text-[9px] text-[#a0a6ab]">
                    Reference: {getOrderId(selectedOrder)}
                  </p>
                )}
              </div>

              {selectedOrder && (
                <span
                  className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${
                    statusStyles(
                      selectedOrder.status
                    ).className
                  }`}
                >
                  {selectedOrder.status ||
                    'Pending'}
                </span>
              )}
            </div>
          </div>

          {!selectedOrder ? (
            <div className="flex min-h-[300px] items-center justify-center px-6 text-center text-xs text-[#969da3]">
              Select an order to view its details.
            </div>
          ) : (
            <div className="space-y-5 p-4 sm:p-5">
              {/* CUSTOMER */}
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#929aa1]">
                  Customer
                </p>

                <p className="mt-2 text-sm font-medium text-[#343a40]">
                  {getCustomer(
                    selectedOrder
                  )}
                </p>

                {getCustomerEmail(
                  selectedOrder
                ) && (
                  <p className="mt-1 break-all text-xs text-[#858e95]">
                    {getCustomerEmail(
                      selectedOrder
                    )}
                  </p>
                )}

                {selectedOrder.phone ||
                selectedOrder.customer_phone ? (
                  <p className="mt-1 text-xs text-[#858e95]">
                    {selectedOrder.phone ||
                      selectedOrder.customer_phone}
                  </p>
                ) : null}
              </div>

              {/* ORDER META */}
              <div className="grid grid-cols-2 gap-3">
                <InfoBox
                  label="Order Date"
                  value={formatDate(
                    getDate(selectedOrder)
                  )}
                />

                <InfoBox
                  label="Order Total"
                  value={formatMoney(
                    getAmount(selectedOrder)
                  )}
                />
              </div>

              {/* ITEMS */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#929aa1]">
                    Items
                  </p>

                  <span className="text-[10px] text-[#929aa1]">
                    {getItems(selectedOrder).length}{' '}
                    item
                    {getItems(selectedOrder).length ===
                    1
                      ? ''
                      : 's'}
                  </span>
                </div>

                <div className="mt-2 space-y-2">
                  {getItems(selectedOrder).length ===
                  0 ? (
                    <div className="border border-dashed border-[#dfe4e8] p-4 text-center text-xs text-[#969da3]">
                      No item details returned by
                      the API.
                    </div>
                  ) : (
                    getItems(selectedOrder).map(
                      (item, index) => (
                        <div
                          key={
                            item.id ||
                            `${item.name}-${index}`
                          }
                          className="flex items-center justify-between gap-3 border border-[#edf0f2] bg-[#fafbfc] p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-[#343a40]">
                              {item.product_name ||
                                item.productName ||
                                item.name ||
                                item.product_id ||
                                item.productId ||
                                'Product'}
                            </p>

                            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-[#929aa1]">
                              {item.quantity ??
                              item.qty ? (
                                <span>
                                  Qty:{' '}
                                  {item.quantity ??
                                    item.qty}
                                </span>
                              ) : null}

                              {item.size && (
                                <span>
                                  Size: {item.size}
                                </span>
                              )}

                              {item.color && (
                                <span>
                                  Color: {item.color}
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="shrink-0 text-xs font-semibold text-[#343a40]">
                            {formatMoney(
                              Number(
                                item.total ??
                                  item.price ??
                                  0
                              )
                            )}
                          </span>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>

              {/* ADDRESS */}
              {getAddress(selectedOrder) && (
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#929aa1]">
                    Shipping Address
                  </p>

                  <p className="mt-2 text-xs leading-5 text-[#687078]">
                    {getAddress(selectedOrder)}
                  </p>
                </div>
              )}

              {/* STATUS UPDATE */}
              <div className="border-t border-[#edf0f2] pt-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#929aa1]">
                  Update Status
                </p>

                <div className="mt-2 flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={status}
                      onChange={(event) =>
                        setStatus(
                          event.target.value
                        )
                      }
                      className="h-10 w-full appearance-none border border-[#dfe4e8] bg-white px-3 pr-9 text-xs text-[#343a40] outline-none focus:border-[#aeb8c0]"
                    >
                      {STATUS_OPTIONS.map(
                        (option) => (
                          <option
                            key={option}
                            value={option}
                          >
                            {option}
                          </option>
                        )
                      )}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#858e95]" />
                  </div>

                  <button
                    type="button"
                    onClick={updateOrderStatus}
                    disabled={
                      updating ||
                      !status ||
                      status ===
                        selectedOrder.status
                    }
                    className="h-10 rounded-lg bg-[#171a1d] px-4 text-xs font-semibold text-white transition hover:bg-[#30353a] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {updating
                      ? 'Updating...'
                      : 'Update'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function OrderStat({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: any;
}) {
  return (
    <div className="border border-[#e1e5e8] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-[#899198]">
          {title}
        </p>

        <Icon className="h-4 w-4 text-[#7e878e]" />
      </div>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-[#343a40]">
        {value}
      </p>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#f7f9fa] p-3">
      <p className="text-[9px] uppercase tracking-wide text-[#929aa1]">
        {label}
      </p>

      <p className="mt-1 text-xs font-medium leading-5 text-[#4c555c]">
        {value}
      </p>
    </div>
  );
}

function shortDateOnly(value: string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
