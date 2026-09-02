"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createClinic } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-teal-600 text-white px-4 py-2 text-sm font-medium hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50"
    >
      {pending ? "Creating…" : "Create clinic"}
    </button>
  );
}

export function CreateClinicForm() {
  const [state, formAction] = useFormState<{ error: string | null }, FormData>(createClinic, {
    error: null,
  });

  return (
    <form action={formAction} className="space-y-4 max-w-sm">
      <div className="space-y-1">
        <label htmlFor="clinicName" className="text-sm font-medium">
          Clinic name
        </label>
        <input
          id="clinicName"
          name="clinicName"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="adminName" className="text-sm font-medium">
          First admin&apos;s name
        </label>
        <input
          id="adminName"
          name="adminName"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="adminEmail" className="text-sm font-medium">
          First admin&apos;s email
        </label>
        <input
          id="adminEmail"
          name="adminEmail"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          They&apos;ll get an email invite to set their own password.
        </p>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
