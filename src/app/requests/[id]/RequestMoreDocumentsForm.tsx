"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestAdditionalDocuments } from "@/app/actions/requests";

export function RequestMoreDocumentsForm({
  requestId,
  defaultEmail,
}: {
  requestId: string;
  defaultEmail: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [sendEmailNow, setSendEmailNow] = useState(!!defaultEmail);
  const [message, setMessage] = useState("");
  const [labels, setLabels] = useState([""]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ link: string; patientName: string; emailed: boolean } | null>(
    null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const cleanLabels = labels.map((l) => l.trim()).filter(Boolean);
    const res = await requestAdditionalDocuments(requestId, email, message, cleanLabels, sendEmailNow);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setResult({ link: res.link!, patientName: res.patientName!, emailed: res.emailed! });
    setMessage("");
    setLabels([""]);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded text-sm font-medium text-teal-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
      >
        What was sent isn&apos;t enough? Request more documents
      </button>
    );
  }

  if (result) {
    const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
      `Hi ${result.patientName}, we need a bit more from you - please use this secure link: ${result.link}`
    )}`;
    return (
      <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
        <p role="status" className="text-sm text-emerald-700">
          {result.emailed ? `Emailed to ${email}.` : "Added to the request."} Same link as before -
          you can also share it again directly:
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="rounded text-sm font-medium text-teal-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
          >
            Share via WhatsApp
          </a>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setOpen(false);
            }}
            className="rounded text-sm text-slate-500 hover:underline"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-md border border-slate-200 bg-white p-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Request more documents</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded text-xs text-slate-500 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        >
          Close
        </button>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium">New documents needed (optional)</span>
        {labels.map((label, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={label}
              onChange={(e) =>
                setLabels((ls) => ls.map((l, idx) => (idx === i ? e.target.value : l)))
              }
              placeholder="e.g. Full lab report (all pages)"
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
            />
            {labels.length > 1 && (
              <button
                type="button"
                onClick={() => setLabels((ls) => ls.filter((_, idx) => idx !== i))}
                className="rounded px-2 text-sm text-slate-400 hover:text-red-600"
                aria-label="Remove"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLabels((ls) => [...ls, ""])}
          className="rounded text-xs font-medium text-teal-700 hover:underline"
        >
          + Add another document
        </button>
      </div>

      <div className="space-y-1">
        <label htmlFor="requestMessage" className="text-xs font-medium">
          Message (optional)
        </label>
        <textarea
          id="requestMessage"
          rows={3}
          placeholder="e.g. The lab result you sent is missing page 2 - please upload the full report."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        />
      </div>

      <div className="space-y-1.5 rounded-md bg-slate-50 p-3">
        <label htmlFor="patientEmail" className="text-xs font-medium">
          Patient email
        </label>
        <input
          id="patientEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        />
        <label className={`flex items-center gap-2 text-xs ${email ? "text-slate-700" : "text-slate-400"}`}>
          <input
            type="checkbox"
            checked={sendEmailNow && !!email}
            disabled={!email}
            onChange={(e) => setSendEmailNow(e.target.checked)}
          />
          Email this now
        </label>
        <p className="text-xs text-slate-400">
          Either way, you&apos;ll get a &quot;Share via WhatsApp&quot; option after saving.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal-600 text-white px-4 py-2 text-sm font-medium hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
