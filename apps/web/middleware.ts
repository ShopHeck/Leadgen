import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware for CloserFlow AI.
 *
 * Responsibilities:
 * 1. CORS preflight handling for public API endpoints (form-submit, calendly, webhooks)
 * 2. Security headers on all responses
 */

const PUBLIC_API_PATTERN = /^\/api\/(public|webhooks)\//;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Api-Key, Stripe-Signature, Calendly-Webhook-Signature",
  "Access-Control-Max-Age": "86400",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicApi = PUBLIC_API_PATTERN.test(pathname);

  // Handle CORS preflight (OPTIONS) for public endpoints
  if (isPublicApi && request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  const response = NextResponse.next();

  // Add CORS headers to public API responses
  if (isPublicApi) {
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
  }

  // Security headers for all responses
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",
    // Match app routes (for security headers)
    "/app/:path*",
  ],
};
