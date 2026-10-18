import type { MetadataRoute } from "next";
import Category from "@/models/category";
import Post from "@/models/post";
import { connectToDatabase } from "@/lib/mongodb";
import { getPublicSiteUrl } from "@/lib/public-site-config";

export const dynamic = "force-dynamic";

const SLUG_PATTERN = "^[a-z0-9]+(?:-[a-z0-9]+)*$";

interface SitemapCategory {
  name?: unknown;
  slug?: unknown;
  updatedAt?: unknown;
}

interface SitemapPost {
  title?: unknown;
  slug?: unknown;
  publishedAt?: unknown;
  updatedAt?: unknown;
}

function isValidSlug(value: unknown): value is string {
  return typeof value === "string" && new RegExp(SLUG_PATTERN).test(value);
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function latestReliableDate(
  updatedAt: unknown,
  publishedAt?: unknown,
): Date | undefined {
  const now = Date.now();
  if (isValidDate(updatedAt) && updatedAt.getTime() <= now) return updatedAt;
  if (isValidDate(publishedAt) && publishedAt.getTime() <= now) {
    return publishedAt;
  }
  return undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getPublicSiteUrl();
  if (!siteUrl) {
    throw new Error(
      "Set SITE_URL to the trusted production HTTPS origin before generating the sitemap.",
    );
  }

  await connectToDatabase();
  const now = new Date();
  const [categories, posts] = await Promise.all([
    Category.find({
      name: { $type: "string", $ne: "" },
      slug: { $regex: SLUG_PATTERN },
    })
      .select({ name: 1, slug: 1, updatedAt: 1 })
      .lean<SitemapCategory[]>()
      .exec(),
    Post.find({
      status: "published",
      title: { $type: "string", $ne: "" },
      slug: { $regex: SLUG_PATTERN },
      $or: [
        { publishedAt: { $exists: false } },
        { publishedAt: null },
        { publishedAt: { $type: "date", $lte: now } },
      ],
    })
      .select({ title: 1, slug: 1, publishedAt: 1, updatedAt: 1 })
      .lean<SitemapPost[]>()
      .exec(),
  ]);

  const urls: MetadataRoute.Sitemap = [{ url: siteUrl.toString() }];

  for (const category of categories) {
    if (
      typeof category.name !== "string" ||
      !category.name.trim() ||
      !isValidSlug(category.slug)
    ) {
      continue;
    }
    const entry: MetadataRoute.Sitemap[number] = {
      url: new URL(
        `/category/${encodeURIComponent(category.slug)}`,
        siteUrl,
      ).toString(),
    };
    const lastModified = latestReliableDate(category.updatedAt);
    if (lastModified) entry.lastModified = lastModified;
    urls.push(entry);
  }

  for (const post of posts) {
    if (
      typeof post.title !== "string" ||
      !post.title.trim() ||
      !isValidSlug(post.slug) ||
      (post.publishedAt != null &&
        !isValidDate(post.publishedAt))
    ) {
      continue;
    }
    const entry: MetadataRoute.Sitemap[number] = {
      url: new URL(
        `/post/${encodeURIComponent(post.slug)}`,
        siteUrl,
      ).toString(),
    };
    const lastModified = latestReliableDate(
      post.updatedAt,
      post.publishedAt,
    );
    if (lastModified) entry.lastModified = lastModified;
    urls.push(entry);
  }

  return urls;
}
