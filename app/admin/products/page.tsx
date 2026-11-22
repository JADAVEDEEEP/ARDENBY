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
  Lock,
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
  best_seller: false,
  new_arrival: false,
  trending: false,
  limited_edition: false,
  variants: [] as Variant[],
};

/* shared UI tokens (presentation only) — KOVENIK black / white / red */
const inputCls =
  "w-full min-h-11 rounded-xl border border-[#E3E5EE] bg-[#FFFFFF] px-3.5 py-2.5 text-[15px] text-[#11162B] outline-none transition duration-200  placeholder:text-[#5A6075] hover:border-[#4338CA]/50 focus:border-[#4338CA] focus:ring-4 focus:ring-[#4338CA]/15";
const labelCls =
  "mb-1.5 block text-[13px] font-medium tracking-[0.08em] text-[#5A6075]";
const primaryBtn =
  "bg-[#4338CA] text-white shadow-sm hover:bg-[#2E2699]";
const panelCls =
  "rounded-xl border border-[#E3E5EE] bg-[#FFFFFF] shadow-[0_8px_24px_rgba(0,0,0,0.25)]";
const selectCls =
  "h-11 w-full cursor-pointer appearance-none rounded-lg border border-[#E3E5EE] bg-[#FFFFFF] pl-3.5 pr-9 text-[15px] text-[#11162B] outline-none transition duration-200  hover:border-[#4338CA]/55 focus:border-[#4338CA] focus:ring-4 focus:ring-[#4338CA]/15";

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

      if (form.variants.some((v) => !v.size.trim() || !v.color.trim())) {
        pushToast("error", "Every variant needs a size and a colour");
        return;
      }

      if (duplicateVariantRows.size > 0) {
        pushToast("error", "Two variants share the same size and colour");
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

  // Quick-add: new row with the given size, reusing the last colour used.
  const addVariantSize = (size: string) => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          size,
          color: prev.variants[prev.variants.length - 1]?.color || "",
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

  // Total stock = sum of variant stock (the API sends the same figure).
  const stockOf = (p: Product) =>
    p.variants && p.variants.length > 0
      ? p.variants.reduce((n, v) => n + Math.max(0, Number(v.inventory) || 0), 0)
      : Number(p.inventory || 0);
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
          <span className="text-[15px] font-semibold tabular-nums text-[#11162B]">₹{inr(priceOf(p))}</span>
          {p.mrp && p.mrp > priceOf(p) ? (
            <span className="text-[13px] text-[#5A6075] line-through tabular-nums">₹{inr(p.mrp)}</span>
          ) : null}
        </div>
        {off > 0 && (
          <span className="mt-0.5 inline-block text-[13px] font-medium text-[#4338CA]">
            {off}% off
          </span>
        )}
      </div>
    );
  };

  const stockClr = (stock: number) =>
    stock === 0 ? "text-[#4338CA]" : stock <= 5 ? "text-[#4338CA]" : "text-[#17603F]";

  const thumb = (p: Product, cls: string) => (
    <div className={`shrink-0 overflow-hidden rounded-lg border border-[#E3E5EE] bg-[#FFFFFF] ${cls}`}>
      {p.images?.[0]?.image_url ? (
        <img
          src={p.images[0].image_url}
          alt={p.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-[#5A6075]">
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
    { id: "kv-basic", label: "Basic Info", hint: "Name, category, description", icon: Package },
    { id: "kv-images", label: "Images", hint: "Upload product images", icon: UploadCloud },
    { id: "kv-pricing", label: "Pricing", hint: "Price, MRP and best price", icon: Tag },
    { id: "kv-inventory", label: "Inventory", hint: "Stock and variants", icon: Layers3 },
    { id: "kv-details", label: "Details & Tags", hint: "Fabric, care and flags", icon: LayoutGrid },
  ];

  // Product stock is never typed in: it is the sum of the variant stocks
  // (the server recalculates it on every save; this is the live preview).
  const formTotalStock = form.variants.reduce(
    (sum, v) => sum + Math.max(0, Math.floor(Number(v.inventory) || 0)),
    0
  );
  const stockTone = (n: number) => (n <= 0 ? "out" : n <= 5 ? "low" : "ok");

  const duplicateVariantRows = (() => {
    const seen = new Set<string>();
    const dup = new Set<number>();
    form.variants.forEach((v, i) => {
      const size = v.size.trim().toLowerCase();
      const color = v.color.trim().toLowerCase();
      if (!size || !color) return;
      const key = `${size}|${color}`;
      if (seen.has(key)) dup.add(i);
      else seen.add(key);
    });
    return dup;
  })();

  const [activeSection, setActiveSection] = useState("kv-basic");
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const onModalScroll = () => {
    const body = modalBodyRef.current;
    if (!body) return;
    const top = body.getBoundingClientRect().top + 40;
    let current = formSections[0].id;
    for (const sec of formSections) {
      const el = document.getElementById(sec.id);
      if (el && el.getBoundingClientRect().top <= top) current = sec.id;
    }
    if (body.scrollTop + body.clientHeight >= body.scrollHeight - 4) {
      current = formSections[formSections.length - 1].id;
    }
    setActiveSection(current);
  };
  const jumpTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const statusBadge = (p: Product, small = false) => {
    const active = isActive(p);
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${
          small ? "px-2.5 py-1 text-[13px]" : "px-3 py-1 text-[13px]"
        } ${
          active
            ? "border-[#17603F]/40 bg-[#17603F]/10 text-[#17603F]"
            : "border-[#9A2C1F]/30 bg-[#FBE3DF]/10 text-[#4338CA]"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#17603F]" : "bg-[#FBE3DF]"}`} />
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
        className="flex h-10 w-9 items-center justify-center rounded-lg border border-[#E3E5EE] bg-[#FFFFFF] text-[#5A6075] outline-none transition hover:border-[#E3E5EE] hover:text-[#11162B] focus-visible:ring-2 focus-visible:ring-[#4338CA]"
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
            className={`absolute right-0 z-40 w-44 overflow-hidden rounded-lg border border-[#E3E5EE] bg-[#FFFFFF] py-1 shadow-[0_8px_24px_rgba(16,24,40,0.12)] ${
              up ? "bottom-full mb-1.5" : "top-full mt-1.5"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setMenuId(null);
                openPreview(p);
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-[#11162B] transition hover:bg-[#4338CA]/10"
            >
              <Eye className="h-3.5 w-3.5 text-[#4338CA]" />
              View details
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuId(null);
                deleteProduct(p.id);
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-[#4338CA] transition hover:bg-[#FBE3DF]/8"
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
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#4338CA]/55 bg-transparent text-[#4338CA] outline-none transition hover:bg-[#4338CA] hover:text-white focus-visible:ring-2 focus-visible:ring-[#4338CA]"
    >
      <Pencil className="h-4 w-4" />
    </button>
  );

  return (
    <div className="kv-scope mx-auto w-full max-w-7xl overflow-x-hidden pb-10 text-[#11162B]">
      <style>{`
        @keyframes kv-pop { from { opacity: 0; transform: translateY(14px) scale(.985); } to { opacity: 1; transform: none; } }
        .kv-pop { animation: kv-pop .35s cubic-bezier(.2,.7,.2,1) both; }
        @media (prefers-reduced-motion: reduce) { .kv-pop { animation: none; } }
        /* ---------- Products page: readable dark surfaces ---------- */
        .kv-scope input:not([type="checkbox"]):not([type="file"]), .kv-scope select, .kv-scope textarea { background: #FFFFFF !important; color: #11162B !important; border-color: #E3E5EE !important; }
        .kv-scope select option { background: #FFFFFF; color: #11162B; }
        .kv-scope input::placeholder, .kv-scope textarea::placeholder { color: #5A6075 !important; opacity: 1; }
        .kv-scope input[type="checkbox"] { accent-color: #4338CA; width: 18px; height: 18px; cursor: pointer; }
        /* ---------- KOVENIK product modal ---------- */
        .kvm-overlay { position: fixed; inset: 0; z-index: 80; display: flex; align-items: flex-end; justify-content: center; background: rgba(0,0,0,.78); backdrop-filter: blur(4px); }
        .kvm-dialog { display: flex; flex-direction: column; width: 100%; height: 100dvh; overflow: hidden; background: #FFFFFF; border: 1px solid #E3E5EE; color: #11162B; box-shadow: 0 24px 64px rgba(0,0,0,.6); }
        @media (min-width: 640px) { .kvm-overlay { align-items: center; padding: 24px; } .kvm-dialog { height: auto; max-height: 92vh; max-width: 1040px; border-radius: 18px; } }
        .kvm-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 24px 18px; border-bottom: 1px solid #E3E5EE; background: linear-gradient(180deg,#FFFFFF,#FFFFFF); position: relative; }
        .kvm-header::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #4338CA; }
        .kvm-header-text { min-width: 0; }
        .kvm-eyebrow { display: block; font-size: 12px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: #4338CA; }
        .kvm-title { margin: 4px 0 0; font-size: 22px; line-height: 1.2; font-weight: 700; color: #11162B !important; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .kvm-sub { margin: 3px 0 0; font-size: 14px; color: #5A6075; }
        .kvm-close { flex-shrink: 0; width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; border: 1px solid #E3E5EE; background: transparent; color: #11162B; cursor: pointer; transition: .2s; }
        .kvm-close:hover { border-color: #4338CA; color: #11162B; background: rgba(67,56,202,.15); }
        .kvm-layout { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        @media (min-width: 768px) { .kvm-layout { display: grid; grid-template-columns: 252px 1fr; } }
        /* navigation */
        .kvm-nav { display: flex; gap: 8px; overflow-x: auto; padding: 10px 16px; border-bottom: 1px solid #E3E5EE; background: #FFFFFF; }
        .kvm-step { flex-shrink: 0; display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 12px; border: 1px solid transparent; background: transparent; color: #5A6075; text-align: left; cursor: pointer; transition: .2s; }
        .kvm-step:hover { background: #FFFFFF; border-color: #E3E5EE; }
        .kvm-step[data-active="true"] { background: #FFFFFF; border-color: rgba(67,56,202,.55); color: #11162B; }
        .kvm-step-num { width: 26px; height: 26px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; border: 1px solid #E3E5EE; font-size: 13px; font-weight: 700; color: #11162B; transition: .2s; }
        .kvm-step[data-active="true"] .kvm-step-num { background: #4338CA; border-color: #4338CA; color: #11162B; }
        .kvm-step-text { display: flex; flex-direction: column; min-width: 0; }
        .kvm-step-label { font-size: 14px; font-weight: 600; color: inherit; white-space: nowrap; }
        .kvm-step-hint, .kvm-step-icon { display: none; }
        .kvm-nav-stock { display: none; }
        @media (min-width: 768px) {
          .kvm-nav { flex-direction: column; gap: 6px; overflow: auto; padding: 16px 14px; border-bottom: 0; border-right: 1px solid #E3E5EE; }
          .kvm-step { padding: 11px 12px; }
          .kvm-step-text { flex: 1; }
          .kvm-step-hint { display: block; font-size: 13px; color: #5A6075; margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .kvm-step-icon { display: block; color: #5A6075; }
          .kvm-step[data-active="true"] .kvm-step-icon { color: #4338CA; }
          .kvm-nav-stock { display: flex; flex-direction: column; gap: 2px; margin-top: auto; padding: 14px; border-radius: 14px; border: 1px solid #E3E5EE; background: #FFFFFF; }
          .kvm-nav-stock-label { font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: #5A6075; font-weight: 600; }
          .kvm-nav-stock-value { font-size: 30px; font-weight: 800; line-height: 1.1; color: #11162B; font-variant-numeric: tabular-nums; }
          .kvm-nav-stock-note { font-size: 13px; color: #5A6075; }
        }
        [data-tone="low"] { color: #4338CA; } [data-tone="out"] { color: #4338CA; } [data-tone="ok"] { color: #11162B; }
        /* body + cards */
        .kvm-body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; background: #FFFFFF; scroll-behavior: smooth; }
        @media (min-width: 640px) { .kvm-body { padding: 24px; } }
        .kvm-card { padding: 20px; border: 1px solid #E3E5EE; border-radius: 16px; background: #FFFFFF; }
        .kvm-card + .kvm-card { margin-top: 16px; }
        .kvm-card-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
        .kvm-card-num { width: 28px; height: 28px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; background: rgba(67,56,202,.14); border: 1px solid rgba(67,56,202,.4); font-size: 14px; font-weight: 700; color: #4338CA; }
        .kvm-card-title { margin: 0; font-size: 17px; font-weight: 700; color: #11162B !important; }
        .kvm-card-desc { margin: 2px 0 0; font-size: 14px; color: #5A6075; }
        .kvm-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
        @media (min-width: 640px) { .kvm-grid-2 { grid-template-columns: 1fr 1fr; } .kvm-grid-3 { grid-template-columns: repeat(3,1fr); } .kvm-span-2 { grid-column: span 2; } }
        .kvm-mt { margin-top: 16px; }
        .kvm-field { min-width: 0; }
        .kvm-label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #5A6075 !important; }
        .kv-scope .kvm-input { width: 100%; min-height: 44px; padding: 10px 14px; border-radius: 10px; border: 1px solid #E3E5EE !important; background: #FFFFFF !important; color: #11162B !important; font-size: 15px; outline: none; transition: border-color .2s, box-shadow .2s; box-sizing: border-box; }
        .kv-scope .kvm-input::placeholder { color: #5A6075 !important; }
        .kv-scope .kvm-input:hover { border-color: #E3E5EE !important; }
        .kv-scope .kvm-input:focus { border-color: #4338CA !important; box-shadow: 0 0 0 3px rgba(67,56,202,.18); }
        .kvm-textarea { resize: vertical; min-height: 110px; line-height: 1.5; }
        .kv-scope .kvm-select { appearance: none; padding-right: 38px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239A9EA8' stroke-width='3'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; cursor: pointer; }
        .kvm-hint { margin: 0; font-size: 12.5px; color: #5A6075; }
        .kvm-h4 { margin: 0; font-size: 15px; font-weight: 700; color: #11162B !important; }
        /* images */
        .kvm-drop { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 28px 16px; text-align: center; border: 1.5px dashed #E3E5EE; border-radius: 14px; background: #FFFFFF; color: #4338CA; cursor: pointer; transition: .2s; }
        .kvm-drop:hover { border-color: #4338CA; background: rgba(67,56,202,.05); }
        .kvm-drop-title { font-size: 15px; font-weight: 600; color: #11162B; }
        .kvm-drop-note { font-size: 12.5px; color: #5A6075; }
        .kvm-thumbs { display: grid; gap: 10px; grid-template-columns: repeat(3,1fr); margin-top: 10px; }
        @media (min-width: 640px) { .kvm-thumbs { grid-template-columns: repeat(5,1fr); } }
        .kvm-thumb { position: relative; overflow: hidden; border-radius: 10px; border: 1px solid #E3E5EE; background: #FFFFFF; }
        .kvm-thumb img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; }
        .kvm-thumb-name { margin: 0; padding: 5px 8px; font-size: 12px; color: #5A6075; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .kvm-thumb-x { position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; border: 1px solid rgba(255,255,255,.2); background: rgba(0,0,0,.75); color: #11162B; cursor: pointer; }
        .kvm-thumb-x:hover { background: #4338CA; }
        .kvm-thumb-cover { position: absolute; top: 6px; left: 6px; padding: 2px 8px; border-radius: 999px; background: #4338CA; color: #11162B; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
        /* stock summary + variants */
        .kvm-total { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-radius: 12px; border: 1px solid #E3E5EE; background: #FFFFFF; }
        .kvm-total-label { display: block; font-size: 12px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #5A6075; }
        .kvm-total-note { display: inline-flex; align-items: center; gap: 5px; margin-top: 3px; font-size: 12.5px; color: #5A6075; }
        .kvm-total-value { font-size: 32px; font-weight: 800; line-height: 1; color: #11162B; font-variant-numeric: tabular-nums; }
        .kvm-total-value small { margin-left: 6px; font-size: 13px; font-weight: 600; color: #5A6075; }
        .kvm-variants { margin-top: 16px; padding: 16px; border-radius: 14px; border: 1px solid #E3E5EE; background: #FFFFFF; }
        .kvm-variants-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .kvm-vcols { display: none; }
        .kvm-vlist { display: flex; flex-direction: column; gap: 10px; }
        .kvm-vrow { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px; border-radius: 12px; border: 1px solid #E3E5EE; background: #FFFFFF; }
        .kvm-vrow[data-dup="true"] { border-color: rgba(67,56,202,.6); }
        .kvm-vcell { display: block; min-width: 0; }
        .kvm-vlabel { display: block; margin-bottom: 4px; font-size: 10.5px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: #5A6075; }
        .kvm-vdel { grid-column: span 2; min-height: 40px; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; border: 1px solid #E3E5EE; background: transparent; color: #4338CA; cursor: pointer; transition: .2s; }
        .kvm-vdel:hover { background: rgba(67,56,202,.15); border-color: #4338CA; }
        .kvm-vwarn { grid-column: 1 / -1; margin: 0; font-size: 13px; color: #4338CA; }
        .kv-scope .kvm-stock { font-weight: 700; font-variant-numeric: tabular-nums; }
        .kv-scope .kvm-stock[data-tone="low"] { color: #4338CA !important; } .kv-scope .kvm-stock[data-tone="out"] { color: #4338CA !important; }
        @media (min-width: 768px) {
          .kvm-vcols, .kvm-vrow { grid-template-columns: 1fr 1fr 110px 1.1fr 44px; gap: 10px; }
          .kvm-vcols { display: grid; padding: 0 12px 8px; font-size: 10.5px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: #5A6075; }
          .kvm-vrow { align-items: center; padding: 10px 12px; }
          .kvm-vlabel { display: none; }
          .kvm-vdel { grid-column: auto; width: 44px; min-height: 44px; }
        }
        .kvm-empty { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 26px 16px; text-align: center; border: 1px dashed #E3E5EE; border-radius: 12px; color: #5A6075; }
        .kvm-empty p { margin: 4px 0 0; font-size: 15px; font-weight: 600; color: #11162B; } .kvm-empty span { font-size: 12.5px; }
        .kvm-quick { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 14px; font-size: 13px; color: #5A6075; }
        .kvm-chip { padding: 5px 12px; border-radius: 999px; border: 1px solid #E3E5EE; background: transparent; color: #11162B; font-size: 13px; font-weight: 600; cursor: pointer; transition: .2s; }
        .kvm-chip:hover { border-color: #4338CA; color: #11162B; background: rgba(67,56,202,.12); }
        /* flags */
        .kvm-flags { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (min-width: 640px) { .kvm-flags { grid-template-columns: repeat(4,1fr); } }
        .kvm-toggle { position: relative; display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 14px; border-radius: 10px; border: 1px solid #E3E5EE; background: #FFFFFF; color: #11162B; font-size: 14px; font-weight: 600; cursor: pointer; transition: .2s; }
        .kvm-toggle input { position: absolute; opacity: 0; pointer-events: none; }
        .kvm-toggle:hover { border-color: #E3E5EE; }
        .kvm-toggle-box { width: 18px; height: 18px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 5px; border: 1.5px solid #E3E5EE; color: #11162B; }
        .kvm-toggle[data-on="true"] { border-color: #4338CA; background: rgba(67,56,202,.1); color: #11162B; }
        .kvm-toggle[data-on="true"] .kvm-toggle-box { background: #4338CA; border-color: #4338CA; }
        .kvm-toggle input:focus-visible + .kvm-toggle-box { box-shadow: 0 0 0 3px rgba(67,56,202,.3); }
        /* footer + buttons */
        .kvm-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px calc(14px + env(safe-area-inset-bottom)); border-top: 1px solid #E3E5EE; background: #FFFFFF; }
        @media (min-width: 640px) { .kvm-footer { padding: 14px 24px; } }
        .kvm-footer-stock { display: none; align-items: baseline; gap: 8px; font-size: 13px; letter-spacing: .1em; text-transform: uppercase; color: #5A6075; }
        .kvm-footer-stock strong { font-size: 18px; letter-spacing: 0; color: #11162B; font-variant-numeric: tabular-nums; }
        @media (max-width: 767px) { .kvm-footer-stock { display: flex; } }
        .kvm-footer-actions { display: flex; gap: 10px; margin-left: auto; }
        .kvm-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 24px; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: .2s; border: 1px solid transparent; }
        .kvm-btn:disabled { opacity: .55; cursor: not-allowed; }
        .kv-scope .kvm-btn-red { background: #4338CA !important; color: #11162B !important; } .kv-scope .kvm-btn-red:hover:not(:disabled) { background: #2E2699 !important; }
        .kv-scope .kvm-btn-ghost { background: transparent !important; border-color: #E3E5EE; color: #11162B !important; } .kv-scope .kvm-btn-ghost:hover:not(:disabled) { border-color: #FFFFFF; }
        .kvm-btn-sm { min-height: 36px; padding: 0 14px; font-size: 12.5px; }
        .kvm-dialog button:focus-visible { outline: 2px solid #4338CA; outline-offset: 2px; }
        .kv-scope ::selection { background: rgba(67,56,202,.3); color: #11162B; }
        .kv-scope * { scrollbar-width: thin; scrollbar-color: #5A6075 transparent; }
        .kv-scope *::-webkit-scrollbar { width: 7px; height: 7px; }
        .kv-scope *::-webkit-scrollbar-thumb { background: #FFFFFF; border-radius: 999px; }
        .kv-scope *::-webkit-scrollbar-track { background: transparent; }
        .kv-scope button, .kv-scope a, .kv-scope input, .kv-scope select, .kv-scope textarea { -webkit-tap-highlight-color: transparent; }
        @media (max-width: 639px) {
          .kv-scope input, .kv-scope select, .kv-scope textarea { font-size: 16px; }
        }
      `}</style>

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 style={{ color: "#11162B" }} className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Product Management
          </h2>
          <p style={{ color: "#5A6075" }} className="mt-1.5 text-[15px]">
            Manage your products, variants, inventory and more.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg px-5 text-[15px] font-semibold outline-none transition active:scale-[.98] focus-visible:ring-2 focus-visible:ring-[#4338CA] sm:w-auto ${primaryBtn}`}
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
              className={`${panelCls} flex items-center gap-3 p-3.5 transition-colors duration-300 hover:border-[#E3E5EE] sm:gap-4 sm:p-4`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#E3E5EE] bg-[#FFFFFF] text-[#4338CA] sm:h-12 sm:w-12">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-[#11162B]">{s.label}</p>
                <p className="mt-0.5 text-3xl font-semibold leading-none tabular-nums text-[#11162B]">
                  {loading && products.length === 0 ? "—" : s.value}
                </p>
                <p className="mt-1 hidden truncate text-[13px] text-[#5A6075] sm:block">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* TOOLBAR */}
      <div className="mt-5 flex gap-2 lg:hidden">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4338CA]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadProducts();
            }}
            placeholder="Search products..."
            className="h-11 w-full rounded-lg border border-[#E3E5EE] bg-[#FFFFFF] pl-9 pr-3 text-[15px] text-[#11162B] outline-none transition placeholder:text-[#5A6075] hover:border-[#4338CA]/55 focus:border-[#4338CA] focus:ring-4 focus:ring-[#4338CA]/15"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          aria-label="Open filters"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${primaryBtn}`}
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 hidden items-center gap-3 lg:flex">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4338CA]" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadProducts();
            }}
            placeholder="Search products by name, SKU..."
            className="h-11 w-full rounded-lg border border-[#E3E5EE] bg-[#FFFFFF] pl-10 pr-10 text-[15px] text-[#11162B] outline-none transition placeholder:text-[#5A6075] hover:border-[#4338CA]/55 focus:border-[#4338CA] focus:ring-4 focus:ring-[#4338CA]/15"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded border border-[#E3E5EE] text-[13px] text-[#5A6075]">
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
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4338CA]" />
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
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4338CA]" />
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
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4338CA]" />
        </div>

        <button
          type="button"
          onClick={loadProducts}
          className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-5 text-[15px] font-semibold transition active:scale-[.98] ${primaryBtn}`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filter
        </button>
      </div>

      {/* LIST PANEL */}
      <div className={`${panelCls} mt-4 overflow-hidden`}>
        {/* active filter chips + selection */}
        {(chips.length > 0 || selected.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[#E3E5EE] px-3 py-2.5 sm:px-4">
            {chips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.clear}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E3E5EE] bg-[#4338CA]/10 px-3 py-1 text-[13px] text-[#4338CA] transition hover:bg-[#4338CA]/20"
              >
                {chip.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            {selected.length > 0 && (
              <span className="ml-auto text-[13px] text-[#5A6075]">{selected.length} selected</span>
            )}
          </div>
        )}

        {/* loading / empty */}
        {loading && products.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-16 text-[15px] text-[#5A6075]">
            <Loader2 className="h-4 w-4 animate-spin text-[#4338CA]" />
            Loading products...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#E3E5EE] bg-[#FFFFFF] text-[#4338CA]">
              <PackageOpen className="h-6 w-6" />
            </span>
            <p className="text-[15px] font-medium text-[#11162B]">No products found</p>
            <p className="text-[13px] text-[#5A6075]">
              Try a different search or filter, or add a new product.
            </p>
          </div>
        )}

        {/* DESKTOP / TABLET TABLE */}
        {filtered.length > 0 && (
          <div className="hidden overflow-x-auto md:block">
            <div className="min-w-[960px]">
              <div
                className={`grid ${tableGrid} items-center border-b border-[#E3E5EE] bg-[#FFFFFF] px-4 py-3 text-[13px] font-semibold tracking-[0.12em] text-[#4338CA] lg:px-5`}
              >
                <div>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all products"
                    className="h-4 w-4 accent-[#4338CA]"
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

              <div className="divide-y divide-[#E3E5EE]">
                {pageItems.map((product, i) => {
                  const stock = stockOf(product);
                  const isSel = selected.includes(product.id);

                  return (
                    <div
                      key={product.id}
                      className={`grid min-h-[76px] ${tableGrid} items-center px-4 transition-colors hover:bg-[#4338CA]/[0.05] lg:px-5 ${
                        isSel ? "bg-[#4338CA]/[0.08]" : "bg-transparent"
                      }`}
                    >
                      <div>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleOne(product.id)}
                          aria-label={`Select ${product.name}`}
                          className="h-4 w-4 accent-[#4338CA]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => openPreview(product)}
                        className="flex min-w-0 items-center gap-3 py-2 pr-3 text-left outline-none focus-visible:ring-1 focus-visible:ring-[#4338CA]"
                      >
                        {thumb(product, "h-[52px] w-[52px]")}
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-semibold text-[#11162B]">
                            {product.name}
                          </span>
                          <span className="mt-1 block truncate text-[13px] text-[#5A6075]">
                            SKU: {skuOf(product)}
                          </span>
                        </span>
                      </button>

                      <span className="truncate pr-3 text-[13px] text-[#5A6075]">
                        {product.category_label || "Uncategorized"}
                      </span>

                      <div>{priceView(product)}</div>

                      <div>
                        <span className={`text-[15px] font-semibold tabular-nums ${stockClr(stock)}`}>
                          {stock}
                        </span>
                        {stock > 0 && stock <= 5 && (
                          <span className="block text-[13px] text-[#4338CA]">Low</span>
                        )}
                        {stock === 0 && (
                          <span className="block text-[13px] text-[#4338CA]">Out</span>
                        )}
                      </div>

                      <div>{statusBadge(product)}</div>

                      <span className="text-[13px] tabular-nums text-[#5A6075]">{createdOf(product)}</span>

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
                      ? "border-[#E3E5EE] bg-[#4338CA]/[0.08]"
                      : "border-[#E3E5EE] bg-[#FFFFFF]"
                  }`}
                >
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => openPreview(product)}
                      aria-label={`View ${product.name}`}
                      className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-[#E3E5EE] bg-[#FFFFFF]"
                    >
                      {product.images?.[0]?.image_url ? (
                        <img
                          src={product.images[0].image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#5A6075]">
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
                          <p className="line-clamp-2 text-[15px] font-semibold leading-5 text-[#11162B]">
                            {product.name}
                          </p>
                          <p className="mt-0.5 truncate text-[13px] text-[#5A6075]">
                            SKU: {skuOf(product)}
                          </p>
                        </button>
                        <div className="-mr-1 -mt-1 flex shrink-0 items-center gap-1">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => toggleOne(product.id)}
                            aria-label={`Select ${product.name}`}
                            className="h-4 w-4 accent-[#4338CA]"
                          />
                          {moreMenu(product)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 items-center gap-x-3 gap-y-2.5 border-t border-[#E3E5EE] pt-3">
                    <div>{priceView(product)}</div>
                    <p className="text-right text-[13px] text-[#5A6075]">
                      Stock:{" "}
                      <span className={`font-semibold tabular-nums ${stockClr(stock)}`}>{stock}</span>
                    </p>
                    <p className="min-w-0 truncate text-[13px] text-[#5A6075]">
                      {product.category_label || "Uncategorized"}
                    </p>
                    <div className="flex justify-end">{statusBadge(product, true)}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#4338CA]/55 text-[15px] font-semibold text-[#4338CA] transition active:scale-[.98] hover:bg-[#4338CA]/10"
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
          <div className="flex flex-col gap-3 border-t border-[#E3E5EE] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-center text-[13px] text-[#5A6075] sm:text-left">
              Showing {start + 1} to {Math.min(start + perPage, filtered.length)} of{" "}
              {filtered.length} products
            </span>

            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, safePage - 1))}
                disabled={safePage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E3E5EE] bg-[#FFFFFF] text-[#4338CA] transition hover:border-[#4338CA]/70 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Previous page"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1).map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setPage(n)}
                  className={`h-9 min-w-9 rounded-md border px-2 text-[13px] font-semibold transition ${
                    n === safePage
                      ? `border-transparent ${primaryBtn}`
                      : "border-[#E3E5EE] bg-[#FFFFFF] text-[#11162B] hover:border-[#4338CA]/60"
                  }`}
                >
                  {n}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage(Math.min(pageCount, safePage + 1))}
                disabled={safePage === pageCount}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E3E5EE] bg-[#FFFFFF] text-[#4338CA] transition hover:border-[#4338CA]/70 disabled:cursor-not-allowed disabled:opacity-35"
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
          <div className="kv-pop absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-2xl border border-b-0 border-[#E3E5EE] bg-[#FFFFFF] p-5 pb-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#11162B]">Filters</h3>
              <button
                onClick={() => setFiltersOpen(false)}
                className="rounded-full border border-[#E3E5EE] p-2 text-[#4338CA]"
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
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4338CA]" />
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
                  className={`h-11 rounded-lg border text-[13px] font-semibold transition ${
                    statusFilter === opt.v
                      ? "border-[#4338CA] bg-[#4338CA]/20 text-[#11162B]"
                      : "border-[#E3E5EE] bg-[#FFFFFF] text-[#5A6075]"
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
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4338CA]" />
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
                className="h-12 rounded-lg border border-[#E3E5EE] bg-[#FFFFFF] text-[15px] font-semibold text-[#4338CA] transition hover:bg-[#4338CA]/10"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  loadProducts();
                  setFiltersOpen(false);
                }}
                className={`h-12 rounded-lg text-[15px] font-bold transition active:scale-[.98] ${primaryBtn}`}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING SELECTION BAR */}
      {selected.length > 0 && (
        <div className="fixed inset-x-3 bottom-20 z-40 flex items-center justify-between gap-3 rounded-xl border border-[#E3E5EE] bg-[#FFFFFF] px-4 py-2.5 text-[15px] text-[#11162B] shadow-[0_8px_24px_rgba(16,24,40,0.12)] sm:bottom-3 sm:left-1/2 sm:right-auto sm:inset-x-auto sm:-translate-x-1/2 sm:justify-center sm:rounded-full sm:pl-6 sm:pr-2.5">
          <span className="tabular-nums">{selected.length} selected</span>
          {selectedOne && (
            <button
              onClick={() => openEdit(selectedOne)}
              className="rounded-full border border-[#E3E5EE] bg-[#4338CA]/10 px-4 py-1.5 text-[#4338CA] transition hover:bg-[#4338CA]/25"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => setSelected([])}
            className={`rounded-full px-4 py-1.5 font-semibold transition ${primaryBtn}`}
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
            className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[430px] flex-col border-l border-[#E3E5EE] bg-[#FFFFFF] shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
            aria-label="Product details"
          >
            <div className="flex items-center justify-between border-b border-[#E3E5EE] px-5 py-4">
              <div>
                <p className="text-lg font-semibold text-[#11162B]">Product details</p>
                <p className="mt-0.5 text-[13px] text-[#5A6075]">
                  Catalog / {previewProduct.category_label || "Uncategorized"}
                </p>
              </div>

              <button
                onClick={() => setPreviewProduct(null)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E3E5EE] bg-[#FFFFFF] text-[#4338CA] transition hover:bg-[#4338CA] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="p-5">
                <div className="relative overflow-hidden rounded-xl border border-[#E3E5EE] bg-[#FFFFFF]">
                  {previewImages.length ? (
                    <img
                      src={previewImages[previewImageIndex]?.image_url || previewImages[0].image_url}
                      alt={previewProduct.name}
                      className="aspect-[4/4.35] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/4.35] items-center justify-center text-[#5A6075]">
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
                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#E3E5EE] bg-black/70 text-[#4338CA] backdrop-blur"
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
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#E3E5EE] bg-black/70 text-[#4338CA] backdrop-blur"
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
                        className={`h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-[#FFFFFF] ${
                          index === previewImageIndex ? "border-[#4338CA]" : "border-transparent"
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
                      <h2 className="text-2xl font-semibold tracking-tight text-[#11162B]">
                        {previewProduct.name}
                      </h2>
                      <div className="mt-1 flex items-center gap-2 text-[13px] text-[#5A6075]">
                        <span className="truncate">SKU: {skuOf(previewProduct)}</span>
                        <button
                          onClick={() => navigator.clipboard?.writeText(skuOf(previewProduct))}
                          className="rounded p-1 transition hover:bg-[#4338CA]/15"
                          title="Copy SKU"
                          aria-label="Copy SKU"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-semibold ${
                        previewStatus === "Active"
                          ? "border-[#E3E5EE] bg-[#FFFFFF] text-[#5A6075]"
                          : previewStatus === "Low Stock"
                            ? "border-[#E3E5EE] bg-[#4338CA]/10 text-[#4338CA]"
                            : "border-[#9A2C1F]/30 bg-[#FBE3DF]/8 text-[#4338CA]"
                      }`}
                    >
                      {previewStatus}
                    </span>
                  </div>

                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-[25px] font-semibold tabular-nums text-[#4338CA]">₹{inr(previewPrice)}</span>
                    {previewProduct.mrp && previewProduct.mrp > previewPrice && (
                      <span className="pb-1 text-[15px] text-[#5A6075] line-through">
                        ₹{inr(previewProduct.mrp)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 divide-y divide-[#E3E5EE] rounded-xl border border-[#E3E5EE] bg-[#FFFFFF]">
                  <div className="flex items-center justify-between gap-3 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <PackageCheck className="h-5 w-5 text-[#4338CA]" />
                      <div>
                        <p className="text-[15px] font-medium text-[#11162B]">Inventory</p>
                        <p className="text-[13px] text-[#5A6075]">
                          {previewStock === 0 ? "No units available" : `${previewStock} units available`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => openEdit(previewProduct)}
                      className="rounded-lg border border-[#E3E5EE] px-3 py-2 text-[13px] font-medium text-[#4338CA] transition hover:bg-[#4338CA]/15"
                    >
                      Manage
                    </button>
                  </div>

                  <div className="flex items-start gap-3 px-4 py-4">
                    <Tag className="mt-0.5 h-5 w-5 text-[#4338CA]" />
                    <div>
                      <p className="text-[15px] font-medium text-[#11162B]">Category</p>
                      <p className="mt-0.5 text-[13px] text-[#5A6075]">
                        {previewProduct.category_label || "Uncategorized"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 px-4 py-4">
                    <Layers3 className="mt-0.5 h-5 w-5 text-[#4338CA]" />
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-[#11162B]">Collections & tags</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {previewProduct.best_seller && <Badge label="Best Seller" tone="amber" />}
                        {previewProduct.new_arrival && <Badge label="New" tone="blue" />}
                        {previewProduct.trending && <Badge label="Trending" tone="pink" />}
                        {previewProduct.limited_edition && <Badge label="Limited" tone="violet" />}
                        {!previewProduct.best_seller &&
                          !previewProduct.new_arrival &&
                          !previewProduct.trending &&
                          !previewProduct.limited_edition && (
                            <span className="text-[13px] text-[#5A6075]">No tags assigned</span>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] font-medium text-[#11162B]">Variants</p>
                      <span className="text-[13px] text-[#5A6075]">
                        {previewProduct.variants?.length || 0} variants
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(previewProduct.variants || []).slice(0, 8).map((variant, index) => (
                        <div
                          key={variant.id || index}
                          className="min-w-[76px] rounded-lg border border-[#E3E5EE] bg-[#FFFFFF] px-3 py-2"
                        >
                          <p className="text-[13px] font-semibold text-[#11162B]">
                            {variant.size || "—"} · {variant.color || "—"}
                          </p>
                          <p className="mt-0.5 text-[13px] text-[#5A6075]">
                            {variant.inventory} stock
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {previewProduct.description && (
                  <div className="mt-5">
                    <p className="text-[15px] font-medium text-[#4338CA]">Description</p>
                    <p className="mt-2 text-[15px] leading-6 text-[#5A6075]">
                      {previewProduct.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[#E3E5EE] bg-[#FFFFFF] p-4">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => openEdit(previewProduct)}
                  className={`flex h-11 items-center justify-center gap-2 rounded-lg text-[15px] font-bold transition ${primaryBtn}`}
                >
                  <Pencil className="h-4 w-4" />
                  Edit Product
                </button>
                <button
                  onClick={() => setPreviewProduct(null)}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#E3E5EE] bg-transparent text-[15px] font-medium text-[#4338CA] transition hover:bg-[#4338CA]/10"
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
        <div className="kvm-overlay" role="dialog" aria-modal="true" aria-label={editingId ? "Edit product" : "Add product"}>
          <div className="kvm-dialog kv-pop">
            {/* header */}
            <header className="kvm-header">
              <div className="kvm-header-text">
                <span className="kvm-eyebrow">{editingId ? "Edit product" : "New product"}</span>
                <h2 className="kvm-title">{form.name.trim() || (editingId ? "Untitled product" : "Add New Product")}</h2>
                <p className="kvm-sub">
                  {editingId ? "Update this product in your store" : "Create a new product for your store"}
                </p>
              </div>
              <button type="button" onClick={() => setModal(false)} aria-label="Close" className="kvm-close">
                <X size={18} />
              </button>
            </header>

            <div className="kvm-layout">
              {/* step navigation */}
              <nav className="kvm-nav" aria-label="Product sections">
                {formSections.map((s, i) => {
                  const Icon = s.icon;
                  const active = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => jumpTo(s.id)}
                      className="kvm-step"
                      data-active={active}
                      aria-current={active ? "step" : undefined}
                    >
                      <span className="kvm-step-num">{i + 1}</span>
                      <span className="kvm-step-text">
                        <span className="kvm-step-label">{s.label}</span>
                        <span className="kvm-step-hint">{s.hint}</span>
                      </span>
                      <Icon size={15} className="kvm-step-icon" />
                    </button>
                  );
                })}

                <div className="kvm-nav-stock">
                  <span className="kvm-nav-stock-label">Total stock</span>
                  <span className="kvm-nav-stock-value" data-tone={stockTone(formTotalStock)}>
                    {formTotalStock}
                  </span>
                  <span className="kvm-nav-stock-note">units across {form.variants.length} variant{form.variants.length === 1 ? "" : "s"}</span>
                </div>
              </nav>

              {/* form body */}
              <div className="kvm-body" ref={modalBodyRef} onScroll={onModalScroll}>
                {/* 1. BASIC */}
                <FormSection id="kv-basic" n={1} title="Basic information" desc="Name, category and how the product is described.">
                  <div className="kvm-grid kvm-grid-2">
                    <Field label="Product name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />

                    <div className="kvm-field">
                      <label className="kvm-label">Category</label>
                      <select
                        value={form.category_slug}
                        onChange={(e) => {
                          const selected = categories.find((c) => c.slug === e.target.value);
                          setForm({
                            ...form,
                            category_slug: e.target.value,
                            category_label: selected?.name || selected?.label || "",
                          });
                        }}
                        className="kvm-input kvm-select"
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat.slug || cat.id} value={cat.slug}>
                            {cat.name || cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Field label="Fit" value={form.fit} onChange={(v) => setForm({ ...form, fit: v })} />
                    <Field label="Fabric" value={form.fabric} onChange={(v) => setForm({ ...form, fabric: v })} />

                    <div className="kvm-field">
                      <label className="kvm-label">Coverage</label>
                      <select
                        value={form.coverage}
                        onChange={(e) => setForm({ ...form, coverage: e.target.value })}
                        className="kvm-input kvm-select"
                      >
                        <option value="">Select coverage</option>
                        <option value="All Over">All Over</option>
                        <option value="Front">Front</option>
                        <option value="Back">Back</option>
                      </select>
                    </div>
                  </div>

                  <div className="kvm-field kvm-mt">
                    <label className="kvm-label">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={4}
                      placeholder="Describe the product, its feel and what makes it special…"
                      className="kvm-input kvm-textarea"
                    />
                  </div>
                </FormSection>

                {/* 2. IMAGES */}
                <FormSection id="kv-images" n={2} title="Product images" desc={editingId ? "Uploading new images replaces the current set." : "The first image is used as the cover."}>
                  <label className="kvm-drop">
                    <UploadCloud size={26} />
                    <span className="kvm-drop-title">Click to upload images</span>
                    <span className="kvm-drop-note">Select several at once, or open the picker again to add more.</span>
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
                    <>
                      <p className="kvm-hint kvm-mt">
                        {files.length} image{files.length > 1 ? "s" : ""} selected
                      </p>
                      <div className="kvm-thumbs">
                        {files.map((file, index) => (
                          <div key={`${file.name}-${file.size}-${file.lastModified}-${index}`} className="kvm-thumb">
                            <img src={URL.createObjectURL(file)} alt={file.name} />
                            {index === 0 && <span className="kvm-thumb-cover">Cover</span>}
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="kvm-thumb-x"
                              aria-label={`Remove ${file.name}`}
                            >
                              <X size={13} />
                            </button>
                            <p className="kvm-thumb-name">{file.name}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </FormSection>

                {/* 3. PRICING */}
                <FormSection id="kv-pricing" n={3} title="Pricing" desc="All amounts in rupees.">
                  <div className="kvm-grid kvm-grid-3">
                    <Field label="Price (₹)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
                    <Field label="MRP (₹)" type="number" value={form.mrp} onChange={(v) => setForm({ ...form, mrp: v })} />
                    <Field label="Best price (₹)" type="number" value={form.best_price} onChange={(v) => setForm({ ...form, best_price: v })} />
                  </div>
                </FormSection>

                {/* 4. INVENTORY + VARIANTS */}
                <FormSection id="kv-inventory" n={4} title="Inventory & variants" desc="Stock is managed per size and colour. The product total is calculated for you.">
                  <div className="kvm-total">
                    <div>
                      <span className="kvm-total-label">Total stock</span>
                      <span className="kvm-total-note">
                        <Lock size={12} /> Calculated automatically from variant stock
                      </span>
                    </div>
                    <span className="kvm-total-value" data-tone={stockTone(formTotalStock)}>
                      {formTotalStock}
                      <small>{formTotalStock === 1 ? "unit" : "units"}</small>
                    </span>
                  </div>

                  <div className="kvm-variants">
                    <div className="kvm-variants-head">
                      <div>
                        <h4 className="kvm-h4">Variants</h4>
                        <p className="kvm-hint">Size, colour, stock and SKU</p>
                      </div>
                      <button type="button" onClick={addVariant} className="kvm-btn kvm-btn-red kvm-btn-sm">
                        <Plus size={14} /> Add variant
                      </button>
                    </div>

                    {form.variants.length > 0 && (
                      <div className="kvm-vcols" aria-hidden="true">
                        <span>Size</span>
                        <span>Colour</span>
                        <span>Stock</span>
                        <span>SKU</span>
                        <span />
                      </div>
                    )}

                    {form.variants.length === 0 && (
                      <div className="kvm-empty">
                        <Layers3 size={22} />
                        <p>No variants yet</p>
                        <span>Add at least one size and colour so customers can buy this product.</span>
                      </div>
                    )}

                    <div className="kvm-vlist">
                      {form.variants.map((variant, index) => (
                        <div key={variant.id || index} className="kvm-vrow" data-dup={duplicateVariantRows.has(index)}>
                          <label className="kvm-vcell">
                            <span className="kvm-vlabel">Size</span>
                            <input
                              placeholder="e.g. M"
                              value={variant.size}
                              onChange={(e) => updateVariant(index, "size", e.target.value)}
                              className="kvm-input"
                            />
                          </label>
                          <label className="kvm-vcell">
                            <span className="kvm-vlabel">Colour</span>
                            <input
                              placeholder="e.g. Black"
                              value={variant.color}
                              onChange={(e) => updateVariant(index, "color", e.target.value)}
                              className="kvm-input"
                            />
                          </label>
                          <label className="kvm-vcell">
                            <span className="kvm-vlabel">Stock</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              step={1}
                              placeholder="0"
                              value={variant.inventory}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                updateVariant(index, "inventory", Math.max(0, Math.floor(Number(e.target.value) || 0)))
                              }
                              className="kvm-input kvm-stock"
                              data-tone={stockTone(Number(variant.inventory) || 0)}
                            />
                          </label>
                          <label className="kvm-vcell">
                            <span className="kvm-vlabel">SKU</span>
                            <input
                              placeholder="Optional"
                              value={variant.sku || ""}
                              onChange={(e) => updateVariant(index, "sku", e.target.value)}
                              className="kvm-input"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            aria-label={`Remove variant ${variant.size || index + 1}`}
                            className="kvm-vdel"
                          >
                            <Trash2 size={16} />
                          </button>
                          {duplicateVariantRows.has(index) && (
                            <p className="kvm-vwarn">This size and colour already exists above.</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {form.variants.length > 0 && (
                      <div className="kvm-quick">
                        <span>Quick add size</span>
                        {["S", "M", "L", "XL", "XXL"].map((s) => (
                          <button key={s} type="button" onClick={() => addVariantSize(s)} className="kvm-chip">
                            + {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </FormSection>

                {/* 5. DETAILS, TAGS, FLAGS */}
                <FormSection id="kv-details" n={5} title="Details & tags" desc="Care instructions, search tags and storefront badges.">
                  <div className="kvm-grid kvm-grid-2">
                    <Field label="Fabric details" value={form.fabric_details} onChange={(v) => setForm({ ...form, fabric_details: v })} />
                    <Field label="Wash care" value={form.wash_care} onChange={(v) => setForm({ ...form, wash_care: v })} />
                    <div className="kvm-span-2">
                      <Field label="Tags" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} />
                    </div>
                  </div>

                  <label className="kvm-label kvm-mt">Storefront flags</label>
                  <div className="kvm-flags">
                    <Toggle label="Best seller" checked={form.best_seller} onChange={(v) => setForm({ ...form, best_seller: v })} />
                    <Toggle label="New arrival" checked={form.new_arrival} onChange={(v) => setForm({ ...form, new_arrival: v })} />
                    <Toggle label="Trending" checked={form.trending} onChange={(v) => setForm({ ...form, trending: v })} />
                    <Toggle label="Limited edition" checked={form.limited_edition} onChange={(v) => setForm({ ...form, limited_edition: v })} />
                  </div>
                </FormSection>
              </div>
            </div>

            {/* actions */}
            <footer className="kvm-footer">
              <div className="kvm-footer-stock">
                <span>Total stock</span>
                <strong data-tone={stockTone(formTotalStock)}>{formTotalStock}</strong>
              </div>
              <div className="kvm-footer-actions">
                <button type="button" onClick={() => setModal(false)} disabled={saving} className="kvm-btn kvm-btn-ghost">
                  Cancel
                </button>
                <button type="button" onClick={saveProduct} disabled={saving} className="kvm-btn kvm-btn-red">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editingId ? "Save changes" : "Create product"}
                  {!saving && <ArrowRight size={16} />}
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-4 sm:right-5 sm:items-end">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border bg-[#FFFFFF] p-3.5 shadow-[0_8px_24px_rgba(16,24,40,0.12)] transition ${
              toast.type === "success"
                ? "border-[#17603F]/30"
                : "border-[#9A2C1F]/30"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#17603F]" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#4338CA]" />
            )}

            <p className="flex-1 text-[15px] text-[#11162B]">{toast.message}</p>

            <button
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss"
              className="text-[#5A6075] transition hover:text-[#11162B]"
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
  desc,
  children,
}: {
  id: string;
  n: number;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="kvm-card">
      <div className="kvm-card-head">
        <span className="kvm-card-num">{n}</span>
        <div>
          <h3 className="kvm-card-title">{title}</h3>
          {desc && <p className="kvm-card-desc">{desc}</p>}
        </div>
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
    <div className="kvm-field">
      <label className="kvm-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="kvm-input"
        {...(type === "number" ? { min: 0, inputMode: "decimal" as const } : {})}
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="kvm-toggle" data-on={checked}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="kvm-toggle-box">{checked && <CheckCircle2 size={14} />}</span>
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
  // palette-safe tones: red, green, neutral
  const tones: Record<string, string> = {
    amber: "border-[#E3E5EE] bg-[#4338CA]/10 text-[#4338CA]",
    blue: "border-[#17603F]/30 bg-[#17603F]/10 text-[#17603F]",
    pink: "border-[#9A2C1F]/40 bg-[#FBE3DF]/10 text-[#4338CA]",
    violet: "border-[#E3E5EE]/30 bg-[#F5F6FA]/10 text-[#5A6075]",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[13px] font-medium ${tones[tone]}`}
    >
      {label}
    </span>
  );
}