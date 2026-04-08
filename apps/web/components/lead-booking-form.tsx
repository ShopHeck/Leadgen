export function LeadBookingForm({
  action,
  defaultName,
  defaultEmail,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultName: string;
  defaultEmail: string | null;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">Start</span>
          <input
            name="startAt"
            type="datetime-local"
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">End</span>
          <input
            name="endAt"
            type="datetime-local"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="inviteeName"
          defaultValue={defaultName}
          placeholder="Invitee name"
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
        />
        <input
          name="inviteeEmail"
          defaultValue={defaultEmail || ""}
          placeholder="Invitee email"
          type="email"
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
        />
      </div>
      <textarea
        name="notes"
        rows={4}
        placeholder="Booking notes, prep details, or Calendly context..."
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
      />
      <button
        type="submit"
        className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
      >
        Create booking
      </button>
    </form>
  );
}
