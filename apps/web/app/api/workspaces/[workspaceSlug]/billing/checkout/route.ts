import { WorkspacePlan, prisma } from "@closerflow/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "../../../../../../auth";
import { getStripeClient, getStripePriceId } from "../../../../../../lib/billing";

const bodySchema = z.object({
  plan: z.enum(["PRO", "SCALE"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { workspaceSlug } = await params;
    const input = bodySchema.parse(await request.json());

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

    const priceId = getStripePriceId(input.plan as WorkspacePlan);

    if (!priceId) {
      return NextResponse.json({ error: `Stripe price is not configured for ${input.plan}.` }, { status: 400 });
    }

    const stripe = getStripeClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    const sessionResult = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: membership.workspace.stripeCustomerId || undefined,
      customer_email: membership.workspace.stripeCustomerId ? undefined : session.user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/app/${workspaceSlug}/billing?success=1`,
      cancel_url: `${baseUrl}/app/${workspaceSlug}/billing?canceled=1`,
      metadata: {
        workspaceId: membership.workspaceId,
        workspaceSlug,
        requestedPlan: input.plan,
      },
    });

    return NextResponse.json({ url: sessionResult.url }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid billing payload.", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error." }, { status: 400 });
  }
}
