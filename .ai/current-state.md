# Current State

This file documents the actual state of the project as implemented in the repository, not the intended future state.

## Working

### Admin authentication

Current status: Working in code and structure.

What works:
- protected dashboard access checks using `getAdminSession()`
- login action validates username/password against the User model
- signed admin session cookie is created for authenticated admins
- sign-out clears the cookie

Relevant files:
- app/admin-dashboard/actions.ts
- lib/admin-session.ts
- models/user.ts

Last known issue:
- live browser verification depends on an actual configured admin user and valid local env values

### Admin dashboard shell

Current status: Working.

What works:
- responsive admin layout
- sidebar navigation
- header with sign-out
- KPI cards and quick-action sections
- recent-posts and content-activity display

Relevant files:
- components/admin-dashboard/admin-dashboard.tsx
- components/admin-dashboard/admin-navigation.tsx
- components/admin-dashboard/admin-header.tsx
- components/admin-dashboard/dashboard-components.tsx

### Category model and seeded categories

Current status: Working.

What works:
- Category schema is present and used in post category selection
- category records are loaded in create/edit screens
- category seeding scripts exist

Relevant files:
- models/category.ts
- scripts/seed-categories.mjs

### Media model and Cloudinary upload bookkeeping

Current status: Working for metadata and upload tracking.

What works:
- media documents store filename, URL, MIME type, size, and uploader
- Cloudinary upload button records media metadata server-side
- UI verifies upload ownership before save

Relevant files:
- models/media.ts
- app/admin-dashboard/posts/new/actions.ts
- components/admin-posts/cloudinary-upload.ts
- components/admin-posts/cloudinary-upload-button.tsx
- lib/cloudinary.ts

### Post model and post list

Current status: Working.

What works:
- Post schema stores title, slug, excerpt, thumbnail, category, tags, status, seo fields, timestamps, and ordered content structure
- posts can be listed with filtering/search
- protected admin posts page reads and filters posts

Relevant files:
- models/post.ts
- app/admin-dashboard/posts/page.tsx
- components/admin-posts/posts-list.tsx

### Create Post / Edit Post form

Current status: Working with the current architecture.

What works:
- title, slug, excerpt, thumbnail, category, tags, draft/publish status fields
- dynamic content block insertion and deletion
- rich text block editing via Tiptap
- image upload blocks and embed blocks
- preview modal
- save draft and publish actions

Relevant files:
- components/admin-posts/post-editor-form.tsx
- app/admin-dashboard/posts/new/page.tsx
- app/admin-dashboard/posts/[id]/edit/page.tsx

### Content ordering and ordered content structure

Current status: Implemented in the current codebase as the canonical model.

What works:
- article content is treated as a single ordered array where each item preserves insertion position
- embed content is stored as an ordered content item, not as a separate append-only array
- preview rendering uses the same ordered content array as editor state

Relevant files:
- lib/post-content.ts
- lib/post-embeds.ts
- components/admin-posts/post-preview.tsx
- components/admin-posts/post-editor-form.tsx

## Partially Working

### Embed platform support

Current status: Partially working / feature-complete for supported platforms, but still needs live validation.

What works:
- platform parsing exists for cloudinary, youtube, instagram, x, facebook, and tiktok
- validation checks supported URL patterns
- renderers map embed items to native embed source URLs

Relevant files:
- lib/post-embeds.ts
- components/post-embed-renderer.tsx

What does not fully work yet:
- all social platform URLs need live browser verification against the actual production-like environment and user inputs
- unsupported URL handling is validated but not explored against all possible real-world patterns

### Legacy compatibility

Current status: Partially working.

What works:
- legacy `videos` data is normalized into active content item structure when loading posts
- old `videos` field is treated as compatibility data, not as a primary source of truth

Known limitation:
- exact original position cannot be recovered for legacy video data if the earlier database design did not preserve it

Relevant files:
- lib/post-content.ts
- models/post.ts
- app/admin-dashboard/posts/[id]/edit/page.tsx

## Currently Being Worked On

### Full end-to-end validation of create/edit/save flow

Current state:
- code path for save draft and publish is implemented
- save logic is centralized in server actions
- order-preserving content structure has been implemented

What is still pending:
- live browser test against MongoDB and Cloudinary using the actual app environment
- validation of edge cases such as incomplete metadata fallback, invalid embeds, duplicate saves, and edit-after-publish behavior

Relevant files:
- app/admin-dashboard/posts/new/actions.ts
- components/admin-posts/post-editor-form.tsx
- app/admin-dashboard/posts/[id]/edit/page.tsx

### Public blog routes and analytics

Current state:
- public blog, category, and post routes render only published, non-future posts
- the homepage redirects to `/blog`
- anonymous page-view, active-reading-time, and allowlisted-click tracking is implemented
- analytics events and daily aggregates use dedicated collections separate from content collections
- the protected dashboard aggregates daily analytics and provides date filters, trends, breakdowns, and post performance

What works in code:
- Do Not Track and Global Privacy Control opt-outs
- random first-party visitor cookie; only its hash is stored
- device class inferred from User-Agent and country read only from trusted edge country headers
- event validation, duplicate event IDs, process-local rate limiting, TTL indexes, and transactional daily aggregation
- dashboard queries MongoDB aggregates rather than loading raw events

What is still pending:
- live authenticated admin browser flow and responsive visual verification; the local dashboard redirected to the sign-in page and no existing authenticated browser session was available
- safe event-write/read testing against an identified staging replica-set MongoDB; the configured target does not clearly identify as staging/test/dev, so no DB connection or event writes were attempted
- validation of process-local rate-limiting behavior across multiple app instances
- transaction support in the staging MongoDB environment

Verified during follow-up:
- Apply Range date and interval fields now use controlled state with `onChange`; changing values still submits the existing GET form parameters.
- The dashboard is keyed by applied filters so controlled form values reset to the newly applied query after navigation.
- DNT/GPC exits are implemented before event validation, route resolution, rate limiting, or database access. Safe local API requests returned 204 for both headers without needing DB access.
- The tracker emits clicks only for elements explicitly marked with `data-analytics-event`; page-view submissions use a separate event type. Live persisted metrics were not verified.
- The UI warning was not observed in an authenticated browser after the fix because the available local browser was redirected to sign-in.

Relevant files:
- app/api/analytics/events/route.ts
- components/analytics/public-analytics-tracker.tsx
- lib/analytics-events.ts
- lib/analytics-dashboard.ts
- components/admin-analytics/analytics-dashboard.tsx
- models/page-view.ts
- models/engagement-event.ts
- models/analytics-visitor.ts
- models/analytics-daily.ts
- specs/post-analytics.md

## Not Implemented

- tag pages
- search page
- contact page
- about page
- privacy policy and terms pages
- advanced editorial layout system beyond the current admin workflow
- full author system beyond the current admin user model
- dedicated public reader experience for comment threads and newsletter features

## Blocked

### Environment-dependent validation

Status: Blocked by local configuration, not by application code alone.

Symptoms:
- create/edit/post save flows need valid .env.local values for database and Cloudinary
- preview and upload features may not operate without configured secret values

Root cause:
- the app expects environment configuration in `.env.local`

Current workaround:
- configure required environment variables locally and test with a working database and Cloudinary setup

## Needs Verification

### Live save and publish behavior

Status: Needs verification.

What to verify:
- Save Draft creates a draft record correctly
- Publish sets status to `published` and `publishedAt`
- edit loads ordered content correctly
- preview renders the same sequence as the editor
- invalid embed URLs are blocked without corrupting the rest of the content
- max 2 embed limit holds

### Browser-level UI flow

Status: Needs verification.

What to verify:
- Add Content menu adds blocks in the correct sequence
- insert position is preserved
- image fields and embed fields remain functional
- responsive admin layout still works at mobile and desktop widths

### Cloudinary and MongoDB integration

Status: Needs verification in a configured environment.

What to verify:
- actual upload success
- actual metadata persistence
- real post save to MongoDB with content array order intact

### Analytics tracking and dashboard

Status: Needs end-to-end verification.

What to verify:
- provision/identify a staging environment and authenticated admin session
- confirm transaction support against staging (the current configured MongoDB target was not clearly identifiable as non-production)
- confirm an opted-in visit creates one page view and active-time/allowlisted-click events appear in the dashboard
- verify range filters and post/category/device/country breakdowns against staging events
- browser-test dashboard empty state and responsive rendering
- confirm direct article visits and refreshes do not increment click metrics

## Summary

The repository is currently in a functional but still evolving admin/content-management stage. The core architecture is centered around a single ordered `content` array. Analytics is implemented in code, and the date-field warning is fixed, but end-to-end tracking verification requires an identified safe staging database and an authenticated browser session.
