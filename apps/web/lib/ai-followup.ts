import { MessageChannel, prisma } from "@closerflow/db";
import { sendLeadMessage } from "./messaging";

type LeadContext = {
  id: string;
  workspaceId: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  leadScore: number;
  scoreBand: string;
  formSubmissions: Array<{
    payloadJson: unknown;
    createdAt: Date;
  }>;
};

type AiFollowUpResult = {
  channel: MessageChannel;
  messageId: string;
  body: string;
  generatedByAi: boolean;
};

const FALLBACK_SMS_TEMPLATES: Record<string, string> = {
  HOT: `Hi {{name}}! Thanks for reaching out. Based on what you shared, it looks like we'd be a great fit. I'd love to chat — what time works best for a quick call today?`,
  WARM: `Hey {{name}}, thanks for your interest! We'd love to learn more about what you're looking for. Can we schedule a quick 15-min call this week?`,
  NURTURE: `Hi {{name}}, thanks for stopping by! We help businesses like yours get more results. When you're ready to explore options, we're here. Reply anytime!`,
};

const FALLBACK_EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  HOT: {
    subject: "Let's get started — next steps inside",
    body: `Hi {{name}},\n\nThanks for reaching out! Based on what you shared, it looks like we can really help.\n\nI'd love to jump on a quick call to discuss your goals and see if we're a good fit. What does your availability look like this week?\n\nLooking forward to connecting!\n\nBest,\nThe Team`,
  },
  WARM: {
    subject: "Quick question about your goals",
    body: `Hi {{name}},\n\nThanks for your interest! I noticed you reached out and I wanted to follow up personally.\n\nCould you tell me a bit more about what you're looking to achieve? That way I can point you in the right direction.\n\nHappy to chat whenever works for you.\n\nBest,\nThe Team`,
  },
  NURTURE: {
    subject: "Resources that might help",
    body: `Hi {{name}},\n\nThanks for stopping by! I wanted to reach out and let you know we're here whenever you're ready to explore options.\n\nIn the meantime, feel free to reply with any questions — I'm happy to help point you in the right direction.\n\nBest,\nThe Team`,
  },
};

function interpolateTemplate(template: string, context: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => context[key] || "");
}

async function generateAiMessage(
  lead: LeadContext,
  channel: MessageChannel,
): Promise<{ body: string; subject?: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const latestSubmission = lead.formSubmissions[0];
  const channelLabel = channel === MessageChannel.SMS ? "SMS (max 160 chars)" : "email";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You write personalized first-touch follow-up messages for sales leads. The tone is friendly, professional, and action-oriented. The goal is to start a conversation and drive toward a booking. Return JSON with keys: "body" (string)${channel === MessageChannel.EMAIL ? ', "subject" (string, max 60 chars)' : ""}. For ${channelLabel}, keep it concise and natural. Never use placeholder brackets. Address the lead by first name only.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              leadName: lead.name,
              email: lead.email,
              phone: lead.phone,
              source: lead.utmSource || lead.source || "unknown",
              campaign: lead.utmCampaign || null,
              score: lead.leadScore,
              scoreBand: lead.scoreBand,
              formData: latestSubmission?.payloadJson || null,
            }),
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as { body: string; subject?: string };
    if (!parsed.body || parsed.body.length < 10) return null;

    return parsed;
  } catch {
    return null;
  }
}

function getFallbackMessage(
  lead: LeadContext,
  channel: MessageChannel,
): { body: string; subject?: string } {
  const firstName = lead.name.split(" ")[0] || lead.name;
  const context = { name: firstName };
  const band = lead.scoreBand || "NURTURE";

  if (channel === MessageChannel.SMS) {
    const template = FALLBACK_SMS_TEMPLATES[band] || FALLBACK_SMS_TEMPLATES.NURTURE;
    return { body: interpolateTemplate(template, context) };
  }

  const emailTemplate = FALLBACK_EMAIL_TEMPLATES[band] || FALLBACK_EMAIL_TEMPLATES.NURTURE;
  return {
    subject: emailTemplate.subject,
    body: interpolateTemplate(emailTemplate.body, context),
  };
}

/**
 * Determines the best channel for the initial follow-up based on available contact info.
 * SMS is preferred for speed-to-lead if phone is available.
 */
function selectChannel(lead: LeadContext): MessageChannel | null {
  if (lead.phone) return MessageChannel.SMS;
  if (lead.email) return MessageChannel.EMAIL;
  return null;
}

/**
 * Sends an AI-generated (or fallback template) instant follow-up message to a newly created lead.
 * Called automatically by the automation system on lead.created events when AI follow-up is enabled.
 */
export async function sendAiInstantFollowUp(leadId: string): Promise<AiFollowUpResult | null> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      formSubmissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!lead) return null;

  const channel = selectChannel(lead);
  if (!channel) return null;

  // Check if we already sent a message to this lead (avoid duplicates)
  const existingMessages = await prisma.message.count({
    where: {
      leadId: lead.id,
      direction: "OUTBOUND",
    },
  });

  if (existingMessages > 0) return null;

  // Try AI generation first, fall back to templates
  const aiMessage = await generateAiMessage(lead, channel);
  const message = aiMessage || getFallbackMessage(lead, channel);

  try {
    const result = await sendLeadMessage({
      workspaceId: lead.workspaceId,
      leadId: lead.id,
      channel,
      body: message.body,
      subject: message.subject || null,
      emitMessageSentEvent: true,
    });

    // Log a note about the AI follow-up
    await prisma.leadNote.create({
      data: {
        workspaceId: lead.workspaceId,
        leadId: lead.id,
        body: `[Auto] AI instant follow-up sent via ${channel}. ${aiMessage ? "AI-generated." : "Template-based (OpenAI unavailable)."}`,
      },
    });

    return {
      channel,
      messageId: result.messageId,
      body: message.body,
      generatedByAi: !!aiMessage,
    };
  } catch {
    // Log the failure but don't crash the lead creation flow
    await prisma.leadNote.create({
      data: {
        workspaceId: lead.workspaceId,
        leadId: lead.id,
        body: `[Auto] AI instant follow-up failed to send via ${channel}. Will retry via automation system.`,
      },
    });

    return null;
  }
}

/**
 * Check if AI follow-up is enabled for a workspace.
 * For now, it's enabled if the workspace has any active automation with triggerType "lead.created"
 * or if the OPENAI_API_KEY is set (global opt-in).
 */
export async function isAiFollowUpEnabled(workspaceId: string): Promise<boolean> {
  // Check for workspace-level opt-in via automation
  const autoFollowUp = await prisma.automation.findFirst({
    where: {
      workspaceId,
      triggerType: "lead.created",
      isActive: true,
      name: { contains: "ai-followup", mode: "insensitive" },
    },
  });

  if (autoFollowUp) return true;

  // Global opt-in: if OPENAI_API_KEY is configured, enable for all workspaces
  // In production, this should be a workspace setting
  return !!process.env.OPENAI_API_KEY;
}
