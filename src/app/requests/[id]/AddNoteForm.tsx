"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addRequestNote } from "@/app/actions/requests";

export function AddNoteForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await addRequestNote(requestId, text);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setText("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a note for the team — e.g. 'Called patient, uploading tomorrow'"
        className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
      />
      <button
        type="submit"
        disabled={pending || !text.trim()}
        className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add note"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
