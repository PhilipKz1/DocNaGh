"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createRequest } from "@/app/actions/requests";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
    >
      {pending ? "Creating..." : "Create request"}
    </button>
  );
}

export default function NewRequestPage() {
  const [state, formAction] = useFormState<{ error: string | null }, FormData>(createRequest, {
    error: null,
  });
  const [labels, setLabels] = useState([""]);

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-xl font-semibold mb-6">New document request</h1>

      <form action={formAction} className="space-y-5">
        <div className="space-y-1">
          <label htmlFor="patientName" className="text-sm font-medium">
            Patient name
          </label>
          <input
            id="patientName"
            name="patientName"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
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
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="patientEmail" className="text-sm font-medium">
              Email
            </label>
            <input
              id="patientEmail"
              name="patientEmail"
              type="email"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Requested documents</span>
          {labels.map((label, i) => (
            <div key={i} className="flex gap-2">
              <input
                name="documentLabel"
                defaultValue={label}
                placeholder="e.g. Previous dental X-ray"
                required
                className="flex-1 rounded-md border px-3 py-2 text-sm"
              />
              {labels.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLabels(labels.filter((_, idx) => idx !== i))}
                  className="text-sm text-gray-400 hover:text-red-600 px-2"
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
            className="text-sm text-gray-600 hover:underline"
          >
            + Add another document
          </button>
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <SubmitButton />
      </form>
    </div>
  );
}
