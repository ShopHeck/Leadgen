"use client";

import { FormEvent, useState } from "react";

type SubmissionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function LeadCaptureForm() {
  const [state, setState] = useState<SubmissionState>({ status: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setState({ status: "idle" });

    const form = new FormData(event.currentTarget);

    const payload = {
      workspaceSlug: String(form.get("workspaceSlug") ?? "").trim(),
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      pageUrl: typeof window !== "undefined" ? window.location.href : "",
      utm: {
        source: String(form.get("utmSource") ?? "").trim(),
        medium: String(form.get("utmMedium") ?? "").trim(),
        campaign: String(form.get("utmCampaign") ?? "").trim(),
      },
      answers: {
        budget: String(form.get("budget") ?? "").trim(),
        urgency: String(form.get("urgency") ?? "").trim(),
        decisionMaker: String(form.get("decisionMaker") ?? "").trim(),
        location: String(form.get("location") ?? "").trim(),
      },
    };

    try {
      const response = await fetch("/api/public/form-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to submit lead.");
      }

      event.currentTarget.reset();
      setState({ status: "success", message: "Lead captured. Check the workspace dashboard for the new record." });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-panel">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-pine/70">Public form demo</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Send a lead into the new ingestion endpoint</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Replace the workspace slug with one you created after signing up.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <input name="workspaceSlug" placeholder="workspace slug" required className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pine" />
        <input name="name" placeholder="lead name" required className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pine" />
        <input name="email" type="email" placeholder="email" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pine" />
        <input name="phone" placeholder="phone" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pine" />
        <input name="utmSource" placeholder="utm source" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pine" />
        <input name="utmMedium" placeholder="utm medium" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pine" />
        <input name="budget" placeholder="budget (e.g. 5k/month)" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pine" />
        <input name="urgency" placeholder="urgency (e.g. ASAP)" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pine" />
        <input name="decisionMaker" placeholder="decision-maker? (yes/no)" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pine" />
        <input name="location" placeholder="location" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pine" />
      </div>
      <input name="utmCampaign" placeholder="utm campaign" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pine" />
      {state.status !== "idle" ? (
        <p className={`text-sm ${state.status === "success" ? "text-emerald-700" : "text-rose-600"}`}>{state.message}</p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex rounded-full bg-pine px-5 py-3 text-sm font-medium text-white transition hover:bg-[#163d32] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Submitting..." : "Submit lead"}
      </button>
    </form>
  );
}
