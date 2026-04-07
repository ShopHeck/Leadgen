import Link from "next/link";
import { MessageChannel, MessageStatus, prisma } from "@closerflow/db";
import { requireWorkspaceMembership } from "../../../../lib/auth-guards";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function WorkspaceMessagesPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const membership = await requireWorkspaceMembership(workspaceSlug);

  const messages = await prisma.message.findMany({
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
      createdAt: "desc",
    },
    take: 50,
  });

  const stats = {
    total: messages.length,
    sms: messages.filter((message) => message.channel === MessageChannel.SMS).length,
    email: messages.filter((message) => message.channel === MessageChannel.EMAIL).length,
    failed: messages.filter((message) => message.status === MessageStatus.FAILED).length,
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Messaging</p>
            <h2 className="mt-2 text-3xl font-semibold">Workspace message log</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Outbound SMS and email activity is recorded here with provider, recipient, status, and lead context.
            </p>
          </div>
          <Link
            href={`/app/${workspaceSlug}/crm`}
            className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Open CRM
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Messages", value: stats.total },
          { label: "SMS", value: stats.sms },
          { label: "Email", value: stats.email },
          { label: "Failed", value: stats.failed },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent activity</h3>
          <span className="text-sm text-slate-500">Latest 50</span>
        </div>
        <div className="mt-5 space-y-3">
          {messages.map((message) => (
            <article key={message.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-slate-200">{message.channel}</span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-slate-300">{message.status}</span>
                    {message.provider ? (
                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-slate-300">{message.provider}</span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm font-medium text-white">
                    <Link href={`/app/${workspaceSlug}/leads/${message.lead.id}`} className="underline-offset-4 hover:underline">
                      {message.lead.name}
                    </Link>
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{message.toAddress || message.lead.email || message.lead.phone || "No recipient stored"}</p>
                  {message.subject ? <p className="mt-3 text-sm font-medium text-slate-200">{message.subject}</p> : null}
                  <p className="mt-3 text-sm leading-7 text-slate-300">{message.body}</p>
                  {message.errorMessage ? <p className="mt-3 text-sm text-rose-300">{message.errorMessage}</p> : null}
                </div>
                <p className="shrink-0 text-xs text-slate-500">{formatDate(message.createdAt)}</p>
              </div>
            </article>
          ))}

          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-4 text-sm text-slate-500">
              No messages logged yet. Send an SMS or email from a lead record to populate this view.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
