# Flexible Article Content and Ordering

## Goal

Allow authors to compose articles from any sequence of the existing independent content fields and reorder them without losing content or formatting.

## Requirements

- Keep the existing `Post.content` array as the canonical source of order.
- Preserve arbitrary valid combinations and repeated content types; do not impose heading/image/text groups.
- Each editor component has a stable optional string ID. Older records without IDs remain readable and gain IDs when opened; the next save persists them.
- Support mouse/touch drag handles, visible drop indicators, active-item highlighting, and keyboard-accessible Move Up/Move Down actions.
- Reordering changes only array position. Rich-text JSON, image/video/embed data, captions, and other component values stay intact.
- Create, edit, save, preview, and public rendering consume the same ordered array; do not sort or regroup by type.
- Keep ads out of the editor content model. Render public ads independently through the existing `AdSlot`.

## Ad placement

- Preserve the existing optional post-hero and sidebar placements.
- Consider at most one additional inline placement after a rich-text item with at least 350 words of paragraph/list text, only when followed by another rich-text block, a heading, or a horizontal rule.
- Skip if the candidate is last or the next component does not mark a clear section boundary (including images, embeds/videos, quotes, and lists).
- Disabled or unconfigured `AdSlot` returns no element and therefore creates no empty spacing.

## Backward compatibility and data

- `Post.content` remains `Schema.Types.Mixed`; there is no schema migration or new collection.
- Existing array order and legacy Tiptap JSON are unchanged.
- Legacy entries without IDs use deterministic editor IDs until saved; legacy separate `videos` data remains a fallback whose original position may be unknown.

## Acceptance criteria

- Reorder different types and repeated types, then confirm component IDs, content payloads, and new order remain intact in the editor and preview.
- Move Up/Down controls work by keyboard; drag handle works with mouse and touch sensor.
- Add/remove operations do not duplicate IDs or change other items.
- Public content order matches saved array order; ads do not appear after every block.
- No empty ad gap appears when ads are disabled, unconfigured, or no suitable boundary exists.
