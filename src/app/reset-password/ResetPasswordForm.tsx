"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "ready-to-accept" | "verifying" | "ready" | "invalid";

/**
 * Destination for both "forgot password" recovery links and first-time
 * invite links. Verification is gated behind a manual "Continue" click
 * rather than firing automatically on page load: an invite/recovery token
 * is one-time-use, and automated link-scanners (Microsoft's Safe Links on
 * Outlook/Microsoft 365 in particular) visit every link in an email before
 * a person ever clicks it, silently burning the token so the real
 * recipient hits "invalid or expired". A scanner loads the page but can't
 * click a button, so gating the actual verification behind one defeats
 * that without changing anything for a real person, who just clicks
 * through as normal.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const validType = type === "recovery" || type === "invite" || type === "email";

  useEffect(() => {
    // Detect - without consuming - whether there's a token to verify: a
    // hash-based token from Supabase's implicit flow, or a token_hash query
    // param from our own redirect fallback. Deliberately doesn't touch the
    // Supabase client here, since constructing it triggers an automatic
    // parse of the #access_token fragment.
    const hasHashToken = window.location.hash.includes("access_token=");
    const hasTokenHash = Boolean(tokenHash) && validType;
    setStatus(hasHashToken || hasTokenHash ? "ready-to-accept" : "invalid");
  }, [tokenHash, validType]);

  async function handleAccept() {
    setStatus("verifying");
    const supabase = createClient();

    if (tokenHash && validType) {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        type: type as "recovery" | "invite" | "email",
        token_hash: tokenHash,
      });
      setStatus(verifyError ? "invalid" : "ready");
      return;
    }

    // Hash-based flow: constructing the client above kicked off Supabase's
    // own (async) parse of the #access_token fragment. Wait for whichever
    // signal confirms it landed - the auth-state event or a direct session
    // check - with a timeout in case neither fires.
    const verified = await new Promise<boolean>((resolve) => {
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") {
          sub.subscription.unsubscribe();
          resolve(true);
        }
      });
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          sub.subscription.unsubscribe();
          resolve(true);
        }
      });
      setTimeout(() => {
        sub.subscription.unsubscribe();
        resolve(false);
      }, 4000);
    });

    setStatus(verified ? "ready" : "invalid");
  }

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
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>;
  }

  if (status === "invalid") {
    return (
      <div className="max-w-sm text-center space-y-2">
        <h1 className="text-lg font-semibold">Link invalid or expired</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This password link no longer works. Ask for a new invite, or use
          &quot;Forgot password&quot; on the sign-in page.
        </p>
      </div>
    );
  }

  if (status === "ready-to-accept" || status === "verifying") {
    return (
      <div className="max-w-sm text-center space-y-4">
        <h1 className="text-xl font-semibold">Continue to set your password</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Click below to confirm it&apos;s really you before continuing.
        </p>
        <button
          type="button"
          onClick={handleAccept}
          disabled={status === "verifying"}
          className="w-full rounded-md bg-teal-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50"
        >
          {status === "verifying" ? "Verifying…" : "Continue"}
        </button>
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
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-teal-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Set password"}
      </button>
    </form>
  );
}
