import { SubscriptionStatus, prisma } from "@closerflow/db";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { deriveWorkspacePlanFromPriceId, getStripeClient, normalizeStripeSubscriptionStatus } from "../../../../lib/billing";

export const runtime = "nodejs";

async function updateWorkspaceFromSubscription(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const priceId = subscription.items.data[0]?.price?.id || null;
  const workspaceId = subscription.metadata.workspaceId || null;
  const periodEnd = "current_period_end" in subscription && typeof subscription.current_period_end === "number"
    ? new Date(subscription.current_period_end * 1000)
    : null;

  if (workspaceId) {
    await prisma.workspace.update({
      where: {
        id: workspaceId,
      },
      data: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        plan: deriveWorkspacePlanFromPriceId(priceId),
        subscriptionStatus: normalizeStripeSubscriptionStatus(subscription.status),
        billingPeriodEndsAt: periodEnd,
      },
    });

    return;
  }

  await prisma.workspace.updateMany({
    where: {
      stripeCustomerId: customerId,
    },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      plan: deriveWorkspacePlanFromPriceId(priceId),
      subscriptionStatus: normalizeStripeSubscriptionStatus(subscription.status),
      billingPeriodEndsAt: periodEnd,
    },
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "Stripe webhook secret is not configured." }, { status: 400 });
  }

  const stripe = getStripeClient();
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid Stripe signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId || null;

      if (workspaceId) {
        await prisma.workspace.update({
          where: {
            id: workspaceId,
          },
          data: {
            stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id || null,
            stripeSubscriptionId:
              typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null,
            stripePriceId: session.metadata?.requestedPlan === "SCALE" ? process.env.STRIPE_PRICE_SCALE || null : process.env.STRIPE_PRICE_PRO || null,
            plan: session.metadata?.requestedPlan === "SCALE" ? "SCALE" : "PRO",
            subscriptionStatus: SubscriptionStatus.ACTIVE,
          },
        });
      }

      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await updateWorkspaceFromSubscription(event.data.object as Stripe.Subscription);
      break;
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
