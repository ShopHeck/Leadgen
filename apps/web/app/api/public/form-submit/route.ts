import { prisma } from "@closerflow/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { emitAutomationEvent } from "../../../../lib/automations";
import { ensureDefaultPipelineForWorkspace, mapStageNameToLeadStatus } from "../../../../lib/crm";
import { scoreAndPersistLead } from "../../../../lib/scoring";

const publicLeadSchema = z.object({
  workspaceSlug: z.string().min(1),
  funnelSlug: z.string().min(1).optional(),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(4).optional().or(z.literal("")),
  source: z.string().min(1).optional(),
  campaign: z.string().min(1).optional(),
  pageUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  utm: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      term: z.string().optional(),
      content: z.string().optional(),
    })
    .optional(),
});

async function parseRequest(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return publicLeadSchema.parse(await request.json());
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return publicLeadSchema.parse({
      workspaceSlug: formData.get("workspaceSlug"),
      funnelSlug: formData.get("funnelSlug"),
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      source: formData.get("source"),
      campaign: formData.get("campaign"),
      pageUrl: formData.get("pageUrl"),
      notes: formData.get("notes"),
      answers: {
        budget: formData.get("budget"),
        urgency: formData.get("urgency"),
        decisionMaker: formData.get("decisionMaker"),
        location: formData.get("location"),
      },
      utm: {
        source: formData.get("utmSource"),
        medium: formData.get("utmMedium"),
        campaign: formData.get("utmCampaign"),
        term: formData.get("utmTerm"),
        content: formData.get("utmContent"),
      },
    });
  }

  throw new Error("Unsupported content type.");
}

export async function POST(request: NextRequest) {
  try {
    const input = await parseRequest(request);

    const workspace = await prisma.workspace.findUnique({
      where: {
        slug: input.workspaceSlug,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    const { firstStage } = await ensureDefaultPipelineForWorkspace(prisma, workspace.id);

    const funnel = input.funnelSlug
      ? await prisma.funnel.findFirst({
          where: {
            workspaceId: workspace.id,
            slug: input.funnelSlug,
          },
        })
      : null;

    const payloadJson = {
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      notes: input.notes || null,
      answers: input.answers || null,
      source: input.source || null,
      campaign: input.campaign || null,
    };

    const result = await prisma.$transaction(async (tx) => {
      const contactFilters: Array<{ email: string } | { phone: string }> = [];

      if (input.email) {
        contactFilters.push({ email: input.email });
      }

      if (input.phone) {
        contactFilters.push({ phone: input.phone });
      }

      const existingLead =
        contactFilters.length > 0
          ? await tx.lead.findFirst({
              where: {
                workspaceId: workspace.id,
                OR: contactFilters,
              },
            })
          : null;

      const lead = existingLead
        ? await tx.lead.update({
            where: {
              id: existingLead.id,
            },
            data: {
              name: input.name,
              email: input.email || existingLead.email,
              phone: input.phone || existingLead.phone,
              source: input.source || input.utm?.source || existingLead.source,
              campaign: input.campaign || input.utm?.campaign || existingLead.campaign,
              utmSource: input.utm?.source || existingLead.utmSource,
              utmMedium: input.utm?.medium || existingLead.utmMedium,
              utmCampaign: input.utm?.campaign || existingLead.utmCampaign,
              utmTerm: input.utm?.term || existingLead.utmTerm,
              utmContent: input.utm?.content || existingLead.utmContent,
              pipelineStageId: existingLead.pipelineStageId || firstStage.id,
              status: existingLead.pipelineStageId ? existingLead.status : mapStageNameToLeadStatus(firstStage.name),
            },
          })
        : await tx.lead.create({
            data: {
              workspaceId: workspace.id,
              name: input.name,
              email: input.email || null,
              phone: input.phone || null,
              source: input.source || input.utm?.source || null,
              campaign: input.campaign || input.utm?.campaign || null,
              utmSource: input.utm?.source || null,
              utmMedium: input.utm?.medium || null,
              utmCampaign: input.utm?.campaign || null,
              utmTerm: input.utm?.term || null,
              utmContent: input.utm?.content || null,
              pipelineStageId: firstStage.id,
              status: mapStageNameToLeadStatus(firstStage.name),
            },
          });

      if (!existingLead || !existingLead.pipelineStageId) {
        await tx.leadStageHistory.create({
          data: {
            workspaceId: workspace.id,
            leadId: lead.id,
            fromStageId: existingLead?.pipelineStageId ?? null,
            toStageId: firstStage.id,
            changedByUserId: null,
          },
        });
      }

      const submission = await tx.formSubmission.create({
        data: {
          workspaceId: workspace.id,
          funnelId: funnel?.id ?? null,
          leadId: lead.id,
          payloadJson,
          utmJson: input.utm || undefined,
          pageUrl: input.pageUrl || null,
        },
      });

      return { lead, submission };
    });

    await emitAutomationEvent({
      workspaceId: workspace.id,
      eventType: "lead.created",
      payload: {
        leadId: result.lead.id,
        source: result.lead.utmSource || result.lead.source,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        leadId: result.lead.id,
        submissionId: result.submission.id,
        workspaceId: workspace.id,
        scoring: await scoreAndPersistLead(result.lead.id),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid payload.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 400 },
    );
  }
}
