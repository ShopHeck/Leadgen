import Link from "next/link";
import { ReactNode } from "react";

export function AuthPanel({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-cyan-400/10 to-slate-950 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-100/80">CloserFlow AI</p>
          <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight">Qualify and convert leads before your team opens the CRM.</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
            AI-powered lead capture, scoring, and instant follow-up. Respond to leads in under 60 seconds, book more appointments, and track every dollar back to its source.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">AI instant follow-up via SMS &amp; email</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">CRM pipeline with drag-and-drop stages</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Full attribution &amp; revenue analytics</div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white p-8 text-slate-950 shadow-2xl shadow-black/20">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
          </div>
          <div className="mt-8">{children}</div>
          <div className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-600">{footer}</div>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
            Back to home
          </Link>
        </section>
      </div>
    </main>
  );
}
