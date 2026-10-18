import Image from "next/image";
import Link from "next/link";
import type { PublicCategoryLink } from "@/lib/public-posts";
import type { PublicPostCardData } from "@/components/blog/public-post-card";
import { AdSlot } from "@/components/blog/ad-slot";
import { arePublicAdsConfigured } from "@/lib/public-site-config";

interface ArticleSidebarProps {
  recommendations: PublicPostCardData[];
  categories: PublicCategoryLink[];
  layout?: "article" | "listing";
}

export function Recommendations({
  posts,
  hasTopAd,
}: {
  posts: PublicPostCardData[];
  hasTopAd: boolean;
}) {
  return (
    <section
      className={`${hasTopAd ? "mt-7" : "mt-0"} mb-7`}
      aria-labelledby="recommendations-heading"
    >
      <h2
        id="recommendations-heading"
        className="mb-4 border-b border-[#e5ebe7] pb-3 font-sans text-xl font-extrabold text-[#2b362f]"
      >
        Recommended Reads
      </h2>
      {posts.length ? (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/post/${post.slug}`}
                data-analytics-event="post-card"
                className="group grid min-h-18 grid-cols-[92px_minmax(0,1fr)] items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
              >
                <span className="relative block h-[72px] overflow-hidden rounded-md bg-[#E8F2F4]">
                  {post.thumbnail && (
                    <Image
                      unoptimized
                      src={post.thumbnail}
                      alt={post.title}
                      fill
                      sizes="92px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="mb-1 block text-sm font-bold leading-[1.45] text-[#39433d] group-hover:text-[#02A95C]">
                    {post.title}
                  </span>
                  <span className="block text-xs text-[#7b8580]">
                    {post.categoryName}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-6 text-[#66716c]">
          There are no other published articles to recommend yet.
        </p>
      )}
    </section>
  );
}

export function ExploreCategories({
  categories,
  hasBottomAd,
}: {
  categories: PublicCategoryLink[];
  hasBottomAd: boolean;
}) {
  return (
    <section
      className={hasBottomAd ? "mb-7" : ""}
      aria-labelledby="explore-categories-heading"
    >
      <h2
        id="explore-categories-heading"
        className="mb-4 border-b border-[#e5ebe7] pb-3 font-sans text-xl font-extrabold text-[#2b362f]"
      >
        Explore Categories
      </h2>
      {categories.length ? (
        <ul className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/category/${category.slug}`}
                data-analytics-event="category-link"
                className="inline-flex min-h-10 items-center rounded-full bg-[#edf7f1] px-3 text-[13px] text-[#31734e] hover:bg-[#d9f1e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02A95C]"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-6 text-[#66716c]">
          Categories will appear here when they are available.
        </p>
      )}
    </section>
  );
}

export function ArticleSidebar({
  recommendations,
  categories,
  layout = "article",
}: ArticleSidebarProps) {
  const adsConfigured = arePublicAdsConfigured();

  return (
    <aside
      aria-label={
        layout === "listing"
          ? "Advertisements and recommendations"
          : "Article sidebar"
      }
      className={
        layout === "listing"
          ? "grid min-w-0 grid-cols-1 items-start gap-7 min-[768px]:grid-cols-2 min-[1024px]:sticky min-[1024px]:top-24 min-[1024px]:grid-cols-1"
          : "min-w-0 md:sticky md:top-5 md:self-start"
      }
    >
      <AdSlot
        format="square"
        placement={
          layout === "listing"
            ? "category-sidebar-top"
            : "article-sidebar-top"
        }
      />
      <Recommendations posts={recommendations} hasTopAd={adsConfigured} />
      <ExploreCategories
        categories={categories}
        hasBottomAd={adsConfigured}
      />
      <AdSlot
        format="square"
        placement={
          layout === "listing"
            ? "category-sidebar-bottom"
            : "article-sidebar-bottom"
        }
      />
    </aside>
  );
}
