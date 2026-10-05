"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { JSONContent } from "@tiptap/core";
import {
  Check,
  ChevronDown,
  Eye,
  ImagePlus,
  LoaderCircle,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileAdminNavigation } from "@/components/admin-dashboard/mobile-admin-navigation";
import { AdminSidebar } from "@/components/admin-dashboard/admin-navigation";
import { PostContentEditor } from "@/components/editor/post-content-editor";
import { CloudinaryUploadButton } from "@/components/admin-posts/cloudinary-upload-button";
import {
  createPostAction,
  updatePostAction,
  type CreatePostInput,
} from "@/app/admin-dashboard/posts/new/actions";
import type {
  PostContentItem,
  PostEmbedPlatform,
  PostStatus,
  TiptapDocument,
} from "@/models/post";
import { parsePostEmbed } from "@/lib/post-embeds";
import {
  postContentHasData,
} from "@/lib/post-content";
import { PostPreview } from "@/components/admin-posts/post-preview";

interface CategoryOption {
  id: string;
  name: string;
}

interface PostEditorFormProps {
  username: string;
  categories: CategoryOption[];
  categoryLoadError?: string;
  initialPost?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    thumbnail?: string;
    category: string;
    tags: string[];
    status: PostStatus;
    content: PostContentItem[];
    legacyEmbedOrderUnknown?: boolean;
    seo: {
      metaTitle: string;
      metaDescription: string;
    };
  };
}

type FormField =
  | "title"
  | "slug"
  | "excerpt"
  | "category"
  | "content"
  | "status"
  | "thumbnail";

type ContentBlock =
  | { id: number; type: "rich-text"; content: JSONContent }
  | { id: number; type: "image"; url: string; alt: string }
  | {
      id: number;
      type: "heading2" | "heading3" | "quote" | "bullet" | "numbered";
      text: string;
    }
  | { id: number; type: "link"; text: string; url: string }
  | {
      id: number;
      type: "embed";
      platform: PostEmbedPlatform | "";
      url: string;
      embedId?: string;
      title?: string;
      isUploading: boolean;
      error?: string;
    }
    | { id: number; type: "hr" };

type NewContentBlockType = ContentBlock["type"];

const fieldClassName =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-[#444444] outline-none transition focus:border-[#02a95c] focus:ring-2 focus:ring-green-100";
const labelClassName = "mb-2 block text-sm font-semibold text-[#444444]";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function initialContentBlocks(content: PostContentItem[] = []): ContentBlock[] {
  return content.map((item, index) => {
    const id = index + 1;
    if (item.type === "richText") {
      return {
        id,
        type: "rich-text",
        content: item.content as JSONContent,
      };
    }
    if (item.type === "image") {
      return { id, type: "image", url: item.url, alt: item.alt ?? "" };
    }
    if (item.type === "embed") {
      return {
        ...item,
        id,
        isUploading: false,
      };
    }
    return { ...item, id };
  });
}

function contentBlocksToPostContent(blocks: ContentBlock[]): PostContentItem[] {
  return blocks.flatMap((block): PostContentItem[] => {
    if (block.type === "rich-text") {
      return [{
        type: "richText",
        content: JSON.parse(JSON.stringify(block.content)) as TiptapDocument,
      }];
    }
    if (block.type === "image") {
      return block.url.trim()
        ? [{ type: "image", url: block.url.trim(), ...(block.alt ? { alt: block.alt } : {}) }]
        : [];
    }
    if (block.type === "embed") {
      if (!block.platform) return [];
      const parsed = parsePostEmbed(block.platform, block.url);
      return parsed
        ? [{ type: "embed", ...parsed, ...(block.title ? { title: block.title } : {}) }]
        : [];
    }
    if (block.type === "hr") return [{ type: "hr" }];
    if (block.type === "link") {
      return block.text.trim() && block.url.trim()
        ? [{ type: "link", text: block.text.trim(), url: block.url.trim() }]
        : [];
    }
    return block.text.trim()
      ? [{ type: block.type, text: block.text.trim() }]
      : [];
  });
}

function isSafeLink(value: string): boolean {
  const href = value.trim();
  if (href.startsWith("/") && !href.startsWith("//")) return true;

  try {
    const protocol = new URL(href).protocol;
    return protocol === "https:" || protocol === "http:" || protocol === "mailto:";
  } catch {
    return false;
  }
}

export function PostEditorForm({
  username,
  categories,
  categoryLoadError,
  initialPost,
}: PostEditorFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialPost));
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [thumbnail, setThumbnail] = useState(initialPost?.thumbnail ?? "");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [uploadingContentImages, setUploadingContentImages] = useState<Set<number>>(
    () => new Set(),
  );
  const [category, setCategory] = useState(initialPost?.category ?? "");
  const [tags, setTags] = useState(initialPost?.tags.join(", ") ?? "");
  const [status, setStatus] = useState<PostStatus>(initialPost?.status ?? "draft");
  const [metaTitle, setMetaTitle] = useState(initialPost?.seo.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    initialPost?.seo.metaDescription ?? "",
  );
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(() =>
    initialContentBlocks(initialPost?.content),
  );
  const [nextContentBlockId, setNextContentBlockId] = useState(
    () => initialContentBlocks(initialPost?.content).length + 1,
  );
  const [isContentMenuOpen, setIsContentMenuOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({});
  const [formMessage, setFormMessage] = useState("");
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [savingStatus, setSavingStatus] = useState<"draft" | "published" | null>(null);
  const previewContent = contentBlocksToPostContent(contentBlocks);

  function clearFieldError(field: FormField) {
    setFieldErrors((errors) => ({ ...errors, [field]: undefined }));
    setFormMessage("");
    setSaveSucceeded(false);
  }

  function updateContentBlock(
    id: number,
    update: (block: ContentBlock) => ContentBlock,
  ) {
    setContentBlocks((blocks) =>
      blocks.map((block) => (block.id === id ? update(block) : block)),
    );
    setFormMessage("");
    setSaveSucceeded(false);
  }

  function addContentBlock(type: NewContentBlockType) {
    setIsContentMenuOpen(false);
    setFormMessage("");
    setSaveSucceeded(false);

    if (type === "embed") {
      if (contentBlocks.filter((block) => block.type === "embed").length >= 2) {
        setFieldErrors((errors) => ({
          ...errors,
          content: "A post can have no more than 2 embed fields.",
        }));
        return;
      }
      const id = nextContentBlockId;
      setContentBlocks((blocks) => [
        ...blocks,
        {
          id,
          type: "embed",
          platform: "",
          url: "",
          isUploading: false,
        },
      ]);
      setNextContentBlockId((current) => current + 1);
      return;
    }

    const id = nextContentBlockId;
    const block: ContentBlock =
      type === "rich-text"
        ? { id, type, content: { type: "doc", content: [] } }
        : type === "image"
          ? { id, type, url: "", alt: "" }
          : type === "link"
            ? { id, type, text: "", url: "" }
            : type === "hr"
              ? { id, type }
              : { id, type, text: "" };

    setContentBlocks((blocks) => [...blocks, block]);
    setNextContentBlockId((current) => current + 1);
  }

  function validateBeforeSave(nextStatus: "draft" | "published"): boolean {
    const nextErrors: Partial<Record<FormField, string>> = {};
    if (!title.trim()) nextErrors.title = "Enter a post title.";
    if (!slug.trim()) {
      nextErrors.slug = "Enter a post slug.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim().toLowerCase())) {
      nextErrors.slug = "Use lowercase letters, numbers, and hyphens only.";
    }
    if (nextStatus === "published") {
      if (!excerpt.trim()) {
        nextErrors.excerpt = "Enter a short excerpt before publishing.";
      }
      if (!category) nextErrors.category = "Select a category.";
      if (!postContentHasData(contentBlocksToPostContent(contentBlocks))) {
        nextErrors.content = "Add some article text or an image.";
      }
      if (
        contentBlocks.some(
          (block) =>
            block.type === "link" &&
            (block.text.trim() || block.url.trim()) &&
            (!block.text.trim() || !isSafeLink(block.url)),
        )
      ) {
        nextErrors.content = "Enter link text and a valid http(s), mailto, or site-relative URL.";
      }
    }
    if (thumbnailUploading) nextErrors.thumbnail = "Wait for the thumbnail upload to finish.";

    if (uploadingContentImages.size > 0) {
      nextErrors.content = "Wait for article image uploads to finish before saving.";
    }

    const embedCount = contentBlocks.filter((block) => block.type === "embed").length;
    if (embedCount > 2) {
      nextErrors.content = "A post can have no more than 2 embed fields.";
    } else if (
      contentBlocks.some(
        (block) =>
          block.type === "embed" &&
          (!block.platform ||
            !block.url.trim() ||
            block.isUploading ||
            !parsePostEmbed(block.platform, block.url)),
      )
    ) {
      nextErrors.content =
        "Choose a supported embed type and enter a valid URL or finish the Cloudinary upload.";
    }

    setFieldErrors(nextErrors);
    setFormMessage(
      Object.keys(nextErrors).length ? "Review the highlighted fields and try again." : "",
    );
    return Object.keys(nextErrors).length === 0;
  }

  function savePost(nextStatus: "draft" | "published") {
    if (savingStatus || isPending) return;
    const content = contentBlocksToPostContent(contentBlocks);
    if (!validateBeforeSave(nextStatus)) return;

    const input: CreatePostInput = {
      title,
      slug,
      excerpt,
      thumbnail: thumbnail || undefined,
      category,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      status: nextStatus,
      content,
      seo: { metaTitle, metaDescription },
    };

    setSavingStatus(nextStatus);
    startTransition(async () => {
      try {
        const result = initialPost
          ? await updatePostAction(initialPost.id, input)
          : await createPostAction(input);
        if (result.success) {
          setStatus(nextStatus);
          setSaveSucceeded(true);
          setFormMessage(
            nextStatus === "published"
              ? initialPost
                ? "Post updated and published. Returning to Posts..."
                : "Post published. Returning to Posts..."
              : initialPost
                ? "Draft updated. Returning to Posts..."
                : "Draft saved. Returning to Posts...",
          );
          setFieldErrors({});
          const notice =
            nextStatus === "published"
              ? initialPost
                ? "post-updated"
                : "post-published"
              : initialPost
                ? "draft-updated"
                : "draft-saved";
          window.setTimeout(() => {
            router.replace(`/admin-dashboard/posts?notice=${notice}`);
          }, 1200);
        } else {
          setSavingStatus(null);
          setSaveSucceeded(false);
          setFormMessage(result.message);
          setFieldErrors((current) => ({
            ...current,
            ...result.fieldErrors,
          }));
        }
      } catch (error) {
        const errorName = error instanceof Error ? error.name : "UnknownError";
        console.error(`Post save request failed (${errorName}).`);
        setSavingStatus(null);
        setSaveSucceeded(false);
        setFormMessage(
          "The post could not be saved because the request failed. Check your connection and try again.",
        );
      }
    });
  }

  function updateTitle(value: string) {
    setTitle(value);
    if (!slugManuallyEdited) setSlug(toSlug(value));
    clearFieldError("title");
  }

  function updateSlug(value: string) {
    setSlug(value.toLowerCase().replace(/\s+/g, "-"));
    setSlugManuallyEdited(true);
    clearFieldError("slug");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-[#444444]">
      <AdminSidebar
        username={username}
        activeHref={
          initialPost
            ? `/admin-dashboard/posts/${initialPost.id}/edit`
            : "/admin-dashboard/posts/new"
        }
      />
      <main className="min-w-0 lg:ml-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 flex-col justify-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <MobileAdminNavigation
                username={username}
                activeHref={
                  initialPost
                    ? `/admin-dashboard/posts/${initialPost.id}/edit`
                    : "/admin-dashboard/posts/new"
                }
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold sm:text-2xl">
                  {initialPost ? "Edit Post" : "Create Post"}
                </h1>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  {initialPost
                    ? "Update your article and publication settings."
                    : "Create, preview and publish an article."}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPreviewOpen(true)}
                  className="h-11 rounded-xl border-slate-300 px-3 text-slate-700 sm:px-4"
                >
                  <Eye aria-hidden="true" />
                  Preview
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending || savingStatus !== null}
                  onClick={() => savePost("draft")}
                  className="h-11 rounded-xl border-[#02a95c] px-3 text-[#02a95c] hover:bg-green-50 sm:px-4"
                >
                  {savingStatus === "draft" ? (
                    <LoaderCircle aria-hidden="true" className="animate-spin" />
                  ) : (
                    <Save aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">Save Draft</span>
                  <span className="sm:hidden">Draft</span>
                </Button>
                <Button
                  type="button"
                  disabled={isPending || savingStatus !== null}
                  onClick={() => savePost("published")}
                  className="h-11 rounded-xl bg-[#02a95c] px-3 text-white shadow-sm hover:bg-[#029650] sm:px-4"
                >
                  {savingStatus === "published" ? (
                    <LoaderCircle aria-hidden="true" className="animate-spin" />
                  ) : (
                    <Send aria-hidden="true" />
                  )}
                  Publish
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {formMessage && (
            <div
              role={saveSucceeded ? "status" : "alert"}
              className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
                saveSucceeded
                  ? "border-green-200 bg-green-50 text-green-900"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <p>{formMessage}</p>
            </div>
          )}

          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="min-w-0 space-y-6" aria-label="Post editor">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="basic-information-title">
                <div className="mb-5">
                  <h2 id="basic-information-title" className="text-lg font-bold">
                    Basic Information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Title and slug are needed to save a draft. Excerpt, category, and article content can be added before publishing.
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="post-title" className={labelClassName}>
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="post-title"
                      value={title}
                      onChange={(event) => updateTitle(event.target.value)}
                      placeholder="Enter article title..."
                      aria-invalid={Boolean(fieldErrors.title)}
                      aria-describedby={fieldErrors.title ? "post-title-error" : undefined}
                      className={fieldClassName}
                    />
                    {fieldErrors.title && (
                      <FieldError id="post-title-error">{fieldErrors.title}</FieldError>
                    )}
                  </div>
                  <div>
                    <label htmlFor="post-slug" className={labelClassName}>
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="post-slug"
                      value={slug}
                      onChange={(event) => updateSlug(event.target.value)}
                      placeholder="article-url-slug"
                      aria-invalid={Boolean(fieldErrors.slug)}
                      aria-describedby={fieldErrors.slug ? "post-slug-error" : "post-slug-help"}
                      className={fieldClassName}
                    />
                    <p id="post-slug-help" className="mt-1 text-xs text-slate-500">
                      Used in the post URL. Example: /technology/future-of-ai
                    </p>
                    {fieldErrors.slug && (
                      <FieldError id="post-slug-error">{fieldErrors.slug}</FieldError>
                    )}
                  </div>
                  <div>
                    <label htmlFor="post-excerpt" className={labelClassName}>
                      Excerpt
                    </label>
                    <textarea
                      id="post-excerpt"
                      rows={3}
                      value={excerpt}
                      onChange={(event) => {
                        setExcerpt(event.target.value);
                        clearFieldError("excerpt");
                      }}
                      placeholder="Short summary of the article..."
                      aria-invalid={Boolean(fieldErrors.excerpt)}
                      aria-describedby={fieldErrors.excerpt ? "post-excerpt-error" : undefined}
                      className={`${fieldClassName} resize-y`}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Required before publishing; drafts may omit this.
                    </p>
                    {fieldErrors.excerpt && (
                      <FieldError id="post-excerpt-error">{fieldErrors.excerpt}</FieldError>
                    )}
                  </div>
                  <div>
                    <label htmlFor="post-thumbnail" className={labelClassName}>
                      Thumbnail
                    </label>
                    <div className="rounded-xl border-2 border-dashed border-slate-300 p-4 text-center hover:border-[#02a95c] sm:p-5">
                      <div className="mx-auto flex max-w-md flex-col items-center gap-3 sm:flex-row">
                        <ImagePlus aria-hidden="true" className="size-6 text-[#608a89]" />
                        <CloudinaryUploadButton
                          target="thumbnail"
                          disabled={thumbnailUploading}
                          onUploadingChange={(isUploading) =>
                            setThumbnailUploading(isUploading)
                          }
                          onUploaded={(url) => {
                            setThumbnail(url);
                            clearFieldError("thumbnail");
                          }}
                          className="min-h-11 rounded-lg bg-[#e8f2f4] px-4 text-sm font-medium text-[#02a95c] hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] disabled:opacity-50"
                        >
                          {thumbnailUploading
                            ? "Uploading thumbnail..."
                            : "Choose image"}
                        </CloudinaryUploadButton>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Optional. Images upload directly to Cloudinary and are recorded in Media.
                      </p>
                      {thumbnail && (
                        <div className="mt-4">
                          <Image
                            unoptimized
                            src={thumbnail}
                            alt="Selected thumbnail preview"
                            width={1200}
                            height={675}
                            className="mx-auto max-h-64 w-auto rounded-lg object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setThumbnail("");
                              clearFieldError("thumbnail");
                            }}
                            className="mt-2 min-h-11 px-3 text-sm font-medium text-red-600 underline underline-offset-2"
                          >
                            Remove thumbnail
                          </button>
                        </div>
                      )}
                      {fieldErrors.thumbnail && (
                        <FieldError>{fieldErrors.thumbnail}</FieldError>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="article-content-title">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 id="article-content-title" className="text-lg font-bold">
                      Article Content
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Add and fill content fields. Article content is required before publishing.
                    </p>
                  </div>
                  <div className="relative">
                    <Button
                      type="button"
                      className="h-11 gap-2 rounded-xl bg-[#02a95c] px-4 text-white hover:bg-[#029650]"
                      aria-expanded={isContentMenuOpen}
                      aria-haspopup="menu"
                      aria-controls="post-content-menu"
                      onClick={() => setIsContentMenuOpen((open) => !open)}
                    >
                      + Add Content
                      <ChevronDown aria-hidden="true" className="size-4" />
                    </Button>
                    {isContentMenuOpen && (
                      <div
                        id="post-content-menu"
                        role="menu"
                        aria-label="Add content field"
                        className="absolute right-0 top-full z-20 mt-2 max-h-80 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
                      >
                        {[
                          ["rich-text", "Rich Text Editor"],
                          ["image", "Image"],
                          ["embed", "Embed"],
                          ["heading2", "H2"],
                          ["heading3", "H3"],
                          ["bullet", "Bullet List"],
                          ["numbered", "Numbered List"],
                          ["quote", "Quote"],
                          ["link", "Link"],
                          ["hr", "Horizontal Rule"],
                        ].map(([type, label]) => (
                          <button
                            key={type}
                            type="button"
                            role="menuitem"
                            disabled={
                              type === "embed" &&
                              contentBlocks.filter((block) => block.type === "embed")
                                .length >= 2
                            }
                            onClick={() =>
                              addContentBlock(type as NewContentBlockType)
                            }
                            className="block min-h-11 w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {initialPost?.legacyEmbedOrderUnknown && (
                  <p
                    role="status"
                    className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
                  >
                    This older post stored embeds separately, so their original
                    positions were not recorded. They are shown after the saved
                    article content as a migration fallback, not as a recovered
                    original order.
                  </p>
                )}

                {contentBlocks.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No content fields yet. Select an item from Add Content to begin.
                  </p>
                )}

                <div className="space-y-4">
                  {contentBlocks.map((block, index) => (
                    <article
                      key={block.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-[#608a89]">
                          {index + 1}.{" "}
                          {block.type === "rich-text"
                            ? "Rich Text Editor"
                            : block.type === "image"
                              ? "Image"
                              : block.type === "heading2"
                                ? "H2"
                                : block.type === "heading3"
                                  ? "H3"
                                  : block.type === "bullet"
                                    ? "Bullet List"
                                    : block.type === "numbered"
                                      ? "Numbered List"
                                      : block.type === "hr"
                                        ? "Horizontal Rule"
                                        : block.type === "embed"
                                          ? "Embed"
                                          : block.type === "link"
                                            ? "Link"
                                            : "Quote"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setContentBlocks((blocks) =>
                              blocks.filter((item) => item.id !== block.id),
                            );
                            setUploadingContentImages((current) => {
                              const next = new Set(current);
                              next.delete(block.id);
                              return next;
                            });
                            clearFieldError("content");
                          }}
                          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          aria-label={`Remove content field ${index + 1}`}
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                          Remove
                        </button>
                      </div>

                      {block.type === "rich-text" && (
                        <PostContentEditor
                          initialContent={block.content}
                          onChange={(nextContent) =>
                            updateContentBlock(block.id, (current) =>
                              current.type === "rich-text"
                                ? { ...current, content: nextContent }
                                : current,
                            )
                          }
                          ariaLabel={`Rich text editor ${index + 1}`}
                        />
                      )}

                      {block.type === "image" && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center">
                            <CloudinaryUploadButton
                              target="postImage"
                              onUploadingChange={(isUploading) =>
                                setUploadingContentImages((current) => {
                                  const next = new Set(current);
                                  if (isUploading) next.add(block.id);
                                  else next.delete(block.id);
                                  return next;
                                })
                              }
                              onUploaded={(url) =>
                                updateContentBlock(block.id, (current) =>
                                  current.type === "image"
                                    ? { ...current, url }
                                    : current,
                                )
                              }
                              className="min-h-11 rounded-lg bg-[#e8f2f4] px-4 text-sm font-medium text-[#02a95c] hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c]"
                            >
                              {block.url ? "Replace image" : "Choose image"}
                            </CloudinaryUploadButton>
                            {block.url && (
                              <Image
                                unoptimized
                                src={block.url}
                                alt={block.alt || "Post content image preview"}
                                width={1200}
                                height={675}
                                className="mx-auto mt-3 max-h-64 w-auto rounded-lg object-contain"
                              />
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor={`content-image-alt-${block.id}`}
                              className={labelClassName}
                            >
                              Image alt text
                            </label>
                            <input
                              id={`content-image-alt-${block.id}`}
                              value={block.alt}
                              onChange={(event) =>
                                updateContentBlock(block.id, (current) =>
                                  current.type === "image"
                                    ? { ...current, alt: event.target.value }
                                    : current,
                                )
                              }
                              placeholder="Describe the image"
                              className={fieldClassName}
                            />
                          </div>
                        </div>
                      )}

                      {(block.type === "heading2" ||
                        block.type === "heading3") && (
                        <input
                          value={block.text}
                          onChange={(event) =>
                            updateContentBlock(block.id, (current) =>
                              current.type === "heading2" ||
                              current.type === "heading3"
                                ? { ...current, text: event.target.value }
                                : current,
                            )
                          }
                          placeholder={
                            block.type === "heading2" ? "H2 heading..." : "H3 heading..."
                          }
                          className={`${fieldClassName} ${
                            block.type === "heading2"
                              ? "text-lg font-semibold"
                              : "font-semibold"
                          }`}
                        />
                      )}

                      {(block.type === "quote" ||
                        block.type === "bullet" ||
                        block.type === "numbered") && (
                        <textarea
                          rows={block.type === "quote" ? 3 : 4}
                          value={block.text}
                          onChange={(event) =>
                            updateContentBlock(block.id, (current) =>
                              current.type === "quote" ||
                              current.type === "bullet" ||
                              current.type === "numbered"
                                ? { ...current, text: event.target.value }
                                : current,
                            )
                          }
                          placeholder={
                            block.type === "quote"
                              ? "Write quote..."
                              : "Enter one list item per line..."
                          }
                          className={`${fieldClassName} resize-y ${
                            block.type === "quote" ? "italic" : ""
                          }`}
                        />
                      )}

                      {block.type === "link" && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor={`content-link-text-${block.id}`}
                              className={labelClassName}
                            >
                              Link text
                            </label>
                            <input
                              id={`content-link-text-${block.id}`}
                              value={block.text}
                              onChange={(event) =>
                                updateContentBlock(block.id, (current) =>
                                  current.type === "link"
                                    ? { ...current, text: event.target.value }
                                    : current,
                                )
                              }
                              placeholder="Link text..."
                              className={fieldClassName}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`content-link-url-${block.id}`}
                              className={labelClassName}
                            >
                              URL
                            </label>
                            <input
                              id={`content-link-url-${block.id}`}
                              value={block.url}
                              onChange={(event) =>
                                updateContentBlock(block.id, (current) =>
                                  current.type === "link"
                                    ? { ...current, url: event.target.value }
                                    : current,
                                )
                              }
                              placeholder="https://example.com"
                              className={fieldClassName}
                            />
                          </div>
                        </div>
                      )}

                      {block.type === "hr" && (
                        <div className="py-3">
                          <hr className="border-slate-300" />
                          <p className="mt-2 text-xs text-slate-500">
                            Horizontal rule
                          </p>
                        </div>
                      )}

                      {block.type === "embed" && (
                        <div className="space-y-3">
                          <div>
                            <label
                              htmlFor={`content-embed-platform-${block.id}`}
                              className={labelClassName}
                            >
                              Embed Type
                            </label>
                            <select
                              id={`content-embed-platform-${block.id}`}
                              value={block.platform}
                              onChange={(event) =>
                                updateContentBlock(block.id, (current) =>
                                  current.type === "embed"
                                    ? {
                                        ...current,
                                        platform: event.target.value as
                                          | PostEmbedPlatform
                                          | "",
                                        url: "",
                                        embedId: undefined,
                                        error: undefined,
                                      }
                                    : current,
                                )
                              }
                              className={fieldClassName}
                            >
                              <option value="">Select platform</option>
                              <option value="cloudinary">Cloudinary Video</option>
                              <option value="youtube">YouTube</option>
                              <option value="instagram">Instagram</option>
                              <option value="x">X / Twitter</option>
                              <option value="facebook">Facebook</option>
                              <option value="tiktok">TikTok</option>
                            </select>
                          </div>

                          {block.platform === "cloudinary" ? (
                            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4">
                              <CloudinaryUploadButton
                                target="postVideo"
                                disabled={block.isUploading}
                                onUploadingChange={(isUploading) =>
                                  updateContentBlock(block.id, (current) =>
                                    current.type === "embed"
                                      ? { ...current, isUploading }
                                      : current,
                                  )
                                }
                                onUploaded={(url) => {
                                  const parsed = parsePostEmbed("cloudinary", url);
                                  updateContentBlock(block.id, (current) =>
                                    current.type === "embed"
                                      ? {
                                          ...current,
                                          url,
                                          embedId: parsed?.embedId,
                                          error: parsed
                                            ? undefined
                                            : "The Cloudinary video URL is not valid.",
                                        }
                                      : current,
                                  );
                                }}
                                className="min-h-11 rounded-lg bg-[#e8f2f4] px-4 text-sm font-medium text-[#02a95c] hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] disabled:opacity-50"
                              >
                                {block.url ? "Replace video" : "Upload video"}
                              </CloudinaryUploadButton>
                              {block.url && (
                                <video
                                  controls
                                  preload="metadata"
                                  src={block.url}
                                  className="mt-3 aspect-video w-full rounded-lg bg-black"
                                />
                              )}
                              <p className="mt-2 text-xs text-slate-500">
                                Upload a Cloudinary video, or choose another supported platform.
                              </p>
                            </div>
                          ) : block.platform ? (
                            <div>
                              <label
                                htmlFor={`content-embed-url-${block.id}`}
                                className={labelClassName}
                              >
                                {block.platform === "x"
                                  ? "Post URL"
                                  : `${block.platform[0].toUpperCase()}${block.platform.slice(1)} URL`}
                              </label>
                              <input
                                id={`content-embed-url-${block.id}`}
                                type="url"
                                value={block.url}
                                onChange={(event) => {
                                  const url = event.target.value;
                                  const parsed = parsePostEmbed(block.platform as PostEmbedPlatform, url);
                                  updateContentBlock(block.id, (current) =>
                                    current.type === "embed"
                                      ? {
                                          ...current,
                                          url,
                                          embedId: parsed?.embedId,
                                          error:
                                            url && !parsed
                                              ? `Enter a valid ${current.platform} URL.`
                                              : undefined,
                                        }
                                      : current,
                                  );
                                }}
                                placeholder={
                                  block.platform === "youtube"
                                    ? "https://www.youtube.com/watch?v=..."
                                    : `https://${block.platform}.com/...`
                                }
                                aria-invalid={Boolean(block.error)}
                                className={fieldClassName}
                              />
                            </div>
                          ) : null}
                          {block.error && <FieldError>{block.error}</FieldError>}
                        </div>
                      )}
                    </article>
                  ))}
                </div>

                {fieldErrors.content && (
                  <FieldError>{fieldErrors.content}</FieldError>
                )}

              </section>
            </section>

            <aside className="space-y-6" aria-label="Post settings">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="publishing-title">
                <h2 id="publishing-title" className="font-bold">Publishing</h2>
                <div className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="post-status" className={labelClassName}>Status</label>
                    <select
                      id="post-status"
                      value={status}
                      onChange={(event) =>
                        setStatus(event.target.value as "draft" | "published")
                      }
                      className={fieldClassName}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="post-category" className={labelClassName}>
                      Category
                    </label>
                    <select
                      id="post-category"
                      value={category}
                      onChange={(event) => {
                        setCategory(event.target.value);
                        clearFieldError("category");
                      }}
                      aria-invalid={Boolean(fieldErrors.category)}
                      aria-describedby={
                        fieldErrors.category ? "post-category-error" : undefined
                      }
                      disabled={!categories.length}
                      className={fieldClassName}
                    >
                      <option value="">Select category</option>
                      {categories.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    {fieldErrors.category && (
                      <FieldError id="post-category-error">{fieldErrors.category}</FieldError>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      Required before publishing; drafts may omit this.
                    </p>
                    {categoryLoadError && (
                      <p role="alert" className="mt-2 text-sm text-red-600">
                        {categoryLoadError}
                      </p>
                    )}
                    {!categories.length && !categoryLoadError && (
                      <p className="mt-2 text-xs text-slate-500">
                        Add a category before creating a post.
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="post-tags" className={labelClassName}>Tags</label>
                    <input
                      id="post-tags"
                      value={tags}
                      onChange={(event) => setTags(event.target.value)}
                      placeholder="AI, technology, future"
                      className={fieldClassName}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Separate tags with commas.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="seo-title">
                <h2 id="seo-title" className="font-bold">SEO</h2>
                <div className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="post-meta-title" className={labelClassName}>Meta Title</label>
                    <input
                      id="post-meta-title"
                      value={metaTitle}
                      onChange={(event) => setMetaTitle(event.target.value)}
                      placeholder="Optional SEO title"
                      className={fieldClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="post-meta-description" className={labelClassName}>
                      Meta Description
                    </label>
                    <textarea
                      id="post-meta-description"
                      rows={4}
                      value={metaDescription}
                      onChange={(event) => setMetaDescription(event.target.value)}
                      placeholder="Optional SEO description..."
                      className={`${fieldClassName} resize-y`}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-green-100 bg-green-50 p-5" aria-labelledby="publish-checklist-title">
                <h2 id="publish-checklist-title" className="font-semibold text-green-900">
                  Before publishing
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-green-800">
                  <li className="flex items-start gap-2"><Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />Add a clear article title</li>
                  <li className="flex items-start gap-2"><Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />Select a category</li>
                  <li className="flex items-start gap-2"><Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />Check article content</li>
                  <li className="flex items-start gap-2"><Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />Preview the article</li>
                  <li className="flex items-start gap-2"><Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />Videos are optional</li>
                </ul>
              </section>
            </aside>
          </div>
        </div>
      </main>

      <PostPreview
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={title}
        excerpt={excerpt}
        thumbnail={thumbnail}
        blocks={previewContent}
      />
    </div>
  );
}

function FieldError({ id, children }: { id?: string; children: string }) {
  return (
    <p id={id} role="alert" className="mt-2 text-sm text-red-600">
      {children}
    </p>
  );
}
