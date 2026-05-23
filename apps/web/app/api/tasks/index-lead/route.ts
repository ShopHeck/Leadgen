import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@closerflow/db";
import { verifyTaskRequest } from "../../../../lib/gcp-tasks";
import { indexLead, isChromaEnabled, type LeadDocument } from "../../../../lib/chroma";

/**
 * POST /api/tasks/index-lead
 *
 * Background task handler for indexing a single lead into ChromaDB.
 * Called by GCP Cloud Tasks for non-blocking vector index updates.
 *
 * Body: { leadId: string, workspaceId: string }
 */
export async function POST(request: NextRequest) {
  if (!verifyTaskRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isChromaEnabled()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Chroma not configured." });
  }

  try {
    const { leadId } = (await request.json()) as { leadId?: string; workspaceId?: string };

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required." }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        formSubmissions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { payloadJson: true },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { body: true },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const doc: LeadDocument = {
      leadId: lead.id,
      workspaceId: lead.workspaceId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      campaign: lead.campaign,
      score: lead.leadScore,
      scoreBand: lead.scoreBand,
      status: lead.status,
      formData: lead.formSubmissions[0]?.payloadJson as Record<string, unknown> | null,
      notes: lead.notes.map((n) => n.body),
    };

    await indexLead(doc);

    return NextResponse.json({ ok: true, leadId, indexed: true });
  } catch (error) {
    console.error("[task/index-lead] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Indexing failed." },
      { status: 500 },
    );
  }
}
