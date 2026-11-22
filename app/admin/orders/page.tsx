"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Package,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

import { apiUrl } from "@/lib/api-url";
import { getAdminToken } from "@/components/admin/admin-auth";
import { AdminCancelDialog } from "@/components/admin/cancel-order-dialog";
import { RefundHistory } from "@/components/admin/refund-history";

/* =========================================================
   TYPES
========================================================= */

type OrderItem = {
  id?: string;

  product_id?: string;
  productId?: string;

  variant_id?: string;
  variantId?: string;

  product_name?: string;
  productName?: string;
  name?: string;

  product_image?: string;
  productImage?: string;

  quantity?: number;
  qty?: number;

  unit_price?: number;
  unitPrice?: number;

  unit_mrp?: number;
  unitMrp?: number;

  price?: number;
  total?: number;

  size?: string;
  color?: string;

  created_at?: string;
};

type Order = {
  id?: string;

  order_id?: string;
  orderId?: string;

  order_number?: string;
  orderNumber?: string;

  user_id?: string;
  userId?: string;

  customer_id?: string;
  customerId?: string;

  customer_name?: string;
  customerName?: string;

  customer_email?: string;
  customerEmail?: string;

  email?: string;

  phone?: string;
  customer_phone?: string;

  shipping_name?: string;
  shipping_phone?: string;
  shipping_pincode?: string;
  shipping_address?: any;
  shipping_city?: string;
  shipping_state?: string;

  total?: number;
  total_amount?: number;
  cod_fee?: number | string;
  cod_fee_tax?: number | string;
  totalAmount?: number;

  grand_total?: number;
  grandTotal?: number;

  amount?: number;

  payment_method?: string;
  paymentMethod?: string;

  payment_status?: string;
  paymentStatus?: string;

  status?: string;

  created_at?: string;
  createdAt?: string;
  date?: string;

  updated_at?: string;

  items?: OrderItem[];
  order_items?: OrderItem[];
  orderItems?: OrderItem[];
};

/* =========================================================
   STATUS OPTIONS
========================================================= */

const STATUS_OPTIONS = [
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
];

/* =========================================================
   API REQUEST
========================================================= */

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = getAdminToken();

  const response = await fetch(apiUrl(path), {
    ...options,

    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...(options?.headers || {}),
    },

    cache: "no-store",
  });

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

/* =========================================================
   ARRAY HELPER
========================================================= */

function arrayFrom<T>(
  data: any,
  key: string
): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.[key])) {
    return data[key];
  }

  if (Array.isArray(data?.data?.[key])) {
    return data.data[key];
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

/* =========================================================
   IMPORTANT:
   DATABASE ID
   Used for API calls
========================================================= */

function getOrderId(order: Order) {
  return String(
    order.id ||
      order.order_id ||
      order.orderId ||
      ""
  );
}

/* =========================================================
   ORDER NUMBER
   Used only for display
========================================================= */

function getOrderNumber(
  order: Order
) {
  return String(
    order.order_number ||
      order.orderNumber ||
      getOrderId(order) ||
      ""
  );
}

/* =========================================================
   CUSTOMER
========================================================= */

function getCustomer(
  order: Order
) {
  return (
    order.shipping_name ||
    order.customer_name ||
    order.customerName ||
    order.customer_email ||
    order.customerEmail ||
    order.email ||
    "Customer"
  );
}

function getCustomerEmail(
  order: Order
) {
  return (
    order.customer_email ||
    order.customerEmail ||
    order.email ||
    ""
  );
}

function getPhone(
  order: Order
) {
  return (
    order.shipping_phone ||
    order.phone ||
    order.customer_phone ||
    ""
  );
}

/* =========================================================
   AMOUNT
========================================================= */

function getAmount(
  order: Order
) {
  const value = Number(
    order.total ??
      order.total_amount ??
      order.totalAmount ??
      order.grand_total ??
      order.grandTotal ??
      order.amount ??
      0
  );

  return Number.isFinite(value)
    ? value
    : 0;
}

/* =========================================================
   DATE
========================================================= */

function getDate(
  order: Order
) {
  return (
    order.created_at ||
    order.createdAt ||
    order.date ||
    ""
  );
}

/* =========================================================
   ITEMS
========================================================= */

function getItems(
  order: Order
): OrderItem[] {
  return (
    order.items ||
    order.order_items ||
    order.orderItems ||
    []
  );
}

/* =========================================================
   MONEY
========================================================= */

function formatMoney(
  value: number
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
  value?: string
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function shortDate(
  value?: string
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

/* =========================================================
   STATUS STYLE
========================================================= */

/* Internal refund bookkeeping (never shown to customers). */
function refundState(order: Order) {
  const status = String(order.status || "").toLowerCase();
  const payment = String(
    order.payment_status || order.paymentStatus || ""
  ).toLowerCase();

  if (status === "cancellation requested") return "pending"; // legacy
  if (status === "cancelled" && payment === "refund pending")
    return "pending";
  if (status === "cancelled" && payment === "refunded") return "refunded";
  // Some money went back (partial cancellation or return); the rest was kept.
  if (payment === "partially refunded") return "partial";
  return "none";
}

function RefundBadge({ order }: { order: Order }) {
  const state = refundState(order);
  if (state === "none") return null;

  if (state === "partial") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#E6E5FA] px-2 py-1 text-[12px] font-bold uppercase tracking-wide text-[#2E2699]">
        Partially Refunded
      </span>
    );
  }

  return state === "pending" ? (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#FBEFD3] px-2 py-1 text-[12px] font-bold uppercase tracking-wide text-[#7A4F00]">
      Refund Pending
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#DDF2E8] px-2 py-1 text-[12px] font-bold uppercase tracking-wide text-[#17603F]">
      Refunded
    </span>
  );
}

function statusStyles(
  status?: string
) {
  const value =
    String(status || "").toLowerCase();

  // Customer asked to cancel, refund still outstanding: needs admin attention,
  // so it must not look like a finished (red) cancellation.
  if (value.includes("request")) {
    return {
      className:
        "border-transparent bg-[#FBEFD3] text-[#7A4F00]",
      icon: Clock3,
    };
  }

  if (value.includes("cancel")) {
    return {
      className:
        "border-transparent bg-[#FBE3DF] text-[#9A2C1F]",
      icon: XCircle,
    };
  }

  if (value.includes("return")) {
    return {
      className:
        "border-transparent bg-[#FBEFD3] text-[#7A4F00]",
      icon: Package,
    };
  }

  if (value.includes("deliver")) {
    return {
      className:
        "border-transparent bg-[#DDF2E8] text-[#17603F]",
      icon: CheckCircle2,
    };
  }

  if (value.includes("ship")) {
    return {
      className:
        "border-transparent bg-[#E6E5FA] text-[#2E2699]",
      icon: Truck,
    };
  }

  if (
    value.includes("process") ||
    value.includes("pack") ||
    value.includes("confirm")
  ) {
    return {
      className:
        "border-transparent bg-[#E6E5FA] text-[#2E2699]",
      icon: PackageCheck,
    };
  }

  return {
    className:
      "border-transparent bg-[#FBEFD3] text-[#7A4F00]",
    icon: Clock3,
  };
}

/* =========================================================
   ADDRESS
========================================================= */

function getAddress(
  order: Order
) {
  const address =
    order.shipping_address;

  if (address) {
    if (
      typeof address ===
      "string"
    ) {
      return address;
    }

    if (
      typeof address ===
      "object"
    ) {
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
        .join(", ");
    }
  }

  return [
    order.shipping_name,
    order.shipping_city,
    order.shipping_state,
    order.shipping_pincode,
  ]
    .filter(Boolean)
    .join(", ");
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function AdminOrdersPage() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [
    selectedOrderId,
    setSelectedOrderId,
  ] = useState("");

  const [
    expandedOrderId,
    setExpandedOrderId,
  ] = useState("");

  const [status, setStatus] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    activeFilter,
    setActiveFilter,
  ] = useState("All");

  const [
    mobilePane,
    setMobilePane,
  ] = useState<
    "list" | "detail"
  >("list");

  const [loading, setLoading] =
    useState(true);

  const [updating, setUpdating] =
    useState(false);

  // Cancelling needs a reason (and may be partial), so it has its own dialog.
  const [cancelDialogOpen, setCancelDialogOpen] =
    useState(false);

  const [retrying, setRetrying] =
    useState(false);

  // Synchronous lock: state alone updates too late to stop a fast double click.
  const retryLock = useRef(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =======================================================
     LOAD ORDERS
  ======================================================= */

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response =
        await request<any>(
          "/api/orders/admin/all"
        );

      const nextOrders =
        arrayFrom<Order>(
          response,
          "orders"
        );

      setOrders(nextOrders);

      if (
        nextOrders.length > 0
      ) {
        const firstId =
          getOrderId(
            nextOrders[0]
          );

        setSelectedOrderId(
          (current) => {
            if (
              current &&
              nextOrders.some(
                (order) =>
                  getOrderId(
                    order
                  ) === current
              )
            ) {
              return current;
            }

            return firstId;
          }
        );
      } else {
        setSelectedOrderId("");
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  /* =======================================================
     TOTALS
  ======================================================= */

  const totals =
    useMemo(() => {
      const statuses =
        orders.map(
          (order) =>
            String(
              order.status || ""
            ).toLowerCase()
        );

      return {
        all: orders.length,

        pending:
          statuses.filter(
            (value) =>
              value ===
              "pending"
          ).length,

        processing:
          statuses.filter(
            (value) =>
              [
                "confirmed",
                "processing",
                "packed",
              ].includes(value)
          ).length,

        shipped:
          statuses.filter(
            (value) =>
              value ===
              "shipped"
          ).length,

        delivered:
          statuses.filter(
            (value) =>
              value.includes(
                "deliver"
              )
          ).length,

        cancellations:
          statuses.filter(
            (value) =>
              value ===
              "cancellation requested"
          ).length,
      };
    }, [orders]);

  /* =======================================================
     FILTERED ORDERS
  ======================================================= */

  const filteredOrders =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return orders.filter(
        (order) => {
          const currentStatus =
            String(
              order.status || ""
            ).toLowerCase();

          let matchesFilter =
            true;

          if (
            activeFilter ===
            "Pending"
          ) {
            matchesFilter =
              currentStatus ===
              "pending";
          }

          if (
            activeFilter ===
            "Processing"
          ) {
            matchesFilter = [
              "confirmed",
              "processing",
              "packed",
            ].includes(
              currentStatus
            );
          }

          if (
            activeFilter ===
            "Shipped"
          ) {
            matchesFilter =
              currentStatus ===
              "shipped";
          }

          if (
            activeFilter ===
            "Delivered"
          ) {
            matchesFilter =
              currentStatus.includes(
                "deliver"
              );
          }

          if (
            activeFilter ===
            "Cancellations"
          ) {
            matchesFilter =
              currentStatus ===
              "cancellation requested";
          }

          if (!matchesFilter) {
            return false;
          }

          if (!query) {
            return true;
          }

          const id =
            getOrderId(
              order
            ).toLowerCase();

          const orderNumber =
            getOrderNumber(
              order
            ).toLowerCase();

          const customer =
            getCustomer(
              order
            ).toLowerCase();

          const email =
            getCustomerEmail(
              order
            ).toLowerCase();

          const phone =
            getPhone(
              order
            ).toLowerCase();

          return (
            id.includes(query) ||
            orderNumber.includes(
              query
            ) ||
            customer.includes(
              query
            ) ||
            email.includes(
              query
            ) ||
            phone.includes(
              query
            ) ||
            currentStatus.includes(
              query
            )
          );
        }
      );
    }, [
      orders,
      search,
      activeFilter,
    ]);

  /* =======================================================
     SELECTED ORDER
  ======================================================= */

  const selectedOrder =
    useMemo(() => {
      return (
        orders.find(
          (order) =>
            getOrderId(
              order
            ) ===
            selectedOrderId
        ) || null
      );
    }, [
      orders,
      selectedOrderId,
    ]);

  useEffect(() => {
    if (selectedOrder) {
      setStatus(
        selectedOrder.status ||
          "Confirmed"
      );
    }
  }, [selectedOrder]);

  /* =======================================================
     SELECT ORDER
  ======================================================= */

  function selectOrder(
    id: string
  ) {
    if (!id) {
      return;
    }

    setSelectedOrderId(id);
    setMobilePane("detail");
    setError("");
    setSuccess("");
  }

  /* =======================================================
     UPDATE ORDER STATUS

     IMPORTANT:
     selectedOrderId = DATABASE ID
     NOT order_number
  ======================================================= */

  async function updateOrderStatus() {
    if (
      !selectedOrderId ||
      !status
    ) {
      return;
    }

    if (status === "Cancelled") {
      setCancelDialogOpen(true);
      return;
    }

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      await request(
        `/api/orders/admin/${encodeURIComponent(
          selectedOrderId
        )}/status`,
        {
          method: "PATCH",

          body: JSON.stringify({
            status,
          }),
        }
      );

      setOrders(
        (current) =>
          current.map(
            (order) =>
              getOrderId(
                order
              ) ===
              selectedOrderId
                ? {
                    ...order,
                    status,
                  }
                : order
          )
      );

      setSuccess(
        `Order #${getOrderNumber(
          selectedOrder || {}
        )} status updated successfully.`
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to update order status."
      );
    } finally {
      setUpdating(false);
    }
  }

  /* =======================================================
     RETRY REFUND FOR A PENDING CANCELLATION

     The server re-checks everything (status, Razorpay's own
     refund list) so a double click can never refund twice.
     The order only becomes Cancelled once Razorpay accepts
     the refund; otherwise the server explains what is missing.
  ======================================================= */

  async function retryRefund() {
    if (
      !selectedOrderId ||
      retryLock.current
    ) {
      return;
    }

    retryLock.current = true;

    try {
      setRetrying(true);
      setError("");
      setSuccess("");

      const response =
        await request<any>(
          `/api/orders/admin/${encodeURIComponent(
            selectedOrderId
          )}/retry-refund`,
          {
            method: "PATCH",
          }
        );

      setSuccess(
        response?.message ||
          "Refund checked."
      );

      // Reload so status and payment status come from the server.
      await loadOrders();
    } catch (err: any) {
      // The request may already have been completed elsewhere: reload first
      // (loadOrders clears the error), then show why this attempt failed.
      await loadOrders();

      setError(
        err?.message ||
          "Unable to retry the refund."
      );
    } finally {
      retryLock.current = false;
      setRetrying(false);
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-full bg-[#F5F6FA] text-[#5A6075]">

      {cancelDialogOpen && selectedOrderId && (
        <AdminCancelDialog
          orderId={selectedOrderId}
          orderNumber={getOrderNumber(selectedOrder || {})}
          onClose={() => setCancelDialogOpen(false)}
          onDone={async (text) => {
            setCancelDialogOpen(false);
            setError("");
            setSuccess(text);
            await loadOrders();
          }}
        />
      )}

      <div className="p-4 sm:p-6 lg:p-8">

        {/* ==================================================
            HEADER
        ================================================== */}

        <section className="mb-6 flex flex-col gap-4 border-b border-[#E3E5EE] pb-6 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-[13px] font-semibold uppercase tracking-[0.32em] text-[#4338CA]">
              Store Management
            </p>

            <h1 className="mt-2 text-[32px] font-bold text-[#11162B] sm:text-[40px]">
              Orders
            </h1>

            <p className="mt-2 text-[15px] text-[#5A6075]">
              Review customer orders and move each one through fulfilment.
            </p>

          </div>

          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="flex h-11 w-fit items-center gap-2 rounded-lg border border-[#E3E5EE] bg-white px-4 text-[13px] font-semibold text-[#5A6075] transition hover:border-[#4338CA] hover:text-[#4338CA] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>

        </section>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-4 rounded-lg border border-[#9A2C1F]/30 bg-[#FBE3DF]/8 px-4 py-3 text-[13px] text-[#9A2C1F]">
            {error}
          </div>
        )}

        {/* ==================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="mb-4 rounded-lg border border-[#E3E5EE] bg-[#F5F6FA] px-4 py-3 text-[13px] text-[#17603F]">
            {success}
          </div>
        )}

        {/* ==================================================
            STATS
        ================================================== */}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">

          <OrderStat
            title="All Orders"
            value={
              loading
                ? "—"
                : totals.all
            }
            icon={ShoppingBag}
          />

          <OrderStat
            title="Pending"
            value={
              loading
                ? "—"
                : totals.pending
            }
            icon={Clock3}
          />

          <OrderStat
            title="Processing"
            value={
              loading
                ? "—"
                : totals.processing
            }
            icon={PackageCheck}
          />

          <OrderStat
            title="Shipped"
            value={
              loading
                ? "—"
                : totals.shipped
            }
            icon={Truck}
          />

          <OrderStat
            title="Delivered"
            value={
              loading
                ? "—"
                : totals.delivered
            }
            icon={CheckCircle2}
          />

        </section>

        {/* ==================================================
            MAIN
        ================================================== */}

        <section className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_440px] 2xl:items-start">

          {/* ==================================================
              ORDER LIST
          ================================================== */}

          <div
            className={`min-w-0 overflow-hidden rounded-xl border border-[#E3E5EE] bg-white`}
          >

            {/* LIST HEADER */}

            <div className="border-b border-[#E3E5EE] p-4 sm:p-5">

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <h2 className="font-bold text-lg text-[#11162B]">
                    All Orders
                  </h2>

                  <p className="mt-1 text-[13px] text-[#5A6075]">
                    {
                      filteredOrders.length
                    }{" "}
                    order
                    {filteredOrders.length ===
                    1
                      ? ""
                      : "s"}
                  </p>

                </div>

                {/* SEARCH */}

                <div className="relative w-full lg:max-w-[280px]">

                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A6075]" />

                  <input
                    value={search}
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event.target
                          .value
                      )
                    }
                    placeholder="Search order or customer..."
                    className="h-10 w-full rounded-lg border border-[#E3E5EE] bg-white pl-10 pr-3 text-[13px] text-[#5A6075] outline-none placeholder:text-[#5A6075] focus:border-[#4338CA]"
                  />

                </div>

              </div>

              {/* FILTER TABS */}

              <div className="mt-5 flex overflow-x-auto border-b border-[#E3E5EE]">

                {[
                  "All",
                  "Pending",
                  "Processing",
                  "Shipped",
                  "Delivered",
                  "Cancellations",
                ].map(
                  (filter) => {

                    const count =
                      filter ===
                      "All"
                        ? totals.all
                        : filter ===
                          "Pending"
                        ? totals.pending
                        : filter ===
                          "Processing"
                        ? totals.processing
                        : filter ===
                          "Shipped"
                        ? totals.shipped
                        : filter ===
                          "Cancellations"
                        ? totals.cancellations
                        : totals.delivered;

                    const active =
                      activeFilter ===
                      filter;

                    return (
                      <button
                        key={
                          filter
                        }
                        type="button"
                        onClick={() =>
                          setActiveFilter(
                            filter
                          )
                        }
                        className={`relative shrink-0 px-4 py-3 text-[13px] font-semibold ${
                          active
                            ? "text-[#4338CA]"
                            : "text-[#5A6075]"
                        }`}
                      >

                        {filter}

                        <span
                          className={`ml-2 rounded-full px-1.5 py-0.5 text-[13px] ${
                            active
                              ? "bg-[#4338CA]/10 text-[#4338CA]"
                              : "bg-[#F5F6FA] text-[#5A6075]"
                          }`}
                        >
                          {count}
                        </span>

                        {active && (
                          <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#4338CA]" />
                        )}

                      </button>
                    );
                  }
                )}

              </div>

            </div>

            {/* ==================================================
                LOADING
            ================================================== */}

            {loading ? (
              <div className="space-y-2 p-4">

                {[1, 2, 3, 4].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-20 animate-pulse rounded-lg bg-[#F5F6FA]"
                    />
                  )
                )}

              </div>
            ) : filteredOrders.length ===
              0 ? (

              <div className="flex min-h-[300px] items-center justify-center px-6 text-center">

                <div>

                  <ShoppingBag className="mx-auto h-8 w-8 text-[#5A6075]" />

                  <p className="font-bold mt-3 text-lg text-[#11162B]">
                    No orders found
                  </p>

                  <p className="mt-1 text-[13px] text-[#5A6075]">
                    {search
                      ? "Try another search."
                      : "Orders will appear here when available."}
                  </p>

                </div>

              </div>

            ) : (

              <>
                {/* ==================================================
                    DESKTOP TABLE
                ================================================== */}

                <div className="hidden overflow-x-auto md:block">

                  <table className="w-full border-collapse">

                    <thead>

                      <tr className="border-b border-[#E3E5EE] bg-[#F5F6FA]">

                        <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5A6075]">
                          Order
                        </th>

                        <th className="px-3 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5A6075]">
                          Customer
                        </th>

                        <th className="px-3 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5A6075]">
                          Items
                        </th>

                        <th className="px-3 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5A6075]">
                          Status
                        </th>

                        <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5A6075]">
                          Total
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {filteredOrders.map(
                        (
                          order,
                          index
                        ) => {

                          const databaseId =
                            getOrderId(
                              order
                            );

                          const orderNumber =
                            getOrderNumber(
                              order
                            );

                          const items =
                            getItems(
                              order
                            );

                          const style =
                            statusStyles(
                              order.status
                            );

                          const StatusIcon =
                            style.icon;

                          const expanded =
                            expandedOrderId ===
                            databaseId;

                          return (
                            <Fragment
                              key={
                                databaseId ||
                                `${orderNumber}-${index}`
                              }
                            >

                              {/* ===============================
                                  ORDER ROW
                              =============================== */}

                              <tr
                                onClick={() =>
                                  selectOrder(
                                    databaseId
                                  )
                                }
                                className={`cursor-pointer border-b border-[#E3E5EE] transition ${
                                  selectedOrderId ===
                                  databaseId
                                    ? "bg-[#E6E5FA]/40"
                                    : "hover:bg-[#F5F6FA]"
                                }`}
                              >

                                {/* ORDER */}

                                <td className="px-4 py-4">

                                  <div className="flex min-w-0 items-center gap-3">

                                    <div className="min-w-0">

                                      <p className="truncate text-[15px] font-semibold text-[#11162B]">
                                        #
                                        {
                                          orderNumber
                                        }
                                      </p>

                                      <p className="mt-1 truncate text-[13px] text-[#5A6075]">
                                        {formatDate(getDate(order))}
                                      </p>

                                    </div>

                                  </div>

                                </td>

                                {/* CUSTOMER */}

                                <td className="max-w-[220px] px-3 py-4">

                                  <p className="truncate text-[15px] font-semibold text-[#11162B]">
                                    {getCustomer(
                                      order
                                    )}
                                  </p>

                                  <p className="mt-1 truncate text-[13px] text-[#5A6075]">
                                    {getPhone(
                                      order
                                    ) ||
                                      "—"}
                                  </p>

                                </td>

                                {/* ITEMS */}

                                <td className="px-3 py-4 text-center">

                                  <button
                                    type="button"
                                    onClick={(
                                      event
                                    ) => {

                                      event.stopPropagation();

                                      setExpandedOrderId(
                                        expanded
                                          ? ""
                                          : databaseId
                                      );

                                    }}
                                    className="inline-flex h-8 min-w-[34px] items-center justify-center rounded-lg border border-[#E3E5EE] bg-[#F5F6FA] px-2 text-[13px] font-bold text-[#4338CA] hover:border-[#4338CA]"
                                  >
                                    {
                                      items.length
                                    }
                                  </button>

                                </td>

                                {/* STATUS */}

                                <td className="px-3 py-4">

                                  <div className="flex flex-col items-start gap-1.5">

                                  <span
                                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[13px] font-semibold ${style.className}`}
                                  >

                                    <StatusIcon className="h-3 w-3" />

                                    {order.status ||
                                      "Pending"}

                                  </span>

                                  <RefundBadge order={order} />

                                  </div>

                                </td>

                                {/* TOTAL */}

                                <td className="whitespace-nowrap px-4 py-4 text-right">

                                  <span className="text-[15px] font-bold text-[#11162B]">
                                    {formatMoney(
                                      getAmount(
                                        order
                                      )
                                    )}
                                  </span>

                                </td>

                              </tr>

                              {/* =================================================
                                  EXPANDED ITEM ROW
                              ================================================= */}

                              {expanded && (

                                <tr className="border-b border-[#E3E5EE] bg-[#F5F6FA]">

                                  <td
                                    colSpan={5}
                                    className="px-4 py-4"
                                  >

                                    <div className="rounded-xl border border-[#E3E5EE] bg-white p-4">

                                      <div className="mb-3 flex items-center justify-between">

                                        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#5A6075]">
                                          Order Items
                                        </p>

                                        <span className="text-[13px] text-[#5A6075]">
                                          {
                                            items.length
                                          }{" "}
                                          item
                                          {
                                            items.length ===
                                            1
                                              ? ""
                                              : "s"
                                          }
                                        </span>

                                      </div>

                                      <div className="space-y-2">

                                        {items.length ===
                                        0 ? (

                                          <div className="rounded-lg border border-dashed border-[#E3E5EE] p-5 text-center text-[13px] text-[#5A6075]">
                                            No item details returned by the API.
                                          </div>

                                        ) : (

                                          items.map(
                                            (
                                              item,
                                              itemIndex
                                            ) => {

                                              const name =
                                                item.product_name ||
                                                item.productName ||
                                                item.name ||
                                                item.product_id ||
                                                item.productId ||
                                                "Product";

                                              const quantity =
                                                Number(
                                                  item.quantity ??
                                                    item.qty ??
                                                    1
                                                );

                                              const unitPrice =
                                                Number(
                                                  item.unit_price ??
                                                    item.unitPrice ??
                                                    item.price ??
                                                    0
                                                );

                                              const total =
                                                Number(
                                                  item.total ??
                                                    unitPrice *
                                                      quantity
                                                );

                                              const image =
                                                item.product_image ||
                                                item.productImage;

                                              return (
                                                <div
                                                  key={
                                                    item.id ||
                                                    `${name}-${itemIndex}`
                                                  }
                                                  className="flex items-center gap-4 rounded-lg border border-[#E3E5EE] bg-white p-3"
                                                >

                                                  {/* IMAGE */}

                                                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#E3E5EE] bg-[#F5F6FA]">

                                                    {image ? (

                                                      <img
                                                        src={
                                                          image
                                                        }
                                                        alt={
                                                          name
                                                        }
                                                        className="h-full w-full object-cover"
                                                      />

                                                    ) : (

                                                      <div className="flex h-full w-full items-center justify-center">

                                                        <Package className="h-5 w-5 text-[#5A6075]" />

                                                      </div>

                                                    )}

                                                  </div>

                                                  {/* INFO */}

                                                  <div className="min-w-0 flex-1">

                                                    <p className="truncate text-[15px] font-semibold text-[#11162B]">
                                                      {
                                                        name
                                                      }
                                                    </p>

                                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#5A6075]">

                                                      <span>
                                                        Qty:{" "}
                                                        {
                                                          quantity
                                                        }
                                                      </span>

                                                      {item.size && (
                                                        <span>
                                                          Size:{" "}
                                                          {
                                                            item.size
                                                          }
                                                        </span>
                                                      )}

                                                      {item.color && (
                                                        <span>
                                                          Color:{" "}
                                                          {
                                                            item.color
                                                          }
                                                        </span>
                                                      )}

                                                    </div>

                                                  </div>

                                                  {/* PRICE */}

                                                  <div className="shrink-0 text-right">

                                                    <p className="text-[15px] font-bold text-[#11162B]">
                                                      {formatMoney(
                                                        total
                                                      )}
                                                    </p>

                                                    <p className="mt-1 text-[13px] text-[#5A6075]">
                                                      {formatMoney(
                                                        unitPrice
                                                      )}{" "}
                                                      ×{" "}
                                                      {
                                                        quantity
                                                      }
                                                    </p>

                                                  </div>

                                                </div>
                                              );
                                            }
                                          )

                                        )}

                                      </div>

                                    </div>

                                  </td>

                                </tr>

                              )}

                            </Fragment>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

                {/* ==================================================
                    MOBILE
                ================================================== */}

                <div className="divide-y divide-[#E3E5EE] md:hidden">

                  {filteredOrders.map(
                    (
                      order,
                      index
                    ) => {

                      const databaseId =
                        getOrderId(
                          order
                        );

                      const orderNumber =
                        getOrderNumber(
                          order
                        );

                      const style =
                        statusStyles(
                          order.status
                        );

                      const StatusIcon =
                        style.icon;

                      return (
                        <button
                          key={
                            databaseId ||
                            `${orderNumber}-${index}`
                          }
                          type="button"
                          onClick={() =>
                            selectOrder(
                              databaseId
                            )
                          }
                          className={`flex w-full items-center justify-between gap-3 px-4 py-5 text-left ${
                            selectedOrderId ===
                            databaseId
                              ? "bg-[#F5F6FA]"
                              : ""
                          }`}
                        >

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E3E5EE] bg-[#F5F6FA] text-[#4338CA]">
                              <ShoppingBag className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">

                              <p className="truncate text-[15px] font-semibold text-[#11162B]">
                                #
                                {
                                  orderNumber
                                }
                              </p>

                              <p className="mt-1 truncate text-[13px] text-[#5A6075]">
                                {getCustomer(
                                  order
                                )}{" "}
                                ·{" "}
                                {shortDate(
                                  getDate(
                                    order
                                  )
                                )}
                              </p>

                              <span
                                className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[13px] font-semibold ${style.className}`}
                              >

                                <StatusIcon className="h-2.5 w-2.5" />

                                {order.status ||
                                  "Pending"}

                              </span>

                              <RefundBadge order={order} />

                            </div>

                          </div>

                          <div className="flex shrink-0 items-center gap-2">

                            <span className="text-[15px] font-bold text-[#11162B]">
                              {formatMoney(
                                getAmount(
                                  order
                                )
                              )}
                            </span>

                            <ChevronRight className="h-4 w-4 text-[#5A6075]" />

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

              </>

            )}

          </div>

          {/* ==================================================
              ORDER DETAILS
          ================================================== */}

          {selectedOrder && mobilePane === "detail" && (
            <div
              className="fixed inset-0 z-[55] bg-[#11162B]/40 2xl:hidden"
              onClick={() => setMobilePane("list")}
              aria-hidden="true"
            />
          )}

          <div
            role={selectedOrder && mobilePane === "detail" ? "dialog" : undefined}
            aria-label="Order details"
            className={`min-w-0 bg-white ${
              selectedOrder && mobilePane === "detail"
                ? "fixed inset-y-0 right-0 z-[60] w-full max-w-[480px] overflow-y-auto border-l border-[#E3E5EE]"
                : "hidden"
            } 2xl:sticky 2xl:top-[88px] 2xl:z-auto 2xl:block 2xl:max-h-[calc(100vh-112px)] 2xl:max-w-none 2xl:overflow-y-auto 2xl:rounded-xl 2xl:border`}
          >

            {/* DETAIL HEADER */}

            <div className="sticky top-0 z-10 border-b border-[#E3E5EE] bg-white px-5 py-4">

              <div className="flex items-center justify-between gap-3">

                <p className="text-[13px] font-semibold uppercase tracking-[0.24em] text-[#4338CA]">
                  Order Details
                </p>

                <button
                  type="button"
                  onClick={() => setMobilePane("list")}
                  aria-label="Close order details"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3E5EE] text-[#5A6075] transition hover:bg-[#F5F6FA] hover:text-[#11162B] 2xl:hidden"
                >
                  <XCircle className="h-4 w-4" />
                </button>

              </div>

              <h2 className="mt-2 break-all text-lg font-bold leading-snug text-[#11162B]">
                {selectedOrder
                  ? `#${getOrderNumber(selectedOrder)}`
                  : "Select an order"}
              </h2>

              {selectedOrder && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[13px] font-semibold ${
                      statusStyles(selectedOrder.status).className
                    }`}
                  >
                    {selectedOrder.status || "Pending"}
                  </span>
                  <RefundBadge order={selectedOrder} />
                </div>
              )}

            </div>

            {/* NO SELECTED ORDER */}

            {!selectedOrder ? (

              <div className="flex min-h-[350px] items-center justify-center px-6 text-center text-[13px] text-[#5A6075]">
                Select an order to view its details.
              </div>

            ) : (

              <div className="space-y-7 p-5">

                {/* CUSTOMER */}

                <div>

                  <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#5A6075]">
                    Customer
                  </p>

                  <p className="mt-2 text-base font-semibold text-[#11162B]">
                    {
                      getCustomer(
                        selectedOrder
                      )
                    }
                  </p>

                  {getCustomerEmail(
                    selectedOrder
                  ) && (
                    <p className="mt-1 break-all text-[13px] text-[#5A6075]">
                      {
                        getCustomerEmail(
                          selectedOrder
                        )
                      }
                    </p>
                  )}

                  {getPhone(
                    selectedOrder
                  ) && (
                    <p className="mt-1 text-[13px] text-[#5A6075]">
                      {
                        getPhone(
                          selectedOrder
                        )
                      }
                    </p>
                  )}

                </div>

                {/* META */}

                <div className="grid grid-cols-2 gap-3">

                  <InfoBox
                    label="Order Date"
                    value={formatDate(
                      getDate(
                        selectedOrder
                      )
                    )}
                  />

                  <InfoBox
                    label="Order Total"
                    value={formatMoney(
                      getAmount(
                        selectedOrder
                      )
                    )}
                  />

                  <InfoBox
                    label="Payment"
                    value={
                      selectedOrder.payment_method ||
                      selectedOrder.paymentMethod ||
                      "—"
                    }
                  />

                  {Number(selectedOrder.cod_fee) > 0 && (
                    <InfoBox
                      label="COD handling fee (incl. GST)"
                      value={formatMoney(
                        Number(selectedOrder.cod_fee) +
                          Number(selectedOrder.cod_fee_tax || 0)
                      )}
                    />
                  )}

                  <InfoBox
                    label="Items"
                    value={String(
                      getItems(
                        selectedOrder
                      ).length
                    )}
                  />

                </div>

                {/* ORDER ITEMS */}

                <div>

                  <div className="flex items-center justify-between">

                    <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#5A6075]">
                      Order Items
                    </p>

                    <span className="text-[13px] text-[#5A6075]">
                      {
                        getItems(
                          selectedOrder
                        ).length
                      }{" "}
                      item
                      {
                        getItems(
                          selectedOrder
                        ).length ===
                        1
                          ? ""
                          : "s"
                      }
                    </span>

                  </div>

                  <div className="mt-3 space-y-2">

                    {getItems(
                      selectedOrder
                    ).length === 0 ? (

                      <div className="rounded-lg border border-dashed border-[#E3E5EE] p-5 text-center text-[13px] text-[#5A6075]">
                        No item details returned by the API.
                      </div>

                    ) : (

                      getItems(
                        selectedOrder
                      ).map(
                        (
                          item,
                          index
                        ) => {

                          const name =
                            item.product_name ||
                            item.productName ||
                            item.name ||
                            item.product_id ||
                            item.productId ||
                            "Product";

                          const quantity =
                            Number(
                              item.quantity ??
                                item.qty ??
                                1
                            );

                          const unitPrice =
                            Number(
                              item.unit_price ??
                                item.unitPrice ??
                                item.price ??
                                0
                            );

                          const total =
                            Number(
                              item.total ??
                                unitPrice *
                                  quantity
                            );

                          const image =
                            item.product_image ||
                            item.productImage;

                          return (
                            <div
                              key={
                                item.id ||
                                `${name}-${index}`
                              }
                              className="flex gap-3 rounded-xl border border-[#E3E5EE] bg-white p-3"
                            >

                              {/* IMAGE */}

                              <div className="h-[68px] w-[68px] shrink-0 overflow-hidden rounded-lg border border-[#E3E5EE] bg-[#F5F6FA]">

                                {image ? (

                                  <img
                                    src={
                                      image
                                    }
                                    alt={
                                      name
                                    }
                                    className="h-full w-full object-cover"
                                  />

                                ) : (

                                  <div className="flex h-full w-full items-center justify-center">
                                    <Package className="h-5 w-5 text-[#5A6075]" />
                                  </div>

                                )}

                              </div>

                              {/* INFO */}

                              <div className="min-w-0 flex-1">

                                <p className="text-[15px] font-semibold text-[#11162B]">
                                  {
                                    name
                                  }
                                </p>

                                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-[#5A6075]">

                                  <span>
                                    Qty:{" "}
                                    {
                                      quantity
                                    }
                                  </span>

                                  {item.size && (
                                    <span>
                                      Size:{" "}
                                      {
                                        item.size
                                      }
                                    </span>
                                  )}

                                  {item.color && (
                                    <span>
                                      Color:{" "}
                                      {
                                        item.color
                                      }
                                    </span>
                                  )}

                                </div>

                                <p className="mt-2 text-[15px] font-bold text-[#11162B]">
                                  {formatMoney(
                                    total
                                  )}
                                </p>

                              </div>

                            </div>
                          );
                        }
                      )

                    )}

                  </div>

                </div>

                {/* REFUND HISTORY (cancellations and returns, with the safe Razorpay status check) */}

                <RefundHistory
                  orderId={selectedOrderId ?? selectedOrder.id ?? ""}
                  reloadKey={`${selectedOrder.status}-${selectedOrder.payment_status ?? selectedOrder.paymentStatus ?? ""}-${selectedOrder.updated_at ?? ""}`}
                  onChanged={loadOrders}
                />

                {/* SHIPPING ADDRESS */}

                {getAddress(
                  selectedOrder
                ) && (

                  <div>

                    <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#5A6075]">
                      Shipping Address
                    </p>

                    <div className="mt-3 rounded-xl border border-[#E3E5EE] bg-white p-4">

                      <p className="text-[13px] leading-6 text-[#5A6075]">
                        {
                          getAddress(
                            selectedOrder
                          )
                        }
                      </p>

                    </div>

                  </div>

                )}

                {/* ==================================================
                    PENDING CANCELLATION — review + retry refund
                ================================================== */}

                {refundState(selectedOrder) ===
                  "pending" && (
                  <div className="rounded-lg border border-[#7A4F00]/30 bg-[#7A4F00]/10 p-4">

                    <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#7A4F00]">
                      Refund pending
                    </p>

                    <p className="mt-2 text-[13px] leading-5 text-[#5A6075]">
                      The customer sees this order as
                      Cancelled. The Razorpay refund is
                      not confirmed yet: it could not be
                      started (for example, the Razorpay
                      balance was too low) or Razorpay has
                      not finished processing it. Add funds
                      if needed, then retry. Retrying first
                      checks Razorpay&apos;s own refund list, so
                      an existing refund is never duplicated,
                      and the order is only marked Refunded
                      once Razorpay confirms it is processed.
                    </p>

                    <button
                      type="button"
                      onClick={
                        retryRefund
                      }
                      disabled={
                        retrying
                      }
                      className="mt-3 h-11 rounded-lg border border-[#7A4F00]/30 bg-[#7A4F00] px-5 text-[13px] font-bold text-white transition hover:bg-[#7A4F00]/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {retrying
                        ? "Checking refund..."
                        : "Retry / check refund"}
                    </button>

                  </div>
                )}

                {/* ==================================================
                    UPDATE STATUS
                ================================================== */}

                <div className="border-t border-[#E3E5EE] pt-5">

                  <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#5A6075]">
                    Update Status
                  </p>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">

                    <div className="relative flex-1">

                      <select
                        value={status}
                        onChange={(
                          event
                        ) =>
                          setStatus(
                            event.target
                              .value
                          )
                        }
                        className="h-11 w-full appearance-none rounded-lg border border-[#E3E5EE] bg-white px-3 pr-9 text-[13px] font-medium text-[#5A6075] outline-none focus:border-[#4338CA]"
                      >

                        {STATUS_OPTIONS.map(
                          (
                            option
                          ) => (
                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                              className="bg-white"
                            >
                              {
                                option
                              }
                            </option>
                          )
                        )}

                      </select>

                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A6075]" />

                    </div>

                    <button
                      type="button"
                      onClick={
                        updateOrderStatus
                      }
                      disabled={
                        updating ||
                        !status ||
                        status ===
                          selectedOrder.status ||
                        String(
                          selectedOrder.status ||
                            ""
                        ).toLowerCase() ===
                          "cancellation requested"
                      }
                      className="h-11 rounded-lg border border-[#4338CA] bg-[#4338CA] px-6 text-[13px] font-bold text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {updating
                        ? "Updating..."
                        : "Update Status"}
                    </button>

                  </div>

                </div>

              </div>

            )}

          </div>

        </section>

      </div>

    </div>
  );
}

/* =========================================================
   ORDER STAT
========================================================= */

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
    <div className="rounded-xl border border-[#E3E5EE] bg-white p-4 sm:p-5">

      <div className="flex items-center justify-between">

        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5A6075]">
          {title}
        </p>

        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6E5FA] text-[#2E2699]"><Icon className="h-4 w-4" /></span>

      </div>

      <p className="mt-3 text-[28px] font-bold leading-none text-[#11162B]">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#E3E5EE] bg-[#F5F6FA] p-4">

      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5A6075]">
        {label}
      </p>

      <p className="mt-2 truncate text-[15px] font-semibold text-[#11162B]">
        {value}
      </p>

    </div>
  );
}