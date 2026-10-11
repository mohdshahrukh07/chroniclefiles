import Link from "next/link";
import { Search } from "lucide-react";
import type { PublicCategoryLink } from "@/lib/public-posts";
import { PublicCategoryDropdown } from "@/components/blog/public-category-dropdown";

interface PublicSiteHeaderProps {
  categories?: PublicCategoryLink[];
}

export function PublicSiteHeader({
  categories = [],
}: PublicSiteHeaderProps = {}) {
  const featuredCategories = categories.filter((category) =>
    ["news", "technology"].includes(category.slug.toLowerCase()),
  );
  const otherCategories = categories.filter(
    (category) =>
      !["news", "technology"].includes(category.slug.toLowerCase()),
  );

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[76px] items-center justify-between gap-5">
          <Link
            href="/"
            className="shrink-0 rounded-sm text-[25px] font-black tracking-[-1.4px] text-[#222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C] sm:text-[29px]"
          >
            Chronicle<span className="text-[#02A95C]">Files</span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-5 text-[13px] font-bold text-gray-700 min-[768px]:flex min-[900px]:gap-7"
          >
            <Link
              href="/"
              data-analytics-event="blog-navigation"
              className="rounded-sm transition hover:text-[#02A95C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
            >
              Home
            </Link>
            <Link
              href="/blog"
              data-analytics-event="blog-navigation"
              className="rounded-sm transition hover:text-[#02A95C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
            >
              Latest
            </Link>
            {featuredCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                data-analytics-event="category-link"
                className="rounded-sm transition hover:text-[#02A95C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
              >
                {category.name}
              </Link>
            ))}
            {otherCategories.length > 0 && (
              <PublicCategoryDropdown categories={otherCategories} />
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <details className="relative">
              <summary
                aria-label="Search stories"
                className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full bg-gray-100 text-[#444] transition hover:bg-[#E8F2F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C] [&::-webkit-details-marker]:hidden"
              >
                <Search aria-hidden="true" className="size-5" />
              </summary>
              <form
                action="/blog"
                role="search"
                className="absolute right-0 top-full z-50 mt-2 flex w-[min(86vw,420px)] gap-2 rounded-md border border-[#e4eae7] bg-white p-3 shadow-[0_14px_35px_rgba(0,0,0,.12)]"
              >
                <label htmlFor="public-header-search" className="sr-only">
                  Search stories
                </label>
                <input
                  id="public-header-search"
                  name="q"
                  type="search"
                  placeholder="Search stories..."
                  className="min-h-11 min-w-0 flex-1 rounded border border-gray-200 px-3 text-sm outline-none focus:border-[#02A95C] focus:ring-2 focus:ring-[#02A95C]/20"
                />
                <button
                  type="submit"
                  className="min-h-11 rounded bg-[#02A95C] px-4 text-sm font-bold text-white hover:bg-[#029650] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C] focus-visible:ring-offset-2"
                >
                  Search
                </button>
              </form>
            </details>

            <details className="relative min-[768px]:hidden">
              <summary
                aria-label="Site navigation"
                className="flex size-11 cursor-pointer list-none items-center justify-center rounded-md border border-gray-200 text-xl text-[#444] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C] [&::-webkit-details-marker]:hidden"
              >
                <span aria-hidden="true">☰</span>
              </summary>
              <nav
                aria-label="Mobile navigation"
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(86vw,360px)] rounded-md border border-[#e5eae7] bg-white p-3 shadow-[0_14px_35px_rgba(0,0,0,.12)]"
              >
                <Link
                  href="/"
                  data-analytics-event="blog-navigation"
                  className="block rounded-sm px-3 py-2.5 text-sm font-bold hover:bg-[#E8F2F4] hover:text-[#02A95C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
                >
                  Home
                </Link>
                <Link
                  href="/blog"
                  data-analytics-event="blog-navigation"
                  className="block rounded-sm px-3 py-2.5 text-sm font-bold hover:bg-[#E8F2F4] hover:text-[#02A95C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
                >
                  Latest
                </Link>
                {categories.length > 0 && (
                  <div className="mt-2 border-t border-gray-100 pt-2">
                    <p className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#608A89]">
                      Categories
                    </p>
                    <ul className="grid grid-cols-2 gap-1">
                      {categories.map((category) => (
                        <li key={category.slug}>
                          <Link
                            href={`/category/${category.slug}`}
                            data-analytics-event="category-link"
                            className="block rounded-sm px-3 py-2.5 text-sm font-semibold hover:bg-[#E8F2F4] hover:text-[#02A95C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
                          >
                            {category.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </nav>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}

interface PublicSiteFooterProps {
  categories?: PublicCategoryLink[];
}

export function PublicSiteFooter({
  categories = [],
}: PublicSiteFooterProps = {}) {
  return (
    <footer className="mt-auto bg-[#202b28] text-white">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="rounded-sm text-3xl font-black tracking-[-1.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78e6a8]"
            >
              Chronicle<span className="text-[#02A95C]">Files</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-300">
              Stories, ideas and knowledge to keep curious minds moving
              forward.
            </p>
          </div>

          <div>
            <h2 className="font-bold">Explore</h2>
            <nav
              aria-label="Footer explore links"
              className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-gray-300"
            >
              <Link
                className="rounded-sm hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78e6a8]"
                href="/blog"
                data-analytics-event="blog-navigation"
              >
                Latest Stories
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  className="rounded-sm hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78e6a8]"
                  href={`/category/${category.slug}`}
                  data-analytics-event="category-link"
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h2 className="font-bold">ChronicleFiles</h2>
            <p className="mt-4 text-sm leading-6 text-gray-300">
              Independent stories and useful ideas for a world that never stops
              changing.
            </p>
          </div>
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-5 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} ChronicleFiles. All rights reserved.</p>
          <p>Stories · Ideas · Knowledge</p>
        </div>
      </div>
    </footer>
  );
}
