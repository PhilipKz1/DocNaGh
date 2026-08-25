"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ALLOWED_MIME_TYPES, validateFile } from "@/lib/storage/fileValidation";

type RequestDocument = {
  id: string;
  label: string;
  notes: string | null;
  status: "requested" | "uploaded" | "missing";
};

export function PatientUploadForm({
  token,
  initialDocuments,
}: {
  token: string;
  initialDocuments: RequestDocument[];
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function handleUpload(doc: RequestDocument, file: File) {
    setErrors((e) => ({ ...e, [doc.id]: "" }));

    const validationError = validateFile({ mimeType: file.type, sizeBytes: file.size });
    if (validationError) {
      setErrors((e) => ({ ...e, [doc.id]: validationError }));
      return;
    }

    setBusyId(doc.id);
    try {
      const targetRes = await fetch(`/api/requests/${token}/upload-target`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestDocumentId: doc.id,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!targetRes.ok) throw new Error((await targetRes.json()).error ?? "Upload failed");
      const { storagePath, uploadToken } = await targetRes.json();

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_DOCUMENTS_BUCKET ?? "patient-documents")
        .uploadToSignedUrl(storagePath, uploadToken, file);
      if (uploadError) throw uploadError;

      const confirmRes = await fetch(`/api/requests/${token}/confirm-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestDocumentId: doc.id,
          storagePath,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!confirmRes.ok) throw new Error((await confirmRes.json()).error ?? "Upload failed");

      setDocuments((docs) =>
        docs.map((d) => (d.id === doc.id ? { ...d, status: "uploaded" } : d))
      );
    } catch (err) {
      setErrors((e) => ({ ...e, [doc.id]: err instanceof Error ? err.message : "Upload failed" }));
    } finally {
      setBusyId(null);
      if (inputRefs.current[doc.id]) inputRefs.current[doc.id]!.value = "";
    }
  }

  async function handleRemove(doc: RequestDocument) {
    setErrors((e) => ({ ...e, [doc.id]: "" }));
    setBusyId(doc.id);
    try {
      const res = await fetch(`/api/requests/${token}/remove-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestDocumentId: doc.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not remove this file");

      setDocuments((docs) =>
        docs.map((d) => (d.id === doc.id ? { ...d, status: "requested" } : d))
      );
    } catch (err) {
      setErrors((e) => ({ ...e, [doc.id]: err instanceof Error ? err.message : "Could not remove this file" }));
    } finally {
      setBusyId(null);
      setConfirmingRemoveId(null);
    }
  }

  const allUploaded = documents.every((d) => d.status === "uploaded");

  return (
    <div className="space-y-4">
      {allUploaded && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          All requested documents have been submitted. You can close this
          page. Uploaded the wrong file? You can still remove it below.
        </div>
      )}

      <ul className="space-y-4">
        {documents.map((doc) => (
          <li key={doc.id} className="rounded-md border p-4 space-y-2">
            <div>
              <p className="text-sm font-medium">{doc.label}</p>
              {doc.notes && <p className="text-xs text-gray-500">{doc.notes}</p>}
            </div>

            {doc.status === "uploaded" ? (
              confirmingRemoveId === doc.id ? (
                <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="text-xs text-red-800">
                    Remove this file? You&apos;ll need to upload it again if
                    it was needed.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRemove(doc)}
                      disabled={busyId === doc.id}
                      className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
                    >
                      {busyId === doc.id ? "Removing..." : "Yes, remove it"}
                    </button>
                    <button
                      onClick={() => setConfirmingRemoveId(null)}
                      disabled={busyId === doc.id}
                      className="text-sm text-gray-500 hover:underline"
                    >
                      Keep it
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-green-700">Uploaded ✓</p>
                  <button
                    onClick={() => setConfirmingRemoveId(doc.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )
            ) : (
              <>
                <input
                  ref={(el) => {
                    inputRefs.current[doc.id] = el;
                  }}
                  type="file"
                  accept={ALLOWED_MIME_TYPES.join(",")}
                  capture="environment"
                  disabled={busyId === doc.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(doc, file);
                  }}
                  className="block w-full text-sm"
                />
                {busyId === doc.id && <p className="text-xs text-gray-500">Uploading...</p>}
              </>
            )}
            {errors[doc.id] && <p className="text-xs text-red-600">{errors[doc.id]}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
