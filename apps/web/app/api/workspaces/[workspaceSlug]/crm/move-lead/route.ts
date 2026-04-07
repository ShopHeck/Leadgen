import { prisma } from "@closerflow/db";
import { auth } from "../../../../../../auth";
import { ensureDefaultPipelineForWorkspace, moveLeadToStage } from "../../../../../../lib/crm";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const moveLeadSchema = z.object({
  leadId: z.string().min(1),
  toStageId: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const input = moveLeadSchema.parse(await request.json());
    const { workspaceSlug } = await params;

    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspace: {
          slug: workspaceSlug,
        },
      },
      include: {
        workspace: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { pipeline } = await ensureDefaultPipelineForWorkspace(prisma, membership.workspaceId);

    const lead = await prisma.lead.findFirst({
      where: {
        id: input.leadId,
        workspaceId: membership.workspaceId,
      },
      select: {
        id: true,
        pipelineStageId: true,
      },
    });

    const targetStage = await prisma.pipelineStage.findFirst({
      where: {
        id: input.toStageId,
        pipelineId: pipeline.id,
      },
    });

    if (!lead || !targetStage) {
      return NextResponse.json({ error: "Lead or target stage not found." }, { status: 404 });
    }

    if (lead.pipelineStageId === targetStage.id) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    await prisma.$transaction((tx) =>
      moveLeadToStage(tx, {
        workspaceId: membership.workspaceId,
        leadId: lead.id,
        toStageId: targetStage.id,
        changedByUserId: session.user.id,
      }),
    );

    revalidatePath(`/app/${workspaceSlug}/crm`);
    revalidatePath(`/app/${workspaceSlug}/leads/${lead.id}`);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload.", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 },
    );
  }
}
