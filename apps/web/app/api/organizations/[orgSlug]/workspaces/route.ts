import { prisma } from "@closerflow/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "../../../../../auth";
import { createSubWorkspace, listOrganizationWorkspaces } from "../../../../../lib/organizations";

const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(100),
});

/**
 * GET /api/organizations/[orgSlug]/workspaces - List all sub-workspaces for an organization
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { orgSlug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  // Verify membership
  const membership = await prisma.organizationMember.findFirst({
    where: { organizationId: org.id, userId: session.user.id },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const workspaces = await listOrganizationWorkspaces(org.id);

  return NextResponse.json({
    workspaces: workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      leads: w._count.leads,
      members: w._count.members,
      messages: w._count.messages,
      appointments: w._count.appointments,
      createdAt: w.createdAt,
    })),
  });
}

/**
 * POST /api/organizations/[orgSlug]/workspaces - Create a new sub-workspace
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { orgSlug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, isActive: true },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  if (!org.isActive) {
    return NextResponse.json({ error: "Organization is inactive." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const input = createWorkspaceSchema.parse(body);

    const workspace = await createSubWorkspace({
      organizationId: org.id,
      name: input.name,
      ownerUserId: session.user.id,
    });

    return NextResponse.json(
      {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 },
    );
  }
}
