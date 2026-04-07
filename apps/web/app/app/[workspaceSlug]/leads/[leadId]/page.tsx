import { prisma } from "@closerflow/db";
import { createAppointmentAction, createLeadNoteAction, sendLeadMessageAction } from "../../../../../app/actions";
import { LeadAiScorePanel } from "../../../../../components/lead-ai-score-panel";
import { LeadBookingForm } from "../../../../../components/lead-booking-form";
import { LeadMessageForm } from "../../../../../components/lead-message-form";
import { LeadNoteForm } from "../../../../../components/lead-note-form";
import { requireWorkspaceMembership } from "../../../../../lib/auth-guards";

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; leadId: string }>;
}) {
  const { workspaceSlug, leadId } = await params;
  const membership = await requireWorkspaceMembership(workspaceSlug);

  const lead = await prisma.lead.findFirstOrThrow({
    where: {
      id: leadId,
      workspaceId: membership.workspaceId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      source: true,
      campaign: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      utmTerm: true,
      utmContent: true,
      leadScore: true,
      scoreBand: true,
      lastScoredAt: true,
      status: true,
      createdAt: true,
      pipelineStage: true,
      formSubmissions: {
        orderBy: {
          createdAt: "desc",
        },
      },
      notes: {
        include: {
          author: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      stageHistory: {
        include: {
          fromStage: true,
          toStage: true,
          changedByUser: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
      },
      appointments: {
        orderBy: {
          startAt: "asc",
        },
      },
    },
  });

  const noteAction = createLeadNoteAction.bind(null, workspaceSlug, lead.id);
  const messageAction = sendLeadMessageAction.bind(null, workspaceSlug, lead.id);
  const bookingAction = createAppointmentAction.bind(null, workspaceSlug, lead.id);

  const activity: ActivityItem[] = [
    {
      id: `lead-created-${lead.id}`,
      title: "Lead created",
      description: `Lead record created with status ${lead.status.toLowerCase().replaceAll("_", " ")}.`,
      createdAt: lead.createdAt,
    },
    ...lead.formSubmissions.map((submission) => ({
      id: `submission-${submission.id}`,
      title: "Form submitted",
      description: `${submission.pageUrl ? `Captured from ${submission.pageUrl}` : "Lead capture submitted"}${submission.utmJson ? " with attribution data." : "."}`,
      createdAt: submission.createdAt,
    })),
    ...lead.notes.map((note) => ({
      id: `note-${note.id}`,
      title: "Note added",
      description: `${note.author?.email || "Workspace user"}: ${note.body}`,
      createdAt: note.createdAt,
    })),
    ...lead.messages.map((message) => ({
      id: `message-${message.id}`,
      title: `${message.channel} ${message.direction.toLowerCase()}`,
      description: `${message.status}${message.toAddress ? ` to ${message.toAddress}` : ""}${message.errorMessage ? ` · ${message.errorMessage}` : ""}`,
      createdAt: message.createdAt,
    })),
    ...lead.appointments.map((appointment) => ({
      id: `appointment-${appointment.id}`,
      title: "Booking created",
      description: `${appointment.status} · ${formatDate(appointment.startAt)}${appointment.inviteeEmail ? ` · ${appointment.inviteeEmail}` : ""}.`,
      createdAt: appointment.createdAt,
    })),
    ...lead.stageHistory.map((entry) => ({
      id: `stage-${entry.id}`,
      title: "Stage changed",
      description: `${entry.fromStage?.name || "Unassigned"} -> ${entry.toStage?.name || "Unassigned"}${entry.changedByUser?.email ? ` by ${entry.changedByUser.email}` : ""}.`,
      createdAt: entry.createdAt,
    })),
  ].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Lead detail</p>
            <h2 className="mt-2 text-3xl font-semibold">{lead.name}</h2>
            <p className="mt-3 text-sm text-slate-400">
              {lead.email || "No email"} · {lead.phone || "No phone"} · {lead.pipelineStage?.name || "No stage"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300">
              Score {lead.leadScore}
            </span>
            <span className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200">{lead.scoreBand}</span>
            <span className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200">{lead.status}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold">Lead profile</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  { label: "Name", value: lead.name },
                  { label: "Email", value: lead.email || "Not supplied" },
                  { label: "Phone", value: lead.phone || "Not supplied" },
                  { label: "Score band", value: lead.scoreBand },
                  { label: "Last scored", value: lead.lastScoredAt ? formatDate(lead.lastScoredAt) : "Not yet scored" },
                  { label: "Current stage", value: lead.pipelineStage?.name || "Not assigned" },
                  { label: "Source", value: lead.utmSource || lead.source || "Unknown" },
                  { label: "Campaign", value: lead.utmCampaign || lead.campaign || "Unknown" },
                  { label: "UTM medium", value: lead.utmMedium || "Unknown" },
                  { label: "UTM term", value: lead.utmTerm || "Unknown" },
                  { label: "UTM content", value: lead.utmContent || "Unknown" },
                ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-sm text-slate-200">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Submission history</h3>
              <span className="text-sm text-slate-500">{lead.formSubmissions.length} submissions</span>
            </div>
            <div className="mt-5 space-y-3">
              {lead.formSubmissions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-4 text-sm text-slate-500">
                  No form submissions recorded for this lead.
                </div>
              ) : (
                lead.formSubmissions.map((submission) => (
                  <div key={submission.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm font-medium text-white">{submission.pageUrl || "Captured without page URL"}</p>
                      <p className="text-xs text-slate-500">{formatDate(submission.createdAt)}</p>
                    </div>
                    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-3 text-xs leading-6 text-slate-300">
                      {JSON.stringify(submission.utmJson || submission.payloadJson, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <LeadAiScorePanel workspaceSlug={workspaceSlug} leadId={lead.id} />

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Send message</h3>
              <span className="text-sm text-slate-500">{lead.messages.length} logged</span>
            </div>
            <div className="mt-5">
              <LeadMessageForm action={messageAction} email={lead.email} phone={lead.phone} />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Booking</h3>
              <span className="text-sm text-slate-500">{lead.appointments.length} appointments</span>
            </div>
            <div className="mt-5">
              <LeadBookingForm action={bookingAction} defaultName={lead.name} defaultEmail={lead.email} />
            </div>
            <div className="mt-5 space-y-3">
              {lead.appointments.map((appointment) => (
                <div key={appointment.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-slate-200">{appointment.provider}</span>
                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-slate-300">{appointment.status}</span>
                    </div>
                    <p className="text-xs text-slate-500">{formatDate(appointment.startAt)}</p>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">
                    {appointment.inviteeName || lead.name}
                    {appointment.inviteeEmail ? ` · ${appointment.inviteeEmail}` : ""}
                  </p>
                  {appointment.notes ? <p className="mt-3 text-sm leading-7 text-slate-300">{appointment.notes}</p> : null}
                </div>
              ))}
              {lead.appointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-4 text-sm text-slate-500">
                  No appointments recorded yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Message log</h3>
              <span className="text-sm text-slate-500">{lead.messages.length} messages</span>
            </div>
            <div className="mt-5 space-y-3">
              {lead.messages.map((message) => (
                <div key={message.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-slate-200">{message.channel}</span>
                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-slate-300">{message.status}</span>
                      {message.provider ? (
                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-slate-300">{message.provider}</span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500">{formatDate(message.createdAt)}</p>
                  </div>
                  {message.subject ? <p className="mt-3 text-sm font-medium text-white">{message.subject}</p> : null}
                  <p className="mt-3 text-sm leading-7 text-slate-300">{message.body}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    {message.fromAddress ? <span>From: {message.fromAddress}</span> : null}
                    {message.toAddress ? <span>To: {message.toAddress}</span> : null}
                    {message.errorMessage ? <span className="text-rose-300">{message.errorMessage}</span> : null}
                  </div>
                </div>
              ))}
              {lead.messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-4 text-sm text-slate-500">
                  No messages logged yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Notes</h3>
              <span className="text-sm text-slate-500">{lead.notes.length} notes</span>
            </div>
            <div className="mt-5">
              <LeadNoteForm action={noteAction} />
            </div>
            <div className="mt-5 space-y-3">
              {lead.notes.map((note) => (
                <div key={note.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{note.author?.email || "Workspace user"}</p>
                    <p className="text-xs text-slate-500">{formatDate(note.createdAt)}</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{note.body}</p>
                </div>
              ))}
              {lead.notes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-4 text-sm text-slate-500">
                  No notes yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Activity timeline</h3>
              <span className="text-sm text-slate-500">{activity.length} events</span>
            </div>
            <div className="mt-5 space-y-4">
              {activity.map((item) => (
                <div key={item.id} className="relative rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{item.description}</p>
                  <p className="mt-3 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
