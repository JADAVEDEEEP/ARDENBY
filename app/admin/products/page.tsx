"use client";

import { useEffect, useState } from "react";
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
      ? localStorage.getItem("ardenby_token")
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

      payload.append(
        "best_seller",
        String(form.best_seller)
      );

      payload.append(
        "new_arrival",
        String(form.new_arrival)
      );

      payload.append(
        "trending",
        String(form.trending)
      );

      payload.append(
        "limited_edition",
        String(form.limited_edition)
      );

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
        await request(
          apiUrl(`/api/products/${editingId}`),
          {
            method: "PUT",
            body: payload,
          }
        );
      } else {
        await request(
          apiUrl("/api/products"),
          {
            method: "POST",
            body: payload,
          }
        );
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

  return (
    <div className="min-h-screen bg-[#f5f6f8] p-4 md:p-8">
      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1c1f23]">
            Products
          </h1>

          <p className="mt-1 text-sm text-[#8b929a]">
            Manage your Ardenby products
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#181b1f] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#2a2e33]"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* FILTERS */}

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#e9ecef] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] md:flex-row md:items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a2aab1]" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadProducts();
            }}
            placeholder="Search products..."
            className="w-full rounded-xl border border-[#e3e6ea] bg-[#fafbfc] py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#1c1f23] focus:bg-white"
          />
        </div>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);

            setTimeout(loadProducts, 0);
          }}
          className="rounded-xl border border-[#e3e6ea] bg-[#fafbfc] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#1c1f23] focus:bg-white"
        >
          <option value="">All Categories</option>

          {categories.map((cat) => (
            <option
              key={cat.slug || cat.id}
              value={cat.slug}
            >
              {cat.name || cat.label}
            </option>
          ))}
        </select>

        <button
          onClick={loadProducts}
          className="rounded-xl border border-[#e3e6ea] bg-white px-4 py-2.5 text-sm font-medium text-[#4b5157] transition hover:bg-[#f5f6f8] md:ml-auto"
        >
          Search
        </button>
      </div>

      {/* PRODUCTS TABLE */}

      <div className="overflow-hidden rounded-2xl border border-[#e9ecef] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between border-b border-[#edf0f2] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#1c1f23]">
            My Products
          </h2>

          <span className="text-xs text-[#a2aab1]">
            {loading ? "—" : `${products.length} total`}
          </span>
        </div>

        {loading ? (
          <div className="divide-y divide-[#f1f3f4]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-[#f0f2f4]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/4 animate-pulse rounded bg-[#f0f2f4]" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-[#f0f2f4]" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-14 text-center">
            <p className="text-sm text-[#8b929a]">No products found.</p>

            <button
              onClick={openAdd}
              className="mt-3 text-sm font-medium text-[#1c1f23] underline underline-offset-4"
            >
              Add your first product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-[#edf0f2] text-left text-[11px] uppercase tracking-wide text-[#a2aab1]">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium">Price</th>
                  <th className="px-3 py-3 font-medium">Inventory</th>
                  <th className="px-3 py-3 font-medium">Tags</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-[#f1f3f4] transition last:border-0 hover:bg-[#fafbfc]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#f4f5f7]">
                          {product.images?.[0]?.image_url ? (
                            <img
                              src={product.images[0].image_url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[#b7bec4]">
                              <ImageOff className="h-4 w-4" />
                            </div>
                          )}
                        </div>

                        <p className="max-w-[220px] truncate text-sm font-medium text-[#1c1f23]">
                          {product.name}
                        </p>
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-xs text-[#69727a]">
                      {product.category_label || "Uncategorized"}
                    </td>

                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-[#1c1f23]">
                          ₹{product.best_price || product.price || 0}
                        </span>

                        {product.mrp ? (
                          <span className="text-xs text-[#a2aab1] line-through">
                            ₹{product.mrp}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-3 py-3.5">
                      <span
                        className={`text-xs font-medium ${
                          Number(product.inventory || 0) <= 5
                            ? "text-[#c0392b]"
                            : "text-[#4b5157]"
                        }`}
                      >
                        {product.inventory ?? 0} in stock
                      </span>
                    </td>

                    <td className="px-3 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {product.best_seller && (
                          <Badge label="Best Seller" tone="amber" />
                        )}
                        {product.new_arrival && (
                          <Badge label="New" tone="blue" />
                        )}
                        {product.trending && (
                          <Badge label="Trending" tone="pink" />
                        )}
                        {product.limited_edition && (
                          <Badge label="Limited" tone="violet" />
                        )}
                        {!product.best_seller &&
                          !product.new_arrival &&
                          !product.trending &&
                          !product.limited_edition && (
                            <span className="text-xs text-[#c2c8cd]">—</span>
                          )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="flex items-center gap-1.5 rounded-lg border border-[#e3e6ea] px-2.5 py-1.5 text-xs font-medium text-[#4b5157] transition hover:bg-[#f5f6f8]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-[#fbdcd8] px-2.5 py-1.5 text-xs font-medium text-[#c0392b] transition hover:bg-[#fdeceb]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#edf0f2] bg-white/95 p-5 backdrop-blur md:p-6">
              <div>
                <h2 className="text-lg font-semibold text-[#1c1f23] md:text-xl">
                  {editingId ? "Edit Product" : "Add Product"}
                </h2>

                <p className="mt-0.5 text-xs text-[#8b929a] md:text-sm">
                  Basic product information
                </p>
              </div>

              <button
                onClick={() => setModal(false)}
                className="rounded-full p-1.5 text-[#8b929a] transition hover:bg-[#f5f6f8] hover:text-[#1c1f23]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 md:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Product Name"
                  value={form.name}
                  onChange={(v) =>
                    setForm({ ...form, name: v })
                  }
                />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#343a40]">
                    Category
                  </label>

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
                          selected?.name ||
                          selected?.label ||
                          "",
                      });
                    }}
                    className="w-full rounded-xl border border-[#e3e6ea] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#1c1f23]"
                  >
                    <option value="">Select Category</option>

                    {categories.map((cat) => (
                      <option
                        key={cat.slug || cat.id}
                        value={cat.slug}
                      >
                        {cat.name || cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Field
                  label="Fit"
                  value={form.fit}
                  onChange={(v) =>
                    setForm({ ...form, fit: v })
                  }
                />

                <Field
                  label="Fabric"
                  value={form.fabric}
                  onChange={(v) =>
                    setForm({ ...form, fabric: v })
                  }
                />

                {/* COVERAGE */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#343a40]">
                    Coverage
                  </label>

                  <select
                    value={form.coverage}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        coverage: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-[#e3e6ea] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#1c1f23]"
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
                  onChange={(v) =>
                    setForm({ ...form, price: v })
                  }
                />

                <Field
                  label="MRP"
                  type="number"
                  value={form.mrp}
                  onChange={(v) =>
                    setForm({ ...form, mrp: v })
                  }
                />

                <Field
                  label="Best Price"
                  type="number"
                  value={form.best_price}
                  onChange={(v) =>
                    setForm({ ...form, best_price: v })
                  }
                />

                <Field
                  label="Inventory"
                  type="number"
                  value={form.inventory}
                  onChange={(v) =>
                    setForm({ ...form, inventory: v })
                  }
                />
              </div>

              {/* DESCRIPTION */}

              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-[#343a40]">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full rounded-xl border border-[#e3e6ea] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#1c1f23]"
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field
                  label="Fabric Details"
                  value={form.fabric_details}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      fabric_details: v,
                    })
                  }
                />

                <Field
                  label="Wash Care"
                  value={form.wash_care}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      wash_care: v,
                    })
                  }
                />

                <Field
                  label="Tags"
                  value={form.tags}
                  onChange={(v) =>
                    setForm({ ...form, tags: v })
                  }
                />
              </div>

              {/* FLAGS */}

              <div className="my-5 flex flex-wrap gap-2">
                <Check
                  label="Best Seller"
                  checked={form.best_seller}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      best_seller: v,
                    })
                  }
                />

                <Check
                  label="New Arrival"
                  checked={form.new_arrival}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      new_arrival: v,
                    })
                  }
                />

                <Check
                  label="Trending"
                  checked={form.trending}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      trending: v,
                    })
                  }
                />

                <Check
                  label="Limited Edition"
                  checked={form.limited_edition}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      limited_edition: v,
                    })
                  }
                />
              </div>

              {/* IMAGES */}

              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-[#343a40]">
                  Product Images
                </label>

                <input
                  type="file"
                  name="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full rounded-xl border border-dashed border-[#d7dce0] bg-[#fafbfc] p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#1c1f23] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                />

                <p className="mt-1.5 text-xs text-[#8b929a]">
                  Select multiple images at once, or open the picker again to add more.
                </p>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-[#4b5157]">
                      {files.length} image{files.length > 1 ? "s" : ""} selected
                    </p>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {files.map((file, index) => (
                        <div
                          key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-[#e9ecef] bg-[#fafbfc] px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-[#343a40]">
                              {file.name}
                            </p>
                            <p className="mt-0.5 text-[10px] text-[#9aa1a8]">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="shrink-0 rounded-md p-1.5 text-[#a2aab1] transition hover:bg-[#fdeceb] hover:text-[#c0392b]"
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

              <div className="rounded-2xl border border-[#e9ecef] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1c1f23]">
                      Variants
                    </h3>
                    <p className="text-xs text-[#8b929a]">
                      Size, color and stock
                    </p>
                  </div>

                  <button
                    onClick={addVariant}
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg bg-[#1c1f23] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#2a2e33]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Variant
                  </button>
                </div>

                <div className="space-y-2.5">
                  {form.variants.length === 0 && (
                    <p className="rounded-xl bg-[#fafbfc] px-3 py-4 text-center text-xs text-[#a2aab1]">
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
                          updateVariant(
                            index,
                            "size",
                            e.target.value
                          )
                        }
                        className="rounded-lg border border-[#e3e6ea] px-3 py-2 text-sm outline-none focus:border-[#1c1f23]"
                      />

                      <input
                        placeholder="Color"
                        value={variant.color}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "color",
                            e.target.value
                          )
                        }
                        className="rounded-lg border border-[#e3e6ea] px-3 py-2 text-sm outline-none focus:border-[#1c1f23]"
                      />

                      <input
                        type="number"
                        placeholder="Stock"
                        value={variant.inventory}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "inventory",
                            Number(e.target.value)
                          )
                        }
                        className="rounded-lg border border-[#e3e6ea] px-3 py-2 text-sm outline-none focus:border-[#1c1f23]"
                      />

                      <input
                        placeholder="SKU"
                        value={variant.sku || ""}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "sku",
                            e.target.value
                          )
                        }
                        className="rounded-lg border border-[#e3e6ea] px-3 py-2 text-sm outline-none focus:border-[#1c1f23]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeVariant(index)
                        }
                        className="flex items-center justify-center rounded-lg border border-[#fbdcd8] px-3 py-2 text-xs font-medium text-[#c0392b] transition hover:bg-[#fdeceb]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTIONS */}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setModal(false)}
                  disabled={saving}
                  className="rounded-xl border border-[#e3e6ea] px-5 py-2.5 text-sm font-medium text-[#4b5157] transition hover:bg-[#f5f6f8] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={saveProduct}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#1c1f23] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#2a2e33] disabled:opacity-60"
                >
                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
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
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border bg-white p-3.5 shadow-lg transition ${
              toast.type === "success"
                ? "border-[#cdeeda]"
                : "border-[#f8d3ce]"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#1f8a4c]" />
            ) : (
              <XCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#c0392b]" />
            )}

            <p className="flex-1 text-sm text-[#2d3237]">
              {toast.message}
            </p>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-[#a2aab1] transition hover:text-[#4b5157]"
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
      <label className="mb-1.5 block text-sm font-medium text-[#343a40]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#e3e6ea] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#1c1f23]"
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
      className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition ${
        checked
          ? "border-[#1c1f23] bg-[#1c1f23] text-white"
          : "border-[#e3e6ea] text-[#4b5157] hover:bg-[#f5f6f8]"
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
    amber: "bg-[#fdf3e0] text-[#b3811f]",
    blue: "bg-[#e9f1ff] text-[#3f6fbf]",
    pink: "bg-[#fbe9ef] text-[#c05c81]",
    violet: "bg-[#f1ecfb] text-[#6d4fc2]",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-semibold shadow-sm ${tones[tone]}`}
    >
      {label}
    </span>
  );
}