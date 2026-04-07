import type { LeadSubmissionInput } from "@/lib/validators";

export function scoreLead(input: LeadSubmissionInput) {
  let score = 25;

  if (input.budget?.toLowerCase().includes("high") || input.budget?.includes("5000")) score += 25;
  if (input.timeline?.toLowerCase().includes("now") || input.timeline?.toLowerCase().includes("week")) score += 20;
  if (["meta", "google", "referral"].some((s) => input.source.toLowerCase().includes(s))) score += 10;
  if (input.message.length > 30) score += 10;
  if (input.serviceInterest !== "general") score += 10;

  const finalScore = Math.max(0, Math.min(score, 100));
  const status = finalScore >= 80 ? "HOT" : finalScore >= 60 ? "WARM" : "NURTURE";

  return { finalScore, status };
}
