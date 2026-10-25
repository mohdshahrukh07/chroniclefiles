import { Fragment, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import type { JSONContent } from "@tiptap/core";
import type { PostContentItem } from "@/models/post";
import { PostEmbedRenderer } from "@/components/post-embed-renderer";
import { AdSlot } from "@/components/blog/ad-slot";
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
      if (mark.type === "underline") {
        text = <u key={`${nodeKey}-underline-${index}`}>{text}</u>;
      }
      if (mark.type === "strike") {
        text = <s key={`${nodeKey}-strike-${index}`}>{text}</s>;
      }
      if (mark.type === "code") {
        text = (
          <code
            key={`${nodeKey}-code-${index}`}
            className="rounded bg-[#f0f2f1] px-1.5 py-0.5 font-mono text-[0.9em]"
          >
            {text}
          </code>
        );
      }
      if (mark.type === "superscript") {
        text = <sup key={`${nodeKey}-sup-${index}`}>{text}</sup>;
      }
      if (mark.type === "subscript") {
        text = <sub key={`${nodeKey}-sub-${index}`}>{text}</sub>;
      }
      if (mark.type === "highlight") {
        text = (
          <mark
            key={`${nodeKey}-highlight-${index}`}
            className="rounded bg-amber-200 px-0.5 text-inherit"
          >
            {text}
          </mark>
        );
      }
      if (mark.type === "textStyle") {
        const style: CSSProperties = {};
        const color = safeTextColor(mark.attrs?.color);
        const fontSize = safeFontSize(mark.attrs?.fontSize);
        if (color) style.color = color;
        if (fontSize) style.fontSize = fontSize;
        if (Object.keys(style).length) {
          text = (
            <span key={`${nodeKey}-style-${index}`} style={style}>
              {text}
            </span>
          );
        }
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
    case "paragraph": {
      const textAlign = safeTextAlignment(node.attrs?.textAlign);
      return (
        <p
          className="mb-[18px] text-[17px] leading-[1.9] text-[#4b554f]"
          style={textAlign ? { textAlign } : undefined}
        >
          {children}
        </p>
      );
    }
    case "heading": {
      const level = node.attrs?.level;
      const textAlign = safeTextAlignment(node.attrs?.textAlign);
      if (level === 2) {
        return <h2 className="mb-3 mt-[30px] font-sans text-[27px] font-extrabold leading-[1.3] text-[#28342d] max-[720px]:text-2xl" style={textAlign ? { textAlign } : undefined}>{children}</h2>;
      }
      if (level === 3) {
        return <h3 className="mb-3 mt-8 font-sans text-2xl font-bold text-[#28342d]" style={textAlign ? { textAlign } : undefined}>{children}</h3>;
      }
      return <p className="mb-[18px] text-[17px] leading-[1.9] text-[#4b554f]">{children}</p>;
    }
    case "bulletList":
      return <ul className="my-5 ml-6 list-disc space-y-2 text-[#4b554f]">{children}</ul>;
    case "orderedList":
      return <ol start={typeof node.attrs?.start === "number" && node.attrs.start > 0 ? node.attrs.start : undefined} className="my-5 ml-6 list-decimal space-y-2 text-[#4b554f]">{children}</ol>;
    case "listItem":
      return <li>{children}</li>;
    case "taskList":
      return <ul className="my-5 list-none space-y-2 pl-0 text-[#4b554f]">{children}</ul>;
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
      return <blockquote className="my-6 border-l-4 border-[#02A95C] bg-[#edf7f1] px-5 py-4 italic text-[#4b554f]">{children}</blockquote>;
    case "codeBlock":
      return <pre className="my-5 overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100"><code>{children}</code></pre>;
    case "callout": {
      const kind = safeCalloutKind(node.attrs?.kind);
      return (
        <aside
          aria-label={calloutLabels[kind]}
          className={`my-6 rounded-lg border-l-4 p-4 text-[#34413a] ${calloutClasses[kind]}`}
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
          aria-label="Scrollable article table"
          tabIndex={0}
          className="my-6 max-w-full overflow-x-auto rounded-lg border border-[#dce3de] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c]"
        >
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <tbody>{children}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr>{children}</tr>;
    case "tableHeader":
      return <th scope="col" className="border-b border-r border-[#dce3de] bg-[#f3f6f4] px-3 py-2 font-semibold text-[#28342d]">{children}</th>;
    case "tableCell":
      return <td className="border-b border-r border-[#e5ebe7] px-3 py-2 align-top">{children}</td>;
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
        <figure className={`my-8 flex flex-col ${justifyClass}`}>
          <Image
            unoptimized
            src={src}
            alt={typeof node.attrs?.alt === "string" ? node.attrs.alt : ""}
            width={1200}
            height={800}
            className="max-h-[40rem] w-full rounded-xl object-contain"
            style={width ? { maxWidth: `${width}px` } : { maxWidth: "100%" }}
          />
          {caption && <figcaption className="mt-2 text-center text-sm text-[#66736b]">{caption}</figcaption>}
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
