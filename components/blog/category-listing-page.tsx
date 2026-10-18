import Link from "next/link";
import { PublicAnalyticsTracker } from "@/components/analytics/public-analytics-tracker";
import { AdSlot } from "@/components/blog/ad-slot";
import { ArticleSidebar } from "@/components/blog/article-sidebar";
import { CategoryNavigation } from "@/components/blog/category-navigation";
import { CategoryPostCard } from "@/components/blog/category-post-card";
import {
  PublicSiteFooter,
  PublicSiteHeader,
} from "@/components/blog/public-site-header";
import {
  PUBLIC_POSTS_PER_PAGE,
  type PublicArticleSidebarData,
  type PublicPostSort,
  type PublicPostListing,
} from "@/lib/public-posts";

interface CategoryListingPageProps {
  listing: PublicPostListing;
  sidebar: PublicArticleSidebarData;
  currentPath: string;
  trackingPath: string;
  title: string;
  description?: string;
  activeCategorySlug?: string;
  isLatest: boolean;
}

function getPageHref(
  path: string,
  page: number,
  sort: PublicPostSort,
  search: string,
): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (sort !== "latest") params.set("sort", sort);
  if (search) params.set("q", search);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function ListingPagination({
  path,
  page,
  totalPages,
  totalPosts,
  sort,
  search,
}: {
  path: string;
  page: number;
  totalPages: number;
  totalPosts: number;
  sort: PublicPostSort;
  search: string;
}) {
  const pageCount = Math.max(1, totalPages);
  const visiblePageCount = Math.min(4, pageCount);
  const firstVisiblePage = Math.max(
    1,
    Math.min(page - 1, pageCount - visiblePageCount + 1),
  );
  const lastVisiblePage = firstVisiblePage + visiblePageCount - 1;
  const buttonClass =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-[4px] border border-[#e0e7e2] bg-white px-3 text-[13px] font-bold !text-[#444444] transition hover:border-[#02A95C] hover:!text-[#02A95C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]";
  const activeClass =
    "!border-[#02A95C] !bg-[#02A95C] !text-white hover:!text-white";
  const disabledClass =
    "inline-flex h-10 min-w-10 cursor-not-allowed items-center justify-center rounded-[4px] border border-[#e0e7e2] bg-white px-3 text-[13px] font-bold text-[#444] opacity-40";

  return (
    <nav
      aria-label="Article pagination"
      className="mt-8 border-t border-gray-200 pt-6"
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 ? (
          <Link
            href={getPageHref(path, page - 1, sort, search)}
            rel="prev"
            aria-label="Previous page"
            className={buttonClass}
          >
            Prev
          </Link>
        ) : (
          <span aria-disabled="true" className={disabledClass}>
            Prev
          </span>
        )}

        {firstVisiblePage > 1 && (
          <span aria-hidden="true" className="px-1 text-sm text-gray-400">
            …
          </span>
        )}
        {Array.from(
          { length: lastVisiblePage - firstVisiblePage + 1 },
          (_, index) => firstVisiblePage + index,
        ).map((number) => (
          <Link
            key={number}
            href={getPageHref(path, number, sort, search)}
            aria-label={`Page ${number}`}
            aria-current={number === page ? "page" : undefined}
            className={`${buttonClass} ${number === page ? activeClass : ""}`}
          >
            {number}
          </Link>
        ))}
        {lastVisiblePage < pageCount && (
          <span aria-hidden="true" className="px-1 text-sm text-gray-400">
            …
          </span>
        )}

        {page < pageCount ? (
          <Link
            href={getPageHref(path, page + 1, sort, search)}
            rel="next"
            aria-label="Next page"
            className={buttonClass}
          >
            Next
          </Link>
        ) : (
          <span aria-disabled="true" className={disabledClass}>
            Next
          </span>
        )}
      </div>
      <p
        aria-live="polite"
        className="mt-4 text-center text-xs text-gray-500"
      >
        Page {page} of {pageCount} · {totalPosts} articles
      </p>
    </nav>
  );
}

export function CategoryListingPage({
  listing,
  sidebar,
  currentPath,
  trackingPath,
  title,
  description,
  activeCategorySlug,
  isLatest,
}: CategoryListingPageProps) {
  const categories = sidebar.categories.filter(
    (category) => category.slug.toLowerCase() !== "latest",
  );
  const firstResult = listing.totalPosts
    ? (listing.page - 1) * PUBLIC_POSTS_PER_PAGE + 1
    : 0;
  const lastResult = Math.min(
    listing.page * PUBLIC_POSTS_PER_PAGE,
    listing.totalPosts,
  );

  return (
    <>
      <PublicAnalyticsTracker
        key={`${trackingPath}:${listing.page}`}
        path={trackingPath}
      />
      <PublicSiteHeader categories={categories} />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-3 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 pt-6 text-xs text-gray-500"
        >
          <Link
            href="/"
            data-analytics-event="blog-navigation"
            className="rounded-sm hover:text-[#02A95C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
          >
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-[#02A95C]" aria-current="page">
            {title}
          </span>
        </nav>

        <header className="mt-5 flex flex-col justify-between gap-5 border-b border-gray-200 pb-7 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#02A95C]">
              Explore the latest
            </p>
            <h1 className="text-3xl font-black tracking-[-1.3px] text-[#242424] sm:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
                {description}
              </p>
            )}
          </div>
          <p className="shrink-0 text-xs text-gray-500">
            Showing{" "}
            <strong className="text-gray-800">
              {firstResult === lastResult
                ? firstResult
                : `${firstResult}–${lastResult}`}
            </strong>{" "}
            of <strong className="text-gray-800">{listing.totalPosts}</strong>{" "}
            articles
          </p>
        </header>

        <CategoryNavigation
          categories={categories}
          activeSlug={activeCategorySlug}
          isLatest={isLatest}
        />

        <AdSlot format="inline" placement="category-listing-top" />

        <div className="grid min-w-0 grid-cols-1 items-start gap-8 min-[1024px]:grid-cols-[minmax(0,1fr)_300px]">
          <section className="min-w-0" aria-labelledby="article-list-heading">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
              <h2
                id="article-list-heading"
                className="border-b-2 border-[#02A95C] pb-3 text-xl font-black tracking-tight text-[#292929]"
              >
                {isLatest ? "Latest Articles" : `${title} Articles`}
              </h2>
              <p className="mt-2 text-xs text-gray-500">
                {isLatest
                  ? "Ideas, updates and stories worth your time."
                  : `Published stories and articles in ${title}.`}
              </p>
              </div>
              <form
                action={currentPath}
                method="get"
                role="search"
                className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[360px] sm:flex-row sm:items-end"
              >
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="category-post-search"
                    className="mb-1.5 block text-xs font-semibold text-[#444]"
                  >
                    Search articles
                  </label>
                  <input
                    id="category-post-search"
                    type="search"
                    name="q"
                    defaultValue={listing.search}
                    maxLength={100}
                    placeholder="Search"
                    className="min-h-10 w-full rounded-[4px] border border-[#dce3df] bg-white px-3 text-sm text-[#444] outline-none placeholder:text-[#87918b] focus:border-[#02A95C] focus:ring-2 focus:ring-[#02A95C]/20"
                  />
                </div>
                <div className="w-full sm:w-[140px]">
                  <label
                    htmlFor="category-post-sort"
                    className="mb-1.5 block text-xs font-semibold text-[#444]"
                  >
                    Sort by
                  </label>
                  <select
                    id="category-post-sort"
                    name="sort"
                    defaultValue={listing.sort}
                    className="min-h-10 w-full rounded-[4px] border border-[#dce3df] bg-white px-3 text-sm text-[#444] outline-none focus:border-[#02A95C] focus:ring-2 focus:ring-[#02A95C]/20"
                  >
                    <option value="latest">Latest</option>
                    <option value="popular">Popular</option>
                    <option value="oldest">Oldest</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="inline-flex min-h-10 items-center justify-center rounded-[4px] bg-[#02A95C] px-4 text-sm font-bold text-white transition hover:bg-[#078b50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C] focus-visible:ring-offset-2 sm:mb-0"
                >
                  Apply
                </button>
              </form>
            </div>
            {listing.search && (
              <p className="mb-4 text-xs text-gray-500" aria-live="polite">
                {listing.searchMatchedBy === "title"
                  ? "Matching article titles"
                  : "No title matches; showing articles with matching tags"}{" "}
                for &ldquo;{listing.search}&rdquo;.
              </p>
            )}
            {listing.sort === "popular" && (
                <p className="mb-4 text-xs text-gray-500">
                  Popularity is ranked using available recorded article page
                  views.
                </p>
            )}

            {listing.posts.length ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {listing.posts.map((post, index) => (
                  <CategoryPostCard
                    key={post.id}
                    post={post}
                    eager={index === 0}
                  />
                ))}
              </div>
            ) : (
              <section className="rounded border border-gray-200 px-5 py-12 text-center">
                <h3 className="text-lg font-black text-gray-800">
                  {isLatest
                    ? listing.search
                      ? "No matching published articles"
                      : "No published articles yet"
                    : listing.search
                      ? "No matching published articles in this category"
                      : `No published articles in ${title} yet`}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {listing.search
                    ? "Try a different title or tag."
                    : isLatest
                      ? "Please check back soon for the latest stories."
                      : "Explore another category or check back soon."}
                </p>
              </section>
            )}

            <ListingPagination
              path={currentPath}
              page={listing.page}
              totalPages={listing.totalPages}
              totalPosts={listing.totalPosts}
              sort={listing.sort}
              search={listing.search}
            />

            <AdSlot format="inline" placement="category-listing-bottom" />
          </section>

          <ArticleSidebar
            recommendations={sidebar.recommendations}
            categories={categories}
            layout="listing"
          />
        </div>
      </main>
      <PublicSiteFooter categories={categories} />
    </>
  );
}
