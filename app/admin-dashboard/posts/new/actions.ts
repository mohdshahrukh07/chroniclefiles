"use server";

import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import type { JSONContent } from "@tiptap/core";
import Category from "@/models/category";
import Media from "@/models/media";
import Post, {
  type PostDocument,
  type PostVideo,
  type PostVideoType,
} from "@/models/post";
import { connectToDatabase } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/admin-session";
import { extractYouTubeVideoId } from "@/lib/youtube";
import {
  cloudinaryUploadTargets,
  isCloudinaryUploadFolder,
  type CloudinaryUploadFolder,
} from "@/lib/cloudinary";

export interface CreatePostInput {
  title: string;
  slug: string;
  excerpt: string;
  thumbnail?: string;
  category: string;
  tags: string[];
  status: "draft" | "published";
  content: JSONContent;
  videos: PostVideo[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

export type CreatePostResult =
  | { success: true; postId: string }
  | {
      success: false;
      message: string;
      fieldErrors?: Partial<Record<keyof CreatePostInput, string>>;
    };

export interface UploadedMediaInput {
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  resourceType: "image" | "video";
  folder: CloudinaryUploadFolder;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getSafeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown failure";
  return message.replace(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi, "[redacted MongoDB URI]");
}

function isJsonContent(value: unknown, depth = 0): value is JSONContent {
  if (
    depth > 50 ||
    !isRecord(value) ||
    typeof value.type !== "string" ||
    (value.text !== undefined && typeof value.text !== "string")
  ) {
    return false;
  }

  return (
    value.content === undefined ||
    (Array.isArray(value.content) &&
      value.content.every((child) => isJsonContent(child, depth + 1)))
  );
}

function isPostVideo(value: unknown): value is PostVideo {
  if (!isRecord(value)) return false;
  if (value.title !== undefined && typeof value.title !== "string") return false;
  if (value.type === "youtube") return typeof value.videoId === "string";
  if (value.type === "cloudinary") return typeof value.url === "string";
  return false;
}

function collectImageUrls(content: JSONContent): string[] {
  const urls =
    content.type === "image" && typeof content.attrs?.src === "string"
      ? [content.attrs.src]
      : [];
  return [...urls, ...(content.content?.flatMap(collectImageUrls) ?? [])];
}

function hasContent(content: JSONContent): boolean {
  if (typeof content.text === "string" && content.text.trim()) {
    return true;
  }

  if (
    content.type === "image" &&
    typeof content.attrs?.src === "string" &&
    content.attrs.src
  ) {
    return true;
  }

  return content.content?.some(hasContent) ?? false;
}

function isCloudinaryUrl(value: string, resourceType: "image" | "video") {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.pathname.startsWith(`/${cloudName}/${resourceType}/upload/`)
    );
  } catch {
    return false;
  }
}

function validateVideos(videos: PostVideo[]): string | null {
  if (videos.length > 2) {
    return "A post can have no more than 2 videos.";
  }

  for (const video of videos) {
    if (video.type === "youtube") {
      if (
        !video.videoId ||
        extractYouTubeVideoId(
          video.videoId.includes("://")
            ? video.videoId
            : `https://www.youtube.com/watch?v=${video.videoId}`,
        ) !== video.videoId
      ) {
        return "Enter a valid YouTube URL for each YouTube video.";
      }
    } else if (
      video.type !== "cloudinary" ||
      !video.url ||
      !isCloudinaryUrl(video.url, "video")
    ) {
      return "Upload each Cloudinary video before saving the post.";
    }
  }

  return null;
}

export async function createPostAction(
  input: CreatePostInput,
): Promise<CreatePostResult> {
  return savePost(input);
}

export async function updatePostAction(
  postId: string,
  input: CreatePostInput,
): Promise<CreatePostResult> {
  if (!Types.ObjectId.isValid(postId)) {
    return { success: false, message: "The requested post could not be found." };
  }
  return savePost(input, postId);
}

async function savePost(
  input: CreatePostInput,
  postId?: string,
): Promise<CreatePostResult> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, message: "Your session has expired. Sign in again." };
  }

  if (
    !isRecord(input) ||
    typeof input.title !== "string" ||
    typeof input.slug !== "string" ||
    typeof input.excerpt !== "string" ||
    typeof input.category !== "string" ||
    !Array.isArray(input.tags) ||
    !input.tags.every((tag) => typeof tag === "string") ||
    !isJsonContent(input.content) ||
    !Array.isArray(input.videos) ||
    !input.videos.every(isPostVideo) ||
    (input.seo !== undefined &&
      (!isRecord(input.seo) ||
        (input.seo.metaTitle !== undefined &&
          typeof input.seo.metaTitle !== "string") ||
        (input.seo.metaDescription !== undefined &&
          typeof input.seo.metaDescription !== "string"))) ||
    (input.thumbnail !== undefined && typeof input.thumbnail !== "string")
  ) {
    return { success: false, message: "The post details are invalid." };
  }

  let content: JSONContent;
  try {
    content = JSON.parse(JSON.stringify(input.content)) as JSONContent;
  } catch {
    return {
      success: false,
      message: "Article content contains unsupported data. Remove the affected content block and try again.",
      fieldErrors: { content: "Re-add the affected content block before saving." },
    };
  }

  const fieldErrors: Partial<Record<keyof CreatePostInput, string>> = {};
  const title = input.title.trim();
  const slug = input.slug.trim().toLowerCase();
  const excerpt = input.excerpt.trim();
  const metaTitle =
    typeof input.seo?.metaTitle === "string"
      ? input.seo.metaTitle.trim() || title
      : title;
  const metaDescription =
    typeof input.seo?.metaDescription === "string"
      ? input.seo.metaDescription.trim() || excerpt
      : excerpt;

  if (!title) fieldErrors.title = "Enter a post title.";
  if (!slug) {
    fieldErrors.slug = "Enter a post slug.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fieldErrors.slug = "Use lowercase letters, numbers, and hyphens only.";
  }
  const isPublishing = input.status === "published";
  if (isPublishing && !excerpt) {
    fieldErrors.excerpt = "Enter a short excerpt before publishing.";
  }
  if (!input.category && isPublishing) {
    fieldErrors.category = "Select a category.";
  } else if (input.category && !Types.ObjectId.isValid(input.category)) {
    fieldErrors.category = "Select a valid category.";
  }
  if (isPublishing && !hasContent(content)) {
    fieldErrors.content = "Add some article text or an image.";
  }
  if (!Array.isArray(input.videos)) {
    fieldErrors.videos = "The video selection is invalid.";
  } else {
    const videoError = validateVideos(input.videos);
    if (videoError) fieldErrors.videos = videoError;
  }
  if (input.status !== "draft" && input.status !== "published") {
    fieldErrors.status = "Select Draft or Published.";
  }
  if (
    input.thumbnail &&
    !isCloudinaryUrl(input.thumbnail, "image")
  ) {
    fieldErrors.thumbnail = "Upload the thumbnail before saving.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Review the highlighted fields and try again.",
      fieldErrors,
    };
  }

  try {
    await connectToDatabase();
    const existingPost = postId ? await Post.findById(postId).exec() : null;
    if (postId && !existingPost) {
      return { success: false, message: "The requested post could not be found." };
    }

    if (input.category) {
      const category = await Category.exists({ _id: input.category });
      if (!category) {
        return {
          success: false,
          message: "The selected category is no longer available.",
          fieldErrors: { category: "Select an existing category." },
        };
      }
    }

    const referencedMedia = [
      ...(input.thumbnail
        ? [{ url: input.thumbnail, resourceType: "image", field: "thumbnail" as const }]
        : []),
      ...collectImageUrls(content).map((url) => ({
        url,
        resourceType: "image",
        field: "content" as const,
      })),
      ...input.videos.flatMap((video) =>
        video.type === "cloudinary" && video.url
          ? [{ url: video.url, resourceType: "video", field: "videos" as const }]
          : [],
      ),
    ];
    if (referencedMedia.length) {
      const mediaRecords = await Media.find({
        url: { $in: referencedMedia.map((media) => media.url) },
        uploadedBy: new Types.ObjectId(session.userId),
      })
        .select({ url: 1, mimeType: 1 })
        .lean()
        .exec();
      for (const reference of referencedMedia) {
        const exists = mediaRecords.some(
          (record) =>
            record.url === reference.url &&
            record.mimeType.startsWith(`${reference.resourceType}/`),
        );
        if (!exists) {
          fieldErrors[reference.field] =
            reference.resourceType === "video"
              ? "Upload each Cloudinary video before saving the post."
              : "Upload images using the Cloudinary uploader before saving.";
        }
      }
      if (Object.keys(fieldErrors).length) {
        return {
          success: false,
          message: "Some referenced media could not be verified.",
          fieldErrors,
        };
      }
    }

    const postFields = {
      title,
      slug,
      excerpt: excerpt || undefined,
      thumbnail: input.thumbnail || undefined,
      category: input.category
        ? new Types.ObjectId(input.category)
        : undefined,
      tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
      status: input.status,
      content: hasContent(content)
        ? (content as PostDocument["content"])
        : undefined,
      videos: input.videos.length ? input.videos : undefined,
      seo: {
        metaTitle,
        metaDescription,
      },
      publishedAt:
        input.status === "published"
          ? existingPost?.publishedAt ?? new Date()
          : undefined,
    };
    let postIdToReturn: string;
    if (existingPost) {
      existingPost.set(postFields);
      await existingPost.save();
      postIdToReturn = existingPost._id.toString();
    } else {
      const post = await Post.create(postFields);
      postIdToReturn = post._id.toString();
    }

    revalidatePath("/admin-dashboard");
    revalidatePath("/admin-dashboard/posts");
    if (postId) revalidatePath(`/admin-dashboard/posts/${postId}/edit`);
    return { success: true, postId: postIdToReturn };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return {
        success: false,
        message: "A post with this slug already exists.",
        fieldErrors: { slug: "This slug is already in use." },
      };
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";
    const errorMessage = getSafeErrorMessage(error);
    console.error(
      `Post save failed (${errorName}): ${errorMessage}`,
    );
    if (errorName === "ValidationError") {
      return {
        success: false,
        message: "The post could not be saved because one or more fields are invalid.",
      };
    }
    if (/Mongo(ServerSelection|Network|Timeout)/i.test(errorName)) {
      return {
        success: false,
        message: "The database could not be reached. Check the connection and try again.",
      };
    }
    if (errorMessage.includes("_bsontype")) {
      return {
        success: false,
        message:
          "A post reference could not be processed. Refresh the editor, reselect the category, and re-add its media before saving again.",
        fieldErrors: {
          category: "Reselect the category and try saving again.",
          content: "Re-add article images or content blocks and retry.",
          thumbnail: "Upload the thumbnail again and retry.",
        },
      };
    }
    return {
      success: false,
      message: "The post could not be saved because of a server error. Please try again.",
    };
  }
}

export async function recordMediaUpload(
  input: UploadedMediaInput,
): Promise<{ success: true } | { success: false; message: string }> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, message: "Your session has expired. Sign in again." };
  }

  if (
    !isRecord(input) ||
    typeof input.filename !== "string" ||
    typeof input.url !== "string" ||
    typeof input.mimeType !== "string" ||
    typeof input.size !== "number" ||
    (input.resourceType !== "image" && input.resourceType !== "video") ||
    !isCloudinaryUploadFolder(input.folder) ||
    !Object.values(cloudinaryUploadTargets).some(
      (target) =>
        target.folder === input.folder &&
        target.resourceType === input.resourceType,
    ) ||
    !input.filename.trim() ||
    !input.mimeType.startsWith(`${input.resourceType}/`) ||
    !Number.isSafeInteger(input.size) ||
    input.size <= 0 ||
    !isCloudinaryUrl(input.url, input.resourceType)
  ) {
    return { success: false, message: "The uploaded media details are invalid." };
  }

  try {
    await connectToDatabase();
    await Media.create({
      filename: input.filename.trim(),
      url: input.url,
      mimeType: input.mimeType,
      size: input.size,
      uploadedBy: new Types.ObjectId(session.userId),
    });
    return { success: true };
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Media record creation failed (${errorName}): ${getSafeErrorMessage(error)}`,
    );
    return {
      success: false,
      message:
        "The upload completed, but its media record could not be saved. Please retry or contact support.",
    };
  }
}

export type { PostVideo, PostVideoType };
