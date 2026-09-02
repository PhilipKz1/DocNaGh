"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signIn, requestPasswordReset } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-teal-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState<{ error: string | null }, FormData>(signIn, {
    error: null,
  });
  const [email, setEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<"idle" | "sending" | "sent" | "no-email">("idle");

  async function handleForgotPassword() {
    if (!email) {
      setForgotStatus("no-email");
      return;
    }
    setForgotStatus("sending");
    await requestPasswordReset(email);
    setForgotStatus("sent");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8 text-slate-900 dark:bg-[#0a0f14] dark:text-slate-100">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-5 rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5"
      >
        <h1 className="text-xl font-semibold">Provider sign in</h1>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-required="true"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-required="true"
            aria-invalid={state.error ? "true" : undefined}
            aria-describedby={state.error ? "login-error" : undefined}
            className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
          />
        </div>

        <div role="alert" aria-live="assertive">
          {state.error && (
            <p id="login-error" className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          )}
        </div>

        <SubmitButton />

        <div className="text-sm" aria-live="polite">
          {forgotStatus === "sent" ? (
            <p className="text-green-700 dark:text-green-400">
              If an account exists for that email, a reset link is on its way.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={forgotStatus === "sending"}
              className="rounded text-slate-500 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 disabled:opacity-50 dark:text-slate-400"
            >
              {forgotStatus === "sending" ? "Sending…" : "Forgot password?"}
            </button>
          )}
          {forgotStatus === "no-email" && (
            <p className="text-red-600 mt-1 dark:text-red-400">Enter your email above first.</p>
          )}
        </div>
      </form>
    </div>
  );
}
