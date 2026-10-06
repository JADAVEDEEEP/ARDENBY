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
  ArrowRight,
  UploadCloud,
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

/* shared UI tokens (presentation only) — KÖVENIK black + metallic gold */
const inputCls =
  "w-full min-h-11 rounded-xl border border-[#C9A24B]/25 bg-[#0A0908] px-3.5 py-2.5 text-sm text-[#F4EEDD] outline-none transition duration-200 [color-scheme:dark] placeholder:text-[#6b6455] hover:border-[#C9A24B]/50 focus:border-[#E3C673] focus:ring-4 focus:ring-[#C9A24B]/15";
const labelCls =
  "mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-[#B9B09C]";
const goldBtn =
  "bg-gradient-to-b from-[#E8D3A0] via-[#C9A24B] to-[#A9822F] text-[#0A0908] shadow-[0_0_18px_rgba(201,162,75,0.3)] hover:from-[#F1E0B4] hover:via-[#D6B05A] hover:to-[#B8903A]";
const panelCls =
  "rounded-2xl border border-[#C9A24B]/35 bg-gradient-to-br from-[#12100D] via-[#0D0F0F] to-[#0A0908] shadow-[0_0_28px_rgba(201,162,75,0.06)]";

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
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile filter sheet visibility only
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
    { label: "Total Products", value: totalCount, sub: "All products in store", icon: Shirt },
    {
      label: "In Stock",
      value: inStockCount,
      sub: lowCount > 0 ? `${lowCount} running low` : "Available products",
      icon: Package,
    },
    { label: "Out of Stock", value: outCount, sub: "Unavailable products", icon: AlertTriangle },
    { label: "Categories", value: categories.length, sub: "Product categories", icon: Layers3 },
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
    "h-10 w-full cursor-pointer appearance-none rounded-lg border border-[#C9A24B]/30 bg-[#0A0908] pl-3 pr-9 text-xs text-[#F4EEDD] outline-none transition duration-200 [color-scheme:dark] hover:border-[#C9A24B]/60 focus:border-[#E3C673] focus:ring-4 focus:ring-[#C9A24B]/15";

  const tagsOf = (p: Product) => (
    <>
      {p.best_seller && <Badge label="Best Seller" tone="amber" />}
      {p.new_arrival && <Badge label="New" tone="blue" />}
      {p.trending && <Badge label="Trending" tone="pink" />}
      {p.limited_edition && <Badge label="Limited" tone="violet" />}
      {!p.best_seller && !p.new_arrival && !p.trending && !p.limited_edition && (
        <span className="text-xs text-[#6b6455]">—</span>
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
            low ? "text-red-300" : "text-emerald-300"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${low ? "bg-red-400" : "bg-emerald-400"}`} />
          {s === 0 ? "Out of stock" : `${s} in stock`}
        </span>
        <div className="mt-1.5 h-1 w-24 max-w-full overflow-hidden rounded-full bg-[#C9A24B]/15">
          <div
            className={`h-full rounded-full transition-all duration-700 ${low ? "bg-red-400" : "bg-emerald-400"}`}
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
          <span className="text-base font-semibold tabular-nums text-[#F4EEDD]">₹{priceOf(p)}</span>
          {p.mrp ? (
            <span className="text-xs text-[#8F8878] line-through tabular-nums">₹{p.mrp}</span>
          ) : null}
        </div>
        {off > 0 && (
          <span className="mt-0.5 inline-block text-[11px] font-medium text-emerald-400">
            {off}% off
          </span>
        )}
      </div>
    );
  };

  const thumb = (p: Product, cls: string) => (
    <div className={`shrink-0 overflow-hidden rounded-xl border border-[#C9A24B]/35 bg-[#12100D] ${cls}`}>
      {p.images?.[0]?.image_url ? (
        <img
          src={p.images[0].image_url}
          alt={p.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-[#6b6455]">
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

  /* ---- presentation-only helpers ---- */
  const formSections = [
    { id: "kv-basic", label: "Basic Info", hint: "Name, category, description" },
    { id: "kv-images", label: "Images", hint: "Upload product images" },
    { id: "kv-pricing", label: "Pricing", hint: "Price, MRP and best price" },
    { id: "kv-inventory", label: "Inventory", hint: "Stock and variants" },
    { id: "kv-details", label: "Details & Tags", hint: "Fabric, care and flags" },
  ];
  const jumpTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const statusBadge = (stock: number, small = false) => (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${
        small ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-[10px]"
      } ${
        stock === 0
          ? "border-red-400/40 bg-red-500/10 text-red-300"
          : stock <= 5
            ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
            : "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
      }`}
    >
      {stock === 0 ? "Out of Stock" : stock <= 5 ? "Low Stock" : "In Stock"}
    </span>
  );

  const tableGrid =
    "grid-cols-[44px_minmax(260px,2.4fr)_minmax(110px,1fr)_minmax(120px,1fr)_minmax(80px,.7fr)_minmax(120px,1fr)_96px]";

  return (
    <div className="kv-scope mx-auto w-full max-w-7xl overflow-x-hidden pb-10 text-[#F4EEDD]">
      <style>{`
        @keyframes kv-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes kv-pop { from { opacity: 0; transform: translateY(14px) scale(.985); } to { opacity: 1; transform: none; } }
        .kv-rise { animation: kv-rise .5s cubic-bezier(.2,.7,.2,1) both; }
        .kv-pop { animation: kv-pop .35s cubic-bezier(.2,.7,.2,1) both; }
        @media (prefers-reduced-motion: reduce) { .kv-rise, .kv-pop { animation: none; } }
        .kv-scope ::selection { background: rgba(201,162,75,.3); color: #fff; }
        .kv-scope * { scrollbar-width: thin; scrollbar-color: #5a4a22 transparent; }
        .kv-scope *::-webkit-scrollbar { width: 7px; height: 7px; }
        .kv-scope *::-webkit-scrollbar-thumb { background: #5a4a22; border-radius: 999px; }
        .kv-scope *::-webkit-scrollbar-track { background: transparent; }
        .kv-scope button, .kv-scope a, .kv-scope input, .kv-scope select, .kv-scope textarea { -webkit-tap-highlight-color: transparent; }
        @media (max-width: 639px) {
          .kv-scope input, .kv-scope select, .kv-scope textarea { font-size: 16px; }
        }
      `}</style>

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C9A24B]">
            Product Studio
          </p>
          <h2 className="mt-1 font-serif text-3xl font-semibold leading-none tracking-tight text-[#F4EEDD] sm:text-4xl">
            Products <span className="text-[#E3C673]">✦</span>
          </h2>
          <p className="mt-2 text-sm text-[#B9B09C]">
            Manage all your products and stock
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => document.getElementById("ardenby-category-filter")?.focus()}
            className="hidden h-11 items-center gap-2 rounded-xl border border-[#C9A24B]/50 bg-[#0D0F0F] px-4 text-xs font-semibold text-[#E8D3A0] outline-none transition hover:bg-[#C9A24B]/10 hover:shadow-[0_0_16px_rgba(201,162,75,0.2)] focus-visible:ring-2 focus-visible:ring-[#E3C673] sm:flex"
          >
            <Layers3 className="h-4 w-4" />
            Categories
          </button>

          <button
            type="button"
            onClick={openAdd}
            className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold outline-none transition active:scale-[.98] focus-visible:ring-2 focus-visible:ring-[#F4EEDD] sm:w-auto ${goldBtn}`}
          >
            <Plus className="h-4 w-4" />
            <span className="sm:hidden">Add Product</span>
            <span className="hidden sm:inline">Add New Product</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <section className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`${panelCls} group relative flex items-center gap-3 overflow-hidden p-3.5 transition-all duration-300 hover:border-[#E3C673]/70 hover:shadow-[0_0_30px_rgba(201,162,75,0.18)] sm:gap-4 sm:p-4`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#C9A24B]/50 bg-[#C9A24B]/10 text-[#E3C673] sm:h-12 sm:w-12">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-sans text-2xl font-bold leading-none tabular-nums text-[#F4EEDD]">
                  {loading && products.length === 0 ? "—" : s.value}
                </p>
                <p className="mt-1.5 truncate text-[11px] font-medium text-[#B9B09C]">
                  {s.label}
                </p>
                <p className="hidden truncate text-[10px] text-[#8F8878] sm:block">
                  {s.sub}
                </p>
              </div>
              <svg
                className="pointer-events-none absolute bottom-0 right-0 h-10 w-1/2 opacity-50"
                viewBox="0 0 120 40"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M0 38 C 40 36, 70 30, 95 18 S 115 4, 120 2"
                  fill="none"
                  stroke="#C9A24B"
                  strokeWidth="1.2"
                />
              </svg>
            </div>
          );
        })}
      </section>

      {/* TOOLBAR + LIST */}
      <div className={`${panelCls} mt-5 overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b border-[#C9A24B]/20 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block sm:w-[190px]">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by stock status"
                className={selectCls}
              >
                <option value="">All Products ({filtered.length})</option>
                <option value="in">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A24B]" />
            </div>

            <span className="text-xs font-medium text-[#B9B09C] sm:hidden">
              Products : {filtered.length}
            </span>

            {selected.length > 0 && (
              <span className="rounded-full border border-[#C9A24B]/50 bg-[#C9A24B]/15 px-2.5 py-1 text-[10px] font-medium text-[#E8D3A0]">
                {selected.length} selected
              </span>
            )}
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="flex min-w-0 flex-1 gap-2 sm:w-[270px] sm:flex-none lg:w-[300px]">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A24B]" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loadProducts();
                  }}
                  placeholder="Search products..."
                  className="h-10 w-full rounded-lg border border-[#C9A24B]/30 bg-[#0A0908] pl-9 pr-9 text-xs text-[#F4EEDD] outline-none transition placeholder:text-[#6b6455] hover:border-[#C9A24B]/60 focus:border-[#E3C673] focus:ring-4 focus:ring-[#C9A24B]/15"
                />
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded border border-[#C9A24B]/30 text-[11px] text-[#8F8878] sm:flex">
                  /
                </kbd>
              </div>

              {/* mobile: opens filter sheet */}
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                aria-label="Open filters"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#C9A24B]/50 bg-[#C9A24B]/10 text-[#E3C673] transition hover:bg-[#C9A24B]/20 sm:hidden"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>

            <div className="relative hidden sm:block sm:w-[175px]">
              <select
                id="ardenby-category-filter"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
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
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A24B]" />
            </div>

            <button
              type="button"
              onClick={loadProducts}
              className="hidden h-10 items-center justify-center gap-2 rounded-lg border border-[#C9A24B]/50 bg-[#C9A24B]/10 px-4 text-xs font-semibold text-[#E8D3A0] transition hover:bg-[#C9A24B]/20 hover:shadow-[0_0_14px_rgba(201,162,75,0.25)] sm:flex"
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
            </button>
          </div>
        </div>

        {/* active filter chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-[#C9A24B]/15 px-3 py-2.5 sm:px-4">
            {chips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.clear}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A24B]/40 bg-[#C9A24B]/10 px-3 py-1 text-[11px] text-[#E8D3A0] transition hover:bg-[#C9A24B]/20"
              >
                {chip.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        {/* loading / empty */}
        {loading && products.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#B9B09C]">
            <Loader2 className="h-4 w-4 animate-spin text-[#C9A24B]" />
            Loading products...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C9A24B]/40 bg-[#C9A24B]/10 text-[#E3C673]">
              <PackageOpen className="h-6 w-6" />
            </span>
            <p className="text-sm font-medium text-[#F4EEDD]">No products found</p>
            <p className="text-xs text-[#8F8878]">
              Try a different search or filter, or add a new product.
            </p>
          </div>
        )}

        {/* DESKTOP TABLE */}
        {filtered.length > 0 && (
          <div className="hidden overflow-x-auto md:block">
            <div className="min-w-[860px]">
              <div
                className={`grid ${tableGrid} items-center border-b border-[#C9A24B]/20 bg-[#C9A24B]/[0.04] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A24B] lg:px-5`}
              >
                <div>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all products"
                    className="h-4 w-4 accent-[#C9A24B]"
                  />
                </div>
                <span>Product</span>
                <span>Price</span>
                <span>Category</span>
                <span>Stock</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="divide-y divide-[#C9A24B]/10">
                {pageItems.map((product, i) => {
                  const stock = stockOf(product);
                  const isSel = selected.includes(product.id);

                  return (
                    <div
                      key={product.id}
                      style={{ animationDelay: `${i * 25}ms` }}
                      className={`kv-rise group grid min-h-[80px] ${tableGrid} items-center px-4 transition-colors hover:bg-[#C9A24B]/[0.06] lg:px-5 ${
                        isSel ? "bg-[#C9A24B]/[0.09]" : "bg-transparent"
                      }`}
                    >
                      <div>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleOne(product.id)}
                          aria-label={`Select ${product.name}`}
                          className="h-4 w-4 accent-[#C9A24B]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => openPreview(product)}
                        className="flex min-w-0 items-center gap-3 text-left outline-none focus-visible:ring-1 focus-visible:ring-[#E3C673]"
                      >
                        {thumb(
                          product,
                          "h-[52px] w-[52px] lg:h-[56px] lg:w-[56px]"
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-semibold text-[#F4EEDD]">
                            {product.name}
                          </span>
                          <span className="mt-1 block truncate text-[10px] text-[#8F8878]">
                            SKU: {product.variants?.[0]?.sku || product.id}
                          </span>
                        </span>
                      </button>

                      <div>{priceView(product)}</div>

                      <span className="truncate pr-4 text-xs text-[#B9B09C]">
                        {product.category_label || "Uncategorized"}
                      </span>

                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          stock === 0
                            ? "text-red-400"
                            : stock <= 5
                              ? "text-amber-300"
                              : "text-[#F4EEDD]"
                        }`}
                      >
                        {stock}
                      </span>

                      <div>{statusBadge(stock)}</div>

                      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        {actions(product)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MOBILE PRODUCT CARDS */}
        {filtered.length > 0 && (
          <div className="space-y-3 p-3 md:hidden">
            {pageItems.map((product) => {
              const stock = stockOf(product);
              const isSel = selected.includes(product.id);

              return (
                <div
                  key={product.id}
                  className={`rounded-2xl border p-3.5 transition ${
                    isSel
                      ? "border-[#E3C673]/70 bg-[#C9A24B]/[0.09]"
                      : "border-[#C9A24B]/25 bg-gradient-to-br from-[#12100D] to-[#0A0908]"
                  }`}
                >
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggleOne(product.id)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#C9A24B]"
                      aria-label={`Select ${product.name}`}
                    />

                    <button
                      type="button"
                      onClick={() => openPreview(product)}
                      className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl border border-[#C9A24B]/35 bg-[#12100D]"
                    >
                      {product.images?.[0]?.image_url ? (
                        <img
                          src={product.images[0].image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#6b6455]">
                          <ImageOff className="h-5 w-5" />
                        </div>
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => openPreview(product)}
                        className="block w-full min-w-0 text-left"
                      >
                        <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-[#F4EEDD]">
                          {product.name}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-[#8F8878]">
                          SKU: {product.variants?.[0]?.sku || product.id}
                        </p>
                      </button>

                      <div className="mt-2">{priceView(product)}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3 border-t border-[#C9A24B]/15 pt-3">
                    <p className="min-w-0 truncate text-xs font-medium text-[#B9B09C]">
                      {product.category_label || "Uncategorized"}
                    </p>
                    {statusBadge(stock, true)}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => openEdit(product)}
                      className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#C9A24B]/50 bg-[#C9A24B]/10 text-xs font-semibold text-[#E8D3A0] transition active:scale-[.98] hover:bg-[#C9A24B]/20"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProduct(product.id)}
                      className="flex h-10 items-center justify-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 text-xs font-semibold text-red-300 transition active:scale-[.98] hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#C9A24B]/20 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[11px] text-[#8F8878]">
              Showing {start + 1}–{Math.min(start + perPage, filtered.length)} of{" "}
              {filtered.length} products
            </span>

            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, safePage - 1))}
                disabled={safePage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#C9A24B]/50 bg-[#C9A24B]/10 text-[#E8D3A0] transition hover:bg-[#C9A24B]/20 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1).map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setPage(n)}
                  className={`h-8 min-w-8 rounded-md px-2 text-[11px] font-semibold transition ${
                    n === safePage
                      ? `${goldBtn}`
                      : "text-[#B9B09C] hover:bg-[#C9A24B]/10"
                  }`}
                >
                  {n}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage(Math.min(pageCount, safePage + 1))}
                disabled={safePage === pageCount}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#C9A24B]/50 bg-[#C9A24B]/10 text-[#E8D3A0] transition hover:bg-[#C9A24B]/20 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE FILTER SHEET (same filters, same handlers) */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[70] sm:hidden">
          <button
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <div className="kv-pop absolute inset-x-0 bottom-0 rounded-t-3xl border border-b-0 border-[#C9A24B]/50 bg-gradient-to-b from-[#12100D] to-[#050505] p-5 pb-6 shadow-[0_-20px_60px_rgba(201,162,75,0.15)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#F4EEDD]">Filters</h3>
              <button
                onClick={() => setFiltersOpen(false)}
                className="rounded-full border border-[#C9A24B]/40 p-2 text-[#E8D3A0]"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className={labelCls}>Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className={inputCls + " appearance-none pr-9"}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.slug || cat.id} value={cat.slug}>
                    {cat.name || cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A24B]" />
            </div>

            <label className={`${labelCls} mt-4`}>Status</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "", l: "All" },
                { v: "in", l: "In Stock" },
                { v: "low", l: "Low Stock" },
                { v: "out", l: "Out of Stock" },
              ].map((opt) => (
                <button
                  key={opt.v || "all"}
                  type="button"
                  onClick={() => {
                    setStatusFilter(opt.v);
                    setPage(1);
                  }}
                  className={`h-11 rounded-xl border text-xs font-semibold transition ${
                    statusFilter === opt.v
                      ? "border-[#E3C673] bg-[#C9A24B]/20 text-[#F4EEDD] shadow-[0_0_14px_rgba(201,162,75,0.25)]"
                      : "border-[#C9A24B]/25 bg-[#0A0908] text-[#B9B09C]"
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCategory("");
                  setTagFilter("");
                  setStatusFilter("");
                  setPage(1);
                }}
                className="h-12 rounded-xl border border-[#C9A24B]/50 bg-[#0A0908] text-sm font-semibold text-[#E8D3A0] transition hover:bg-[#C9A24B]/10"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  loadProducts();
                  setFiltersOpen(false);
                }}
                className={`h-12 rounded-xl text-sm font-bold transition active:scale-[.98] ${goldBtn}`}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING SELECTION BAR */}

      {selected.length > 0 && (
        <div className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3 rounded-2xl border border-[#C9A24B]/50 bg-[#0D0F0F] px-4 py-2.5 text-sm text-[#F4EEDD] shadow-[0_16px_40px_-10px_rgba(0,0,0,0.9),0_0_24px_rgba(201,162,75,0.2)] sm:left-1/2 sm:right-auto sm:inset-x-auto sm:-translate-x-1/2 sm:justify-center sm:rounded-full sm:pl-6 sm:pr-2.5">
          <span className="tabular-nums">{selected.length} selected</span>
          {selectedOne && (
            <button
              onClick={() => openEdit(selectedOne)}
              className="rounded-full border border-[#C9A24B]/50 bg-[#C9A24B]/10 px-4 py-1.5 text-[#E8D3A0] transition hover:bg-[#C9A24B]/25"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => setSelected([])}
            className={`rounded-full px-4 py-1.5 font-semibold transition ${goldBtn}`}
          >
            Clear
          </button>
        </div>
      )}

      {/* PRODUCT PREVIEW DRAWER — this page sits inside the existing admin shell */}
      {previewProduct && (
        <>
          <button
            aria-label="Close product preview"
            onClick={() => setPreviewProduct(null)}
            className="fixed inset-0 z-[55] cursor-default bg-black/70 backdrop-blur-[2px]"
          />

          <aside
            className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[430px] flex-col border-l border-[#C9A24B]/40 bg-gradient-to-b from-[#12100D] to-[#050505] shadow-[-24px_0_70px_-20px_rgba(0,0,0,.9)]"
            aria-label="Product details"
          >
            <div className="flex items-center justify-between border-b border-[#C9A24B]/20 px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C9A24B]">
                  Product details
                </p>
                <p className="mt-0.5 text-xs text-[#8F8878]">Catalog / {previewProduct.category_label || "Uncategorized"}</p>
              </div>

              <button
                onClick={() => setPreviewProduct(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C9A24B]/40 bg-[#0D0F0F] text-[#E8D3A0] transition hover:bg-[#C9A24B] hover:text-[#0A0908]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="p-5">
                <div className="relative overflow-hidden rounded-2xl border border-[#C9A24B]/30 bg-[#0A0908]">
                  {previewImages.length ? (
                    <img
                      src={previewImages[previewImageIndex]?.image_url || previewImages[0].image_url}
                      alt={previewProduct.name}
                      className="aspect-[4/4.35] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/4.35] items-center justify-center text-[#6b6455]">
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
                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#C9A24B]/50 bg-black/70 text-[#E8D3A0] backdrop-blur"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          setPreviewImageIndex((i) =>
                            i === previewImages.length - 1 ? 0 : i + 1
                          )
                        }
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#C9A24B]/50 bg-black/70 text-[#E8D3A0] backdrop-blur"
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
                        className={`h-16 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-[#12100D] ${
                          index === previewImageIndex ? "border-[#E3C673]" : "border-transparent"
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
                      <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#F4EEDD]">
                        {previewProduct.name}
                      </h2>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[#8F8878]">
                        <span className="truncate">SKU: {previewProduct.variants?.[0]?.sku || previewProduct.id}</span>
                        <button
                          onClick={() =>
                            navigator.clipboard?.writeText(
                              previewProduct.variants?.[0]?.sku || previewProduct.id
                            )
                          }
                          className="rounded p-1 transition hover:bg-[#C9A24B]/15"
                          title="Copy SKU"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                        previewStatus === "Published"
                          ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                          : previewStatus === "Low Stock"
                          ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
                          : "border-red-400/40 bg-red-500/10 text-red-300"
                      }`}
                    >
                      {previewStatus}
                    </span>
                  </div>

                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-[25px] font-semibold tabular-nums text-[#E3C673]">₹{inr(previewPrice)}</span>
                    {previewProduct.mrp && previewProduct.mrp > previewPrice && (
                      <span className="pb-1 text-sm text-[#8F8878] line-through">
                        ₹{inr(previewProduct.mrp)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 divide-y divide-[#C9A24B]/15 rounded-2xl border border-[#C9A24B]/25 bg-[#0D0F0F]">
                  <div className="flex items-center justify-between gap-3 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <PackageCheck className="h-5 w-5 text-[#C9A24B]" />
                      <div>
                        <p className="text-sm font-medium text-[#F4EEDD]">Inventory</p>
                        <p className="text-xs text-[#8F8878]">
                          {previewStock === 0 ? "No units available" : `${previewStock} units available`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => openEdit(previewProduct)}
                      className="rounded-lg border border-[#C9A24B]/50 px-3 py-2 text-xs font-medium text-[#E8D3A0] transition hover:bg-[#C9A24B]/15"
                    >
                      Manage
                    </button>
                  </div>

                  <div className="flex items-start gap-3 px-4 py-4">
                    <Tag className="mt-0.5 h-5 w-5 text-[#C9A24B]" />
                    <div>
                      <p className="text-sm font-medium text-[#F4EEDD]">Category</p>
                      <p className="mt-0.5 text-xs text-[#8F8878]">
                        {previewProduct.category_label || "Uncategorized"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 px-4 py-4">
                    <Layers3 className="mt-0.5 h-5 w-5 text-[#C9A24B]" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#F4EEDD]">Collections & tags</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {previewProduct.best_seller && <Badge label="Best Seller" tone="amber" />}
                        {previewProduct.new_arrival && <Badge label="New" tone="blue" />}
                        {previewProduct.trending && <Badge label="Trending" tone="pink" />}
                        {previewProduct.limited_edition && <Badge label="Limited" tone="violet" />}
                        {!previewProduct.best_seller &&
                          !previewProduct.new_arrival &&
                          !previewProduct.trending &&
                          !previewProduct.limited_edition && (
                            <span className="text-xs text-[#6b6455]">No tags assigned</span>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[#F4EEDD]">Variants</p>
                      <span className="text-xs text-[#8F8878]">
                        {previewProduct.variants?.length || 0} variants
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(previewProduct.variants || []).slice(0, 8).map((variant, index) => (
                        <div
                          key={variant.id || index}
                          className="min-w-[76px] rounded-xl border border-[#C9A24B]/30 bg-[#0A0908] px-3 py-2"
                        >
                          <p className="text-xs font-semibold text-[#F4EEDD]">
                            {variant.size || "—"} · {variant.color || "—"}
                          </p>
                          <p className="mt-0.5 text-[10px] text-[#8F8878]">
                            {variant.inventory} stock
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {previewProduct.description && (
                  <div className="mt-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C9A24B]">
                      Description
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#B9B09C]">
                      {previewProduct.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[#C9A24B]/20 bg-[#0A0908] p-4">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => openEdit(previewProduct)}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${goldBtn}`}
                >
                  <Pencil className="h-4 w-4" />
                  Edit Product
                </button>
                <button
                  onClick={() => setPreviewProduct(null)}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#C9A24B]/50 bg-transparent text-sm font-medium text-[#E8D3A0] transition hover:bg-[#C9A24B]/10"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Store
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ADD / EDIT MODAL */}

      {modal && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-0 backdrop-blur-[3px] sm:items-center sm:p-4">
          <div className="kv-pop flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden border border-[#C9A24B]/45 bg-gradient-to-br from-[#12100D] via-[#0A0908] to-[#050505] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.95),0_0_40px_rgba(201,162,75,0.12)] sm:h-auto sm:max-h-[92vh] sm:rounded-3xl">
            {/* header */}
            <div className="flex items-center justify-between gap-3 border-b border-[#C9A24B]/25 px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#C9A24B]/50 bg-[#C9A24B]/10 font-serif text-lg text-[#E3C673]">
                  ✦
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-serif text-2xl font-semibold text-[#F4EEDD]">
                    {editingId ? "Edit Product" : "Add New Product"}
                  </h2>
                  <p className="truncate text-xs text-[#8F8878]">
                    {editingId
                      ? "Update this product in your store"
                      : "Create a new product for your store"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModal(false)}
                aria-label="Close"
                className="shrink-0 rounded-full border border-[#C9A24B]/30 p-2 text-[#E8D3A0] transition hover:bg-[#C9A24B]/15 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* mobile section chips */}
            <div className="flex gap-2 overflow-x-auto border-b border-[#C9A24B]/15 px-4 py-2.5 md:hidden">
              {formSections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => jumpTo(s.id)}
                  className="shrink-0 rounded-full border border-[#C9A24B]/35 bg-[#C9A24B]/[0.07] px-3.5 py-1.5 text-[11px] font-medium text-[#E8D3A0] transition active:bg-[#C9A24B]/20"
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="grid min-h-0 flex-1 md:grid-cols-[200px_1fr]">
              {/* desktop section rail */}
              <nav className="hidden border-r border-[#C9A24B]/20 bg-[#0A0908]/60 p-3 md:block">
                <div className="space-y-1.5">
                  {formSections.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => jumpTo(s.id)}
                      className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition hover:border-[#C9A24B]/35 hover:bg-[#C9A24B]/[0.07]"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#C9A24B]/40 text-[10px] font-semibold text-[#E3C673]">
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium text-[#F4EEDD]">
                          {s.label}
                        </span>
                        <span className="block truncate text-[10px] text-[#8F8878]">
                          {s.hint}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </nav>

              {/* form body */}
              <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
                {/* 1. BASIC */}
                <FormSection id="kv-basic" n={1} title="Basic Information">
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
                      placeholder="Enter product description..."
                      className={inputCls}
                    />
                  </div>
                </FormSection>

                {/* 2. IMAGES */}
                <FormSection id="kv-images" n={2} title="Product Images">
                  <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#C9A24B]/45 bg-[#0A0908] px-4 py-8 text-center transition hover:border-[#E3C673] hover:bg-[#C9A24B]/[0.05]">
                    <UploadCloud className="h-8 w-8 text-[#C9A24B] transition group-hover:scale-110" />
                    <span className="text-sm font-medium text-[#F4EEDD]">
                      Click to upload images
                    </span>
                    <span className="text-xs text-[#8F8878]">
                      Select multiple images at once, or open the picker again to add more.
                    </span>
                    <input
                      type="file"
                      name="images"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>

                  {files.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs font-medium text-[#B9B09C]">
                        {files.length} image{files.length > 1 ? "s" : ""} selected
                      </p>

                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                        {files.map((file, index) => (
                          <div
                            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                            className="group relative overflow-hidden rounded-xl border border-[#C9A24B]/35 bg-[#12100D]"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-[#C9A24B]/60 bg-black/80 text-[#E8D3A0] transition hover:bg-red-500 hover:text-white"
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <p className="truncate bg-black/70 px-2 py-1 text-[10px] text-[#B9B09C]">
                              {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </FormSection>

                {/* 3. PRICING */}
                <FormSection id="kv-pricing" n={3} title="Pricing">
                  <div className="grid gap-3.5 sm:grid-cols-3 sm:gap-4">
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
                  </div>
                </FormSection>

                {/* 4. INVENTORY + VARIANTS */}
                <FormSection id="kv-inventory" n={4} title="Inventory">
                  <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
                    <Field
                      label="Inventory"
                      type="number"
                      value={form.inventory}
                      onChange={(v) => setForm({ ...form, inventory: v })}
                    />
                  </div>

                  {/* VARIANTS */}

                  <div className="mt-5 rounded-2xl border border-[#C9A24B]/25 bg-[#0D0F0F] p-3.5 sm:p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-serif text-lg font-semibold text-[#F4EEDD]">Variants</h3>
                        <p className="text-xs text-[#8F8878]">Size, color and stock</p>
                      </div>

                      <button
                        onClick={addVariant}
                        type="button"
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition active:scale-[0.97] ${goldBtn}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Variant
                      </button>
                    </div>

                    <div className="space-y-3">
                      {form.variants.length === 0 && (
                        <p className="rounded-xl border border-dashed border-[#C9A24B]/25 px-3 py-4 text-center text-xs text-[#8F8878]">
                          No variants added yet.
                        </p>
                      )}

                      {form.variants.map((variant, index) => (
                        <div
                          key={variant.id || index}
                          className="grid grid-cols-2 gap-2 rounded-xl border border-[#C9A24B]/15 p-2.5 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:border-0 md:p-0"
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
                            aria-label="Remove variant"
                            className="col-span-2 flex min-h-11 items-center justify-center rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-red-300 transition hover:bg-red-500/25 md:col-span-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </FormSection>

                {/* 5. DETAILS, TAGS, FLAGS */}
                <FormSection id="kv-details" n={5} title="Details & Tags">
                  <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
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

                    <div className="sm:col-span-2">
                      <Field
                        label="Tags"
                        value={form.tags}
                        onChange={(v) => setForm({ ...form, tags: v })}
                      />
                    </div>
                  </div>

                  {/* FLAGS */}

                  <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
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
                </FormSection>
              </div>
            </div>

            {/* ACTIONS */}

            <div className="flex justify-end gap-2.5 border-t border-[#C9A24B]/25 bg-[#0A0908] px-4 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:gap-3 sm:px-6">
              <button
                onClick={() => setModal(false)}
                disabled={saving}
                className="min-h-11 flex-1 rounded-xl border border-[#C9A24B]/50 bg-transparent px-5 py-2.5 text-sm font-semibold text-[#E8D3A0] transition hover:bg-[#C9A24B]/10 disabled:opacity-50 sm:flex-none sm:px-8"
              >
                Cancel
              </button>

              <button
                onClick={saveProduct}
                disabled={saving}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition active:scale-[0.98] disabled:opacity-60 sm:flex-none sm:px-8 ${goldBtn}`}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Save Changes" : "Create Product"}
                {!saving && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-2xl border bg-[#0D0F0F] p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] transition ${
              toast.type === "success"
                ? "border-emerald-400/40"
                : "border-red-400/40"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            )}

            <p className="flex-1 text-sm text-[#F4EEDD]">{toast.message}</p>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-[#8F8878] transition hover:text-[#F4EEDD]"
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

function FormSection({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-2 border-b border-[#C9A24B]/15 pb-6 pt-1 first:pt-0 last:border-0 last:pb-2 [&:not(:first-child)]:mt-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#C9A24B]/45 bg-[#C9A24B]/10 text-[11px] font-semibold text-[#E3C673]">
          {n}
        </span>
        <h3 className="font-serif text-xl font-semibold text-[#F4EEDD]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

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
      className={`flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
        checked
          ? "border-[#E3C673] bg-[#C9A24B]/20 text-[#F4EEDD] shadow-[0_0_14px_rgba(201,162,75,0.25)]"
          : "border-[#C9A24B]/25 bg-[#0A0908] text-[#B9B09C] hover:border-[#C9A24B]/60 hover:text-[#E8D3A0]"
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
    amber: "border-[#C9A24B]/45 bg-[#C9A24B]/10 text-[#E8D3A0]",
    blue: "border-sky-400/35 bg-sky-500/10 text-sky-300",
    pink: "border-rose-400/35 bg-rose-500/10 text-rose-300",
    violet: "border-violet-400/35 bg-violet-500/10 text-violet-300",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}
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
        className={`flex h-10 w-10 items-center justify-center rounded-xl border outline-none transition duration-150 active:scale-90 focus-visible:ring-2 focus-visible:ring-[#E3C673] ${
          danger
            ? "border-red-400/40 bg-red-500/10 text-red-300 hover:bg-red-500 hover:text-white hover:shadow-[0_0_14px_rgba(248,113,113,0.35)]"
            : "border-[#C9A24B]/50 bg-[#C9A24B]/10 text-[#E8D3A0] hover:bg-[#C9A24B] hover:text-[#0A0908] hover:shadow-[0_0_14px_rgba(201,162,75,0.4)]"
        }`}
      >
        {children}
      </button>

      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[#C9A24B]/40 bg-[#0A0908] px-2 py-1 text-[10px] text-[#E8D3A0] opacity-0 transition group-hover/tip:opacity-100">
        {label}
      </span>
    </div>
  );
}