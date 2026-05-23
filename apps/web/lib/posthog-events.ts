/**
 * PostHog event constants for CloserFlow AI.
 *
 * Centralizes all tracked events for consistency, autocomplete,
 * and easy auditing of what we're tracking.
 */

// ─── Lead Lifecycle ───────────────────────────────────────────────────────────

export const EVENTS = {
  // Leads
  LEAD_CREATED: "lead_created",
  LEAD_SCORED: "lead_scored",
  LEAD_STAGE_CHANGED: "lead_stage_changed",
  LEAD_ASSIGNED: "lead_assigned",
  LEAD_WON: "lead_won",
  LEAD_LOST: "lead_lost",

  // Messaging
  MESSAGE_SENT: "message_sent",
  MESSAGE_DELIVERED: "message_delivered",
  MESSAGE_FAILED: "message_failed",

  // Automations
  AUTOMATION_CREATED: "automation_created",
  AUTOMATION_RUN_STARTED: "automation_run_started",
  AUTOMATION_RUN_COMPLETED: "automation_run_completed",
  AUTOMATION_RUN_FAILED: "automation_run_failed",

  // Bookings
  APPOINTMENT_BOOKED: "appointment_booked",
  APPOINTMENT_COMPLETED: "appointment_completed",
  APPOINTMENT_NO_SHOW: "appointment_no_show",

  // Revenue
  REVENUE_EVENT_CREATED: "revenue_event_created",
  REVENUE_CONFIRMED: "revenue_confirmed",

  // Forms & Funnels
  FORM_SUBMISSION: "form_submission",
  FUNNEL_CREATED: "funnel_created",
  FUNNEL_PUBLISHED: "funnel_published",

  // CRM UI Interactions
  CRM_BOARD_VIEWED: "crm_board_viewed",
  CRM_LEAD_DETAIL_VIEWED: "crm_lead_detail_viewed",
  CRM_LEAD_MOVED: "crm_lead_moved",
  CRM_NOTE_ADDED: "crm_note_added",

  // Billing
  SUBSCRIPTION_CREATED: "subscription_created",
  SUBSCRIPTION_UPGRADED: "subscription_upgraded",
  SUBSCRIPTION_CANCELED: "subscription_canceled",
  CHECKOUT_STARTED: "checkout_started",

  // Auth
  USER_SIGNED_UP: "user_signed_up",
  USER_LOGGED_IN: "user_logged_in",
  USER_LOGGED_OUT: "user_logged_out",

  // Workspace
  WORKSPACE_CREATED: "workspace_created",
  API_KEY_CREATED: "api_key_created",

  // AI Features
  AI_SCORE_REQUESTED: "ai_score_requested",
  AI_FOLLOWUP_GENERATED: "ai_followup_generated",
  SEMANTIC_SEARCH_PERFORMED: "semantic_search_performed",
} as const;

export type PostHogEvent = (typeof EVENTS)[keyof typeof EVENTS];
