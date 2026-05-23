import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@closerflow/db";
import { verifyTaskRequest } from "../../../../lib/gcp-tasks";
import { trackServerEvent } from "../../../../lib/posthog";
import { EVENTS } from "../../../../lib/posthog-events";

/**
 * POST /api/tasks/send-message
 *
 * Background task handler for sending a queued message (SMS or Email).
 * Called by GCP Cloud Tasks for rate-limited, staggered message delivery.
 *
 * Body: { messageId: string }
 *   OR: { workspaceId, leadId, templateId, channel } for template-based sends
 */
export async function POST(request: NextRequest) {
  if (!verifyTaskRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      messageId?: string;
      workspaceId?: string;
      leadId?: string;
      templateId?: string;
      channel?: string;
    };

    if (body.messageId) {
      // Direct message send — fetch the queued message and dispatch
      const message = await prisma.message.findUnique({
        where: { id: body.messageId },
      });

      if (!message) {
        return NextResponse.json({ error: "Message not found." }, { status: 404 });
      }

      if (message.status !== "QUEUED") {
        return NextResponse.json({ ok: true, skipped: true, reason: "Already processed." });
      }

      // Import messaging module dynamically to avoid circular deps
      const { sendMessageById } = await import("../../../../lib/messaging");
      const result = await sendMessageById(message.id);

      trackServerEvent(message.leadId, EVENTS.MESSAGE_SENT, {
        workspace_id: message.workspaceId,
        channel: message.channel,
        message_id: message.id,
      });

      return NextResponse.json({ ok: true, messageId: message.id, result });
    }

    if (body.workspaceId && body.leadId && body.channel) {
      // Template-based send — compose and send a new message
      // This is used for bulk campaigns and automation actions
      const { composeAndSendMessage } = await import("../../../../lib/messaging");

      const result = await composeAndSendMessage({
        workspaceId: body.workspaceId,
        leadId: body.leadId,
        channel: body.channel as "SMS" | "EMAIL",
        templateId: body.templateId,
      });

      trackServerEvent(body.leadId, EVENTS.MESSAGE_SENT, {
        workspace_id: body.workspaceId,
        channel: body.channel,
        template_id: body.templateId,
        source: "bulk_task",
      });

      return NextResponse.json({ ok: true, result });
    }

    return NextResponse.json(
      { error: "messageId or (workspaceId + leadId + channel) is required." },
      { status: 400 },
    );
  } catch (error) {
    console.error("[task/send-message] Error:", error);

    // Track failure for monitoring
    trackServerEvent("system", EVENTS.MESSAGE_FAILED, {
      error: error instanceof Error ? error.message : "Unknown",
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Send failed." },
      { status: 500 },
    );
  }
}
