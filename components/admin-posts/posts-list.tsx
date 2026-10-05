import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { AdminSidebar } from "@/components/admin-dashboard/admin-navigation";
import { MobileAdminNavigation } from "@/components/admin-dashboard/mobile-admin-navigation";
import { StatusBadge } from "@/components/admin-dashboard/status-badge";
import { Button } from "@/components/ui/button";

const greenLinkClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#02a95c] px-4 text-sm font-medium text-white transition hover:bg-[#029650] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] focus-visible:ring-offset-2";
const outlineLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] focus-visible:ring-offset-2";
const subtleLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] focus-visible:ring-offset-2";

interface PostRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: "draft" | "published";
  updatedAt: string;
}

interface PostsListProps {
  username: string;
  posts: PostRow[];
  categories: { id: string; name: string }[];
  filters: { query: string; status: string; category: string };
  page: number;
  totalPages: number;
  totalPosts: number;
  loadError?: string;
  notice?: "draft-saved" | "draft-updated" | "post-published" | "post-updated";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function PostsList({
  username,
  posts,
  categories,
  filters,
  page,
  totalPages,
  totalPosts,
  loadError,
  notice,
}: PostsListProps) {
  const successMessage = notice
    ? {
        "draft-saved": "Draft saved successfully.",
        "draft-updated": "Draft updated successfully.",
        "post-published": "Post published successfully.",
        "post-updated": "Post updated and published successfully.",
      }[notice]
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50 text-[#444444]">
      <AdminSidebar username={username} activeHref="/admin-dashboard/posts" />
      <main className="min-w-0 overflow-x-clip lg:ml-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 flex-col justify-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <MobileAdminNavigation
                username={username}
                activeHref="/admin-dashboard/posts"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold sm:text-2xl">Posts</h1>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Manage your articles and publication status.
                </p>
              </div>
              <Link href="/admin-dashboard/posts/new" className={greenLinkClass}>
                <Plus aria-hidden="true" />
                New Post
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
          {loadError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {loadError}
            </p>
          )}
          {successMessage && (
            <p
              role="status"
              className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900"
            >
              {successMessage}
            </p>
          )}

          <section
            aria-label="Filter posts"
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <form action="/admin-dashboard/posts" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_12rem_14rem_auto_auto]">
              <label className="relative block">
                <span className="sr-only">Search posts</span>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  name="q"
                  defaultValue={filters.query}
                  placeholder="Search by title or slug"
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-green-100"
                />
              </label>
              <label>
                <span className="sr-only">Filter by status</span>
                <select
                  name="status"
                  defaultValue={filters.status}
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-green-100"
                >
                  <option value="">All statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </label>
              <label>
                <span className="sr-only">Filter by category</span>
                <select
                  name="category"
                  defaultValue={filters.category}
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-green-100"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                type="submit"
                variant="outline"
                className="min-h-11 rounded-xl border-slate-300"
              >
                Apply filters
              </Button>
              <Link href="/admin-dashboard/posts" className={subtleLinkClass}>
                Clear
              </Link>
            </form>
          </section>

          <section
            aria-labelledby="posts-table-title"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 id="posts-table-title" className="font-bold">All Posts</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {totalPosts} {totalPosts === 1 ? "post" : "posts"}
                </p>
              </div>
            </div>

            {!loadError && posts.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <h3 className="font-semibold text-slate-800">
                  {filters.query || filters.status || filters.category
                    ? "No posts match these filters"
                    : "No posts yet"}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Create an article to start building the ChronicleFiles library.
                </p>
                <Link
                  href="/admin-dashboard/posts/new"
                  className={`${greenLinkClass} mt-5`}
                >
                  Create a post
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <caption className="sr-only">ChronicleFiles posts</caption>
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-medium">Post</th>
                      <th scope="col" className="px-5 py-3 font-medium">Category</th>
                      <th scope="col" className="px-5 py-3 font-medium">Status</th>
                      <th scope="col" className="px-5 py-3 font-medium">Updated</th>
                      <th
                        scope="col"
                        aria-label="Actions"
                        className="px-5 py-3 font-medium"
                      />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-slate-50">
                        <th scope="row" className="max-w-[24rem] px-5 py-4 text-left">
                          <p className="truncate font-semibold text-slate-800">
                            {post.title}
                          </p>
                          <p className="mt-1 truncate text-xs font-normal text-slate-500">
                            /{post.slug}
                          </p>
                        </th>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {post.category}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={post.status} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          <time dateTime={post.updatedAt}>
                            {formatDate(post.updatedAt)}
                          </time>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/admin-dashboard/posts/${post.id}/edit`}
                            className={outlineLinkClass}
                          >
                            Edit
                          </Link>
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
              aria-label="Post list pagination"
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <p className="text-sm text-slate-500">
                Page {Math.min(page, totalPages)} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={pageHref(filters, page - 1)} className={outlineLinkClass}>
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={pageHref(filters, page + 1)} className={outlineLinkClass}>
                    Next
                  </Link>
                )}
              </div>
            </nav>
          )}
        </div>
      </main>
    </div>
  );
}

function pageHref(
  filters: PostsListProps["filters"],
  page: number,
) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  params.set("page", String(page));
  return `/admin-dashboard/posts?${params.toString()}`;
}
