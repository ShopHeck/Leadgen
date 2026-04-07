export type WorkspaceRole = "ADMIN" | "MEMBER";

export type AppMetric = {
  label: string;
  value: string;
  description: string;
};

export type UtmParams = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
};

export type LeadAnswers = Record<string, string | number | boolean | null | undefined>;

export type PublicLeadPayload = {
  workspaceSlug: string;
  funnelSlug?: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  campaign?: string;
  pageUrl?: string;
  notes?: string;
  utm?: UtmParams;
  answers?: LeadAnswers;
};
