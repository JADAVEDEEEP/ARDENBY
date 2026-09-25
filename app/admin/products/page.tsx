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
  ExternalLink,
  Copy,
  PackageCheck,
  Tag,
  Layers3,
  MoreHorizontal,
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
    setPreviewProduct(null);
    setEditingId(null);
    setForm(emptyForm);
    setFiles([]);
    setModal(true);
  };

  const openEdit = (product: Product) => {
    setPreviewProduct(null);
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
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
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
      // Category filtering is handled locally as well, so the dropdown
      // works even if the backend does not implement ?category=...
      if (
        category &&
        p.category_slug !== category &&
        p.category_label !== category
      ) {
        return false;
      }

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
        setPage(1);
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

  const openPreview = (product: Product) => {
    setPreviewProduct(product);
    setPreviewImageIndex(0);
  };

  const previewImages = previewProduct?.images?.filter((img) => img.image_url) || [];
  const previewStock = previewProduct ? stockOf(previewProduct) : 0;
  const previewPrice = previewProduct ? priceOf(previewProduct) : 0;
  const previewStatus =
    previewStock === 0 ? "Out of stock" : previewStock <= 5 ? "Low Stock" : "Published";

  const rowGrid =
    "md:grid-cols-[32px_minmax(245px,2.35fr)_minmax(105px,1fr)_minmax(100px,.9fr)_minmax(125px,1.1fr)_minmax(135px,1.35fr)_88px]";

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

      <div className="min-h-[calc(100vh-72px)] bg-[#f7f6f3]">
        {/* HEADER — closely follows the supplied StoreToLet reference */}
        <div className="border-b border-[#e5e2dc] bg-white">
          <div className="px-5 py-5 sm:px-7 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9b8258]">
                  ARDENBY
                </p>
                <h1 className="font-serif text-[30px] font-semibold leading-none tracking-[-0.035em] text-[#171717]">
                  Products
                </h1>
                <p className="mt-2 text-xs text-[#8b887f]">
                  Manage all your products and stock
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById("ardenby-category-filter")?.focus()}
                  className="hidden h-10 items-center gap-2 rounded-lg border border-[#bfc0c3] bg-white px-4 text-xs font-medium text-[#303136] hover:bg-[#f7f7f7] sm:flex"
                >
                  <Layers3 className="h-4 w-4" />
                  Categories
                </button>

                <button
                  type="button"
                  onClick={openAdd}
                  className="flex h-10 items-center gap-2 rounded-lg bg-[#17244f] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#101a3b] active:scale-[.99]"
                >
                  <Plus className="h-4 w-4" />
                  Add New Product
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-7 lg:px-8 lg:py-6">
          {/* TOOLBAR */}
          <div className="rounded-xl border border-[#e2dfd9] bg-white">
            <div className="flex flex-col gap-3 border-b border-[#ece9e4] px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#383838] sm:text-sm">
                  Products : {filtered.length}
                </span>
                {selected.length > 0 && (
                  <span className="rounded-full bg-[#17244f] px-2.5 py-1 text-[10px] font-medium text-white">
                    {selected.length} selected
                  </span>
                )}
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                <div className="relative min-w-0 flex-1 sm:w-[270px] lg:w-[300px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9b9891]" />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") loadProducts();
                    }}
                    placeholder="Search here..."
                    className="h-10 w-full rounded-lg border border-[#ddd9d2] bg-white pl-9 pr-9 text-xs text-[#222] outline-none placeholder:text-[#aaa59c] focus:border-[#17244f]"
                  />
                  <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded border border-[#e3dfd8] bg-white text-[11px] text-[#aaa59c] sm:flex">
                    /
                  </kbd>
                </div>

                <div className="relative sm:w-[175px]">
                  <select
                    id="ardenby-category-filter"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setPage(1);
                    }}
                    className="h-10 w-full appearance-none rounded-lg border border-[#ddd9d2] bg-white px-3 pr-9 text-xs text-[#383838] outline-none focus:border-[#17244f]"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.slug || cat.id} value={cat.slug}>
                        {cat.name || cat.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#85817a]" />
                </div>

                <button
                  type="button"
                  onClick={loadProducts}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#ddd9d2] bg-white px-4 text-xs font-medium text-[#343434] hover:bg-[#f8f7f5]"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                </button>
              </div>
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto md:block">
              <div className="min-w-[850px]">
                <div className="grid grid-cols-[48px_minmax(300px,2.3fr)_minmax(120px,1fr)_minmax(135px,1fr)_minmax(135px,1fr)_82px] items-center border-b border-[#e8e5df] bg-[#fafafa] px-4 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-[#77736c] lg:px-5">
                  <div>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select all products"
                      className="h-4 w-4 accent-[#17244f]"
                    />
                  </div>
                  <span>Image / Name</span>
                  <span>Total Price</span>
                  <span>Category</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>

                <div className="divide-y divide-[#ebe8e2]">
                  {pageItems.map((product, i) => {
                    const stock = stockOf(product);
                    const isSel = selected.includes(product.id);

                    return (
                      <div
                        key={product.id}
                        style={{ animationDelay: `${i * 25}ms` }}
                        className={`ard-rise grid min-h-[78px] grid-cols-[48px_minmax(300px,2.3fr)_minmax(120px,1fr)_minmax(135px,1fr)_minmax(135px,1fr)_82px] items-center px-4 transition-colors hover:bg-[#fcfbf9] lg:px-5 ${
                          isSel ? "bg-[#fbf7ef]" : "bg-white"
                        }`}
                      >
                        <div>
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => toggleOne(product.id)}
                            aria-label={`Select ${product.name}`}
                            className="h-4 w-4 accent-[#17244f]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => openPreview(product)}
                          className="flex min-w-0 items-center gap-3 text-left"
                        >
                          {thumb(
                            product,
                            "h-[52px] w-[52px] rounded-lg lg:h-[56px] lg:w-[56px]"
                          )}
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold text-[#2b2b2b]">
                              {product.name}
                            </span>
                            <span className="mt-1 block truncate text-[10px] text-[#9b978f]">
                              {product.variants?.[0]?.sku || product.id}
                            </span>
                          </span>
                        </button>

                        <div>{priceView(product)}</div>

                        <span className="truncate pr-4 text-xs text-[#68645d]">
                          {product.category_label || "Uncategorized"}
                        </span>

                        <div>
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-medium ${
                              stock === 0
                                ? "bg-[#f7dfdc] text-[#b43b31]"
                                : stock <= 5
                                  ? "bg-[#fff0d2] text-[#a16a13]"
                                  : "bg-[#dff2e9] text-[#28805c]"
                            }`}
                          >
                            {stock === 0
                              ? "Out of Stock"
                              : stock <= 5
                                ? "Low Stock"
                                : "In Stock"}
                          </span>
                        </div>

                        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                          {actions(product)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* MOBILE PRODUCT LIST */}
            <div className="divide-y divide-[#ebe8e2] md:hidden">
              {pageItems.map((product) => {
                const stock = stockOf(product);
                const isSel = selected.includes(product.id);

                return (
                  <div
                    key={product.id}
                    className={`p-3.5 ${isSel ? "bg-[#fbf7ef]" : "bg-white"}`}
                  >
                    <div className="flex gap-3">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleOne(product.id)}
                        className="mt-2 h-4 w-4 shrink-0 accent-[#17244f]"
                        aria-label={`Select ${product.name}`}
                      />

                      <button
                        type="button"
                        onClick={() => openPreview(product)}
                        className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-lg bg-[#f1efeb]"
                      >
                        {product.images?.[0]?.image_url ? (
                          <img
                            src={product.images[0].image_url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[#aaa49b]">
                            <ImageOff className="h-5 w-5" />
                          </div>
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => openPreview(product)}
                            className="min-w-0 text-left"
                          >
                            <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-[#272727]">
                              {product.name}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] text-[#9b978f]">
                              {product.variants?.[0]?.sku || product.id}
                            </p>
                          </button>

                          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                            {actions(product)}
                          </div>
                        </div>

                        <div className="mt-2">{priceView(product)}</div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#eeeae4] pt-3">
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-[#99948b]">
                          Category
                        </p>
                        <p className="mt-1 truncate text-xs font-medium text-[#625e57]">
                          {product.category_label || "Uncategorized"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase tracking-[0.12em] text-[#99948b]">
                          Status
                        </p>
                        <span
                          className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${
                            stock === 0
                              ? "bg-[#f7dfdc] text-[#b43b31]"
                              : stock <= 5
                                ? "bg-[#fff0d2] text-[#a16a13]"
                                : "bg-[#dff2e9] text-[#28805c]"
                          }`}
                        >
                          {stock === 0
                            ? "Out of Stock"
                            : stock <= 5
                              ? "Low Stock"
                              : "In Stock"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAGINATION — reference style */}
            {!loading && filtered.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-[#e8e5df] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[11px] text-[#817d75]">
                  Showing {start + 1}–{Math.min(start + perPage, filtered.length)} of{" "}
                  {filtered.length}
                </span>

                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage(Math.max(1, safePage - 1))}
                    disabled={safePage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-[#17244f] text-white disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1).map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setPage(n)}
                      className={`h-8 min-w-8 rounded-md px-2 text-[11px] ${
                        n === safePage
                          ? "border border-[#17244f] bg-white font-semibold text-[#17244f]"
                          : "text-[#858078] hover:bg-[#f4f2ee]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPage(Math.min(pageCount, safePage + 1))}
                    disabled={safePage === pageCount}
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-[#17244f] text-white disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
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

      {/* PRODUCT PREVIEW DRAWER — intentionally no sidebar; this page sits inside the existing admin shell */}
      {previewProduct && (
        <>
          <button
            aria-label="Close product preview"
            onClick={() => setPreviewProduct(null)}
            className="fixed inset-0 z-[55] cursor-default bg-black/20 backdrop-blur-[2px]"
          />

          <aside
            className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[430px] flex-col border-l border-[#e7e1d6] bg-[#fffefa] shadow-[-24px_0_70px_-35px_rgba(0,0,0,.45)]"
            aria-label="Product details"
          >
            <div className="flex items-center justify-between border-b border-[#eee8dd] px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a18a65]">
                  Product details
                </p>
                <p className="mt-0.5 text-xs text-[#8e887b]">Catalog / {previewProduct.category_label || "Uncategorized"}</p>
              </div>

              <button
                onClick={() => setPreviewProduct(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e8e2d8] bg-white text-[#6f6a5f] transition hover:bg-[#111] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="p-5">
                <div className="relative overflow-hidden rounded-2xl bg-[#f1eee8]">
                  {previewImages.length ? (
                    <img
                      src={previewImages[previewImageIndex]?.image_url || previewImages[0].image_url}
                      alt={previewProduct.name}
                      className="aspect-[4/4.35] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/4.35] items-center justify-center text-[#b7afa2]">
                      <ImageOff className="h-10 w-10" />
                    </div>
                  )}

                  {previewImages.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setPreviewImageIndex((i) =>
                            i === 0 ? previewImages.length - 1 : i - 1
                          )
                        }
                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          setPreviewImageIndex((i) =>
                            i === previewImages.length - 1 ? 0 : i + 1
                          )
                        }
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>

                {previewImages.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {previewImages.map((image, index) => (
                      <button
                        key={image.id || image.image_url}
                        onClick={() => setPreviewImageIndex(index)}
                        className={`h-16 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-[#f3efe8] ${
                          index === previewImageIndex ? "border-[#111]" : "border-transparent"
                        }`}
                      >
                        <img
                          src={image.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-[#111]">
                        {previewProduct.name}
                      </h2>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[#8e887b]">
                        <span>SKU: {previewProduct.variants?.[0]?.sku || previewProduct.id}</span>
                        <button
                          onClick={() =>
                            navigator.clipboard?.writeText(
                              previewProduct.variants?.[0]?.sku || previewProduct.id
                            )
                          }
                          className="rounded p-1 hover:bg-[#f1eee8]"
                          title="Copy SKU"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                        previewStatus === "Published"
                          ? "bg-[#e5f4e9] text-[#287548]"
                          : previewStatus === "Low Stock"
                          ? "bg-[#fff0d7] text-[#a66a11]"
                          : "bg-[#f5e7e5] text-[#a63b32]"
                      }`}
                    >
                      {previewStatus}
                    </span>
                  </div>

                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-[25px] font-semibold tabular-nums">₹{inr(previewPrice)}</span>
                    {previewProduct.mrp && previewProduct.mrp > previewPrice && (
                      <span className="pb-1 text-sm text-[#9a9486] line-through">
                        ₹{inr(previewProduct.mrp)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 divide-y divide-[#eee8dd] rounded-2xl border border-[#eee8dd] bg-white">
                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3">
                      <PackageCheck className="h-5 w-5 text-[#8a7350]" />
                      <div>
                        <p className="text-sm font-medium">Inventory</p>
                        <p className="text-xs text-[#8e887b]">
                          {previewStock === 0 ? "No units available" : `${previewStock} units available`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => openEdit(previewProduct)}
                      className="rounded-lg border border-[#e8e2d8] px-3 py-2 text-xs font-medium hover:border-[#111]"
                    >
                      Manage
                    </button>
                  </div>

                  <div className="flex items-start gap-3 px-4 py-4">
                    <Tag className="mt-0.5 h-5 w-5 text-[#8a7350]" />
                    <div>
                      <p className="text-sm font-medium">Category</p>
                      <p className="mt-0.5 text-xs text-[#8e887b]">
                        {previewProduct.category_label || "Uncategorized"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 px-4 py-4">
                    <Layers3 className="mt-0.5 h-5 w-5 text-[#8a7350]" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Collections & tags</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {previewProduct.best_seller && <Badge label="Best Seller" tone="amber" />}
                        {previewProduct.new_arrival && <Badge label="New" tone="blue" />}
                        {previewProduct.trending && <Badge label="Trending" tone="pink" />}
                        {previewProduct.limited_edition && <Badge label="Limited" tone="violet" />}
                        {!previewProduct.best_seller &&
                          !previewProduct.new_arrival &&
                          !previewProduct.trending &&
                          !previewProduct.limited_edition && (
                            <span className="text-xs text-[#a9a294]">No tags assigned</span>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Variants</p>
                      <span className="text-xs text-[#8e887b]">
                        {previewProduct.variants?.length || 0} variants
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(previewProduct.variants || []).slice(0, 8).map((variant, index) => (
                        <div
                          key={variant.id || index}
                          className="min-w-[76px] rounded-xl border border-[#e8e2d8] bg-[#faf8f4] px-3 py-2"
                        >
                          <p className="text-xs font-semibold">
                            {variant.size || "—"} · {variant.color || "—"}
                          </p>
                          <p className="mt-0.5 text-[10px] text-[#8e887b]">
                            {variant.inventory} stock
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {previewProduct.description && (
                  <div className="mt-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8e887b]">
                      Description
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#5f5a50]">
                      {previewProduct.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[#eee8dd] bg-white p-4">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => openEdit(previewProduct)}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#111] text-sm font-medium text-white transition hover:bg-[#2a2a2a]"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Product
                </button>
                <button
                  onClick={() => setPreviewProduct(null)}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#e8e2d8] bg-white text-sm font-medium text-[#222] transition hover:border-[#111]"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Store
                </button>
              </div>
            </div>
          </aside>
        </>
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