import Link from "next/link";
import { prisma } from "@closerflow/db";
import { requireWorkspaceMembership } from "../../../lib/auth-guards";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const membership = await requireWorkspaceMembership(workspaceSlug);

  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: membership.workspaceId },
    include: {
      leads: {
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
      },
      funnels: true,
      _count: {
        select: {
          members: true,
          leads: true,
          funnels: true,
          automations: true,
          messages: true,
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Workspace</p>
            <h2 className="mt-2 text-3xl font-semibold">{workspace.name}</h2>
            <p className="mt-2 text-sm text-slate-400">
              Signed in as {membership.user.email} with {membership.role.toLowerCase()} access.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/app/${workspace.slug}/dashboard`}
              className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
            >
              Dashboard
            </Link>
            <Link
              href={`/app/${workspace.slug}/crm`}
              className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Open CRM board
            </Link>
            <Link
              href={`/app/${workspace.slug}/automations`}
              className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Automations
            </Link>
            <Link
              href={`/app/${workspace.slug}/messages`}
              className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              View messages
            </Link>
            <Link
              href={`/app/${workspace.slug}/bookings`}
              className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              View bookings
            </Link>
            <Link
              href={`/app/${workspace.slug}/conversations`}
              className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Conversations
            </Link>
            <Link
              href={`/app/${workspace.slug}/billing`}
              className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Billing
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Members", value: workspace._count.members },
          { label: "Leads", value: workspace._count.leads },
          { label: "Messages", value: workspace._count.messages },
          { label: "Automations", value: workspace._count.automations },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent leads</h3>
            <span className="text-sm text-slate-500">Task 3 data path</span>
          </div>
          <div className="mt-5 space-y-3">
            {workspace.leads.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/70 p-6 text-sm text-slate-400">
                No leads yet. Post to <code className="text-slate-200">/api/public/form-submit</code> with this workspace slug to ingest one.
              </div>
            ) : (
              workspace.leads.map((lead) => (
                <div key={lead.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{lead.name}</p>
                      <p className="text-sm text-slate-400">{lead.email || lead.phone || "No contact value supplied"}</p>
                    </div>
                    <div className="text-right text-sm text-slate-400">
                      <p>{lead.status}</p>
                      <p>{lead.utmCampaign || lead.campaign || "No campaign"}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Public capture example</h3>
            <Link href={`/app/${workspace.slug}/settings`} className="text-sm text-slate-300 underline-offset-4 hover:underline">
              Settings
            </Link>
          </div>
          <pre className="mt-5 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-300">{`POST /api/public/form-submit
{
  "workspaceSlug": "${workspace.slug}",
  "name": "Jordan Avery",
  "email": "jordan@example.com",
  "phone": "+15555555555",
  "utm": {
    "source": "facebook",
    "medium": "paid-social",
    "campaign": "summer-offer"
  }
}`}</pre>
        </div>
      </section>
    </div>
  );
}
