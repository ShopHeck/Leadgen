import { prisma, LeadStatus, Prisma } from "@closerflow/db";

export const DEFAULT_PIPELINE_NAME = "Lifecycle";
export const DEFAULT_PIPELINE_STAGES = [
  "New",
  "Attempting Contact",
  "Qualified",
  "Booked",
  "Confirmed",
  "Showed",
  "Won",
  "Lost",
  "Nurture",
] as const;

export function mapStageNameToLeadStatus(stageName: string): LeadStatus {
  switch (stageName) {
    case "Attempting Contact":
      return LeadStatus.ATTEMPTING_CONTACT;
    case "Qualified":
      return LeadStatus.QUALIFIED;
    case "Booked":
      return LeadStatus.BOOKED;
    case "Confirmed":
      return LeadStatus.CONFIRMED;
    case "Showed":
      return LeadStatus.SHOWED;
    case "Won":
      return LeadStatus.WON;
    case "Lost":
      return LeadStatus.LOST;
    case "Nurture":
      return LeadStatus.NURTURE;
    case "New":
    default:
      return LeadStatus.NEW;
  }
}

type PrismaClientLike = typeof prisma | Prisma.TransactionClient;

export async function findWorkspaceStageByName(db: PrismaClientLike, workspaceId: string, stageName: string) {
  const { pipeline } = await ensureDefaultPipelineForWorkspace(db, workspaceId);

  return db.pipelineStage.findFirst({
    where: {
      pipelineId: pipeline.id,
      name: stageName,
    },
  });
}

export async function moveLeadToStage(
  db: PrismaClientLike,
  {
    workspaceId,
    leadId,
    toStageId,
    changedByUserId,
  }: {
    workspaceId: string;
    leadId: string;
    toStageId: string;
    changedByUserId?: string | null;
  },
) {
  const lead = await db.lead.findFirst({
    where: {
      id: leadId,
      workspaceId,
    },
    select: {
      id: true,
      pipelineStageId: true,
    },
  });

  if (!lead) {
    throw new Error("Lead not found.");
  }

  if (lead.pipelineStageId === toStageId) {
    return lead;
  }

  const targetStage = await db.pipelineStage.findUnique({
    where: {
      id: toStageId,
    },
  });

  if (!targetStage) {
    throw new Error("Target stage not found.");
  }

  await db.lead.update({
    where: {
      id: lead.id,
    },
    data: {
      pipelineStageId: targetStage.id,
      status: mapStageNameToLeadStatus(targetStage.name),
    },
  });

  await db.leadStageHistory.create({
    data: {
      workspaceId,
      leadId: lead.id,
      fromStageId: lead.pipelineStageId,
      toStageId: targetStage.id,
      changedByUserId: changedByUserId ?? null,
    },
  });

  return lead;
}

export async function moveLeadToStageByName(
  db: PrismaClientLike,
  {
    workspaceId,
    leadId,
    stageName,
    changedByUserId,
  }: {
    workspaceId: string;
    leadId: string;
    stageName: string;
    changedByUserId?: string | null;
  },
) {
  const stage = await findWorkspaceStageByName(db, workspaceId, stageName);

  if (!stage) {
    throw new Error(`Stage "${stageName}" not found.`);
  }

  return moveLeadToStage(db, {
    workspaceId,
    leadId,
    toStageId: stage.id,
    changedByUserId,
  });
}

export async function ensureDefaultPipelineForWorkspace(db: PrismaClientLike, workspaceId: string) {
  let pipeline = await db.pipeline.findFirst({
    where: {
      workspaceId,
      isDefault: true,
    },
    include: {
      stages: {
        orderBy: {
          orderIndex: "asc",
        },
      },
    },
  });

  if (!pipeline) {
    pipeline = await db.pipeline.create({
      data: {
        workspaceId,
        name: DEFAULT_PIPELINE_NAME,
        isDefault: true,
        stages: {
          create: DEFAULT_PIPELINE_STAGES.map((name, index) => ({
            name,
            orderIndex: index,
          })),
        },
      },
      include: {
        stages: {
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
    });
  } else if (pipeline.stages.length !== DEFAULT_PIPELINE_STAGES.length) {
      const existingStageNames = new Set(pipeline.stages.map((stage) => stage.name));

    const missingStages = DEFAULT_PIPELINE_STAGES.filter((stage) => !existingStageNames.has(stage));

    if (missingStages.length > 0) {
      await db.pipeline.update({
        where: { id: pipeline.id },
        data: {
          stages: {
            create: missingStages.map((name, offset) => ({
              name,
              orderIndex: pipeline!.stages.length + offset,
            })),
          },
        },
      });

      pipeline = await db.pipeline.findUniqueOrThrow({
        where: { id: pipeline.id },
        include: {
          stages: {
            orderBy: {
              orderIndex: "asc",
            },
          },
        },
      });
    }
  }

  const firstStage = pipeline.stages[0];

  if (!firstStage) {
    throw new Error("Default pipeline must contain at least one stage.");
  }

  const leadsMissingStage = await db.lead.findMany({
    where: {
      workspaceId,
      pipelineStageId: null,
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  if (leadsMissingStage.length > 0) {
    await db.lead.updateMany({
      where: {
        id: {
          in: leadsMissingStage.map((lead) => lead.id),
        },
      },
      data: {
        pipelineStageId: firstStage.id,
        status: mapStageNameToLeadStatus(firstStage.name),
      },
    });

    await db.leadStageHistory.createMany({
      data: leadsMissingStage.map((lead) => ({
        workspaceId,
        leadId: lead.id,
        fromStageId: null,
        toStageId: firstStage.id,
        changedByUserId: null,
        createdAt: lead.createdAt,
      })),
    });
  }

  return { pipeline, firstStage };
}
