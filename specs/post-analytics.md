# Post Analytics & User Engagement

## Problem and goal

Before this implementation, ChronicleFiles had no public article routes or analytics pipeline. This specification records the privacy-conscious public publishing surface, analytics collection, and protected admin dashboard added to address that gap. Do not change the existing Post schema.

## Users

- Readers view published articles, browse categories, and navigate the blog.
- Admins inspect traffic and engagement from the protected dashboard.

## Scope and acceptance criteria

- Provide public `/blog`, `/category/[slug]`, and `/post/[slug]` pages that only expose published posts.
- Record one page view per public route mount, keyed by a client-generated event ID to make retries/Strict Mode safe.
- Record active reading time only while the page is visible and recent user activity indicates the visitor is active; submit batched engagement checkpoints and final session totals.
- Count only explicitly marked, named public UI clicks. Page views are never clicks.
- Use a random first-party, HttpOnly, SameSite=Lax visitor cookie; store only its SHA-256 digest for daily deduplication. Do not store IP addresses or raw user agents.
- Honor browser Do Not Track and Global Privacy Control opt-out signals by skipping collection.
- Determine device class from the request User-Agent; country is recorded only from valid country codes supplied by recognized Vercel/Cloudflare geo headers.
- Keep event logs, daily aggregates, and daily unique-visitor records in analytics-only collections with indexes and finite retention for detailed records.
- Use MongoDB transactions to deduplicate events and update daily aggregates atomically.
- Protect the Analytics dashboard with the existing admin session. Filter date range and calculate totals and breakdowns using MongoDB aggregation, not by loading event records.
- Provide overview metrics, daily traffic, categories, devices, available countries, searchable/sortable post performance, and clear empty/unavailable states.

## Metric definitions

- **Page views:** accepted route-view events, including repeat views and browser navigation; client retries with the same event ID count once.
- **Unique visitors:** distinct pseudonymous visitor hashes in the selected date range; this is not a cross-device person count. Daily visitor rows support date-bounded deduplication.
- **Engagement time:** accumulated seconds while the page is visible and user activity occurred in the previous 30 seconds. This is a browser-side estimate and may undercount passive reading.
- **Average read time:** completed active sessions' active seconds divided by completed sessions with at least one active second.
- **Clicks:** clicks on elements explicitly marked with `data-analytics-event`; navigation/page views do not count as clicks.
- **Engagement rate:** page views with at least 10 active seconds or one marked click, divided by page views.
- **Performance trend:** daily page-view counts for each post, grouped by UTC date.

## Storage and data flow

- `PageView`: deduplicated detailed view record, with 400-day TTL.
- `EngagementEvent`: deduplicated batched engagement record, with 400-day TTL.
- `AnalyticsVisitor`: daily pseudonymous visitor record, with 400-day TTL.
- `AnalyticsDaily`: incrementally maintained per-UTC-day site and route aggregates, with 400-day TTL. Analytics data is separate from `posts`, `categories`, `users`, and `media`.
- Client tracker sends same-origin events to `/api/analytics/events`. The API resolves public post/category slugs server-side, rejects unpublished or invalid paths, rate-limits per anonymous visitor hash in process memory with a bounded map, and writes event plus aggregate mutations transactionally.
- Dashboard queries `AnalyticsDaily` and current Post/Category metadata only. Data before tracking is enabled is unavailable and must not be fabricated.

## UI

- ChronicleFiles dashboard shell and colors.
- Date range filter (maximum 366 days).
- KPI cards, responsive daily trend chart, category/device/country breakdowns, and searchable/sortable post table.
- When no tracked data or geo data is available, show explicit empty/unavailable messaging.

## Limitations and operational notes

- Country availability depends on Vercel/Cloudflare proxy headers and is otherwise unknown.
- In-memory event rate limiting is per server process; it is a basic abuse guard, not a distributed quota.
- Transaction support requires a MongoDB replica set; the transaction capability and staging identity of the currently configured target have not been verified for this follow-up. Standalone local MongoDB cannot provide the same atomic event-plus-aggregate guarantee.
- Daily aggregate and pseudonymous detail retention is 400 days; data must not be presented as predating deployment.
