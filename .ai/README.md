# ChronicleFiles AI Context

This folder is a portable project context package for ChronicleFiles. It is designed for AI agents, human contributors, and external tools that need to resume work without losing project context.

## What ChronicleFiles is

ChronicleFiles is a Next.js content publishing and admin project focused on editorial blog-style content, admin workflows, public article pages, and MongoDB-backed post management. Current functionality includes login, dashboard, post/category/media management, create/edit workflow, Cloudinary uploads, Tiptap article content, public blog/category/article routes, and a privacy-conscious analytics pipeline/dashboard.

## What this folder contains

This directory documents the project as it exists in the codebase today:

- project context and constraints
- current implementation status
- architecture and data flow
- MongoDB schema and model decisions
- feature status and known limitations
- UI design and workflow notes
- AI operation guidance for continuing the project
- changelog and historical notes

## Recommended reading order

Use this order when starting work:

1. AGENTS.md
2. .ai/README.md
3. .ai/project-context.md
4. .ai/current-state.md
5. .ai/architecture.md
6. .ai/features.md
7. .ai/known-issues.md
8. process.md
9. relevant source files

This order prioritizes the project rules first, then the current state, then the architecture, then the implementation files.

## Most important files to read before changing code

These files are the best starting points for any ongoing fix or feature:

- AGENTS.md
- process.md
- app/admin-dashboard/posts/new/actions.ts
- components/admin-posts/post-editor-form.tsx
- components/admin-posts/post-preview.tsx
- models/post.ts
- models/category.ts
- models/media.ts
- models/user.ts
- lib/post-content.ts
- lib/post-embeds.ts
- lib/mongodb.ts
- lib/admin-session.ts
- app/admin-dashboard/posts/[id]/edit/page.tsx
- app/admin-dashboard/analytics/page.tsx
- app/api/analytics/events/route.ts
- components/analytics/public-analytics-tracker.tsx
- lib/analytics-dashboard.ts

## How to continue previous work

1. Read AGENTS.md and this file first.
2. Check the current-state and known-issues documents.
3. Read the relevant feature and architecture files.
4. Inspect the actual source code before applying changes.
5. Keep the change minimal and aligned with the working architecture.
6. Update this documentation when the implementation materially changes.

## Rules for updating this documentation

- The source code is the final authority when documentation and implementation differ.
- Do not copy secrets, credentials, or private values into these files.
- Keep the documentation project-focused and concise.
- Update the docs whenever a feature is implemented, changed, blocked, or verified.
- Treat this folder as a continuation and handoff layer, not as a replacement for the repository code.
- Preserve the existing AGENTS.md, process.md, and docs/ materials.

## Where current project state is stored

The project state is tracked across:

- .ai/current-state.md
- .ai/known-issues.md
- .ai/changelog.md
- process.md

These files should be treated as the current handoff record for the project.

## Safety rules

- Never copy database connection strings, passwords, Cloudinary secrets, API keys, or session secrets.
- Document environment variable names only, for example: MONGODB_URI, ADMIN_SESSION_SECRET, NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.
- Do not expose private values in .ai docs or any code comments.

## Verification expectation

The goal is to preserve project continuity across tools and agents. A future AI agent should be able to answer:

- What is the project?
- What is implemented right now?
- What is partially working?
- Which files are critical?
- Which issues remain?
- What is the next likely action?

If that can be answered from this folder and the source code, the handoff is considered complete.
