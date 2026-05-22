import { prisma } from "@closerflow/db";
import { requireWorkspaceRole } from "../../../../lib/auth-guards";
import { getWorkspaceSubscription, PLAN_CONFIG, PlanTier } from "../../../../lib/billing";
import { BillingActions } from "../../../../components/billing-actions";
import Link from "next/link";

export default async function BillingPage({
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
        <h2 className="mt-3 text-2xl font-semibold">Admin access is required for billing.</h2>
      </div>
    );
  }

  const subscription = await getWorkspaceSubscription(membership.workspaceId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Billing</p>
            <h2 className="mt-2 text-3xl font-semibold">Subscription & Plan</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Manage your workspace subscription. Upgrade or downgrade anytime — changes apply immediately.
            </p>
          </div>
          <Link
            href={`/app/${workspaceSlug}/settings`}
            className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Settings
          </Link>
        </div>
      </section>

      {/* Current Plan Status */}
      {subscription ? (
        <section className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/70">Active plan</p>
              <h3 className="mt-2 text-2xl font-semibold text-emerald-100">
                {PLAN_CONFIG[subscription.plan]?.name || subscription.plan}
              </h3>
              <p className="mt-2 text-sm text-emerald-200/70">
                {subscription.cancelAtPeriodEnd
                  ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                subscription.status === "ACTIVE"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : subscription.status === "PAST_DUE"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-slate-500/20 text-slate-300"
              }`}>
                {subscription.status}
              </span>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-[28px] border border-amber-500/20 bg-amber-500/5 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-300/70">No active plan</p>
            <h3 className="mt-2 text-xl font-semibold text-amber-100">You&apos;re on the free tier</h3>
            <p className="mt-2 text-sm text-amber-200/70">
              Limited to 50 SMS and 100 emails per day. Subscribe to unlock full messaging capacity and advanced features.
            </p>
          </div>
        </section>
      )}

      {/* Plan Cards */}
      <section className="grid gap-6 lg:grid-cols-3">
        {(["STARTER", "GROWTH", "SCALE"] as PlanTier[]).map((tier) => {
          const config = PLAN_CONFIG[tier];
          const isCurrent = subscription?.plan === tier;
          const prices: Record<PlanTier, string> = { STARTER: "$297", GROWTH: "$497", SCALE: "$997" };

          return (
            <div
              key={tier}
              className={`relative flex flex-col rounded-[28px] border p-6 ${
                isCurrent
                  ? "border-emerald-500/30 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                  : tier === "GROWTH"
                    ? "border-indigo-500/30 bg-indigo-500/5"
                    : "border-white/10 bg-white/5"
              }`}
            >
              {tier === "GROWTH" && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white">
                  Recommended
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                  Current plan
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold">{config.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{prices[tier]}</span>
                  <span className="text-sm text-slate-400">/month</span>
                </div>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {config.workspaceLimit === 1 ? "1 workspace" : `${config.workspaceLimit} workspaces`}
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {config.smsLimit} SMS / day
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {config.emailLimit.toLocaleString()} emails / day
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Unlimited leads
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  AI instant follow-up
                </li>
                {tier === "SCALE" && (
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    White-label agency mode
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </section>

      {/* Action Buttons */}
      <BillingActions
        workspaceSlug={workspaceSlug}
        currentPlan={subscription?.plan || null}
        hasSubscription={!!subscription}
      />
    </div>
  );
}
