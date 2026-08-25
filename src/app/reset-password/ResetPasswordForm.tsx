"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Destination for both "forgot password" recovery links and first-time
 * invite links. The Supabase browser client auto-detects the token in the
 * URL (hash fragment or PKCE `code`) as soon as it's instantiated here and
 * establishes a session - proving email ownership via the emailed link
 * itself, which is why this form never asks for a "current password" the
 * way /account's rotate-password form does. That's the whole point of a
 * recovery flow: it's for people who don't have (or don't remember) one.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setStatus("ready");
      }
    });

    // Covers the case where the session was already established (and the
    // auth-state event already fired) by the time this component mounted.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus("ready");
    });

    // Fallback path: a token_hash/type pair passed directly (e.g. a
    // Supabase-generated link whose redirect_to isn't on this project's
    // allow-list, so it never carried a session-bearing fragment here in
    // the first place). Verifying it ourselves establishes the session
    // without depending on that redirect at all.
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    if (tokenHash && (type === "recovery" || type === "invite" || type === "email")) {
      supabase.auth.verifyOtp({ type, token_hash: tokenHash }).then(({ error: verifyError }) => {
        if (!verifyError) setStatus("ready");
      });
    }

    const timeout = setTimeout(() => {
      setStatus((current) => (current === "checking" ? "invalid" : current));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  if (status === "checking") {
    return <p className="text-sm text-gray-500">Verifying your link...</p>;
  }

  if (status === "invalid") {
    return (
      <div className="max-w-sm text-center space-y-2">
        <h1 className="text-lg font-semibold">Link invalid or expired</h1>
        <p className="text-sm text-gray-500">
          This password link no longer works. Ask for a new invite, or use
          &quot;Forgot password&quot; on the sign-in page.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Set your password</h1>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          New password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Saving..." : "Set password"}
      </button>
    </form>
  );
}
