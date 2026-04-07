import type { LeadSubmissionInput } from "@/lib/validators";

export function generateLeadSummary(input: LeadSubmissionInput, score: number) {
  return {
    summary: [
      `${input.firstName} requested ${input.serviceInterest}.`,
      `Lead source: ${input.source}/${input.medium}.`,
      `Timeline: ${input.timeline || "unspecified"}.`,
      `Budget signal: ${input.budget || "unspecified"}.`,
      `Recommended priority: ${score >= 80 ? "Immediate outreach" : "Nurture with booking CTA"}.`,
    ],
  };
}
