import { NextRequest, NextResponse } from "next/server";
import { verifyTaskRequest } from "../../../../lib/gcp-tasks";
import { scoreAndPersistLead } from "../../../../lib/scoring";
import { indexLead, isChromaEnabled } from "../../../../lib/chroma";
import { prisma } from "@closerflow/db";
import { trackServerEvent } from "../../../../lib/posthog";
import { EVENTS } from "../../../../lib/posthog-events";

/**
 * POST /api/tasks/score-lead
 *
 * Background task handler for lead scoring.
 * Called by GCP Cloud Tasks to offload scoring from the request path.
 *
 * Body: { leadId: string }
 */
export async function POST(request: NextRequest) {
  if (!verifyTaskRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { leadId } = (await request.json()) as { leadId?: string };

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required." }, { status: 400 });
    }

    const result = await scoreAndPersistLead(leadId);

    // Track scoring event
    trackServerEvent(leadId, EVENTS.LEAD_SCORED, {
      score: result.score,
      band: result.band,
      factors_count: result.factors.length,
    });

    // Update the vector index with the new score
    if (isChromaEnabled()) {
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

      if (lead) {
        indexLead({
          leadId: lead.id,
          workspaceId: lead.workspaceId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          campaign: lead.campaign,
          score: result.score,
          scoreBand: result.band,
          status: lead.status,
          formData: lead.formSubmissions[0]?.payloadJson as Record<string, unknown> | null,
          notes: lead.notes.map((n) => n.body),
        }).catch((err) => console.error("[chroma] Index update failed:", err));
      }
    }

    return NextResponse.json({ ok: true, leadId, score: result.score, band: result.band });
  } catch (error) {
    console.error("[task/score-lead] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scoring failed." },
      { status: 500 },
    );
  }
}
