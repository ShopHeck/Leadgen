import { prisma } from "@closerflow/db";
import { randomBytes, createHash } from "crypto";

/**
 * API key management for workspace-level authentication on public endpoints.
 * Keys are stored as SHA-256 hashes; the raw key is shown only once at creation.
 */

const API_KEY_PREFIX = "cf_live_";
const API_KEY_LENGTH = 32;

/**
 * Hash an API key for storage comparison.
 */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Generate a new API key for a workspace.
 * Returns the raw key (shown once) and persists the hash.
 */
export async function createWorkspaceApiKey(
  workspaceId: string,
  name: string,
): Promise<{ rawKey: string; keyId: string }> {
  const rawBytes = randomBytes(API_KEY_LENGTH);
  const rawKey = API_KEY_PREFIX + rawBytes.toString("base64url");
  const keyHash = hashApiKey(rawKey);
  const prefix = rawKey.slice(0, 12) + "...";

  const apiKey = await prisma.apiKey.create({
    data: {
      workspaceId,
      name,
      keyHash,
      prefix,
    },
  });

  return { rawKey, keyId: apiKey.id };
}

/**
 * Validate an API key and return the associated workspace ID.
 * Looks up the key hash in the ApiKey table.
 */
export async function validateApiKey(rawKey: string): Promise<{ valid: boolean; workspaceId?: string }> {
  if (!rawKey || !rawKey.startsWith(API_KEY_PREFIX)) {
    return { valid: false };
  }

  const keyHash = hashApiKey(rawKey);

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      isActive: true,
    },
    select: {
      id: true,
      workspaceId: true,
    },
  });

  if (!apiKey) {
    return { valid: false };
  }

  // Update last used timestamp (fire-and-forget)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return { valid: true, workspaceId: apiKey.workspaceId };
}

/**
 * Revoke an API key.
 */
export async function revokeApiKey(keyId: string, workspaceId: string): Promise<boolean> {
  const result = await prisma.apiKey.updateMany({
    where: { id: keyId, workspaceId },
    data: { isActive: false },
  });

  return result.count > 0;
}

/**
 * List active API keys for a workspace (returns masked keys).
 */
export async function listWorkspaceApiKeys(workspaceId: string) {
  return prisma.apiKey.findMany({
    where: { workspaceId, isActive: true },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Extract API key from request headers.
 * Supports: Authorization: Bearer cf_live_xxx or X-Api-Key: cf_live_xxx
 */
export function extractApiKey(headers: Headers): string | null {
  const auth = headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token.startsWith(API_KEY_PREFIX)) return token;
  }

  const apiKey = headers.get("x-api-key");
  if (apiKey?.startsWith(API_KEY_PREFIX)) return apiKey;

  return null;
}
