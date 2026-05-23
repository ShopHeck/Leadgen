import { prisma } from "@closerflow/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceMember } from "../../../../../lib/auth-guards";
import { isChromaEnabled, searchLeads, searchMessages, searchNotes } from "../../../../../lib/chroma";
import { trackServerEvent } from "../../../../../lib/posthog";
import { EVENTS } from "../../../../../lib/posthog-events";

/**
 * POST /api/workspaces/[workspaceSlug]/search
 *
 * Semantic search across leads, messages, and notes using ChromaDB vectors.
 *
 * Request body:
 * {
 *   "query": "leads interested in premium services",
 *   "scope": "leads" | "messages" | "notes" | "all",
 *   "filters": { "scoreBand": "HOT", "source": "google" },
 *   "limit": 10
 * }
 */

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  scope: z.enum(["leads", "messages", "notes", "all"]).default("all"),
  filters: z
    .object({
      scoreBand: z.string().optional(),
      status: z.string().optional(),
      source: z.string().optional(),
      leadId: z.string().optional(),
      channel: z.string().optional(),
    })
    .optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  try {
    const { workspaceSlug } = await params;
    const { user, workspace } = await requireWorkspaceMember(workspaceSlug);

    if (!isChromaEnabled()) {
      return NextResponse.json(
        { error: "Semantic search is not configured. Set CHROMA_URL and OPENAI_API_KEY." },
        { status: 503 },
      );
    }

    const body = searchSchema.parse(await request.json());

    const results: Record<string, unknown[]> = {};

    if (body.scope === "leads" || body.scope === "all") {
      results.leads = await searchLeads(workspace.id, body.query, body.limit, {
        scoreBand: body.filters?.scoreBand,
        status: body.filters?.status,
        source: body.filters?.source,
      });
    }

    if (body.scope === "messages" || body.scope === "all") {
      results.messages = await searchMessages(workspace.id, body.query, {
        leadId: body.filters?.leadId,
        channel: body.filters?.channel,
        limit: body.limit,
      });
    }

    if (body.scope === "notes" || body.scope === "all") {
      results.notes = await searchNotes(workspace.id, body.query, {
        leadId: body.filters?.leadId,
        limit: body.limit,
      });
    }

    // Track search usage
    trackServerEvent(user.id, EVENTS.SEMANTIC_SEARCH_PERFORMED, {
      workspace_id: workspace.id,
      query_length: body.query.length,
      scope: body.scope,
      results_count: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
    });

    return NextResponse.json({
      ok: true,
      query: body.query,
      scope: body.scope,
      results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request.", issues: error.issues }, { status: 400 });
    }

    console.error("[search] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed." },
      { status: 500 },
    );
  }
}
