# Project Context

## Project

Project name: ChronicleFiles

Project purpose: ChronicleFiles is a content-first editorial platform built with Next.js and MongoDB. It is intended to support a modern publication-style experience with admin content operations, article publishing, category management, media uploads, and SEO-aware post data.

Target users:
- admin users and editors managing content
- content teams publishing blog and editorial content
- future public readers consuming published posts

Main content categories currently anticipated:
- News
- Education
- Technology
- Entertainment
- Lifestyle
- General-interest/editorial content

Current development stage:
- Admin/content platform with authentication, dashboard, post/category/media management, and create/edit/publish flows
- Public blog, category archive, and article routes are implemented
- Privacy-conscious post analytics collection and dashboard are implemented in code; live tracking/database/browser validation remains pending

## Technology stack

The repository currently contains the following actual configuration and dependencies:

- Next.js: 16.3.8
- React: 19.2.8
- TypeScript: 5.x
- Tailwind CSS: 4.x
- shadcn/ui: project uses shadcn-compatible primitives and component structure, with a custom design system layered on top
- MongoDB: Mongoose ODM 9.10.4
- Tiptap: 3.31.4 with StarterKit, Image, and Link extensions
- Cloudinary: next-cloudinary 6.19.3 and unsigned upload flow via Cloudinary API
- Authentication: custom admin session cookie system using Node crypto, scrypt, signed payload, and HTTP-only cookies
- UI iconography: lucide-react 1.51.0
- Validation and runtime support: TypeScript strict mode, ESLint, Next.js App Router
- Analytics: dedicated Mongoose models and MongoDB aggregation pipelines; no third-party analytics SDK

## Project architecture

### App Router

The app uses Next.js App Router. Protected admin pages and public post/category pages use server components for data access; client components are used for interactive forms, dashboard controls, and browser analytics tracking.

Active public routes include `/blog`, `/category/[slug]`, and `/post/[slug]`; `/` redirects to `/blog`. The analytics dashboard is `/admin-dashboard/analytics`, with events accepted at `/api/analytics/events`.

### src directory

The project does not use a `src/` directory. The root structure is the standard Next.js app layout with `app/`, `components/`, `lib/`, `models/`, and `public/` at the project root.

### Current route structure

Relevant implemented or active routes include:

- `/` (redirects to `/blog`)
- `/blog`
- `/category/[slug]`
- `/post/[slug]`
- `/admin-dashboard`
- `/admin-dashboard/posts`
- `/admin-dashboard/posts/new`
- `/admin-dashboard/posts/[id]/edit`
- `/admin-dashboard/analytics`

Search, about, contact, privacy, and terms routes remain unimplemented.

### API and server actions

The main server-side actions are currently in:

- app/admin-dashboard/actions.ts
- app/admin-dashboard/posts/new/actions.ts

These are responsible for:
- admin sign-in and sign-out
- post creation and update
- server-side validation
- category validation
- media ownership verification
- Cloudinary media records and metadata persistence

### Client/server component usage

The project follows the App Router pattern:

- server components handle session checks and database fetches for protected pages
- client components handle interactive editor, form state, preview modal, upload buttons, and UI behaviors
- `PostEditorForm` is a client component that orchestrates content state and save flows
- Tiptap editor is a client-side editor component used inside the form

### Path alias

The project uses the `@/*` alias as configured in `tsconfig.json`.

### Important configuration

Key project files:
- package.json
- tsconfig.json
- next.config.ts
- .env.example
- AGENTS.md
- process.md

Environment variables used or expected by the codebase include:
- MONGODB_URI
- ADMIN_USERNAME
- ADMIN_PASSWORD
- ADMIN_SESSION_SECRET
- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
- NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

No secret values are included in this documentation.

## Project goals

The project goals documented in AGENTS.md and reflected in the current implementation are:
- professional editorial read experience
- maintainable admin tooling
- strong TypeScript usage
- SEO-aware content model
- responsive design
- accessibility-conscious UI
- modular and reusable admin components
- incremental feature development without premature architecture bloat

The current implementation is a working subset of that target state, especially in admin workflows and post management.
