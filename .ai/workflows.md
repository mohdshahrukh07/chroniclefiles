# Workflows

This file documents the key workflows in the current ChronicleFiles implementation.

## Admin Login

Flow:

Login
→ form collects username and password
→ `loginAction` validates the request
→ checks user record in MongoDB
→ verifies password hash with `User.verifyPassword()`
→ creates signed session cookie via `createAdminSession()`
→ redirects to `/admin-dashboard`

Relevant files:
- app/admin-dashboard/actions.ts
- lib/admin-session.ts
- models/user.ts

## Create Post

Flow:

Create Post
→ Basic Information
→ Content blocks
→ Category and Tags
→ SEO metadata
→ Save Draft / Publish

The create form is implemented in `PostEditorForm` and is used for both create and edit flows.

Relevant files:
- components/admin-posts/post-editor-form.tsx
- app/admin-dashboard/posts/new/page.tsx

## Dynamic Content

Add Content menu behavior:

- the UI provides an external `+ Add Content` control outside the first rich-text block
- each selection appends a content block at the current collection position in the main ordered list
- block types include rich text, image, embed, H2/H3, bullet list, numbered list, quote, link, and horizontal rule
- the list is preserved as an ordered array rather than separate video or embed arrays

Important rule from current implementation:
- the widely used `content` array is the actual source of truth for ordering

Relevant files:
- components/admin-posts/post-editor-form.tsx
- lib/post-content.ts

## Save Draft

The actual flow is:

form state
↓
validateBeforeSave("draft")
↓
normalize and serialize content
↓
createPostAction() or updatePostAction()
↓
server validation and DB write
↓
redirect to `/admin-dashboard/posts?notice=...`

Important behavior:
- draft saves use `status: "draft"`
- save success shows a confirmation message
- user is redirected away from the form after success
- failure stays on page and shows request errors

Relevant files:
- components/admin-posts/post-editor-form.tsx
- app/admin-dashboard/posts/new/actions.ts

## Publish

The actual flow is:

form state
↓
validateBeforeSave("published")
↓
check required content/category/excerpt
↓
server action persists `status: "published"`
↓
sets `publishedAt` on published save
↓
redirect back to admin posts list

Relevant files:
- app/admin-dashboard/posts/new/actions.ts
- components/admin-posts/post-editor-form.tsx

## Edit

Edit workflow:

Post document from MongoDB
↓
`normalizePostContent()` applied on load
↓
`PostEditorForm` initializes block state
↓
user updates blocks
↓
update action persists ordered content back to database

Relevant files:
- app/admin-dashboard/posts/[id]/edit/page.tsx
- lib/post-content.ts
- components/admin-posts/post-editor-form.tsx

## Preview

Preview behavior:

Editor state
↓
ordered `blocks` array
↓
`PostPreview` renders each item by block type
↓
rendered preview modal shows article structure in the same order as the editor

Important rule:
- preview does not split content into `content` + `videos` + `embeds` append behavior; it relies on the same input order as the editor

Relevant files:
- components/admin-posts/post-preview.tsx

## Media workflow

Cloudinary upload flow:

admin chooses file
→ upload button calls `uploadToCloudinary()`
→ Cloudinary unsigned upload request is sent
→ URL is returned to the app
→ metadata is recorded in the Media collection
→ URL is used in content or thumbnail fields

Relevant files:
- components/admin-posts/cloudinary-upload.ts
- components/admin-posts/cloudinary-upload-button.tsx
- app/admin-dashboard/posts/new/actions.ts
- models/media.ts

## Public analytics workflow

Public route
→ `PublicAnalyticsTracker` creates a UUID page-view event
→ same-origin API validates the route/event, privacy signals, and rate limit
→ server resolves the slug to a currently public post/category
→ MongoDB transaction inserts the unique PageView, updates the daily anonymous visitor row when needed, and increments site/page aggregates

During the visible page session, the tracker periodically submits active seconds and allowlisted click names. On page exit/hidden state it sends a final engagement event. The server verifies that the event references the matching PageView and atomically inserts the event, updates engagement state, and increments daily counters.

`AnalyticsDaily` is the dashboard query source; raw `PageView` and `EngagementEvent` documents are not loaded for dashboard requests. `AnalyticsVisitor` supports distinct visitor counts and optional country breakdowns; a later trusted country header can fill an initially unknown country for that visitor-day. All analytics-specific records have 400-day TTL indexes.

The visitor cookie is random and HttpOnly/SameSite=Lax; only a SHA-256 hash is stored. DNT/GPC disables collection. Raw IP addresses and User-Agent values are not stored; device is classified from the request User-Agent, and country comes only from valid trusted edge headers.

Relevant files:
- components/analytics/public-analytics-tracker.tsx
- app/api/analytics/events/route.ts
- lib/analytics-events.ts
- lib/analytics-dashboard.ts
- app/admin-dashboard/analytics/page.tsx

Operational note: event recording uses MongoDB transactions and therefore needs replica-set support. Rate limiting is currently process-local.

## Public article page workflow

Request `/post/[slug]`
→ server query loads only a published post with no future `publishedAt`
→ ordered `content[]` is normalized and rendered in sequence
→ sidebar queries same-category published recommendations, then recent fallbacks, plus existing categories
→ public analytics tracker retains page-view and engagement behavior

Article metadata uses `seo.metaTitle` / `seo.metaDescription` when present and otherwise uses the post's actual title / excerpt. `SITE_URL` is an explicit HTTPS origin used for canonical URLs and JSON-LD; request hosts are never used as canonical origins. `AdSlot` is a reusable presentation component, disabled unless `ADS_ENABLED` and a syntactically valid `ADSENSE_PUBLISHER_ID` are configured. It does not load scripts or emit fake unit IDs.

## Notes about content ordering

The project currently treats the single ordered content array as the canonical pattern for content flow across create, save, edit, and preview. This is the main architectural requirement for preserving insertion order and avoiding duplicate state.

## Public Category and Latest archives

Request `/blog?page=N` or `/category/[slug]?page=N`
→ parse the page parameter and apply the shared published-status/future-date filter
→ Latest queries across every category; a category archive resolves its Category first and filters by category ObjectId
→ count matching posts and fetch one nine-item page in deterministic publication-date order
→ populate card category labels from existing Category documents
→ render the shared responsive listing, real category navigation, and ordered reusable sidebar

The Latest route is `/blog`; do not create or query a Category named Latest for its archive posts. Pagination uses ordinary internal links and preserves a page-specific canonical URL when `SITE_URL` is configured. `PublicAnalyticsTracker` is keyed by page number so archive pagination creates a new page-view session while sending the unchanged, API-validated route path; card clicks remain explicitly marked and DNT/GPC behavior is unchanged.

Relevant files:
- app/blog/page.tsx
- app/category/[slug]/page.tsx
- lib/public-posts.ts
- components/blog/category-listing-page.tsx
- components/blog/category-post-card.tsx
- components/blog/article-sidebar.tsx

Archive filtering:
- Default `sort=latest` uses descending publication date; `sort=oldest` uses ascending valid dates with undated posts afterward.
- `sort=popular` ranks by recorded per-post page views from AnalyticsDaily, then publication date; data availability follows analytics retention.
- `q` searches eligible titles first. If there are no title matches in scope, it searches eligible post tags. The query remains scoped by category on normal category pages.
- Submitting search/sort resets page to the first page; pager links preserve non-default sort and search state.

## Homepage and Homepage Management

Public request `/`
→ query the singleton `HomepageLayout` and eligible published posts
→ resolve each selected slot and replace unavailable/duplicate selections with distinct recent eligible posts
→ render the saved responsive homepage design and actual Category records
→ show a valid enabled right-column AdSlot instead of the saved right-bottom story, without changing the saved slot
→ track the root page view and explicit article-card clicks using the existing analytics and DNT/GPC behavior

Admin flow:

`/admin-dashboard/homepage`
→ existing admin session guard
→ searchable eligible-post picker for each of the five slots
→ review pending choices on the management screen
→ `PATCH /api/admin/homepage-layout` with only changed slot fields
→ validate IDs/status/publication dates and distinctness
→ update only the requested fields and revalidate `/`

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
