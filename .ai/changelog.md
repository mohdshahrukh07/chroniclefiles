# Project Changelog

## 2026-06-04 — Implement public homepage and Homepage Management

### What changed
- Replaced the root redirect with the data-backed public home page following `Designs/Homepage.html`, including all story sections, responsive carousels, real category navigation, recommendations, and footer.
- Added the singleton-style `HomepageLayout` model with five Post references and a protected Homepage Management screen.
- Added authenticated `GET` and partial `PATCH /api/admin/homepage-layout` operations with published/future-date/duplicate validation and updates that preserve untouched slot values.
- Added public fallback selection for missing or ineligible featured posts. A valid configured right-column square AdSlot takes priority over the saved `rightBottomPostId` without changing the stored fallback.
- Added the root route to analytics path validation and resolution, preserving explicit article-card clicks and existing DNT/GPC behavior.
- Added `specs/homepage-management.md` and updated project process and `.ai/` documentation.

### Verification
- Final TypeScript, focused ESLint, production build, and diff-check results are recorded in `process.md`.
- No HomepageLayout or Post records were written: the available MongoDB target was not identified as safe staging, and no authenticated staging session or configured-ad/browser verification was available.
- Responsive browser review, persistence/reload, real ad enable/disable, and fallback behavior remain staging/manual checks.

## 2026-10-11 — AI context documentation pack created

### What changed
- Added the `.ai/` folder to document current project state, architecture, and continuation guidance.
- Created the following files:
  - README.md
  - project-context.md
  - current-state.md
  - architecture.md
  - database.md
  - features.md
  - ui-design.md
  - workflows.md
  - decisions.md
  - known-issues.md
  - ai-workflow.md
  - changelog.md

### Why
- the project needed a portable, structured continuation package that survives account or workspace handoff

### Files affected
- `.ai/*`
- `process.md`

### Verification
- confirmed the `.ai` folder and required files exist in the repository
- reviewed the codebase and documentation for alignment with the actual implementation
- avoided copying secret values or credentials

### Result
- the repository now includes a documented current-state handoff for future AI agents and collaborators

### Next step
- continue to update `.ai/current-state.md`, `.ai/known-issues.md`, and `process.md` as the project evolves

## 2026-10-11 — Public blog routes and Post Analytics

### What changed
- Added public blog, category, and article routes; the root route redirects to `/blog`.
- Added privacy-conscious event collection, four dedicated analytics collections, daily aggregation, and a protected analytics dashboard.
- Bounded analytics request-body streaming and capped the in-memory rate-limit map to reject new visitor hashes at capacity.
- Added analytics schema/metric decisions and remaining verification limitations to the project documentation.

### Why
- ChronicleFiles needed real public surfaces to track and an admin view of actual page-view and engagement data without coupling tracking fields to content models.

### Files affected
- `app/`, `components/analytics/`, `components/admin-analytics/`, `components/blog/`
- `lib/analytics-events.ts`, `lib/analytics-rate-limit.ts`, `lib/analytics-dashboard.ts`, `lib/public-posts.ts`
- `models/page-view.ts`, `models/engagement-event.ts`, `models/analytics-visitor.ts`, `models/analytics-daily.ts`
- `components/admin-dashboard/admin-navigation.tsx`
- `specs/post-analytics.md`, `process.md`, `.ai/`

### Verification
- TypeScript, focused ESLint, changed-feature Problems checks, `git diff --check`, and `npm run build` passed.
- Production build includes all new public routes, event endpoint, and dashboard route.
- Safe endpoint smoke tests returned 204 for DNT, 415 for non-JSON, and 413 for oversized content-length and chunked requests; direct rate-limit checks validated the map cap and event quota.
- Did not write test events into the configured database; live authenticated/browser and transaction-backed event lifecycle tests remain pending.

### Result
- Public routes and the server/client analytics pipeline are implemented. Metrics are aggregated separately from content; country and active time are explicitly best-effort/estimated.

### Next step
- Verify the full event lifecycle and dashboard against a staging replica-set database, then exercise authenticated and responsive browser flows.

## 2026-10-11 — Fix Analytics range-field warnings

### What changed
- Made the Analytics From date, To date, and trend interval fields controlled, with change handlers and synchronization to applied server filters.
- Recorded the staging-verification blocker: the configured database target is not clearly identified as staging and the local browser has no authenticated admin session.

### Why
- Applying the dashboard range exposed React's read-only controlled-field warning; safe event persistence and dashboard verification also require an identified staging target.

### Files affected
- `components/admin-analytics/analytics-dashboard.tsx`
- `app/admin-dashboard/analytics/page.tsx`
- `process.md`
- `.ai/current-state.md`
- `.ai/features.md`
- `.ai/known-issues.md`
- `specs/post-analytics.md`

### Verification
- Targeted TypeScript, ESLint, Problems, and production-build checks pass.
- Safe local DNT/GPC endpoint checks return 204 before database access.
- Did not connect to the unclassified database, probe transactions, or generate tracking events; local analytics page redirects to sign-in.

### Result
- Range fields no longer use controlled `value` props without `onChange`; Apply Range retains its existing query-string GET behavior. Staging-backed analytics metrics remain unverified.

### Next step
- Use an explicitly identified staging replica-set database and authenticated staging session to verify transactions, tracking persistence, aggregates, filters, and empty/responsive states.

## 2026-10-11 — Implement the public Blog Page article design

### What changed
- Updated the existing `/post/[slug]` route to follow `Designs/Blogpage.html` with responsive article/sidebar layout, navigation, share actions, related stories, and real category links.
- Added published-only, same-category-first recommendations and preserved ordered rich text, image, video, and embed rendering.
- Added reusable square/inline ad slots gated by explicit configuration; no AdSense script, unit IDs, Post schema changes, or database content writes were introduced.
- Added data-backed article SEO/social metadata and conditional BlogPosting JSON-LD using an explicit HTTPS `SITE_URL`, plus loading, not-found, and error states.
- Documented remaining production origin and AdSense setup.

### Verification
- Production build, TypeScript, focused ESLint, and `git diff --check` passed.
- Browser-loaded `/blog` and an existing published post; verified one H1, real ordered rich text/image/YouTube content, sidebar sections, disabled ad markup, and desktop/tablet/mobile layouts.
- Browser analytics requests were intercepted during visual checks; no analytics test records were created and no post/category data was modified.
- Canonical and JSON-LD output remain unverified because the production `SITE_URL` is not configured. An unknown slug showed the custom not-found UI; Next.js returned a streamed soft 404 with noindex because the route has a `loading.tsx` boundary.

## 2026-10-11 — Implement Category and Latest archive pages

### What changed
- Matched `Designs/CategoryPage.html` in the existing `/category/[slug]` route and made `/blog` the matching special Latest archive.
- Added shared category listing, overlay card, pagination, loading, and category not-found components. Normal archives resolve a real category and query only its posts; Latest has no category filter or required Latest document.
- Added nine-post pagination, deterministic newest-first ordering, accurate post counts, real category labels, responsive category navigation, and the required shared sidebar/ad order.
- Added page-specific Open Graph and canonical metadata using configured HTTPS `SITE_URL`; paginated pages identify their page in titles and canonicals.
- Preserved the analytics API path contract, explicit article-card clicks, and DNT/GPC opt-out.

### Verification
- `npx tsc --noEmit`, focused ESLint, production build, Problems checks, and `git diff --check` passed.
- Browser-tested `/blog` with five posts across multiple categories and `/category/technology` with its two matching posts. Sidebar sections remained present with no ad markup when configuration was unavailable. Measured 1152/720/312px viewports had no horizontal overflow; host-clamped widths were 1152/720/312 CSS pixels.
- Analytics API requests were intercepted; no post/category documents were seeded or changed. Multi-page pagination and draft/future records were not tested against modified data because the available dataset had fewer than nine posts.
- Canonical output with a production origin remains unverified because local `SITE_URL` is not configured. No sitemap route/file exists in the repository.

### Category navigation and pagination visibility follow-up

- Category navigation now starts with Latest plus at most three category tags; More reveals the rest and Less collapses them. The active category remains in the initial set when it would otherwise be hidden.
- Pagination remains visible when there is only one page (or no results), with disabled Prev/Next controls and a current-page indicator.
- TypeScript, focused ESLint, Problems, `git diff --check`, and production build passed. Browser verified the four-item collapsed menu, expansion/collapse of remaining categories, one-page pager controls, and no horizontal overflow at the host-clamped mobile width. Analytics API requests were intercepted.
- Fixed the active pagination number's white-on-white contrast: browser computed styles showed the active green background utility was losing to the white base background. Explicit-priority text, border, and background utilities now preserve readable normal and active states, including hover.

## 2026-10-11 — Add archive search and sorting

- Added title-first search with tag fallback and Latest/Popular/Oldest server-side sorting to Latest and regular category archives.
- Popular ordering uses existing per-post AnalyticsDaily view totals and does not create synthetic ranking data. The ranking is constrained by the analytics collection's retention window.
- Query parameters persist across pagination; changing filters submits page one. Search query text is excluded from canonical metadata.
- Browser checks confirmed oldest ordering, popular results, title matches, tag fallback, and combined query state. A missing category ObjectId cast in the Oldest aggregation was caught and fixed; category-only and category+search Oldest queries now return the expected posts. Search terms are omitted from canonical/description metadata. TypeScript, focused ESLint, production build, and final diff check passed.

## Historical details unavailable; reconstructed from current code and documentation

This repository contains both current project documentation and implemented code patterns for the Next.js + MongoDB + Tiptap + Cloudinary admin workflow, but the full historical timeline of every earlier change is not fully reconstructable from the code alone. The project’s current state and the code itself are therefore the primary source of truth for this handoff.

## 2026-10-12 — Final security and reliability audit

### What changed
- Hardened recursive Tiptap content validation so malformed nested content, marks, or attributes are rejected before save and filtered from normalized public/edit content.
- Documented the remaining process-local analytics rate-limit limitation and the need to verify Cloudinary unsigned-upload restrictions and database-backed flows in staging.

### Verification
- TypeScript, ESLint, Problems, production build, and diff checks were run; results are recorded in `process.md`.
- No database writes, Cloudinary uploads, or authenticated browser actions were performed.
