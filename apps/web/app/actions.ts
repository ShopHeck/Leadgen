"use server";

import { Prisma, prisma } from "@closerflow/db";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut } from "../auth";
import { requireSessionUser, requireWorkspaceRole } from "../lib/auth-guards";
import { processDueAutomationRuns } from "../lib/automations";
import { createOrUpdateAppointment } from "../lib/bookings";
import { ensureDefaultPipelineForWorkspace } from "../lib/crm";
import { sendLeadMessage } from "../lib/messaging";
import { scoreAndPersistLead } from "../lib/scoring";
import { slugify } from "../lib/slugify";

export type AuthActionState = {
  error?: string;
};

export type LeadMessageActionState = {
  error?: string;
  success?: string;
};

export async function signUpAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password || password.length < 8) {
    return { error: "Use a valid email and a password with at least 8 characters." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      firstName: firstName || null,
      lastName: lastName || null,
      passwordHash,
    },
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/app",
  });

  return {};
}

export async function signInAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/app");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/app",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }

    throw error;
  }

  return {};
}

export async function signOutAction() {
  await signOut({
    redirectTo: "/",
  });
}

export async function createWorkspaceAction(formData: FormData) {
  const user = await requireSessionUser();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    redirect("/app?error=workspace-name");
  }

  const baseSlug = slugify(name);
  const slug = baseSlug || `workspace-${Date.now()}`;

  const existingCount = await prisma.workspace.count({
    where: {
      slug: {
        startsWith: slug,
      },
    },
  });

  const finalSlug = existingCount === 0 ? slug : `${slug}-${existingCount + 1}`;

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug: finalSlug,
      members: {
        create: {
          userId: user.id,
          role: "ADMIN",
        },
      },
    },
  });

  await ensureDefaultPipelineForWorkspace(prisma, workspace.id);

  redirect(`/app/${workspace.slug}`);
}

export async function createLeadNoteAction(workspaceSlug: string, leadId: string, formData: FormData) {
  const user = await requireSessionUser();
  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    redirect(`/app/${workspaceSlug}/leads/${leadId}?error=note-required`);
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspace: {
        slug: workspaceSlug,
      },
      userId: user.id,
    },
    select: {
      workspaceId: true,
    },
  });

  if (!membership) {
    redirect("/app");
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      workspaceId: membership.workspaceId,
    },
    select: {
      id: true,
    },
  });

  if (!lead) {
    redirect(`/app/${workspaceSlug}/crm`);
  }

  await prisma.leadNote.create({
    data: {
      workspaceId: membership.workspaceId,
      leadId,
      authorUserId: user.id,
      body,
    },
  });

  await scoreAndPersistLead(leadId);

  revalidatePath(`/app/${workspaceSlug}/leads/${leadId}`);
  redirect(`/app/${workspaceSlug}/leads/${leadId}`);
}

export async function sendLeadMessageAction(
  workspaceSlug: string,
  leadId: string,
  _: LeadMessageActionState,
  formData: FormData,
): Promise<LeadMessageActionState> {
  const user = await requireSessionUser();
  const channel = String(formData.get("channel") ?? "").trim().toUpperCase();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (channel !== "SMS" && channel !== "EMAIL") {
    return { error: "Select SMS or Email." };
  }

  if (!body) {
    return { error: "Message body is required." };
  }

  if (channel === "EMAIL" && !subject) {
    return { error: "Email subject is required." };
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspace: {
        slug: workspaceSlug,
      },
      userId: user.id,
    },
    select: {
      workspaceId: true,
    },
  });

  if (!membership) {
    return { error: "You do not have access to that workspace." };
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      workspaceId: membership.workspaceId,
    },
    select: {
      id: true,
    },
  });

  if (!lead) {
    return { error: "Lead not found." };
  }

  try {
    await sendLeadMessage({
      workspaceId: membership.workspaceId,
      leadId,
      channel,
      subject: subject || null,
      body,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to send message.",
    };
  }

  revalidatePath(`/app/${workspaceSlug}/leads/${leadId}`);
  revalidatePath(`/app/${workspaceSlug}/messages`);

  return {
    success: `${channel === "SMS" ? "SMS" : "Email"} sent successfully.`,
  };
}

export async function createAutomationAction(workspaceSlug: string, formData: FormData) {
  const membership = await requireWorkspaceRole(workspaceSlug, "ADMIN");

  if (!membership) {
    redirect(`/app/${workspaceSlug}/automations?error=forbidden`);
  }

  const name = String(formData.get("name") ?? "").trim();
  const triggerType = String(formData.get("triggerType") ?? "").trim();
  const actionType = String(formData.get("actionType") ?? "").trim();
  const actionBody = String(formData.get("actionBody") ?? "").trim();
  const actionSubject = String(formData.get("actionSubject") ?? "").trim();
  const targetStage = String(formData.get("targetStage") ?? "").trim();
  const scoreBand = String(formData.get("scoreBand") ?? "").trim().toUpperCase();
  const source = String(formData.get("source") ?? "").trim().toLowerCase();
  const channel = String(formData.get("channel") ?? "").trim().toUpperCase();
  const minScoreValue = String(formData.get("minScore") ?? "").trim();
  const maxRetriesValue = String(formData.get("maxRetries") ?? "").trim();

  if (!name || !triggerType || !actionType) {
    redirect(`/app/${workspaceSlug}/automations?error=missing-fields`);
  }

  const minScore = minScoreValue ? Number(minScoreValue) : undefined;
  const maxRetries = maxRetriesValue ? Number(maxRetriesValue) : 3;

  const conditions: Record<string, Prisma.InputJsonValue> = {};

  if (typeof minScore === "number" && Number.isFinite(minScore)) {
    conditions.minScore = minScore;
  }

  if (scoreBand) {
    conditions.scoreBand = scoreBand;
  }

  if (source) {
    conditions.source = source;
  }

  if (channel) {
    conditions.channel = channel;
  }

  let action: Record<string, Prisma.InputJsonValue>;

  switch (actionType) {
    case "send_sms":
      action = { type: actionType, body: actionBody };
      break;
    case "send_email":
      action = { type: actionType, subject: actionSubject, body: actionBody };
      break;
    case "add_note":
      action = { type: actionType, body: actionBody };
      break;
    case "move_stage":
      action = { type: actionType, stageName: targetStage };
      break;
    default:
      redirect(`/app/${workspaceSlug}/automations?error=invalid-action`);
  }

  await prisma.automation.create({
    data: {
      workspaceId: membership.workspaceId,
      name,
      triggerType,
      conditionsJson: conditions as Prisma.InputJsonObject,
      actionsJson: [action] as Prisma.InputJsonArray,
      maxRetries: Number.isFinite(maxRetries) ? Math.max(1, Math.min(5, maxRetries)) : 3,
    },
  });

  revalidatePath(`/app/${workspaceSlug}/automations`);
  redirect(`/app/${workspaceSlug}/automations`);
}

export async function processAutomationRunsAction(workspaceSlug: string) {
  const membership = await requireWorkspaceRole(workspaceSlug, "ADMIN");

  if (!membership) {
    redirect(`/app/${workspaceSlug}/automations?error=forbidden`);
  }

  await processDueAutomationRuns(membership.workspaceId);
  revalidatePath(`/app/${workspaceSlug}/automations`);
  redirect(`/app/${workspaceSlug}/automations`);
}

export async function createAppointmentAction(workspaceSlug: string, leadId: string, formData: FormData) {
  const user = await requireSessionUser();
  const startAtValue = String(formData.get("startAt") ?? "").trim();
  const endAtValue = String(formData.get("endAt") ?? "").trim();
  const inviteeName = String(formData.get("inviteeName") ?? "").trim();
  const inviteeEmail = String(formData.get("inviteeEmail") ?? "").trim().toLowerCase();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!startAtValue) {
    redirect(`/app/${workspaceSlug}/leads/${leadId}?error=booking-start-required`);
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspace: {
        slug: workspaceSlug,
      },
      userId: user.id,
    },
    select: {
      workspaceId: true,
    },
  });

  if (!membership) {
    redirect("/app");
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      workspaceId: membership.workspaceId,
    },
    select: {
      id: true,
    },
  });

  if (!lead) {
    redirect(`/app/${workspaceSlug}/crm`);
  }

  await createOrUpdateAppointment({
    workspaceId: membership.workspaceId,
    leadId,
    startAt: new Date(startAtValue),
    endAt: endAtValue ? new Date(endAtValue) : null,
    inviteeName: inviteeName || null,
    inviteeEmail: inviteeEmail || null,
    notes: notes || null,
    provider: "MANUAL",
    status: "SCHEDULED",
  });

  revalidatePath(`/app/${workspaceSlug}/leads/${leadId}`);
  revalidatePath(`/app/${workspaceSlug}/bookings`);
  revalidatePath(`/app/${workspaceSlug}/crm`);
  redirect(`/app/${workspaceSlug}/leads/${leadId}`);
}
