import Link from "next/link";
import { prisma } from "@closerflow/db";
import { createWorkspaceAction } from "../actions";
import { requireSessionUser } from "../../lib/auth-guards";

export default async function AppHomePage() {
  const user = await requireSessionUser();

  const memberships = await prisma.workspaceMember.findMany({
    where: {
      userId: user.id,
    },
    include: {
      workspace: {
        include: {
          _count: {
            select: {
              leads: true,
              members: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Your workspaces</p>
          <div className="mt-6 grid gap-4">
            {memberships.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/60 p-6 text-sm text-slate-400">
                No workspace yet. Create one to start routing leads, forms, and funnel traffic.
              </div>
            ) : (
              memberships.map((membership) => (
                <Link
                  key={membership.id}
                  href={`/app/${membership.workspace.slug}`}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition hover:border-emerald-400/40 hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">{membership.workspace.name}</h2>
                      <p className="mt-1 text-sm text-slate-400">Slug: {membership.workspace.slug}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      {membership.role}
                    </span>
                  </div>
                  <div className="mt-5 flex gap-3 text-xs text-slate-400">
                    <span>{membership.workspace._count.members} members</span>
                    <span>{membership.workspace._count.leads} leads</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-emerald-500/15 to-cyan-400/10 p-6">
          <p className="text-sm text-emerald-100/80">Create workspace</p>
          <h2 className="mt-2 text-2xl font-semibold">Spin up a new client or internal workspace</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Every workspace gets its own members, leads, funnels, pipelines, automations, and attribution data.
          </p>
          <form action={createWorkspaceAction} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Workspace name</span>
              <input
                name="name"
                type="text"
                placeholder="Acme Med Spa"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-emerald-400/60"
                required
              />
            </label>
            <button
              type="submit"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
            >
              Create workspace
            </button>
          </form>
        </section>
      </section>
    </div>
  );
}
