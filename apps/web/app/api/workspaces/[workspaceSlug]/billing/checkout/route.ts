import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "../../../../../../auth";
import { prisma } from "@closerflow/db";
import { createCheckoutSession, PlanTier } from "../../../../../../lib/billing";

const checkoutSchema = z.object({
  plan: z.enum(["STARTER", "GROWTH", "SCALE"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { workspaceSlug } = await params;

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
      workspace: { slug: workspaceSlug },
      role: "ADMIN",
    },
    select: { workspaceId: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { plan } = checkoutSchema.parse(body);

    const url = await createCheckoutSession(
      membership.workspaceId,
      plan as PlanTier,
      session.user.email || "",
    );

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid plan selection.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 },
    );
  }
}
