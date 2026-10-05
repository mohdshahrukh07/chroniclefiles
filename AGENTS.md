# ChronicleFiles — AI Agent Instructions

## 1. Project Overview

ChronicleFiles is a modern, content-focused blog and online publication built with Next.js.

The website will publish and organize content across multiple categories such as:

* News
* Education
* Technology
* Entertainment
* Lifestyle
* Other general-interest topics as the project grows

The goal is to build ChronicleFiles as a real, scalable content platform rather than a simple demo blog.

The public website should feel like a professional editorial/publication website, not a generic SaaS dashboard or default template.

The project will eventually include a separate admin area for managing posts, categories, media, and other content.

---

# 2. Primary Goals

The project should prioritize:

1. Excellent reading experience
2. Clean and professional editorial UI
3. Fast page loading
4. Responsive design
5. SEO-friendly architecture
6. Accessible UI
7. Maintainable and reusable code
8. Scalable content architecture
9. Good developer experience
10. AI-friendly project structure
11. Strong TypeScript usage
12. Easy future expansion

Do not over-engineer features before they are required.

Prefer simple, maintainable solutions over unnecessary complexity.

---

# 3. Technology Stack

## Core

* Next.js
* React
* TypeScript
* Tailwind CSS
* App Router
* ESLint

## UI

* shadcn/ui
* Lucide React

shadcn/ui is the primary component foundation.

Do not introduce another large UI component library unless there is a specific technical reason.

shadcn/ui components may and should be customized to match the ChronicleFiles design system.

Do not assume the default shadcn appearance is the final ChronicleFiles design.

## Database

* MongoDB
* Mongoose

## Validation

* Zod

Additional packages should only be added when they solve an actual project requirement.

Avoid unnecessary dependencies.

---

# 4. Project Configuration

Current Next.js project preferences:

* TypeScript: enabled
* ESLint: enabled
* React Compiler: disabled initially
* Tailwind CSS: enabled
* `src/` directory: not used
* App Router: enabled
* Import alias: `@/*`
* AGENTS.md: enabled

Preferred project structure:

```text
chroniclefiles/
├── app/
├── components/
├── lib/
├── models/
├── types/
├── public/
├── docs/
├── specs/
├── .env.local
├── AGENTS.md
├── package.json
└── tsconfig.json
```

The structure may evolve when the application grows.

Do not create folders merely for the sake of organization.

---

# 5. Next.js Architecture

Use the Next.js App Router.

Prefer Server Components by default.

Use Client Components only when client-side functionality is actually required, such as:

* browser APIs
* interactive UI
* stateful interactions
* event handlers requiring client execution
* client-side editors
* certain animations/interactions

Do not add `"use client"` to components unnecessarily.

Keep server-only logic on the server.

Never expose:

* MongoDB credentials
* private API keys
* authentication secrets
* other server-only environment variables

to client-side code.

---

# 6. Database Architecture

MongoDB is the primary database.

Mongoose is used for schema/model management.

Database connection logic should be centralized and reusable.

Do not create a new MongoDB connection inside every request or component.

Expected future models include:

```text
User
Post
Category
Tag
Media
```

Additional models may be added when required.

A post will likely contain information such as:

```text
title
slug
excerpt
content
thumbnail
category
tags
author
status
publishedAt
createdAt
updatedAt
```

Do not assume this schema is permanently final.

When adding or changing database fields:

1. Consider existing data.
2. Update the appropriate TypeScript types.
3. Update the Mongoose schema.
4. Update validation.
5. Update affected server/database logic.
6. Update the UI where necessary.

---

# 7. Content Model

ChronicleFiles is primarily a content platform.

The content architecture should support:

* Articles/posts
* Categories
* Tags
* Authors
* Featured content
* Drafts
* Published content
* Scheduled/future content where required
* Search
* Related posts
* Media/images

Public users should only see content that is intended to be publicly published.

Draft or unpublished content must not accidentally appear on public pages.

---

# 8. Public Website

The public website should eventually include:

```text
Home
Blog / Latest Articles
Category pages
Individual article pages
Search
About
Contact
Privacy Policy
Terms
```

The exact routes may change as the information architecture develops.

Potential route structure:

```text
/
 /blog
 /category/[slug]
 /post/[slug]
 /search
 /about
 /contact
```

Do not create routes unnecessarily.

Use meaningful, SEO-friendly URLs.

---

# 9. Admin Area

The project will eventually include an admin panel.

Potential areas:

```text
/admin
/admin/login
/admin/dashboard
/admin/posts
/admin/posts/new
/admin/posts/[id]/edit
/admin/categories
/admin/tags
/admin/media
/admin/settings
```

Admin functionality should be developed separately from the public website.

The admin interface can use more dashboard-oriented UI patterns.

The public website should remain editorial/publication-oriented.

---

# 10. UI / UX Direction

ChronicleFiles should look like a professional modern online publication.

Avoid making the website look like:

* A generic SaaS dashboard
* A default shadcn demo
* A template assembled from random components
* An overly complicated design
* An overly animated website

The visual direction should emphasize:

* Editorial hierarchy
* Strong typography
* Excellent readability
* Clean article cards
* High-quality imagery
* Clear categories
* Generous whitespace
* Strong but restrained visual hierarchy
* Fast scanning
* Responsive layouts

The website should feel trustworthy and polished.

---

# 11. shadcn/ui Rules

shadcn/ui is the component foundation.

Use it where appropriate for:

* Buttons
* Inputs
* Dialogs
* Dropdowns
* Tabs
* Tables
* Forms
* Pagination
* Sidebar
* Select
* Checkbox
* Command/search interfaces
* Toast/notifications
* Other reusable primitives

Customize shadcn components to match ChronicleFiles.

Do not blindly use the default shadcn styling.

Create reusable ChronicleFiles-specific components on top of primitives when appropriate.

For example:

```text
components/
├── ui/
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
│
├── blog/
│   ├── article-card.tsx
│   ├── article-grid.tsx
│   ├── category-badge.tsx
│   └── ...
│
└── layout/
    ├── header.tsx
    ├── footer.tsx
    └── ...
```

Do not duplicate the same UI implementation in multiple places.

---

# 12. Design System

ChronicleFiles should have a consistent design system.

Before making large numbers of pages, establish:

* Color palette
* Typography
* Type scale
* Spacing
* Border radius
* Shadows
* Container widths
* Breakpoints
* Buttons
* Cards
* Badges
* Form elements
* Navigation
* Article components

Use design tokens rather than hardcoding unrelated values throughout components.

If a visual value is part of the global design system, define it centrally.

Do not randomly introduce new colors or spacing values for individual pages.

---

# 13. Responsive Design

ChronicleFiles must work well on:

* Mobile
* Tablet
* Laptop
* Desktop
* Large desktop screens

Use responsive layouts rather than creating separate duplicated pages for different devices.

Design mobile-first when practical.

Important touch targets should generally be at least 44px.

Avoid horizontal scrolling unless it is intentional.

Images must resize correctly without breaking layouts.

---

# 14. Accessibility

Accessibility is required, not optional.

Follow WCAG-oriented practices.

Important rules:

* Use semantic HTML.
* Use proper heading hierarchy.
* Provide meaningful alt text.
* Do not use images as the only way to communicate information.
* Ensure keyboard accessibility.
* Provide visible focus states.
* Use sufficient color contrast.
* Label form controls.
* Do not rely only on color to communicate state.
* Buttons should perform actions.
* Links should navigate.
* Do not use clickable `div` elements when a semantic element exists.

Interactive components should have appropriate accessible names.

---

# 15. SEO

SEO is an important part of ChronicleFiles.

Public pages should have appropriate:

* Page titles
* Meta descriptions
* Canonical URLs where appropriate
* Open Graph metadata
* Twitter/social metadata where appropriate
* Semantic HTML
* Crawlable internal links
* SEO-friendly URLs
* Structured data where appropriate

Individual article pages should eventually support appropriate Article structured data.

Category pages should have meaningful metadata and crawlable article links.

Do not keyword-stuff content.

SEO implementation must not damage the user experience.

---

# 16. Performance

Performance is important.

Prefer:

* Server Components
* Optimized images
* Proper image dimensions
* Lazy loading where appropriate
* Minimal client-side JavaScript
* Code splitting through normal Next.js behavior
* Efficient database queries
* Reusable components

Do not add heavy libraries for simple functionality.

Avoid unnecessary client-side fetching when server-side rendering/data fetching is more appropriate.

---

# 17. Images and Media

Blog content will rely heavily on images.

Use Next.js image optimization where appropriate.

Avoid layout shifts by providing appropriate dimensions/aspect ratios.

Images should have meaningful alt text when they convey information.

Decorative images should not have unnecessary descriptive alt text.

Do not use copyrighted or external images without appropriate rights.

---

# 18. TypeScript Rules

TypeScript is enabled even though the developer is still learning TypeScript.

Code should use TypeScript properly.

Prefer explicit types for:

* Data models
* API responses
* Component props
* Form data
* Database-related data
* Important utility functions

Avoid using `any` unless there is a genuine technical reason.

When `any` is unavoidable, document why.

Do not generate unnecessarily complicated TypeScript.

Keep types understandable and maintainable.

When introducing an important TypeScript concept, prefer straightforward implementations that are easy for a developer learning TypeScript to understand.

---

# 19. AI Development Rules

AI will be used extensively during development.

AI-generated code must still follow the project's architecture and conventions.

Before implementing a feature:

1. Understand the requirement.
2. Check the existing architecture.
3. Reuse existing components.
4. Check whether a similar implementation already exists.
5. Avoid duplicate functionality.
6. Make the smallest reasonable change.
7. Validate the implementation.

Do not rewrite unrelated files.

Do not introduce new libraries without justification.

Do not change the architecture simply because another approach is possible.

---

# 20. Spec-Driven Development

For significant features, create a specification before implementation.

Specifications should explain:

* Problem
* Goal
* User
* Requirements
* Acceptance criteria
* Data requirements
* UI requirements
* Edge cases

Example:

```text
specs/
├── blog-post-management.md
├── category-system.md
├── search.md
└── authentication.md
```

The specification is the source of truth for that feature.

Implementation should satisfy the specification rather than inventing additional functionality.

---

# 21. Development Workflow

Use this general workflow for significant features:

```text
Requirement
    ↓
Specification
    ↓
Technical approach
    ↓
Implementation
    ↓
Type checking
    ↓
Linting
    ↓
Testing
    ↓
Review
```

Before considering a feature complete:

* Check TypeScript errors.
* Check ESLint.
* Check responsive behavior.
* Check accessibility.
* Check loading states.
* Check error states.
* Check empty states.
* Check SEO where relevant.
* Check that existing features were not broken.

---

# 22. UI States

Interactive features should consider:

* Default
* Hover
* Focus
* Active
* Disabled
* Loading
* Empty
* Error
* Success

Do not build only the happy path.

For data-driven pages, design appropriate loading, empty, and error states.

---

# 23. Code Organization

Prefer small, focused components.

Avoid giant components containing an entire page's logic.

Separate:

* UI
* database logic
* validation
* business logic
* reusable utilities
* types

Do not put database operations directly inside presentational components.

Do not put large business logic inside JSX.

---

# 24. Naming Conventions

Use clear and predictable names.

React components:

```text
ArticleCard
Header
Footer
CategoryBadge
SearchBar
```

Files:

```text
article-card.tsx
category-badge.tsx
search-bar.tsx
```

Functions should describe what they do:

```text
getPostBySlug()
getPublishedPosts()
createPost()
updatePost()
deletePost()
```

Avoid vague names such as:

```text
doStuff()
handleEverything()
data2()
component1()
```

---

# 25. Environment Variables

Secrets must be stored in environment variables.

Example:

```env
MONGODB_URI=
```

Never hardcode:

* database credentials
* API keys
* authentication secrets
* private tokens

Never commit `.env.local` containing secrets.

Only variables explicitly intended for browser access should use the `NEXT_PUBLIC_` prefix.

---

# 26. Security

Never trust user input.

Validate data on the server.

Do not rely only on client-side validation.

Protect admin functionality with proper authentication and authorization.

Do not expose private database information through API responses.

Avoid logging secrets or sensitive information.

---

# 27. Dependency Rules

Keep dependencies minimal.

Before installing a package, determine:

1. Is it actually necessary?
2. Can the functionality be implemented simply with existing tools?
3. Does Next.js or shadcn already provide the required functionality?
4. Will the package increase maintenance complexity?

Prefer established, actively maintained packages.

Do not install multiple libraries that solve the same problem.

---

# 28. Current Development Stage

The project is currently at the initial setup stage.

Do not assume that advanced features already exist.

Initial priorities:

1. Create the Next.js project.
2. Configure TypeScript.
3. Configure Tailwind.
4. Configure shadcn/ui.
5. Establish the ChronicleFiles design system.
6. Create the base layout.
7. Build header/navigation.
8. Build footer.
9. Build homepage.
10. Establish blog/article architecture.
11. Connect MongoDB.
12. Create content models.
13. Build public article/category pages.
14. Build the admin system.
15. Add authentication.
16. Add additional features incrementally.

Do not implement the entire roadmap at once.

---

# 29. Important Product Principle

ChronicleFiles should be treated as a real product.

When implementing a feature, consider:

* User experience
* Maintainability
* Accessibility
* SEO
* Performance
* Security
* Responsive design
* Future scalability

However, do not over-engineer.

Use the simplest architecture that can properly support the current requirement.

---

# 30. Decision-Making Rule

When multiple technically valid approaches exist:

1. Prefer the approach already consistent with the project.
2. Prefer Next.js native functionality when appropriate.
3. Prefer reusable components.
4. Prefer server-side functionality when client-side execution is unnecessary.
5. Prefer simplicity.
6. Prefer accessibility and SEO.
7. Prefer maintainability.
8. Explain significant architectural changes before making them.

Do not introduce a new architectural pattern without a reason.

---

# 31. Final Rule

ChronicleFiles should remain:

* Fast
* Clean
* Accessible
* SEO-friendly
* Responsive
* Maintainable
* Visually consistent
* Content-focused
* Easy to extend
* Easy for AI agents to understand and modify

The AI agent should always inspect the existing project before creating new architecture or duplicating functionality.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
