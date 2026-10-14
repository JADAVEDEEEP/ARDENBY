

'use client';

import { adminApiRequest } from '@/components/admin/admin-auth';

import { useCallback, useEffect, useState, type FormEvent } from 'react';

import {

  Plus,

  Search,

  RotateCcw,

  Pencil,

  Trash2,

  Tag,

  X,

  LoaderCircle,

  Layers3,

  CalendarDays,

  AlertCircle,

  CheckCircle2,

} from 'lucide-react';



type Category = {

  slug: string;

  name: string;

  description: string | null;

  created_at: string;

};



const API_BASE = (

  process.env.NEXT_PUBLIC_LOCAL_API_URL ||

  process.env.NEXT_PUBLIC_PRODUCTION_API_URL ||

  ''

).replace(/\/$/, '');



const API_URL = `${API_BASE}/api/categories`;

export default function AdminCategoriesPage() {

  const [categories, setCategories] = useState<Category[]>([]);

  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const [error, setError] = useState('');

  const [notice, setNotice] = useState('');



  const [form, setForm] = useState({

    name: '',

    slug: '',

    description: '',

  });





 const request = async (url: string, options: RequestInit = {}) => {

  const path = url.replace(API_BASE, '');



  return adminApiRequest(path, options);
};



  const loadCategories = useCallback(async () => {

    setLoading(true);

    setError('');



    try {

      const data = await request(API_URL);

      setCategories(Array.isArray(data.categories) ? data.categories : []);

    } catch (err) {

      setError(

        err instanceof Error ? err.message : 'Failed to load categories.'

      );

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    void loadCategories();

  }, [loadCategories]);



  const openCreate = () => {

    setEditingSlug(null);

    setForm({ name: '', slug: '', description: '' });

    setError('');

    setNotice('');

    setModalOpen(true);

  };



  const openEdit = (category: Category) => {

    setEditingSlug(category.slug);

    setForm({

      name: category.name,

      slug: category.slug,

      description: category.description || '',

    });

    setError('');

    setNotice('');

    setModalOpen(true);

  };



  const closeModal = () => {

    if (saving) return;

    setModalOpen(false);

    setEditingSlug(null);

    setError('');

  };



  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {

    event.preventDefault();

    setSaving(true);

    setError('');

    setNotice('');



    const payload = {

      name: form.name.trim(),

      slug: form.slug.trim().toLowerCase(),

      description: form.description.trim(),

    };



    if (!payload.name || !payload.slug) {

      setError('Category name and slug are required.');

      setSaving(false);

      return;

    }



    try {

      if (editingSlug) {

        await request(

          `${API_URL}/${encodeURIComponent(editingSlug)}`,

          {

            method: 'PUT',

            body: JSON.stringify({

              name: payload.name,

              description: payload.description,

            }),

          }

        );

        setNotice('Category updated successfully.');

      } else {

        await request(API_URL, {

          method: 'POST',

          body: JSON.stringify(payload),

        });

        setNotice('Category created successfully.');

      }



      setModalOpen(false);

      setEditingSlug(null);

      await loadCategories();

    } catch (err) {

      setError(

        err instanceof Error ? err.message : 'Unable to save category.'

      );

    } finally {

      setSaving(false);

    }

  };



  const handleDelete = async () => {

    if (!deleteTarget) return;



    setSaving(true);

    setError('');

    setNotice('');



    try {

      await request(

        `${API_URL}/${encodeURIComponent(deleteTarget.slug)}`,

        { method: 'DELETE' }

      );



      setNotice('Category deleted successfully.');

      setDeleteTarget(null);

      await loadCategories();

    } catch (err) {

      setError(

        err instanceof Error ? err.message : 'Unable to delete category.'

      );

    } finally {

      setSaving(false);

    }

  };



  const filteredCategories = categories.filter((category) => {

    const term = search.toLowerCase();



    return (

      category.name.toLowerCase().includes(term) ||

      category.slug.toLowerCase().includes(term) ||

      (category.description || '').toLowerCase().includes(term)

    );

  });



  const formatDate = (value: string) => {

    if (!value) return '—';



    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;



    return date.toLocaleDateString('en-IN', {

      day: '2-digit',

      month: 'short',

      year: 'numeric',

    });

  };



  const inputClass =

    'mt-2 w-full rounded-lg border border-[#31533D] bg-[#06160F] px-4 py-3 text-sm text-white outline-none placeholder:text-[#819487] focus:border-[#D8B85A] focus:ring-1 focus:ring-[#D8B85A]/40';



  return (

    <section className="min-h-screen space-y-6 rounded-2xl border border-[#B99A43]/30 bg-[#06110C] p-4 text-white sm:p-6 lg:p-8">

      

      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

        <div>

          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#D8B85A]">

            Admin / Categories

          </p>



          <h1 className="mt-3 font-serif text-3xl font-semibold text-[#F1D989] sm:text-4xl">

            Categories

          </h1>



          <p className="mt-2 text-sm leading-6 text-[#B5C3B8] sm:text-base">

            Manage your product categories and organize your collection.

          </p>

        </div>



        <button

          type="button"

          onClick={openCreate}

          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D5B454] via-[#F4D983] to-[#B18A2E] px-5 py-3 text-sm font-bold text-[#10170E] shadow-lg shadow-black/20 transition hover:brightness-110 sm:min-w-44"

        >

          <Plus className="h-5 w-5" />

          Add Category

        </button>

      </div>



      

      {notice && (

        <div className="flex items-center gap-2 rounded-lg border border-emerald-700/50 bg-emerald-950/40 p-3 text-sm text-emerald-300">

          <CheckCircle2 className="h-5 w-5 shrink-0" />

          {notice}

          <button

            type="button"

            onClick={() => setNotice('')}

            className="ml-auto"

            aria-label="Dismiss notification"

          >

            <X className="h-4 w-4" />

          </button>

        </div>

      )}



      {error && !modalOpen && !deleteTarget && (

        <div className="flex items-start gap-2 rounded-lg border border-red-800/60 bg-red-950/30 p-3 text-sm text-red-300">

          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <span>{error}</span>

          <button

            type="button"

            onClick={() => setError('')}

            className="ml-auto"

            aria-label="Dismiss error"

          >

            <X className="h-4 w-4" />

          </button>

        </div>

      )}



     

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

        <div className="flex items-center gap-4 rounded-xl border border-[#B99A43]/40 bg-gradient-to-br from-[#0D2619] to-[#07130D] p-4 sm:p-5">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-600/50 bg-emerald-900/40 text-[#E2C568]">

            <Tag className="h-6 w-6" />

          </div>

          <div>

            <p className="text-2xl font-bold text-[#F1D989]">

              {categories.length}

            </p>

            <p className="mt-1 text-sm text-[#B5C3B8]">Total Categories</p>

          </div>

        </div>



        <div className="flex items-center gap-4 rounded-xl border border-emerald-800/60 bg-gradient-to-br from-[#0D2619] to-[#07130D] p-4 sm:p-5">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-600/50 bg-emerald-900/40 text-emerald-300">

            <Layers3 className="h-6 w-6" />

          </div>

          <div>

            <p className="text-2xl font-bold text-white">

              {filteredCategories.length}

            </p>

            <p className="mt-1 text-sm text-[#B5C3B8]">

              {search ? 'Matching Categories' : 'Categories Displayed'}

            </p>

          </div>

        </div>

      </div>



      

      <div className="flex flex-col gap-3 sm:flex-row">

        <div className="relative flex-1">

          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#B99A43]" />

          <input

            type="search"

            value={search}

            onChange={(event) => setSearch(event.target.value)}

            placeholder="Search by name, slug or description..."

            aria-label="Search categories"

            className="min-h-12 w-full rounded-xl border border-[#31533D] bg-[#081A11] py-3 pl-12 pr-4 text-sm text-white outline-none placeholder:text-[#819487] focus:border-[#D8B85A]"

          />

        </div>



        <button

          type="button"

          onClick={() => void loadCategories()}

          disabled={loading}

          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#8D7434] bg-[#102419] px-5 py-3 text-sm font-semibold text-[#F1D989] transition hover:bg-[#193624] disabled:opacity-50"

        >

          <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />

          Refresh

        </button>

      </div>



      

      <div className="hidden overflow-hidden rounded-xl border border-[#31533D] lg:block">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[760px] text-left">

            <thead className="bg-[#10271A]">

              <tr className="text-xs uppercase tracking-wider text-[#E1C96E]">

                <th className="px-5 py-4 font-semibold">#</th>

                <th className="px-5 py-4 font-semibold">Name</th>

                <th className="px-5 py-4 font-semibold">Slug</th>

                <th className="px-5 py-4 font-semibold">Description</th>

                <th className="px-5 py-4 font-semibold">Created At</th>

                <th className="px-5 py-4 text-right font-semibold">Actions</th>

              </tr>

            </thead>



            <tbody className="divide-y divide-[#25402F]">

              {loading ? (

                <tr>

                  <td colSpan={6} className="px-5 py-16 text-center text-[#B5C3B8]">

                    <LoaderCircle className="mx-auto mb-3 h-6 w-6 animate-spin text-[#D8B85A]" />

                    Loading categories...

                  </td>

                </tr>

              ) : filteredCategories.length === 0 ? (

                <tr>

                  <td colSpan={6} className="px-5 py-16 text-center">

                    <Tag className="mx-auto mb-3 h-8 w-8 text-[#B99A43]" />

                    <p className="font-medium text-white">No categories found</p>

                    <p className="mt-1 text-sm text-[#A6B7AA]">

                      Try another search or create a category.

                    </p>

                  </td>

                </tr>

              ) : (

                filteredCategories.map((category, index) => (

                  <tr

                    key={category.slug}

                    className="bg-[#07160F] transition hover:bg-[#10271A]/80"

                  >

                    <td className="px-5 py-4 text-sm text-[#B5C3B8]">

                      {index + 1}

                    </td>



                    <td className="px-5 py-4 text-sm font-semibold text-white">

                      {category.name}

                    </td>



                    <td className="px-5 py-4">

                      <span className="inline-block max-w-44 break-all rounded-md border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-1.5 text-xs text-emerald-200">

                        {category.slug}

                      </span>

                    </td>



                    <td className="max-w-64 px-5 py-4 text-sm text-[#B5C3B8]">

                      <span className="line-clamp-2">

                        {category.description || '—'}

                      </span>

                    </td>



                    <td className="whitespace-nowrap px-5 py-4 text-sm text-[#B5C3B8]">

                      {formatDate(category.created_at)}

                    </td>



                    <td className="px-5 py-4">

                      <div className="flex justify-end gap-2">

                        <button

                          type="button"

                          onClick={() => openEdit(category)}

                          aria-label={`Edit ${category.name}`}

                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#A88936] text-[#F1D989] transition hover:bg-[#A88936]/15"

                        >

                          <Pencil className="h-4 w-4" />

                        </button>



                        <button

                          type="button"

                          onClick={() => {

                            setError('');

                            setDeleteTarget(category);

                          }}

                          aria-label={`Delete ${category.name}`}

                          className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-800 text-red-400 transition hover:bg-red-950/50"

                        >

                          <Trash2 className="h-4 w-4" />

                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>



        <div className="border-t border-[#31533D] bg-[#091A11] px-5 py-3 text-xs text-[#A6B7AA]">

          Showing {filteredCategories.length} of {categories.length} categories

        </div>

      </div>



      

      <div className="space-y-3 lg:hidden">

        {loading ? (

          <div className="rounded-xl border border-[#31533D] bg-[#091A11] py-12 text-center text-[#B5C3B8]">

            <LoaderCircle className="mx-auto mb-3 h-6 w-6 animate-spin text-[#D8B85A]" />

            Loading categories...

          </div>

        ) : filteredCategories.length === 0 ? (

          <div className="rounded-xl border border-[#31533D] bg-[#091A11] px-4 py-12 text-center">

            <Tag className="mx-auto mb-3 h-8 w-8 text-[#B99A43]" />

            <p className="font-semibold text-white">No categories found</p>

            <p className="mt-1 text-sm text-[#A6B7AA]">

              Try another search or add a category.

            </p>

          </div>

        ) : (

          filteredCategories.map((category) => (

            <article

              key={category.slug}

              className="rounded-xl border border-[#31533D] bg-gradient-to-br from-[#0D2116] to-[#07130D] p-4 shadow-lg shadow-black/10"

            >

              <div className="flex items-start gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#8D7434]/60 bg-[#A88936]/10 text-[#E1C96E]">

                  <Tag className="h-5 w-5" />

                </div>



                <div className="min-w-0 flex-1">

                  <h3 className="break-words text-base font-semibold text-white sm:text-lg">

                    {category.name}

                  </h3>



                  <p className="mt-1 break-all text-xs text-emerald-300">

                    {category.slug}

                  </p>

                </div>

              </div>



              <p className="mt-3 break-words text-sm leading-6 text-[#B5C3B8]">

                {category.description || 'No description provided.'}

              </p>



              <div className="mt-3 flex items-center gap-2 border-t border-[#31533D]/70 pt-3 text-xs text-[#A6B7AA]">

                <CalendarDays className="h-4 w-4 shrink-0 text-[#D8B85A]" />

                <span>Created {formatDate(category.created_at)}</span>

              </div>



              <div className="mt-4 grid grid-cols-2 gap-2">

                <button

                  type="button"

                  onClick={() => openEdit(category)}

                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#A88936] px-3 py-2.5 text-sm font-semibold text-[#F1D989] transition hover:bg-[#A88936]/15"

                >

                  <Pencil className="h-4 w-4" />

                  Edit

                </button>



                <button

                  type="button"

                  onClick={() => {

                    setError('');

                    setDeleteTarget(category);

                  }}

                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-800 px-3 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-950/40"

                >

                  <Trash2 className="h-4 w-4" />

                  Delete

                </button>

              </div>

            </article>

          ))

        )}



        <p className="px-1 py-1 text-xs text-[#A6B7AA]">

          Showing {filteredCategories.length} of {categories.length} categories

        </p>

      </div>



      

      {modalOpen && (

        <div

          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"

          onMouseDown={(event) => {

            if (event.target === event.currentTarget) closeModal();

          }}

        >

          <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-[#A88936]/60 bg-[#07140D] p-5 shadow-2xl sm:max-w-xl sm:rounded-2xl sm:p-7">

            <div className="flex items-start justify-between gap-4">

              <div className="flex items-start gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-700 bg-emerald-950/60 text-[#E1C96E]">

                  <Tag className="h-5 w-5" />

                </div>



                <div>

                  <h2 className="font-serif text-2xl font-semibold text-[#F1D989]">

                    {editingSlug ? 'Edit Category' : 'Add Category'}

                  </h2>

                  <p className="mt-1 text-sm text-[#A6B7AA]">

                    {editingSlug

                      ? 'Update your category details.'

                      : 'Create a new product category.'}

                  </p>

                </div>

              </div>



              <button

                type="button"

                onClick={closeModal}

                disabled={saving}

                aria-label="Close modal"

                className="rounded-lg p-2 text-[#B5C3B8] transition hover:bg-white/5 hover:text-white"

              >

                <X className="h-5 w-5" />

              </button>

            </div>



            <form onSubmit={handleSubmit} className="mt-6 space-y-4">

              <div>

                <label htmlFor="category-name" className="text-sm font-semibold text-white">

                  Category Name <span className="text-red-400">*</span>

                </label>

                <input

                  id="category-name"

                  required

                  maxLength={120}

                  value={form.name}

                  onChange={(event) => {

                    const name = event.target.value;

                    setForm((previous) => ({

                      ...previous,

                      name,

                      ...(!editingSlug && !previous.slug

                        ? {

                            slug: name

                              .toLowerCase()

                              .trim()

                              .replace(/[^a-z0-9]+/g, '-')

                              .replace(/^-|-$/g, ''),

                          }

                        : {}),

                    }));

                  }}

                  placeholder="e.g. Men's T-Shirts"

                  className={inputClass}

                />

              </div>



              <div>

                <label htmlFor="category-slug" className="text-sm font-semibold text-white">

                  Slug <span className="text-red-400">*</span>

                </label>

                <input

                  id="category-slug"

                  required

                  maxLength={150}

                  value={form.slug}

                  disabled={Boolean(editingSlug)}

                  onChange={(event) =>

                    setForm((previous) => ({

                      ...previous,

                      slug: event.target.value

                        .toLowerCase()

                        .trim()

                        .replace(/[^a-z0-9-]+/g, '-')

                        .replace(/--+/g, '-'),

                    }))

                  }

                  placeholder="mens-tshirts"

                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}

                />

                {editingSlug && (

                  <p className="mt-1.5 text-xs text-[#A6B7AA]">

                    Slug editing is disabled because the existing API updates by slug.

                  </p>

                )}

              </div>



              <div>

                <label htmlFor="category-description" className="text-sm font-semibold text-white">

                  Description

                </label>

                <textarea

                  id="category-description"

                  rows={4}

                  maxLength={1000}

                  value={form.description}

                  onChange={(event) =>

                    setForm((previous) => ({

                      ...previous,

                      description: event.target.value,

                    }))

                  }

                  placeholder="Describe this collection..."

                  className={`${inputClass} resize-y`}

                />

              </div>



              {error && (

                <div className="flex items-start gap-2 rounded-lg border border-red-800/60 bg-red-950/30 p-3 text-sm text-red-300">

                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  {error}

                </div>

              )}



              <div className="grid grid-cols-2 gap-3 border-t border-[#31533D] pt-5">

                <button

                  type="button"

                  onClick={closeModal}

                  disabled={saving}

                  className="min-h-12 rounded-xl border border-[#526A58] px-4 py-3 text-sm font-semibold text-[#D5E0D7] transition hover:bg-white/5 disabled:opacity-50"

                >

                  Cancel

                </button>



                <button

                  type="submit"

                  disabled={saving}

                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D5B454] via-[#F4D983] to-[#B18A2E] px-4 py-3 text-sm font-bold text-[#10170E] transition hover:brightness-110 disabled:opacity-60"

                >

                  {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}

                  {editingSlug ? 'Save Changes' : 'Create Category'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      

      {deleteTarget && (

        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">

          <div className="w-full rounded-t-2xl border border-red-900/60 bg-[#09150E] p-5 shadow-2xl sm:max-w-md sm:rounded-2xl sm:p-6">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-800/60 bg-red-950/40 text-red-400">

              <Trash2 className="h-6 w-6" />

            </div>



            <h2 className="mt-4 text-xl font-semibold text-white">

              Delete category?

            </h2>



            <p className="mt-2 break-words text-sm leading-6 text-[#B5C3B8]">

              Are you sure you want to delete{' '}

              <span className="font-semibold text-[#F1D989]">

                {deleteTarget.name}

              </span>

              ? This action cannot be undone.

            </p>



            {error && (

              <p className="mt-3 rounded-lg border border-red-800/60 bg-red-950/30 p-3 text-sm text-red-300">

                {error}

              </p>

            )}



            <div className="mt-6 grid grid-cols-2 gap-3">

              <button

                type="button"

                disabled={saving}

                onClick={() => {

                  setDeleteTarget(null);

                  setError('');

                }}

                className="min-h-12 rounded-xl border border-[#526A58] px-4 py-3 text-sm font-semibold text-white hover:bg-white/5 disabled:opacity-50"

              >

                Cancel

              </button>



              <button

                type="button"

                disabled={saving}

                onClick={() => void handleDelete()}

                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-50"

              >

                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}

                Delete

              </button>

            </div>

          </div>

        </div>

      )}

    </section>

  );

}
