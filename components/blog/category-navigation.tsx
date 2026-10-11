"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicCategoryLink } from "@/lib/public-posts";

interface CategoryNavigationProps {
  categories: PublicCategoryLink[];
  activeSlug?: string;
  isLatest: boolean;
}

const INITIAL_CATEGORY_COUNT = 3;

export function CategoryNavigation({
  categories,
  activeSlug,
  isLatest,
}: CategoryNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeCategoryIndex = categories.findIndex(
    (category) => category.slug === activeSlug,
  );
  const visibleCategories =
    activeCategoryIndex >= INITIAL_CATEGORY_COUNT
      ? [
          ...categories.slice(0, INITIAL_CATEGORY_COUNT - 1),
          categories[activeCategoryIndex],
        ]
      : categories.slice(0, INITIAL_CATEGORY_COUNT);
  const visibleSlugs = new Set(visibleCategories.map(({ slug }) => slug));
  const hiddenCategories = categories.filter(
    (category) => !visibleSlugs.has(category.slug),
  );
  const linkClass =
    "inline-flex min-h-10 items-center rounded-[3px] bg-[#E8F2F4] px-3 text-xs font-bold text-[#426b64] transition hover:bg-[#02A95C] hover:text-white aria-[current=page]:!bg-[#02A95C] aria-[current=page]:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]";

  return (
    <nav
      aria-label="Article categories"
      className="flex flex-wrap items-center gap-2 py-5"
    >
      <Link
        href="/blog"
        data-analytics-event="blog-navigation"
        aria-current={isLatest ? "page" : undefined}
        className={linkClass}
      >
        Latest
      </Link>
      {visibleCategories.map((category) => {
        const isActive = !isLatest && category.slug === activeSlug;
        return (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            data-analytics-event="category-link"
            aria-current={isActive ? "page" : undefined}
            className={linkClass}
          >
            {category.name}
          </Link>
        );
      })}
      {isExpanded &&
        hiddenCategories.map((category) => {
          const isActive = !isLatest && category.slug === activeSlug;
          return (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              data-analytics-event="category-link"
              aria-current={isActive ? "page" : undefined}
              className={linkClass}
            >
              {category.name}
            </Link>
          );
        })}
      {hiddenCategories.length > 0 && (
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className="inline-flex min-h-10 items-center rounded-[3px] border border-[#dce7e0] bg-white px-3 text-xs font-bold text-[#367064] transition hover:border-[#02A95C] hover:text-[#02A95C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
        >
          {isExpanded ? "Less" : "More"}
        </button>
      )}
    </nav>
  );
}
