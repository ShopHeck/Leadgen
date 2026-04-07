import { z } from "zod";

export const leadSubmissionSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional().default(""),
  email: z.string().email(),
  phone: z.string().min(7),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  source: z.string().optional().default("direct"),
  medium: z.string().optional().default("unknown"),
  campaign: z.string().optional().default("unknown"),
  serviceInterest: z.string().optional().default("general"),
  message: z.string().optional().default(""),
});

export type LeadSubmissionInput = z.infer<typeof leadSubmissionSchema>;
