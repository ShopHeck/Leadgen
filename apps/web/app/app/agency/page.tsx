import Link from "next/link";
import { prisma } from "@closerflow/db";
import { requireSessionUser } from "../../../lib/auth-guards";

export default async function AgencyPage() {
  const user = await requireSessionUser();

  const orgMemberships = await prisma.organizationMember.findMany({
    where: { userId: user.id },
    include: {
      organization: {
        include: {
          workspaces: {
            include: {
              _count: {
                select: {
                  leads: true,
                  members: true,
                  messages: true,
                  appointments: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { workspaces: true, members: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Agency Mode</p>
            <h2 className="mt-2 text-3xl font-semibold">Organization Management</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Manage your agency account, create client workspaces, and monitor performance across all sub-accounts from one dashboard.
            </p>
          </div>
          <Link
            href="/app"
            className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Back to workspaces
          </Link>
        </div>
      </section>

      {orgMemberships.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-white/10 bg-slate-900/70 p-8">
          <h3 className="text-xl font-semibold text-slate-200">No organizations yet</h3>
          <p className="mt-3 max-w-lg text-sm leading-7 text-slate-400">
            Create an organization to manage multiple client workspaces under one agency account.
            Use the API to create your first organization:
          </p>
          <pre className="mt-5 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-300">{`POST /api/organizations
{
  "name": "My Agency",
  "brandColor": "#6366f1"
}`}</pre>
        </section>
      ) : (
        orgMemberships.map((membership) => (
          <section key={membership.organization.id} className="space-y-6">
            {/* Org Header */}
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: membership.organization.brandColor || "#6366f1" }}
                >
                  {membership.organization.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{membership.organization.name}</h3>
                  <p className="text-sm text-slate-400">
                    {membership.role} &middot; {membership.organization._count.workspaces} workspace(s) &middot; {membership.organization._count.members} member(s)
                  </p>
                </div>
              </div>
            </div>

            {/* Aggregate Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              {(() => {
                const totalLeads = membership.organization.workspaces.reduce((s, w) => s + w._count.leads, 0);
                const totalMembers = membership.organization.workspaces.reduce((s, w) => s + w._count.members, 0);
                const totalMessages = membership.organization.workspaces.reduce((s, w) => s + w._count.messages, 0);
                const totalBookings = membership.organization.workspaces.reduce((s, w) => s + w._count.appointments, 0);
                return [
                  { label: "Total Leads", value: totalLeads },
                  { label: "Total Members", value: totalMembers },
                  { label: "Total Messages", value: totalMessages },
                  { label: "Total Bookings", value: totalBookings },
                ].map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                  </div>
                ));
              })()}
            </div>

            {/* Workspace List */}
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <h4 className="text-lg font-semibold">Client Workspaces</h4>
              <div className="mt-5 space-y-3">
                {membership.organization.workspaces.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/70 p-6 text-sm text-slate-400">
                    No workspaces yet. Create one via the API.
                  </div>
                ) : (
                  membership.organization.workspaces.map((workspace) => (
                    <Link
                      key={workspace.id}
                      href={`/app/${workspace.slug}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition hover:border-white/20 hover:bg-slate-900/90"
                    >
                      <div>
                        <p className="font-medium text-white">{workspace.name}</p>
                        <p className="text-sm text-slate-400">/{workspace.slug}</p>
                      </div>
                      <div className="flex gap-4 text-right text-xs text-slate-400">
                        <span>{workspace._count.leads} leads</span>
                        <span>{workspace._count.appointments} bookings</span>
                        <span>{workspace._count.messages} msgs</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
