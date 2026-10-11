# Architectural Decisions

## Decision: Next.js App Router

Date:
- Current codebase state

Decision:
- The application uses the Next.js App Router rather than the Pages Router.

Reason:
- the project structure and route files under `app/` reflect server-rendered route pages and server actions.

Alternatives considered:
- Pages Router
- custom routing layer

Current implementation:
- pages and server actions are placed under `app/` with server components and route params.

## Decision: MongoDB with Mongoose

Date:
- Current codebase state

Decision:
- MongoDB is the database and Mongoose is used for schema and query management.

Reason:
- the repository includes a cached MongoDB connection and explicit Mongoose models for the project entities.

Alternatives considered:
- SQL database
- Prisma
- direct driver-only queries

Current implementation:
- `lib/mongodb.ts`, `models/*.ts`

## Decision: Tiptap for editor content

Date:
- Current codebase state

Decision:
- Tiptap is used for rich text editing in the admin post editor.

Reason:
- the code integrates `@tiptap/react`, StarterKit, Link, and Image extensions and stores JSON content.

Alternatives considered:
- simple textarea editor
- Draft.js or a custom rich text system

Current implementation:
- `components/editor/post-content-editor.tsx`

## Decision: Cloudinary for media uploads

Date:
- Current codebase state

Decision:
- Cloudinary handles uploaded media, while the app stores metadata in the database.

Reason:
- Cloudinary upload integration and direct file uploads are present in the codebase.

Alternatives considered:
- local file storage
- direct S3 integration

Current implementation:
- `components/admin-posts/cloudinary-upload.ts`
- `lib/cloudinary.ts`
- `models/media.ts`

## Decision: custom admin session authentication

Date:
- Current codebase state

Decision:
- the project uses a custom signed cookie-based admin session model instead of a third-party auth framework.

Reason:
- `lib/admin-session.ts` handles creation, validation, and deletion of the admin session cookie.

Alternatives considered:
- NextAuth
- JWT storage in localStorage
- custom server session DB

Current implementation:
- `lib/admin-session.ts`
- `app/admin-dashboard/actions.ts`

## Decision: no separate tags collection

Date:
- Current codebase state

Decision:
- tags remain a simple array on the Post document rather than a dedicated collection.

Reason:
- the current project model and seeded content treat tags as stored strings on each post.

Alternatives considered:
- dedicated tag collection and relations
- tag normalization service

Current implementation:
- `models/post.ts` has a `tags: string[]` field.

## Decision: no separate video collection

Date:
- Current codebase state

Decision:
- the project does not maintain a separate video collection or embed collection.

Reason:
- the active architecture uses ordered content items and a mixed `content` field as the canonical source of truth.

Alternatives considered:
- dedicated `videos` collection
- completely separate embed schema

Current implementation:
- `models/post.ts` and `lib/post-content.ts` keep the content item array as the source of truth.

## Decision: ordered content structure

Date:
- Current codebase state

Decision:
- ordered `content[]` is the source of truth for article structure and insertion order.

Reason:
- content ordering is required across create, save, edit, and preview and should not be lost by splitting blocks into multiple arrays.

Alternatives considered:
- separate `videos` or `embeds` arrays appended later
- reconstructing article structure after save

Current implementation:
- `contentBlocksToPostContent()` and `normalizePostContent()` use a single ordered item array

## Decision: maximum 2 embeds

Date:
- Current codebase state

Decision:
- the project enforces a maximum of 2 embed items per post.

Reason:
- the current validation logic counts embed blocks and blocks more than two.

Alternatives considered:
- unlimited embeds
- per-platform embed limits

Current implementation:
- validation in `lib/post-content.ts` and `components/admin-posts/post-editor-form.tsx`

## Decision: responsive-first admin UI

Date:
- Current codebase state

Decision:
- the admin area is responsive-first and mobile-aware.

Reason:
- the project aims to preserve a professional editorial interface across devices while still supporting admin operations.

Alternatives considered:
- desktop-only admin layout
- separate mobile app shell

Current implementation:
- responsive admin navigation and form layout across the dashboard and editor screens

## Decision: lightweight verification workflow

Date:
- Current codebase state

Decision:
- verification should be targeted and relevant to the current change rather than broad full-suite validation for every minor edit.

Reason:
- the project uses targeted TypeScript, lint, and feature-level validation while keeping the work focused.

Alternatives considered:
- full rebuild after every tiny change
- ignoring verification entirely

## Decision: separate privacy-conscious analytics collections

Date:
- 2026-10-11

Decision:
- store analytics in separate PageView, EngagementEvent, AnalyticsVisitor, and AnalyticsDaily collections; do not add tracking fields to Post or Category

Reason:
- analytics needs bounded event detail and efficient dashboard aggregation without coupling content schemas to tracking

Alternatives considered:
- adding counters directly to Post documents
- querying and transferring all event records for each dashboard view
- sending analytics to a third-party SDK

Current implementation:
- PageView and EngagementEvent have generated unique event IDs and 400-day TTL indexes
- AnalyticsVisitor stores a daily hash of a random first-party visitor token
- AnalyticsDaily holds per-day site/page aggregates and supports dashboard queries
- writes are transactionally applied; dashboard uses aggregate collections

Do not change unless:
- preserving existing content data and the privacy constraints are addressed
- the replacement maintains idempotent events, finite retention, and efficient aggregate queries

Known operational limitations:
- MongoDB transaction support (replica set) is required
- rate limiting is process-local
- country is available only through trusted edge headers; active reading time is estimated

Current implementation:
- project-level validation is scripted in package.json and should be used when the task requires it, but not as a blanket requirement for every small documentation-only change
