import { SubscriptionStatus, WorkspacePlan } from "@closerflow/db";
import Stripe from "stripe";

export const PLAN_DEFINITIONS: Record<
  WorkspacePlan,
  {
    label: string;
    priceLabel: string;
    description: string;
    features: string[];
    priceEnv?: string;
  }
> = {
  FREE: {
    label: "Free",
    priceLabel: "$0",
    description: "Basic CRM, messaging logs, manual booking, and starter reporting.",
    features: ["basic_dashboard", "manual_booking"],
  },
  PRO: {
    label: "Pro",
    priceLabel: "$297/mo",
    description: "Unlock automations, advanced analytics, and AI conversation handling.",
    features: ["basic_dashboard", "advanced_dashboard", "manual_booking", "automations", "ai_conversations"],
    priceEnv: "STRIPE_PRICE_PRO",
  },
  SCALE: {
    label: "Scale",
    priceLabel: "$497/mo",
    description: "Multi-channel AI workflows, team operations, and premium reporting.",
    features: ["basic_dashboard", "advanced_dashboard", "manual_booking", "automations", "ai_conversations", "priority_support"],
    priceEnv: "STRIPE_PRICE_SCALE",
  },
};

export type WorkspaceFeature =
  | "basic_dashboard"
  | "advanced_dashboard"
  | "manual_booking"
  | "automations"
  | "ai_conversations"
  | "priority_support";

export function hasWorkspaceFeature(plan: WorkspacePlan, feature: WorkspaceFeature) {
  return PLAN_DEFINITIONS[plan].features.includes(feature);
}

export function normalizeStripeSubscriptionStatus(status: string | null | undefined): SubscriptionStatus {
  switch ((status || "").toLowerCase()) {
    case "trialing":
      return SubscriptionStatus.TRIALING;
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "past_due":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
    case "cancelled":
      return SubscriptionStatus.CANCELED;
    default:
      return SubscriptionStatus.INACTIVE;
  }
}

export function deriveWorkspacePlanFromPriceId(priceId: string | null | undefined): WorkspacePlan {
  if (priceId && process.env.STRIPE_PRICE_SCALE && priceId === process.env.STRIPE_PRICE_SCALE) {
    return WorkspacePlan.SCALE;
  }

  if (priceId && process.env.STRIPE_PRICE_PRO && priceId === process.env.STRIPE_PRICE_PRO) {
    return WorkspacePlan.PRO;
  }

  return WorkspacePlan.FREE;
}

export function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }

  return new Stripe(apiKey);
}

export function getStripePriceId(plan: WorkspacePlan) {
  const envKey = PLAN_DEFINITIONS[plan].priceEnv;

  if (!envKey) {
    return null;
  }

  return process.env[envKey] || null;
}
