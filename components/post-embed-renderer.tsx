import type { PostContentItem } from "@/models/post";
import { parsePostEmbed, postEmbedSource } from "@/lib/post-embeds";

export function PostEmbedRenderer({
  embed,
}: {
  embed: Extract<PostContentItem, { type: "embed" }>;
}) {
  const parsed = parsePostEmbed(embed.platform, embed.url);
  const src = parsed ? postEmbedSource(parsed) : null;
  if (!src) return null;

  if (embed.platform === "cloudinary") {
    return (
      <video
        controls
        preload="metadata"
        src={src}
        className="my-8 aspect-video w-full rounded-xl bg-black"
      >
        Your browser does not support video playback.
      </video>
    );
  }

  return (
    <iframe
      src={src}
      title={embed.title || `${embed.platform} embed`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      loading="lazy"
      className="my-8 aspect-video w-full rounded-xl border-0 bg-black"
    />
  );
}
