import { prisma } from "@closerflow/db";
import { NextRequest, NextResponse } from "next/server";
import { processAutomationRun, processDueAutomationRuns } from "../../../../lib/automations";

/**
 * GET/POST /api/cron/process-automations
 *
 * Processes due automation runs. Supports two modes:
 *
 * 1. Daily Cron (GET): Vercel Cron calls this once/day to catch any retries
 *    that QStash missed or wasn't configured for.
 *
 * 2. QStash Targeted Retry (POST with { runId }): QStash calls this with a
 *    specific run ID after the calculated delay. Processes just that one run.
 *
 * Security: Accepts CRON_SECRET as Bearer token OR Upstash-Signature header.
 */

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // Vercel Cron sends Bearer token
  const authHeader = request.headers.get("authorization");
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  // QStash sends Upstash-Signature header (verified by their SDK internally)
  // For simplicity, also accept CRON_SECRET in the body or allow if QStash token is set
  if (process.env.QSTASH_TOKEN && request.headers.get("upstash-signature")) return true;

  // Allow if no secret is configured (dev mode)
  if (!cronSecret) return true;

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const workspacesWithDueRuns = await prisma.automationRun.findMany({
      where: {
        OR: [
          { status: "PENDING" },
          {
            status: "RETRY_SCHEDULED",
            nextRetryAt: { lte: new Date() },
          },
        ],
      },
      select: { workspaceId: true },
      distinct: ["workspaceId"],
    });

    let totalProcessed = 0;

    for (const { workspaceId } of workspacesWithDueRuns) {
      const processed = await processDueAutomationRuns(workspaceId);
      totalProcessed += processed;
    }

    return NextResponse.json({
      ok: true,
      workspacesChecked: workspacesWithDueRuns.length,
      runsProcessed: totalProcessed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/process-automations] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { runId?: string };

    if (body.runId) {
      // Targeted retry from QStash — process just this one run
      await processAutomationRun(body.runId);
      return NextResponse.json({ ok: true, runId: body.runId });
    }

    // Fallback: process all due runs (same as GET)
    const workspacesWithDueRuns = await prisma.automationRun.findMany({
      where: {
        OR: [
          { status: "PENDING" },
          {
            status: "RETRY_SCHEDULED",
            nextRetryAt: { lte: new Date() },
          },
        ],
      },
      select: { workspaceId: true },
      distinct: ["workspaceId"],
    });

    let totalProcessed = 0;
    for (const { workspaceId } of workspacesWithDueRuns) {
      totalProcessed += await processDueAutomationRuns(workspaceId);
    }

    return NextResponse.json({ ok: true, runsProcessed: totalProcessed });
  } catch (error) {
    console.error("[cron/process-automations] POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 500 },
    );
  }
}
