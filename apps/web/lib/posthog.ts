/**
 * PostHog server-side client for CloserFlow AI.
 *
 * Use this in API routes, server actions, and server components to track
 * backend events like lead creation, scoring, automation runs, and billing.
 *
 * Setup:
 * 1. Sign up at https://posthog.com (free up to 1M events/mo)
 * 2. Copy your Project API Key and set POSTHOG_API_KEY in .env
 * 3. Set NEXT_PUBLIC_POSTHOG_KEY for the frontend client
 * 4. Set NEXT_PUBLIC_POSTHOG_HOST (defaults to https://us.i.posthog.com)
 */

import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  const apiKey = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return null;

  if (_client) return _client;

  _client = new PostHog(apiKey, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    // Flush events in batches every 5s in production
    flushInterval: 5000,
    flushAt: 20,
  });

  return _client;
}

/**
 * Track a server-side event. Safe to call even if PostHog is not configured.
 */
export function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  const client = getPostHogServer();
  if (!client) return;

  client.capture({
    distinctId,
    event,
    properties: {
      ...properties,
      $lib: "closerflow-server",
    },
  });
}

/**
 * Identify a user with traits (called on signup/login).
 */
export function identifyUser(
  distinctId: string,
  properties: Record<string, unknown>,
) {
  const client = getPostHogServer();
  if (!client) return;

  client.identify({
    distinctId,
    properties,
  });
}

/**
 * Associate a user with a group (workspace/organization).
 */
export function groupIdentify(
  groupType: string,
  groupKey: string,
  properties?: Record<string, unknown>,
) {
  const client = getPostHogServer();
  if (!client) return;

  client.groupIdentify({
    groupType,
    groupKey,
    properties,
  });
}

/**
 * Flush pending events. Call in API route cleanup or shutdown.
 */
export async function flushPostHog() {
  const client = getPostHogServer();
  if (!client) return;
  await client.shutdown();
  _client = null;
}
