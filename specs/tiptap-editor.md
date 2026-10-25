# Tiptap Rich-text Editor

## Problem and goal

Give ChronicleFiles authors a useful free rich-text editing experience while retaining the existing Tiptap JSON format, ordered post content, Cloudinary upload flow, and public article design.

## Requirements

- Keep content as Tiptap JSON in the existing post content structure; do not add a schema migration.
- Provide text formatting, alignment, headings, paragraphs, quotes, horizontal rules, nested/task lists, tables, and editable Note/Warning/Tip/Important callouts.
- Support safe link creation/edit/removal and Cloudinary inline images with accessible alt text, captions, width, and alignment.
- Keep editor extensions, shared content validation, admin preview, and public rendering aligned.
- Preserve legacy posts and stored content order; filter unsafe URLs and unrecognized custom attributes on render.
- Prefer compatible official free extensions and avoid paid Pro and unnecessary community packages.

## Acceptance criteria

- Existing content loads and serializes without destructive transformation.
- Authors can apply and remove a link on selected text; unsafe schemes are rejected.
- New marks and nodes render in both preview and public article content.
- Tables remain horizontally scrollable on narrow screens; editor toolbar remains usable without page-level horizontal overflow.
- Cloudinary inline image uploads use the existing upload/media flow and preserve image order.

## Exclusions

- No Post schema changes, data migration, advertising changes, or replacement of the current editor.
- Paid Tiptap features, drag-resize, arbitrary HTML, and script-capable embeds are out of scope.

## Verification notes

Browser smoke tests cover formatting, callouts, table editing, task lists, image attributes, safe link application/rejection/removal, and public rendering. Database save/edit/publish and live Cloudinary upload must be validated against an approved staging environment.
