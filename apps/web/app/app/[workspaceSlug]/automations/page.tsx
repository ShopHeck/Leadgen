import Link from "next/link";
import { prisma } from "@closerflow/db";
import { createAutomationAction, processAutomationRunsAction } from "../../../../app/actions";
import { requireWorkspaceFeature, requireWorkspaceRole } from "../../../../lib/auth-guards";

function formatDate(value: Date | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function WorkspaceAutomationsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const membership = await requireWorkspaceRole(workspaceSlug, "ADMIN");
  const feature = await requireWorkspaceFeature(workspaceSlug, "automations");

  if (!membership) {
    return (
      <div className="rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-8 text-rose-100">
        <p className="text-sm uppercase tracking-[0.24em] text-rose-200/70">Forbidden</p>
        <h2 className="mt-3 text-2xl font-semibold">Admin access is required for automations.</h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-rose-50/80">
          Automation triggers, outbound actions, and retry controls are limited to workspace admins.
        </p>
      </div>
    );
  }

  if (!feature.enabled) {
    return (
      <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-8 text-amber-100">
        <p className="text-sm uppercase tracking-[0.24em] text-amber-200/70">Upgrade required</p>
        <h2 className="mt-3 text-2xl font-semibold">Automations are available on the Pro plan and above.</h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-amber-50/80">
          Upgrade this workspace to unlock event-based workflows, retries, and AI-assisted follow-up triggers.
        </p>
        <Link href={`/app/${workspaceSlug}/billing`} className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200">
          Open billing
        </Link>
      </div>
    );
  }

  const [automations, runs] = await Promise.all([
    prisma.automation.findMany({
      where: {
        workspaceId: membership.workspaceId,
      },
      orderBy: {
        createdAt: "desc",
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
      take: 20,
    }),
  ]);

  const createAction = createAutomationAction.bind(null, workspaceSlug);
  const processAction = processAutomationRunsAction.bind(null, workspaceSlug);

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Automations</p>
            <h2 className="mt-2 text-3xl font-semibold">Event-based workflows</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Trigger SMS, email, notes, and stage changes from events like lead creation, lead scoring, booking creation, and message delivery.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <form action={processAction}>
              <button
                type="submit"
                className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Process retries
              </button>
            </form>
            <Link
              href={`/app/${workspaceSlug}`}
              className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Workspace overview
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold">Create automation</h3>
          <form action={createAction} className="mt-5 space-y-4">
            <input
              name="name"
              placeholder="Hot lead SMS follow-up"
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <select
                name="triggerType"
                defaultValue="lead.created"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
              >
                <option value="lead.created">lead.created</option>
                <option value="lead.scored">lead.scored</option>
                <option value="booking.created">booking.created</option>
                <option value="message.sent">message.sent</option>
              </select>
              <select
                name="actionType"
                defaultValue="send_sms"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
              >
                <option value="send_sms">Send SMS</option>
                <option value="send_email">Send email</option>
                <option value="add_note">Add note</option>
                <option value="move_stage">Move stage</option>
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="minScore"
                type="number"
                min="0"
                max="100"
                placeholder="Minimum score"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
              />
              <input
                name="scoreBand"
                placeholder="Score band: HOT/WARM/NURTURE"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
              />
              <input
                name="source"
                placeholder="Source filter: facebook"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
              />
              <input
                name="channel"
                placeholder="Channel filter: SMS/EMAIL"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
              />
            </div>
            <input
              name="actionSubject"
              placeholder="Email subject"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
            />
            <textarea
              name="actionBody"
              rows={5}
              placeholder="Use {{leadName}}, {{leadEmail}}, {{leadPhone}}, {{leadScore}}, and {{leadScoreBand}} in message or note bodies."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
            />
            <input
              name="targetStage"
              placeholder="Target stage name for move_stage, e.g. Attempting Contact"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
            />
            <input
              name="maxRetries"
              type="number"
              min="1"
              max="5"
              defaultValue="3"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
            />
            <button
              type="submit"
              className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
            >
              Save automation
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Active automations</h3>
              <span className="text-sm text-slate-500">{automations.length} configured</span>
            </div>
            <div className="mt-5 space-y-3">
              {automations.map((automation) => (
                <div key={automation.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{automation.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Trigger: {automation.triggerType} · Retries: {automation.maxRetries}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      {automation.isActive ? "ACTIVE" : "PAUSED"}
                    </span>
                  </div>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-3 text-xs leading-6 text-slate-300">
                    {JSON.stringify(
                      {
                        conditions: automation.conditionsJson,
                        actions: automation.actionsJson,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              ))}
              {automations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-4 text-sm text-slate-500">
                  No automations yet. Create one to start reacting to lead, message, and booking events.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent runs</h3>
              <span className="text-sm text-slate-500">{runs.length} shown</span>
            </div>
            <div className="mt-5 space-y-3">
              {runs.map((run) => (
                <div key={run.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{run.automation.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {run.eventType} · {run.lead?.name || "No lead"} · attempt {run.attemptCount}/{run.maxAttempts}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">{run.status}</span>
                  </div>
                  {run.lastError ? <p className="mt-3 text-sm text-rose-300">{run.lastError}</p> : null}
                  <p className="mt-3 text-xs text-slate-500">Created {formatDate(run.createdAt)} · Next retry {formatDate(run.nextRetryAt)}</p>
                </div>
              ))}
              {runs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-4 text-sm text-slate-500">
                  No automation runs yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
