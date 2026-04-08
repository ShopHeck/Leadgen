import { prisma } from "@closerflow/db";
import Link from "next/link";
import { updateAiAutopilotAction } from "../../../../app/actions";
import { requireWorkspaceRole } from "../../../../lib/auth-guards";
import { hasWorkspaceFeature } from "../../../../lib/billing";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const membership = await requireWorkspaceRole(workspaceSlug, "ADMIN");

  if (!membership) {
    return (
      <div className="rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-8 text-rose-100">
        <p className="text-sm uppercase tracking-[0.24em] text-rose-200/70">Forbidden</p>
        <h2 className="mt-3 text-2xl font-semibold">Admin access is required for workspace settings.</h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-rose-50/80">
          Task 2 requires role-based access. This route is intentionally limited to admins so workspace-level configuration is not open to every member.
        </p>
      </div>
    );
  }

  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId: membership.workspaceId,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  const aiAutopilotAction = updateAiAutopilotAction.bind(null, workspaceSlug);
  const aiEnabled = hasWorkspaceFeature(membership.workspace.plan, "ai_conversations");

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Admin settings</p>
        <h2 className="mt-2 text-3xl font-semibold">{membership.workspace.name}</h2>
        <p className="mt-3 text-sm text-slate-400">Current member roster and role assignments.</p>
        <div className="mt-6 space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div>
                <p className="font-medium text-white">{member.user.email}</p>
                <p className="text-sm text-slate-400">
                  {[member.user.firstName, member.user.lastName].filter(Boolean).join(" ") || "No profile name"}
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Calendly webhook</p>
        <h3 className="mt-2 text-xl font-semibold">Workspace booking endpoint</h3>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Use this webhook URL for Calendly invitee events. Pass the workspace slug so bookings resolve to the correct tenant and lead.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-300">{`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/public/calendly?workspaceSlug=${membership.workspace.slug}`}</pre>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Twilio inbound</p>
        <h3 className="mt-2 text-xl font-semibold">Conversation webhook and autopilot</h3>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Use this webhook URL for inbound SMS. When AI autopilot is enabled on an eligible plan, inbound SMS replies can be summarized and answered automatically.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-300">{`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/public/twilio/inbound?workspaceSlug=${membership.workspace.slug}`}</pre>
        {aiEnabled ? (
          <form action={aiAutopilotAction} className="mt-5 flex flex-wrap items-center gap-3">
            <input type="hidden" name="enabled" value={membership.workspace.aiAutopilotEnabled ? "false" : "true"} />
            <button
              type="submit"
              className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
            >
              {membership.workspace.aiAutopilotEnabled ? "Disable AI autopilot" : "Enable AI autopilot"}
            </button>
            <span className="text-sm text-slate-400">
              Current state: {membership.workspace.aiAutopilotEnabled ? "enabled" : "disabled"}
            </span>
          </form>
        ) : (
          <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            AI autopilot is available on the Pro plan and above.{" "}
            <Link href={`/app/${workspaceSlug}/billing`} className="underline underline-offset-4">
              Upgrade this workspace
            </Link>
            .
          </div>
        )}
      </div>
    </div>
  );
}
