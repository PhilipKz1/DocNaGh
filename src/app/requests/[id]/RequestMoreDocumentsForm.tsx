"use client";

import { useState } from "react";
import { requestAdditionalDocuments } from "@/app/actions/requests";

export function RequestMoreDocumentsForm({
  requestId,
  defaultEmail,
}: {
  requestId: string;
  defaultEmail: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await requestAdditionalDocuments(requestId, email, message);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
    setMessage("");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded text-sm font-medium text-teal-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 dark:text-teal-400"
      >
        What was sent isn&apos;t enough? Request more documents
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-md border border-slate-200 p-4 dark:border-white/10"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Request more documents</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded text-xs text-slate-500 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 dark:text-slate-400"
        >
          Close
        </button>
      </div>

      <div className="space-y-1">
        <label htmlFor="patientEmail" className="text-xs font-medium">
          Patient email
        </label>
        <input
          id="patientEmail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="requestMessage" className="text-xs font-medium">
          What else do you need?
        </label>
        <textarea
          id="requestMessage"
          required
          rows={3}
          placeholder="e.g. The lab result you sent is missing page 2 - please upload the full report."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          This gets sent as a short, formatted email with a link back to their upload page - just
          describe what&apos;s missing, no formatting needed.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {sent && (
        <p role="status" className="text-xs text-green-700 dark:text-green-400">
          Sent to {email}.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal-600 text-white px-4 py-2 text-sm font-medium hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
