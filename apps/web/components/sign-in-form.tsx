"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction } from "../app/actions";
import { AuthPanel } from "./auth-panel";

export function SignInForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(signInAction, {});

  return (
    <AuthPanel
      title="Sign in"
      description="Use the credentials for an existing CloserFlow AI account."
      footer={
        <span>
          No account yet?{" "}
          <Link href="/signup" className="font-medium text-slate-950 underline underline-offset-4">
            Create one
          </Link>
          .
        </span>
      }
    >
      <form action={action} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl || "/app"} />
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
            autoComplete="current-password"
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
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthPanel>
  );
}

