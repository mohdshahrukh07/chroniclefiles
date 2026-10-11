# Architecture

## Frontend

### App Router overall structure

The app uses Next.js App Router with route groups and server-generated pages under `app/`.

Key routes:
- `/` – redirects to `/blog`
- `/blog` – public published-post listing
- `/category/[slug]` – public published posts in a category
- `/post/[slug]` – public published post detail
- `/admin-dashboard` – login or dashboard shell depending on session
- `/admin-dashboard/analytics` – protected analytics dashboard
- `/api/analytics/events` – validated anonymous analytics event endpoint
- `/admin-dashboard/posts` – protected list of posts
- `/admin-dashboard/posts/new` – create post form
- `/admin-dashboard/posts/[id]/edit` – edit post form

### Shared UI system

The UI is built around the ChronicleFiles design palette and admin-style cards, input fields, sidebar navigation, and tables.

Main admin UI files:
- components/admin-dashboard/admin-dashboard.tsx
- components/admin-dashboard/admin-navigation.tsx
- components/admin-dashboard/admin-header.tsx
- components/admin-dashboard/dashboard-components.tsx
- components/admin-posts/post-editor-form.tsx
- components/admin-posts/post-preview.tsx
- components/ui/button.tsx

### Create Post / Edit Post form architecture

The create/edit post flow is a single client component: `PostEditorForm`.

Responsibilities:
- field state for title, slug, excerpt, category, tags, status, SEO
- ordered content block state
- insertion and deletion of content blocks
- rich text editing through Tiptap
- embed field creation and validation
- thumbnail upload state
- preview modal state
- save draft / publish dispatch to server actions

The form keeps a content-block array rather than splitting content and embed state into unrelated arrays.

### Preview architecture

Preview is rendered from `PostPreview` and receives a `blocks` array. It maps blocks in order and renders each block by `type`.

Important point:
- preview should use the same ordered content array as the editor
- embed blocks should not be collected separately and appended at the end

### Public post pages

The public reader surfaces currently include the blog listing, category listing, and article detail routes. Database reads are server-side and restrict content to published posts whose `publishedAt` is not in the future. These routes are instrumented with the client `PublicAnalyticsTracker`; the root route redirects to `/blog`.

## Backend

### Server actions and validation

The main server-side logic lives in `app/admin-dashboard/posts/new/actions.ts`.

This action layer is responsible for:
- admin session enforcement
- type validation for incoming form data
- slug/title validation
- excerpt and category validation
- content sanitization and normalization
- embed validation and max-2 check
- Cloudinary media verification
- Mongoose write operation for create/update
- revalidation of dashboard and posts paths

### Database access

Database access is centralized in `lib/mongodb.ts` using a cached Mongoose connection singleton.

This avoids creating a new database connection on each request.

### Authentication

Admin authentication is custom and not based on a third-party auth package.

Flow:
- user submits login form
- password is checked against stored scrypt hash in `models/user.ts`
- a signed session cookie is created using `createAdminSession()`
- protected pages check `getAdminSession()`

### Analytics

The anonymous event route is `app/api/analytics/events/route.ts`. It validates a bounded batch of page-view, active-time, and allowlisted-click events, honors Do Not Track and Global Privacy Control, resolves the target slug against a currently public post, and uses a process-local rate limit. It reads trusted proxy country headers only; it does not store request IP addresses or raw User-Agent strings.

`lib/analytics-events.ts` creates an opaque first-party HttpOnly visitor cookie and persists only a hash. Page views and engagement events are deduplicated by generated event IDs. Event records and corresponding daily totals are written transactionally to analytics-only collections. This requires a MongoDB deployment supporting transactions (normally a replica set).

`lib/analytics-dashboard.ts` queries daily aggregates and groups unique visitors for the selected date range. The dashboard does not fetch all raw events. Active reading time is an estimate: the tracker counts visible time only while recent user activity is present.

## Data flow

### Create Post flow

Create Post
↓
Form state (`PostEditorForm`)
↓
Ordered `content[]` block state
↓
Validation and normalization (`lib/post-content.ts`, `lib/post-embeds.ts`)
↓
Server action (`app/admin-dashboard/posts/new/actions.ts`)
↓
MongoDB save (`models/post.ts`)

### Edit Post flow

MongoDB
↓
Edit page loads post document
↓
`normalizePostContent()` converts legacy content to active structure
↓
`PostEditorForm` initializes block state
↓
Editor and preview use ordered content structure

### Media flow

Admin
↓
Cloudinary upload button / upload function
↓
Cloudinary storage
↓
URL returned to client
↓
metadata recorded in MongoDB Media collection
↓
post content references Cloudinary URL in content or thumbnail fields

The actual Cloudinary API upload is done client-side via unsigned preset, and the stored database record is only metadata plus URL reference, not the raw media object itself.

### Public analytics flow

Published public page
↓
`PublicAnalyticsTracker` generates deduplicated page-view and engagement event IDs
↓
`POST /api/analytics/events` validates and applies privacy/rate checks
↓
analytics event, visitor, and daily aggregate collections
↓
protected analytics page aggregates the selected date range

## Model responsibilities

### User model

- username
- passwordHash
- role
- timestamps

### Category model

- name
- slug
- description
- timestamps

### Media model

- filename
- url
- alt
- mimeType
- size
- uploadedBy
- timestamps

### Post model

- title
- slug
- excerpt
- thumbnail
- content
- category
- tags
- status
- seo
- publishedAt
- timestamps

## Current architectural pattern

The project is intentionally incremental and minimal. The current implementation favors:
- App Router server pages
- client interaction only where necessary
- shared admin layout and reusable data forms
- canonical ordered content array for article blocks
- MongoDB model simplicity without introducing a separate video collection or embed collection

The architecture is designed to remain flexible for future expansion without a broad rewrite.
