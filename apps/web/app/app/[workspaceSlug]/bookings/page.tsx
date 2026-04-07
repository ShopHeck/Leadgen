import Link from "next/link";
import { prisma } from "@closerflow/db";
import { requireWorkspaceMembership } from "../../../../lib/auth-guards";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function WorkspaceBookingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const membership = await requireWorkspaceMembership(workspaceSlug);

  const appointments = await prisma.appointment.findMany({
    where: {
      workspaceId: membership.workspaceId,
    },
    include: {
      lead: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: {
      startAt: "asc",
    },
    take: 50,
  });

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Bookings</p>
            <h2 className="mt-2 text-3xl font-semibold">Appointments</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Manual and Calendly-driven bookings live here. Booking creation also advances the lead through the lifecycle pipeline.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/app/${workspaceSlug}/automations`}
              className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Automations
            </Link>
            <Link
              href={`/app/${workspaceSlug}/crm`}
              className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              CRM
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Upcoming and recent appointments</h3>
          <span className="text-sm text-slate-500">{appointments.length} shown</span>
        </div>
        <div className="mt-5 space-y-3">
          {appointments.map((appointment) => (
            <article key={appointment.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-slate-200">{appointment.provider}</span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-slate-300">{appointment.status}</span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-white">
                    <Link href={`/app/${workspaceSlug}/leads/${appointment.lead.id}`} className="underline-offset-4 hover:underline">
                      {appointment.lead.name}
                    </Link>
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {appointment.inviteeEmail || appointment.lead.email || appointment.lead.phone || "No invitee contact stored"}
                  </p>
                  {appointment.notes ? <p className="mt-3 text-sm leading-7 text-slate-300">{appointment.notes}</p> : null}
                </div>
                <p className="shrink-0 text-xs text-slate-500">{formatDate(appointment.startAt)}</p>
              </div>
            </article>
          ))}
          {appointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-4 text-sm text-slate-500">
              No appointments yet. Create one from a lead record or post a Calendly webhook.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
