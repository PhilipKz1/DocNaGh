"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signIn } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState<{ error: string | null }, FormData>(signIn, {
    error: null,
  });
  const [email, setEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleForgotPassword() {
    if (!email) {
      setForgotStatus("error");
      return;
    }
    setForgotStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?next=/dashboard`,
    });
    // Always report success even on error, so this can't be used to test
    // which emails have an account.
    setForgotStatus(error ? "error" : "sent");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <form action={formAction} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Provider sign in</h1>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <SubmitButton />

        <div className="text-sm">
          {forgotStatus === "sent" ? (
            <p className="text-green-700">
              If an account exists for that email, a reset link is on its way.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={forgotStatus === "sending"}
              className="text-gray-500 hover:underline disabled:opacity-50"
            >
              {forgotStatus === "sending" ? "Sending..." : "Forgot password?"}
            </button>
          )}
          {forgotStatus === "error" && !email && (
            <p className="text-red-600 mt-1">Enter your email above first.</p>
          )}
        </div>
      </form>
    </div>
  );
}
