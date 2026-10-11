import { Fragment, type ReactNode } from "react";
import Image from "next/image";
import type { JSONContent } from "@tiptap/core";
import type { PostContentItem } from "@/models/post";
import { PostEmbedRenderer } from "@/components/post-embed-renderer";
import { AdSlot } from "@/components/blog/ad-slot";

function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

function safeImageSrc(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? value : null;
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
    return <hr key={nodeKey} className="my-8 border-[#e5ebe7]" />;
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
      return <p className="mb-[18px] text-[17px] leading-[1.9] text-[#4b554f]">{children}</p>;
    case "heading": {
      const level = node.attrs?.level;
      if (level === 2) {
        return <h2 className="mb-3 mt-[30px] font-sans text-[27px] font-extrabold leading-[1.3] text-[#28342d] max-[720px]:text-2xl">{children}</h2>;
      }
      if (level === 3) {
        return <h3 className="mb-3 mt-8 font-sans text-2xl font-bold text-[#28342d]">{children}</h3>;
      }
      return <p className="mb-[18px] text-[17px] leading-[1.9] text-[#4b554f]">{children}</p>;
    }
    case "bulletList":
      return <ul className="my-5 ml-6 list-disc space-y-2 text-[#4b554f]">{children}</ul>;
    case "orderedList":
      return <ol className="my-5 ml-6 list-decimal space-y-2 text-[#4b554f]">{children}</ol>;
    case "listItem":
      return <li>{children}</li>;
    case "blockquote":
      return <blockquote className="my-6 border-l-4 border-[#02A95C] bg-[#edf7f1] px-5 py-4 italic text-[#4b554f]">{children}</blockquote>;
    case "image": {
      const src = safeImageSrc(node.attrs?.src);
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
    <div className="mt-[26px] font-sans text-[17px] leading-[1.9] text-[#4b554f] max-[720px]:text-base [&_a]:break-words">
      {blocks.map((block, index) => {
        const key = `article-${index}`;
        const ad = (
          <AdSlot
            format="inline"
            placement={`article-content-block-${index + 1}`}
          />
        );
        if (block.type === "richText") {
          return (
            <Fragment key={key}>
              <RichTextNode
                node={block.content as JSONContent}
                nodeKey={key}
              />
              {ad}
            </Fragment>
          );
        }
        if (block.type === "image") {
          const src = safeImageSrc(block.url);
          return (
            <Fragment key={key}>
              {src && (
                <figure className="my-8">
                  <Image
                    unoptimized
                    src={src}
                    alt={block.alt ?? ""}
                    width={1200}
                    height={800}
                    className="mx-auto max-h-[40rem] w-full rounded-xl object-contain"
                  />
                </figure>
              )}
              {ad}
            </Fragment>
          );
        }
        if (block.type === "embed") {
          return (
            <Fragment key={key}>
              <PostEmbedRenderer embed={block} />
              {ad}
            </Fragment>
          );
        }
        if (block.type === "heading2") {
          return (
            <Fragment key={key}>
              <h2 className="mb-3 mt-[30px] font-sans text-[27px] font-extrabold leading-[1.3] text-[#28342d] max-[720px]:text-2xl">
                {block.text}
              </h2>
              {ad}
            </Fragment>
          );
        }
        if (block.type === "heading3") {
          return (
            <Fragment key={key}>
              <h3 className="mb-3 mt-8 font-sans text-2xl font-bold text-[#28342d]">
                {block.text}
              </h3>
              {ad}
            </Fragment>
          );
        }
        if (block.type === "quote") {
          return (
            <Fragment key={key}>
              <blockquote className="my-6 border-l-4 border-[#02A95C] bg-[#edf7f1] px-5 py-4 italic text-[#4b554f]">
                {block.text}
              </blockquote>
              {ad}
            </Fragment>
          );
        }
        if (block.type === "bullet" || block.type === "numbered") {
          const List = block.type === "bullet" ? "ul" : "ol";
          return (
            <Fragment key={key}>
              <List
                className={`my-5 ml-6 space-y-2 text-[#4b554f] ${
                  block.type === "bullet" ? "list-disc" : "list-decimal"
                }`}
              >
                {block.text.split(/\r?\n/).filter((line) => line.trim()).map((line, lineIndex) => (
                  <li key={`${key}-${lineIndex}`}>{line}</li>
                ))}
              </List>
              {ad}
            </Fragment>
          );
        }
        if (block.type === "link") {
          const href = safeHref(block.url);
          return (
            <Fragment key={key}>
              {href && (
                <p className="my-5 text-[17px] leading-[1.9]">
                  <a
                    href={href}
                    rel="noreferrer"
                    data-analytics-event="article-link"
                    className="text-[#02A95C] underline underline-offset-2"
                  >
                    {block.text}
                  </a>
                </p>
              )}
              {ad}
            </Fragment>
          );
        }
        return (
          <Fragment key={key}>
            <hr className="my-8 border-[#e5ebe7]" />
            {ad}
          </Fragment>
        );
      })}
    </div>
  );
}
