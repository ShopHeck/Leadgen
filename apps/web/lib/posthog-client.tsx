"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

/**
 * Client-side PostHog provider.
 * Wraps the app to enable automatic page view tracking and client-side events.
 *
 * Requires NEXT_PUBLIC_POSTHOG_KEY env var to activate.
 * No-ops gracefully if not configured.
 */

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
      loaded: (ph) => {
        // Disable in development
        if (process.env.NODE_ENV === "development") {
          ph.opt_out_capturing();
        }
      },
    });
  }, []);

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
