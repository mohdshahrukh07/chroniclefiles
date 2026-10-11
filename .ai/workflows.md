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

## Notes about content ordering

The project currently treats the single ordered content array as the canonical pattern for content flow across create, save, edit, and preview. This is the main architectural requirement for preserving insertion order and avoiding duplicate state.
