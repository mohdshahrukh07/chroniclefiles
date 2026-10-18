# Feature Status

This file records the current status of major product and platform features in the ChronicleFiles repo.

## Authentication

Status: Implemented

Current behavior:
- admin login works against the User model
- protected admin routes check a signed session cookie
- sign-out clears the admin session

Relevant files:
- app/admin-dashboard/actions.ts
- lib/admin-session.ts
- app/admin-dashboard/page.tsx
- models/user.ts

Important details:
- custom cookie-based admin auth, not a third-party auth provider

Known limitations:
- no advanced roles or authorization beyond the current admin/editor model
- no public user auth flow yet

## Admin Dashboard

Status: Implemented

Current behavior:
- dashboard shell with sidebar, metrics, quick actions, recent posts, activity
- responsive admin layout

Relevant files:
- components/admin-dashboard/admin-dashboard.tsx
- components/admin-dashboard/admin-navigation.tsx
- components/admin-dashboard/quick-actions.tsx
- components/admin-dashboard/recent-posts.tsx

Important details:
- designed to match the ChronicleFiles admin style

Known limitations:
- many sections are static/mock and not yet connected to live analytics or full business logic

## Posts

Status: Implemented

Current behavior:
- posts can be created, listed, edited, saved as draft, and published
- admin posts page includes filtering and pagination

Relevant files:
- app/admin-dashboard/posts/page.tsx
- app/admin-dashboard/posts/new/actions.ts
- models/post.ts

Important details:
- current content structure is ordered and block-based

Known limitations:
- legacy separate video data may not retain its original position among content blocks

## Public Blog

Status: Implemented in code; production/browser verification remains pending

Current behavior:
- `/blog` is the special Latest archive and lists all eligible published posts across categories, newest first
- `/category/[slug]` resolves a real Category document and lists only its published posts
- both archives use nine-item server pagination, stable ordering, the saved overlay-card design, and real category labels
- archives provide server-side Latest/Popular/Oldest sorting and title-first, tag-fallback search
- the category archive sidebar uses configured square ad slots, published recommendations, and actual Explore Categories records; disabled ads render no reserved space
- paginated archive metadata uses the trusted configured site origin and preserves each page's canonical URL
- `/post/[slug]` renders a published post using the `Designs/Blogpage.html` editorial article layout
- `/` renders the public Home Page using `Designs/Homepage.html` and five saved featured slots
- scheduled/future posts are excluded
- `app/sitemap.ts` dynamically emits the homepage, valid category URLs, and eligible published article URLs using the trusted `SITE_URL`; its data is revalidated after post/category mutations
- `app/robots.ts` preserves open public crawling, excludes admin/API paths, and references the sitemap only when a valid configured site origin exists
- article content blocks, including rich text, images, videos, and supported embeds, render in stored order
- the article sidebar uses real related published posts and Category records
- article metadata, social cards, and conditional BlogPosting JSON-LD use saved post fields and an explicit configured site origin
- post thumbnails use the post title as their alt text on public and admin display surfaces; thumbnail uploads and post saves also store the title in the existing Media `alt` field
- reusable sidebar and inline ad slots are presentation-only and emit no markup or reserved space when ads are disabled/unconfigured
- Google Tag Manager container `GTM-T9LFSR4Z` is loaded globally from the root layout before hydration; its no-script fallback is placed at the start of `<body>`. Individual tags and consent configuration are managed in GTM.

Relevant files:
- app/page.tsx
- app/blog/page.tsx
- app/category/[slug]/page.tsx
- app/post/[slug]/page.tsx
- lib/public-posts.ts
- components/blog/

Known limitations:
- a production HTTPS `SITE_URL` must be configured before canonical links and absolute JSON-LD are emitted
- Popular ordering uses available existing per-post page-view aggregates and is limited by the analytics collections' retention window; it does not fabricate popularity
- sitemap generation requires a valid production HTTPS `SITE_URL`; that deployment value is not configured in the current local environment
- actual AdSense script, approval, publisher configuration, and manual ad-unit IDs (if used) remain future setup

## Homepage and Homepage Management

Status: Implemented in code; authenticated database and ad staging verification pending

Current behavior:
- `/` renders the responsive editorial home page with Featured Stories, Latest Stories, Technology, Education & Learning, Entertainment, recommendations, real category links, and the saved design's footer sections.
- The `HomepageLayout` model stores five selected post IDs in one primary configuration document.
- `/admin-dashboard/homepage` is protected by the existing admin session and allows searching, reviewing, replacing, and clearing each selection before saving.
- `GET` and `PATCH /api/admin/homepage-layout` require an admin session. The PATCH validates eligible published posts, avoids duplicates, and writes only requested fields.
- The signed admin session cookie is scoped to `/` so it is sent to the protected `/api/admin/homepage-layout` endpoint; login clears the legacy `/admin-dashboard` cookie and sign-out expires both variants. Existing sessions issued before this path fix must sign in again once.
- The homepage uses the saved selection when eligible and falls back to distinct recent eligible posts for missing or ineligible slots.
- Homepage carousels are bounded to six popular published posts for Latest Stories and five per real Technology, Education, and Entertainment category. Popularity uses recorded AnalyticsDaily page views; ties and posts without tracked views use publication recency and stable ID ordering. Carousel content is independent of the featured slots, so a featured post may appear again in its category/latest carousel.
- A valid enabled `AdSlot` replaces the right-bottom story visually without clearing its saved fallback. When ads are disabled or invalid, the saved story returns; if neither exists, no right-bottom block is rendered.
- Homepage article clicks use the existing `post-card` tracking marker; root page views use the existing privacy-conscious tracker and `/` is allowlisted by the analytics endpoint.
- The home metadata uses the trusted HTTPS `SITE_URL` for its canonical and Open Graph URLs.

Relevant files:
- `models/homepage-layout.ts`
- `types/homepage.ts`
- `lib/homepage.ts`
- `app/api/admin/homepage-layout/route.ts`
- `app/admin-dashboard/homepage/page.tsx`
- `components/admin-homepage/homepage-management.tsx`
- `components/blog/homepage-page.tsx`
- `components/blog/homepage-carousel.tsx`
- `specs/homepage-management.md`

Known limitations:
- Search loads at most 50 published candidates at a time; a title/tag search can locate older eligible posts.
- Database persistence and ad-priority behavior still require non-production staging verification with an authenticated admin and valid ad configuration.
- `AdSlot` remains a configuration-gated placeholder; no Google AdSense script or invented publisher/unit IDs were added.

## Categories

Status: Implemented

Current behavior:
- categories are seeded and selected during post creation
- category records are used in post form and admin listing

Relevant files:
- models/category.ts
- scripts/seed-categories.mjs
- app/admin-dashboard/posts/new/page.tsx

Important details:
- no separate tag collection exists

## Users

Status: Implemented

Current behavior:
- `User` model exists
- admin login uses this model
- roles include admin/editor

Relevant files:
- models/user.ts

Known limitations:
- user management UI is not yet complete beyond admin authentication

## Media

Status: Implemented

Current behavior:
- Media model stores metadata for uploaded files
- Cloudinary uploads are recorded server-side
- post thumbnail and image content can reference uploaded files

Relevant files:
- models/media.ts
- app/admin-dashboard/posts/new/actions.ts
- components/admin-posts/cloudinary-upload.ts

Known limitations:
- not a general-purpose media library UI yet

## Create Post

Status: Implemented

Current behavior:
- create form supports base metadata, rich text, image and embed blocks, category, tags, meta fields, preview, save, and publish
- save flow is centralized in server action

Relevant files:
- components/admin-posts/post-editor-form.tsx
- app/admin-dashboard/posts/new/page.tsx
- app/admin-dashboard/posts/new/actions.ts

Known limitations:
- live E2E verification still needs a configured environment

## Edit Post

Status: Implemented

Current behavior:
- edit page loads an existing post and initializes the form state
- content is normalized before editor initialization
- update route saves current content back to database

Relevant files:
- app/admin-dashboard/posts/[id]/edit/page.tsx
- components/admin-posts/post-editor-form.tsx

Known limitations:
- exact original ordering for legacy separate `videos` data cannot be reliably reconstructed

## Preview

Status: Implemented

Current behavior:
- preview modal shows title, excerpt, thumbnail, and ordered post content
- preview renders blocks in the same order as editor state

Relevant files:
- components/admin-posts/post-preview.tsx

Known limitations:
- preview is not full public-page rendering and is intentionally admin-focused

## Rich Text Editor

Status: Implemented

Current behavior:
- Tiptap editor supports paragraph, heading 2, heading 3, bold, italic, links, bullet list, ordered list, blockquote, and horizontal rule

Relevant files:
- components/editor/post-content-editor.tsx

Known limitations:
- not a full WYSIWYG doc editor with all advanced publishing features yet

## Dynamic Content Fields

Status: Implemented

Current behavior:
- `+ Add Content` menu adds blocks such as rich text, image, embed, H2/H3, bullet list, numbered list, quote, link, and horizontal rule
- ordering is preserved in the main content array

Relevant files:
- components/admin-posts/post-editor-form.tsx

Known limitations:
- all dynamic block types are still editor-driven and not yet fully generalized to a separate admin schema layer

## Images

Status: Implemented

Current behavior:
- content image and thumbnail uploads can be uploaded through Cloudinary
- image URLs are validated and recorded in the database metadata layer

Relevant files:
- components/admin-posts/cloudinary-upload-button.tsx
- components/admin-posts/cloudinary-upload.ts
- lib/cloudinary.ts

Known limitations:
- requires proper Cloudinary configuration in `.env.local`

## Cloudinary

Status: Implemented

Current behavior:
- unsigned upload preset is used for direct uploads
- uploaded media metadata is recorded in the Media collection
- Cloudinary URL validation occurs before save

Relevant files:
- components/admin-posts/cloudinary-upload.ts
- lib/cloudinary.ts
- app/admin-dashboard/posts/new/actions.ts

Known limitations:
- no production Cloudinary setup is guaranteed in the local environment

## Embeds

Status: Implemented

Current behavior:
- content items can include `embed` blocks for supported platforms
- embed URL validation is enforced before save

Relevant files:
- lib/post-embeds.ts
- components/post-embed-renderer.tsx

Supported platforms in the current code:
- Cloudinary Video
- YouTube
- Instagram
- X / Twitter
- Facebook
- TikTok

Known limitations:
- some export/render patterns may require live verification against real URLs

## YouTube

Status: Implemented

Current behavior:
- YouTube URLs are recognized and normalized to embed IDs
- preview uses iframe embedding

Relevant files:
- lib/post-embeds.ts
- components/post-embed-renderer.tsx

## Instagram

Status: Implemented

Current behavior:
- Instagram post/reel URLs are parsed and embedded via native embed source

Relevant files:
- lib/post-embeds.ts
- components/post-embed-renderer.tsx

## X / Twitter

Status: Implemented

Current behavior:
- tweet URLs are parsed and embedded through the Twitter embed flow

Relevant files:
- lib/post-embeds.ts

## Facebook

Status: Implemented

Current behavior:
- supported Facebook post/video URL patterns are recognized and embedded using a plugin URL

Relevant files:
- lib/post-embeds.ts

## TikTok

Status: Implemented

Current behavior:
- TikTok video URLs are recognized and embedded via the TikTok embed pipeline

Relevant files:
- lib/post-embeds.ts

## SEO

Status: Partially implemented; article detail metadata is implemented

Current behavior:
- posts support `seo.metaTitle` and `seo.metaDescription`
- create/edit forms include SEO fields
- save action stores these values
- `/post/[slug]` generates title, description, Open Graph and Twitter metadata from saved SEO fields with post title/excerpt fallbacks
- canonical links and BlogPosting JSON-LD are emitted only when a valid HTTPS `SITE_URL` and valid publication date are available

Relevant files:
- models/post.ts
- components/admin-posts/post-editor-form.tsx
- app/admin-dashboard/posts/new/actions.ts
- app/post/[slug]/page.tsx
- lib/public-site-config.ts

Known limitations:
- the verified production domain is not present in repository configuration; set `SITE_URL` to the production HTTPS origin

## Post Analytics

Status: Implemented in code; end-to-end database and browser verification remains pending

Current behavior:
- public pages send deduplicated page-view events, active-reading-time checkpoints, and explicitly marked clicks
- the endpoint honors DNT/GPC, validates bounded JSON events, checks published route targets, and rate-limits by hashed anonymous visitor token in process memory
- daily aggregates support overview, date-range traffic, category, device, country, click-event, and post performance views
- the protected `/admin-dashboard/analytics` page provides date filters, interval grouping, KPI cards, a traffic chart, breakdowns, and searchable/sortable post performance
- country and unknown-device data are presented as unavailable when unavailable; historical data is not fabricated

Metric definitions:
- page views: accepted page-view event IDs (same-ID retries count once)
- unique visitors: distinct pseudonymous visitor hashes in the selected range
- engagement time: active visible seconds counted only while recent activity exists
- average read time: active seconds from completed sessions divided by completed sessions
- clicks: explicitly marked public actions, not page views
- engagement rate: page views with at least 10 seconds of session time or a marked click, divided by page views

Relevant files:
- components/analytics/public-analytics-tracker.tsx
- app/api/analytics/events/route.ts
- lib/analytics-events.ts
- lib/analytics-dashboard.ts
- components/admin-analytics/analytics-dashboard.tsx
- models/page-view.ts
- models/engagement-event.ts
- models/analytics-visitor.ts
- models/analytics-daily.ts
- specs/post-analytics.md

Known limitations:
- active time is a browser-side estimate and may undercount passive reading
- country requires trusted Vercel/Cloudflare country headers
- the in-memory rate limit is per app process, not distributed
- event writes require MongoDB transaction support
- page-view, click, active-time persistence, date-filter aggregation, authenticated dashboard, and responsive browser flows still need staging verification; current DB target was not confirmed as staging and local browser was unauthenticated
- Apply Range's uncontrolled-field warning is fixed by using controlled state and change handlers for both dates and interval

## Responsive UI

Status: Implemented

Current behavior:
- admin interface is designed to be responsive across mobile, tablet, laptop, and desktop
- mobile navigation and responsive card layouts are present

Relevant files:
- components/admin-dashboard/mobile-admin-navigation.tsx
- components/admin-posts/post-editor-form.tsx

Known limitations:
- live visual verification is still needed in a real browser environment

## Planned / Not Implemented

The following are not yet fully implemented as part of the current codebase:
- search page
- newsletter features
- comments
- author profile pages
- final editorial design system across public site
