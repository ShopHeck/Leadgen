"use client";

import { useState } from "react";

export function BillingActions({
  workspaceSlug,
  currentPlan,
}: {
  workspaceSlug: string;
  currentPlan: string;
}) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: "PRO" | "SCALE") {
    setPendingAction(plan);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout.");
      }

      window.location.href = data.url;
    } catch (nextError) {
      setPendingAction(null);
      setError(nextError instanceof Error ? nextError.message : "Unable to start checkout.");
    }
  }

  async function openPortal() {
    setPendingAction("portal");
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/billing/portal`, {
        method: "POST",
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to open billing portal.");
      }

      window.location.href = data.url;
    } catch (nextError) {
      setPendingAction(null);
      setError(nextError instanceof Error ? nextError.message : "Unable to open billing portal.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pendingAction !== null || currentPlan === "PRO"}
          onClick={() => void startCheckout("PRO")}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingAction === "PRO" ? "Opening checkout..." : currentPlan === "PRO" ? "Current plan" : "Upgrade to Pro"}
        </button>
        <button
          type="button"
          disabled={pendingAction !== null || currentPlan === "SCALE"}
          onClick={() => void startCheckout("SCALE")}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingAction === "SCALE" ? "Opening checkout..." : currentPlan === "SCALE" ? "Current plan" : "Upgrade to Scale"}
        </button>
        <button
          type="button"
          disabled={pendingAction !== null}
          onClick={() => void openPortal()}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingAction === "portal" ? "Opening portal..." : "Billing portal"}
        </button>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
