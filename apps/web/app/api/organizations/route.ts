import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "../../../auth";
import { createOrganization, getUserOrganizations } from "../../../lib/organizations";

const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  logoUrl: z.string().url().optional().or(z.literal("")),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  customDomain: z.string().min(3).optional().or(z.literal("")),
});

/**
 * GET /api/organizations - List all organizations the user belongs to
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const memberships = await getUserOrganizations(session.user.id);

  return NextResponse.json({
    organizations: memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      logoUrl: m.organization.logoUrl,
      brandColor: m.organization.brandColor,
      role: m.role,
      workspaceCount: m.organization._count.workspaces,
      memberCount: m.organization._count.members,
    })),
  });
}

/**
 * POST /api/organizations - Create a new organization (agency account)
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const input = createOrgSchema.parse(body);

    const org = await createOrganization({
      name: input.name,
      ownerUserId: session.user.id,
      logoUrl: input.logoUrl || undefined,
      brandColor: input.brandColor || undefined,
      customDomain: input.customDomain || undefined,
    });

    return NextResponse.json(
      {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl,
        brandColor: org.brandColor,
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
