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
  Package,
  EyeOff,
  Eye,
  AlertTriangle,
  ExternalLink,
  Copy,
  PackageCheck,
  Tag,
  Layers3,
  MoreVertical,
  ArrowLeft,
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
  // optional fields read from the existing API response (display only)
  is_active?: boolean | number;
  status?: string;
  created_at?: string;
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

/* shared UI tokens (presentation only) — KOVENIK forest green + gold */
const inputCls =
  "w-full min-h-11 rounded-xl border border-[#B89A5A]/25 bg-[#131210] px-3.5 py-2.5 text-sm text-[#F4F0E6] outline-none transition duration-200 [color-scheme:dark] placeholder:text-[#706C61] hover:border-[#B89A5A]/50 focus:border-[#C8A96B] focus:ring-4 focus:ring-[#B89A5A]/15";
const labelCls =
  "mb-1.5 block text-[11px] font-medium tracking-[0.08em] text-[#BEB7A5]";
const goldBtn =
  "bg-gradient-to-b from-[#C8A96B] to-[#B89A5A] text-[#131210] shadow-[0_4px_16px_rgba(184,154,90,0.22)] hover:from-[#D6BB84] hover:to-[#C8A96B]";
const panelCls =
  "rounded-xl border border-[#B89A5A]/20 bg-gradient-to-br from-[#2A2824] via-[#1C1B18] to-[#171614] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]";
const selectCls =
  "h-11 w-full cursor-pointer appearance-none rounded-lg border border-[#B89A5A]/25 bg-[#1C1B18] pl-3.5 pr-9 text-[13px] text-[#F4F0E6] outline-none transition duration-200 [color-scheme:dark] hover:border-[#B89A5A]/55 focus:border-[#C8A96B] focus:ring-4 focus:ring-[#B89A5A]/15";

const tableGrid =
  "grid-cols-[40px_minmax(240px,2.3fr)_minmax(90px,.9fr)_minmax(100px,.9fr)_minmax(64px,.6fr)_minmax(90px,.9fr)_minmax(110px,1fr)_92px]";

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
  const [tagFilter, setTagFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [perPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile filter sheet visibility only
  const [menuId, setMenuId] = useState<string | null>(null); // "more" menu visibility only
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
  const isActive = (p: Product) =>
    p.is_active !== false &&
    p.is_active !== 0 &&
    !["inactive", "draft", "archived"].includes(String(p.status || "").toLowerCase());
  const createdOf = (p: Product) => {
    if (!p.created_at) return "—";
    const d = new Date(p.created_at);
    return Number.isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };
  const skuOf = (p: Product) => p.variants?.[0]?.sku || p.id;

  const totalCount = products.length;
  const activeCount = products.filter(isActive).length;
  const inactiveCount = totalCount - activeCount;
  const lowCount = products.filter((p) => stockOf(p) > 0 && stockOf(p) <= 5).length;
  const outCount = products.filter((p) => stockOf(p) === 0).length;

  const stats = [
    { label: "Total Products", value: totalCount, sub: "All products in store", icon: LayoutGrid },
    { label: "Active Products", value: activeCount, sub: "Visible in store", icon: Package },
    { label: "Inactive Products", value: inactiveCount, sub: "Hidden from store", icon: EyeOff },
    {
      label: "Low Stock",
      value: lowCount,
      sub: outCount > 0 ? `${outCount} out of stock` : "5 units or fewer",
      icon: AlertTriangle,
    },
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
      if (statusFilter === "active" && !isActive(p)) return false;
      if (statusFilter === "inactive" && isActive(p)) return false;
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
      if (sortBy === "newest")
        return (
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
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
    active: "Active",
    inactive: "Inactive",
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

  const priceView = (p: Product) => {
    const off =
      p.mrp && priceOf(p) && p.mrp > priceOf(p)
        ? Math.round(((p.mrp - priceOf(p)) / p.mrp) * 100)
        : 0;
    return (
      <div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[15px] font-semibold tabular-nums text-[#F4F0E6]">₹{inr(priceOf(p))}</span>
          {p.mrp && p.mrp > priceOf(p) ? (
            <span className="text-[11px] text-[#928C7E] line-through tabular-nums">₹{inr(p.mrp)}</span>
          ) : null}
        </div>
        {off > 0 && (
          <span className="mt-0.5 inline-block text-[11px] font-medium text-[#C8A96B]">
            {off}% off
          </span>
        )}
      </div>
    );
  };

  const stockClr = (stock: number) =>
    stock === 0 ? "text-red-400" : stock <= 5 ? "text-[#E0A24A]" : "text-[#9FD3A8]";

  const thumb = (p: Product, cls: string) => (
    <div className={`shrink-0 overflow-hidden rounded-lg border border-[#B89A5A]/30 bg-[#1C1B18] ${cls}`}>
      {p.images?.[0]?.image_url ? (
        <img
          src={p.images[0].image_url}
          alt={p.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-[#706C61]">
          <ImageOff className="h-5 w-5" />
        </div>
      )}
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
    previewProduct && !isActive(previewProduct)
      ? "Inactive"
      : previewStock === 0
        ? "Out of stock"
        : previewStock <= 5
          ? "Low Stock"
          : "Active";

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

  const statusBadge = (p: Product, small = false) => {
    const active = isActive(p);
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${
          small ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-[11px]"
        } ${
          active
            ? "border-[#B89A5A]/35 bg-[#46433C]/70 text-[#E9E0CA]"
            : "border-[#9C5A4A]/50 bg-[#5A2A25]/60 text-[#F0B7AB]"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#7BD18F]" : "bg-[#E58C7B]"}`} />
        {active ? "Active" : "Inactive"}
      </span>
    );
  };

  const moreMenu = (p: Product, up = false) => (
    <div className="relative">
      <button
        type="button"
        aria-label="More actions"
        onClick={(e) => {
          e.stopPropagation();
          setMenuId(menuId === p.id ? null : p.id);
        }}
        className="flex h-10 w-9 items-center justify-center rounded-lg border border-[#B89A5A]/15 bg-[#1C1B18] text-[#BEB7A5] outline-none transition hover:border-[#B89A5A]/45 hover:text-[#F4F0E6] focus-visible:ring-2 focus-visible:ring-[#C8A96B]"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {menuId === p.id && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuId(null)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            className={`absolute right-0 z-40 w-44 overflow-hidden rounded-lg border border-[#B89A5A]/35 bg-[#1C1B18] py-1 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.9)] ${
              up ? "bottom-full mb-1.5" : "top-full mt-1.5"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setMenuId(null);
                openPreview(p);
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs text-[#F4F0E6] transition hover:bg-[#B89A5A]/10"
            >
              <Eye className="h-3.5 w-3.5 text-[#C8A96B]" />
              View details
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuId(null);
                deleteProduct(p.id);
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs text-red-300 transition hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete product
            </button>
          </div>
        </>
      )}
    </div>
  );

  const editBtn = (p: Product) => (
    <button
      type="button"
      onClick={() => openEdit(p)}
      aria-label={`Edit ${p.name}`}
      title="Edit"
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#B89A5A]/55 bg-transparent text-[#C8A96B] outline-none transition hover:bg-[#B89A5A] hover:text-[#131210] focus-visible:ring-2 focus-visible:ring-[#C8A96B]"
    >
      <Pencil className="h-4 w-4" />
    </button>
  );

  return (
    <div className="kv-scope mx-auto w-full max-w-7xl overflow-x-hidden pb-10 text-[#F4F0E6]">
      <style>{`
        @keyframes kv-pop { from { opacity: 0; transform: translateY(14px) scale(.985); } to { opacity: 1; transform: none; } }
        .kv-pop { animation: kv-pop .35s cubic-bezier(.2,.7,.2,1) both; }
        @media (prefers-reduced-motion: reduce) { .kv-pop { animation: none; } }
        .kv-scope ::selection { background: rgba(184,154,90,.3); color: #fff; }
        .kv-scope * { scrollbar-width: thin; scrollbar-color: #514E46 transparent; }
        .kv-scope *::-webkit-scrollbar { width: 7px; height: 7px; }
        .kv-scope *::-webkit-scrollbar-thumb { background: #514E46; border-radius: 999px; }
        .kv-scope *::-webkit-scrollbar-track { background: transparent; }
        .kv-scope button, .kv-scope a, .kv-scope input, .kv-scope select, .kv-scope textarea { -webkit-tap-highlight-color: transparent; }
        @media (max-width: 639px) {
          .kv-scope input, .kv-scope select, .kv-scope textarea { font-size: 16px; }
        }
      `}</style>

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-[#F4F0E6] sm:text-4xl">
            Product Management
          </h2>
          <p className="mt-1.5 text-sm text-[#BEB7A5]">
            Manage your products, variants, inventory and more.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg px-5 text-[13px] font-semibold outline-none transition active:scale-[.98] focus-visible:ring-2 focus-visible:ring-[#F4F0E6] sm:w-auto ${goldBtn}`}
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* STAT CARDS */}
      <section className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`${panelCls} flex items-center gap-3 p-3.5 transition-colors duration-300 hover:border-[#C8A96B]/45 sm:gap-4 sm:p-4`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#B89A5A]/40 bg-[#312F2A] text-[#C8A96B] sm:h-12 sm:w-12">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-[#F4F0E6]">{s.label}</p>
                <p className="mt-0.5 font-serif text-3xl font-semibold leading-none tabular-nums text-[#F4F0E6]">
                  {loading && products.length === 0 ? "—" : s.value}
                </p>
                <p className="mt-1 hidden truncate text-[11px] text-[#BEB7A5] sm:block">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* TOOLBAR */}
      <div className="mt-5 flex gap-2 lg:hidden">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C8A96B]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadProducts();
            }}
            placeholder="Search products..."
            className="h-11 w-full rounded-lg border border-[#B89A5A]/25 bg-[#1C1B18] pl-9 pr-3 text-[13px] text-[#F4F0E6] outline-none transition placeholder:text-[#706C61] hover:border-[#B89A5A]/55 focus:border-[#C8A96B] focus:ring-4 focus:ring-[#B89A5A]/15"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          aria-label="Open filters"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${goldBtn}`}
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 hidden items-center gap-3 lg:flex">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C8A96B]" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadProducts();
            }}
            placeholder="Search products by name, SKU..."
            className="h-11 w-full rounded-lg border border-[#B89A5A]/25 bg-[#1C1B18] pl-10 pr-10 text-[13px] text-[#F4F0E6] outline-none transition placeholder:text-[#706C61] hover:border-[#B89A5A]/55 focus:border-[#C8A96B] focus:ring-4 focus:ring-[#B89A5A]/15"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded border border-[#B89A5A]/25 text-[11px] text-[#928C7E]">
            /
          </kbd>
        </div>

        <div className="relative w-[170px] shrink-0">
          <select
            id="ardenby-category-filter"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by category"
            className={selectCls}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.slug || cat.id} value={cat.slug}>
                {cat.name || cat.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C8A96B]" />
        </div>

        <div className="relative w-[150px] shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
            className={selectCls}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C8A96B]" />
        </div>

        <div className="relative w-[150px] shrink-0">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            aria-label="Sort products"
            className={selectCls}
          >
            <option value="default">Sort by</option>
            <option value="newest">Newest first</option>
            <option value="name">Name A–Z</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="stock_asc">Stock: low to high</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C8A96B]" />
        </div>

        <button
          type="button"
          onClick={loadProducts}
          className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-5 text-[13px] font-semibold transition active:scale-[.98] ${goldBtn}`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filter
        </button>
      </div>

      {/* LIST PANEL */}
      <div className={`${panelCls} mt-4 overflow-hidden`}>
        {/* active filter chips + selection */}
        {(chips.length > 0 || selected.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[#B89A5A]/15 px-3 py-2.5 sm:px-4">
            {chips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.clear}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#B89A5A]/40 bg-[#B89A5A]/10 px-3 py-1 text-[11px] text-[#C8A96B] transition hover:bg-[#B89A5A]/20"
              >
                {chip.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            {selected.length > 0 && (
              <span className="ml-auto text-[11px] text-[#BEB7A5]">{selected.length} selected</span>
            )}
          </div>
        )}

        {/* loading / empty */}
        {loading && products.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#BEB7A5]">
            <Loader2 className="h-4 w-4 animate-spin text-[#C8A96B]" />
            Loading products...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#B89A5A]/35 bg-[#312F2A] text-[#C8A96B]">
              <PackageOpen className="h-6 w-6" />
            </span>
            <p className="text-sm font-medium text-[#F4F0E6]">No products found</p>
            <p className="text-xs text-[#928C7E]">
              Try a different search or filter, or add a new product.
            </p>
          </div>
        )}

        {/* DESKTOP / TABLET TABLE */}
        {filtered.length > 0 && (
          <div className="hidden overflow-x-auto md:block">
            <div className="min-w-[960px]">
              <div
                className={`grid ${tableGrid} items-center border-b border-[#B89A5A]/20 bg-[#131210]/50 px-4 py-3 text-[11px] font-semibold tracking-[0.12em] text-[#C8A96B] lg:px-5`}
              >
                <div>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all products"
                    className="h-4 w-4 accent-[#B89A5A]"
                  />
                </div>
                <span>PRODUCT</span>
                <span>CATEGORY</span>
                <span>PRICE</span>
                <span>STOCK</span>
                <span>STATUS</span>
                <span>CREATED AT</span>
                <span className="text-right">ACTIONS</span>
              </div>

              <div className="divide-y divide-[#B89A5A]/10">
                {pageItems.map((product, i) => {
                  const stock = stockOf(product);
                  const isSel = selected.includes(product.id);

                  return (
                    <div
                      key={product.id}
                      className={`grid min-h-[76px] ${tableGrid} items-center px-4 transition-colors hover:bg-[#B89A5A]/[0.05] lg:px-5 ${
                        isSel ? "bg-[#B89A5A]/[0.08]" : "bg-transparent"
                      }`}
                    >
                      <div>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleOne(product.id)}
                          aria-label={`Select ${product.name}`}
                          className="h-4 w-4 accent-[#B89A5A]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => openPreview(product)}
                        className="flex min-w-0 items-center gap-3 py-2 pr-3 text-left outline-none focus-visible:ring-1 focus-visible:ring-[#C8A96B]"
                      >
                        {thumb(product, "h-[52px] w-[52px]")}
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-semibold text-[#F4F0E6]">
                            {product.name}
                          </span>
                          <span className="mt-1 block truncate text-[11px] text-[#928C7E]">
                            SKU: {skuOf(product)}
                          </span>
                        </span>
                      </button>

                      <span className="truncate pr-3 text-xs text-[#BEB7A5]">
                        {product.category_label || "Uncategorized"}
                      </span>

                      <div>{priceView(product)}</div>

                      <div>
                        <span className={`text-sm font-semibold tabular-nums ${stockClr(stock)}`}>
                          {stock}
                        </span>
                        {stock > 0 && stock <= 5 && (
                          <span className="block text-[10px] text-[#E0A24A]">Low</span>
                        )}
                        {stock === 0 && (
                          <span className="block text-[10px] text-red-400">Out</span>
                        )}
                      </div>

                      <div>{statusBadge(product)}</div>

                      <span className="text-xs tabular-nums text-[#BEB7A5]">{createdOf(product)}</span>

                      <div className="flex justify-end gap-1.5">
                        {editBtn(product)}
                        {moreMenu(product, i >= pageItems.length - 2 && pageItems.length > 3)}
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
                  className={`rounded-xl border p-3.5 transition ${
                    isSel
                      ? "border-[#C8A96B]/60 bg-[#B89A5A]/[0.08]"
                      : "border-[#B89A5A]/20 bg-gradient-to-br from-[#2A2824] to-[#1C1B18]"
                  }`}
                >
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => openPreview(product)}
                      aria-label={`View ${product.name}`}
                      className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-[#B89A5A]/30 bg-[#1C1B18]"
                    >
                      {product.images?.[0]?.image_url ? (
                        <img
                          src={product.images[0].image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#706C61]">
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
                          <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-[#F4F0E6]">
                            {product.name}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-[#928C7E]">
                            SKU: {skuOf(product)}
                          </p>
                        </button>
                        <div className="-mr-1 -mt-1 flex shrink-0 items-center gap-1">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => toggleOne(product.id)}
                            aria-label={`Select ${product.name}`}
                            className="h-4 w-4 accent-[#B89A5A]"
                          />
                          {moreMenu(product)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 items-center gap-x-3 gap-y-2.5 border-t border-[#B89A5A]/15 pt-3">
                    <div>{priceView(product)}</div>
                    <p className="text-right text-xs text-[#BEB7A5]">
                      Stock:{" "}
                      <span className={`font-semibold tabular-nums ${stockClr(stock)}`}>{stock}</span>
                    </p>
                    <p className="min-w-0 truncate text-xs text-[#BEB7A5]">
                      {product.category_label || "Uncategorized"}
                    </p>
                    <div className="flex justify-end">{statusBadge(product, true)}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#B89A5A]/55 text-[13px] font-semibold text-[#C8A96B] transition active:scale-[.98] hover:bg-[#B89A5A]/10"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Product
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#B89A5A]/20 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-center text-[12px] text-[#BEB7A5] sm:text-left">
              Showing {start + 1} to {Math.min(start + perPage, filtered.length)} of{" "}
              {filtered.length} products
            </span>

            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, safePage - 1))}
                disabled={safePage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#B89A5A]/30 bg-[#312F2A] text-[#C8A96B] transition hover:border-[#C8A96B]/70 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Previous page"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1).map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setPage(n)}
                  className={`h-9 min-w-9 rounded-md border px-2 text-xs font-semibold transition ${
                    n === safePage
                      ? `border-transparent ${goldBtn}`
                      : "border-[#B89A5A]/20 bg-[#312F2A] text-[#F4F0E6] hover:border-[#C8A96B]/60"
                  }`}
                >
                  {n}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage(Math.min(pageCount, safePage + 1))}
                disabled={safePage === pageCount}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#B89A5A]/30 bg-[#312F2A] text-[#C8A96B] transition hover:border-[#C8A96B]/70 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Next page"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE FILTER SHEET (same filters, same handlers) */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <div className="kv-pop absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-2xl border border-b-0 border-[#B89A5A]/40 bg-gradient-to-b from-[#2A2824] to-[#131210] p-5 pb-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#F4F0E6]">Filters</h3>
              <button
                onClick={() => setFiltersOpen(false)}
                className="rounded-full border border-[#B89A5A]/40 p-2 text-[#C8A96B]"
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
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C8A96B]" />
            </div>

            <label className={`${labelCls} mt-4`}>Status</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "", l: "All Status" },
                { v: "active", l: "Active" },
                { v: "inactive", l: "Inactive" },
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
                  className={`h-11 rounded-lg border text-xs font-semibold transition ${
                    statusFilter === opt.v
                      ? "border-[#C8A96B] bg-[#B89A5A]/20 text-[#F4F0E6]"
                      : "border-[#B89A5A]/25 bg-[#1C1B18] text-[#BEB7A5]"
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>

            <label className={`${labelCls} mt-4`}>Sort by</label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className={inputCls + " appearance-none pr-9"}
              >
                <option value="default">Default</option>
                <option value="newest">Newest first</option>
                <option value="name">Name A–Z</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="stock_asc">Stock: low to high</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C8A96B]" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCategory("");
                  setTagFilter("");
                  setStatusFilter("");
                  setSortBy("default");
                  setPage(1);
                }}
                className="h-12 rounded-lg border border-[#B89A5A]/50 bg-[#1C1B18] text-sm font-semibold text-[#C8A96B] transition hover:bg-[#B89A5A]/10"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  loadProducts();
                  setFiltersOpen(false);
                }}
                className={`h-12 rounded-lg text-sm font-bold transition active:scale-[.98] ${goldBtn}`}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING SELECTION BAR */}
      {selected.length > 0 && (
        <div className="fixed inset-x-3 bottom-20 z-40 flex items-center justify-between gap-3 rounded-xl border border-[#B89A5A]/50 bg-[#1C1B18] px-4 py-2.5 text-sm text-[#F4F0E6] shadow-[0_16px_40px_-10px_rgba(0,0,0,0.9)] sm:bottom-3 sm:left-1/2 sm:right-auto sm:inset-x-auto sm:-translate-x-1/2 sm:justify-center sm:rounded-full sm:pl-6 sm:pr-2.5">
          <span className="tabular-nums">{selected.length} selected</span>
          {selectedOne && (
            <button
              onClick={() => openEdit(selectedOne)}
              className="rounded-full border border-[#B89A5A]/50 bg-[#B89A5A]/10 px-4 py-1.5 text-[#C8A96B] transition hover:bg-[#B89A5A]/25"
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
            className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[430px] flex-col border-l border-[#B89A5A]/35 bg-gradient-to-b from-[#1C1B18] to-[#131210] shadow-[-24px_0_70px_-20px_rgba(0,0,0,.9)]"
            aria-label="Product details"
          >
            <div className="flex items-center justify-between border-b border-[#B89A5A]/20 px-5 py-4">
              <div>
                <p className="font-serif text-lg font-semibold text-[#F4F0E6]">Product details</p>
                <p className="mt-0.5 text-xs text-[#928C7E]">
                  Catalog / {previewProduct.category_label || "Uncategorized"}
                </p>
              </div>

              <button
                onClick={() => setPreviewProduct(null)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#B89A5A]/40 bg-[#2A2824] text-[#C8A96B] transition hover:bg-[#B89A5A] hover:text-[#131210]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="p-5">
                <div className="relative overflow-hidden rounded-xl border border-[#B89A5A]/25 bg-[#131210]">
                  {previewImages.length ? (
                    <img
                      src={previewImages[previewImageIndex]?.image_url || previewImages[0].image_url}
                      alt={previewProduct.name}
                      className="aspect-[4/4.35] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/4.35] items-center justify-center text-[#706C61]">
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
                        aria-label="Previous image"
                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#B89A5A]/50 bg-black/70 text-[#C8A96B] backdrop-blur"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          setPreviewImageIndex((i) =>
                            i === previewImages.length - 1 ? 0 : i + 1
                          )
                        }
                        aria-label="Next image"
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#B89A5A]/50 bg-black/70 text-[#C8A96B] backdrop-blur"
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
                        className={`h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-[#1C1B18] ${
                          index === previewImageIndex ? "border-[#C8A96B]" : "border-transparent"
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
                      <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#F4F0E6]">
                        {previewProduct.name}
                      </h2>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[#928C7E]">
                        <span className="truncate">SKU: {skuOf(previewProduct)}</span>
                        <button
                          onClick={() => navigator.clipboard?.writeText(skuOf(previewProduct))}
                          className="rounded p-1 transition hover:bg-[#B89A5A]/15"
                          title="Copy SKU"
                          aria-label="Copy SKU"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                        previewStatus === "Active"
                          ? "border-[#B89A5A]/35 bg-[#46433C]/70 text-[#E9E0CA]"
                          : previewStatus === "Low Stock"
                            ? "border-[#E0A24A]/40 bg-[#E0A24A]/10 text-[#E0A24A]"
                            : "border-red-400/40 bg-red-500/10 text-red-300"
                      }`}
                    >
                      {previewStatus}
                    </span>
                  </div>

                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-[25px] font-semibold tabular-nums text-[#C8A96B]">₹{inr(previewPrice)}</span>
                    {previewProduct.mrp && previewProduct.mrp > previewPrice && (
                      <span className="pb-1 text-sm text-[#928C7E] line-through">
                        ₹{inr(previewProduct.mrp)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 divide-y divide-[#B89A5A]/15 rounded-xl border border-[#B89A5A]/20 bg-[#2A2824]/50">
                  <div className="flex items-center justify-between gap-3 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <PackageCheck className="h-5 w-5 text-[#C8A96B]" />
                      <div>
                        <p className="text-sm font-medium text-[#F4F0E6]">Inventory</p>
                        <p className="text-xs text-[#928C7E]">
                          {previewStock === 0 ? "No units available" : `${previewStock} units available`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => openEdit(previewProduct)}
                      className="rounded-lg border border-[#B89A5A]/50 px-3 py-2 text-xs font-medium text-[#C8A96B] transition hover:bg-[#B89A5A]/15"
                    >
                      Manage
                    </button>
                  </div>

                  <div className="flex items-start gap-3 px-4 py-4">
                    <Tag className="mt-0.5 h-5 w-5 text-[#C8A96B]" />
                    <div>
                      <p className="text-sm font-medium text-[#F4F0E6]">Category</p>
                      <p className="mt-0.5 text-xs text-[#928C7E]">
                        {previewProduct.category_label || "Uncategorized"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 px-4 py-4">
                    <Layers3 className="mt-0.5 h-5 w-5 text-[#C8A96B]" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#F4F0E6]">Collections & tags</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {previewProduct.best_seller && <Badge label="Best Seller" tone="amber" />}
                        {previewProduct.new_arrival && <Badge label="New" tone="blue" />}
                        {previewProduct.trending && <Badge label="Trending" tone="pink" />}
                        {previewProduct.limited_edition && <Badge label="Limited" tone="violet" />}
                        {!previewProduct.best_seller &&
                          !previewProduct.new_arrival &&
                          !previewProduct.trending &&
                          !previewProduct.limited_edition && (
                            <span className="text-xs text-[#706C61]">No tags assigned</span>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[#F4F0E6]">Variants</p>
                      <span className="text-xs text-[#928C7E]">
                        {previewProduct.variants?.length || 0} variants
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(previewProduct.variants || []).slice(0, 8).map((variant, index) => (
                        <div
                          key={variant.id || index}
                          className="min-w-[76px] rounded-lg border border-[#B89A5A]/25 bg-[#131210] px-3 py-2"
                        >
                          <p className="text-xs font-semibold text-[#F4F0E6]">
                            {variant.size || "—"} · {variant.color || "—"}
                          </p>
                          <p className="mt-0.5 text-[10px] text-[#928C7E]">
                            {variant.inventory} stock
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {previewProduct.description && (
                  <div className="mt-5">
                    <p className="text-sm font-medium text-[#C8A96B]">Description</p>
                    <p className="mt-2 text-sm leading-6 text-[#BEB7A5]">
                      {previewProduct.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[#B89A5A]/20 bg-[#131210] p-4">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => openEdit(previewProduct)}
                  className={`flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-bold transition ${goldBtn}`}
                >
                  <Pencil className="h-4 w-4" />
                  Edit Product
                </button>
                <button
                  onClick={() => setPreviewProduct(null)}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#B89A5A]/50 bg-transparent text-sm font-medium text-[#C8A96B] transition hover:bg-[#B89A5A]/10"
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
          <div className="kv-pop flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden border border-[#B89A5A]/40 bg-gradient-to-br from-[#1C1B18] via-[#171614] to-[#131210] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.95)] sm:h-auto sm:max-h-[92vh] sm:rounded-2xl">
            {/* header */}
            <div className="flex items-center justify-between gap-3 border-b border-[#B89A5A]/25 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="truncate font-serif text-2xl font-semibold text-[#F4F0E6]">
                  {editingId ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="truncate text-xs text-[#928C7E]">
                  {editingId
                    ? "Update this product in your store"
                    : "Create a new product for your store"}
                </p>
              </div>

              <button
                onClick={() => setModal(false)}
                aria-label="Close"
                className="shrink-0 rounded-full border border-[#B89A5A]/30 p-2 text-[#C8A96B] transition hover:bg-[#B89A5A]/15 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* mobile section chips */}
            <div className="flex gap-2 overflow-x-auto border-b border-[#B89A5A]/15 px-4 py-2.5 md:hidden">
              {formSections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => jumpTo(s.id)}
                  className="shrink-0 rounded-full border border-[#B89A5A]/35 bg-[#B89A5A]/[0.07] px-3.5 py-1.5 text-[11px] font-medium text-[#C8A96B] transition active:bg-[#B89A5A]/20"
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="grid min-h-0 flex-1 md:grid-cols-[200px_1fr]">
              {/* desktop section rail */}
              <nav className="hidden border-r border-[#B89A5A]/20 bg-[#131210]/60 p-3 md:block">
                <div className="space-y-1.5">
                  {formSections.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => jumpTo(s.id)}
                      className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition hover:border-[#B89A5A]/35 hover:bg-[#B89A5A]/[0.07]"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#B89A5A]/40 text-[10px] font-semibold text-[#C8A96B]">
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium text-[#F4F0E6]">
                          {s.label}
                        </span>
                        <span className="block truncate text-[10px] text-[#928C7E]">
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
                  <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#B89A5A]/45 bg-[#131210] px-4 py-8 text-center transition hover:border-[#C8A96B] hover:bg-[#B89A5A]/[0.05]">
                    <UploadCloud className="h-8 w-8 text-[#C8A96B] transition group-hover:scale-110" />
                    <span className="text-sm font-medium text-[#F4F0E6]">
                      Click to upload images
                    </span>
                    <span className="text-xs text-[#928C7E]">
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
                      <p className="text-xs font-medium text-[#BEB7A5]">
                        {files.length} image{files.length > 1 ? "s" : ""} selected
                      </p>

                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                        {files.map((file, index) => (
                          <div
                            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                            className="group relative overflow-hidden rounded-lg border border-[#B89A5A]/30 bg-[#1C1B18]"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-[#B89A5A]/60 bg-black/80 text-[#C8A96B] transition hover:bg-red-500 hover:text-white"
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <p className="truncate bg-black/70 px-2 py-1 text-[10px] text-[#BEB7A5]">
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
                  <div className="mt-5 rounded-xl border border-[#B89A5A]/25 bg-[#2A2824]/40 p-3.5 sm:p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-serif text-lg font-semibold text-[#F4F0E6]">Variants</h3>
                        <p className="text-xs text-[#928C7E]">Size, color and stock</p>
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
                        <p className="rounded-lg border border-dashed border-[#B89A5A]/25 px-3 py-4 text-center text-xs text-[#928C7E]">
                          No variants added yet.
                        </p>
                      )}

                      {form.variants.map((variant, index) => (
                        <div
                          key={variant.id || index}
                          className="grid grid-cols-2 gap-2 rounded-lg border border-[#B89A5A]/15 p-2.5 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:border-0 md:p-0"
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
            <div className="flex justify-end gap-2.5 border-t border-[#B89A5A]/25 bg-[#131210] px-4 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:gap-3 sm:px-6">
              <button
                onClick={() => setModal(false)}
                disabled={saving}
                className="min-h-11 flex-1 rounded-lg border border-[#B89A5A]/50 bg-transparent px-5 py-2.5 text-sm font-semibold text-[#C8A96B] transition hover:bg-[#B89A5A]/10 disabled:opacity-50 sm:flex-none sm:px-8"
              >
                Cancel
              </button>

              <button
                onClick={saveProduct}
                disabled={saving}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition active:scale-[0.98] disabled:opacity-60 sm:flex-none sm:px-8 ${goldBtn}`}
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
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-4 sm:right-5 sm:items-end">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border bg-[#1C1B18] p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] transition ${
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

            <p className="flex-1 text-sm text-[#F4F0E6]">{toast.message}</p>

            <button
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss"
              className="text-[#928C7E] transition hover:text-[#F4F0E6]"
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
      className="scroll-mt-2 border-b border-[#B89A5A]/15 pb-6 pt-1 first:pt-0 last:border-0 last:pb-2 [&:not(:first-child)]:mt-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#B89A5A]/45 bg-[#B89A5A]/10 text-[11px] font-semibold text-[#C8A96B]">
          {n}
        </span>
        <h3 className="font-serif text-xl font-semibold text-[#F4F0E6]">{title}</h3>
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
          ? "border-[#C8A96B] bg-[#B89A5A]/20 text-[#F4F0E6]"
          : "border-[#B89A5A]/25 bg-[#131210] text-[#BEB7A5] hover:border-[#B89A5A]/60 hover:text-[#C8A96B]"
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
  // palette-safe tones (no blue/purple): gold, green, clay, sand
  const tones: Record<string, string> = {
    amber: "border-[#B89A5A]/45 bg-[#B89A5A]/10 text-[#C8A96B]",
    blue: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
    pink: "border-[#C98B7A]/40 bg-[#C98B7A]/10 text-[#E5B3A5]",
    violet: "border-[#BEB7A5]/30 bg-[#BEB7A5]/10 text-[#E4DBC5]",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}
    >
      {label}
    </span>
  );
}