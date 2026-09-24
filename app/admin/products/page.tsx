"use client";

import { useEffect, useRef, useState } from "react";
import { apiUrl } from "@/lib/api-url";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  ImageOff,
  CheckCircle2,
  XCircle,
  Loader2,
  PackageOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  Shirt,
  Package,
  AlertTriangle,
  ArrowUpDown,
} from "lucide-react";

type Variant = {
  id?: string;
  product_id?: string;
  size: string;
  color: string;
  inventory: number;
  sku?: string;
};

type Image = {
  id?: string;
  image_url: string;
  is_primary?: boolean;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  category_slug?: string;
  category_label?: string;
  fit?: string;
  fabric?: string;
  coverage?: string;
  price?: number;
  mrp?: number;
  best_price?: number;
  rating?: number;
  review_count?: number;
  description?: string;
  fabric_details?: string;
  wash_care?: string;
  tags?: string;
  best_seller?: boolean;
  new_arrival?: boolean;
  trending?: boolean;
  limited_edition?: boolean;
  inventory?: number;
  images?: Image[];
  variants?: Variant[];
};

type Toast = {
  id: string;
  type: "success" | "error";
  message: string;
};

const emptyForm = {
  name: "",
  category_slug: "",
  category_label: "",
  fit: "",
  fabric: "",
  coverage: "",
  price: "",
  mrp: "",
  best_price: "",
  description: "",
  fabric_details: "",
  wash_care: "",
  tags: "",
  inventory: "0",
  best_seller: false,
  new_arrival: false,
  trending: false,
  limited_edition: false,
  variants: [] as Variant[],
};

/* shared UI tokens (presentation only) */
const inputCls =
  "w-full min-h-11 rounded-xl border border-[#e7e1d6] bg-[#fbf9f5] px-3.5 py-2.5 text-sm text-[#111] outline-none transition duration-200 placeholder:text-[#a9a294] hover:border-[#d8d0c2] focus:border-[#111] focus:bg-white focus:ring-4 focus:ring-[#b8975a]/10";
const labelCls =
  "mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-[#7d776b]";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("ardenby_admin_token")
      : null;

  const pushToast = (type: Toast["type"], message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const request = async (
    url: string,
    options: RequestInit = {}
  ) => {
    const headers = new Headers(options.headers);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || "Something went wrong");
    }

    return data;
  };

  const loadProducts = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search) params.set("search", search);
      if (category) params.set("category", category);

      params.set("page", "1");
      params.set("limit", "50");

      const data = await request(
        apiUrl(`/api/products?${params.toString()}`)
      );

      setProducts(data.products || []);
    } catch (error: any) {
      pushToast("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await request(apiUrl("/api/categories"));
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFiles([]);
    setModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      category_slug: product.category_slug || "",
      category_label: product.category_label || "",
      fit: product.fit || "",
      fabric: product.fabric || "",
      coverage: product.coverage || "",
      price: String(product.price ?? ""),
      mrp: String(product.mrp ?? ""),
      best_price: String(product.best_price ?? ""),
      description: product.description || "",
      fabric_details: product.fabric_details || "",
      wash_care: product.wash_care || "",
      tags: product.tags || "",
      inventory: String(product.inventory ?? 0),
      best_seller: !!product.best_seller,
      new_arrival: !!product.new_arrival,
      trending: !!product.trending,
      limited_edition: !!product.limited_edition,

      // IMPORTANT: preserve existing variant IDs
      variants:
        product.variants?.map((v) => ({
          id: v.id,
          product_id: v.product_id,
          size: v.size || "",
          color: v.color || "",
          inventory: Number(v.inventory || 0),
          sku: v.sku || "",
        })) || [],
    });

    setFiles([]);
    setModal(true);
  };

  const makeSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const saveProduct = async () => {
    try {
      if (!form.name.trim()) {
        pushToast("error", "Product name is required");
        return;
      }

      if (!form.coverage) {
        pushToast("error", "Please select coverage");
        return;
      }

      setSaving(true);

      const payload = new FormData();

      const productId =
        editingId || `ard-${Math.random().toString(36).slice(2, 10)}`;

      const slug = makeSlug(form.name);

      payload.append("id", productId);
      payload.append("slug", slug);
      payload.append("name", form.name.trim());

      payload.append("category_slug", form.category_slug);
      payload.append("category_label", form.category_label);

      payload.append("fit", form.fit);
      payload.append("fabric", form.fabric);
      payload.append("coverage", form.coverage);

      payload.append("price", form.price || "0");
      payload.append("mrp", form.mrp || "0");
      payload.append("best_price", form.best_price || "0");

      payload.append("rating", "0");
      payload.append("review_count", "0");

      payload.append("description", form.description);
      payload.append("fabric_details", form.fabric_details);
      payload.append("wash_care", form.wash_care);
      payload.append("tags", form.tags);

      payload.append("inventory", form.inventory || "0");

      payload.append("best_seller", String(form.best_seller));
      payload.append("new_arrival", String(form.new_arrival));
      payload.append("trending", String(form.trending));
      payload.append("limited_edition", String(form.limited_edition));

      payload.append(
        "variants",
        JSON.stringify(
          form.variants.map((v) => ({
            ...(v.id ? { id: v.id } : {}),
            size: v.size.trim(),
            color: v.color.trim(),
            inventory: Number(v.inventory || 0),
            sku: v.sku?.trim() || "",
          }))
        )
      );

      // IMPORTANT:
      // Append EVERY selected image using the same "images" field.
      // Multer must receive these as req.files on the backend.
      files.forEach((file) => {
        payload.append("images", file, file.name);
      });

      if (editingId) {
        await request(apiUrl(`/api/products/${editingId}`), {
          method: "PUT",
          body: payload,
        });
      } else {
        await request(apiUrl("/api/products"), {
          method: "POST",
          body: payload,
        });
      }

      pushToast(
        "success",
        editingId
          ? "Product updated successfully"
          : "Product added successfully"
      );

      setModal(false);
      setFiles([]);
      loadProducts();
    } catch (error: any) {
      pushToast("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;

    try {
      await request(apiUrl(`/api/products/${id}`), {
        method: "DELETE",
      });

      pushToast("success", "Product deleted successfully");
      loadProducts();
    } catch (error: any) {
      pushToast("error", error.message);
    }
  };

  const updateVariant = (
    index: number,
    field: keyof Variant,
    value: string | number
  ) => {
    setForm((prev) => {
      const variants = [...prev.variants];

      variants[index] = {
        ...variants[index],
        [field]: value,
      };

      return {
        ...prev,
        variants,
      };
    });
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          size: "",
          color: "",
          inventory: 0,
          sku: "",
        },
      ],
    }));
  };

  const removeVariant = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  // IMAGE UPLOAD
  // Supports selecting multiple images at once AND adding more images
  // by opening the file picker again.
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = Array.from(e.target.files || []);

    if (selected.length === 0) return;

    setFiles((prev) => {
      const existingKeys = new Set(
        prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`)
      );

      const newFiles = selected.filter(
        (file) =>
          !existingKeys.has(
            `${file.name}-${file.size}-${file.lastModified}`
          )
      );

      return [...prev, ...newFiles];
    });

    // Allows the same file to be selected again later.
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---- UI-only state (no API impact) ---- */
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [tagFilter, setTagFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  // press "/" anywhere to jump to search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const stockOf = (p: Product) => Number(p.inventory || 0);
  const priceOf = (p: Product) => Number(p.best_price || p.price || 0);
  const inr = (n: number) => n.toLocaleString("en-IN");

  const totalCount = products.length;
  const inStockCount = products.filter((p) => stockOf(p) > 0).length;
  const lowCount = products.filter((p) => stockOf(p) > 0 && stockOf(p) <= 5).length;
  const outCount = products.filter((p) => stockOf(p) === 0).length;
  const unitsOnHand = products.reduce((s, p) => s + stockOf(p), 0);
  const stockValue = products.reduce((s, p) => s + priceOf(p) * stockOf(p), 0);
  const maxStock = Math.max(1, ...products.map(stockOf));

  const stats = [
    { label: "Total Products", value: totalCount, sub: "All products in store", icon: Shirt, bar: "bg-[#111]" },
    { label: "In Stock", value: inStockCount, sub: "Available products", icon: Package, bar: "bg-[#2fa55a]" },
    { label: "Low Stock", value: lowCount, sub: "Stock ≤ 5 items", icon: AlertTriangle, bar: "bg-[#e0a030]" },
    { label: "Out of Stock", value: outCount, sub: "Unavailable products", icon: XCircle, bar: "bg-[#e0483a]" },
  ];

  const filtered = products
    .filter((p) => {
      if (tagFilter === "best_seller" && !p.best_seller) return false;
      if (tagFilter === "new_arrival" && !p.new_arrival) return false;
      if (tagFilter === "trending" && !p.trending) return false;
      if (tagFilter === "limited_edition" && !p.limited_edition) return false;
      if (statusFilter === "in" && stockOf(p) <= 5) return false;
      if (statusFilter === "low" && !(stockOf(p) > 0 && stockOf(p) <= 5)) return false;
      if (statusFilter === "out" && stockOf(p) !== 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return priceOf(a) - priceOf(b);
      if (sortBy === "price_desc") return priceOf(b) - priceOf(a);
      if (sortBy === "stock_asc") return stockOf(a) - stockOf(b);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);
  const allSelected =
    pageItems.length > 0 && pageItems.every((p) => selected.includes(p.id));
  const selectedOne = selected.length === 1 ? products.find((p) => p.id === selected[0]) : null;

  const toggleOne = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  const toggleAll = () =>
    setSelected((prev) =>
      allSelected
        ? prev.filter((id) => !pageItems.some((p) => p.id === id))
        : Array.from(new Set([...prev, ...pageItems.map((p) => p.id)]))
    );

  const tagLabels: Record<string, string> = {
    best_seller: "Best Seller",
    new_arrival: "New",
    trending: "Trending",
    limited_edition: "Limited",
  };
  const statusLabels: Record<string, string> = {
    in: "In Stock",
    low: "Low Stock",
    out: "Out of Stock",
  };
  const catName = categories.find((c) => c.slug === category);
  const chips: { label: string; clear: () => void }[] = [];
  if (category)
    chips.push({
      label: catName?.name || catName?.label || category,
      clear: () => {
        setCategory("");
        setTimeout(loadProducts, 0);
      },
    });
  if (tagFilter) chips.push({ label: tagLabels[tagFilter], clear: () => setTagFilter("") });
  if (statusFilter) chips.push({ label: statusLabels[statusFilter], clear: () => setStatusFilter("") });

  const selectCls =
    "h-11 w-full cursor-pointer appearance-none rounded-xl border border-[#e8e2d8] bg-white pl-3.5 pr-9 text-sm text-[#2a2a2a] outline-none transition duration-200 hover:border-[#cfc6b7] hover:shadow-sm focus:border-[#111] focus:ring-4 focus:ring-[#111]/5";

  const tagsOf = (p: Product) => (
    <>
      {p.best_seller && <Badge label="Best Seller" tone="amber" />}
      {p.new_arrival && <Badge label="New" tone="blue" />}
      {p.trending && <Badge label="Trending" tone="pink" />}
      {p.limited_edition && <Badge label="Limited" tone="violet" />}
      {!p.best_seller && !p.new_arrival && !p.trending && !p.limited_edition && (
        <span className="text-xs text-[#c2bcae]">—</span>
      )}
    </>
  );

  const stockView = (p: Product) => {
    const s = stockOf(p);
    const low = s <= 5;
    const pct = s === 0 ? 0 : Math.max(8, Math.round((s / maxStock) * 100));
    return (
      <div className="min-w-0">
        <span
          className={`inline-flex items-center gap-2 text-sm ${
            low ? "text-[#c0392b]" : "text-[#2f8f4e]"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${low ? "bg-[#e0483a]" : "bg-[#2fa55a]"}`} />
          {s === 0 ? "Out of stock" : `${s} in stock`}
        </span>
        <div className="mt-1.5 h-1 w-24 max-w-full overflow-hidden rounded-full bg-[#f1ece2]">
          <div
            className={`h-full rounded-full transition-all duration-700 ${low ? "bg-[#e0483a]" : "bg-[#2fa55a]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  const priceView = (p: Product) => {
    const off =
      p.mrp && priceOf(p) && p.mrp > priceOf(p)
        ? Math.round(((p.mrp - priceOf(p)) / p.mrp) * 100)
        : 0;
    return (
      <div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-base font-semibold tabular-nums">₹{priceOf(p)}</span>
          {p.mrp ? (
            <span className="text-xs text-[#9a9486] line-through tabular-nums">₹{p.mrp}</span>
          ) : null}
        </div>
        {off > 0 && (
          <span className="mt-0.5 inline-block text-[11px] font-medium text-[#2f8f4e]">
            {off}% off
          </span>
        )}
      </div>
    );
  };

  const thumb = (p: Product, cls: string) => (
    <div className={`shrink-0 overflow-hidden rounded-2xl bg-[#f3efe8] ring-1 ring-black/5 ${cls}`}>
      {p.images?.[0]?.image_url ? (
        <img
          src={p.images[0].image_url}
          alt={p.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-[#c2bcae]">
          <ImageOff className="h-5 w-5" />
        </div>
      )}
    </div>
  );

  const actions = (p: Product) => (
    <div className="flex gap-2">
      <IconAction label="Edit" onClick={() => openEdit(p)}>
        <Pencil className="h-4 w-4" />
      </IconAction>
      <IconAction label="Delete" danger onClick={() => deleteProduct(p.id)}>
        <Trash2 className="h-4 w-4" />
      </IconAction>
    </div>
  );

  const rowGrid =
    "md:grid-cols-[28px_minmax(0,2.2fr)_1fr_1.1fr_1.1fr_1.5fr_84px]";

  const bannerImgs = products.filter((p) => p.images?.[0]?.image_url).slice(0, 3);
  const fan = [
    "-rotate-6 group-hover/banner:-rotate-12 group-hover/banner:-translate-x-3",
    "rotate-2 translate-x-[76px] translate-y-3 group-hover/banner:translate-x-[92px]",
    "rotate-[10deg] translate-x-[152px] group-hover/banner:translate-x-[180px] group-hover/banner:rotate-[15deg]",
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(184,151,90,0.08),_transparent_28%),#f8f5f0] text-[#111]">
      <style>{`
        @keyframes ard-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .ard-rise { animation: ard-rise .5s cubic-bezier(.2,.7,.2,1) both; }
        @media (prefers-reduced-motion: reduce) { .ard-rise { animation: none; } }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(184,151,90,.22); color: #111; }
        * { scrollbar-width: thin; scrollbar-color: #d9d0c1 transparent; }
        *::-webkit-scrollbar { width: 7px; height: 7px; }
        *::-webkit-scrollbar-thumb { background: #d9d0c1; border-radius: 999px; }
        *::-webkit-scrollbar-track { background: transparent; }
        button, a, input, select, textarea { -webkit-tap-highlight-color: transparent; }
        @media (max-width: 639px) {
          input, select, textarea { font-size: 16px; }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1440px] px-3 pb-20 sm:px-5 lg:px-8 2xl:px-10">
        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-5 border-b border-[#e8e2d8]/80 pb-6 md:mb-8 md:flex-row md:items-end md:justify-between md:pb-7">
          <div>
            <h1 className="font-serif text-[2.35rem] font-semibold tracking-[-0.04em] sm:text-5xl">
              Products
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6f6a5f] sm:text-base">
              Manage your Ardenby product collection
            </p>
          </div>

          <div className="flex w-full flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-end md:gap-8">
            {!loading && totalCount > 0 && (
              <div className="grid grid-cols-2 gap-4 border-t border-[#e8e2d8] pt-4 sm:flex sm:border-t-0 sm:pt-0 sm:pr-8 sm:border-r">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#8e887b]">Units on hand</p>
                  <p className="font-serif text-2xl font-semibold tabular-nums">{inr(unitsOnHand)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#8e887b]">Stock value</p>
                  <p className="font-serif text-2xl font-semibold tabular-nums">₹{inr(stockValue)}</p>
                </div>
              </div>
            )}

            <button
              onClick={openAdd}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111] px-5 py-3.5 text-sm font-medium text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.55)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#262626] active:translate-y-0 active:scale-[0.97] sm:w-auto sm:px-6"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* STATS */}

        <div className="mb-5 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 lg:gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="group rounded-2xl border border-[#eee8dd] bg-white p-3.5 shadow-[0_4px_18px_-10px_rgba(60,45,20,0.16)] transition duration-200 hover:-translate-y-0.5 hover:border-[#ded5c7] hover:shadow-[0_16px_32px_-16px_rgba(60,45,20,0.28)] sm:p-5"
            >
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f5ebdd] text-[#5b4526] sm:flex">
                  <s.icon className="h-6 w-6" strokeWidth={1.5} />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#777064] sm:text-sm sm:normal-case sm:tracking-normal">{s.label}</p>
                  <p className="font-serif text-3xl font-semibold leading-tight tabular-nums">
                    {loading ? (
                      <span className="inline-block h-7 w-8 animate-pulse rounded bg-[#efe9dd] align-middle" />
                    ) : (
                      s.value
                    )}
                  </p>
                  <p className="truncate text-xs text-[#8e887b]">{s.sub}</p>
                </div>
              </div>

              <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#f1ece2]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${s.bar}`}
                  style={{ width: `${totalCount ? Math.round((s.value / totalCount) * 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* FILTER BAR */}

        <div className="sticky top-2 z-20 mb-3 flex flex-col gap-3 rounded-2xl border border-[#eee8dd] bg-white/95 p-2.5 shadow-[0_10px_30px_-18px_rgba(60,45,20,0.35)] backdrop-blur-xl sm:p-3 lg:static lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e887b]" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadProducts();
              }}
              placeholder="Search products..."
              className="h-11 w-full rounded-xl border border-[#e8e2d8] bg-[#fbfaf7] pl-10 pr-10 text-sm outline-none transition placeholder:text-[#9a9486] hover:border-[#d6cfc1] focus:border-[#111] focus:bg-white focus:ring-4 focus:ring-[#111]/5"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md border border-[#e8e2d8] bg-[#f8f5f0] text-xs text-[#8e887b] md:flex">
              /
            </kbd>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:flex lg:items-center">
            <div className="relative lg:w-44">
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);

                  setTimeout(loadProducts, 0);
                }}
                className={selectCls}
              >
                <option value="">All Categories</option>

                {categories.map((cat) => (
                  <option key={cat.slug || cat.id} value={cat.slug}>
                    {cat.name || cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            </div>

            <div className="relative lg:w-36">
              <select
                value={tagFilter}
                onChange={(e) => {
                  setTagFilter(e.target.value);
                  setPage(1);
                }}
                className={selectCls}
              >
                <option value="">All Tags</option>
                <option value="best_seller">Best Seller</option>
                <option value="new_arrival">New</option>
                <option value="trending">Trending</option>
                <option value="limited_edition">Limited</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            </div>

            <div className="relative lg:w-36">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className={selectCls}
              >
                <option value="">All Status</option>
                <option value="in">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            </div>

            <button
              onClick={loadProducts}
              className="col-span-2 flex h-11 items-center justify-center gap-2 rounded-xl border border-[#e8e2d8] bg-white px-5 text-sm font-medium transition duration-200 hover:border-[#111] hover:bg-[#111] hover:text-white active:scale-[0.97] sm:col-span-1"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>

          <div className="hidden items-center gap-1 rounded-xl bg-[#f3efe8] p-1 lg:flex">
            {(["list", "grid"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                aria-label={`${m} view`}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  viewMode === m ? "bg-[#111] text-white" : "text-[#6f6a5f] hover:text-[#111]"
                }`}
              >
                {m === "list" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* ACTIVE FILTER CHIPS + SORT */}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-[#6f6a5f]">
              {loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "product" : "products"}`}
            </span>
            {chips.map((c) => (
              <button
                key={c.label}
                onClick={c.clear}
                className="flex items-center gap-1.5 rounded-full border border-[#e8e2d8] bg-white py-1 pl-3 pr-2 text-xs font-medium transition hover:border-[#111]"
              >
                {c.label}
                <X className="h-3 w-3 text-[#8e887b]" />
              </button>
            ))}
            {chips.length > 1 && (
              <button
                onClick={() => {
                  setTagFilter("");
                  setStatusFilter("");
                  if (category) {
                    setCategory("");
                    setTimeout(loadProducts, 0);
                  }
                }}
                className="text-xs text-[#8e887b] underline underline-offset-4 hover:text-[#111]"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="relative">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8e887b]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products"
              className="h-9 cursor-pointer appearance-none rounded-lg border border-[#e8e2d8] bg-white pl-8 pr-8 text-xs font-medium outline-none transition hover:border-[#d6cfc1] focus:border-[#111]"
            >
              <option value="default">Sort: Default</option>
              <option value="name">Name A–Z</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock_asc">Stock: Lowest first</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
          </div>
        </div>

        {/* PRODUCTS */}

        <div className="overflow-hidden rounded-2xl border border-[#eee8dd] bg-white shadow-[0_8px_28px_-20px_rgba(60,45,20,0.35)]">
          {viewMode === "list" && (
            <div
              className={`hidden items-center gap-4 border-b border-[#f0ebe1] px-6 py-4 text-[11px] font-medium uppercase tracking-[0.12em] text-[#7d776b] md:grid ${rowGrid}`}
            >
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all"
                className="h-4 w-4 cursor-pointer rounded border-[#cfc8b8] accent-[#111]"
              />
              <span>Product</span>
              <span>Category</span>
              <span>Price</span>
              <span>Inventory</span>
              <span>Tags</span>
              <span className="text-right">Actions</span>
            </div>
          )}

          {loading ? (
            <div className="divide-y divide-[#f3eee5]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-5">
                  <div className="h-[72px] w-[72px] shrink-0 animate-pulse rounded-2xl bg-[#f1ece2]" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-3.5 w-1/3 animate-pulse rounded bg-[#f1ece2]" />
                    <div className="h-3 w-1/4 animate-pulse rounded bg-[#f1ece2]" />
                  </div>
                  <div className="hidden h-3.5 w-24 animate-pulse rounded bg-[#f1ece2] md:block" />
                  <div className="hidden h-3.5 w-20 animate-pulse rounded bg-[#f1ece2] md:block" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-20 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5ebdd]">
                <PackageOpen className="h-8 w-8 text-[#a08a63]" strokeWidth={1.25} />
              </div>
              {products.length === 0 ? (
                <>
                  <h3 className="font-serif text-2xl font-semibold">No products yet</h3>
                  <p className="mt-1.5 text-sm text-[#6f6a5f]">
                    Start building the ARDENBY collection.
                  </p>
                  <button
                    onClick={openAdd}
                    className="mt-6 flex items-center gap-2 rounded-xl bg-[#111] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#262626] active:scale-[0.97]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product
                  </button>
                </>
              ) : (
                <>
                  <h3 className="font-serif text-2xl font-semibold">Nothing matches</h3>
                  <p className="mt-1.5 text-sm text-[#6f6a5f]">
                    Try removing a filter to see more of the collection.
                  </p>
                  <button
                    onClick={() => {
                      setTagFilter("");
                      setStatusFilter("");
                    }}
                    className="mt-6 rounded-xl border border-[#e8e2d8] px-5 py-3 text-sm font-medium transition hover:bg-[#f3efe8]"
                  >
                    Reset tag and status filters
                  </button>
                </>
              )}
            </div>
          ) : viewMode === "list" ? (
            <ul className="divide-y divide-[#f3eee5]">
              {pageItems.map((product, i) => {
                const isSel = selected.includes(product.id);
                const low = stockOf(product) <= 5;
                return (
                  <li
                    key={product.id}
                    style={{ animationDelay: `${i * 45}ms` }}
                    className={`ard-rise group grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 border-l-[3px] px-4 py-4 transition-colors duration-200 md:gap-4 md:px-6 ${rowGrid} ${
                      low ? "border-l-[#e0483a]/60" : "border-l-transparent"
                    } ${isSel ? "bg-[#faf5ec]" : "hover:bg-[#fcfaf6]"}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggleOne(product.id)}
                      aria-label={`Select ${product.name}`}
                      className="hidden h-4 w-4 cursor-pointer rounded border-[#cfc8b8] accent-[#111] md:block"
                    />

                    <div className="contents md:flex md:min-w-0 md:items-center md:gap-4">
                      {thumb(product, "h-20 w-20 md:h-[76px] md:w-[76px]")}
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-[15px] font-semibold leading-snug">
                          {product.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[#8e887b]">
                          ID: {product.id}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5 md:hidden">
                          {tagsOf(product)}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 grid grid-cols-3 gap-3 border-t border-[#f3eee5] pt-3 md:contents md:border-0 md:pt-0">
                      <span className="text-sm text-[#6f6a5f]">
                        {product.category_label || "Uncategorized"}
                      </span>

                      {priceView(product)}

                      {stockView(product)}
                    </div>

                    <div className="hidden flex-wrap gap-1.5 md:flex">{tagsOf(product)}</div>

                    <div className="col-span-2 flex justify-end md:col-span-1">
                      {actions(product)}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4 lg:grid-cols-3 xl:grid-cols-4">
              {pageItems.map((product, i) => (
                <div
                  key={product.id}
                  style={{ animationDelay: `${i * 45}ms` }}
                  className="ard-rise group rounded-2xl border border-[#eee8dd] bg-[#fffefa] p-2.5 transition duration-300 hover:-translate-y-1 hover:border-[#ddd3c3] hover:shadow-[0_18px_40px_-20px_rgba(60,45,20,0.35)] sm:p-3"
                >
                  <div className="relative">
                    {thumb(product, "aspect-square w-full")}
                    <div className="absolute right-2 top-2 transition focus-within:opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                      {actions(product)}
                    </div>
                  </div>
                  <p className="mt-3 truncate text-[15px] font-semibold">{product.name}</p>
                  <p className="text-xs text-[#8e887b]">
                    {product.category_label || "Uncategorized"}
                  </p>
                  <div className="mt-2">{priceView(product)}</div>
                  <div className="mt-2">{stockView(product)}</div>
                  <div className="mt-3 flex flex-wrap gap-1.5">{tagsOf(product)}</div>
                </div>
              ))}
            </div>
          )}

          {/* PAGINATION */}

          {!loading && filtered.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-[#f0ebe1] px-5 py-4 text-sm text-[#6f6a5f] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span>Show</span>
                <div className="relative">
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="h-10 cursor-pointer appearance-none rounded-xl border border-[#e8e2d8] bg-white pl-3 pr-8 text-sm text-[#111] outline-none focus:border-[#111]"
                  >
                    {[10, 20, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
                </div>
                <span>products per page</span>
              </div>

              <div className="flex items-center gap-3">
                <span>
                  {start + 1}–{Math.min(start + perPage, filtered.length)} of {filtered.length} products
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(Math.max(1, safePage - 1))}
                    disabled={safePage === 1}
                    aria-label="Previous page"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e2d8] transition hover:bg-[#f3efe8] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#111] px-2 text-sm font-medium text-white">
                    {safePage}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(pageCount, safePage + 1))}
                    disabled={safePage === pageCount}
                    aria-label="Next page"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e2d8] transition hover:bg-[#f3efe8] disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CREATE BANNER — fans out your real product photos */}

        <div className="group/banner relative mt-5 overflow-hidden rounded-2xl bg-[#141210] bg-[radial-gradient(ellipse_at_85%_50%,rgba(184,151,90,0.30),transparent_60%)] p-6 text-white md:p-9">
          <div className="relative z-10">
            <h3 className="font-serif text-2xl font-semibold md:text-3xl">Create amazing products</h3>
            <p className="mt-1.5 max-w-md text-sm text-white/70">
              Add new products with images, variants, sizes and more.
            </p>
            <button
              onClick={openAdd}
              className="mt-6 flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-[#111] transition hover:bg-[#f5ecd7] active:scale-[0.97]"
            >
              <Plus className="h-4 w-4" />
              Add New Product
            </button>
          </div>

          {bannerImgs.length > 0 && (
            <div className="pointer-events-none absolute right-10 top-1/2 hidden h-44 w-[300px] -translate-y-1/2 md:block lg:right-16">
              {bannerImgs.map((p, i) => (
                <img
                  key={p.id}
                  src={p.images![0].image_url}
                  alt=""
                  className={`absolute left-0 top-0 h-44 w-36 rounded-2xl border-2 border-white/15 object-cover shadow-2xl transition duration-500 ease-out ${fan[i]}`}
                  style={{ zIndex: i }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FLOATING SELECTION BAR */}

      {selected.length > 0 && (
        <div className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3 rounded-2xl bg-[#111] px-4 py-2.5 text-sm text-white shadow-[0_16px_40px_-10px_rgba(0,0,0,0.6)] sm:left-1/2 sm:right-auto sm:inset-x-auto sm:-translate-x-1/2 sm:justify-center sm:rounded-full sm:pl-6 sm:pr-2.5">
          <span className="tabular-nums">{selected.length} selected</span>
          {selectedOne && (
            <button
              onClick={() => openEdit(selectedOne)}
              className="rounded-full bg-white/10 px-4 py-1.5 transition hover:bg-white/20"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => setSelected([])}
            className="rounded-full bg-white px-4 py-1.5 font-medium text-[#111] transition hover:bg-[#f5ecd7]"
          >
            Clear
          </button>
        </div>
      )}

      {/* MODAL */}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111]/50 p-4 backdrop-blur-[3px]">
          <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-[22px] bg-white shadow-[0_30px_100px_-25px_rgba(0,0,0,0.55)] sm:rounded-[28px]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#f0ebe1] bg-white/90 p-4 backdrop-blur-xl sm:p-5 md:p-7">
              <div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.26em] text-[#b8975a]">
                  Product Management
                </p>
                <h2 className="font-serif text-2xl font-medium">
                  {editingId ? "Edit Product" : "Add Product"}
                </h2>
              </div>

              <button
                onClick={() => setModal(false)}
                className="rounded-full p-2 text-[#8e887b] transition hover:bg-[#f7f4ef] hover:text-[#111]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 md:p-7">
              <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
                <Field
                  label="Product Name"
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                />

                <div>
                  <label className={labelCls}>Category</label>

                  <select
                    value={form.category_slug}
                    onChange={(e) => {
                      const selected = categories.find(
                        (c) => c.slug === e.target.value
                      );

                      setForm({
                        ...form,
                        category_slug: e.target.value,
                        category_label:
                          selected?.name || selected?.label || "",
                      });
                    }}
                    className={inputCls}
                  >
                    <option value="">Select Category</option>

                    {categories.map((cat) => (
                      <option key={cat.slug || cat.id} value={cat.slug}>
                        {cat.name || cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Field
                  label="Fit"
                  value={form.fit}
                  onChange={(v) => setForm({ ...form, fit: v })}
                />

                <Field
                  label="Fabric"
                  value={form.fabric}
                  onChange={(v) => setForm({ ...form, fabric: v })}
                />

                {/* COVERAGE */}

                <div>
                  <label className={labelCls}>Coverage</label>

                  <select
                    value={form.coverage}
                    onChange={(e) =>
                      setForm({ ...form, coverage: e.target.value })
                    }
                    className={inputCls}
                  >
                    <option value="">Select Coverage</option>
                    <option value="All Over">All Over</option>
                    <option value="Front">Front</option>
                    <option value="Back">Back</option>
                  </select>
                </div>

                <Field
                  label="Price"
                  type="number"
                  value={form.price}
                  onChange={(v) => setForm({ ...form, price: v })}
                />

                <Field
                  label="MRP"
                  type="number"
                  value={form.mrp}
                  onChange={(v) => setForm({ ...form, mrp: v })}
                />

                <Field
                  label="Best Price"
                  type="number"
                  value={form.best_price}
                  onChange={(v) => setForm({ ...form, best_price: v })}
                />

                <Field
                  label="Inventory"
                  type="number"
                  value={form.inventory}
                  onChange={(v) => setForm({ ...form, inventory: v })}
                />
              </div>

              {/* DESCRIPTION */}

              <div className="mt-4">
                <label className={labelCls}>Description</label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={4}
                  className={inputCls}
                />
              </div>

              <div className="mt-4 grid gap-3.5 sm:grid-cols-2 sm:gap-4">
                <Field
                  label="Fabric Details"
                  value={form.fabric_details}
                  onChange={(v) => setForm({ ...form, fabric_details: v })}
                />

                <Field
                  label="Wash Care"
                  value={form.wash_care}
                  onChange={(v) => setForm({ ...form, wash_care: v })}
                />

                <Field
                  label="Tags"
                  value={form.tags}
                  onChange={(v) => setForm({ ...form, tags: v })}
                />
              </div>

              {/* FLAGS */}

              <div className="my-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Check
                  label="Best Seller"
                  checked={form.best_seller}
                  onChange={(v) => setForm({ ...form, best_seller: v })}
                />

                <Check
                  label="New Arrival"
                  checked={form.new_arrival}
                  onChange={(v) => setForm({ ...form, new_arrival: v })}
                />

                <Check
                  label="Trending"
                  checked={form.trending}
                  onChange={(v) => setForm({ ...form, trending: v })}
                />

                <Check
                  label="Limited Edition"
                  checked={form.limited_edition}
                  onChange={(v) => setForm({ ...form, limited_edition: v })}
                />
              </div>

              {/* IMAGES */}

              <div className="mb-5">
                <label className={labelCls}>Product Images</label>

                <input
                  type="file"
                  name="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full rounded-xl border border-dashed border-[#d9d2c3] bg-[#fbf9f5] p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[#111] file:px-4 file:py-1.5 file:text-xs file:font-medium file:text-white"
                />

                <p className="mt-1.5 text-xs text-[#8e887b]">
                  Select multiple images at once, or open the picker again to add more.
                </p>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-[#5f5a50]">
                      {files.length} image{files.length > 1 ? "s" : ""} selected
                    </p>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {files.map((file, index) => (
                        <div
                          key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[#ebe5da] bg-[#fbf9f5] px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-[#343a40]">
                              {file.name}
                            </p>
                            <p className="mt-0.5 text-[10px] text-[#a9a294]">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="shrink-0 rounded-md p-1.5 text-[#a9a294] transition hover:bg-[#f8e7e4] hover:text-[#b4483c]"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* VARIANTS */}

              <div className="rounded-2xl border border-[#ebe5da] bg-[linear-gradient(180deg,#fcfaf7_0%,#f8f4ed_100%)] p-3.5 sm:p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-medium">Variants</h3>
                    <p className="text-xs text-[#8e887b]">Size, color and stock</p>
                  </div>

                  <button
                    onClick={addVariant}
                    type="button"
                    className="flex items-center gap-1.5 rounded-full bg-[#111] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#2b2b2b] active:scale-[0.97]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Variant
                  </button>
                </div>

                <div className="space-y-2.5">
                  {form.variants.length === 0 && (
                    <p className="rounded-xl bg-white px-3 py-4 text-center text-xs text-[#a9a294]">
                      No variants added yet.
                    </p>
                  )}

                  {form.variants.map((variant, index) => (
                    <div
                      key={variant.id || index}
                      className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_1fr_auto]"
                    >
                      <input
                        placeholder="Size"
                        value={variant.size}
                        onChange={(e) =>
                          updateVariant(index, "size", e.target.value)
                        }
                        className={inputCls}
                      />

                      <input
                        placeholder="Color"
                        value={variant.color}
                        onChange={(e) =>
                          updateVariant(index, "color", e.target.value)
                        }
                        className={inputCls}
                      />

                      <input
                        type="number"
                        placeholder="Stock"
                        value={variant.inventory}
                        onChange={(e) =>
                          updateVariant(index, "inventory", Number(e.target.value))
                        }
                        className={inputCls}
                      />

                      <input
                        placeholder="SKU"
                        value={variant.sku || ""}
                        onChange={(e) =>
                          updateVariant(index, "sku", e.target.value)
                        }
                        className={inputCls}
                      />

                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="flex items-center justify-center rounded-xl border border-[#f1d5d0] bg-white px-3 py-2 text-[#b4483c] transition hover:bg-[#f8e7e4]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTIONS */}

              <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex justify-end gap-2 border-t border-[#eee8dd] bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:gap-3">
                <button
                  onClick={() => setModal(false)}
                  disabled={saving}
                  className="min-h-11 flex-1 rounded-full border border-[#e7e1d6] px-5 py-2.5 text-sm font-medium text-[#5f5a50] transition hover:bg-[#f7f4ef] disabled:opacity-50 sm:flex-none sm:px-6"
                >
                  Cancel
                </button>

                <button
                  onClick={saveProduct}
                  disabled={saving}
                  className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#111] px-5 py-2.5 text-sm font-medium text-[#f5ecd7] ring-1 ring-[#b8975a]/40 transition hover:bg-[#242424] active:scale-[0.97] disabled:opacity-60 sm:flex-none sm:px-6"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Update Product" : "Add Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-2xl border bg-white p-3.5 shadow-lg transition ${
              toast.type === "success"
                ? "border-[#d5e4d0]"
                : "border-[#f1d5d0]"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#4f7f4a]" />
            ) : (
              <XCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#b4483c]" />
            )}

            <p className="flex-1 text-sm text-[#2d3237]">{toast.message}</p>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-[#a9a294] transition hover:text-[#5f5a50]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   SMALL COMPONENTS
========================= */

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition ${
        checked
          ? "border-[#111] bg-[#111] text-[#f5ecd7]"
          : "border-[#e7e1d6] text-[#5f5a50] hover:bg-[#f7f4ef]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="hidden"
      />
      {label}
    </label>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "amber" | "blue" | "pink" | "violet";
}) {
  const tones: Record<string, string> = {
    amber: "bg-[#fdf1d8] text-[#a8761a]",
    blue: "bg-[#e6f0ff] text-[#3b6cc0]",
    pink: "bg-[#fde6ee] text-[#c2456f]",
    violet: "bg-[#efe9fb] text-[#6a4bc4]",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

function IconAction({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="group/tip relative">
      <button
        onClick={onClick}
        aria-label={label}
        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition duration-150 active:scale-90 ${
          danger
            ? "border-[#f5cfc9] bg-[#fdf0ee] text-[#d0392b] hover:bg-[#fbe0dc]"
            : "border-[#e8e2d8] bg-white text-[#2a2a2a] hover:border-[#111] hover:bg-[#111] hover:text-white"
        }`}
      >
        {children}
      </button>

      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#111] px-2 py-1 text-[10px] text-white opacity-0 transition group-hover/tip:opacity-100">
        {label}
      </span>
    </div>
  );
}