import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CategoryListingPage } from "@/components/blog/category-listing-page";
import {
  getPublishedArticleSidebarData,
  getPublishedPostListing,
  normalizePublicPostSearch,
  parsePublicListingPage,
  parsePublicPostSort,
} from "@/lib/public-posts";
import { getPublicSiteUrl } from "@/lib/public-site-config";

interface BlogPageProps {
  searchParams: Promise<{
    page?: string | string[];
    sort?: string | string[];
    q?: string | string[];
  }>;
}

function getListingUrl(
  page: number,
  sort: "latest" | "popular" | "oldest",
  siteUrl: URL,
): string {
  const url = new URL("/blog", siteUrl);
  if (page > 1) url.searchParams.set("page", String(page));
  if (sort !== "latest") url.searchParams.set("sort", sort);
  return url.toString();
}

function getPageHref(
  page: number,
  sort: "latest" | "popular" | "oldest",
  search: string,
): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (sort !== "latest") params.set("sort", sort);
  if (search) params.set("q", search);
  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}

export async function generateMetadata({
  searchParams,
}: BlogPageProps): Promise<Metadata> {
  const { page: pageValue, sort: sortValue } = await searchParams;
  const page = parsePublicListingPage(pageValue);
  const sort = parsePublicPostSort(sortValue);
  const title =
    `${sort === "popular" ? "Popular" : sort === "oldest" ? "Oldest" : "Latest"} Articles${page > 1 ? ` - Page ${page}` : ""} | ChronicleFiles`;
  const description =
    `Browse ${sort} published ChronicleFiles articles across every category${page > 1 ? `, page ${page}` : ""}.`;
  const siteUrl = getPublicSiteUrl();
  const canonicalUrl = siteUrl
    ? getListingUrl(page, sort, siteUrl)
    : undefined;

  return {
    title,
    description,
    ...(siteUrl ? { metadataBase: siteUrl } : {}),
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    openGraph: {
      type: "website",
      siteName: "ChronicleFiles",
      title,
      description,
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page: pageValue, sort: sortValue, q: searchValue } =
    await searchParams;
  const requestedPage = parsePublicListingPage(pageValue);
  const sort = parsePublicPostSort(sortValue);
  const search = normalizePublicPostSearch(searchValue);
  let listing;
  let sidebar;

  try {
    [listing, sidebar] = await Promise.all([
      getPublishedPostListing({ page: requestedPage, sort, search }),
      getPublishedArticleSidebarData(""),
    ]);
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Public latest listing could not be loaded (${errorName}).`);
    throw new Error("The latest articles could not be loaded. Please try again.");
  }

  if (listing.page !== requestedPage) {
    redirect(getPageHref(listing.page, sort, search));
  }

  return (
    <CategoryListingPage
      listing={listing}
      sidebar={sidebar}
      currentPath="/blog"
      trackingPath="/blog"
      title="Latest"
      description="Browse every story, with the newest articles first."
      isLatest
    />
  );
}
