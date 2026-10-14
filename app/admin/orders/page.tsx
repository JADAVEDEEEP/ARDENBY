"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
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

function statusStyles(
  status?: string
) {
  const value =
    String(status || "").toLowerCase();

  if (value.includes("cancel")) {
    return {
      className:
        "border-red-900/50 bg-red-950/40 text-red-300",
      icon: XCircle,
    };
  }

  if (value.includes("return")) {
    return {
      className:
        "border-orange-900/50 bg-orange-950/40 text-orange-300",
      icon: Package,
    };
  }

  if (value.includes("deliver")) {
    return {
      className:
        "border-emerald-800/50 bg-emerald-950/40 text-emerald-300",
      icon: CheckCircle2,
    };
  }

  if (value.includes("ship")) {
    return {
      className:
        "border-sky-900/50 bg-sky-950/40 text-sky-300",
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
        "border-purple-900/50 bg-purple-950/40 text-purple-300",
      icon: PackageCheck,
    };
  }

  return {
    className:
      "border-yellow-900/50 bg-yellow-950/40 text-yellow-300",
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
     UI
  ======================================================= */

  return (
    <div className="min-h-full bg-[#031d13] text-[#eee8d9]">

      <div className="p-4 sm:p-6 lg:p-8">

        {/* ==================================================
            HEADER
        ================================================== */}

        <section className="mb-6 flex flex-col gap-4 border-b border-[#164b31] pb-6 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#c9a34e]">
              Store Management
            </p>

            <h1 className="mt-2 font-serif text-3xl text-[#f3ecdc] sm:text-[2.5rem]">
              Orders
            </h1>

            <p className="mt-2 text-[13px] text-[#829d8c]">
              Review customer orders and move each one through fulfilment.
            </p>

          </div>

          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="flex h-10 w-fit items-center gap-2 rounded-lg border border-[#285d43] bg-[#082b1b] px-4 text-[11px] font-semibold text-[#d7c9a7] transition hover:border-[#c9a34e] hover:text-[#c9a34e] disabled:opacity-50"
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
          <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* ==================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="mb-4 rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-4 py-3 text-xs text-emerald-300">
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
            MOBILE SWITCH
        ================================================== */}

        {selectedOrder && (
          <div className="mt-5 flex overflow-hidden rounded-lg border border-[#1d5438] bg-[#072a1a] xl:hidden">

            <button
              type="button"
              onClick={() =>
                setMobilePane(
                  "list"
                )
              }
              className={`flex-1 py-3 text-xs font-semibold ${
                mobilePane === "list"
                  ? "bg-[#123f28] text-[#d7b35a]"
                  : "text-[#8ca494]"
              }`}
            >
              Order List
            </button>

            <button
              type="button"
              onClick={() =>
                setMobilePane(
                  "detail"
                )
              }
              className={`flex-1 py-3 text-xs font-semibold ${
                mobilePane ===
                "detail"
                  ? "bg-[#123f28] text-[#d7b35a]"
                  : "text-[#8ca494]"
              }`}
            >
              Order Details
            </button>

          </div>
        )}

        {/* ==================================================
            MAIN
        ================================================== */}

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.85fr)]">

          {/* ==================================================
              ORDER LIST
          ================================================== */}

          <div
            className={`min-w-0 overflow-hidden rounded-xl border border-[#164b31] bg-[#05291a] ${
              selectedOrder &&
              mobilePane === "detail"
                ? "hidden xl:block"
                : ""
            }`}
          >

            {/* LIST HEADER */}

            <div className="border-b border-[#164b31] p-4 sm:p-5">

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <h2 className="font-serif text-lg text-[#f1eadb]">
                    All Orders
                  </h2>

                  <p className="mt-1 text-[11px] text-[#789487]">
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

                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f8d7d]" />

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
                    className="h-10 w-full rounded-lg border border-[#24563c] bg-[#082f1e] pl-10 pr-3 text-xs text-[#eee8d9] outline-none placeholder:text-[#5e7b6b] focus:border-[#b89548]"
                  />

                </div>

              </div>

              {/* FILTER TABS */}

              <div className="mt-5 flex overflow-x-auto border-b border-[#164b31]">

                {[
                  "All",
                  "Pending",
                  "Processing",
                  "Shipped",
                  "Delivered",
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
                        className={`relative shrink-0 px-5 py-3 text-xs font-semibold ${
                          active
                            ? "text-[#d7b35a]"
                            : "text-[#759282]"
                        }`}
                      >

                        {filter}

                        <span
                          className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] ${
                            active
                              ? "bg-[#5d481d] text-[#e5c875]"
                              : "bg-[#0c3824] text-[#668473]"
                          }`}
                        >
                          {count}
                        </span>

                        {active && (
                          <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#c9a34e]" />
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
                      className="h-20 animate-pulse rounded-lg bg-[#0a3824]"
                    />
                  )
                )}

              </div>
            ) : filteredOrders.length ===
              0 ? (

              <div className="flex min-h-[300px] items-center justify-center px-6 text-center">

                <div>

                  <ShoppingBag className="mx-auto h-8 w-8 text-[#476b58]" />

                  <p className="mt-3 font-serif text-lg text-[#c8c0ae]">
                    No orders found
                  </p>

                  <p className="mt-1 text-xs text-[#708b7b]">
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

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[720px] border-collapse">

                    <thead>

                      <tr className="border-b border-[#164b31] bg-[#06231a]">

                        <th className="px-4 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[#729080]">
                          Order
                        </th>

                        <th className="px-3 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[#729080]">
                          Customer
                        </th>

                        <th className="px-3 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[#729080]">
                          Date
                        </th>

                        <th className="px-3 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#729080]">
                          Items
                        </th>

                        <th className="px-3 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[#729080]">
                          Status
                        </th>

                        <th className="px-4 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-[#729080]">
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
                                className={`cursor-pointer border-b border-[#164b31] transition ${
                                  selectedOrderId ===
                                  databaseId
                                    ? "bg-[#0c3b25]"
                                    : "hover:bg-[#082f1e]"
                                }`}
                              >

                                {/* ORDER */}

                                <td className="px-4 py-5">

                                  <div className="flex min-w-0 items-center gap-3">

                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#315f48] bg-[#0d3925] text-[#c9a34e]">
                                      <ShoppingBag className="h-4 w-4" />
                                    </div>

                                    <div className="min-w-0">

                                      <p className="truncate text-sm font-semibold text-[#eee8d9]">
                                        #
                                        {
                                          orderNumber
                                        }
                                      </p>

                                      <p className="mt-1 truncate text-[10px] text-[#708c7c]">
                                        Order{" "}
                                        #
                                        {
                                          index +
                                          1
                                        }
                                      </p>

                                    </div>

                                  </div>

                                </td>

                                {/* CUSTOMER */}

                                <td className="max-w-[160px] px-3 py-5">

                                  <p className="truncate text-sm font-semibold text-[#e6dfd0]">
                                    {getCustomer(
                                      order
                                    )}
                                  </p>

                                  <p className="mt-1 truncate text-[10px] text-[#708c7c]">
                                    {getPhone(
                                      order
                                    ) ||
                                      "—"}
                                  </p>

                                </td>

                                {/* DATE */}

                                <td className="whitespace-nowrap px-3 py-5">

                                  <span className="text-xs text-[#a3b2a8]">
                                    {shortDate(
                                      getDate(
                                        order
                                      )
                                    )}
                                  </span>

                                </td>

                                {/* ITEMS */}

                                <td className="px-3 py-5 text-center">

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
                                    className="inline-flex h-8 min-w-[34px] items-center justify-center rounded-lg border border-[#285a40] bg-[#0a3823] px-2 text-xs font-bold text-[#d5b45e] hover:border-[#c9a34e]"
                                  >
                                    {
                                      items.length
                                    }
                                  </button>

                                </td>

                                {/* STATUS */}

                                <td className="px-3 py-5">

                                  <span
                                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[10px] font-semibold ${style.className}`}
                                  >

                                    <StatusIcon className="h-3 w-3" />

                                    {order.status ||
                                      "Pending"}

                                  </span>

                                </td>

                                {/* TOTAL */}

                                <td className="whitespace-nowrap px-4 py-5 text-right">

                                  <span className="text-sm font-bold text-[#d9b75d]">
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

                                <tr className="border-b border-[#164b31] bg-[#041f15]">

                                  <td
                                    colSpan={6}
                                    className="px-4 py-4"
                                  >

                                    <div className="rounded-xl border border-[#1d5438] bg-[#072a1b] p-4">

                                      <div className="mb-3 flex items-center justify-between">

                                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#809b8b]">
                                          Order Items
                                        </p>

                                        <span className="text-[10px] text-[#688474]">
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

                                          <div className="rounded-lg border border-dashed border-[#315c47] p-5 text-center text-xs text-[#789486]">
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
                                                  className="flex items-center gap-4 rounded-lg border border-[#1b4c34] bg-[#0a3421] p-3"
                                                >

                                                  {/* IMAGE */}

                                                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#285a40] bg-[#123b27]">

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

                                                        <Package className="h-5 w-5 text-[#597764]" />

                                                      </div>

                                                    )}

                                                  </div>

                                                  {/* INFO */}

                                                  <div className="min-w-0 flex-1">

                                                    <p className="truncate text-sm font-semibold text-[#f0eadc]">
                                                      {
                                                        name
                                                      }
                                                    </p>

                                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#8ca495]">

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

                                                    <p className="text-sm font-bold text-[#d9b75d]">
                                                      {formatMoney(
                                                        total
                                                      )}
                                                    </p>

                                                    <p className="mt-1 text-[10px] text-[#718b7c]">
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

                <div className="divide-y divide-[#164b31] md:hidden">

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
                              ? "bg-[#0b3a25]"
                              : ""
                          }`}
                        >

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#315f48] bg-[#0d3925] text-[#c9a34e]">
                              <ShoppingBag className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-[#eee8d9]">
                                #
                                {
                                  orderNumber
                                }
                              </p>

                              <p className="mt-1 truncate text-[10px] text-[#718b7c]">
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
                                className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold ${style.className}`}
                              >

                                <StatusIcon className="h-2.5 w-2.5" />

                                {order.status ||
                                  "Pending"}

                              </span>

                            </div>

                          </div>

                          <div className="flex shrink-0 items-center gap-2">

                            <span className="text-sm font-bold text-[#d9b75d]">
                              {formatMoney(
                                getAmount(
                                  order
                                )
                              )}
                            </span>

                            <ChevronRight className="h-4 w-4 text-[#597766]" />

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

          <div
            className={`min-w-0 overflow-hidden rounded-xl border border-[#164b31] bg-[#05291a] ${
              selectedOrder &&
              mobilePane === "list"
                ? "hidden xl:block"
                : ""
            }`}
          >

            {/* DETAIL HEADER */}

            <div className="border-b border-[#164b31] p-5">

              <button
                type="button"
                onClick={() =>
                  setMobilePane(
                    "list"
                  )
                }
                className="mb-4 flex items-center gap-1.5 text-[11px] font-semibold text-[#c9a34e] xl:hidden"
              >

                <ArrowLeft className="h-3.5 w-3.5" />

                Back to orders

              </button>

              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c9a34e]">
                Order Details
              </p>

              <div className="mt-2 flex items-center justify-between gap-3">

                <div className="min-w-0">

                  <h2 className="font-serif text-xl text-[#f1eadb]">
                    {selectedOrder
                      ? "Order Summary"
                      : "Select an order"}
                  </h2>

                  {selectedOrder && (
                    <p className="mt-1 truncate text-[10px] text-[#708b7b]">
                      #
                      {
                        getOrderNumber(
                          selectedOrder
                        )
                      }
                    </p>
                  )}

                </div>

                {selectedOrder && (
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold ${
                      statusStyles(
                        selectedOrder.status
                      ).className
                    }`}
                  >
                    {
                      selectedOrder.status ||
                      "Pending"
                    }
                  </span>
                )}

              </div>

            </div>

            {/* NO SELECTED ORDER */}

            {!selectedOrder ? (

              <div className="flex min-h-[350px] items-center justify-center px-6 text-center text-xs text-[#718b7c]">
                Select an order to view its details.
              </div>

            ) : (

              <div className="space-y-6 p-5">

                {/* CUSTOMER */}

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#718b7c]">
                    Customer
                  </p>

                  <p className="mt-2 text-base font-semibold text-[#eee8d9]">
                    {
                      getCustomer(
                        selectedOrder
                      )
                    }
                  </p>

                  {getCustomerEmail(
                    selectedOrder
                  ) && (
                    <p className="mt-1 break-all text-xs text-[#8da294]">
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
                    <p className="mt-1 text-xs text-[#8da294]">
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

                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#718b7c]">
                      Order Items
                    </p>

                    <span className="text-[10px] text-[#718b7c]">
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

                      <div className="rounded-lg border border-dashed border-[#315d47] p-5 text-center text-xs text-[#718b7c]">
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
                              className="flex gap-3 rounded-xl border border-[#1b4e35] bg-[#082f1e] p-3"
                            >

                              {/* IMAGE */}

                              <div className="h-[68px] w-[68px] shrink-0 overflow-hidden rounded-lg border border-[#2c5d43] bg-[#113b27]">

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
                                    <Package className="h-5 w-5 text-[#587766]" />
                                  </div>

                                )}

                              </div>

                              {/* INFO */}

                              <div className="min-w-0 flex-1">

                                <p className="text-sm font-semibold text-[#eee8d9]">
                                  {
                                    name
                                  }
                                </p>

                                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#839c8d]">

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

                                <p className="mt-2 text-sm font-bold text-[#d9b75d]">
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

                {/* SHIPPING ADDRESS */}

                {getAddress(
                  selectedOrder
                ) && (

                  <div>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#718b7c]">
                      Shipping Address
                    </p>

                    <div className="mt-3 rounded-xl border border-[#1b4e35] bg-[#082f1e] p-4">

                      <p className="text-xs leading-6 text-[#b0beb5]">
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
                    UPDATE STATUS
                ================================================== */}

                <div className="border-t border-[#164b31] pt-5">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#718b7c]">
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
                        className="h-11 w-full appearance-none rounded-lg border border-[#2a5b40] bg-[#082f1e] px-3 pr-9 text-xs font-medium text-[#eee8d9] outline-none focus:border-[#c9a34e]"
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
                              className="bg-[#082f1e]"
                            >
                              {
                                option
                              }
                            </option>
                          )
                        )}

                      </select>

                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#819789]" />

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
                          selectedOrder.status
                      }
                      className="h-11 rounded-lg border border-[#b38d3e] bg-[#b08b3d] px-6 text-xs font-bold text-[#061b11] transition hover:bg-[#d0ad5b] disabled:cursor-not-allowed disabled:opacity-40"
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
    <div className="rounded-xl border border-[#164b31] bg-[#05291a] p-4 sm:p-5">

      <div className="flex items-center justify-between">

        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#779383]">
          {title}
        </p>

        <Icon className="h-4 w-4 text-[#c9a34e]" />

      </div>

      <p className="mt-3 font-serif text-2xl text-[#eee8d9]">
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
    <div className="rounded-xl border border-[#1d5138] bg-[#082f1e] p-4">

      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#718b7c]">
        {label}
      </p>

      <p className="mt-2 truncate text-sm font-semibold text-[#e9e2d3]">
        {value}
      </p>

    </div>
  );
}