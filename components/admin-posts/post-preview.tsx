"use client";

import { Fragment, useEffect, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import type { JSONContent } from "@tiptap/core";
import { X } from "lucide-react";
import type { PostContentItem } from "@/models/post";
import { PostEmbedRenderer } from "@/components/post-embed-renderer";
import {
  safeCalloutKind,
  safeFontSize,
  safeHref,
  safeImageAlignment,
  safeImageCaption,
  safeImageSrc,
  safeImageWidth,
  safeTextAlignment,
  safeTextColor,
} from "@/lib/tiptap-content";

const calloutLabels = {
  note: "Note",
  warning: "Warning",
  tip: "Tip",
  important: "Important",
} as const;

const calloutClasses = {
  note: "border-blue-500 bg-blue-50",
  warning: "border-amber-500 bg-amber-50",
  tip: "border-emerald-500 bg-emerald-50",
  important: "border-rose-500 bg-rose-50",
} as const;

interface PostPreviewProps {
  open: boolean;
  onClose: () => void;
  title: string;
  excerpt: string;
  thumbnail?: string;
  blocks: PostContentItem[];
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
      if (mark.type === "underline") text = <u key={`${nodeKey}-underline-${index}`}>{text}</u>;
      if (mark.type === "strike") text = <s key={`${nodeKey}-strike-${index}`}>{text}</s>;
      if (mark.type === "code") {
        text = <code key={`${nodeKey}-code-${index}`} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em]">{text}</code>;
      }
      if (mark.type === "superscript") text = <sup key={`${nodeKey}-sup-${index}`}>{text}</sup>;
      if (mark.type === "subscript") text = <sub key={`${nodeKey}-sub-${index}`}>{text}</sub>;
      if (mark.type === "highlight") {
        text = <mark key={`${nodeKey}-highlight-${index}`} className="rounded bg-amber-200 px-0.5 text-inherit">{text}</mark>;
      }
      if (mark.type === "textStyle") {
        const style: CSSProperties = {};
        const color = safeTextColor(mark.attrs?.color);
        const fontSize = safeFontSize(mark.attrs?.fontSize);
        if (color) style.color = color;
        if (fontSize) style.fontSize = fontSize;
        if (Object.keys(style).length) {
          text = <span key={`${nodeKey}-style-${index}`} style={style}>{text}</span>;
        }
      }
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
    case "paragraph": {
      const textAlign = safeTextAlignment(node.attrs?.textAlign);
      return <p className="my-5 text-base leading-8 text-slate-700" style={textAlign ? { textAlign } : undefined}>{children}</p>;
    }
    case "heading": {
      const level = node.attrs?.level;
      const textAlign = safeTextAlignment(node.attrs?.textAlign);
      if (level === 2) {
        return <h2 className="mb-4 mt-8 font-serif text-2xl font-bold text-slate-900" style={textAlign ? { textAlign } : undefined}>{children}</h2>;
      }
      if (level === 3) {
        return <h3 className="mb-3 mt-6 font-serif text-xl font-bold text-slate-900" style={textAlign ? { textAlign } : undefined}>{children}</h3>;
      }
      return <p className="my-5 text-base leading-8 text-slate-700">{children}</p>;
    }
    case "bulletList":
      return <ul className="mb-5 ml-6 list-disc space-y-2 text-slate-700">{children}</ul>;
    case "orderedList":
      return <ol start={typeof node.attrs?.start === "number" && node.attrs.start > 0 ? node.attrs.start : undefined} className="mb-5 ml-6 list-decimal space-y-2 text-slate-700">{children}</ol>;
    case "listItem":
      return <li>{children}</li>;
    case "taskList":
      return <ul className="mb-5 list-none space-y-2 pl-0 text-slate-700">{children}</ul>;
    case "taskItem":
      return (
        <li className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={node.attrs?.checked === true}
            disabled
            aria-label={node.attrs?.checked === true ? "Completed task" : "Incomplete task"}
            className="mt-2 size-4 shrink-0 accent-[#02a95c]"
          />
          <div>{children}</div>
        </li>
      );
    case "blockquote":
      return (
        <blockquote className="my-6 border-l-4 border-[#02a95c] bg-green-50 px-5 py-4 italic text-slate-700">
          {children}
        </blockquote>
      );
    case "codeBlock":
      return <pre className="my-5 overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100"><code>{children}</code></pre>;
    case "callout": {
      const kind = safeCalloutKind(node.attrs?.kind);
      return (
        <aside
          aria-label={calloutLabels[kind]}
          className={`my-6 rounded-lg border-l-4 p-4 text-slate-700 ${calloutClasses[kind]}`}
        >
          <p className="mb-2 text-sm font-bold uppercase tracking-wide">
            {calloutLabels[kind]}
          </p>
          {children}
        </aside>
      );
    }
    case "table":
      return (
        <div
          role="region"
          aria-label="Scrollable article table preview"
          tabIndex={0}
          className="my-6 max-w-full overflow-x-auto rounded-lg border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c]"
        >
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <tbody>{children}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr>{children}</tr>;
    case "tableHeader":
      return <th scope="col" className="border-b border-r border-slate-200 bg-slate-100 px-3 py-2 font-semibold">{children}</th>;
    case "tableCell":
      return <td className="border-b border-r border-slate-200 px-3 py-2 align-top">{children}</td>;
    case "image": {
      const src = safeImageSrc(node.attrs?.src);
      if (!src) return null;
      const width = safeImageWidth(node.attrs?.width);
      const align = safeImageAlignment(node.attrs?.align);
      const justifyClass = {
        left: "justify-start",
        center: "justify-center",
        right: "justify-end",
      }[align];
      const caption = safeImageCaption(node.attrs?.caption);
      return (
        <figure className={`my-6 flex flex-col ${justifyClass}`}>
          <Image
            unoptimized
            src={src}
            alt={typeof node.attrs?.alt === "string" ? node.attrs.alt : ""}
            width={1200}
            height={800}
            className="max-h-[36rem] w-full rounded-xl object-contain"
            style={width ? { maxWidth: `${width}px` } : { maxWidth: "100%" }}
          />
          {caption && <figcaption className="mt-2 text-center text-sm text-slate-500">{caption}</figcaption>}
        </figure>
      );
    }
    default:
      return children;
  }
}

function PreviewAdStripe() {
  return (
    <aside
      aria-label="Advertisement placement preview"
      className="my-10 flex min-h-24 items-center justify-center rounded-xl border border-green-100 bg-gradient-to-r from-[#027a49] via-[#02a95c] to-[#608a89] px-5 py-5 text-center text-white shadow-sm sm:my-12 sm:min-h-28 sm:px-8"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em]">Advertisement</p>
        <p className="mt-2 text-sm font-medium text-white/90">
          Reserved placement - preview only
        </p>
      </div>
    </aside>
  );
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
                Preview as it will appear on ChronicleFiles
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
                  alt={title}
                  className="object-cover"
                />
              </div>
            )}
            <div className="my-8 border-t border-slate-200" />
            <div className="[&_a]:break-words">
              {blocks.map((block, index) => {
                const key = `preview-${index}`;
                const content = (() => {
                  if (block.type === "richText") {
                    return (
                      <PreviewNode
                        node={block.content as JSONContent}
                        nodeKey={key}
                      />
                    );
                  }
                  if (block.type === "embed") {
                    return <PostEmbedRenderer embed={block} />;
                  }
                  if (block.type === "image") {
                    const src = safeImageSrc(block.url);
                    return src ? (
                      <figure className="my-6">
                        <Image
                          unoptimized
                          src={src}
                          alt={block.alt ?? ""}
                          width={1200}
                          height={800}
                          className="mx-auto max-h-[36rem] w-full rounded-xl object-contain"
                        />
                      </figure>
                    ) : null;
                  }
                  if (block.type === "heading2") {
                    return (
                      <h2 className="mb-4 mt-8 font-serif text-2xl font-bold text-slate-900">
                        {block.text}
                      </h2>
                    );
                  }
                  if (block.type === "heading3") {
                    return (
                      <h3 className="mb-3 mt-6 font-serif text-xl font-bold text-slate-900">
                        {block.text}
                      </h3>
                    );
                  }
                  if (block.type === "quote") {
                    return (
                      <blockquote className="my-6 border-l-4 border-[#02a95c] bg-green-50 px-5 py-4 italic text-slate-700">
                        {block.text}
                      </blockquote>
                    );
                  }
                  if (block.type === "bullet" || block.type === "numbered") {
                    const List = block.type === "bullet" ? "ul" : "ol";
                    return (
                      <List
                        className={`mb-5 ml-6 space-y-2 text-slate-700 ${
                          block.type === "bullet" ? "list-disc" : "list-decimal"
                        }`}
                      >
                        {block.text
                          .split(/\r?\n/)
                          .filter((line) => line.trim())
                          .map((line, itemIndex) => (
                            <li key={`${key}-${itemIndex}`}>{line}</li>
                          ))}
                      </List>
                    );
                  }
                  if (block.type === "link") {
                    const href = safeHref(block.url);
                    return href ? (
                      <p className="my-5 text-base leading-8">
                        <a
                          href={href}
                          rel="noreferrer"
                          className="text-[#02a95c] underline underline-offset-2"
                        >
                          {block.text}
                        </a>
                      </p>
                    ) : null;
                  }
                  return <hr className="my-8 border-slate-200" />;
                })();

                return (
                  <Fragment key={key}>
                    {content}
                    {(index + 1) % 4 === 0 && index < blocks.length - 1 && (
                      <PreviewAdStripe />
                    )}
                  </Fragment>
                );
              })}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
