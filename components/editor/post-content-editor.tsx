"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { JSONContent } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold as BoldIcon,
  Heading2 as Heading2Icon,
  Heading3 as Heading3Icon,
  Italic as ItalicIcon,
  Link as LinkIcon,
  List as BulletListIcon,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: false,
    code: false,
    codeBlock: false,
    strike: false,
    underline: false,
  }),
  Link.configure({
    autolink: false,
    openOnClick: false,
  }),
  Image.configure({
    inline: false,
    allowBase64: false,
  }),
];

interface PostContentEditorProps {
  initialContent?: JSONContent;
  onChange?: (content: JSONContent) => void;
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
      className="h-11 w-11 px-0"
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
  ariaLabel = "Post content",
}: PostContentEditorProps) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
      heading2: currentEditor?.isActive("heading", { level: 2 }) ?? false,
      heading3: currentEditor?.isActive("heading", { level: 3 }) ?? false,
      bulletList: currentEditor?.isActive("bulletList") ?? false,
      orderedList: currentEditor?.isActive("orderedList") ?? false,
      blockquote: currentEditor?.isActive("blockquote") ?? false,
      link: currentEditor?.isActive("link") ?? false,
    }),
  });

  function setLink() {
    if (!editor) return;

    const currentHref = String(editor.getAttributes("link").href ?? "");
    const href = window.prompt("Enter a link URL", currentHref);
    if (href === null) return;

    const trimmedHref = href.trim();
    if (!trimmedHref) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().setLink({ href: trimmedHref }).run();
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-300 bg-white" aria-label="Rich text editor">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-2">
        <span className="px-2 text-xs text-slate-500">
          Rich Text Editor
        </span>
      </div>
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="flex flex-wrap items-center gap-1 border-b border-slate-200 p-2"
      >
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
          label="Bullet list"
          active={toolbarState?.bulletList}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <BulletListIcon aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Ordered list"
          active={toolbarState?.orderedList}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered aria-hidden="true" />
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
          label={toolbarState?.link ? "Edit link" : "Add link"}
          active={toolbarState?.link}
          disabled={!editor}
          onClick={setLink}
        >
          <LinkIcon aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Horizontal rule"
          disabled={!editor}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        >
          <Minus aria-hidden="true" />
        </ToolbarButton>
      </div>

      <div className="min-h-72 text-base leading-7 [&_.tiptap]:min-h-72 [&_.tiptap]:px-4 [&_.tiptap]:py-3 [&_a]:text-[#02a95c] [&_a]:underline [&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[#02a95c] [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:my-6 [&_h2]:font-serif [&_h2]:text-2xl [&_h3]:my-5 [&_h3]:font-serif [&_h3]:text-xl [&_hr]:my-6 [&_hr]:border-slate-200 [&_img]:my-5 [&_img]:max-h-96 [&_img]:rounded-lg [&_img]:object-contain [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6">
        <EditorContent editor={editor} />
      </div>
    </section>
  );
}
