# Project Changelog

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

## Historical details unavailable; reconstructed from current code and documentation

This repository contains both current project documentation and implemented code patterns for the Next.js + MongoDB + Tiptap + Cloudinary admin workflow, but the full historical timeline of every earlier change is not fully reconstructable from the code alone. The project’s current state and the code itself are therefore the primary source of truth for this handoff.
