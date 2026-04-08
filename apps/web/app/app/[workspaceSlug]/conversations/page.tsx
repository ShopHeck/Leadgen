import Link from "next/link";
import { prisma } from "@closerflow/db";
import { requireWorkspaceFeature } from "../../../../lib/auth-guards";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function WorkspaceConversationsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const { membership, enabled } = await requireWorkspaceFeature(workspaceSlug, "ai_conversations");

  if (!enabled) {
    return (
      <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-8 text-amber-100">
        <p className="text-sm uppercase tracking-[0.24em] text-amber-200/70">Upgrade required</p>
        <h2 className="mt-3 text-2xl font-semibold">Inbound AI conversations are on the Pro plan and above.</h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-amber-50/80">
          Upgrade this workspace to enable Twilio inbound handling, AI replies, and the conversation inbox.
        </p>
        <Link href={`/app/${workspaceSlug}/billing`} className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200">
          Open billing
        </Link>
      </div>
    );
  }

  const leads = await prisma.lead.findMany({
    where: {
      workspaceId: membership.workspaceId,
      messages: {
        some: {},
      },
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 25,
  });

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Conversations</p>
            <h2 className="mt-2 text-3xl font-semibold">Inbound AI inbox</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Review recent inbound and outbound SMS/email threads, AI-generated replies, and lead-level response context.
            </p>
          </div>
          <Link href={`/app/${workspaceSlug}/settings`} className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
            Settings
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        {leads.map((lead) => (
          <div key={lead.id} className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link href={`/app/${workspaceSlug}/leads/${lead.id}`} className="text-lg font-semibold text-white underline-offset-4 hover:underline">
                  {lead.name}
                </Link>
                <p className="mt-1 text-sm text-slate-400">{lead.email || lead.phone || "No contact value"}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-slate-200">Score {lead.leadScore}</span>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-slate-300">{lead.scoreBand}</span>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {lead.messages.map((message) => (
                <div key={message.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-slate-200">{message.direction}</span>
                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-slate-300">{message.channel}</span>
                      {message.aiGenerated ? (
                        <span className="rounded-full border border-emerald-400/30 px-2.5 py-1 text-emerald-300">AI reply</span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500">{formatDate(message.createdAt)}</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{message.body}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {leads.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-500">
            No conversations yet. Configure the Twilio inbound webhook in workspace settings and send a reply from a lead phone number.
          </div>
        ) : null}
      </section>
    </div>
  );
}
