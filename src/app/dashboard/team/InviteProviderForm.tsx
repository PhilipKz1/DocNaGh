"use client";

import { useFormState, useFormStatus } from "react-dom";
import { inviteProvider } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
    >
      {pending ? "Inviting..." : "Send invite"}
    </button>
  );
}

export function InviteProviderForm() {
  const [state, formAction] = useFormState<{ error: string | null }, FormData>(inviteProvider, {
    error: null,
  });

  return (
    <form action={formAction} className="space-y-4 max-w-sm">
      <div className="space-y-1">
        <label className="text-sm font-medium">Name</label>
        <input name="fullName" required className="w-full rounded-md border px-3 py-2 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Role</label>
        <select name="role" defaultValue="staff" className="w-full rounded-md border px-3 py-2 text-sm">
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
