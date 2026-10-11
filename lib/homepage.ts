import "server-only";

import { Types } from "mongoose";
import Category from "@/models/category";
import HomepageLayout from "@/models/homepage-layout";
import Post from "@/models/post";
import AnalyticsDaily from "@/models/analytics-daily";
import { connectToDatabase } from "@/lib/mongodb";
import type { PublicPostCardData } from "@/components/blog/public-post-card";
import {
  HOMEPAGE_SLOTS,
  type HomepageManagementData,
  type HomepageSlot,
  type HomepageSlotValues,
  type PublicHomepageData,
} from "@/types/homepage";

export { HOMEPAGE_SLOTS } from "@/types/homepage";
export type {
  HomepageManagementData,
  HomepageSlot,
  HomepageSlotValues,
  PublicHomepageData,
} from "@/types/homepage";

interface PostSummaryDocument {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt?: string;
  thumbnail?: string;
  category?: Types.ObjectId | null;
  publishedAt?: Date | null;
}

const homepageCarouselLimits = {
  latest: 6,
  category: 5,
} as const;

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

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getLayoutValues(
  layout:
    | {
        [Key in HomepageSlot]?: Types.ObjectId | null;
      }
    | null,
): HomepageSlotValues {
  return Object.fromEntries(
    HOMEPAGE_SLOTS.map((slot) => [slot, layout?.[slot]?.toString() ?? null]),
  ) as HomepageSlotValues;
}

async function mapPostSummaries(
  documents: PostSummaryDocument[],
): Promise<PublicPostCardData[]> {
  const categoryIds = documents
    .map((post) => post.category)
    .filter((id): id is Types.ObjectId => id instanceof Types.ObjectId);
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

  return documents.map((post) => {
    const category = post.category
      ? categoryById.get(post.category.toString())
      : undefined;
    const publishedAt = isValidDate(post.publishedAt)
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
  });
}

async function getPopularPublishedPosts(
  limit: number,
  categoryId?: Types.ObjectId,
): Promise<PostSummaryDocument[]> {
  return Post.aggregate<PostSummaryDocument>([
    {
      $match: {
        ...publishedPostFilter(),
        ...(categoryId ? { category: categoryId } : {}),
      },
    },
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
    { $limit: limit },
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
}

async function getLayoutDocument() {
  return HomepageLayout.findOne({ key: "primary" })
    .select({
      leftTopPostId: 1,
      leftBottomPostId: 1,
      editorsPickPostId: 1,
      rightTopPostId: 1,
      rightBottomPostId: 1,
    })
    .lean()
    .exec();
}

export async function getHomepageManagementData(
  search = "",
): Promise<HomepageManagementData> {
  await connectToDatabase();
  const layoutDocument = await getLayoutDocument();
  const layout = getLayoutValues(layoutDocument);
  const selectedIds = [
    ...new Set(
      Object.values(layout).filter((id): id is string => id !== null),
    ),
  ];
  const cleanedSearch = search.trim().slice(0, 100);
  const postFilter = {
    ...publishedPostFilter(),
    ...(cleanedSearch
      ? {
          $and: [
            {
              $or: [
                {
                  title: {
                    $regex: escapeRegularExpression(cleanedSearch),
                    $options: "i",
                  },
                },
                {
                  tags: {
                    $elemMatch: {
                      $regex: escapeRegularExpression(cleanedSearch),
                      $options: "i",
                    },
                  },
                },
              ],
            },
          ],
        }
      : {}),
  };

  const [candidateDocuments, selectedDocuments] = await Promise.all([
    Post.find(postFilter)
      .select({
        title: 1,
        slug: 1,
        excerpt: 1,
        thumbnail: 1,
        category: 1,
        publishedAt: 1,
      })
      .sort({ publishedAt: -1, _id: -1 })
      .limit(50)
      .lean()
      .exec(),
    selectedIds.length
      ? Post.find({
          ...publishedPostFilter(),
          _id: { $in: selectedIds.map((id) => new Types.ObjectId(id)) },
        })
          .select({
            title: 1,
            slug: 1,
            excerpt: 1,
            thumbnail: 1,
            category: 1,
            publishedAt: 1,
          })
          .lean()
          .exec()
      : Promise.resolve([]),
  ]);

  const [posts, selectedPostsList] = await Promise.all([
    mapPostSummaries(candidateDocuments),
    mapPostSummaries(selectedDocuments),
  ]);
  const selectedPostsById = new Map(
    selectedPostsList.map((post) => [post.id, post]),
  );
  const selectedPosts = Object.fromEntries(
    HOMEPAGE_SLOTS.map((slot) => [
      slot,
      layout[slot] ? (selectedPostsById.get(layout[slot]!) ?? null) : null,
    ]),
  ) as Record<HomepageSlot, PublicPostCardData | null>;

  return { layout, selectedPosts, posts };
}

export async function getPublicHomepageData(): Promise<PublicHomepageData> {
  await connectToDatabase();
  const layoutDocument = await getLayoutDocument();
  const layoutValues = getLayoutValues(layoutDocument);
  const selectedIds = [
    ...new Set(
      Object.values(layoutValues).filter((id): id is string => id !== null),
    ),
  ];

  const [categoryDocuments, recentDocuments, selectedDocuments] =
    await Promise.all([
      Category.find({})
        .select({ name: 1, slug: 1 })
        .sort({ name: 1 })
        .lean()
        .exec(),
      Post.find(publishedPostFilter())
        .select({
          title: 1,
          slug: 1,
          excerpt: 1,
          thumbnail: 1,
          category: 1,
          publishedAt: 1,
        })
        .sort({ publishedAt: -1, _id: -1 })
        .limit(50)
        .lean()
        .exec(),
      selectedIds.length
        ? Post.find({
            ...publishedPostFilter(),
            _id: { $in: selectedIds.map((id) => new Types.ObjectId(id)) },
          })
            .select({
              title: 1,
              slug: 1,
              excerpt: 1,
              thumbnail: 1,
              category: 1,
              publishedAt: 1,
            })
            .lean()
            .exec()
        : Promise.resolve([]),
    ]);

  const categories = categoryDocuments.map(({ name, slug }) => ({ name, slug }));
  const categoryIdBySlug = new Map(
    categoryDocuments.map((category) => [
      category.slug.toLowerCase(),
      category._id as Types.ObjectId,
    ]),
  );
  const sectionEntries = [
    ["technology", categoryIdBySlug.get("technology")],
    ["education", categoryIdBySlug.get("education")],
    ["entertainment", categoryIdBySlug.get("entertainment")],
  ] as const;
  const sectionDocuments = await Promise.all(
    sectionEntries.map(([, categoryId]) =>
      categoryId
        ? getPopularPublishedPosts(homepageCarouselLimits.category, categoryId)
        : Promise.resolve([]),
    ),
  );
  const popularLatestDocuments = await getPopularPublishedPosts(
    homepageCarouselLimits.latest,
  );

  const [
    recentPosts,
    popularLatest,
    selectedPostsList,
    technology,
    education,
    entertainment,
  ] =
    await Promise.all([
      mapPostSummaries(recentDocuments),
      mapPostSummaries(popularLatestDocuments),
      mapPostSummaries(selectedDocuments),
      mapPostSummaries(sectionDocuments[0]),
      mapPostSummaries(sectionDocuments[1]),
      mapPostSummaries(sectionDocuments[2]),
    ]);
  const selectedPostsById = new Map(
    selectedPostsList.map((post) => [post.id, post]),
  );
  const featured = {} as Record<HomepageSlot, PublicPostCardData | null>;
  const usedFeaturedIds = new Set<string>();

  for (const slot of HOMEPAGE_SLOTS) {
    const selected = layoutValues[slot]
      ? (selectedPostsById.get(layoutValues[slot]!) ?? null)
      : null;
    if (selected && !usedFeaturedIds.has(selected.id)) {
      featured[slot] = selected;
      usedFeaturedIds.add(selected.id);
    } else {
      featured[slot] = null;
    }
  }

  for (const slot of HOMEPAGE_SLOTS) {
    if (featured[slot]) continue;
    const fallback = recentPosts.find((post) => !usedFeaturedIds.has(post.id));
    if (!fallback) continue;
    featured[slot] = fallback;
    usedFeaturedIds.add(fallback.id);
  }

  const latestIds = new Set(popularLatest.map((post) => post.id));
  const recommendations = recentPosts
    .filter(
      (post) => !usedFeaturedIds.has(post.id) && !latestIds.has(post.id),
    )
    .slice(0, 3);

  return {
    featured,
    latest: popularLatest,
    technology,
    education,
    entertainment,
    recommendations,
    categories,
  };
}
