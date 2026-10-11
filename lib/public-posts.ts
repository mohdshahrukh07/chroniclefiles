import "server-only";

import { Types } from "mongoose";
import Category from "@/models/category";
import Post from "@/models/post";
import type { PostContentItem } from "@/models/post";
import AnalyticsDaily from "@/models/analytics-daily";
import { connectToDatabase } from "@/lib/mongodb";
import { normalizePostContent } from "@/lib/post-content";
import type { PublicPostCardData } from "@/components/blog/public-post-card";

export const PUBLIC_POSTS_PER_PAGE = 9;

function publishedPostFilter() {
  return {
    status: "published" as const,
    $or: [{ publishedAt: null }, { publishedAt: { $lte: new Date() } }],
  };
}

function isPublicImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export interface PublicPostListing {
  posts: PublicPostCardData[];
  totalPosts: number;
  totalPages: number;
  page: number;
  sort: PublicPostSort;
  search: string;
  searchMatchedBy: "title" | "tags" | null;
}

export type PublicPostSort = "latest" | "popular" | "oldest";

export function parsePublicListingPage(
  value: string | string[] | undefined,
): number {
  const pageValue = Array.isArray(value) ? value[0] : value;
  if (!pageValue || !/^[1-9]\d*$/.test(pageValue)) return 1;

  const page = Number(pageValue);
  return Number.isSafeInteger(page) ? page : 1;
}

export function parsePublicPostSort(
  value: string | string[] | undefined,
): PublicPostSort {
  const sortValue = Array.isArray(value) ? value[0] : value;
  return sortValue === "popular" || sortValue === "oldest"
    ? sortValue
    : "latest";
}

export function normalizePublicPostSearch(
  value: string | string[] | undefined,
): string {
  const searchValue = Array.isArray(value) ? value[0] : value;
  return searchValue?.trim().slice(0, 100) ?? "";
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface PublicListingDocument {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt?: string;
  thumbnail?: string;
  category?: Types.ObjectId;
  publishedAt?: Date | null;
  popularity?: number;
}

export async function getPublishedPostListing({
  categoryId,
  page: requestedPage,
  sort = "latest",
  search = "",
}: {
  categoryId?: string;
  page: number;
  sort?: PublicPostSort;
  search?: string;
}): Promise<PublicPostListing> {
  await connectToDatabase();
  const baseFilter = {
    ...publishedPostFilter(),
    ...(categoryId ? { category: categoryId } : {}),
  };
  let filter: typeof baseFilter & Record<string, unknown> = baseFilter;
  let searchMatchedBy: PublicPostListing["searchMatchedBy"] = null;
  const escapedSearch = escapeRegularExpression(search);
  if (search) {
    const titleFilter = {
      ...baseFilter,
      title: { $regex: escapedSearch, $options: "i" },
    };
    if (await Post.countDocuments(titleFilter).exec()) {
      filter = titleFilter;
      searchMatchedBy = "title";
    } else {
      filter = {
        ...baseFilter,
        tags: { $elemMatch: { $regex: escapedSearch, $options: "i" } },
      };
      searchMatchedBy = "tags";
    }
  }
  const totalPosts = await Post.countDocuments(filter).exec();
  const totalPages = Math.ceil(totalPosts / PUBLIC_POSTS_PER_PAGE);
  const page = Math.min(requestedPage, Math.max(1, totalPages));
  const skip = (page - 1) * PUBLIC_POSTS_PER_PAGE;
  const aggregateFilter = {
    ...filter,
    ...(categoryId ? { category: new Types.ObjectId(categoryId) } : {}),
  };
  let documents: PublicListingDocument[];

  if (sort === "popular") {
    documents = await Post.aggregate<PublicListingDocument>([
      { $match: aggregateFilter },
      {
        $lookup: {
          from: AnalyticsDaily.collection.name,
          let: { currentPostId: "$_id" },
          pipeline: [
            {
              $match: {
                scope: "page",
                $expr: { $eq: ["$postId", "$$currentPostId"] },
              },
            },
            {
              $group: {
                _id: null,
                views: { $sum: "$pageViews" },
              },
            },
          ],
          as: "analytics",
        },
      },
      {
        $addFields: {
          popularity: {
            $ifNull: [{ $arrayElemAt: ["$analytics.views", 0] }, 0],
          },
        },
      },
      { $sort: { popularity: -1, publishedAt: -1, _id: -1 } },
      { $skip: skip },
      { $limit: PUBLIC_POSTS_PER_PAGE },
      {
        $project: {
          title: 1,
          slug: 1,
          excerpt: 1,
          thumbnail: 1,
          category: 1,
          publishedAt: 1,
        },
      },
    ]).exec();
  } else {
    documents =
      sort === "oldest"
        ? await Post.aggregate<PublicListingDocument>([
            { $match: aggregateFilter },
            {
              $addFields: {
                listingDate: {
                  $ifNull: [
                    "$publishedAt",
                    new Date("9999-12-31T23:59:59.999Z"),
                  ],
                },
              },
            },
            { $sort: { listingDate: 1, _id: 1 } },
            { $skip: skip },
            { $limit: PUBLIC_POSTS_PER_PAGE },
            {
              $project: {
                title: 1,
                slug: 1,
                excerpt: 1,
                thumbnail: 1,
                category: 1,
                publishedAt: 1,
              },
            },
          ]).exec()
        : await Post.find(filter)
            .select({
              title: 1,
              slug: 1,
              excerpt: 1,
              thumbnail: 1,
              category: 1,
              publishedAt: 1,
            })
            .sort({ publishedAt: -1, _id: -1 })
            .skip(skip)
            .limit(PUBLIC_POSTS_PER_PAGE)
            .lean()
            .exec();
  }

  const categoryIds = documents
    .map((post) => post.category)
    .filter((id): id is NonNullable<typeof id> => Boolean(id));
  const categories = categoryIds.length
    ? await Category.find({ _id: { $in: categoryIds } })
        .select({ name: 1, slug: 1 })
        .lean()
        .exec()
    : [];
  const categoryById = new Map(
    categories.map((category) => [
      category._id.toString(),
      { name: category.name, slug: category.slug },
    ]),
  );

  return {
    totalPosts,
    totalPages,
    page,
    sort,
    search,
    searchMatchedBy,
    posts: documents.map((post) => {
      const category = post.category
        ? categoryById.get(post.category.toString())
        : undefined;
      const publishedAt =
        post.publishedAt instanceof Date &&
        !Number.isNaN(post.publishedAt.getTime())
          ? post.publishedAt.toISOString()
          : undefined;

      return {
        id: post._id.toString(),
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        ...(isPublicImageUrl(post.thumbnail)
          ? { thumbnail: post.thumbnail }
          : {}),
        categoryName: category?.name ?? "Uncategorized",
        ...(category?.slug ? { categorySlug: category.slug } : {}),
        ...(publishedAt ? { publishedAt } : {}),
      };
    }),
  };
}

export async function getPublishedCategory(slug: string) {
  await connectToDatabase();
  return Category.findOne({ slug })
    .select({ name: 1, slug: 1, description: 1 })
    .lean()
    .exec();
}

export interface PublicPostArticle {
  title: string;
  slug: string;
  excerpt: string;
  thumbnail?: string;
  metaTitle?: string;
  metaDescription?: string;
  categoryName: string;
  categoryId?: string;
  categorySlug?: string;
  publishedAt?: string;
  content: PostContentItem[];
}

export interface PublicCategoryLink {
  name: string;
  slug: string;
}

export interface PublicArticleSidebarData {
  recommendations: PublicPostCardData[];
  categories: PublicCategoryLink[];
}

export async function getPublishedPostBySlug(
  slug: string,
): Promise<PublicPostArticle | null> {
  await connectToDatabase();
  const post = await Post.findOne({
    slug,
    ...publishedPostFilter(),
  })
    .select({
      title: 1,
      slug: 1,
      excerpt: 1,
      thumbnail: 1,
      category: 1,
      content: 1,
      videos: 1,
      publishedAt: 1,
      seo: 1,
    })
    .lean()
    .exec();
  if (!post) return null;

  const category = post.category
    ? await Category.findById(post.category).select({ name: 1, slug: 1 }).lean().exec()
    : null;

  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    ...(isPublicImageUrl(post.thumbnail)
      ? { thumbnail: post.thumbnail }
      : {}),
    ...(post.seo?.metaTitle?.trim()
      ? { metaTitle: post.seo.metaTitle.trim() }
      : {}),
    ...(post.seo?.metaDescription?.trim()
      ? { metaDescription: post.seo.metaDescription.trim() }
      : {}),
    categoryName: category?.name ?? "Uncategorized",
    ...(post.category ? { categoryId: post.category.toString() } : {}),
    ...(category?.slug ? { categorySlug: category.slug } : {}),
    ...(post.publishedAt
      ? { publishedAt: post.publishedAt.toISOString() }
      : {}),
    content: normalizePostContent(post.content, post.videos ?? []),
  };
}

export async function getPublishedArticleSidebarData(
  currentSlug: string,
  categoryId?: string,
): Promise<PublicArticleSidebarData> {
  await connectToDatabase();
  const postProjection = {
    title: 1,
    slug: 1,
    excerpt: 1,
    thumbnail: 1,
    category: 1,
    publishedAt: 1,
  };

  const [categoryDocuments, relatedDocuments] = await Promise.all([
    Category.find({})
      .select({ name: 1, slug: 1 })
      .sort({ name: 1 })
      .lean()
      .exec(),
    Post.find({
      ...publishedPostFilter(),
      slug: { $ne: currentSlug },
      ...(categoryId ? { category: categoryId } : {}),
    })
      .select(postProjection)
      .sort({ publishedAt: -1, updatedAt: -1 })
      .limit(3)
      .lean()
      .exec(),
  ]);

  let recommendations = [...relatedDocuments];
  if (recommendations.length < 3) {
    const additionalDocuments = await Post.find({
      ...publishedPostFilter(),
      slug: { $ne: currentSlug },
      ...(recommendations.length
        ? { _id: { $nin: recommendations.map((post) => post._id) } }
        : {}),
    })
      .select(postProjection)
      .sort({ publishedAt: -1, updatedAt: -1 })
      .limit(3 - recommendations.length)
      .lean()
      .exec();
    recommendations = [...recommendations, ...additionalDocuments];
  }

  const categoryById = new Map(
    categoryDocuments.map((category) => [
      category._id.toString(),
      { name: category.name, slug: category.slug },
    ]),
  );

  return {
    recommendations: recommendations.map((post) => {
      const category = post.category
        ? categoryById.get(post.category.toString())
        : undefined;
      return {
        id: post._id.toString(),
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        ...(isPublicImageUrl(post.thumbnail)
          ? { thumbnail: post.thumbnail }
          : {}),
        categoryName: category?.name ?? "Uncategorized",
        ...(category?.slug ? { categorySlug: category.slug } : {}),
        ...(post.publishedAt
          ? { publishedAt: post.publishedAt.toISOString() }
          : {}),
      };
    }),
    categories: categoryDocuments.map((category) => ({
      name: category.name,
      slug: category.slug,
    })),
  };
}
