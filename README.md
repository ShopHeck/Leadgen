# CloserFlow AI

Monorepo scaffold for an AI-powered lead capture, qualification, nurture, booking, CRM, and attribution platform.

## Workspace layout

- `apps/web`: Next.js app for the SaaS dashboard and public-facing surfaces
- `packages/db`: Prisma schema and shared database client
- `packages/types`: shared domain types
- `packages/ui`: shared UI primitives and helpers

## Getting started

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Generate the Prisma client with `npm run db:generate`.
4. Start the app with `npm run dev`.

## Current scope

This repo currently includes Tasks 1 through 5 from `tasks/codex-tasks.md`:

- monorepo scaffold with Next.js, TypeScript, Tailwind, and Prisma
- Auth.js credential auth with signup, signin, and protected `/app` routes
- workspace creation plus admin/member role checks
- public lead capture endpoint at `/api/public/form-submit`
- UTM-aware lead ingestion into `Lead` and `FormSubmission`
- CRM board with stage history, lead notes, and lead detail pages
- deterministic lead scoring plus protected AI score analysis endpoint
