/**
 * Centralized PostHog event name constants.
 * Keeps event naming consistent and prevents typos.
 */

export const POSTHOG_EVENTS = {
  // Lead lifecycle
  LEAD_CREATED: "lead_created",
  LEAD_SCORED: "lead_scored",
  LEAD_STAGE_CHANGED: "lead_stage_changed",

  // Messaging
  MESSAGE_SENT: "message_sent",
  AI_FOLLOWUP_SENT: "ai_followup_sent",

  // Bookings
  BOOKING_CREATED: "booking_created",
  BOOKING_CANCELLED: "booking_cancelled",

  // Automations
  AUTOMATION_TRIGGERED: "automation_triggered",
  AUTOMATION_COMPLETED: "automation_completed",
  AUTOMATION_FAILED: "automation_failed",

  // Billing
  SUBSCRIPTION_CREATED: "subscription_created",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",

  // Auth
  USER_SIGNED_UP: "user_signed_up",
  USER_SIGNED_IN: "user_signed_in",

  // Workspace
  WORKSPACE_CREATED: "workspace_created",
} as const;

export type PostHogEvent = (typeof POSTHOG_EVENTS)[keyof typeof POSTHOG_EVENTS];
