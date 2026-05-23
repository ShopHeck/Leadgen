import { PostHog } from "posthog-node";

/**
 * Server-side PostHog client for tracking backend events.
 *
 * Usage:
 *   import { serverPostHog } from "../lib/posthog";
 *   serverPostHog.capture({ distinctId, event, properties });
 *
 * Gracefully no-ops if POSTHOG_API_KEY is not set.
 */

let _client: PostHog | null = null;

function getPostHogClient(): PostHog | null {
  const apiKey = process.env.POSTHOG_API_KEY;
  if (!apiKey) return null;

  if (_client) return _client;

  _client = new PostHog(apiKey, {
    host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
    flushAt: 10,
    flushInterval: 5000,
  });

  return _client;
}

export const serverPostHog = {
  /**
   * Capture a server-side event. No-ops if PostHog is not configured.
   */
  capture(params: {
    distinctId: string;
    event: string;
    properties?: Record<string, unknown>;
    groups?: Record<string, string>;
  }) {
    const client = getPostHogClient();
    if (!client) return;
    client.capture(params);
  },

  /**
   * Identify a user with properties. No-ops if PostHog is not configured.
   */
  identify(params: {
    distinctId: string;
    properties?: Record<string, unknown>;
  }) {
    const client = getPostHogClient();
    if (!client) return;
    client.identify(params);
  },

  /**
   * Associate a user with a group (e.g., workspace).
   */
  groupIdentify(params: {
    groupType: string;
    groupKey: string;
    properties?: Record<string, unknown>;
  }) {
    const client = getPostHogClient();
    if (!client) return;
    client.groupIdentify(params);
  },

  /**
   * Flush pending events. Call in API routes before response ends.
   */
  async flush() {
    const client = getPostHogClient();
    if (!client) return;
    await client.flush();
  },

  /**
   * Check if PostHog is configured.
   */
  isEnabled(): boolean {
    return !!process.env.POSTHOG_API_KEY;
  },
};
