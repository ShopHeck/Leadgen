/**
 * Google Cloud Tasks integration for CloserFlow AI.
 *
 * Provides a production-grade task queue for:
 * - Automation run processing with precise delay scheduling
 * - Background lead scoring (offloads heavy AI work from request path)
 * - Bulk message sending (SMS/email batches)
 * - Chroma vector indexing (non-blocking background re-indexing)
 *
 * Architecture:
 * - Uses GCP Cloud Tasks to enqueue HTTP tasks that call back into our API
 * - Each task type maps to a specific handler endpoint
 * - Supports delays, retries with exponential backoff, and dead-letter handling
 * - Can run alongside QStash (use GCP_TASKS_ENABLED=true to activate)
 *
 * Setup:
 * 1. Create a GCP project: https://console.cloud.google.com
 * 2. Enable the Cloud Tasks API
 * 3. Create a service account with Cloud Tasks Enqueuer role
 * 4. Download the JSON key and set GOOGLE_APPLICATION_CREDENTIALS path
 *    OR set GCP_SERVICE_ACCOUNT_KEY with the JSON contents
 * 5. Create task queues via gcloud CLI:
 *    gcloud tasks queues create closerflow-automations --location=us-central1
 *    gcloud tasks queues create closerflow-scoring --location=us-central1
 *    gcloud tasks queues create closerflow-messaging --location=us-central1
 *    gcloud tasks queues create closerflow-indexing --location=us-central1
 * 6. Set environment variables (see .env.example)
 */

import { CloudTasksClient, protos } from "@google-cloud/tasks";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskQueue =
  | "closerflow-automations"
  | "closerflow-scoring"
  | "closerflow-messaging"
  | "closerflow-indexing";

export type TaskPayload = {
  /** The endpoint path to call (relative to app URL) */
  path: string;
  /** HTTP method (default: POST) */
  method?: "POST" | "GET" | "PUT";
  /** JSON body to send */
  body?: Record<string, unknown>;
  /** Delay in seconds before the task executes */
  delaySeconds?: number;
  /** Custom task ID for deduplication (optional) */
  taskId?: string;
};

type QueueConfig = {
  project: string;
  location: string;
  queue: string;
};

// ─── Client Setup ─────────────────────────────────────────────────────────────

let _client: CloudTasksClient | null = null;

function getTasksClient(): CloudTasksClient | null {
  if (!isGCPTasksEnabled()) return null;
  if (_client) return _client;

  const keyJson = process.env.GCP_SERVICE_ACCOUNT_KEY;

  if (keyJson) {
    // Use inline service account key (works on Vercel/serverless)
    const credentials = JSON.parse(keyJson);
    _client = new CloudTasksClient({ credentials });
  } else {
    // Use GOOGLE_APPLICATION_CREDENTIALS file path (local dev / Cloud Run)
    _client = new CloudTasksClient();
  }

  return _client;
}

function getQueueConfig(queue: TaskQueue): QueueConfig {
  return {
    project: process.env.GCP_PROJECT_ID || "",
    location: process.env.GCP_LOCATION || "us-central1",
    queue,
  };
}

// ─── Core Task Creation ───────────────────────────────────────────────────────

/**
 * Enqueue a task to Google Cloud Tasks.
 *
 * @returns The task name if created successfully, null if GCP Tasks is not configured
 */
export async function enqueueTask(
  queue: TaskQueue,
  payload: TaskPayload,
): Promise<string | null> {
  const client = getTasksClient();
  if (!client) return null;

  const config = getQueueConfig(queue);
  const parent = client.queuePath(config.project, config.location, config.queue);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "";
  const baseUrl = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;
  const url = `${baseUrl}${payload.path}`;

  const task: protos.google.cloud.tasks.v2.ITask = {
    httpRequest: {
      httpMethod: (payload.method || "POST") as unknown as number,
      url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GCP_TASKS_AUTH_TOKEN || process.env.CRON_SECRET || ""}`,
        "X-CloudTasks-Source": "gcp-cloud-tasks",
      },
      body: payload.body ? Buffer.from(JSON.stringify(payload.body)).toString("base64") : undefined,
    },
  };

  // Schedule with delay if specified
  if (payload.delaySeconds && payload.delaySeconds > 0) {
    const scheduleTime = new Date();
    scheduleTime.setSeconds(scheduleTime.getSeconds() + payload.delaySeconds);
    task.scheduleTime = {
      seconds: Math.floor(scheduleTime.getTime() / 1000),
      nanos: 0,
    };
  }

  // Set custom task name for deduplication
  if (payload.taskId) {
    task.name = `${parent}/tasks/${payload.taskId}`;
  }

  try {
    const [response] = await client.createTask({ parent, task });
    return response.name || null;
  } catch (error: unknown) {
    // If task already exists (deduplication), that's OK
    const err = error as { code?: number; message?: string };
    if (err.code === 6) {
      // ALREADY_EXISTS
      console.warn(`[gcp-tasks] Task already exists: ${payload.taskId}`);
      return payload.taskId || null;
    }
    console.error("[gcp-tasks] Failed to create task:", error);
    throw error;
  }
}

// ─── Specialized Task Creators ────────────────────────────────────────────────

/**
 * Schedule an automation run for processing.
 * Replaces/supplements QStash for automation retries.
 */
export async function enqueueAutomationRun(
  runId: string,
  options?: { delaySeconds?: number },
): Promise<string | null> {
  return enqueueTask("closerflow-automations", {
    path: "/api/cron/process-automations",
    body: { runId },
    delaySeconds: options?.delaySeconds,
    taskId: `automation-run-${runId}-${Date.now()}`,
  });
}

/**
 * Schedule background lead scoring.
 * Offloads the scoring computation from the request path.
 */
export async function enqueueLeadScoring(
  leadId: string,
  options?: { delaySeconds?: number },
): Promise<string | null> {
  return enqueueTask("closerflow-scoring", {
    path: "/api/tasks/score-lead",
    body: { leadId },
    delaySeconds: options?.delaySeconds,
    taskId: `score-lead-${leadId}-${Date.now()}`,
  });
}

/**
 * Schedule a message to be sent (SMS or Email).
 * Enables rate-limited bulk sending without blocking the UI.
 */
export async function enqueueMessageSend(
  messageId: string,
  options?: { delaySeconds?: number },
): Promise<string | null> {
  return enqueueTask("closerflow-messaging", {
    path: "/api/tasks/send-message",
    body: { messageId },
    delaySeconds: options?.delaySeconds,
    taskId: `send-msg-${messageId}`,
  });
}

/**
 * Schedule bulk message sending for a workspace (e.g., nurture campaigns).
 */
export async function enqueueBulkMessages(
  workspaceId: string,
  leadIds: string[],
  templateId: string,
  channel: "SMS" | "EMAIL",
  options?: { delayBetweenSeconds?: number },
): Promise<string[]> {
  const taskNames: string[] = [];
  const delayBetween = options?.delayBetweenSeconds || 2;

  for (let i = 0; i < leadIds.length; i++) {
    const name = await enqueueTask("closerflow-messaging", {
      path: "/api/tasks/send-message",
      body: {
        workspaceId,
        leadId: leadIds[i],
        templateId,
        channel,
      },
      delaySeconds: i * delayBetween, // Stagger sends
      taskId: `bulk-${workspaceId}-${leadIds[i]}-${Date.now()}`,
    });
    if (name) taskNames.push(name);
  }

  return taskNames;
}

/**
 * Schedule vector index update for a lead in ChromaDB.
 * Non-blocking background indexing.
 */
export async function enqueueLeadIndexing(
  leadId: string,
  workspaceId: string,
): Promise<string | null> {
  return enqueueTask("closerflow-indexing", {
    path: "/api/tasks/index-lead",
    body: { leadId, workspaceId },
    taskId: `index-lead-${leadId}-${Date.now()}`,
  });
}

/**
 * Schedule a full workspace reindex (used after bulk imports or migrations).
 */
export async function enqueueWorkspaceReindex(
  workspaceId: string,
): Promise<string | null> {
  return enqueueTask("closerflow-indexing", {
    path: "/api/tasks/reindex-workspace",
    body: { workspaceId },
    taskId: `reindex-workspace-${workspaceId}-${Date.now()}`,
  });
}

// ─── Task Verification ────────────────────────────────────────────────────────

/**
 * Verify that a request is coming from Google Cloud Tasks.
 * Checks the Authorization header against our configured token.
 */
export function verifyTaskRequest(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const taskSource = request.headers.get("x-cloudtasks-source");

  // Accept Cloud Tasks requests with valid auth token
  const expectedToken = process.env.GCP_TASKS_AUTH_TOKEN || process.env.CRON_SECRET;
  if (expectedToken && authHeader === `Bearer ${expectedToken}`) return true;

  // Accept if X-CloudTasks headers are present (GCP adds these automatically)
  if (request.headers.get("x-cloudtasks-taskname")) return true;

  // Allow in development
  if (process.env.NODE_ENV === "development") return true;

  return false;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Check if GCP Cloud Tasks is configured and enabled.
 */
export function isGCPTasksEnabled(): boolean {
  return (
    process.env.GCP_TASKS_ENABLED === "true" &&
    !!process.env.GCP_PROJECT_ID &&
    !!(process.env.GCP_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS)
  );
}

/**
 * Get queue stats (requires cloudtasks.queues.get permission).
 */
export async function getQueueStats(queue: TaskQueue) {
  const client = getTasksClient();
  if (!client) return null;

  const config = getQueueConfig(queue);
  const name = client.queuePath(config.project, config.location, config.queue);

  try {
    const [queueInfo] = await client.getQueue({ name });
    return {
      name: queueInfo.name,
      state: queueInfo.state,
      rateLimits: queueInfo.rateLimits,
      retryConfig: queueInfo.retryConfig,
    };
  } catch {
    return null;
  }
}

/**
 * Purge all tasks from a queue (use with caution!).
 */
export async function purgeQueue(queue: TaskQueue): Promise<boolean> {
  const client = getTasksClient();
  if (!client) return false;

  const config = getQueueConfig(queue);
  const name = client.queuePath(config.project, config.location, config.queue);

  try {
    await client.purgeQueue({ name });
    return true;
  } catch (error) {
    console.error(`[gcp-tasks] Failed to purge queue ${queue}:`, error);
    return false;
  }
}
