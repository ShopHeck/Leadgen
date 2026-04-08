import { SubscriptionStatus } from "@closerflow/db";
import Link from "next/link";
import { BillingActions } from "../../../../components/billing-actions";
import { requireWorkspaceMembership } from "../../../../lib/auth-guards";
import { PLAN_DEFINITIONS } from "../../../../lib/billing";

function formatDate(value: Date | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(value);
}

export default async function WorkspaceBillingPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const membership = await requireWorkspaceMembership(workspaceSlug);
  const workspace = membership.workspace;
  const currentPlan = PLAN_DEFINITIONS[workspace.plan];
  const planEntries = Object.entries(PLAN_DEFINITIONS) as Array<
    [keyof typeof PLAN_DEFINITIONS, (typeof PLAN_DEFINITIONS)[keyof typeof PLAN_DEFINITIONS]]
  >;

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Billing</p>
            <h2 className="mt-2 text-3xl font-semibold">{workspace.name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Manage plan access, billing status, and feature gating for automations, analytics, and inbound AI.
            </p>
          </div>
          <Link href={`/app/${workspaceSlug}/dashboard`} className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
            Dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Current plan</p>
          <h3 className="mt-3 text-3xl font-semibold">{currentPlan.label}</h3>
          <p className="mt-2 text-sm text-slate-400">{currentPlan.description}</p>
          <div className="mt-5 grid gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-slate-400">Subscription status</p>
              <p className="mt-2 font-medium text-white">{workspace.subscriptionStatus}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-slate-400">Billing period end</p>
              <p className="mt-2 font-medium text-white">{formatDate(workspace.billingPeriodEndsAt)}</p>
            </div>
          </div>
          <div className="mt-6">
            <BillingActions workspaceSlug={workspaceSlug} currentPlan={workspace.plan} />
          </div>
          {workspace.subscriptionStatus === SubscriptionStatus.PAST_DUE ? (
            <p className="mt-4 text-sm text-amber-300">This workspace is past due. Update payment details in the billing portal.</p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {planEntries.map(([planKey, plan]) => (
            <div key={planKey} className={`rounded-[28px] border p-6 ${workspace.plan === planKey ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
              <p className="text-sm text-slate-400">{plan.label}</p>
              <h3 className="mt-2 text-2xl font-semibold">{plan.priceLabel}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{plan.description}</p>
              <div className="mt-5 space-y-2 text-sm text-slate-300">
                {plan.features.map((feature) => (
                  <div key={feature} className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2">
                    {feature.replaceAll("_", " ")}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
