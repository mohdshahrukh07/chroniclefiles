"use client";

import { Extension, Node, mergeAttributes, type JSONContent } from "@tiptap/core";
import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import FontSize from "@tiptap/extension-text-style/font-size";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { TableKit } from "@tiptap/extension-table";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold as BoldIcon,
  Code,
  Heading2 as Heading2Icon,
  Heading3 as Heading3Icon,
  Highlighter,
  ImagePlus,
  Italic as ItalicIcon,
  Link as LinkIcon,
  List as BulletListIcon,
  ListChecks,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table as TableIcon,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CloudinaryUploadButton } from "@/components/admin-posts/cloudinary-upload-button";
import { safeHref, safeImageCaption } from "@/lib/tiptap-content";

const textColors = [
  { value: "#1e293b", label: "Charcoal" },
  { value: "#047857", label: "Green" },
  { value: "#1d4ed8", label: "Blue" },
  { value: "#b91c1c", label: "Red" },
];

const fontSizes = [
  { value: "14px", label: "Small" },
  { value: "16px", label: "Normal" },
  { value: "18px", label: "Large" },
  { value: "24px", label: "Extra large" },
];

const imageWidths = [
  { value: "320", label: "Small image" },
  { value: "640", label: "Medium image" },
  { value: "960", label: "Large image" },
  { value: "1200", label: "Full width" },
];

const imageAlignmentValues = ["left", "center", "right"] as const;
type ImageAlignment = (typeof imageAlignmentValues)[number];
const calloutKinds = ["note", "warning", "tip", "important"] as const;
type CalloutKind = (typeof calloutKinds)[number];

function isImageAlignment(value: unknown): value is ImageAlignment {
  return typeof value === "string" && imageAlignmentValues.includes(value as ImageAlignment);
}

function isCalloutKind(value: unknown): value is CalloutKind {
  return typeof value === "string" && calloutKinds.includes(value as CalloutKind);
}

const ImageAlignment = Extension.create({
  name: "imageAlignmentAttributes",
  addGlobalAttributes() {
    return [
      {
        types: ["image"],
        attributes: {
          align: {
            default: "center",
            parseHTML: (element) => {
              const value = element.getAttribute("data-align");
              return isImageAlignment(value) ? value : "center";
            },
            renderHTML: (attributes) => ({
              "data-align": isImageAlignment(attributes.align)
                ? attributes.align
                : "center",
            }),
          },
          caption: {
            default: null,
            parseHTML: (element) =>
              safeImageCaption(element.getAttribute("data-caption")),
            renderHTML: (attributes) => {
              const caption = safeImageCaption(attributes.caption);
              return caption ? { "data-caption": caption } : {};
            },
          },
        },
      },
    ];
  },
});

const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      kind: {
        default: "note",
        parseHTML: (element) => {
          const value = element.getAttribute("data-callout");
          return isCalloutKind(value) ? value : "note";
        },
        renderHTML: (attributes) => ({
          "data-callout": isCalloutKind(attributes.kind)
            ? attributes.kind
            : "note",
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "aside[data-callout]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["aside", mergeAttributes(HTMLAttributes), 0];
  },
});

const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: false,
  }),
  Link.configure({
    autolink: false,
    openOnClick: false,
    HTMLAttributes: { rel: "noreferrer" },
    isAllowedUri: (href) => safeHref(href) !== null,
  }),
  Image.configure({
    inline: false,
    allowBase64: false,
  }),
  ImageAlignment,
  TextStyle,
  Color,
  FontSize,
  Highlight.configure({ multicolor: false }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
    alignments: ["left", "center", "right", "justify"],
  }),
  Superscript,
  Subscript,
  TableKit.configure({ table: { resizable: true } }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Callout,
];

interface PostContentEditorProps {
  initialContent?: JSONContent;
  onChange?: (content: JSONContent) => void;
  onImageUploadingChange?: (uploading: boolean) => void;
  ariaLabel?: string;
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      className="h-11 min-w-11 shrink-0 px-2"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function PostContentEditor({
  initialContent,
  onChange,
  onImageUploadingChange,
  ariaLabel = "Post content",
}: PostContentEditorProps) {
  const onChangeRef = useRef(onChange);
  const onImageUploadingChangeRef = useRef(onImageUploadingChange);
  const linkSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const editorId = useId();
  const [editorMessage, setEditorMessage] = useState("");
  const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
    onImageUploadingChangeRef.current = onImageUploadingChange;
  }, [onChange, onImageUploadingChange]);

  const editor = useEditor({
    extensions: editorExtensions,
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": ariaLabel,
        class: "min-h-72 px-4 py-3 outline-none",
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChangeRef.current?.(updatedEditor.getJSON());
    },
  });

  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      paragraph: currentEditor?.isActive("paragraph") ?? false,
      bold: currentEditor?.isActive("bold") ?? false,
      italic: currentEditor?.isActive("italic") ?? false,
      underline: currentEditor?.isActive("underline") ?? false,
      strike: currentEditor?.isActive("strike") ?? false,
      code: currentEditor?.isActive("code") ?? false,
      heading2: currentEditor?.isActive("heading", { level: 2 }) ?? false,
      heading3: currentEditor?.isActive("heading", { level: 3 }) ?? false,
      bulletList: currentEditor?.isActive("bulletList") ?? false,
      orderedList: currentEditor?.isActive("orderedList") ?? false,
      taskList: currentEditor?.isActive("taskList") ?? false,
      blockquote: currentEditor?.isActive("blockquote") ?? false,
      link: currentEditor?.isActive("link") ?? false,
      highlight: currentEditor?.isActive("highlight") ?? false,
      superscript: currentEditor?.isActive("superscript") ?? false,
      subscript: currentEditor?.isActive("subscript") ?? false,
      table: currentEditor?.isActive("table") ?? false,
      image: currentEditor?.isActive("image") ?? false,
      imageAlign: currentEditor?.getAttributes("image").align,
      imageWidth: currentEditor?.getAttributes("image").width,
      imageAlt: currentEditor?.getAttributes("image").alt ?? "",
      imageCaption: currentEditor?.getAttributes("image").caption ?? "",
      textAlign:
        currentEditor?.getAttributes("paragraph").textAlign ??
        currentEditor?.getAttributes("heading").textAlign ??
        "left",
      textColor: currentEditor?.getAttributes("textStyle").color ?? "",
      fontSize: currentEditor?.getAttributes("textStyle").fontSize ?? "",
      canUndo: currentEditor?.can().undo() ?? false,
      canRedo: currentEditor?.can().redo() ?? false,
    }),
  });

  function openLinkEditor() {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    linkSelectionRef.current = { from, to };
    setLinkUrl(String(editor.getAttributes("link").href ?? ""));
    setEditorMessage("");
    setIsLinkEditorOpen((open) => !open);
  }

  function applyLink() {
    if (!editor) return;
    const href = linkUrl.trim();
    if (!safeHref(href)) {
      setEditorMessage("Use an http, https, mailto, or same-site link.");
      return;
    }
    const chain = editor.chain().focus();
    if (linkSelectionRef.current) {
      chain.setTextSelection(linkSelectionRef.current);
    }
    chain.setLink({ href }).run();
    setEditorMessage("");
    setIsLinkEditorOpen(false);
  }

  return (
    <section
      className="post-content-editor overflow-hidden rounded-xl border border-slate-300 bg-white"
      aria-label="Rich text editor"
    >
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
        <span className="text-xs text-slate-500">Rich Text Editor</span>
        <span className="text-xs text-slate-400">
          Tip: use Tab and Shift+Tab to nest list items.
        </span>
      </div>
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="flex flex-nowrap items-center gap-2 overflow-x-auto border-b border-slate-200 p-2 sm:flex-wrap"
      >
        <div role="group" aria-label="History and blocks" className="flex shrink-0 gap-1">
          <ToolbarButton
            label="Undo"
            disabled={!toolbarState?.canUndo}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2 aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Redo"
            disabled={!toolbarState?.canRedo}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2 aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Paragraph"
            active={toolbarState?.paragraph}
            disabled={!editor}
            onClick={() => editor?.chain().focus().setParagraph().run()}
          >
            <Pilcrow aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Heading 2"
            active={toolbarState?.heading2}
            disabled={!editor}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2Icon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Heading 3"
            active={toolbarState?.heading3}
            disabled={!editor}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3Icon aria-hidden="true" />
          </ToolbarButton>
        </div>

        <div role="group" aria-label="Text styles" className="flex shrink-0 gap-1">
          <ToolbarButton
            label="Bold"
            active={toolbarState?.bold}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <BoldIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={toolbarState?.italic}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            active={toolbarState?.underline}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Strikethrough"
            active={toolbarState?.strike}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          >
            <Strikethrough aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Inline code"
            active={toolbarState?.code}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleCode().run()}
          >
            <Code aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Highlight"
            active={toolbarState?.highlight}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleHighlight().run()}
          >
            <Highlighter aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Superscript"
            active={toolbarState?.superscript}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleSuperscript().run()}
          >
            <SuperscriptIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Subscript"
            active={toolbarState?.subscript}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleSubscript().run()}
          >
            <SubscriptIcon aria-hidden="true" />
          </ToolbarButton>
          <select
            id={`${editorId}-text-color`}
            aria-label="Text color"
            className="h-11 min-w-28 rounded-lg border border-slate-200 bg-white px-2 text-sm"
            value={
              textColors.some((color) => color.value === toolbarState?.textColor)
                ? String(toolbarState?.textColor)
                : ""
            }
            disabled={!editor}
            onChange={(event) => {
              const value = event.target.value;
              if (value) editor?.chain().focus().setColor(value).run();
              else editor?.chain().focus().unsetColor().run();
            }}
          >
            <option value="">Text color</option>
            {textColors.map((color) => (
              <option key={color.value} value={color.value}>
                {color.label}
              </option>
            ))}
          </select>
          <select
            id={`${editorId}-font-size`}
            aria-label="Font size"
            className="h-11 min-w-28 rounded-lg border border-slate-200 bg-white px-2 text-sm"
            value={
              fontSizes.some((size) => size.value === toolbarState?.fontSize)
                ? String(toolbarState?.fontSize)
                : ""
            }
            disabled={!editor}
            onChange={(event) => {
              const value = event.target.value;
              if (value) editor?.chain().focus().setFontSize(value).run();
              else editor?.chain().focus().unsetFontSize().run();
            }}
          >
            <option value="">Font size</option>
            {fontSizes.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>

        <div role="group" aria-label="Text alignment" className="flex shrink-0 gap-1">
          {[
            ["left", "Align left", AlignLeft],
            ["center", "Align center", AlignCenter],
            ["right", "Align right", AlignRight],
            ["justify", "Justify text", AlignJustify],
          ].map(([alignment, label, Icon]) => (
            <ToolbarButton
              key={alignment as string}
              label={label as string}
              active={toolbarState?.textAlign === alignment}
              disabled={!editor}
              onClick={() =>
                editor?.chain().focus().setTextAlign(alignment as string).run()
              }
            >
              <Icon aria-hidden="true" />
            </ToolbarButton>
          ))}
        </div>

        <div role="group" aria-label="Lists and blocks" className="flex shrink-0 gap-1">
          <ToolbarButton
            label="Bullet list"
            active={toolbarState?.bulletList}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <BulletListIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            active={toolbarState?.orderedList}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Task list"
            active={toolbarState?.taskList}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleTaskList().run()}
          >
            <ListChecks aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Blockquote"
            active={toolbarState?.blockquote}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <Quote aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Horizontal rule"
            disabled={!editor}
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          >
            <Minus aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Insert table"
            disabled={!editor}
            onClick={() =>
              editor
                ?.chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            <TableIcon aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Clear formatting"
            disabled={!editor}
            onClick={() =>
              editor?.chain().focus().unsetAllMarks().clearNodes().run()
            }
          >
            <span aria-hidden="true" className="text-xs font-semibold">
              Clear
            </span>
          </ToolbarButton>
        </div>

        {toolbarState?.table && (
          <div role="group" aria-label="Table editing" className="flex shrink-0 gap-1">
            <ToolbarButton
              label="Add row"
              disabled={!editor}
              onClick={() => editor?.chain().focus().addRowAfter().run()}
            >
              + Row
            </ToolbarButton>
            <ToolbarButton
              label="Remove row"
              disabled={!editor}
              onClick={() => editor?.chain().focus().deleteRow().run()}
            >
              - Row
            </ToolbarButton>
            <ToolbarButton
              label="Add column"
              disabled={!editor}
              onClick={() => editor?.chain().focus().addColumnAfter().run()}
            >
              + Column
            </ToolbarButton>
            <ToolbarButton
              label="Remove column"
              disabled={!editor}
              onClick={() => editor?.chain().focus().deleteColumn().run()}
            >
              - Column
            </ToolbarButton>
            <ToolbarButton
              label="Toggle header row"
              disabled={!editor}
              onClick={() => editor?.chain().focus().toggleHeaderRow().run()}
            >
              Header
            </ToolbarButton>
            <ToolbarButton
              label="Delete table"
              disabled={!editor}
              onClick={() => editor?.chain().focus().deleteTable().run()}
            >
              <Trash2 aria-hidden="true" />
            </ToolbarButton>
          </div>
        )}

        <div role="group" aria-label="Links and images" className="flex shrink-0 gap-1">
          <ToolbarButton
            label={toolbarState?.link ? "Edit link" : "Add link"}
            active={toolbarState?.link}
            disabled={!editor}
            onClick={openLinkEditor}
          >
            <LinkIcon aria-hidden="true" />
          </ToolbarButton>
          <CloudinaryUploadButton
            target="postImage"
            onUploadingChange={(uploading) =>
              onImageUploadingChangeRef.current?.(uploading)
            }
            onUploaded={(url) => {
              editor?.chain().focus().setImage({ src: url, alt: "" }).run();
            }}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c] disabled:opacity-50"
          >
            <ImagePlus aria-hidden="true" className="size-4" />
            Add image
          </CloudinaryUploadButton>
          {toolbarState?.image && (
            <>
              <select
                id={`${editorId}-image-width`}
                aria-label="Image width"
                className="h-11 min-w-32 rounded-lg border border-slate-200 bg-white px-2 text-sm"
                value={String(toolbarState.imageWidth ?? "")}
                onChange={(event) =>
                  editor?.commands.updateAttributes("image", {
                    width: event.target.value
                      ? Number(event.target.value)
                      : null,
                  })
                }
              >
                <option value="">Original width</option>
                {imageWidths.map((width) => (
                  <option key={width.value} value={width.value}>
                    {width.label}
                  </option>
                ))}
              </select>
              {imageAlignmentValues.map((alignment) => (
                <ToolbarButton
                  key={alignment}
                  label={`Align image ${alignment}`}
                  active={toolbarState.imageAlign === alignment}
                  disabled={!editor}
                  onClick={() =>
                    editor
                      ?.chain()
                      .focus()
                      .updateAttributes("image", { align: alignment })
                      .run()
                  }
                >
                  {alignment}
                </ToolbarButton>
              ))}
            </>
          )}
        </div>

        <div role="group" aria-label="Callouts" className="flex shrink-0 gap-1">
          {calloutKinds.map((kind) => (
            <ToolbarButton
              key={kind}
              label={`Insert ${kind} callout`}
              disabled={!editor}
              onClick={() =>
                editor
                  ?.chain()
                  .focus()
                  .insertContent({
                    type: "callout",
                    attrs: { kind },
                    content: [{ type: "paragraph" }],
                  })
                  .run()
              }
            >
              {kind}
            </ToolbarButton>
          ))}
        </div>
        {isLinkEditorOpen && (
          <div
            role="group"
            aria-label="Link controls"
            className="flex flex-wrap items-end gap-2 border-b border-slate-200 bg-slate-50 p-3"
          >
            <div className="min-w-48 flex-1">
              <label
                htmlFor={`${editorId}-link-url`}
                className="mb-1 block text-xs font-semibold text-slate-600"
              >
                Link URL
              </label>
              <input
                id={`${editorId}-link-url`}
                type="url"
                value={linkUrl}
                onChange={(event) => {
                  setLinkUrl(event.target.value);
                  setEditorMessage("");
                }}
                placeholder="https://example.com or /article"
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-green-100"
              />
            </div>
            <Button
              type="button"
              className="h-11 bg-[#02a95c] text-white hover:bg-[#029650]"
              onClick={applyLink}
            >
              Apply link
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              disabled={!toolbarState?.link}
              onClick={() => {
                if (!editor) return;
                const chain = editor.chain().focus();
                if (linkSelectionRef.current) {
                  chain.setTextSelection(linkSelectionRef.current);
                }
                chain.unsetLink().run();
                setIsLinkEditorOpen(false);
                setEditorMessage("");
              }}
            >
              Remove link
            </Button>
          </div>
        )}
        {toolbarState?.image && (
          <div
            role="group"
            aria-label="Image description"
            className="flex flex-wrap gap-3 border-b border-slate-200 bg-slate-50 p-3"
          >
            <label className="min-w-48 flex-1 text-xs font-semibold text-slate-600">
              Image alt text
              <input
                type="text"
                value={String(toolbarState.imageAlt ?? "")}
                maxLength={300}
                onChange={(event) =>
                  editor?.commands.updateAttributes("image", {
                    alt: event.target.value,
                  })
                }
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-green-100"
              />
            </label>
            <label className="min-w-48 flex-1 text-xs font-semibold text-slate-600">
              Image caption
              <input
                type="text"
                value={String(toolbarState.imageCaption ?? "")}
                maxLength={300}
                onChange={(event) =>
                  editor?.commands.updateAttributes("image", {
                    caption: event.target.value
                      ? event.target.value.slice(0, 300)
                      : null,
                  })
                }
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-[#02a95c] focus:ring-2 focus:ring-green-100"
              />
            </label>
          </div>
        )}
      </div>
      {editorMessage && (
        <p role="alert" className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          {editorMessage}
        </p>
      )}

      <div className="min-h-72 overflow-x-auto text-base leading-7 [&_.tiptap]:min-h-72 [&_.tiptap]:px-4 [&_.tiptap]:py-3 [&_a]:text-[#02a95c] [&_a]:underline [&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[#02a95c] [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:my-6 [&_h2]:font-serif [&_h2]:text-2xl [&_h3]:my-5 [&_h3]:font-serif [&_h3]:text-xl [&_hr]:my-6 [&_hr]:border-slate-200 [&_img]:my-5 [&_img]:max-h-96 [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_table]:min-w-[32rem] [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2 [&_[data-callout='note']]:my-5 [&_[data-callout='note']]:rounded-lg [&_[data-callout='note']]:border-l-4 [&_[data-callout='note']]:border-blue-500 [&_[data-callout='note']]:bg-blue-50 [&_[data-callout='note']]:p-4 [&_[data-callout='warning']]:my-5 [&_[data-callout='warning']]:rounded-lg [&_[data-callout='warning']]:border-l-4 [&_[data-callout='warning']]:border-amber-500 [&_[data-callout='warning']]:bg-amber-50 [&_[data-callout='warning']]:p-4 [&_[data-callout='tip']]:my-5 [&_[data-callout='tip']]:rounded-lg [&_[data-callout='tip']]:border-l-4 [&_[data-callout='tip']]:border-emerald-500 [&_[data-callout='tip']]:bg-emerald-50 [&_[data-callout='tip']]:p-4 [&_[data-callout='important']]:my-5 [&_[data-callout='important']]:rounded-lg [&_[data-callout='important']]:border-l-4 [&_[data-callout='important']]:border-rose-500 [&_[data-callout='important']]:bg-rose-50 [&_[data-callout='important']]:p-4">
        <EditorContent editor={editor} />
      </div>
    </section>
  );
}
