"use client";

import { FormEvent, useState } from "react";

type RevenueEvent = {
  id: string;
  amount: string;
  status: string;
  createdAt: string;
};

export function LeadRevenueForm({
  workspaceSlug,
  leadId,
  initialEvents,
}: {
  workspaceSlug: string;
  leadId: string;
  initialEvents: RevenueEvent[];
}) {
  const [events, setEvents] = useState<RevenueEvent[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(e.currentTarget);
    const amount = parseFloat(String(form.get("amount") || "0"));
    const status = String(form.get("status") || "CONFIRMED");

    if (!amount || amount <= 0) {
      setError("Enter a valid amount greater than $0.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/leads/${leadId}/revenue`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, status }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to record revenue.");
      }

      setEvents((prev) => [data.event, ...prev]);
      setSuccess(`$${amount.toLocaleString()} revenue recorded.`);
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const totalRevenue = events.reduce(
    (sum, ev) => sum + (ev.status !== "REFUNDED" ? parseFloat(ev.amount) : 0),
    0,
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Revenue</h3>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300">
          ${totalRevenue.toLocaleString()}
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Amount ($)"
          required
          className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
        />
        <select
          name="status"
          defaultValue="CONFIRMED"
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
        >
          <option value="CONFIRMED">Confirmed</option>
          <option value="PENDING">Pending</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:opacity-70"
        >
          {loading ? "Saving..." : "Record"}
        </button>
      </form>

      {error && <p className="text-sm text-rose-300">{error}</p>}
      {success && <p className="text-sm text-emerald-300">{success}</p>}

      {/* Event list */}
      {events.length > 0 && (
        <div className="space-y-2">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    ev.status === "CONFIRMED"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : ev.status === "REFUNDED"
                        ? "bg-rose-500/10 text-rose-300"
                        : "bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {ev.status}
                </span>
                <span className="text-sm font-medium text-white">
                  ${parseFloat(ev.amount).toLocaleString()}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {new Date(ev.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
