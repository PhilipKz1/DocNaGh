"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { createRequest } from "@/app/actions/requests";
import { createTemplate, deleteTemplate } from "@/app/actions/templates";
import { InfoTooltip } from "@/components/InfoTooltip";

type Template = { id: string; name: string; labels: string[] };

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

export function NewRequestForm({ templates }: { templates: Template[] }) {
  const [state, formAction] = useFormState<{ error: string | null }, FormData>(createRequest, {
    error: null,
  });
  const [labels, setLabels] = useState([""]);
  const [patientEmail, setPatientEmail] = useState("");
  const [sendEmailNow, setSendEmailNow] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) setLabels(template.labels.length > 0 ? template.labels : [""]);
  }

  function handleSaveTemplate() {
    const cleanLabels = labels.map((l) => l.trim()).filter(Boolean);
    if (!templateName.trim() || cleanLabels.length === 0) return;
    startTransition(async () => {
      const result = await createTemplate(templateName, cleanLabels);
      setTemplateNotice(result.error ?? "Template saved.");
      if (!result.error) {
        setSavingTemplate(false);
        setTemplateName("");
      }
    });
  }

  function handleDeleteTemplate(templateId: string) {
    startTransition(async () => {
      await deleteTemplate(templateId);
      if (selectedTemplateId === templateId) setSelectedTemplateId("");
    });
  }

  return (
    <div className="max-w-lg mx-auto p-6 sm:p-8">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 rounded text-sm text-slate-500 hover:text-slate-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to requests
      </Link>
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
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
            />
          </div>
        </div>

        <div className="space-y-1.5 rounded-md bg-slate-50 p-3">
          <label className={`flex items-start gap-2 text-sm ${patientEmail ? "text-slate-700" : "text-slate-400"}`}>
            <input
              type="checkbox"
              name="sendEmailNow"
              checked={sendEmailNow && !!patientEmail}
              disabled={!patientEmail}
              onChange={(e) => setSendEmailNow(e.target.checked)}
              className="mt-0.5"
            />
            Email the patient this link right away
          </label>
          <p className="text-xs text-slate-400">
            {patientEmail
              ? "Sent as soon as you create the request."
              : "Add an email above to enable this, or skip it and share the QR code, link, or WhatsApp from the request page after creating it."}
          </p>
        </div>

        {templates.length > 0 && (
          <div className="space-y-1">
            <label htmlFor="template" className="text-sm font-medium">
              Start from a template
            </label>
            <div className="flex gap-2">
              <select
                id="template"
                value={selectedTemplateId}
                onChange={(e) => applyTemplate(e.target.value)}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
              >
                <option value="">Choose a saved template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.labels.length} document{t.labels.length === 1 ? "" : "s"})
                  </option>
                ))}
              </select>
              {selectedTemplateId && (
                <button
                  type="button"
                  onClick={() => handleDeleteTemplate(selectedTemplateId)}
                  disabled={isPending}
                  className="rounded-md border border-slate-200 px-2.5 text-xs text-slate-500 hover:border-red-300 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium">
            Requested documents
            <InfoTooltip text="One line per document, e.g. 'Referral letter' or 'Recent lab results'. The patient sees this exact label and uploads one file for each." />
          </span>
          {labels.map((label, i) => (
            <div key={i} className="flex gap-2">
              <input
                name="documentLabel"
                value={label}
                onChange={(e) =>
                  setLabels(labels.map((l, idx) => (idx === i ? e.target.value : l)))
                }
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
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setLabels([...labels, ""])}
              className="rounded text-sm font-medium text-teal-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
            >
              + Add another document
            </button>
            <button
              type="button"
              onClick={() => setSavingTemplate((v) => !v)}
              className="rounded text-sm text-slate-500 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
            >
              Save this list as a template
            </button>
          </div>

          {savingTemplate && (
            <div className="flex gap-2 rounded-md bg-slate-50 p-3">
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name, e.g. Pre-op bundle"
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
              />
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={isPending}
                className="rounded-md bg-slate-700 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          )}
          {templateNotice && <p className="text-xs text-slate-500">{templateNotice}</p>}
        </div>

        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}
