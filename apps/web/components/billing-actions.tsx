"use client";

import { useState } from "react";
import type { PlanTier } from "../lib/billing";

export function BillingActions({
  workspaceSlug,
  currentPlan,
  hasSubscription,
}: {
  workspaceSlug: string;
  currentPlan: PlanTier | null;
  hasSubscription: boolean;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(plan: PlanTier) {
    setLoading(plan);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session.");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/billing/portal`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open billing portal.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(null);
    }
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
      <h3 className="text-lg font-semibold">Actions</h3>
      <p className="mt-2 text-sm text-slate-400">
        {hasSubscription
          ? "Manage your subscription, update payment method, or change plans."
          : "Choose a plan to unlock full features and higher messaging limits."}
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {hasSubscription ? (
          <button
            onClick={handlePortal}
            disabled={loading === "portal"}
            className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:opacity-70"
          >
            {loading === "portal" ? "Opening..." : "Manage Subscription"}
          </button>
        ) : (
          <>
            {(["STARTER", "GROWTH", "SCALE"] as PlanTier[]).map((plan) => {
              const labels: Record<PlanTier, string> = {
                STARTER: "Subscribe Starter — $297/mo",
                GROWTH: "Subscribe Growth — $497/mo",
                SCALE: "Subscribe Scale — $997/mo",
              };

              return (
                <button
                  key={plan}
                  onClick={() => handleCheckout(plan)}
                  disabled={loading !== null}
                  className={`inline-flex rounded-full px-5 py-3 text-sm font-medium transition disabled:opacity-70 ${
                    plan === "GROWTH"
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "border border-white/10 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {loading === plan ? "Redirecting..." : labels[plan]}
                </button>
              );
            })}
          </>
        )}

        {hasSubscription && currentPlan && (
          <>
            {(["STARTER", "GROWTH", "SCALE"] as PlanTier[])
              .filter((p) => p !== currentPlan)
              .map((plan) => (
                <button
                  key={plan}
                  onClick={() => handleCheckout(plan)}
                  disabled={loading !== null}
                  className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm text-slate-200 transition hover:bg-white/10 disabled:opacity-70"
                >
                  {loading === plan ? "Redirecting..." : `Switch to ${plan.charAt(0) + plan.slice(1).toLowerCase()}`}
                </button>
              ))}
          </>
        )}
      </div>
    </section>
  );
}
