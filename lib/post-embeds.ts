import { extractYouTubeVideoId } from "./youtube";
import type { PostEmbedPlatform } from "../models/post";

export interface ParsedPostEmbed {
  platform: PostEmbedPlatform;
  url: string;
  embedId?: string;
}

function isTrustedHttpsUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

export function parsePostEmbed(
  platform: PostEmbedPlatform,
  value: string,
): ParsedPostEmbed | null {
  const url = isTrustedHttpsUrl(value.trim());
  if (!url) return null;
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

  if (platform === "cloudinary") {
    if (
      hostname !== "res.cloudinary.com" ||
      !/^\/[^/]+\/video\/upload\//.test(url.pathname)
    ) {
      return null;
    }
    return { platform, url: url.toString() };
  }

  if (platform === "youtube") {
    if (
      !["youtube.com", "m.youtube.com", "youtube-nocookie.com", "youtu.be"].includes(
        hostname,
      )
    ) {
      return null;
    }
    const embedId = extractYouTubeVideoId(url.toString());
    return embedId ? { platform, url: url.toString(), embedId } : null;
  }

  if (platform === "instagram") {
    if (hostname !== "instagram.com") return null;
    const match = url.pathname.match(/^\/(p|reel|tv)\/([A-Za-z0-9_-]+)\/?$/);
    return match
      ? { platform, url: url.toString(), embedId: match[2] }
      : null;
  }

  if (platform === "x") {
    if (hostname !== "x.com" && hostname !== "twitter.com") return null;
    const match = url.pathname.match(/^\/[A-Za-z0-9_]{1,15}\/status\/(\d+)\/?$/);
    return match
      ? { platform, url: url.toString(), embedId: match[1] }
      : null;
  }

  if (platform === "facebook") {
    if (hostname !== "facebook.com" && hostname !== "fb.watch") return null;
    const pathId = url.pathname.match(
      /^\/(?:reel|videos)\/(\d+)\/?$|^\/[A-Za-z0-9.]+\/(?:posts|videos)\/([A-Za-z0-9_-]+)\/?$/,
    );
    const postId = url.searchParams.get("story_fbid");
    const videoId = url.searchParams.get("v");
    const embedId =
      pathId?.[1] ?? pathId?.[2] ?? postId ?? videoId ?? undefined;
    const isKnownVideoPath =
      hostname === "fb.watch" ||
      /^\/watch\/?$/.test(url.pathname) ||
      /^\/(?:reel|videos)\//.test(url.pathname);
    const isKnownPostPath =
      /^\/[A-Za-z0-9.]+\/posts\//.test(url.pathname) ||
      (url.pathname.endsWith("/permalink.php") && Boolean(postId));
    return embedId && (isKnownVideoPath || isKnownPostPath)
      ? { platform, url: url.toString(), embedId }
      : null;
  }

  if (platform === "tiktok") {
    if (hostname !== "tiktok.com") return null;
    const match = url.pathname.match(/^\/@[^/]+\/video\/(\d+)\/?$/);
    return match
      ? { platform, url: url.toString(), embedId: match[1] }
      : null;
  }

  return null;
}

export function postEmbedSource(embed: ParsedPostEmbed): string | null {
  if (embed.platform === "cloudinary") return embed.url;
  if (!embed.embedId) return null;

  if (embed.platform === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(embed.embedId)}`;
  }
  if (embed.platform === "instagram") {
    const url = new URL(embed.url);
    const type = url.pathname.split("/").filter(Boolean)[0];
    return `https://www.instagram.com/${type}/${encodeURIComponent(embed.embedId)}/embed`;
  }
  if (embed.platform === "x") {
    return `https://platform.twitter.com/embed/Tweet.html?id=${encodeURIComponent(embed.embedId)}`;
  }
  if (embed.platform === "facebook") {
    return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(embed.url)}&show_text=true`;
  }
  return `https://www.tiktok.com/embed/v2/${encodeURIComponent(embed.embedId)}`;
}
