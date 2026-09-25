'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from 'lucide-react';

import { apiUrl } from '@/lib/api-url';
import { getAdminToken } from '@/components/admin/admin-auth';

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
  const token = getAdminToken();

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

function statusStyles(status?: string) {
  const value = String(status || '').toLowerCase();

  if (value.includes('cancel')) {
    return {
      className: 'bg-[#faf0ef] text-[#a4514f]',
      dot: '#a4514f',
      icon: XCircle,
    };
  }

  if (value.includes('deliver') || value.includes('complete')) {
    return {
      className: 'bg-[#eef6f0] text-[#4f7a5c]',
      dot: '#4f7a5c',
      icon: CheckCircle2,
    };
  }

  if (value.includes('ship')) {
    return {
      className: 'bg-[#eef5f8] text-[#4c7a94]',
      dot: '#4c7a94',
      icon: Truck,
    };
  }

  if (value.includes('process')) {
    return {
      className: 'bg-[#f1f1f8] text-[#6b6f9c]',
      dot: '#6b6f9c',
      icon: PackageCheck,
    };
  }

  return {
    className: 'bg-[#faf3e6] text-[#b8863b]',
    dot: '#b8863b',
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
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [mobilePane, setMobilePane] = useState<'list' | 'detail'>('list');

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadOrders() {
    try {
      setLoading(true);
      setError('');

      const response = await request<any>('/api/orders/admin/all');
      const nextOrders = arrayFrom<Order>(response, 'orders');

      setOrders(nextOrders);

      if (nextOrders.length > 0) {
        const firstId = getOrderId(nextOrders[0]);

        setSelectedOrderId((current) =>
          current && nextOrders.some((order) => getOrderId(order) === current)
            ? current
            : firstId
        );
      } else {
        setSelectedOrderId('');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load orders.');
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
      const orderStatus = String(order.status || '').toLowerCase();

      return (
        id.includes(query) ||
        name.includes(query) ||
        email.includes(query) ||
        orderStatus.includes(query)
      );
    });
  }, [orders, search]);

  const selectedOrder = useMemo(
    () => orders.find((order) => getOrderId(order) === selectedOrderId) || null,
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
        (order) => String(order.status || '').toLowerCase() === 'pending'
      ).length,
      processing: orders.filter(
        (order) => String(order.status || '').toLowerCase() === 'processing'
      ).length,
      shipped: orders.filter(
        (order) => String(order.status || '').toLowerCase() === 'shipped'
      ).length,
      delivered: orders.filter((order) =>
        String(order.status || '').toLowerCase().includes('deliver')
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
        `/api/orders/admin/${encodeURIComponent(selectedOrderId)}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }
      );

      setOrders((current) =>
        current.map((order) =>
          getOrderId(order) === selectedOrderId ? { ...order, status } : order
        )
      );

      setSuccess(`Order #${selectedOrderId} status updated.`);
    } catch (err: any) {
      setError(err?.message || 'Unable to update order status.');
    } finally {
      setUpdating(false);
    }
  }

  function selectOrder(id: string) {
    setSelectedOrderId(id);
    setMobilePane('detail');
  }

  return (
    <div className="min-h-full bg-[#f7f5f1] p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <section className="mb-6 flex flex-col gap-4 border-b border-[#e6e1d7] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#9c7a4e]">
            Store Management
          </p>

          <h1 className="mt-2 font-serif text-3xl text-[#23201b] sm:text-[2.5rem]">
            Orders
          </h1>

          <p className="mt-2 text-[13px] text-[#8a8377]">
            Review customer orders and move each one through fulfilment.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="flex h-10 w-fit items-center gap-2 border border-[#d8d2c4] bg-white px-4 text-[11px] font-medium tracking-wide text-[#5a5449] transition hover:border-[#9c7a4e] hover:text-[#9c7a4e] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </section>

      {/* MESSAGES */}
      {error && (
        <div className="mb-4 border border-[#e6c8c6] bg-[#faf0ef] px-4 py-3 text-xs text-[#8f3d3b]">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 border border-[#cfe0d1] bg-[#eef6f0] px-4 py-3 text-xs text-[#3f6349]">
          {success}
        </div>
      )}

      {/* ORDER SUMMARY */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <OrderStat title="All Orders" value={loading ? '—' : totals.all} icon={ShoppingBag} />
        <OrderStat title="Pending" value={loading ? '—' : totals.pending} icon={Clock3} />
        <OrderStat title="Processing" value={loading ? '—' : totals.processing} icon={PackageCheck} />
        <OrderStat title="Shipped" value={loading ? '—' : totals.shipped} icon={Truck} />
        <OrderStat title="Delivered" value={loading ? '—' : totals.delivered} icon={CheckCircle2} />
      </section>

      {/* MOBILE PANE SWITCH (below xl only, and only once an order exists to view) */}
      {selectedOrder && (
        <div className="mt-5 flex border border-[#e6e1d7] bg-white text-[11px] font-medium tracking-wide xl:hidden">
          <button
            type="button"
            onClick={() => setMobilePane('list')}
            className={`flex-1 py-2.5 text-center transition ${
              mobilePane === 'list' ? 'bg-[#23201b] text-white' : 'text-[#5a5449]'
            }`}
          >
            Order List
          </button>
          <button
            type="button"
            onClick={() => setMobilePane('detail')}
            className={`flex-1 py-2.5 text-center transition ${
              mobilePane === 'detail' ? 'bg-[#23201b] text-white' : 'text-[#5a5449]'
            }`}
          >
            Order Details
          </button>
        </div>
      )}

      {/* ORDERS + DETAIL */}
      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
        {/* ORDER LIST */}
        <div
          className={`min-w-0 overflow-hidden border border-[#e6e1d7] bg-white ${
            selectedOrder && mobilePane === 'detail' ? 'hidden xl:block' : ''
          }`}
        >
          <div className="flex flex-col gap-3 border-b border-[#edeae1] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="font-serif text-base text-[#23201b]">All Orders</h2>
              <p className="mt-1 text-[10px] text-[#a19a8c]">
                {filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="relative w-full sm:max-w-[260px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a19a8c]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order or customer..."
                className="h-9 w-full border border-[#e6e1d7] bg-[#fbfaf7] pl-9 pr-3 text-[11px] outline-none focus:border-[#9c7a4e]"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-16 animate-pulse bg-[#f4f2ec]" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex min-h-[260px] items-center justify-center px-6 text-center">
              <div>
                <ShoppingBag className="mx-auto h-6 w-6 text-[#c7c0b0]" />
                <p className="mt-3 font-serif text-base text-[#4c4740]">No orders found</p>
                <p className="mt-1 text-xs text-[#a19a8c]">
                  {search ? 'Try another search.' : 'Orders will appear here when available.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop / wide table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[650px]">
                  <thead>
                    <tr className="border-b border-[#edeae1] bg-[#fbfaf7] text-left text-[9px] uppercase tracking-[0.14em] text-[#a19a8c]">
                      <th className="px-5 py-3 font-medium">Order</th>
                      <th className="px-3 py-3 font-medium">Customer</th>
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 text-right font-medium">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order, index) => {
                      const id = getOrderId(order);
                      const statusInfo = statusStyles(order.status);
                      const StatusIcon = statusInfo.icon;

                      return (
                        <tr
                          key={`${id}-${index}`}
                          onClick={() => selectOrder(id)}
                          className={`cursor-pointer border-b border-[#f1efe8] transition last:border-0 ${
                            id === selectedOrderId ? 'bg-[#faf6ee]' : 'hover:bg-[#fbfaf7]'
                          }`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#e6e1d7] bg-[#f4ede1] text-[#9c7a4e]">
                                <ShoppingBag className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-[#23201b]">
                                  Order #{index + 1}
                                </p>
                                <p className="mt-0.5 max-w-[150px] truncate text-[9px] text-[#a19a8c]">
                                  {id || 'Order reference'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="max-w-[190px] truncate px-3 py-4 text-xs text-[#5a5449]">
                            {getCustomer(order)}
                          </td>

                          <td className="px-3 py-4 text-[10px] text-[#a19a8c]">
                            {shortDateOnly(getDate(order))}
                          </td>

                          <td className="px-3 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-medium ${statusInfo.className}`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {order.status || 'Pending'}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right text-xs font-medium text-[#23201b]">
                            {formatMoney(getAmount(order))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="divide-y divide-[#f1efe8] sm:hidden">
                {filteredOrders.map((order, index) => {
                  const id = getOrderId(order);
                  const statusInfo = statusStyles(order.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <button
                      key={`${id}-${index}`}
                      type="button"
                      onClick={() => selectOrder(id)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition ${
                        id === selectedOrderId ? 'bg-[#faf6ee]' : ''
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#e6e1d7] bg-[#f4ede1] text-[#9c7a4e]">
                          <ShoppingBag className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#23201b]">
                            Order #{index + 1}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-[#a19a8c]">
                            {getCustomer(order)} · {shortDateOnly(getDate(order))}
                          </p>
                          <span
                            className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-medium ${statusInfo.className}`}
                          >
                            <StatusIcon className="h-2.5 w-2.5" />
                            {order.status || 'Pending'}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs font-medium text-[#23201b]">
                          {formatMoney(getAmount(order))}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[#c7c0b0]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ORDER DETAIL */}
        <div
          className={`min-w-0 overflow-hidden border border-[#e6e1d7] bg-white ${
            selectedOrder && mobilePane === 'list' ? 'hidden xl:block' : ''
          }`}
        >
          <div className="border-b border-[#edeae1] p-4 sm:p-5">
            <button
              type="button"
              onClick={() => setMobilePane('list')}
              className="mb-3 flex items-center gap-1.5 text-[11px] font-medium text-[#9c7a4e] xl:hidden"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to orders
            </button>

            <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-[#9c7a4e]">
              Order Details
            </p>

            <div className="mt-1 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-serif text-lg text-[#23201b]">
                  {selectedOrder ? 'Order Summary' : 'Select an order'}
                </h2>

                {selectedOrder && (
                  <p className="mt-1 max-w-[210px] truncate text-[9px] text-[#a19a8c]">
                    Reference: {getOrderId(selectedOrder)}
                  </p>
                )}
              </div>

              {selectedOrder && (
                <span
                  className={`shrink-0 px-2.5 py-1 text-[9px] font-medium ${
                    statusStyles(selectedOrder.status).className
                  }`}
                >
                  {selectedOrder.status || 'Pending'}
                </span>
              )}
            </div>
          </div>

          {!selectedOrder ? (
            <div className="flex min-h-[300px] items-center justify-center px-6 text-center text-xs text-[#a19a8c]">
              Select an order to view its details.
            </div>
          ) : (
            <div className="space-y-5 p-4 sm:p-5">
              {/* CUSTOMER */}
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-[#a19a8c]">
                  Customer
                </p>

                <p className="mt-2 text-sm font-medium text-[#23201b]">
                  {getCustomer(selectedOrder)}
                </p>

                {getCustomerEmail(selectedOrder) && (
                  <p className="mt-1 break-all text-xs text-[#8a8377]">
                    {getCustomerEmail(selectedOrder)}
                  </p>
                )}

                {selectedOrder.phone || selectedOrder.customer_phone ? (
                  <p className="mt-1 text-xs text-[#8a8377]">
                    {selectedOrder.phone || selectedOrder.customer_phone}
                  </p>
                ) : null}
              </div>

              {/* ORDER META */}
              <div className="grid grid-cols-2 gap-3">
                <InfoBox label="Order Date" value={formatDate(getDate(selectedOrder))} />
                <InfoBox label="Order Total" value={formatMoney(getAmount(selectedOrder))} />
              </div>

              {/* ITEMS */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-[#a19a8c]">
                    Items
                  </p>

                  <span className="text-[10px] text-[#a19a8c]">
                    {getItems(selectedOrder).length} item
                    {getItems(selectedOrder).length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="mt-2 space-y-2">
                  {getItems(selectedOrder).length === 0 ? (
                    <div className="border border-dashed border-[#e6e1d7] p-4 text-center text-xs text-[#a19a8c]">
                      No item details returned by the API.
                    </div>
                  ) : (
                    getItems(selectedOrder).map((item, index) => (
                      <div
                        key={item.id || `${item.name}-${index}`}
                        className="flex items-center justify-between gap-3 border border-[#edeae1] bg-[#fbfaf7] p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-[#23201b]">
                            {item.product_name ||
                              item.productName ||
                              item.name ||
                              item.product_id ||
                              item.productId ||
                              'Product'}
                          </p>

                          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-[#a19a8c]">
                            {item.quantity ?? item.qty ? (
                              <span>Qty: {item.quantity ?? item.qty}</span>
                            ) : null}
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && <span>Color: {item.color}</span>}
                          </div>
                        </div>

                        <span className="shrink-0 text-xs font-medium text-[#23201b]">
                          {formatMoney(Number(item.total ?? item.price ?? 0))}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ADDRESS */}
              {getAddress(selectedOrder) && (
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-[#a19a8c]">
                    Shipping Address
                  </p>

                  <p className="mt-2 text-xs leading-5 text-[#5a5449]">
                    {getAddress(selectedOrder)}
                  </p>
                </div>
              )}

              {/* STATUS UPDATE */}
              <div className="border-t border-[#edeae1] pt-5">
                <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-[#a19a8c]">
                  Update Status
                </p>

                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <select
                      value={status}
                      onChange={(event) => setStatus(event.target.value)}
                      className="h-10 w-full appearance-none border border-[#d8d2c4] bg-white px-3 pr-9 text-xs text-[#23201b] outline-none focus:border-[#9c7a4e]"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a8377]" />
                  </div>

                  <button
                    type="button"
                    onClick={updateOrderStatus}
                    disabled={updating || !status || status === selectedOrder.status}
                    className="h-10 bg-[#23201b] px-5 text-xs font-medium tracking-wide text-white transition hover:bg-[#3a352c] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {updating ? 'Updating...' : 'Update'}
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
    <div className="border border-[#e6e1d7] bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-wide text-[#8a8377]">{title}</p>
        <Icon className="h-4 w-4 text-[#9c7a4e]" />
      </div>

      <p className="mt-2 font-serif text-2xl text-[#23201b]">{value}</p>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#fbfaf7] p-3">
      <p className="text-[9px] uppercase tracking-wide text-[#a19a8c]">{label}</p>
      <p className="mt-1 text-xs font-medium leading-5 text-[#3d3830]">{value}</p>
    </div>
  );
}