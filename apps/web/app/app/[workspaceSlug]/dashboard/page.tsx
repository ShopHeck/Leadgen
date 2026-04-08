import Link from "next/link";
import { RevenueEventStatus } from "@closerflow/db";
import { requireWorkspaceMembership } from "../../../../lib/auth-guards";
import { prisma } from "@closerflow/db";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMinutes(value: number | null) {
  if (value == null) {
    return "No replies yet";
  }

  return `${Math.round(value)} min`;
}

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const membership = await requireWorkspaceMembership(workspaceSlug);

  const [workspace, leads, automationRuns] = await Promise.all([
    prisma.workspace.findUniqueOrThrow({
      where: { id: membership.workspaceId },
      include: {
        _count: {
          select: {
            leads: true,
            automations: true,
            appointments: true,
            messages: true,
          },
        },
      },
    }),
    prisma.lead.findMany({
      where: {
        workspaceId: membership.workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        appointments: true,
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
        revenueEvents: true,
      },
    }),
    prisma.automationRun.findMany({
      where: {
        workspaceId: membership.workspaceId,
      },
      include: {
        automation: true,
        lead: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
  ]);

  const totalRevenue = leads.reduce((total, lead) => {
    return (
      total +
      lead.revenueEvents.reduce((sum, event) => {
        if (event.status !== RevenueEventStatus.CONFIRMED) {
          return sum;
        }

        return sum + Number(event.amount);
      }, 0)
    );
  }, 0);

  const bookedAppointments = leads.flatMap((lead) => lead.appointments).filter((appointment) =>
    ["SCHEDULED", "CONFIRMED", "COMPLETED"].includes(appointment.status),
  );
  const completedAppointments = leads.flatMap((lead) => lead.appointments).filter((appointment) => appointment.status === "COMPLETED");
  const hotLeads = leads.filter((lead) => lead.scoreBand === "HOT").length;

  const responseTimes = leads
    .map((lead) => {
      const firstOutbound = lead.messages.find((message) => message.direction === "OUTBOUND");

      if (!firstOutbound) {
        return null;
      }

      return (firstOutbound.createdAt.getTime() - lead.createdAt.getTime()) / (1000 * 60);
    })
    .filter((value): value is number => typeof value === "number" && value >= 0);

  const avgResponseMinutes =
    responseTimes.length > 0 ? responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length : null;

  const sourceMap = new Map<
    string,
    { leads: number; booked: number; revenue: number }
  >();

  for (const lead of leads) {
    const key = lead.utmSource || lead.source || "unknown";
    const current = sourceMap.get(key) || { leads: 0, booked: 0, revenue: 0 };
    current.leads += 1;
    current.booked += lead.appointments.filter((appointment) => ["SCHEDULED", "CONFIRMED", "COMPLETED"].includes(appointment.status)).length;
    current.revenue += lead.revenueEvents.reduce((sum, event) => (event.status === RevenueEventStatus.CONFIRMED ? sum + Number(event.amount) : sum), 0);
    sourceMap.set(key, current);
  }

  const sourceRows = Array.from(sourceMap.entries())
    .map(([source, value]) => ({
      source,
      ...value,
    }))
    .sort((left, right) => right.revenue - left.revenue || right.leads - left.leads);

  const recentAppointments = leads
    .flatMap((lead) =>
      lead.appointments.map((appointment) => ({
        id: appointment.id,
        leadId: lead.id,
        leadName: lead.name,
        startAt: appointment.startAt,
        status: appointment.status,
        provider: appointment.provider,
      })),
    )
    .sort((left, right) => right.startAt.getTime() - left.startAt.getTime())
    .slice(0, 8);

  const failedRuns = automationRuns.filter((run) => run.status === "FAILED" || run.status === "RETRY_SCHEDULED");

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Dashboard</p>
            <h2 className="mt-2 text-3xl font-semibold">{workspace.name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Live operating view for lead volume, booking conversion, automation health, and revenue attribution.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/app/${workspaceSlug}/crm`} className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
              CRM
            </Link>
            <Link href={`/app/${workspaceSlug}/billing`} className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
              Billing
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Leads", value: workspace._count.leads },
          { label: "Hot leads", value: hotLeads },
          { label: "Bookings", value: bookedAppointments.length },
          { label: "Revenue", value: formatCurrency(totalRevenue) },
          { label: "Avg reply", value: formatMinutes(avgResponseMinutes) },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Source attribution</h3>
            <span className="text-sm text-slate-500">{sourceRows.length} sources</span>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-slate-950/70 text-left text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Leads</th>
                  <th className="px-4 py-3 font-medium">Bookings</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-900/50">
                {sourceRows.map((row) => (
                  <tr key={row.source}>
                    <td className="px-4 py-3 text-white">{row.source}</td>
                    <td className="px-4 py-3 text-slate-300">{row.leads}</td>
                    <td className="px-4 py-3 text-slate-300">{row.booked}</td>
                    <td className="px-4 py-3 text-slate-300">{formatCurrency(row.revenue)}</td>
                  </tr>
                ))}
                {sourceRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-slate-500">
                      No attribution data yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Booking performance</h3>
              <span className="text-sm text-slate-500">
                Show rate {bookedAppointments.length > 0 ? `${Math.round((completedAppointments.length / bookedAppointments.length) * 100)}%` : "0%"}
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {recentAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Link href={`/app/${workspaceSlug}/leads/${appointment.leadId}`} className="font-medium text-white underline-offset-4 hover:underline">
                        {appointment.leadName}
                      </Link>
                      <p className="mt-1 text-sm text-slate-400">
                        {appointment.provider} · {appointment.status}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">{appointment.startAt.toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {recentAppointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-4 text-sm text-slate-500">
                  No bookings yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Automation health</h3>
              <span className="text-sm text-slate-500">{workspace._count.automations} workflows</span>
            </div>
            <div className="mt-5 space-y-3">
              {failedRuns.map((run) => (
                <div key={run.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="font-medium text-white">{run.automation.name}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {run.lead?.name || "No lead"} · {run.status}
                  </p>
                  {run.lastError ? <p className="mt-3 text-sm text-rose-300">{run.lastError}</p> : null}
                </div>
              ))}
              {failedRuns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-4 text-sm text-slate-500">
                  No failed or retry-scheduled automation runs.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
