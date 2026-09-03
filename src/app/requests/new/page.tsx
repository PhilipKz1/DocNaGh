"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createRequest } from "@/app/actions/requests";
import { AppHeader } from "@/components/AppHeader";
import { InfoTooltip } from "@/components/InfoTooltip";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-teal-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50"
    >
      {pending ? "Creating…" : "Create request"}
    </button>
  );
}

export default function NewRequestPage() {
  const [state, formAction] = useFormState<{ error: string | null }, FormData>(createRequest, {
    error: null,
  });
  const [labels, setLabels] = useState([""]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900">
      <AppHeader homeHref="/dashboard" backHref="/dashboard" backLabel="Back to requests" />
      <div className="max-w-lg mx-auto p-6 sm:p-8">
        <h1 className="text-xl font-semibold mb-1">New document request</h1>
        <p className="mb-6 text-sm text-slate-500">
          Name what you need, and the patient gets a secure link to upload it from their phone.
        </p>

        <form action={formAction} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
          <div className="space-y-1">
            <label htmlFor="patientName" className="text-sm font-medium">
              Patient name
            </label>
            <input
              id="patientName"
              name="patientName"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="patientPhone" className="text-sm font-medium">
                Phone
              </label>
              <input
                id="patientPhone"
                name="patientPhone"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="patientEmail" className="text-sm font-medium">
                Email
                <span className="ml-1 font-normal text-slate-400" title="Used to email the patient if you need to follow up asking for more documents later">
                  (recommended)
                </span>
              </label>
              <input
                id="patientEmail"
                name="patientEmail"
                type="email"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
              Requested documents
              <InfoTooltip text="One line per document, e.g. 'Referral letter' or 'Recent lab results'. The patient sees this exact label and uploads one file for each." />
            </span>
            {labels.map((label, i) => (
              <div key={i} className="flex gap-2">
                <input
                  name="documentLabel"
                  defaultValue={label}
                  placeholder="e.g. Previous dental X-ray"
                  required
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
                />
                {labels.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLabels(labels.filter((_, idx) => idx !== i))}
                    className="rounded px-2 text-sm text-slate-400 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
                    aria-label="Remove document"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLabels([...labels, ""])}
              className="rounded text-sm font-medium text-teal-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
            >
              + Add another document
            </button>
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
