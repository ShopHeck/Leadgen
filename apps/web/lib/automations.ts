import { AutomationRunStatus, MessageChannel, prisma } from "@closerflow/db";
import { moveLeadToStageByName } from "./crm";
import { sendLeadMessage } from "./messaging";

export const AUTOMATION_EVENTS = ["lead.created", "lead.scored", "booking.created", "message.sent"] as const;
export type AutomationEventType = (typeof AUTOMATION_EVENTS)[number];

type AutomationCondition = {
  minScore?: number;
  scoreBand?: string;
  source?: string;
  channel?: string;
};

type SendSmsAction = {
  type: "send_sms";
  body: string;
};

type SendEmailAction = {
  type: "send_email";
  subject: string;
  body: string;
};

type AddNoteAction = {
  type: "add_note";
  body: string;
};

type MoveStageAction = {
  type: "move_stage";
  stageName: string;
};

export type AutomationAction = SendSmsAction | SendEmailAction | AddNoteAction | MoveStageAction;

type AutomationPayload = {
  leadId?: string | null;
  score?: number;
  scoreBand?: string;
  source?: string | null;
  channel?: string;
};

function parseConditions(value: unknown): AutomationCondition {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const raw = value as Record<string, unknown>;

  return {
    minScore: typeof raw.minScore === "number" ? raw.minScore : undefined,
    scoreBand: typeof raw.scoreBand === "string" && raw.scoreBand.trim() ? raw.scoreBand.trim().toUpperCase() : undefined,
    source: typeof raw.source === "string" && raw.source.trim() ? raw.source.trim().toLowerCase() : undefined,
    channel: typeof raw.channel === "string" && raw.channel.trim() ? raw.channel.trim().toUpperCase() : undefined,
  };
}

function parseActions(value: unknown): AutomationAction[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is AutomationAction => {
    if (!entry || typeof entry !== "object") {
      return false;
    }

    const type = (entry as { type?: string }).type;

    return type === "send_sms" || type === "send_email" || type === "add_note" || type === "move_stage";
  });
}

function matchesConditions(conditions: AutomationCondition, payload: AutomationPayload) {
  if (typeof conditions.minScore === "number" && (typeof payload.score !== "number" || payload.score < conditions.minScore)) {
    return false;
  }

  if (conditions.scoreBand && conditions.scoreBand !== (payload.scoreBand || "").toUpperCase()) {
    return false;
  }

  if (conditions.source && conditions.source !== (payload.source || "").toLowerCase()) {
    return false;
  }

  if (conditions.channel && conditions.channel !== (payload.channel || "").toUpperCase()) {
    return false;
  }

  return true;
}

function interpolate(template: string, context: Record<string, string | number | null | undefined>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = context[key];
    return value == null ? "" : String(value);
  });
}

function buildLeadContext(lead: { name: string; email: string | null; phone: string | null; leadScore: number; scoreBand: string }) {
  return {
    leadName: lead.name,
    leadEmail: lead.email || "",
    leadPhone: lead.phone || "",
    leadScore: lead.leadScore,
    leadScoreBand: lead.scoreBand,
  };
}

export async function emitAutomationEvent({
  workspaceId,
  eventType,
  payload,
}: {
  workspaceId: string;
  eventType: AutomationEventType;
  payload: AutomationPayload;
}) {
  const automations = await prisma.automation.findMany({
    where: {
      workspaceId,
      triggerType: eventType,
      isActive: true,
    },
  });

  const matching = automations.filter((automation) => matchesConditions(parseConditions(automation.conditionsJson), payload));

  for (const automation of matching) {
    const run = await prisma.automationRun.create({
      data: {
        automationId: automation.id,
        workspaceId,
        leadId: payload.leadId || null,
        eventType,
        payloadJson: payload,
        maxAttempts: Math.max(1, automation.maxRetries),
      },
    });

    await processAutomationRun(run.id);
  }
}

export async function processAutomationRun(runId: string) {
  const run = await prisma.automationRun.findUniqueOrThrow({
    where: {
      id: runId,
    },
    include: {
      automation: true,
      lead: true,
    },
  });

  if (!run.leadId || !run.lead) {
    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status: AutomationRunStatus.FAILED,
        attemptCount: run.attemptCount + 1,
        lastError: "Automation run has no lead context.",
        completedAt: new Date(),
      },
    });

    return;
  }

  const actions = parseActions(run.automation.actionsJson);

  if (actions.length === 0) {
    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status: AutomationRunStatus.FAILED,
        attemptCount: run.attemptCount + 1,
        lastError: "Automation has no valid actions.",
        completedAt: new Date(),
      },
    });

    return;
  }

  await prisma.automationRun.update({
    where: { id: run.id },
    data: {
      status: AutomationRunStatus.RUNNING,
      attemptCount: run.attemptCount + 1,
      startedAt: new Date(),
      nextRetryAt: null,
    },
  });

  try {
    const context = buildLeadContext(run.lead);

    for (const action of actions) {
      switch (action.type) {
        case "send_sms":
          await sendLeadMessage({
            workspaceId: run.workspaceId,
            leadId: run.leadId,
            channel: MessageChannel.SMS,
            body: interpolate(action.body, context),
          });
          break;
        case "send_email":
          await sendLeadMessage({
            workspaceId: run.workspaceId,
            leadId: run.leadId,
            channel: MessageChannel.EMAIL,
            subject: interpolate(action.subject, context),
            body: interpolate(action.body, context),
          });
          break;
        case "add_note":
          await prisma.leadNote.create({
            data: {
              workspaceId: run.workspaceId,
              leadId: run.leadId,
              body: interpolate(action.body, context),
            },
          });
          break;
        case "move_stage":
          await prisma.$transaction((tx) =>
            moveLeadToStageByName(tx, {
              workspaceId: run.workspaceId,
              leadId: run.leadId!,
              stageName: action.stageName,
              changedByUserId: null,
            }),
          );
          break;
      }
    }

    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status: AutomationRunStatus.SUCCEEDED,
        completedAt: new Date(),
        lastError: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown automation error.";
    const attemptCount = run.attemptCount + 1;
    const canRetry = attemptCount < run.maxAttempts;
    const retryDelayMinutes = Math.min(30, attemptCount * 5);

    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status: canRetry ? AutomationRunStatus.RETRY_SCHEDULED : AutomationRunStatus.FAILED,
        lastError: message,
        nextRetryAt: canRetry ? new Date(Date.now() + retryDelayMinutes * 60 * 1000) : null,
        completedAt: canRetry ? null : new Date(),
      },
    });
  }
}

export async function processDueAutomationRuns(workspaceId: string) {
  const dueRuns = await prisma.automationRun.findMany({
    where: {
      workspaceId,
      OR: [
        { status: AutomationRunStatus.PENDING },
        {
          status: AutomationRunStatus.RETRY_SCHEDULED,
          nextRetryAt: {
            lte: new Date(),
          },
        },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 20,
  });

  for (const run of dueRuns) {
    await processAutomationRun(run.id);
  }

  return dueRuns.length;
}
