"use client";

/**
 * PostHog client-side provider for CloserFlow AI.
 *
 * Wraps the app in PostHog analytics to track:
 * - Page views (automatic with Next.js router integration)
 * - Feature usage (CRM interactions, automation creation, etc.)
 * - User identification on login
 * - Group analytics by workspace
 *
 * Environment variables required:
 * - NEXT_PUBLIC_POSTHOG_KEY: Your PostHog project API key
 * - NEXT_PUBLIC_POSTHOG_HOST: PostHog instance URL (default: https://us.i.posthog.com)
 */

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// ─── Initialize PostHog ───────────────────────────────────────────────────────

if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_POSTHOG_KEY
) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false, // We handle pageviews manually for Next.js SPA navigation
    capture_pageleave: true,
    autocapture: true,
    persistence: "localStorage+cookie",
  });
}

// ─── Pageview Tracker ─────────────────────────────────────────────────────────

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      const search = searchParams?.toString();
      if (search) {
        url += `?${search}`;
      }
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

// ─── Provider Component ───────────────────────────────────────────────────────

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    // If PostHog is not configured, render children without the provider
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  );
}

// ─── Helper Hooks & Functions ─────────────────────────────────────────────────

/**
 * Identify the current user after login. Call this in your auth callback.
 */
export function identifyPostHogUser(user: {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}) {
  if (!posthog) return;

  posthog.identify(user.id, {
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
  });
}

/**
 * Associate the user with a workspace group for group analytics.
 */
export function setPostHogWorkspace(workspace: {
  id: string;
  slug: string;
  name: string;
  plan?: string;
}) {
  if (!posthog) return;

  posthog.group("workspace", workspace.id, {
    name: workspace.name,
    slug: workspace.slug,
    plan: workspace.plan,
  });
}

/**
 * Track a custom event from the client side.
 */
export function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  if (!posthog) return;
  posthog.capture(event, properties);
}

/**
 * Reset PostHog on logout.
 */
export function resetPostHog() {
  if (!posthog) return;
  posthog.reset();
}

export { posthog };
