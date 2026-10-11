"use client";

import { useRouter } from "next/navigation";
import type { PostContentItem } from "@/models/post";
import { PostPreview } from "@/components/admin-posts/post-preview";

interface SavedPostPreviewProps {
  title: string;
  excerpt: string;
  thumbnail?: string;
  blocks: PostContentItem[];
}

export function SavedPostPreview({
  title,
  excerpt,
  thumbnail,
  blocks,
}: SavedPostPreviewProps) {
  const router = useRouter();

  return (
    <PostPreview
      open
      onClose={() => router.push("/admin-dashboard/posts")}
      title={title}
      excerpt={excerpt}
      thumbnail={thumbnail}
      blocks={blocks}
    />
  );
}
