import { Types } from "mongoose";
import Category from "@/models/category";
import Media from "@/models/media";
import Post from "@/models/post";
import { connectToDatabase } from "@/lib/mongodb";
import { getPublicSiteUrl } from "@/lib/public-site-config";
import { renderRssFeed, type RssFeedItem } from "@/lib/rss-feed";

export const dynamic = "force-dynamic";

const FEED_LIMIT = 50;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE_MIME_TYPE_PATTERN = /^image\/[a-z0-9][a-z0-9!#$&^_.+-]*$/i;

interface FeedPost {
  _id: Types.ObjectId;
  title?: unknown;
  slug?: unknown;
  excerpt?: unknown;
  thumbnail?: unknown;
  category?: Types.ObjectId | null;
  publishedAt?: unknown;
  createdAt?: unknown;
}

interface FeedCategory {
  _id: Types.ObjectId;
  name?: unknown;
}

interface FeedMedia {
  url?: unknown;
  mimeType?: unknown;
  size?: unknown;
}

function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim() || value !== value.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function toValidDate(value: unknown): Date | null {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function unavailableResponse(): Response {
  return new Response("RSS feed is temporarily unavailable.", {
    status: 503,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(): Promise<Response> {
  const siteUrl = getPublicSiteUrl();
  if (!siteUrl) {
    console.error("RSS feed generation failed: SITE_URL is not configured.");
    return unavailableResponse();
  }

  try {
    await connectToDatabase();
    const now = new Date();
    const posts = await Post.find({
      status: "published",
      $or: [{ publishedAt: null }, { publishedAt: { $lte: now } }],
    })
      .select({
        title: 1,
        slug: 1,
        excerpt: 1,
        thumbnail: 1,
        category: 1,
        publishedAt: 1,
        createdAt: 1,
      })
      .sort({ publishedAt: -1, createdAt: -1, _id: -1 })
      .limit(FEED_LIMIT)
      .lean<FeedPost[]>()
      .exec();

    const categoryIds = posts
      .map((post) => post.category)
      .filter((id): id is Types.ObjectId => id instanceof Types.ObjectId);
    const thumbnailUrls = [
      ...new Set(
        posts
          .map((post) => post.thumbnail)
          .filter((url): url is string => isValidHttpUrl(url)),
      ),
    ];

    const [categories, media] = await Promise.all([
      categoryIds.length
        ? Category.find({ _id: { $in: categoryIds } })
            .select({ name: 1 })
            .lean<FeedCategory[]>()
            .exec()
        : Promise.resolve([]),
      thumbnailUrls.length
        ? Media.find({
            url: { $in: thumbnailUrls },
            mimeType: /^image\//,
          })
            .select({ url: 1, mimeType: 1, size: 1 })
            .lean<FeedMedia[]>()
            .exec()
        : Promise.resolve([]),
    ]);

    const categoryNames = new Map(
      categories.flatMap((category) =>
        typeof category.name === "string" && category.name.trim()
          ? [[category._id.toString(), category.name.trim()] as const]
          : [],
      ),
    );
    const mediaByUrl = new Map(
      media.flatMap((record) =>
        typeof record.url === "string" &&
        typeof record.mimeType === "string" &&
        IMAGE_MIME_TYPE_PATTERN.test(record.mimeType) &&
        typeof record.size === "number" &&
        Number.isSafeInteger(record.size) &&
        record.size > 0
          ? [
              [
                record.url,
                {
                  mimeType: record.mimeType,
                  length: record.size,
                },
              ] as const,
            ]
          : [],
      ),
    );

    const items: RssFeedItem[] = posts.flatMap((post) => {
      if (
        typeof post.title !== "string" ||
        !post.title.trim() ||
        typeof post.slug !== "string" ||
        !SLUG_PATTERN.test(post.slug)
      ) {
        return [];
      }

      const publicationDate =
        toValidDate(post.publishedAt) ?? toValidDate(post.createdAt);
      if (!publicationDate || publicationDate > now) return [];

      const url = new URL(
        `/post/${encodeURIComponent(post.slug)}`,
        siteUrl,
      ).toString();
      const item: RssFeedItem = {
        title: post.title.trim(),
        url,
        description:
          typeof post.excerpt === "string" ? post.excerpt.trim() : "",
        publicationDate,
      };

      if (post.category instanceof Types.ObjectId) {
        item.category = categoryNames.get(post.category.toString());
      }

      if (isValidHttpUrl(post.thumbnail)) {
        const image = mediaByUrl.get(post.thumbnail);
        if (image) {
          item.enclosure = {
            url: post.thumbnail,
            mimeType: image.mimeType,
            length: image.length,
          };
        }
      }

      return [item];
    });

    items.sort(
      (first, second) =>
        second.publicationDate.getTime() - first.publicationDate.getTime(),
    );

    return new Response(renderRssFeed(siteUrl, items, now), {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "Content-Type": "application/rss+xml; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`RSS feed generation failed (${errorName}).`);
    return unavailableResponse();
  }
}
