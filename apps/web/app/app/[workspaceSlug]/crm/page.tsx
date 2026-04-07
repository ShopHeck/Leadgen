import { prisma } from "@closerflow/db";
import Link from "next/link";
import { CrmBoard } from "../../../../components/crm-board";
import { requireWorkspaceMembership } from "../../../../lib/auth-guards";
import { ensureDefaultPipelineForWorkspace } from "../../../../lib/crm";

export default async function CrmPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const membership = await requireWorkspaceMembership(workspaceSlug);

  const { pipeline } = await ensureDefaultPipelineForWorkspace(prisma, membership.workspaceId);

  const hydratedPipeline = await prisma.pipeline.findUniqueOrThrow({
    where: {
      id: pipeline.id,
    },
    include: {
      stages: {
        orderBy: {
          orderIndex: "asc",
        },
        include: {
          leads: {
            where: {
              workspaceId: membership.workspaceId,
            },
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
      },
    },
  });

  const totalLeads = hydratedPipeline.stages.reduce((count: number, stage) => count + stage.leads.length, 0);

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">CRM pipeline</p>
            <h2 className="mt-2 text-3xl font-semibold">Lifecycle board</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Leads are grouped by lifecycle stage and can be dragged across the board. Every move persists immediately and is written to stage history.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/app/${workspaceSlug}`}
              className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Workspace overview
            </Link>
            <Link
              href={`/app/${workspaceSlug}/messages`}
              className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Message log
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Board stages</p>
          <p className="mt-3 text-3xl font-semibold">{hydratedPipeline.stages.length}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Tracked leads</p>
          <p className="mt-3 text-3xl font-semibold">{totalLeads}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Pipeline</p>
          <p className="mt-3 text-3xl font-semibold">{hydratedPipeline.name}</p>
        </div>
      </section>

      <CrmBoard
        workspaceSlug={workspaceSlug}
        stages={hydratedPipeline.stages.map((stage) => ({
          id: stage.id,
          name: stage.name,
          orderIndex: stage.orderIndex,
          leads: stage.leads.map((lead) => ({
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            leadScore: lead.leadScore,
            status: lead.status,
            source: lead.utmSource || lead.source,
            campaign: lead.utmCampaign || lead.campaign,
            updatedAt: lead.updatedAt.toISOString(),
          })),
        }))}
      />
    </div>
  );
}
