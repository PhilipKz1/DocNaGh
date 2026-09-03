import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RETENTION_DAYS } from "@/lib/retention";
import { AppHeader } from "@/components/AppHeader";
import { DownloadButton } from "./DownloadButton";
import { DeleteDocumentButton } from "./DeleteDocumentButton";
import { RequestQrCode } from "./RequestQrCode";
import { CancelRequestButton } from "./CancelRequestButton";
import { RequestMoreDocumentsForm } from "./RequestMoreDocumentsForm";
import { MarkCompleteButton } from "./MarkCompleteButton";
import { ExtendExpiryControl } from "./ExtendExpiryControl";
import { RealtimeRequestWatcher } from "./RealtimeRequestWatcher";
import { getAppUrl } from "@/lib/appUrl";
import { InfoTooltip } from "@/components/InfoTooltip";

const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  uploaded: "Uploaded",
  missing: "Missing",
};

const REQUEST_STATUS: Record<string, { label: string; className: string; meaning: string }> = {
  pending: {
    label: "Waiting on patient",
    className: "bg-slate-100 text-slate-700",
    meaning: "The link is live and the patient hasn't uploaded anything yet.",
  },
  partially_received: {
    label: "Partially received",
    className: "bg-amber-100 text-amber-800",
    meaning: "Some but not all requested documents have been uploaded.",
  },
  under_review: {
    label: "Under review",
    className: "bg-blue-100 text-blue-800",
    meaning: "Everything requested was uploaded - check it, then mark complete or ask for more.",
  },
  complete: {
    label: "Complete",
    className: "bg-emerald-100 text-emerald-800",
    meaning: "You've confirmed everything needed was received. The link no longer works.",
  },
  expired: {
    label: "Expired",
    className: "bg-slate-100 text-slate-500",
    meaning: "The link's time limit passed before everything was received.",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700",
    meaning: "The link was manually revoked and no longer works.",
  },
};

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("requests")
    .select(
      "id, patient_id, patient_display_name, status, access_token, expires_at, created_at, patients(email), providers(full_name)"
    )
    .eq("id", id)
    .single();

  if (!request) notFound();

  const { data: patientHistory } = request.patient_id
    ? await supabase
        .from("requests")
        .select("id, status, created_at")
        .eq("patient_id", request.patient_id)
        .neq("id", id)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: null };

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
  const linkIsLive =
    ["pending", "partially_received", "under_review"].includes(request.status) &&
    new Date(request.expires_at).getTime() > Date.now();
  const statusInfo = REQUEST_STATUS[request.status] ?? {
    label: request.status,
    className: "bg-slate-100 text-slate-700",
    meaning: "",
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900">
      <AppHeader homeHref="/dashboard" backHref="/dashboard" backLabel="Back to requests" />
      <RealtimeRequestWatcher requestId={request.id} />

      <div className="max-w-2xl mx-auto p-6 sm:p-8 space-y-8">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold">{request.patient_display_name}</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
            {statusInfo.meaning && <InfoTooltip text={statusInfo.meaning} />}
          </div>
          <p className="text-sm text-slate-500">
            Requested by {request.providers?.full_name ?? "Unknown"} on{" "}
            {new Date(request.created_at).toLocaleString()} · Expires{" "}
            {new Date(request.expires_at).toLocaleString()}
          </p>
        </div>

        {patientHistory && patientHistory.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-2 text-xs font-semibold text-slate-700">
              Previous requests for {request.patient_display_name}
            </p>
            <ul className="space-y-1">
              {patientHistory.map((past) => (
                <li key={past.id}>
                  <Link
                    href={`/requests/${past.id}`}
                    className="flex items-center justify-between rounded px-1 py-0.5 text-xs text-slate-600 hover:bg-slate-50 hover:underline"
                  >
                    <span>{new Date(past.created_at).toLocaleDateString()}</span>
                    <span className={`rounded-full px-2 py-0.5 ${REQUEST_STATUS[past.status]?.className ?? "bg-slate-100 text-slate-600"}`}>
                      {REQUEST_STATUS[past.status]?.label ?? past.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {request.status === "under_review" && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
            <p className="text-sm text-blue-900">
              Everything requested has been uploaded. Review it below - if something&apos;s missing
              or wrong, use &quot;Request more documents&quot;. Otherwise, mark this complete.
            </p>
            <MarkCompleteButton requestId={request.id} />
          </div>
        )}

        {linkIsLive ? (
          <div className="space-y-3">
            <RequestQrCode link={link} />
            <div className="flex flex-wrap items-center gap-4">
              <ExtendExpiryControl
                requestId={request.id}
                createdAt={request.created_at}
                expiresAt={request.expires_at}
              />
              <CancelRequestButton requestId={request.id} />
            </div>
          </div>
        ) : (
          <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
            This link no longer grants access
            {request.status === "complete" && " — all documents were received."}
            {request.status === "cancelled" && " — it was cancelled."}
            {request.status !== "complete" && request.status !== "cancelled" && " — it has expired."}
          </p>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Requested documents</h2>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {requestDocuments?.map((doc) => (
              <li key={doc.id} className="px-4 py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{doc.label}</span>
                  <span className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600">
                    {STATUS_LABEL[doc.status] ?? doc.status}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {doc.documents?.map((file) => {
                    const uploadedAt = new Date(file.uploaded_at);
                    const autoDeletesAt = new Date(
                      uploadedAt.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000
                    );
                    return (
                      <div key={file.id} className="flex flex-wrap items-center gap-3">
                        <DownloadButton documentId={file.id} fileName={file.file_name} />
                        <DeleteDocumentButton documentId={file.id} />
                        <span
                          className="text-xs text-slate-400"
                          title="Sent by the patient - shown in your local time"
                        >
                          Received {uploadedAt.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400">
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
          <h2 className="text-sm font-semibold text-slate-700" title="Updates live as things happen - no need to refresh">
            Activity
          </h2>
          <ul className="space-y-1 text-xs text-slate-500">
            {auditEvents?.map((event) => (
              <li key={event.id}>
                {new Date(event.created_at).toLocaleString()} — {event.actor_type}: {event.event_type}
              </li>
            ))}
            {(!auditEvents || auditEvents.length === 0) && <li>No activity yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
