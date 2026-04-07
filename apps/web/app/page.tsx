import Link from "next/link";
import { FeatureCard } from "@closerflow/ui";
import { LeadCaptureForm } from "../components/lead-capture-form";

const features = [
  "Capture leads from public forms and funnels",
  "Score and qualify contacts for sales teams",
  "Run event-driven SMS and email automations",
  "Track pipeline progress, bookings, and revenue",
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-8 shadow-panel backdrop-blur md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-pine/20 bg-pine/5 px-4 py-2 text-sm font-medium text-pine">
                Task 1 scaffold complete
              </span>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-ink md:text-6xl">
                  CloserFlow AI gives operators one system for capture, qualification, nurture, and booking.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-600">
                  This monorepo is structured for the next implementation steps: auth and workspaces, lead ingestion, CRM pipeline, messaging, booking, dashboard analytics, and billing.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-full bg-mist px-3 py-2">Next.js App Router</span>
                <span className="rounded-full bg-mist px-3 py-2">TypeScript workspaces</span>
                <span className="rounded-full bg-mist px-3 py-2">Tailwind CSS</span>
                <span className="rounded-full bg-mist px-3 py-2">Prisma + PostgreSQL</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/signup" className="rounded-full bg-pine px-5 py-3 text-sm font-medium text-white transition hover:bg-[#163d32]">
                  Create account
                </Link>
                <Link href="/login" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-white">
                  Sign in
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-6 text-sm text-slate-100">
              <p className="text-xs uppercase tracking-[0.3em] text-sage">Initial structure</p>
              <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm leading-7 text-slate-300">{`apps/
  web/
packages/
  db/
  types/
  ui/
docs/
tasks/`}</pre>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature} title={feature} />
          ))}
        </section>

        <LeadCaptureForm />
      </div>
    </main>
  );
}
