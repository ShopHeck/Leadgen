import Link from "next/link";
import { ReactNode } from "react";
import { requireSessionUser } from "../../lib/auth-guards";
import { SignOutButton } from "../../components/sign-out-button";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireSessionUser();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8 lg:px-8">
        <aside className="hidden w-64 shrink-0 rounded-[28px] border border-white/10 bg-white/5 p-6 lg:block">
          <Link href="/app" className="text-lg font-semibold tracking-tight">
            CloserFlow AI
          </Link>
          <p className="mt-3 text-sm text-slate-400">Auth, workspaces, and public lead capture are now active.</p>
          <nav className="mt-8 space-y-3 text-sm text-slate-300">
            <Link href="/app" className="block rounded-xl px-3 py-2 transition hover:bg-white/10">
              Workspaces
            </Link>
            <div className="rounded-xl border border-dashed border-white/10 px-3 py-3 text-xs uppercase tracking-[0.2em] text-slate-500">
              Open a workspace to reach CRM
            </div>
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Authenticated app</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Workspace operations</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                {user.email}
              </div>
              <SignOutButton />
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
