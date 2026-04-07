import { prisma } from "@closerflow/db";
import { auth } from "../../../../../../../auth";
import { buildFallbackAiScore, computeLeadScore, scoreAndPersistLead } from "../../../../../../../lib/scoring";
import { NextResponse } from "next/server";

async function buildOpenAiScoreSummary(lead: {
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  campaign: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  leadScore: number;
  scoreBand: string;
  formSubmissions: Array<{ payloadJson: unknown; utmJson: unknown; createdAt: Date }>;
  notes: Array<{ body: string; createdAt: Date }>;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "You score sales leads. Return strict JSON with keys: summary (string[] of max 5), painPoint (string), closeLikelihood (high|medium|low), nextAction (string). Keep it concise and commercially useful.",
        },
        {
          role: "user",
          content: JSON.stringify({
            lead: {
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              source: lead.utmSource || lead.source,
              medium: lead.utmMedium,
              campaign: lead.utmCampaign || lead.campaign,
              score: lead.leadScore,
              band: lead.scoreBand,
            },
            latestSubmission: lead.formSubmissions[0] || null,
            recentNotes: lead.notes.slice(0, 5),
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI response did not include content.");
  }

  return JSON.parse(content) as {
    summary: string[];
    painPoint: string;
    closeLikelihood: "high" | "medium" | "low";
    nextAction: string;
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceSlug: string; leadId: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { workspaceSlug, leadId } = await params;

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
      workspace: {
        slug: workspaceSlug,
      },
    },
    select: {
      workspaceId: true,
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      workspaceId: membership.workspaceId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      source: true,
      campaign: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      utmTerm: true,
      utmContent: true,
      leadScore: true,
      scoreBand: true,
      formSubmissions: {
        orderBy: {
          createdAt: "desc",
        },
      },
      notes: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const deterministic = await scoreAndPersistLead(lead.id);
  const refreshedLead = {
    ...lead,
    leadScore: deterministic.score,
    scoreBand: deterministic.band,
  };

  try {
    const ai = await buildOpenAiScoreSummary(refreshedLead);

    if (!ai) {
      return NextResponse.json(buildFallbackAiScore(deterministic));
    }

    return NextResponse.json({
      provider: "openai",
      score: deterministic.score,
      band: deterministic.band,
      factors: deterministic.factors,
      summary: ai.summary,
      painPoint: ai.painPoint,
      closeLikelihood: ai.closeLikelihood,
      nextAction: ai.nextAction,
    });
  } catch {
    return NextResponse.json(buildFallbackAiScore(computeLeadScore(refreshedLead)));
  }
}
