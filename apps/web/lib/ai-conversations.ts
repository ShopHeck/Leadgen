import { MessageChannel, MessageStatus, prisma } from "@closerflow/db";
import { hasWorkspaceFeature } from "./billing";
import { moveLeadToStageByName } from "./crm";
import { sendLeadMessage } from "./messaging";

type AiConversationReply = {
  reply: string;
  summary: string;
  stageName?: string | null;
  needsHuman?: boolean;
};

async function generateAiConversationReply({
  lead,
  body,
}: {
  lead: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    leadScore: number;
    scoreBand: string;
    workspaceId: string;
    source: string | null;
    campaign: string | null;
    messages: Array<{ direction: string; body: string; createdAt: Date }>;
  };
  body: string;
}): Promise<AiConversationReply | null> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "You are an inbound lead qualification assistant. Return strict JSON with keys reply (string), summary (string), stageName (string or null), needsHuman (boolean). Keep SMS-ready replies concise and commercially useful.",
        },
        {
          role: "user",
          content: JSON.stringify({
            lead: {
              name: lead.name,
              source: lead.source,
              campaign: lead.campaign,
              score: lead.leadScore,
              band: lead.scoreBand,
            },
            inboundMessage: body,
            recentMessages: lead.messages.slice(-6),
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI response did not include content.");
  }

  return JSON.parse(content) as AiConversationReply;
}

function buildFallbackReply(leadName: string, body: string): AiConversationReply {
  const asksAboutBooking = /(book|schedule|calendar|available|time)/i.test(body);

  return {
    reply: asksAboutBooking
      ? `Hi ${leadName}, thanks for the reply. We can help you get booked. What day this week works best for you?`
      : `Hi ${leadName}, thanks for the message. I’ve logged your reply and someone will follow up shortly.`,
    summary: asksAboutBooking ? "Lead replied with booking intent." : "Lead sent an inbound reply that may need follow-up.",
    stageName: asksAboutBooking ? "Qualified" : null,
    needsHuman: !asksAboutBooking,
  };
}

export async function processInboundSms({
  workspaceSlug,
  from,
  to,
  body,
}: {
  workspaceSlug: string;
  from: string;
  to: string;
  body: string;
}) {
  const workspace = await prisma.workspace.findUnique({
    where: {
      slug: workspaceSlug,
    },
  });

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  const lead = await prisma.lead.findFirst({
    where: {
      workspaceId: workspace.id,
      phone: from,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!lead) {
    throw new Error("Lead not found for inbound message.");
  }

  await prisma.message.create({
    data: {
      workspaceId: workspace.id,
      leadId: lead.id,
      channel: MessageChannel.SMS,
      direction: "INBOUND",
      body,
      fromAddress: from,
      toAddress: to,
      status: MessageStatus.DELIVERED,
    },
  });

  if (!workspace.aiAutopilotEnabled || !hasWorkspaceFeature(workspace.plan, "ai_conversations")) {
    return { handled: true, replied: false };
  }

  const ai = (await generateAiConversationReply({
    lead: {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      leadScore: lead.leadScore,
      scoreBand: lead.scoreBand,
      workspaceId: lead.workspaceId,
      source: lead.source,
      campaign: lead.campaign,
      messages: lead.messages,
    },
    body,
  })) || buildFallbackReply(lead.name, body);

  await prisma.leadNote.create({
    data: {
      workspaceId: workspace.id,
      leadId: lead.id,
      body: `AI inbound summary: ${ai.summary}`,
    },
  });

  const nextStage = ai.stageName || null;

  if (nextStage) {
    await prisma.$transaction((tx) =>
      moveLeadToStageByName(tx, {
        workspaceId: workspace.id,
        leadId: lead.id,
        stageName: nextStage,
        changedByUserId: null,
      }),
    );
  }

  if (ai.needsHuman) {
    return { handled: true, replied: false };
  }

  await sendLeadMessage({
    workspaceId: workspace.id,
    leadId: lead.id,
    channel: MessageChannel.SMS,
    body: ai.reply,
    aiGenerated: true,
  });

  return { handled: true, replied: true, reply: ai.reply };
}
