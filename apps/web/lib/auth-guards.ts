import { prisma, WorkspaceRole } from "@closerflow/db";
import { redirect } from "next/navigation";
import { auth } from "../auth";

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
