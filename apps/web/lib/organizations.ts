import { prisma } from "@closerflow/db";
import { slugify } from "./slugify";

export type CreateOrganizationInput = {
  name: string;
  ownerUserId: string;
  logoUrl?: string;
  brandColor?: string;
  customDomain?: string;
};

export type CreateSubWorkspaceInput = {
  organizationId: string;
  name: string;
  ownerUserId: string;
};

/**
 * Create a new organization (agency account) with the creator as OWNER.
 */
export async function createOrganization(input: CreateOrganizationInput) {
  const slug = slugify(input.name);

  // Ensure unique slug
  let finalSlug = slug;
  let attempt = 0;
  while (await prisma.organization.findUnique({ where: { slug: finalSlug } })) {
    attempt++;
    finalSlug = `${slug}-${attempt}`;
  }

  const organization = await prisma.organization.create({
    data: {
      name: input.name,
      slug: finalSlug,
      logoUrl: input.logoUrl || null,
      brandColor: input.brandColor || "#6366f1",
      customDomain: input.customDomain || null,
      members: {
        create: {
          userId: input.ownerUserId,
          role: "OWNER",
        },
      },
    },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  return organization;
}

/**
 * Create a sub-workspace under an organization.
 * The organization owner/admin becomes the workspace admin.
 */
export async function createSubWorkspace(input: CreateSubWorkspaceInput) {
  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: { id: true, name: true, isActive: true },
  });

  if (!org) throw new Error("Organization not found.");
  if (!org.isActive) throw new Error("Organization is inactive.");

  // Verify user is OWNER or ADMIN of the org
  const membership = await prisma.organizationMember.findFirst({
    where: {
      organizationId: input.organizationId,
      userId: input.ownerUserId,
      role: { in: ["OWNER", "ADMIN"] },
    },
  });

  if (!membership) throw new Error("Only organization owners/admins can create sub-workspaces.");

  const slug = slugify(input.name);
  let finalSlug = slug;
  let attempt = 0;
  while (await prisma.workspace.findUnique({ where: { slug: finalSlug } })) {
    attempt++;
    finalSlug = `${slug}-${attempt}`;
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: input.name,
      slug: finalSlug,
      organizationId: input.organizationId,
      members: {
        create: {
          userId: input.ownerUserId,
          role: "ADMIN",
        },
      },
    },
  });

  return workspace;
}

/**
 * List all workspaces under an organization.
 */
export async function listOrganizationWorkspaces(organizationId: string) {
  return prisma.workspace.findMany({
    where: { organizationId },
    include: {
      _count: {
        select: {
          leads: true,
          members: true,
          messages: true,
          appointments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get organization details with members and workspace count.
 */
export async function getOrganizationWithDetails(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { workspaces: true },
      },
    },
  });
}

/**
 * Add a member to an organization.
 */
export async function addOrganizationMember(
  organizationId: string,
  userId: string,
  role: "ADMIN" | "MEMBER" = "MEMBER",
) {
  return prisma.organizationMember.create({
    data: {
      organizationId,
      userId,
      role,
    },
  });
}

/**
 * Check if a user is a member of an organization.
 */
export async function requireOrganizationMembership(organizationId: string, userId: string) {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      userId,
    },
    include: {
      organization: true,
    },
  });

  if (!membership) throw new Error("Not a member of this organization.");

  return membership;
}

/**
 * Get all organizations a user belongs to.
 */
export async function getUserOrganizations(userId: string) {
  return prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          _count: {
            select: { workspaces: true, members: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
