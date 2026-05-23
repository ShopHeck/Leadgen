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

This repo currently includes Tasks 1 through 8 from `tasks/codex-tasks.md`:

- monorepo scaffold with Next.js, TypeScript, Tailwind, and Prisma
- Auth.js credential auth with signup, signin, and protected `/app` routes
- workspace creation plus admin/member role checks
- public lead capture endpoint at `/api/public/form-submit`
- UTM-aware lead ingestion into `Lead` and `FormSubmission`
- CRM board with stage history, lead notes, and lead detail pages
- deterministic lead scoring plus protected AI score analysis endpoint
- Twilio/Resend messaging with lead-level and workspace-level message logs
- event-based automations with runs and retry handling
- manual and Calendly-driven booking capture with appointment tracking

---

## Integrations

### PostHog — Product Analytics

Real-time product analytics, session replays, and feature flags.

**Files:**
- `apps/web/lib/posthog.ts` — Server-side client (API routes, server actions)
- `apps/web/lib/posthog-client.tsx` — React provider with auto page views, identify, and group analytics
- `apps/web/lib/posthog-events.ts` — Centralized event name constants

**What's tracked:**
- Lead lifecycle: creation, scoring, stage changes, won/lost
- Messaging: sent, delivered, failed
- Automations: created, run started/completed/failed
- Bookings: booked, completed, no-show
- CRM UI: board views, lead detail views, note additions
- Billing: checkout started, subscription created/upgraded/canceled
- AI features: score requests, follow-up generation, semantic search

**Setup:**
1. Sign up at [posthog.com](https://posthog.com) (free: 1M events/month)
2. Copy Project API Key → `NEXT_PUBLIC_POSTHOG_KEY` and `POSTHOG_API_KEY`
3. Set `NEXT_PUBLIC_POSTHOG_HOST` (default: `https://us.i.posthog.com`)

**Client-side usage:**
```tsx
import { trackEvent, identifyPostHogUser, setPostHogWorkspace } from "@/lib/posthog-client";

// After login
identifyPostHogUser({ id: user.id, email: user.email });
setPostHogWorkspace({ id: workspace.id, slug: workspace.slug, name: workspace.name, plan: "GROWTH" });

// Track custom events
trackEvent("crm_lead_moved", { from_stage: "New", to_stage: "Qualified" });
```

**Server-side usage:**
```ts
import { trackServerEvent } from "@/lib/posthog";
import { EVENTS } from "@/lib/posthog-events";

trackServerEvent(leadId, EVENTS.LEAD_CREATED, { workspace_id, source: "google" });
```

---

### ChromaDB — Semantic Vector Search

Embeddings-powered search for leads, messages, and notes with RAG support.

**Files:**
- `apps/web/lib/chroma.ts` — Full vector store: indexing, search, RAG context builder
- `apps/web/app/api/workspaces/[workspaceSlug]/search/route.ts` — Semantic search endpoint
- `apps/web/app/api/workspaces/[workspaceSlug]/reindex/route.ts` — Bulk reindex endpoint (admin)

**Capabilities:**
- Index leads, messages, and notes as vector embeddings
- Semantic search with metadata filtering (score band, status, source, channel)
- RAG context builder for augmenting AI prompts with relevant workspace data
- Batch indexing for bulk import/migration
- Automatic indexing on new lead creation

**Setup:**
1. Run Chroma locally: `docker run -p 8000:8000 chromadb/chroma`
   Or use [Chroma Cloud](https://www.trychroma.com/)
2. Set `CHROMA_URL=http://localhost:8000` (or your cloud URL)
3. Set `CHROMA_API_KEY` if using Chroma Cloud
4. Ensure `OPENAI_API_KEY` is set (used for embedding generation)

**API Usage:**
```bash
# Semantic search
curl -X POST /api/workspaces/my-workspace/search \
  -H "Content-Type: application/json" \
  -d '{"query": "leads who mentioned budget concerns", "scope": "leads", "limit": 10}'

# Bulk reindex (admin only)
curl -X POST /api/workspaces/my-workspace/reindex
```

**Programmatic usage:**
```ts
import { searchLeads, buildRAGContext } from "@/lib/chroma";

// Find similar leads
const results = await searchLeads(workspaceId, "high budget enterprise client", 5);

// Build AI context
const context = await buildRAGContext(workspaceId, "What are this lead's concerns?", { leadId });
```

---

### Google Cloud Tasks — Background Job Processing

Production-grade task queue for automations, scoring, messaging, and indexing.

**Files:**
- `apps/web/lib/gcp-tasks.ts` — Cloud Tasks client with specialized task creators
- `apps/web/app/api/tasks/score-lead/route.ts` — Background lead scoring handler
- `apps/web/app/api/tasks/send-message/route.ts` — Background message delivery handler
- `apps/web/app/api/tasks/index-lead/route.ts` — Background Chroma indexing handler
- `apps/web/app/api/tasks/reindex-workspace/route.ts` — Background full reindex handler

**Task Queues:**
| Queue | Purpose | Use Case |
|-------|---------|----------|
| `closerflow-automations` | Automation run processing | Delayed retries, event-triggered actions |
| `closerflow-scoring` | Background lead scoring | Offload AI scoring from request path |
| `closerflow-messaging` | SMS/Email delivery | Rate-limited bulk sends, campaign blasts |
| `closerflow-indexing` | Vector index updates | Non-blocking Chroma writes |

**Setup:**
1. Create a GCP project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the **Cloud Tasks API**
3. Create a service account with **Cloud Tasks Enqueuer** role
4. Create queues:
   ```bash
   gcloud tasks queues create closerflow-automations --location=us-central1
   gcloud tasks queues create closerflow-scoring --location=us-central1
   gcloud tasks queues create closerflow-messaging --location=us-central1
   gcloud tasks queues create closerflow-indexing --location=us-central1
   ```
5. Set environment variables:
   ```
   GCP_TASKS_ENABLED=true
   GCP_PROJECT_ID=your-project-id
   GCP_LOCATION=us-central1
   GCP_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   GCP_TASKS_AUTH_TOKEN=your-auth-token
   ```

**Programmatic usage:**
```ts
import { enqueueLeadScoring, enqueueBulkMessages, enqueueWorkspaceReindex } from "@/lib/gcp-tasks";

// Score a lead in the background
await enqueueLeadScoring(leadId);

// Send a bulk campaign (staggered 2s apart)
await enqueueBulkMessages(workspaceId, leadIds, templateId, "EMAIL", { delayBetweenSeconds: 2 });

// Trigger full workspace reindex
await enqueueWorkspaceReindex(workspaceId);
```

**Fallback behavior:**
The queue system (`lib/queue.ts`) tries QStash first, then falls back to GCP Cloud Tasks if configured. If neither is available, the daily Vercel cron catches pending work.

