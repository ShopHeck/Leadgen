import { MessageChannel, MessageProvider, MessageStatus, prisma } from "@closerflow/db";
import { emitAutomationEvent } from "./automations";
import twilio from "twilio";

type SendLeadMessageInput = {
  workspaceId: string;
  leadId: string;
  channel: MessageChannel;
  body: string;
  subject?: string | null;
  emitMessageSentEvent?: boolean;
  aiGenerated?: boolean;
};

type SendLeadMessageResult = {
  messageId: string;
  channel: MessageChannel;
  status: MessageStatus;
};

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
  }

  return twilio(accountSid, authToken);
}

async function sendSms(body: string, to: string) {
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!from) {
    throw new Error("Twilio is not configured. Set TWILIO_PHONE_NUMBER.");
  }

  const client = getTwilioClient();
  const response = await client.messages.create({
    body,
    to,
    from,
  });

  return {
    fromAddress: from,
    toAddress: to,
    provider: MessageProvider.TWILIO,
    providerMessageId: response.sid,
    metadataJson: {
      accountSid: response.accountSid,
      status: response.status,
      sid: response.sid,
    },
  };
}

async function sendEmail(body: string, to: string, subject: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Resend is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: body,
    }),
  });

  const data = (await response.json()) as { id?: string; message?: string; name?: string };

  if (!response.ok) {
    throw new Error(data.message || data.name || "Resend email send failed.");
  }

  return {
    fromAddress: from,
    toAddress: to,
    provider: MessageProvider.RESEND,
    providerMessageId: data.id || null,
    metadataJson: data,
  };
}

export async function sendLeadMessage({
  workspaceId,
  leadId,
  channel,
  body,
  subject,
  emitMessageSentEvent = true,
  aiGenerated,
}: SendLeadMessageInput): Promise<SendLeadMessageResult> {
  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      workspaceId,
    },
    select: {
      id: true,
      email: true,
      phone: true,
    },
  });

  if (!lead) {
    throw new Error("Lead not found.");
  }

  const normalizedBody = body.trim();
  const normalizedSubject = subject?.trim() || null;

  if (!normalizedBody) {
    throw new Error("Message body is required.");
  }

  const toAddress = channel === MessageChannel.SMS ? lead.phone : lead.email;

  if (!toAddress) {
    throw new Error(channel === MessageChannel.SMS ? "Lead does not have a phone number." : "Lead does not have an email address.");
  }

  const queuedMessage = await prisma.message.create({
    data: {
      workspaceId,
      leadId,
      channel,
      direction: "OUTBOUND",
      subject: channel === MessageChannel.EMAIL ? normalizedSubject : null,
      body: normalizedBody,
      toAddress,
      aiGenerated: aiGenerated ?? false,
      status: MessageStatus.QUEUED,
    },
  });

  try {
    const delivery =
      channel === MessageChannel.SMS
        ? await sendSms(normalizedBody, toAddress)
        : await sendEmail(normalizedBody, toAddress, normalizedSubject || "CloserFlow AI follow-up");

    const updated = await prisma.message.update({
      where: {
        id: queuedMessage.id,
      },
      data: {
        status: MessageStatus.SENT,
        provider: delivery.provider,
        providerMessageId: delivery.providerMessageId,
        fromAddress: delivery.fromAddress,
        toAddress: delivery.toAddress,
        metadataJson: delivery.metadataJson,
        sentAt: new Date(),
      },
    });

    if (emitMessageSentEvent) {
      await emitAutomationEvent({
        workspaceId,
        eventType: "message.sent",
        payload: {
          leadId,
          channel: updated.channel,
        },
      });
    }

    return {
      messageId: updated.id,
      channel: updated.channel,
      status: updated.status,
    };
  } catch (error) {
    await prisma.message.update({
      where: {
        id: queuedMessage.id,
      },
      data: {
        status: MessageStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "Unknown messaging error.",
      },
    });

    throw error;
  }
}
