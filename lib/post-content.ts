import type { JSONContent } from "@tiptap/core";
import type {
  PostContentItem,
  PostEmbedPlatform,
  PostVideo,
  TiptapDocument,
} from "../models/post";
import { parsePostEmbed } from "./post-embeds";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTiptapNode(value: unknown, depth = 0): value is JSONContent {
  if (
    depth > 50 ||
    !isRecord(value) ||
    typeof value.type !== "string" ||
    (value.text !== undefined && typeof value.text !== "string") ||
    (value.type === "text" && typeof value.text !== "string") ||
    (value.attrs !== undefined && !isRecord(value.attrs)) ||
    (value.marks !== undefined &&
      (!Array.isArray(value.marks) ||
        !value.marks.every(
          (mark) =>
            isRecord(mark) &&
            typeof mark.type === "string" &&
            (mark.attrs === undefined || isRecord(mark.attrs)),
        )))
  ) {
    return false;
  }

  return (
    value.content === undefined ||
    (Array.isArray(value.content) &&
      value.content.every((child) => isTiptapNode(child, depth + 1)))
  );
}

export function isTiptapDocument(value: unknown): value is TiptapDocument {
  return (
    isTiptapNode(value) &&
    value.type === "doc" &&
    Array.isArray(value.content)
  );
}

export function isPostContentItem(value: unknown): value is PostContentItem {
  if (!isRecord(value) || typeof value.type !== "string") return false;
  if (value.type === "richText") return isTiptapDocument(value.content);
  if (value.type === "image") {
    return (
      typeof value.url === "string" &&
      (value.alt === undefined || typeof value.alt === "string")
    );
  }
  if (
    value.type === "heading2" ||
    value.type === "heading3" ||
    value.type === "quote" ||
    value.type === "bullet" ||
    value.type === "numbered"
  ) {
    return typeof value.text === "string";
  }
  if (value.type === "link") {
    return typeof value.text === "string" && typeof value.url === "string";
  }
  if (value.type === "hr") return true;
  if (value.type === "embed") {
    return (
      typeof value.platform === "string" &&
      ["cloudinary", "youtube", "instagram", "x", "facebook", "tiktok"].includes(
        value.platform,
      ) &&
      typeof value.url === "string" &&
      (value.embedId === undefined || typeof value.embedId === "string") &&
      (value.title === undefined || typeof value.title === "string")
    );
  }
  return false;
}

function legacyVideoToEmbed(video: PostVideo): PostContentItem | null {
  if (video.type === "cloudinary" && video.url) {
    const parsed = parsePostEmbed("cloudinary", video.url);
    return parsed ? { type: "embed", ...parsed } : null;
  }
  if (video.type === "youtube" && video.videoId) {
    const fallbackUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}`;
    const original = video.url
      ? parsePostEmbed("youtube", video.url)
      : null;
    const parsed =
      original?.embedId === video.videoId
        ? original
        : parsePostEmbed("youtube", fallbackUrl);
    return parsed
      ? {
          type: "embed",
          ...parsed,
          ...(video.title ? { title: video.title } : {}),
        }
      : null;
  }
  return null;
}

export function normalizePostContent(
  content: unknown,
  legacyVideos: readonly PostVideo[] = [],
): PostContentItem[] {
  if (Array.isArray(content)) {
    return content.filter(isPostContentItem);
  }

  const normalized: PostContentItem[] = [];
  if (isTiptapDocument(content) && content.content.length > 0) {
    normalized.push({
      type: "richText",
      content: JSON.parse(JSON.stringify(content)) as TiptapDocument,
    });
  }
  for (const video of legacyVideos) {
    const embed = legacyVideoToEmbed(video);
    if (embed) normalized.push(embed);
  }
  return normalized;
}

export function jsonContentHasData(content: JSONContent): boolean {
  if (typeof content.text === "string" && content.text.trim()) return true;
  if (
    content.type === "image" &&
    typeof content.attrs?.src === "string" &&
    content.attrs.src
  ) {
    return true;
  }
  return content.content?.some(jsonContentHasData) ?? false;
}

export function postContentHasData(content: readonly PostContentItem[]): boolean {
  return content.some((item) => {
    if (item.type === "richText") {
      return jsonContentHasData(item.content as JSONContent);
    }
    if (item.type === "image" || item.type === "embed") return Boolean(item.url);
    if (item.type === "hr") return true;
    if (item.type === "link") return Boolean(item.text.trim() && item.url.trim());
    return "text" in item && Boolean(item.text.trim());
  });
}

export function validatePostEmbeds(
  content: readonly PostContentItem[],
): string | null {
  const embeds = content.filter(
    (item): item is Extract<PostContentItem, { type: "embed" }> =>
      item.type === "embed",
  );
  if (embeds.length > 2) {
    return "A post can have no more than 2 embed fields.";
  }

  for (const embed of embeds) {
    const parsed = parsePostEmbed(embed.platform, embed.url);
    if (!parsed || (embed.embedId && embed.embedId !== parsed.embedId)) {
      return `Enter a valid ${embed.platform} URL for each embed field.`;
    }
  }

  return null;
}

export function normalizePostEmbeds(
  content: readonly PostContentItem[],
): PostContentItem[] {
  return content.map((item) => {
    if (item.type !== "embed") return item;
    const parsed = parsePostEmbed(item.platform, item.url);
    return parsed
      ? {
          type: "embed",
          ...parsed,
          ...(item.title ? { title: item.title } : {}),
        }
      : item;
  });
}

export type { PostEmbedPlatform };
