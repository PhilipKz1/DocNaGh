"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { extendRequestExpiry } from "@/app/actions/requests";

const MAX_LIFETIME_DAYS = 14;

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function ExtendExpiryControl({
  requestId,
  createdAt,
  expiresAt,
}: {
  requestId: string;
  createdAt: string;
  expiresAt: string;
}) {
  const router = useRouter();
  const maxDate = new Date(new Date(createdAt).getTime() + MAX_LIFETIME_DAYS * 24 * 60 * 60 * 1000);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(toDateInputValue(new Date(expiresAt)));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadyAtMax = new Date(expiresAt).getTime() >= maxDate.getTime();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    // Extend to end-of-day on the chosen date, in the patient's local time.
    const chosen = new Date(`${date}T23:59:59`);
    const result = await extendRequestExpiry(requestId, chosen.toISOString());
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (alreadyAtMax) {
    return (
      <p
        className="text-xs text-slate-500"
        title={`Requests can't stay active more than ${MAX_LIFETIME_DAYS} days after being created`}
      >
        Already at the maximum {MAX_LIFETIME_DAYS}-day link lifetime.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Give the patient more time - up to ${MAX_LIFETIME_DAYS} days from when this request was created`}
        className="rounded text-sm font-medium text-teal-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
      >
        Extend expiry
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label htmlFor="newExpiry" className="text-xs font-medium">
          New expiry date
        </label>
        <input
          id="newExpiry"
          type="date"
          value={date}
          min={toDateInputValue(new Date())}
          max={toDateInputValue(maxDate)}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal-600 text-white px-3 py-2 text-sm font-medium hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded text-sm text-slate-500 hover:underline"
      >
        Cancel
      </button>
      {error && (
        <p role="alert" className="w-full text-xs text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
