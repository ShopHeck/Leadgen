export function LeadNoteForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="space-y-3">
      <textarea
        name="body"
        rows={4}
        placeholder="Add context, objections, follow-up tasks, or call notes..."
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
        required
      />
      <button
        type="submit"
        className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
      >
        Add note
      </button>
    </form>
  );
}

