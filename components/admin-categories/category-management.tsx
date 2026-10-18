"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  type CategoryInput,
  type CategoryMutationResult,
  type DeleteCategoryResult,
} from "@/app/admin-dashboard/categories/actions";
import { AdminSidebar } from "@/components/admin-dashboard/admin-navigation";
import { MobileAdminNavigation } from "@/components/admin-dashboard/mobile-admin-navigation";
import { CloudinaryUploadButton } from "@/components/admin-posts/cloudinary-upload-button";
import { Button } from "@/components/ui/button";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  postCount: number;
}

interface CategoryManagementProps {
  username: string;
  categories: CategoryRow[];
  page: number;
  totalPages: number;
  totalCategories: number;
  loadError?: string;
}

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  image: string;
}

const initialForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  image: "",
};

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CategoryManagement({
  username,
  categories,
  page,
  totalPages,
  totalCategories,
  loadError,
}: CategoryManagementProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState<CategoryFormState>(initialForm);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<CategoryRow | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState("");
  const firstVisiblePage = Math.max(
    1,
    Math.min(page - 2, totalPages - 4),
  );
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstVisiblePage + index,
  );

  function openCreateForm() {
    setEditingCategory(null);
    setForm(initialForm);
    setSlugManuallyEdited(false);
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(category: CategoryRow) {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image ?? "",
    });
    setSlugManuallyEdited(true);
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    if (isSaving || isUploading) return;
    setFormOpen(false);
    setEditingCategory(null);
    setFormError("");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || isUploading) return;

    setIsSaving(true);
    setFormError("");
    const input: CategoryInput = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      image: form.image,
    };
    let result: CategoryMutationResult;
    try {
      result = editingCategory
        ? await updateCategoryAction(editingCategory.id, input)
        : await createCategoryAction(input);
    } catch {
      setIsSaving(false);
      setFormError("The category could not be saved. Check your connection and try again.");
      return;
    }
    setIsSaving(false);

    if (!result.success) {
      setFormError(result.message);
      return;
    }

    setFormOpen(false);
    setEditingCategory(null);
    setForm(initialForm);
    setNotice(editingCategory ? "Category updated successfully." : "Category created successfully.");
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteCategory || isDeleting || deleteCategory.postCount > 0) return;

    setIsDeleting(true);
    setDeleteError("");
    let result: DeleteCategoryResult;
    try {
      result = await deleteCategoryAction(deleteCategory.id);
    } catch {
      setIsDeleting(false);
      setDeleteError("The category could not be deleted. Check your connection and try again.");
      return;
    }
    setIsDeleting(false);

    if (!result.success) {
      if (result.code === "has-posts") {
        setDeleteCategory({
          ...deleteCategory,
          name: result.categoryName ?? deleteCategory.name,
          postCount: result.postCount ?? deleteCategory.postCount,
        });
        setDeleteError(
          `${result.categoryName ?? deleteCategory.name} has ${result.postCount ?? 0} connected ${
            result.postCount === 1 ? "post" : "posts"
          } and cannot be deleted until those posts are reassigned or removed.`,
        );
      } else {
        setDeleteError(result.message);
      }
      return;
    }

    setDeleteCategory(null);
    setNotice("Category deleted successfully.");
    router.refresh();
  }

  function openDeleteConfirmation(category: CategoryRow) {
    setDeleteCategory(category);
    setDeleteError(
      category.postCount > 0
        ? `${category.name} has ${category.postCount} connected ${
            category.postCount === 1 ? "post" : "posts"
          } and cannot be deleted until those posts are reassigned or removed.`
        : "",
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-[#444444]">
      <AdminSidebar username={username} activeHref="/admin-dashboard/categories" />
      <main className="min-w-0 overflow-x-clip lg:ml-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 flex-col justify-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <MobileAdminNavigation
                username={username}
                activeHref="/admin-dashboard/categories"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">Categories</h1>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Organize your articles and manage category details.
                </p>
              </div>
              <Button
                type="button"
                onClick={openCreateForm}
                className="min-h-11 rounded-xl bg-[#02a95c] px-4 text-white hover:bg-[#029650]"
              >
                <Plus aria-hidden="true" />
                New Category
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
          {loadError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {loadError}
            </p>
          )}
          {notice && (
            <div
              role="status"
              className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900"
            >
              {notice}
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
                className="inline-flex size-8 items-center justify-center rounded-md hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c]"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          )}

          <section
            aria-labelledby="category-table-title"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 id="category-table-title" className="font-bold">All Categories</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {totalCategories} {totalCategories === 1 ? "category" : "categories"}
                </p>
              </div>
            </div>

            {!loadError && categories.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <h3 className="font-semibold text-slate-800">No categories yet</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Create a category to organize ChronicleFiles articles.
                </p>
                <Button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 min-h-11 rounded-xl bg-[#02a95c] px-4 text-white hover:bg-[#029650]"
                >
                  Create a category
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <caption className="sr-only">ChronicleFiles categories</caption>
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-medium">Category</th>
                      <th scope="col" className="px-5 py-3 font-medium">Slug</th>
                      <th scope="col" className="px-5 py-3 font-medium">Connected posts</th>
                      <th scope="col" aria-label="Actions" className="px-5 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-slate-50">
                        <th scope="row" className="max-w-[22rem] px-5 py-4 text-left">
                          <div className="flex min-w-0 items-center gap-3">
                            {category.image ? (
                              <Image
                                unoptimized
                                src={category.image}
                                alt=""
                                width={48}
                                height={48}
                                className="size-12 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <span
                                aria-hidden="true"
                                className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#e8f2f4] text-[#608a89]"
                              >
                                <ImagePlus className="size-5" />
                              </span>
                            )}
                            <span className="truncate font-semibold text-slate-800">
                              {category.name}
                            </span>
                          </div>
                        </th>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          /{category.slug}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {category.postCount}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="min-h-11 rounded-lg border-slate-300"
                              onClick={() => openEditForm(category)}
                            >
                              <Pencil aria-hidden="true" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="min-h-11 rounded-lg border-slate-300 text-red-700 hover:bg-red-50"
                              onClick={() => openDeleteConfirmation(category)}
                            >
                              <Trash2 aria-hidden="true" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          {totalPages > 1 && (
            <nav
              aria-label="Category list pagination"
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <p className="text-sm text-slate-500">
                Showing {Math.min((page - 1) * 10 + 1, totalCategories)}–
                {Math.min(page * 10, totalCategories)} of {totalCategories} categories
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/admin-dashboard/categories?page=${page - 1}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c]"
                  >
                    Previous
                  </Link>
                )}
                {visiblePages.map((pageNumber) => (
                    <Link
                      key={pageNumber}
                      href={`/admin-dashboard/categories?page=${pageNumber}`}
                      aria-current={pageNumber === page ? "page" : undefined}
                      aria-label={`Page ${pageNumber}`}
                      className={
                        pageNumber === page
                          ? "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-[#02a95c] px-3 text-sm font-semibold text-white"
                          : "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c]"
                      }
                    >
                      {pageNumber}
                    </Link>
                ))}
                {page < totalPages && (
                  <Link
                    href={`/admin-dashboard/categories?page=${page + 1}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c]"
                  >
                    Next
                  </Link>
                )}
              </div>
            </nav>
          )}
        </div>
      </main>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-form-title"
            className="my-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="category-form-title" className="text-xl font-bold text-slate-900">
                  {editingCategory ? "Edit Category" : "Create Category"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Category images are optional.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close category form"
                onClick={closeForm}
                disabled={isSaving || isUploading}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] disabled:opacity-50"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={(event) => void handleSave(event)}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Category name</span>
                <input
                  required
                  maxLength={80}
                  value={form.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setForm((current) => ({
                      ...current,
                      name,
                      slug: slugManuallyEdited ? current.slug : toSlug(name),
                    }));
                  }}
                  className="min-h-11 w-full rounded-xl border border-slate-300 px-4 py-2 text-base outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-green-100"
                  autoComplete="off"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Slug</span>
                <input
                  required
                  value={form.slug}
                  onChange={(event) => {
                    setSlugManuallyEdited(true);
                    setForm((current) => ({ ...current, slug: toSlug(event.target.value) }));
                  }}
                  className="min-h-11 w-full rounded-xl border border-slate-300 px-4 py-2 text-base outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-green-100"
                  autoComplete="off"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  Description <span className="font-normal text-slate-500">(optional)</span>
                </span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-green-100"
                />
              </label>

              <div>
                <span className="mb-2 block text-sm font-semibold">
                  Category image <span className="font-normal text-slate-500">(optional)</span>
                </span>
                <CloudinaryUploadButton
                  target="categoryImage"
                  onUploaded={(image) => setForm((current) => ({ ...current, image }))}
                  onUploadingChange={setIsUploading}
                  disabled={isSaving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#e8f2f4] px-4 text-sm font-medium text-[#02a95c] hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] disabled:opacity-50"
                >
                  <ImagePlus aria-hidden="true" className="size-4" />
                  {isUploading
                    ? "Uploading image..."
                    : form.image
                      ? "Replace image"
                      : "Choose image"}
                </CloudinaryUploadButton>
                {form.image && (
                  <div className="mt-3 flex items-center gap-3">
                    <Image
                      unoptimized
                      src={form.image}
                      alt="Category image preview"
                      width={96}
                      height={64}
                      className="h-16 w-24 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, image: "" }))}
                      className="min-h-11 px-3 text-sm font-medium text-red-700 underline underline-offset-2"
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>

              {formError && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 rounded-lg border-slate-300"
                  onClick={closeForm}
                  disabled={isSaving || isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="min-h-11 rounded-lg bg-[#02a95c] px-5 text-white hover:bg-[#029650]"
                  disabled={isSaving || isUploading}
                >
                  {isSaving
                    ? "Saving..."
                    : editingCategory
                      ? "Save changes"
                      : "Create category"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-category-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h2 id="delete-category-title" className="text-xl font-bold text-slate-900">
              {deleteCategory.postCount > 0 ? "Category cannot be deleted" : "Delete Category?"}
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              Category: <strong>{deleteCategory.name}</strong>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Connected posts: <strong>{deleteCategory.postCount}</strong>
            </p>
            {deleteCategory.postCount > 0 ? (
              <p className="mt-3 text-sm text-slate-600">
                Reassign or remove these posts before deleting this category. No category or post has been changed.
              </p>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                Are you sure you want to delete this category? This action cannot be undone.
              </p>
            )}

            {deleteError && (
              <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 rounded-lg border-slate-300"
                onClick={() => {
                  if (!isDeleting) {
                    setDeleteCategory(null);
                    setDeleteError("");
                  }
                }}
                disabled={isDeleting}
              >
                {deleteCategory.postCount > 0 ? "Close" : "Cancel"}
              </Button>
              {deleteCategory.postCount === 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  className="min-h-11 rounded-lg"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
