import type { JSONContent } from "@tiptap/core";

export interface PreviewVideo {
  id: number;
  type: "" | "cloudinary" | "youtube";
  url?: string;
  videoId?: string;
}

export interface PreviewField {
  id: number;
  type: string;
  content?: JSONContent;
  videoId?: number;
}

export type PreviewBlock =
  | { id: number; content: JSONContent }
  | { id: number; video?: PreviewVideo };

export function orderPreviewBlocks(
  fields: readonly PreviewField[],
  videos: readonly PreviewVideo[],
): PreviewBlock[] {
  const ordered: (PreviewBlock | undefined)[] = fields.map((field) => {
    if (field.type === "video") {
      return {
        id: field.id,
        video: videos.find((video) => video.id === field.videoId),
      };
    }

    return field.content === undefined
      ? undefined
      : { id: field.id, content: field.content };
  });

  return ordered.filter((block): block is PreviewBlock => block !== undefined);
}
