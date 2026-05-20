import { MessageChannel, prisma } from "@closerflow/db";
import { getPlanLimits, PLAN_CONFIG } from "./billing";

/**
 * Daily messaging cost guardrails per workspace.
 * Limits are determined by the workspace's active Stripe subscription plan.
 */

export type MessagingLimits = {
  dailySmsLimit: number;
  dailyEmailLimit: number;
};

/** Fallback limits when no subscription exists (free/trial) */
const FREE_TIER_LIMITS: MessagingLimits = {
  dailySmsLimit: 50,
  dailyEmailLimit: 100,
};

export type LimitCheckResult = {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
};

/**
 * Check if a workspace has remaining daily capacity for a given channel.
 */
export async function checkMessagingLimit(
  workspaceId: string,
  channel: MessageChannel,
): Promise<LimitCheckResult> {
  const limits = await getWorkspaceLimits(workspaceId);
  const limit = channel === MessageChannel.SMS ? limits.dailySmsLimit : limits.dailyEmailLimit;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const used = await prisma.message.count({
    where: {
      workspaceId,
      channel,
      direction: "OUTBOUND",
      createdAt: { gte: startOfDay },
      status: { in: ["QUEUED", "SENT", "DELIVERED"] },
    },
  });

  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    used,
    limit,
    remaining,
  };
}

/**
 * Get workspace messaging limits based on their active billing plan.
 * Falls back to free-tier limits if no subscription exists.
 */
export async function getWorkspaceLimits(workspaceId: string): Promise<MessagingLimits> {
  try {
    const planConfig = await getPlanLimits(workspaceId);
    return {
      dailySmsLimit: planConfig.smsLimit,
      dailyEmailLimit: planConfig.emailLimit,
    };
  } catch {
    // If billing lookup fails (e.g., no subscription), use free-tier limits
    return FREE_TIER_LIMITS;
  }
}

/**
 * Get a usage summary for the workspace (for dashboard display).
 */
export async function getMessagingUsageSummary(workspaceId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [smsToday, emailToday, smsMonth, emailMonth] = await Promise.all([
    prisma.message.count({
      where: {
        workspaceId,
        channel: MessageChannel.SMS,
        direction: "OUTBOUND",
        createdAt: { gte: startOfDay },
      },
    }),
    prisma.message.count({
      where: {
        workspaceId,
        channel: MessageChannel.EMAIL,
        direction: "OUTBOUND",
        createdAt: { gte: startOfDay },
      },
    }),
    prisma.message.count({
      where: {
        workspaceId,
        channel: MessageChannel.SMS,
        direction: "OUTBOUND",
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.message.count({
      where: {
        workspaceId,
        channel: MessageChannel.EMAIL,
        direction: "OUTBOUND",
        createdAt: { gte: startOfMonth },
      },
    }),
  ]);

  const limits = await getWorkspaceLimits(workspaceId);

  return {
    sms: {
      today: smsToday,
      month: smsMonth,
      dailyLimit: limits.dailySmsLimit,
      remainingToday: Math.max(0, limits.dailySmsLimit - smsToday),
    },
    email: {
      today: emailToday,
      month: emailMonth,
      dailyLimit: limits.dailyEmailLimit,
      remainingToday: Math.max(0, limits.dailyEmailLimit - emailToday),
    },
  };
}
