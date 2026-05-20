import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory rate limiter using a sliding window algorithm.
 * In production, replace with Upstash Redis for distributed rate limiting.
 *
 * Each key (IP or workspace) tracks request timestamps within the window.
 */

type RateLimitEntry = {
  timestamps: number[];
  blockedUntil?: number;
};

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const cutoff = now - windowMs * 2;
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0 && (!entry.blockedUntil || entry.blockedUntil < now)) {
      store.delete(key);
    }
  }
}

export type RateLimitConfig = {
  /** Maximum requests allowed within the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Key prefix to separate different limiters */
  prefix?: string;
  /** How long to block after limit is exceeded (ms). Default: windowMs */
  blockDurationMs?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
};

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const fullKey = config.prefix ? `${config.prefix}:${key}` : key;
  const now = Date.now();
  const windowMs = config.windowMs;
  const blockDurationMs = config.blockDurationMs || windowMs;

  cleanup(windowMs);

  let entry = store.get(fullKey);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(fullKey, entry);
  }

  // Check if currently blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.blockedUntil - now,
    };
  } else if (entry.blockedUntil) {
    // Block expired, reset
    entry.blockedUntil = undefined;
    entry.timestamps = [];
  }

  // Remove timestamps outside window
  entry.timestamps = entry.timestamps.filter((t) => t > now - windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    entry.blockedUntil = now + blockDurationMs;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: blockDurationMs,
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
  };
}

/**
 * Extract a rate limit key from a request.
 * Uses X-Forwarded-For header (common behind proxies/Vercel) or falls back to a default.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  /** Public form submission: 20 requests per minute per IP */
  formSubmit: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    prefix: "form-submit",
    blockDurationMs: 2 * 60 * 1000,
  } satisfies RateLimitConfig,

  /** Public Calendly webhook: 30 per minute per IP */
  calendlyWebhook: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    prefix: "calendly",
  } satisfies RateLimitConfig,

  /** AI score endpoint: 10 per minute per user */
  aiScore: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    prefix: "ai-score",
  } satisfies RateLimitConfig,

  /** General API: 100 per minute per IP */
  generalApi: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    prefix: "api",
  } satisfies RateLimitConfig,
} as const;

/**
 * Helper to create a rate-limited response
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
      retryAfterMs: result.retryAfterMs,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((result.retryAfterMs || 60000) / 1000)),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}
