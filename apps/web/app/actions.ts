"use server";

import { prisma } from "@closerflow/db";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut } from "../auth";
import { requireSessionUser } from "../lib/auth-guards";
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
