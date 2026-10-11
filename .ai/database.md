# Database Architecture

This document describes the current MongoDB/Mongoose structure as implemented in the repository.

## Database connection

The project uses a single cached Mongoose connection in `lib/mongodb.ts`.

Environment variable used:
- MONGODB_URI

The actual value is not documented here.

## Collections and models

Current collection/model set identified from the codebase:

- `users` — `models/user.ts`
- `categories` — `models/category.ts`
- `media` — `models/media.ts`
- `posts` — `models/post.ts`
- `pageviews` — `models/page-view.ts`
- `engagementevents` — `models/engagement-event.ts`
- `analyticsvisitors` — `models/analytics-visitor.ts`
- `analyticsdailies` — `models/analytics-daily.ts`

Analytics collections are separate from content collections. The repository does not show a dedicated tags collection, video collection, or separate embed collection.

## User model

Schema fields:
- username: required, unique, trimmed, length-limited
- passwordHash: required, protected from default select
- role: `admin` or `editor`
- timestamps: createdAt, updatedAt

Security notes:
- passwords are hashed with scrypt via model static methods
- session cookies use a signed payload and secure/HTTP-only cookie settings

## Category model

Schema fields:
- name: required, unique
- slug: required, unique
- description: optional
- timestamps

Category records are used for post categorization and are selected in the create/edit workflow.

## Media model

Schema fields:
- filename: required
- url: required
- alt: optional
- mimeType: required
- size: required
- uploadedBy: optional ObjectId reference to User
- timestamps

Cloudinary is used for uploaded media, but the database stores metadata and URL references rather than raw media binary content.

## Post model

Schema fields currently implemented in `models/post.ts`:

- title: required string
- slug: required, unique string
- excerpt: optional or required for published posts depending on validation logic
- thumbnail: optional string
- content: `Schema.Types.Mixed`, used to hold ordered article content
- category: optional ObjectId ref to `Category`
- tags: string array, default empty
- status: `draft` or `published`
- seo: nested object containing `metaTitle` and `metaDescription`
- publishedAt: optional Date
- timestamps: createdAt, updatedAt

Important compatibility notes:
- the Post document still supports a legacy `videos` field in the schema
- the modern architecture prefers a single ordered `content` array as the real source of truth
- `content` is not forced to a rigid schema; it uses a mixed structure to preserve Tiptap JSON and custom content blocks

## Current content storage pattern

The code is designed around ordered content blocks. A representative structure is:

```ts
content: [
  { type: "richText", content: { type: "doc", content: [...] } },
  { type: "image", url: "https://..." },
  { type: "embed", platform: "youtube", url: "https://...", embedId: "..." },
  { type: "quote", text: "..." },
  { type: "hr" }
]
```

This structure is the canonical source of truth for ordering.

The code also includes compatibility handling for older posts that may have had a separate `videos` array, but it does not treat that as the primary ordering format.

## Post-related fields

The model includes these fields in practice:

- title
- slug
- excerpt
- thumbnail
- content
- category
- tags
- status
- seo.metaTitle
- seo.metaDescription
- publishedAt
- createdAt
- updatedAt

The `content` field is flexible and intentionally mixed to support rich text and dynamic block types, including embed blocks.

## Analytics models

The analytics feature uses four dedicated collections; it does not add analytics fields to Post or Category.

### PageView

Stores a deduplicated detailed view record: unique generated event ID, UTC day key, public route path, optional Post and Category references, and an `engaged` flag. Indexes include a 400-day TTL on `createdAt`, day/post/category lookup, and descending creation time. Visitor hash and device are deliberately not fields on this record.

### EngagementEvent

Stores unique generated event ID, matching page-view event ID, UTC day key, route path, optional Post and Category references, bounded `activeSeconds` and `sessionSeconds`, allowlisted `clickNames`, and `isFinal`. Indexes include a 400-day TTL on `createdAt` and day/post lookup.

### AnalyticsVisitor

Stores one anonymous `visitorHash` per UTC day, with an optional country code that can be filled from a later trusted edge header if the first request lacked one. Its unique compound index is `{ dayKey, visitorHash }`; country lookup is indexed by day and country. A 400-day TTL index expires visitor records. It is used for distinct daily visitor counts across the selected date range. Raw cookie values and IP addresses are not persisted.

### AnalyticsDaily

Stores UTC daily aggregate rows keyed by `dayKey`, `scope` (`site` or `page`), and `path`. Optional Post and Category refs support content breakdowns. Counters are `pageViews`, `uniqueVisitors`, `clicks`, `engagedSeconds`, `completedReadTimeSeconds`, `completedReadSessions`, and `engagedSessions`; `devices` and `clickEvents` hold breakdown maps. Indexes include a unique `{ dayKey, scope, path }`, day/scope/category, day/scope/post, and a 400-day TTL on `createdAt`.

Page-view insertion, daily unique visitor tracking, and aggregate increments use a MongoDB transaction. Engagement insertion, engagement-state update, and aggregate increments also use a transaction, so event writes require replica-set transaction support. The dashboard reads and groups daily aggregates instead of loading raw event collections. Countries come from valid Vercel/Cloudflare edge country headers and are stored on the daily visitor record; unknown country is represented as unavailable.

## Relationships and references

- Post -> Category: ObjectId reference using `category`
- Media -> User: optional `uploadedBy` reference using ObjectId
- Post stores its content inline in the document; no separate content collection is used

## Validation and constraints

Current code enforces limits such as:
- post status must be `draft` or `published`
- a maximum of 2 embed items is allowed in the content block validation
- content and excerpt requirements differ depending on publish state
- if a post is published, `category` and content validity are checked more strictly

## Important caveat

The current implementation supports recent ordered-content and embed fixes, but real database verification still needs a live configured environment to confirm the stored document layout and the actual save/edit cycle against production-like data.
