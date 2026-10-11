# AI Workflow for ChronicleFiles

This file defines the expected operating pattern for future AI agents working on this repository.

## Before starting work

1. Read AGENTS.md.
2. Read .ai/README.md.
3. Read .ai/current-state.md.
4. Read the relevant architecture or feature document.
5. Read process.md.
6. Inspect the actual source code and the relevant files.
7. Identify the root cause or actual behavior before making any changes.

## During implementation

- make the smallest required change
- preserve working functionality
- avoid redesigning unrelated features
- do not add unnecessary dependencies
- do not create duplicate state unnecessarily
- do not change the data model without a clear reason
- prefer the existing implementation patterns already used by the project
- keep app security in mind and do not expose secrets or private values in output
- treat the code as the final source of truth when docs disagree with implementation

## Validation guidance

Use a focused validation flow:

Understand
→ Implement
→ Inspect changed code
→ Targeted verification
→ Update documentation
→ Done

Do not require a full build or lint pass after every tiny documentation-only change. Use broader checks when any of the following applies:

- configuration changes
- dependency changes
- schema changes
- auth changes
- major architecture changes
- the task specifically requires a broader validation pass

## Verification rules

When working on the app itself, prefer targeted validation that matches the change:
- TypeScript compile check if a type-related change is involved
- focused lint or build when required by the change
- browser or route verification when UI behavior is involved
- actual live DB / Cloudinary validation when persistence and media integration are involved

## After completing work

Update the following documentation if the work changed behavior or project state:

- .ai/current-state.md
- .ai/known-issues.md
- .ai/changelog.md
- process.md

This keeps the project handoff accurate for future tools and agents.

## Safety rules

- never document passwords, MongoDB URIs, Cloudinary secrets, tokens, session secrets, or API keys
- document only variable names such as `MONGODB_URI` or `ADMIN_SESSION_SECRET`
- do not treat unchecked assumptions as confirmed facts
- separate known issues from unverified suspicions

## Continuation principle

A new AI agent should be able to continue using the repository without needing a detailed memory of the previous work. The purpose of this folder is precisely to provide a portable project context that survives tool, account, or session changes.
