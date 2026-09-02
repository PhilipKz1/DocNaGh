import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RETENTION_DAYS } from "@/lib/retention";
import { DownloadButton } from "./DownloadButton";
import { DeleteDocumentButton } from "./DeleteDocumentButton";
import { RequestQrCode } from "./RequestQrCode";
import { CancelRequestButton } from "./CancelRequestButton";
import { RequestMoreDocumentsForm } from "./RequestMoreDocumentsForm";
import { getAppUrl } from "@/lib/appUrl";

const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  uploaded: "Uploaded",
  missing: "Missing",
};

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("requests")
    .select(
      "id, patient_display_name, status, access_token, expires_at, created_at, patients(email)"
    )
    .eq("id", id)
    .single();

  if (!request) notFound();

  const { data: requestDocuments } = await supabase
    .from("request_documents")
    .select("id, label, notes, status, documents(id, file_name, size_bytes, uploaded_at)")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  const { data: auditEvents } = await supabase
    .from("audit_events")
    .select("id, event_type, actor_type, created_at, metadata")
    .eq("request_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const link = `${getAppUrl()}/r/${request.access_token}`;
  const isCancellable = request.status === "pending" || request.status === "partially_received";
  const linkIsLive = isCancellable && new Date(request.expires_at).getTime() > Date.now();

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold">{request.patient_display_name}</h1>
        <p className="text-sm text-gray-500">
          Status: {request.status} · Expires {new Date(request.expires_at).toLocaleString()}
        </p>
      </div>

      {linkIsLive ? (
        <div className="space-y-3">
          <RequestQrCode link={link} />
          <CancelRequestButton requestId={request.id} />
        </div>
      ) : (
        <p className="text-sm text-gray-500 rounded-md border p-4">
          This link no longer grants access
          {request.status === "complete" && " — all documents were received."}
          {request.status === "cancelled" && " — it was cancelled."}
          {request.status !== "complete" && request.status !== "cancelled" && " — it has expired."}
        </p>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Requested documents</h2>
        <ul className="divide-y rounded-md border">
          {requestDocuments?.map((doc) => (
            <li key={doc.id} className="px-4 py-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{doc.label}</span>
                <span className="text-xs rounded-full border px-2 py-1">
                  {STATUS_LABEL[doc.status] ?? doc.status}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {doc.documents?.map((file) => {
                  const autoDeletesAt = new Date(
                    new Date(file.uploaded_at).getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000
                  );
                  return (
                    <div key={file.id} className="flex items-center gap-3">
                      <DownloadButton documentId={file.id} fileName={file.file_name} />
                      <DeleteDocumentButton documentId={file.id} />
                      <span className="text-xs text-gray-400">
                        Auto-deletes {autoDeletesAt.toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <RequestMoreDocumentsForm requestId={request.id} defaultEmail={request.patients?.email ?? ""} />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Audit history</h2>
        <ul className="text-xs text-gray-500 space-y-1">
          {auditEvents?.map((event) => (
            <li key={event.id}>
              {new Date(event.created_at).toLocaleString()} — {event.actor_type}: {event.event_type}
            </li>
          ))}
          {(!auditEvents || auditEvents.length === 0) && <li>No activity yet.</li>}
        </ul>
      </div>
    </div>
  );
}
