"use client";

import { useState, useTransition } from "react";
import { deleteClinic } from "./actions";

export function DeleteClinicButton({
  clinicId,
  clinicName,
}: {
  clinicId: string;
  clinicName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${clinicName}" and everything under it - staff accounts, patients, requests, and uploaded documents? This can't be undone.`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteClinic(clinicId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        aria-label={`Delete ${clinicName}`}
        className="rounded text-xs font-medium text-red-600 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-600 disabled:opacity-50 dark:text-red-400"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
