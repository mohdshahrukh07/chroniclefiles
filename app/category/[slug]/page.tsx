import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CategoryListingPage } from "@/components/blog/category-listing-page";
import {
  getPublishedArticleSidebarData,
  getPublishedCategory,
  getPublishedPostListing,
  normalizePublicPostSearch,
  parsePublicListingPage,
  parsePublicPostSort,
} from "@/lib/public-posts";
import { getPublicSiteUrl } from "@/lib/public-site-config";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string | string[];
    sort?: string | string[];
    q?: string | string[];
  }>;
}

function getCategoryPath(slug: string): string {
  return `/category/${encodeURIComponent(slug)}`;
}

function getListingUrl(
  path: string,
  page: number,
  sort: "latest" | "popular" | "oldest",
  siteUrl: URL,
): string {
  const url = new URL(path, siteUrl);
  if (page > 1) url.searchParams.set("page", String(page));
  if (sort !== "latest") url.searchParams.set("sort", sort);
  return url.toString();
}

function getPageHref(
  path: string,
  page: number,
  sort: "latest" | "popular" | "oldest",
  search: string,
): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (sort !== "latest") params.set("sort", sort);
  if (search) params.set("q", search);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const [
    { slug },
    { page: pageValue, sort: sortValue },
  ] = await Promise.all([
    params,
    searchParams,
  ]);
  const page = parsePublicListingPage(pageValue);
  const sort = parsePublicPostSort(sortValue);

  try {
    const category = await getPublishedCategory(slug);
    if (!category) return { title: "Category not found | ChronicleFiles" };

    const title = `${category.name} ${sort === "popular" ? "Popular" : sort === "oldest" ? "Oldest" : "Latest"} Articles${page > 1 ? ` - Page ${page}` : ""} | ChronicleFiles`;
    const descriptionBase =
      category.description?.trim() ||
      `Browse published ${category.name} articles and stories from ChronicleFiles.`;
    const description = `${descriptionBase}${page > 1 ? ` Page ${page}.` : ""}`;
    const siteUrl = getPublicSiteUrl();
    const canonicalUrl = siteUrl
      ? getListingUrl(getCategoryPath(slug), page, sort, siteUrl)
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
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Category metadata could not be loaded (${errorName}).`);
    return { title: "Category | ChronicleFiles" };
  }
}

export default async function PublicCategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [
    { slug },
    { page: pageValue, sort: sortValue, q: searchValue },
  ] = await Promise.all([
    params,
    searchParams,
  ]);
  const requestedPage = parsePublicListingPage(pageValue);
  const sort = parsePublicPostSort(sortValue);
  const search = normalizePublicPostSearch(searchValue);
  const currentPath = getCategoryPath(slug);
  let category;

  try {
    category = await getPublishedCategory(slug);
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Public category could not be loaded (${errorName}).`);
    throw new Error("This category could not be loaded. Please try again.");
  }
  if (!category) notFound();

  let listing;
  let sidebar;
  try {
    [listing, sidebar] = await Promise.all([
      getPublishedPostListing({
        categoryId: category._id.toString(),
        page: requestedPage,
        sort,
        search,
      }),
      getPublishedArticleSidebarData("", category._id.toString()),
    ]);
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Public category could not be loaded (${errorName}).`);
    throw new Error("This category could not be loaded. Please try again.");
  }

  if (listing.page !== requestedPage) {
    redirect(getPageHref(currentPath, listing.page, sort, search));
  }

  return (
    <CategoryListingPage
      listing={listing}
      sidebar={sidebar}
      currentPath={currentPath}
      trackingPath={currentPath}
      title={category.name}
      description={category.description?.trim() || undefined}
      activeCategorySlug={category.slug}
      isLatest={false}
    />
  );
}
