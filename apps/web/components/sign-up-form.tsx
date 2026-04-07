"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction } from "../app/actions";
import { AuthPanel } from "./auth-panel";

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, {});

  return (
    <AuthPanel
      title="Create account"
      description="Set up a user account, then create workspaces for clients or internal teams."
      footer={
        <span>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-slate-950 underline underline-offset-4">
            Sign in
          </Link>
          .
        </span>
      }
    >
      <form action={action} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">First name</span>
            <input
              name="firstName"
              type="text"
              autoComplete="given-name"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-950"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Last name</span>
            <input
              name="lastName"
              type="text"
              autoComplete="family-name"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-950"
            />
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-950"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-950"
          />
        </label>
        {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthPanel>
  );
}

