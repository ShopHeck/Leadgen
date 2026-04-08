import { prisma, AppointmentStatus } from "@closerflow/db";
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { createOrUpdateAppointment } from "../../../../lib/bookings";

const calendlyWebhookSchema = z.object({
  event: z.string().min(1),
  payload: z.object({
    email: z.string().email().optional(),
    name: z.string().optional(),
    cancel_url: z.string().optional(),
    reschedule_url: z.string().optional(),
    event: z
      .object({
        uri: z.string().optional(),
        uuid: z.string().optional(),
        start_time: z.string().optional(),
        end_time: z.string().optional(),
      })
      .optional(),
    invitee: z
      .object({
        uri: z.string().optional(),
        email: z.string().email().optional(),
        name: z.string().optional(),
      })
      .optional(),
    tracking: z
      .object({
        workspaceSlug: z.string().optional(),
      })
      .optional(),
  }),
});

function resolveWorkspaceSlug(request: NextRequest, payload: z.infer<typeof calendlyWebhookSchema>["payload"]) {
  return request.nextUrl.searchParams.get("workspaceSlug") || payload.tracking?.workspaceSlug || null;
}

function verifyCalendlySignature(rawBody: string, signatureHeader: string | null) {
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;

  if (!signingKey) {
    throw new Error("Calendly signing key is not configured.");
  }

  if (!signatureHeader) {
    return false;
  }

  const timestampMatch = signatureHeader.match(/t=([^,]+)/);
  const signatureMatch = signatureHeader.match(/v1=([a-f0-9]+)/i);

  if (!timestampMatch || !signatureMatch) {
    return false;
  }

  const timestamp = timestampMatch[1];
  const providedSignature = signatureMatch[1];

  if (!/^\d+$/.test(timestamp)) {
    return false;
  }

  const timestampMs = Number(timestamp) * 1000;
  const maxSkewMs = 5 * 60 * 1000;

  if (Math.abs(Date.now() - timestampMs) > maxSkewMs) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto.createHmac("sha256", signingKey).update(signedPayload).digest("hex");
  const providedBuffer = Buffer.from(providedSignature.toLowerCase(), "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("Calendly-Webhook-Signature");

    if (!verifyCalendlySignature(rawBody, signatureHeader)) {
      return NextResponse.json({ error: "Invalid Calendly webhook signature." }, { status: 401 });
    }

    const input = calendlyWebhookSchema.parse(JSON.parse(rawBody));
    const workspaceSlug = resolveWorkspaceSlug(request, input.payload);
    const inviteeEmail = input.payload.invitee?.email || input.payload.email || null;

    if (!inviteeEmail) {
      return NextResponse.json({ error: "Invitee email is required." }, { status: 400 });
    }

    const lead = workspaceSlug
      ? await prisma.lead.findFirst({
          where: {
            workspace: {
              slug: workspaceSlug,
            },
            email: inviteeEmail,
          },
        })
      : await prisma.lead.findFirst({
          where: {
            email: inviteeEmail,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found for booking webhook." }, { status: 404 });
    }

    const eventData = input.payload.event;
    const status = input.event === "invitee.canceled" ? AppointmentStatus.CANCELLED : AppointmentStatus.SCHEDULED;

    const appointment = await createOrUpdateAppointment({
      workspaceId: lead.workspaceId,
      leadId: lead.id,
      provider: "CALENDLY",
      externalEventId: eventData?.uuid || eventData?.uri || input.payload.invitee?.uri || null,
      startAt: new Date(eventData?.start_time || new Date().toISOString()),
      endAt: eventData?.end_time ? new Date(eventData.end_time) : null,
      inviteeName: input.payload.invitee?.name || input.payload.name || lead.name,
      inviteeEmail,
      calendlyEventUri: eventData?.uri || null,
      calendlyInviteeUri: input.payload.invitee?.uri || null,
      notes: input.event === "invitee.canceled" ? "Calendly cancellation received." : "Calendly booking webhook received.",
      status,
    });

    return NextResponse.json({ ok: true, appointmentId: appointment.id }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid Calendly payload.", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 },
    );
  }
}
