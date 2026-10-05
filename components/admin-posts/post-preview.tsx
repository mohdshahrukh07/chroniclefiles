"use client";

import { useEffect, type ReactNode } from "react";
import Image from "next/image";
import type { JSONContent } from "@tiptap/core";
import { X } from "lucide-react";
import type { PreviewBlock } from "@/components/admin-posts/post-preview-order";

interface PostPreviewProps {
  open: boolean;
  onClose: () => void;
  title: string;
  excerpt: string;
  thumbnail?: string;
  blocks: PreviewBlock[];
}

function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

function PreviewNode({
  node,
  nodeKey,
}: {
  node: JSONContent;
  nodeKey: string;
}): ReactNode {
  if (node.type === "text") {
    let text: ReactNode = node.text ?? "";
    for (const [index, mark] of (node.marks ?? []).entries()) {
      if (mark.type === "bold") text = <strong key={`${nodeKey}-bold-${index}`}>{text}</strong>;
      if (mark.type === "italic") text = <em key={`${nodeKey}-italic-${index}`}>{text}</em>;
      if (mark.type === "link") {
        const href = safeHref(mark.attrs?.href);
        text = href ? (
          <a
            key={`${nodeKey}-link-${index}`}
            href={href}
            rel="noreferrer"
            className="text-[#02a95c] underline underline-offset-2"
          >
            {text}
          </a>
        ) : (
          text
        );
      }
    }
    return text;
  }

  if (node.type === "hardBreak") return <br key={nodeKey} />;
  if (node.type === "horizontalRule") return <hr key={nodeKey} className="my-8 border-slate-200" />;

  const children = (node.content ?? []).map((child, index) => (
    <PreviewNode key={`${nodeKey}-${index}`} node={child} nodeKey={`${nodeKey}-${index}`} />
  ));

  switch (node.type) {
    case "doc":
      return <>{children}</>;
    case "paragraph":
      return <p className="my-5 text-base leading-8 text-slate-700">{children}</p>;
    case "heading": {
      const level = node.attrs?.level;
      if (level === 2) {
        return <h2 className="mb-4 mt-8 font-serif text-2xl font-bold text-slate-900">{children}</h2>;
      }
      if (level === 3) {
        return <h3 className="mb-3 mt-6 font-serif text-xl font-bold text-slate-900">{children}</h3>;
      }
      return <p className="my-5 text-base leading-8 text-slate-700">{children}</p>;
    }
    case "bulletList":
      return <ul className="mb-5 ml-6 list-disc space-y-2 text-slate-700">{children}</ul>;
    case "orderedList":
      return <ol className="mb-5 ml-6 list-decimal space-y-2 text-slate-700">{children}</ol>;
    case "listItem":
      return <li>{children}</li>;
    case "blockquote":
      return (
        <blockquote className="my-6 border-l-4 border-[#02a95c] bg-green-50 px-5 py-4 italic text-slate-700">
          {children}
        </blockquote>
      );
    case "image": {
      const src = safeHref(node.attrs?.src);
      if (!src) return null;
      return (
        <figure className="my-6">
          <Image
            unoptimized
            src={src}
            alt={typeof node.attrs?.alt === "string" ? node.attrs.alt : ""}
            width={1200}
            height={800}
            className="mx-auto max-h-[36rem] w-full rounded-xl object-contain"
          />
        </figure>
      );
    }
    default:
      return children;
  }
}

export function PostPreview({
  open,
  onClose,
  title,
  excerpt,
  thumbnail,
  blocks,
}: PostPreviewProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-preview-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3 sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="mx-auto min-h-full max-w-4xl">
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#02a95c]">
                Article Preview
              </p>
              <p id="post-preview-title" className="text-sm text-slate-500">
                Preview before publishing
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close article preview"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c]"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </header>

          <article className="mx-auto max-w-3xl p-6 sm:p-10">
            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#02a95c]">
              ChronicleFiles
            </div>
            <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">
              {title.trim() || "Untitled Article"}
            </h1>
            {excerpt.trim() && (
              <p className="mt-5 text-lg leading-8 text-slate-600">{excerpt}</p>
            )}
            {thumbnail && (
              <div className="relative my-8 aspect-video w-full overflow-hidden rounded-xl">
                <Image
                  unoptimized
                  fill
                  src={thumbnail}
                  alt=""
                  className="object-cover"
                />
              </div>
            )}
            <div className="my-8 border-t border-slate-200" />
            <div className="[&_a]:break-words">
              {blocks.map((block) => {
                if ("content" in block) {
                  return (
                    <PreviewNode
                      key={block.id}
                      node={block.content}
                      nodeKey={`preview-${block.id}`}
                    />
                  );
                }

                const video = block.video;
                if (video?.type === "cloudinary" && video.url) {
                  return (
                    <video
                      key={block.id}
                      controls
                      preload="metadata"
                      src={video.url}
                      className="my-8 aspect-video w-full rounded-xl bg-black"
                    >
                      Your browser does not support video playback.
                    </video>
                  );
                }
                if (video?.type === "youtube" && video.videoId) {
                  return (
                    <iframe
                      key={block.id}
                      src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.videoId)}`}
                      title={`YouTube video ${video.id}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      className="my-8 aspect-video w-full rounded-xl border-0 bg-black"
                    />
                  );
                }
                return null;
              })}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
