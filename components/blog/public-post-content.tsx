import type { ReactNode } from "react";
import Image from "next/image";
import type { JSONContent } from "@tiptap/core";
import type { PostContentItem } from "@/models/post";
import { PostEmbedRenderer } from "@/components/post-embed-renderer";

function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

function RichTextNode({
  node,
  nodeKey,
}: {
  node: JSONContent;
  nodeKey: string;
}): ReactNode {
  if (node.type === "text") {
    let text: ReactNode = node.text ?? "";
    for (const [index, mark] of (node.marks ?? []).entries()) {
      if (mark.type === "bold") {
        text = <strong key={`${nodeKey}-bold-${index}`}>{text}</strong>;
      }
      if (mark.type === "italic") {
        text = <em key={`${nodeKey}-italic-${index}`}>{text}</em>;
      }
      if (mark.type === "link") {
        const href = safeHref(mark.attrs?.href);
        if (href) {
          text = (
            <a
              key={`${nodeKey}-link-${index}`}
              href={href}
              rel="noreferrer"
              data-analytics-event="article-link"
              className="text-[#02a95c] underline underline-offset-2"
            >
              {text}
            </a>
          );
        }
      }
    }
    return text;
  }

  if (node.type === "hardBreak") return <br key={nodeKey} />;
  if (node.type === "horizontalRule") {
    return <hr key={nodeKey} className="my-8 border-slate-200" />;
  }
  const children = (node.content ?? []).map((child, index) => (
    <RichTextNode
      key={`${nodeKey}-${index}`}
      node={child}
      nodeKey={`${nodeKey}-${index}`}
    />
  ));

  switch (node.type) {
    case "doc":
      return <>{children}</>;
    case "paragraph":
      return <p className="my-5 text-base leading-8 text-slate-700">{children}</p>;
    case "heading": {
      const level = node.attrs?.level;
      if (level === 2) {
        return <h2 className="mb-4 mt-10 font-serif text-3xl font-bold text-slate-900">{children}</h2>;
      }
      if (level === 3) {
        return <h3 className="mb-3 mt-8 font-serif text-2xl font-bold text-slate-900">{children}</h3>;
      }
      return <p className="my-5 text-base leading-8 text-slate-700">{children}</p>;
    }
    case "bulletList":
      return <ul className="my-5 ml-6 list-disc space-y-2 text-slate-700">{children}</ul>;
    case "orderedList":
      return <ol className="my-5 ml-6 list-decimal space-y-2 text-slate-700">{children}</ol>;
    case "listItem":
      return <li>{children}</li>;
    case "blockquote":
      return <blockquote className="my-6 border-l-4 border-[#02a95c] bg-green-50 px-5 py-4 italic text-slate-700">{children}</blockquote>;
    case "image": {
      const src = safeHref(node.attrs?.src);
      if (!src) return null;
      return (
        <figure className="my-8">
          <Image
            unoptimized
            src={src}
            alt={typeof node.attrs?.alt === "string" ? node.attrs.alt : ""}
            width={1200}
            height={800}
            className="mx-auto max-h-[40rem] w-full rounded-xl object-contain"
          />
        </figure>
      );
    }
    default:
      return children;
  }
}

export function PublicPostContent({
  blocks,
}: {
  blocks: PostContentItem[];
}) {
  return (
    <div className="[&_a]:break-words">
      {blocks.map((block, index) => {
        const key = `article-${index}`;
        if (block.type === "richText") {
          return (
            <RichTextNode
              key={key}
              node={block.content as JSONContent}
              nodeKey={key}
            />
          );
        }
        if (block.type === "image") {
          const src = safeHref(block.url);
          return src ? (
            <figure key={key} className="my-8">
              <Image
                unoptimized
                src={src}
                alt={block.alt ?? ""}
                width={1200}
                height={800}
                className="mx-auto max-h-[40rem] w-full rounded-xl object-contain"
              />
            </figure>
          ) : null;
        }
        if (block.type === "embed") {
          return <PostEmbedRenderer key={key} embed={block} />;
        }
        if (block.type === "heading2") {
          return <h2 key={key} className="mb-4 mt-10 font-serif text-3xl font-bold text-slate-900">{block.text}</h2>;
        }
        if (block.type === "heading3") {
          return <h3 key={key} className="mb-3 mt-8 font-serif text-2xl font-bold text-slate-900">{block.text}</h3>;
        }
        if (block.type === "quote") {
          return <blockquote key={key} className="my-6 border-l-4 border-[#02a95c] bg-green-50 px-5 py-4 italic text-slate-700">{block.text}</blockquote>;
        }
        if (block.type === "bullet" || block.type === "numbered") {
          const List = block.type === "bullet" ? "ul" : "ol";
          return (
            <List
              key={key}
              className={`my-5 ml-6 space-y-2 text-slate-700 ${
                block.type === "bullet" ? "list-disc" : "list-decimal"
              }`}
            >
              {block.text.split(/\r?\n/).filter((line) => line.trim()).map((line, lineIndex) => (
                <li key={`${key}-${lineIndex}`}>{line}</li>
              ))}
            </List>
          );
        }
        if (block.type === "link") {
          const href = safeHref(block.url);
          return href ? (
            <p key={key} className="my-5 text-base leading-8">
              <a href={href} rel="noreferrer" data-analytics-event="article-link" className="text-[#02a95c] underline underline-offset-2">
                {block.text}
              </a>
            </p>
          ) : null;
        }
        return <hr key={key} className="my-8 border-slate-200" />;
      })}
    </div>
  );
}
