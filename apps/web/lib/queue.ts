import { Client } from "@upstash/qstash";

/**
 * QStash client for scheduling delayed automation retries.
 *
 * Instead of relying on a frequent cron job, we schedule individual
 * retry messages with specific delays when an automation run fails.
 * QStash calls our endpoint at the specified time — free for 500 msgs/day.
 *
 * Setup:
 * 1. Create account at https://console.upstash.com
 * 2. Go to QStash tab → copy the QSTASH_TOKEN
 * 3. Add QSTASH_TOKEN to your .env and Vercel env vars
 */

let _client: Client | null = null;

function getQStashClient(): Client | null {
  const token = process.env.QSTASH_TOKEN;
  if (!token) return null;

  if (_client) return _client;
  _client = new Client({ token });
  return _client;
}

/**
 * Schedule an automation retry after a delay.
 * If QStash is not configured, falls back silently (retry will be picked up by daily cron).
 *
 * @param runId - The automation run ID to retry
 * @param delaySeconds - How many seconds to wait before retrying
 */
export async function scheduleAutomationRetry(
  runId: string,
  delaySeconds: number,
): Promise<boolean> {
  const client = getQStashClient();
  if (!client) return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!appUrl) return false;

  const baseUrl = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;

  try {
    await client.publishJSON({
      url: `${baseUrl}/api/cron/process-automations`,
      body: { runId },
      delay: delaySeconds,
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET || ""}`,
      },
    });

    return true;
  } catch (error) {
    console.error("[qstash] Failed to schedule retry:", error);
    return false;
  }
}

/**
 * Check if QStash is configured and available.
 */
export function isQStashEnabled(): boolean {
  return !!process.env.QSTASH_TOKEN;
}
