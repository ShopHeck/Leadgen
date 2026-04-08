import { prisma } from "@closerflow/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { getStripeClient } from "../../../../../../lib/billing";

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
      role: "ADMIN",
      workspace: {
        slug: workspaceSlug,
      },
    },
    include: {
      workspace: true,
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (!membership.workspace.stripeCustomerId) {
    return NextResponse.json({ error: "This workspace does not have a Stripe customer yet." }, { status: 400 });
  }

  const stripe = getStripeClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: membership.workspace.stripeCustomerId,
    return_url: `${baseUrl}/app/${workspaceSlug}/billing`,
  });

  return NextResponse.json({ url: portalSession.url }, { status: 200 });
}
