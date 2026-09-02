"use client";

import { useState } from "react";
import { resendClinicInvite } from "./actions";

export function ResendInviteButton({ clinicId }: { clinicId: string }) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setPending(true);
    setStatus("idle");
    setError(null);
    const result = await resendClinicInvite(clinicId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleResend}
        disabled={pending}
        className="rounded text-xs font-medium text-teal-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 disabled:opacity-50 dark:text-teal-400"
      >
        {pending ? "Resending…" : "Resend invite"}
      </button>
      {status === "sent" && (
        <p role="status" className="text-xs text-green-700 dark:text-green-400">
          Invite sent.
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
