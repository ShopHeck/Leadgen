import { requireWorkspaceMembership } from "../../../../lib/auth-guards";
import { getWorkspaceAnalytics } from "../../../../lib/analytics";
import { OnboardingGuide } from "../../../../components/onboarding-guide";
import Link from "next/link";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatSeconds(seconds: number | null) {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { workspaceSlug } = await params;
  const search = await searchParams;
  const membership = await requireWorkspaceMembership(workspaceSlug);

  const range: { from?: Date; to?: Date } = {};
  if (search.from) range.from = new Date(search.from);
  if (search.to) range.to = new Date(search.to);

  const analytics = await getWorkspaceAnalytics(membership.workspaceId, range);
  const { summary, leadVolume, sourceAttribution, pipelineConversion, topCampaigns } = analytics;

  return (
    <div className="space-y-8">
      <OnboardingGuide
        pageKey="analytics"
        title="Analytics Guide"
        steps={[
          {
            title: "Your attribution dashboard",
            description: "This page gives you a complete view of your lead generation performance. Track where your leads come from, how they convert through the pipeline, and which campaigns drive the most revenue.",
          },
          {
            title: "Key metrics at a glance",
            description: "The KPI cards at the top show total leads, booking rate, revenue, cost per lead, average response time, and conversion rate. These update in real-time as new data flows in.",
          },
          {
            title: "Source attribution",
            description: "The source attribution table breaks down performance by traffic source (Facebook, Google, referral, etc.) so you know exactly which channels are delivering ROI.",
          },
          {
            title: "Pipeline conversion funnel",
            description: "See how leads flow through each stage of your pipeline with drop-off rates at each step. This helps identify bottlenecks where leads get stuck or lost.",
          },
          {
            title: "Date range filtering",
            description: "Use the date range controls to analyze specific time periods. Compare week-over-week or month-over-month performance to spot trends in your lead generation efforts.",
          },
        ]}
      />
      {/* Header */}
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Analytics</p>
            <h2 className="mt-2 text-3xl font-semibold">Attribution Dashboard</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Track lead volume, source performance, booking rates, and revenue attribution across all channels.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/app/${workspaceSlug}`}
              className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
            >
              Overview
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

      {/* KPI Cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Leads", value: summary.totalLeads.toString() },
          { label: "Booking Rate", value: `${summary.bookingRate}%` },
          { label: "Show Rate", value: `${summary.showRate}%` },
          { label: "Close Rate", value: `${summary.closeRate}%` },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Revenue", value: formatCurrency(summary.totalRevenue) },
          { label: "Revenue / Lead", value: formatCurrency(summary.revenuePerLead) },
          { label: "Avg Lead Score", value: summary.avgLeadScore.toString() },
          { label: "Speed to Contact", value: formatSeconds(summary.avgSpeedToContact) },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
          </div>
        ))}
      </section>

      {/* Lead Volume Chart (text-based visualization) */}
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold">Lead Volume (Last 30 Days)</h3>
        <p className="mt-2 text-sm text-slate-400">Daily lead ingestion trend</p>
        {leadVolume.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-900/70 p-6 text-sm text-slate-400">
            No leads captured in this period.
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            {leadVolume.map((point) => {
              const maxCount = Math.max(...leadVolume.map((p) => p.count), 1);
              const barWidth = Math.max(4, Math.round((point.count / maxCount) * 100));
              return (
                <div key={point.date} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-slate-500">{point.date}</span>
                  <div
                    className="h-5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    style={{ width: `${barWidth}%` }}
                  />
                  <span className="text-xs font-medium text-slate-300">{point.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Source Attribution Table */}
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold">Source Attribution</h3>
        <p className="mt-2 text-sm text-slate-400">Performance breakdown by traffic source</p>
        {sourceAttribution.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-900/70 p-6 text-sm text-slate-400">
            No source data available yet.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-3 pr-4 font-medium">Source</th>
                  <th className="pb-3 pr-4 font-medium">Leads</th>
                  <th className="pb-3 pr-4 font-medium">Bookings</th>
                  <th className="pb-3 pr-4 font-medium">Won</th>
                  <th className="pb-3 pr-4 font-medium">Revenue</th>
                  <th className="pb-3 font-medium">Conv. Rate</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {sourceAttribution.map((row) => (
                  <tr key={row.source} className="border-b border-white/5">
                    <td className="py-3 pr-4 font-medium">{row.source}</td>
                    <td className="py-3 pr-4">{row.leads}</td>
                    <td className="py-3 pr-4">{row.bookings}</td>
                    <td className="py-3 pr-4">{row.won}</td>
                    <td className="py-3 pr-4">{formatCurrency(row.revenue)}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.conversionRate >= 30
                            ? "bg-emerald-500/10 text-emerald-300"
                            : row.conversionRate >= 15
                              ? "bg-amber-500/10 text-amber-300"
                              : "bg-slate-500/10 text-slate-300"
                        }`}
                      >
                        {row.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pipeline Conversion Funnel */}
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold">Pipeline Conversion Funnel</h3>
        <p className="mt-2 text-sm text-slate-400">Current distribution of leads across pipeline stages</p>
        {pipelineConversion.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-900/70 p-6 text-sm text-slate-400">
            No pipeline data available.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {pipelineConversion.map((stage) => (
              <div key={stage.stage} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-sm text-slate-300">{stage.stage}</span>
                <div className="flex-1">
                  <div
                    className="h-6 rounded-full bg-gradient-to-r from-violet-500/80 to-fuchsia-500/80"
                    style={{ width: `${Math.max(2, stage.percentage)}%` }}
                  />
                </div>
                <span className="w-20 text-right text-xs text-slate-400">
                  {stage.count} ({stage.percentage}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Top Campaigns */}
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold">Top Campaigns</h3>
        <p className="mt-2 text-sm text-slate-400">Highest performing campaigns by lead volume</p>
        {topCampaigns.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-900/70 p-6 text-sm text-slate-400">
            No campaign data yet. Leads submitted with UTM campaign parameters will appear here.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-3 pr-4 font-medium">Campaign</th>
                  <th className="pb-3 pr-4 font-medium">Leads</th>
                  <th className="pb-3 pr-4 font-medium">Bookings</th>
                  <th className="pb-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {topCampaigns.map((row) => (
                  <tr key={row.campaign} className="border-b border-white/5">
                    <td className="py-3 pr-4 font-medium">{row.campaign}</td>
                    <td className="py-3 pr-4">{row.leads}</td>
                    <td className="py-3 pr-4">{row.bookings}</td>
                    <td className="py-3">{formatCurrency(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
