# Homepage and Homepage Management

## Problem

ChronicleFiles needs its own editorial home page and a persistent way for an
authorized administrator to choose the five stories shown in the featured
layout.

## Goal and users

- Public readers discover recent and category-specific published stories at `/`.
- An authenticated admin manages the five featured story slots from
  `/admin-dashboard/homepage`.

## Requirements

- Match `Designs/Homepage.html`, including its featured story grid, latest and
  category carousels, sidebar, category strip, and footer.
- Keep carousel lists bounded: at most six stories in Latest Stories and five
  each in Technology, Education, and Entertainment. Rank each carousel by
  recorded `AnalyticsDaily` page views descending, then publication date and
  ID; when view counts are tied or unavailable, use the existing recency
  ordering as the deterministic fallback.
- Keep the five slot values in one `HomepageLayout` document:
  `leftTopPostId`, `leftBottomPostId`, `editorsPickPostId`,
  `rightTopPostId`, and `rightBottomPostId`.
- Do not add homepage fields to Post or Category, create an Editor's Pick
  category, or create a settings collection.
- Only admins can read or change homepage configuration through the protected
  API. Search results and accepted IDs must be published and not scheduled for
  the future.
- Updating one or more slots must update only those fields; existing other
  selections must remain stored. Selected posts should be unique.
- Public homepage selection must safely replace missing, deleted, unpublished,
  future-dated, or duplicate selections with distinct newest eligible posts.
- A valid configured ad takes the right-bottom featured slot's place while
  leaving its saved post ID untouched. When ads are unavailable, show that
  saved post. Show no empty right-bottom ad/post block if neither is available.
- Public article links use explicit post-card analytics markers and the public
  tracker honors the existing DNT/GPC behavior.
- The homepage canonical URL uses only the trusted HTTPS `SITE_URL`.

## Acceptance criteria

- `/` renders the public home page rather than redirecting to `/blog`.
- The featured columns map to the five specified IDs and do not repeat a post.
- Latest and the Technology, Education, and Entertainment sections show only
  eligible published posts from the intended scope, within their limits and
  ordered by popularity; missing category records or posts produce a useful
  empty state. Featured posts may also appear in a carousel.
- The admin can search eligible posts, review a slot's pending selection, clear
  or replace a slot, and save changes with success and failure feedback.
- Reloading management shows persisted values; changing a single slot does not
  reset any other slot.
- The ad replaces—not accompanies—the right-bottom featured post, and the
  fallback remains saved.
- Existing `/blog`, `/category/[slug]`, and `/post/[slug]` routes remain intact.

## Data and API

- `HomepageLayout` is a singleton-style Mongoose model keyed by `primary`.
- `GET /api/admin/homepage-layout?q=...` returns the current slot IDs, resolved
  eligible selections, and a bounded searchable set of published posts.
- `PATCH /api/admin/homepage-layout` accepts only changed slot keys, validates
  their IDs and the merged distinct eligible selections, then writes only the
  specified fields.
- A save revalidates `/` and `/admin-dashboard/homepage`. Public MongoDB reads
  are request-time reads; homepage data is not statically cached.

## Known verification limits

- Database-backed save/reload, fallback records, future/draft exclusion,
  enabled-ad rendering, and authenticated browser flows require a known safe
  staging database, configured ad variables, and an authenticated browser.
- Do not create or modify homepage configuration in an unclassified or
  production database to perform a test.
- Actual AdSense serving still requires the established publisher approval and
  integration; the current `AdSlot` remains a configuration-gated placeholder.
