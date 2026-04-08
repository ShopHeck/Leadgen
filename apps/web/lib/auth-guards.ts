import { prisma, WorkspacePlan, WorkspaceRole } from "@closerflow/db";
import { redirect } from "next/navigation";
import { auth } from "../auth";
import { WorkspaceFeature, hasWorkspaceFeature } from "./billing";

export async function requireSessionUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user;
}

export async function getWorkspaceMembership(workspaceSlug: string) {
  const user = await requireSessionUser();

  return prisma.workspaceMember.findFirst({
    where: {
      userId: user.id,
      workspace: {
        slug: workspaceSlug,
      },
    },
    include: {
      workspace: true,
      user: true,
    },
  });
}

export async function requireWorkspaceMembership(workspaceSlug: string) {
  const membership = await getWorkspaceMembership(workspaceSlug);

  if (!membership) {
    redirect("/app");
  }

  return membership;
}

export async function requireWorkspaceRole(workspaceSlug: string, role: WorkspaceRole) {
  const membership = await requireWorkspaceMembership(workspaceSlug);

  if (membership.role !== role) {
    return null;
  }

  return membership;
}

export async function requireWorkspaceFeature(workspaceSlug: string, feature: WorkspaceFeature) {
  const membership = await requireWorkspaceMembership(workspaceSlug);

  return {
    membership,
    enabled: hasWorkspaceFeature(membership.workspace.plan as WorkspacePlan, feature),
  };
}
