"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function MfaChallengeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.mfa.listFactors().then(({ data, error: listError }) => {
      if (listError) {
        setError(listError.message);
        return;
      }
      const verified = data?.totp.find((f) => f.status === "verified");
      if (!verified) {
        setError("No verified authenticator app found for this account.");
        return;
      }
      setFactorId(verified.id);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;

    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    setPending(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Enter your authenticator code</h1>
      <p className="text-sm text-gray-500">
        Open your authenticator app and enter the 6-digit code for this account.
      </p>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
        className="w-full rounded-md border px-3 py-2 text-sm tracking-widest"
        placeholder="123456"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending || !factorId}
        className="w-full rounded-md bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Verifying..." : "Verify"}
      </button>
    </form>
  );
}
