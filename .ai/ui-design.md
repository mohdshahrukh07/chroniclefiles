# UI Design System

This document describes the ChronicleFiles design as implemented in the current codebase.

## Color theme

The current design uses the following palette:

- Primary green: `#02A95C`
- Muted teal: `#608A89`
- Pale blue-gray: `#E8F2F4`
- White: `#FEFEFE`
- Dark text: `#444444`

These values appear consistently across admin dashboard and post editor components.

## UI principles

The current design aligns with the project goals:
- editorial content focus
- strong readability
- clear admin hierarchy
- clean, low-noise surfaces
- responsive card and form layout
- accessible focus states and contrast handling
- restrained visual styling rather than a generic SaaS demo

## Responsive design requirements

The interface is intended to work across:
- mobile
- tablet
- laptop
- desktop
- large desktop

Implementation patterns in the project include:
- responsive admin sidebar behavior with a mobile nav
- stacked cards on smaller screens and multi-column layouts on larger screens
- form fields that expand to full width on narrow screens
- `min-h-11` touch-friendly buttons and form controls

## Layout and component conventions

### Cards

Cards are used for:
- admin KPI areas
- recent-post containers
- section containers
- settings and content sections

### Buttons

Current button patterns:
- primary green actions for publish and save
- outline actions for secondary flows
- disabled states while pending
- compact actions with touch-sized controls

### Forms

Form UI includes:
- labeled fields
- validation messages
- rounded inputs with strong border emphasis
- helper text for slugs and excerpts
- inline status/error messaging

### Tables

The posts list uses a responsive table/list structure, with horizontal scroll for narrower screens when necessary.

### Navigation

Admin navigation uses:
- left sidebar on large screens
- mobile navigation menu on smaller screens
- active state using green/teal accent colors

### Status badges

There are status badge patterns in the dashboard components for content and lifecycle states.

### Modals

The preview UI is implemented as a full-screen modal-like overlay with a close button and keyboard Escape support.

### Empty states

The posts list includes empty state handling for no records.

### Loading states

The form includes button loading states and upload states for thumbnail and content media flows.

### Error states

The code includes validation messages and request-failure messages relevant to:
- missing required fields
- invalid category
- invalid embed URL
- Cloudinary upload issues
- save failure

### Success states

The form shows success messaging for save draft and publish operations before redirecting back to the posts list.

## Dashboard design

The dashboard uses a standard editorial/admin palette and includes:
- sidebar
- top header with user identity and sign-out
- KPI cards
- quick actions
- recent posts list
- content activity panel

These align strongly with the mock design in `Designs/dashboard.html`.

### Analytics dashboard

The Analytics page reuses the protected dashboard sidebar/mobile navigation, ChronicleFiles green accent, KPI cards, and section cards. It includes a date-range/interval filter, responsive traffic chart, category/device/country breakdowns, click-event summary, and searchable/sortable post table with trend sparklines. Empty and unavailable data are described explicitly rather than replaced with sample values. Browser viewport verification remains pending.

## Create Post design

The Create Post flow follows the structure of `Designs/createPost.html` and preserves the overall visual language:
- large editor section
- metadata and content blocks
- form spacing
- branded green accent color
- modal preview overlay
- content insertion menu with a green `+ Add Content` action

The actual implementation continues to use the existing design direction while also supporting the newer ordered content and embed functionality.

## Public article detail design

`app/post/[slug]/page.tsx` follows `Designs/Blogpage.html`: a responsive reading column, a 300px desktop sidebar, article category/title/excerpt/date/thumbnail, share actions, related story cards, and the ordered category sidebar. The design uses the ChronicleFiles green, teal, pale blue-gray, white, and dark-text palette. Mobile navigation uses the native disclosure element; the article sidebar stacks below the reading column at narrow widths.

## Public homepage

`app/page.tsx` follows `Designs/Homepage.html`: a sticky ChronicleFiles header
with Latest and real Category navigation plus search; the 3-column featured
stories area; responsive horizontal story carousels; a two-column content and
sidebar region; the category strip; and the editorial footer. Cards use the
saved green category labels and dark image gradient, with optimized intrinsic
dimensions and visible keyboard focus. The carousel controls scroll the story
track by one card and preserve touch/trackpad scrolling.

The admin homepage manager reuses the existing responsive admin sidebar,
mobile navigation, and header. Its five focused slot panels show thumbnail,
title, category, select/change/clear actions, and pending save feedback. The
right-bottom panel explicitly communicates its ad-fallback role.

`AdSlot` supports square sidebar and horizontal inline placements. The component renders only after explicit advertising enablement and a valid publisher ID; otherwise it returns no element, so recommendations and categories remain visible without ad gaps.

## Public category and Latest archives

`app/blog/page.tsx` and `app/category/[slug]/page.tsx` share the responsive layout from `Designs/CategoryPage.html`: breadcrumb, title/description, category chips, optional horizontal ad positions, a nine-card 5:4 image grid with a restrained dark text overlay, four-number pagination, and the sidebar. The category navigation initially displays Latest plus at most three real category links; More expands the remaining tags and Less collapses them. Search and sort controls sit with the listing heading and remain full-width on mobile; sort options are Latest, Popular, and Oldest. Pagination remains visible for a single page with disabled previous/next controls. The sidebar order is square ad, Recommended Reads, Explore Categories, square ad. At tablet widths it becomes a two-column sidebar; it stacks on mobile and returns to one column at desktop widths. The Latest chip points to `/blog` and is not a Category record. Cards use the existing ChronicleFiles palette, focus states, and explicit analytics click marker.

## Design reference files

Relevant visual references in the repository:
- Designs/dashboard.html
- Designs/createPost.html
- Designs/Homepage.html

These files should be treated as visual references and not as final source-of-truth logic.

## Important design note

While the project is evolving, the codebase currently prioritizes practical admin workflow and content-block behavior; the public blog, category, and article surfaces now exist, but the complete publication experience remains in progress. The design remains consistent with the project brief and existing design references.
