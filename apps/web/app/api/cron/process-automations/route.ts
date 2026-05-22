import { prisma } from "@closerflow/db";
import { NextRequest, NextResponse } from "next/server";
import { processDueAutomationRuns } from "../../../../lib/automations";

/**
 * GET /api/cron/process-automations
 *
 * Vercel Cron endpoint that processes due automation runs across all workspaces.
 * Secured via CRON_SECRET to prevent unauthorized access.
 *
 * Schedule: Every 5 minutes (configured in vercel.json)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Vercel Cron sends the secret as Bearer token
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    // Get all workspaces that have pending or retry-scheduled automation runs
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
