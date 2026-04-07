"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type BoardLead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  leadScore: number;
  status: string;
  source: string | null;
  campaign: string | null;
  updatedAt: string;
};

type BoardStage = {
  id: string;
  name: string;
  orderIndex: number;
  leads: BoardLead[];
};

export function CrmBoard({
  workspaceSlug,
  stages,
}: {
  workspaceSlug: string;
  stages: BoardStage[];
}) {
  const router = useRouter();
  const [board, setBoard] = useState(stages);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const leadToStage = useMemo(() => {
    const map = new Map<string, string>();

    for (const stage of board) {
      for (const lead of stage.leads) {
        map.set(lead.id, stage.id);
      }
    }

    return map;
  }, [board]);

  function moveLeadLocally(leadId: string, toStageId: string) {
    setBoard((current) => {
      let movedLead: BoardLead | null = null;

      const nextBoard = current.map((stage) => {
        const remainingLeads = stage.leads.filter((lead) => {
          if (lead.id === leadId) {
            movedLead = lead;
            return false;
          }

          return true;
        });

        return {
          ...stage,
          leads: remainingLeads,
        };
      });

      if (!movedLead) {
        return current;
      }

      return nextBoard.map((stage) =>
        stage.id === toStageId
          ? {
              ...stage,
              leads: [movedLead!, ...stage.leads],
            }
          : stage,
      );
    });
  }

  async function persistMove(leadId: string, toStageId: string) {
    const fromStageId = leadToStage.get(leadId);

    if (!fromStageId || fromStageId === toStageId) {
      return;
    }

    const previousBoard = board;
    moveLeadLocally(leadId, toStageId);
    setMessage(null);

    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/crm/move-lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId,
          toStageId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Unable to move lead.");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setBoard(previousBoard);
      setMessage(error instanceof Error ? error.message : "Unable to move lead.");
    }
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-rose-300">{message}</p> : null}
      <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-5">
        {board
          .slice()
          .sort((left, right) => left.orderIndex - right.orderIndex)
          .map((stage) => (
            <section
              key={stage.id}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const leadId = event.dataTransfer.getData("text/plain");

                if (leadId) {
                  void persistMove(leadId, stage.id);
                }
              }}
              className="min-h-[340px] rounded-[28px] border border-white/10 bg-white/5 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{stage.name}</h3>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{stage.leads.length} leads</p>
                </div>
              </div>

              <div className="space-y-3">
                {stage.leads.map((lead) => (
                  <article
                    key={lead.id}
                    draggable={!isPending}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", lead.id);
                    }}
                    className="cursor-grab rounded-2xl border border-white/10 bg-slate-900/80 p-4 active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/app/${workspaceSlug}/leads/${lead.id}`} className="font-medium text-white underline-offset-4 hover:underline">
                          {lead.name}
                        </Link>
                        <p className="mt-1 text-sm text-slate-400">{lead.email || lead.phone || "No contact value supplied"}</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                        {lead.leadScore}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <span>{lead.status}</span>
                      <span className="text-right">{lead.source || lead.campaign || "No source"}</span>
                    </div>
                  </article>
                ))}

                {stage.leads.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-4 text-sm text-slate-500">
                    Drop a lead here.
                  </div>
                ) : null}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}

