import "server-only";

import Category from "@/models/category";
import Post from "@/models/post";
import type { PostContentItem } from "@/models/post";
import { connectToDatabase } from "@/lib/mongodb";
import { normalizePostContent } from "@/lib/post-content";
import type { PublicPostCardData } from "@/components/blog/public-post-card";

const MAX_LISTED_POSTS = 60;

function publishedPostFilter() {
  return {
    status: "published" as const,
    $or: [{ publishedAt: null }, { publishedAt: { $lte: new Date() } }],
  };
}

export async function getPublishedPosts(
  categoryId?: string,
): Promise<PublicPostCardData[]> {
  await connectToDatabase();
  const documents = await Post.find({
    ...publishedPostFilter(),
    ...(categoryId ? { category: categoryId } : {}),
  })
    .select({ title: 1, slug: 1, excerpt: 1, thumbnail: 1, category: 1, publishedAt: 1 })
    .sort({ publishedAt: -1, updatedAt: -1 })
    .limit(MAX_LISTED_POSTS)
    .lean()
    .exec();

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

  return documents.map((post) => {
    const category = post.category
      ? categoryById.get(post.category.toString())
      : undefined;
    return {
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? "",
      ...(post.thumbnail ? { thumbnail: post.thumbnail } : {}),
      categoryName: category?.name ?? "Uncategorized",
      ...(category?.slug ? { categorySlug: category.slug } : {}),
      ...(post.publishedAt
        ? { publishedAt: post.publishedAt.toISOString() }
        : {}),
    };
  });
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
  categoryName: string;
  categorySlug?: string;
  publishedAt?: string;
  content: PostContentItem[];
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
    ...(post.thumbnail ? { thumbnail: post.thumbnail } : {}),
    categoryName: category?.name ?? "Uncategorized",
    ...(category?.slug ? { categorySlug: category.slug } : {}),
    ...(post.publishedAt
      ? { publishedAt: post.publishedAt.toISOString() }
      : {}),
    content: normalizePostContent(post.content, post.videos ?? []),
  };
}
