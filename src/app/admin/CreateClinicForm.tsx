"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createClinic } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
    >
      {pending ? "Creating..." : "Create clinic"}
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
        <label className="text-sm font-medium">Clinic name</label>
        <input
          name="clinicName"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">First admin&apos;s name</label>
        <input name="adminName" required className="w-full rounded-md border px-3 py-2 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">First admin&apos;s email</label>
        <input
          name="adminEmail"
          type="email"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <p className="text-xs text-gray-500">
          They&apos;ll get an email invite to set their own password.
        </p>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
