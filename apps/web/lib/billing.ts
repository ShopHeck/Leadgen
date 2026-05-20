import Stripe from "stripe";
import { prisma } from "@closerflow/db";

// ---------------------------------------------------------------------------
// Stripe client singleton
// ---------------------------------------------------------------------------

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");

  _stripe = new Stripe(key);
  return _stripe;
}

// ---------------------------------------------------------------------------
// Plan configuration
// ---------------------------------------------------------------------------

export type PlanTier = "STARTER" | "GROWTH" | "SCALE";

export const PLAN_CONFIG: Record<PlanTier, { name: string; priceEnvKey: string; smsLimit: number; emailLimit: number; workspaceLimit: number }> = {
  STARTER: {
    name: "Starter",
    priceEnvKey: "STRIPE_PRICE_STARTER",
    smsLimit: 200,
    emailLimit: 500,
    workspaceLimit: 1,
  },
  GROWTH: {
    name: "Growth",
    priceEnvKey: "STRIPE_PRICE_GROWTH",
    smsLimit: 500,
    emailLimit: 2000,
    workspaceLimit: 3,
  },
  SCALE: {
    name: "Scale",
    priceEnvKey: "STRIPE_PRICE_SCALE",
    smsLimit: 1000,
    emailLimit: 5000,
    workspaceLimit: 50,
  },
};

export function getPriceId(plan: PlanTier): string {
  const envKey = PLAN_CONFIG[plan].priceEnvKey;
  const priceId = process.env[envKey];
  if (!priceId) throw new Error(`${envKey} is not configured.`);
  return priceId;
}

export function planFromPriceId(priceId: string): PlanTier | null {
  for (const [tier, config] of Object.entries(PLAN_CONFIG)) {
    const envPriceId = process.env[config.priceEnvKey];
    if (envPriceId === priceId) return tier as PlanTier;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Checkout & Portal
// ---------------------------------------------------------------------------

/**
 * Create a Stripe Checkout session for a workspace to subscribe.
 * Redirects the user to Stripe's hosted checkout page.
 */
export async function createCheckoutSession(
  workspaceId: string,
  plan: PlanTier,
  userEmail: string,
): Promise<string> {
  const stripe = getStripe();
  const priceId = getPriceId(plan);

  // Check if workspace already has a Stripe customer
  const existing = await prisma.subscription.findUnique({
    where: { workspaceId },
    select: { stripeCustomerId: true },
  });

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?billing=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?billing=cancelled`,
    metadata: {
      workspaceId,
      plan,
    },
    subscription_data: {
      metadata: {
        workspaceId,
        plan,
      },
    },
  };

  if (existing?.stripeCustomerId) {
    sessionParams.customer = existing.stripeCustomerId;
  } else {
    sessionParams.customer_email = userEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return session.url;
}

/**
 * Create a Stripe Customer Portal session so users can manage their subscription.
 */
export async function createPortalSession(workspaceId: string): Promise<string> {
  const stripe = getStripe();

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
    select: { stripeCustomerId: true },
  });

  if (!subscription?.stripeCustomerId) {
    throw new Error("No billing account found for this workspace.");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
  });

  return session.url;
}

// ---------------------------------------------------------------------------
// Subscription queries
// ---------------------------------------------------------------------------

export type WorkspaceSubscription = {
  plan: PlanTier;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
};

/**
 * Get the active subscription for a workspace.
 * Returns null if no subscription exists (free/trial state).
 */
export async function getWorkspaceSubscription(workspaceId: string): Promise<WorkspaceSubscription | null> {
  const sub = await prisma.subscription.findUnique({
    where: { workspaceId },
    select: {
      plan: true,
      status: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });

  if (!sub) return null;

  return {
    plan: sub.plan as PlanTier,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  };
}

/**
 * Check if a workspace has an active paid plan.
 */
export async function hasActivePlan(workspaceId: string): Promise<boolean> {
  const sub = await getWorkspaceSubscription(workspaceId);
  if (!sub) return false;
  return sub.status === "ACTIVE" || sub.status === "TRIALING";
}

/**
 * Get the plan limits for a workspace based on their subscription.
 */
export async function getPlanLimits(workspaceId: string) {
  const sub = await getWorkspaceSubscription(workspaceId);
  const plan = sub?.plan || "STARTER";
  return PLAN_CONFIG[plan];
}

// ---------------------------------------------------------------------------
// Webhook event handlers
// ---------------------------------------------------------------------------

/**
 * Handle checkout.session.completed — customer just subscribed.
 */
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const workspaceId = session.metadata?.workspaceId;
  const plan = (session.metadata?.plan || "STARTER") as PlanTier;

  if (!workspaceId) {
    console.error("[billing] checkout.session.completed missing workspaceId in metadata");
    return;
  }

  const stripe = getStripe();
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (!subscriptionId || !customerId) {
    console.error("[billing] checkout.session.completed missing subscription or customer");
    return;
  }

  // Fetch the full subscription for period dates
  const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);

  await prisma.subscription.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: getPriceId(plan),
      plan,
      status: "ACTIVE",
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: getPriceId(plan),
      plan,
      status: "ACTIVE",
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: false,
    },
  });
}

/**
 * Handle invoice.paid — subscription renewed successfully.
 */
export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) return;

  const stripe = getStripe();
  const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: "ACTIVE",
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    },
  });
}

/**
 * Handle customer.subscription.updated — plan change, cancellation scheduled, etc.
 */
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const workspaceId = subscription.metadata?.workspaceId;
  if (!workspaceId) return;

  const newPriceId = subscription.items.data[0]?.price?.id;
  const newPlan = newPriceId ? planFromPriceId(newPriceId) : null;

  const statusMap: Record<string, string> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    trialing: "TRIALING",
    incomplete: "PAST_DUE",
    incomplete_expired: "CANCELED",
    unpaid: "PAST_DUE",
  };

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: statusMap[subscription.status] || "ACTIVE",
      plan: newPlan || undefined,
      stripePriceId: newPriceId || undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

/**
 * Handle customer.subscription.deleted — subscription fully canceled.
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "CANCELED",
      cancelAtPeriodEnd: false,
    },
  });
}
