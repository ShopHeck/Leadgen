"use client";

import { useActionState, useState } from "react";
import { LeadMessageActionState } from "../app/actions";

const initialState: LeadMessageActionState = {};

export function LeadMessageForm({
  action,
  email,
  phone,
}: {
  action: (state: LeadMessageActionState, formData: FormData) => Promise<LeadMessageActionState>;
  email: string | null;
  phone: string | null;
}) {
  const [channel, setChannel] = useState<"SMS" | "EMAIL">(phone ? "SMS" : "EMAIL");
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">Channel</span>
          <select
            name="channel"
            value={channel}
            onChange={(event) => setChannel(event.target.value === "EMAIL" ? "EMAIL" : "SMS")}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
          >
            <option value="SMS" disabled={!phone}>
              SMS {phone ? `(${phone})` : "(lead has no phone)"}
            </option>
            <option value="EMAIL" disabled={!email}>
              Email {email ? `(${email})` : "(lead has no email)"}
            </option>
          </select>
        </label>

        {channel === "EMAIL" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">Subject</span>
            <input
              name="subject"
              type="text"
              placeholder="Consultation follow-up"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
              required
            />
          </label>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-400">
            SMS will be sent from your configured Twilio number.
          </div>
        )}
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-300">Message</span>
        <textarea
          name="body"
          rows={5}
          placeholder={channel === "SMS" ? "Hi Jordan, this is Demo from CloserFlow..." : "Hi Jordan,\n\nThanks for submitting your request..."}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/50"
          required
        />
      </label>

      {state.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-300">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Sending..." : `Send ${channel === "SMS" ? "SMS" : "Email"}`}
      </button>
    </form>
  );
}
