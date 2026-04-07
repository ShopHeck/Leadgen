"use client";

import { useEffect, useState } from "react";

type AiScoreResponse = {
  provider: "openai" | "fallback";
  score: number;
  band: string;
  factors: Array<{ label: string; points: number; reason: string }>;
  summary: string[];
  painPoint: string;
  closeLikelihood: "high" | "medium" | "low";
  nextAction: string;
};

export function LeadAiScorePanel({
  workspaceSlug,
  leadId,
}: {
  workspaceSlug: string;
  leadId: string;
}) {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    data: AiScoreResponse | null;
  }>({
    loading: true,
    error: null,
    data: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/workspaces/${workspaceSlug}/leads/${leadId}/ai-score`);
        const data = (await response.json()) as AiScoreResponse | { error?: string };

        if (!response.ok) {
          throw new Error("error" in data && data.error ? data.error : "Unable to score lead.");
        }

        if (!cancelled) {
          setState({
            loading: false,
            error: null,
            data: data as AiScoreResponse,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            error: error instanceof Error ? error.message : "Unable to score lead.",
            data: null,
          });
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, leadId]);

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI scoring</h3>
        <span className="text-sm text-slate-500">{state.data?.provider === "openai" ? "OpenAI" : "Fallback"}</span>
      </div>

      {state.loading ? <p className="mt-5 text-sm text-slate-400">Generating score analysis...</p> : null}
      {state.error ? <p className="mt-5 text-sm text-rose-300">{state.error}</p> : null}

      {state.data ? (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300">
              Score {state.data.score}
            </span>
            <span className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200">{state.data.band}</span>
            <span className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200">
              Close likelihood: {state.data.closeLikelihood}
            </span>
          </div>

          <div className="space-y-2">
            {state.data.summary.map((item) => (
              <p key={item} className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
                {item}
              </p>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pain point</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">{state.data.painPoint}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Next action</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">{state.data.nextAction}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

