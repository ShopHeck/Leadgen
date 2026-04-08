import { prisma, Prisma } from "@closerflow/db";
import { emitAutomationEvent } from "./automations";

export type LeadScoreBandValue = "HOT" | "WARM" | "NURTURE";

export type LeadScoreFactor = {
  key: "budget" | "urgency" | "decisionMaker" | "location" | "engagement";
  label: string;
  points: number;
  reason: string;
};

export type LeadScoreResult = {
  score: number;
  band: LeadScoreBandValue;
  factors: LeadScoreFactor[];
};

type LeadContext = {
  id: string;
  workspaceId: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  campaign: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  formSubmissions: Array<{
    payloadJson: Prisma.JsonValue;
    utmJson: Prisma.JsonValue | null;
    createdAt: Date;
  }>;
  notes: Array<{
    body: string;
    createdAt: Date;
  }>;
};

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function flattenRecord(value: Prisma.JsonValue | null | undefined): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const output: Record<string, string> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (entry == null) {
      continue;
    }

    if (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean") {
      output[key.toLowerCase()] = String(entry);
      continue;
    }

    if (typeof entry === "object" && !Array.isArray(entry)) {
      for (const [nestedKey, nestedEntry] of Object.entries(entry)) {
        if (nestedEntry == null) {
          continue;
        }

        if (typeof nestedEntry === "string" || typeof nestedEntry === "number" || typeof nestedEntry === "boolean") {
          output[`${key.toLowerCase()}.${nestedKey.toLowerCase()}`] = String(nestedEntry);
        }
      }
    }
  }

  return output;
}

function findValue(record: Record<string, string>, fragments: string[]) {
  for (const [key, value] of Object.entries(record)) {
    if (fragments.some((fragment) => key.includes(fragment))) {
      return normalizeString(value);
    }
  }

  return "";
}

function budgetFactor(record: Record<string, string>): LeadScoreFactor {
  const value = findValue(record, ["budget", "spend", "revenue", "monthly"]);

  if (!value) {
    return {
      key: "budget",
      label: "Budget",
      points: 0,
      reason: "No budget signal supplied yet.",
    };
  }

  if (/(10k|\$10,?000|10000|high|premium|enterprise|over 5k|5000\+)/.test(value)) {
    return { key: "budget", label: "Budget", points: 25, reason: "Budget suggests premium buying capacity." };
  }

  if (/(5k|\$5,?000|5000|2k|\$2,?000|2000|mid|medium)/.test(value)) {
    return { key: "budget", label: "Budget", points: 16, reason: "Budget suggests workable commercial intent." };
  }

  return { key: "budget", label: "Budget", points: 8, reason: "Budget signal exists but indicates lower spend." };
}

function urgencyFactor(record: Record<string, string>): LeadScoreFactor {
  const value = findValue(record, ["urgency", "timeline", "start", "when"]);

  if (!value) {
    return { key: "urgency", label: "Urgency", points: 0, reason: "No urgency signal captured." };
  }

  if (/(today|now|asap|immediately|this week|urgent)/.test(value)) {
    return { key: "urgency", label: "Urgency", points: 20, reason: "Lead wants to move immediately." };
  }

  if (/(this month|2 weeks|two weeks|soon|30 days)/.test(value)) {
    return { key: "urgency", label: "Urgency", points: 14, reason: "Lead appears ready in the near term." };
  }

  return { key: "urgency", label: "Urgency", points: 7, reason: "Lead shows interest but timeline is later." };
}

function decisionMakerFactor(record: Record<string, string>): LeadScoreFactor {
  const value = findValue(record, ["decision", "owner", "founder", "role", "title"]);

  if (!value) {
    return { key: "decisionMaker", label: "Decision-maker", points: 0, reason: "Decision-maker status is unknown." };
  }

  if (/(yes|owner|founder|ceo|president|self|decision maker|i am)/.test(value)) {
    return { key: "decisionMaker", label: "Decision-maker", points: 20, reason: "Lead appears to control the buying decision." };
  }

  if (/(manager|director|partner|operations)/.test(value)) {
    return { key: "decisionMaker", label: "Decision-maker", points: 10, reason: "Lead likely influences the decision." };
  }

  return { key: "decisionMaker", label: "Decision-maker", points: 3, reason: "Lead is not confirmed as the buyer." };
}

function locationFactor(record: Record<string, string>): LeadScoreFactor {
  const value = findValue(record, ["location", "city", "state", "zip", "service area", "market"]);

  if (!value) {
    return { key: "location", label: "Location", points: 0, reason: "Location fit is unknown." };
  }

  if (/(local|nearby|same city|same state|within service area|in area)/.test(value)) {
    return { key: "location", label: "Location", points: 10, reason: "Lead is clearly within the likely service area." };
  }

  return { key: "location", label: "Location", points: 6, reason: "Lead supplied a location signal." };
}

function engagementFactor(lead: LeadContext, record: Record<string, string>): LeadScoreFactor {
  let points = 0;
  const reasons: string[] = [];

  if (lead.email) {
    points += 5;
    reasons.push("email captured");
  }

  if (lead.phone) {
    points += 6;
    reasons.push("phone captured");
  }

  if (lead.formSubmissions.length > 1) {
    points += 5;
    reasons.push("repeat submissions");
  }

  if (lead.notes.length > 0) {
    points += 4;
    reasons.push("notes/activity recorded");
  }

  if (Object.keys(record).length >= 5) {
    points += 5;
    reasons.push("form supplied multiple answers");
  }

  return {
    key: "engagement",
    label: "Engagement",
    points: Math.min(points, 20),
    reason: reasons.length > 0 ? `Lead engagement signals: ${reasons.join(", ")}.` : "Minimal engagement data so far.",
  };
}

export function computeLeadScore(lead: LeadContext): LeadScoreResult {
  const latestSubmission = lead.formSubmissions[0];
  const payloadRecord = flattenRecord(latestSubmission?.payloadJson);
  const utmRecord = flattenRecord(latestSubmission?.utmJson);
  const record = {
    ...payloadRecord,
    ...utmRecord,
    source: lead.utmSource || lead.source || "",
    campaign: lead.utmCampaign || lead.campaign || "",
  };

  const factors = [
    budgetFactor(record),
    urgencyFactor(record),
    decisionMakerFactor(record),
    locationFactor(record),
    engagementFactor(lead, record),
  ];

  const score = Math.max(0, Math.min(100, factors.reduce((total, factor) => total + factor.points, 0)));

  const band: LeadScoreBandValue = score >= 80 ? "HOT" : score >= 60 ? "WARM" : "NURTURE";

  return {
    score,
    band,
    factors,
  };
}

export async function scoreAndPersistLead(leadId: string) {
  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    include: {
      formSubmissions: {
        orderBy: {
          createdAt: "desc",
        },
      },
      notes: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  const result = computeLeadScore(lead);

  await prisma.$executeRawUnsafe(
    'UPDATE "Lead" SET "leadScore" = $1, "scoreBand" = $2, "scoringReasonsJson" = $3::jsonb, "lastScoredAt" = $4 WHERE "id" = $5',
    result.score,
    result.band,
    JSON.stringify(result.factors),
    new Date(),
    lead.id,
  );

  await emitAutomationEvent({
    workspaceId: lead.workspaceId,
    eventType: "lead.scored",
    payload: {
      leadId: lead.id,
      score: result.score,
      scoreBand: result.band,
      source: lead.utmSource || lead.source,
    },
  });

  return result;
}

export type AiScoreResponse = {
  provider: "openai" | "fallback";
  score: number;
  band: LeadScoreBandValue;
  factors: LeadScoreFactor[];
  summary: string[];
  painPoint: string;
  closeLikelihood: "high" | "medium" | "low";
  nextAction: string;
};

export function buildFallbackAiScore(result: LeadScoreResult): AiScoreResponse {
  return {
    provider: "fallback",
    score: result.score,
    band: result.band,
    factors: result.factors,
    summary: result.factors
      .filter((factor) => factor.points > 0)
      .slice(0, 5)
      .map((factor) => `${factor.label}: ${factor.reason}`),
    painPoint:
      result.factors.find((factor) => factor.points === 0)?.reason || "Lead has mixed qualification signals and needs discovery.",
    closeLikelihood: result.band === "HOT" ? "high" : result.band === "WARM" ? "medium" : "low",
    nextAction:
      result.band === "HOT"
        ? "Call and offer the earliest booking slot available."
        : result.band === "WARM"
          ? "Follow up with a qualification message and booking CTA."
          : "Send a nurture sequence focused on timing, budget, and decision clarity.",
  };
}
