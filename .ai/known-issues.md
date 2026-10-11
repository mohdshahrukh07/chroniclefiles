# Known Issues and Limitations

This file documents the issues currently known from the repository state and the recent work in the project.

## Issue: Live end-to-end verification still pending

Status: Needs verification

Symptoms:
- the create/edit/save/publish flow is implemented in code but still needs real browser and database validation
- the app may appear correct without a live configured environment

Root Cause:
- the repository requires valid runtime environment values such as MONGODB_URI and Cloudinary configuration to exercise the production flow end to end

Affected Files:
- app/admin-dashboard/posts/new/actions.ts
- components/admin-posts/post-editor-form.tsx
- app/admin-dashboard/posts/[id]/edit/page.tsx

Current Workaround:
- configure environment variables and validate against a working MongoDB and Cloudinary environment

Planned Fix:
- run browser-level verification for create, draft save, publish, edit, and preview in a real environment

Important Notes:
- this is not a confirmed code defect; it is a verification gap.

## Issue: Legacy `videos` order cannot always be reconstructed precisely

Status: Known limitation

Symptoms:
- older documents may have had a separate `videos` field but not enough ordering metadata to know the exact original sequence

Root Cause:
- original insertion order is not reliably recoverable from legacy data in all cases

Affected Files:
- lib/post-content.ts
- models/post.ts
- app/admin-dashboard/posts/[id]/edit/page.tsx

Current Workaround:
- normalize legacy `videos` into the new ordered content structure as a safe fallback without pretending the original order is exact

Planned Fix:
- keep the new canonical `content[]` structure for all new saves and strictly avoid reordering legacy data as if it were exact history

Important Notes:
- this is a compatibility limitation, not necessarily an active bug in the new implementation

## Issue: Unsuitable environment state blocks full feature verification

Status: Confirmed bug / configuration dependency

Symptoms:
- without `.env.local` values, the app cannot connect to MongoDB or Cloudinary
- features dependent on those services will fail or skip validation

Root Cause:
- app expects configured environment variables to exist locally

Affected Files:
- lib/mongodb.ts
- lib/cloudinary.ts
- app/admin-dashboard/posts/new/actions.ts

Current Workaround:
- configure the required environment variables locally, keeping secret values out of documentation

Planned Fix:
- document required environment variables clearly and test only in a configured environment

Important Notes:
- this is a local setup requirement rather than a code rewrite issue

## Issue: Analytics staging verification is blocked

Status: Needs verification

Symptoms:
- analytics API, public tracking component, analytics collections, and protected dashboard are implemented, but a live event write/read and authenticated browser run have not been performed
- the dashboard will correctly have no historical data before tracking is deployed
- local `/admin-dashboard/analytics` redirects to sign-in because no authenticated browser session is available
- the configured MongoDB target does not clearly identify as a staging/test/dev target

Root Cause:
- no confirmed safe staging target or authenticated staging session was available; production data must not be used to generate test analytics
- transaction support must be verified against the actual target, not assumed from a provider name

Affected Files:
- app/api/analytics/events/route.ts
- components/analytics/public-analytics-tracker.tsx
- lib/analytics-events.ts
- lib/analytics-dashboard.ts
- app/admin-dashboard/analytics/page.tsx
- models/page-view.ts
- models/engagement-event.ts
- models/analytics-visitor.ts
- models/analytics-daily.ts

Current Workaround:
- use source-level checks and safe opt-out API checks only; do not connect to the unclassified database or generate test events

Planned Fix:
- provide a staging URI explicitly targeting a disposable/test database plus an authenticated staging session, verify MongoDB transaction capability, then test and clean up only staging analytics records

Important Notes:
- the Apply Range React warning was traced to the two date inputs and interval select using `value` without `onChange`; all three now use controlled state and `onChange`, but a browser-console retest is blocked by the unavailable authenticated session
- local checks confirmed DNT/GPC handling returns before database access and that page-view events are distinct from explicitly marked clicks
- these source/API checks do not verify persisted page-view, click, read-time, aggregation, or dashboard metrics
- no analytics database writes have been made as part of the attempted staging verification

## Issue: Analytics rate limit is process-local

Status: Known limitation

Symptoms:
- each running application process maintains its own in-memory visitor window, so a visitor reaching different instances can receive separate per-process quotas
- when a process has 10,000 active visitor hashes, new hashes are rejected until expired entries are pruned

Root Cause:
- rate limiting is intentionally implemented without a new shared cache dependency

Affected Files:
- lib/analytics-rate-limit.ts
- app/api/analytics/events/route.ts

Current Workaround:
- use the feature as a basic abuse guard, not as a distributed quota or security boundary

Planned Fix:
- consider shared rate limiting only if production scale or abuse requires it

Important Notes:
- the in-memory map is capped to prevent unbounded growth
- active time is estimated; country requires trusted edge headers; rate limiting is process-local

## Issue: Unsupported embed URLs are rejected intentionally

Status: Confirmed behavior

Symptoms:
- unsupported or malformed embed URLs are rejected with a validation error
- the post is not saved with invalid embed data

Root Cause:
- the project validates platform-specific URLs before saving

Affected Files:
- lib/post-embeds.ts
- app/admin-dashboard/posts/new/actions.ts

Current Workaround:
- use a supported URL pattern for the selected platform

Planned Fix:
- continue extending supported platform patterns if additional legitimate embed URL formats are needed

Important Notes:
- this is a safety measure and not a bug by itself

## Issue: Some recent content-order fixes require live browser confirmation

Status: Suspected / needs investigation

Symptoms:
- the ordered-content architecture is implemented in code, but browser verification against real data remains necessary

Root Cause:
- the fix is in the code path but not yet validated against a running app / database session in this environment

Affected Files:
- components/admin-posts/post-editor-form.tsx
- components/admin-posts/post-preview.tsx
- lib/post-content.ts

Current Workaround:
- rely on structured normalization and code-path validation

Planned Fix:
- run a real create/edit/publish flow once the environment is set up

Important Notes:
- this issue is a verification gap rather than a confirmed defect in the code itself
