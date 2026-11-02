"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { erasePatientData } from "@/app/actions/patients";

/** Clinic-admin tools for answering a patient's data access or erasure request. */
export function PatientDataControls({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleErase() {
    const confirmed = window.confirm(
      `Permanently erase all data for ${patientName} - every request and uploaded file linked to them? Export it first if they asked for a copy. This can't be undone.`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await erasePatientData(patientId);
      if (result.error) setError(result.error);
      else router.push("/dashboard");
    });
  }

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-700">Patient data requests</p>
      <p className="text-xs text-slate-500">
        If {patientName} asks for a copy of their data or for it to be deleted.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <a
          href={`/api/patients/${patientId}/export`}
          className="rounded text-xs font-medium text-teal-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        >
          Export all data (ZIP)
        </a>
        <button
          type="button"
          onClick={handleErase}
          disabled={isPending}
          className="rounded text-xs font-medium text-red-600 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-600 disabled:opacity-50"
        >
          {isPending ? "Erasing…" : "Erase all data"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
