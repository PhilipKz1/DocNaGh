import { getRequestByToken } from "@/lib/requestAccess";
import { RETENTION_DAYS } from "@/lib/retention";
import { MAX_FILE_SIZE_BYTES } from "@/lib/storage/fileValidation";
import { PatientUploadForm } from "./PatientUploadForm";

function BrandMark() {
  return (
    <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
      <span className="grid h-5 w-5 place-items-center rounded bg-teal-600 text-white">
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="currentColor" className="h-3 w-3">
          <path d="M12 3.5 5 6v5.5c0 4.6 3 7.9 7 9 4-1.1 7-4.4 7-9V6l-7-2.5Z" strokeLinejoin="round" />
        </svg>
      </span>
      Secured by MedSwyft
    </div>
  );
}

export default async function PatientRequestPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const access = await getRequestByToken(token);

  if (!access) {
    return (
      <Message title="Link not found">
        This link doesn&apos;t match any active document request. Double-check the link, or
        contact your clinic for a new one.
      </Message>
    );
  }

  // Unlike "expired"/"cancelled", "completed" is not a hard wall: a patient
  // may reopen this link after finishing to realize they uploaded the wrong
  // file and need to pull it back (see PatientUploadForm's remove action),
  // so it still falls through to render the form below.

  const clinicName = access.request.clinics?.name;

  if (access.deniedReason === "cancelled") {
    return (
      <Message title="Link cancelled" clinicName={clinicName}>
        This link has been cancelled by the clinic. Please contact them for a new one.
      </Message>
    );
  }

  if (access.deniedReason === "expired") {
    return (
      <Message title="Link expired" clinicName={clinicName}>
        This link has expired. Please contact the clinic for a new one.
      </Message>
    );
  }

  const { data: requestDocuments } = await access.supabase
    .from("request_documents")
    .select("id, label, notes, status")
    .eq("request_id", access.request.id)
    .order("created_at", { ascending: true });

  const uploadedCount = (requestDocuments ?? []).filter((d) => d.status === "uploaded").length;
  const totalCount = requestDocuments?.length ?? 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-lg mx-auto p-6 space-y-6">
        <BrandMark />

        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
            Document request
          </p>
          <h1 className="text-lg font-semibold text-slate-900">
            {clinicName ?? "Your clinic"} needs some documents from you
          </h1>
          <p className="text-sm text-slate-600">
            For {access.request.patient_display_name}
            {access.request.providers?.full_name && ` · Requested by ${access.request.providers.full_name}`}
          </p>
          {totalCount > 0 && (
            <div className="pt-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-teal-600 transition-all"
                  style={{ width: `${(uploadedCount / totalCount) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {uploadedCount} of {totalCount} documents received
              </p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500 space-y-1">
          <p>
            Accepted: PDF, JPG, or PNG, up to {MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB each.
          </p>
          <p>
            Files are encrypted and only visible to {clinicName ?? "the requesting clinic"} -
            automatically and permanently deleted {RETENTION_DAYS} days after upload. You can
            remove anything you upload by mistake, any time before then.
          </p>
        </div>

        <PatientUploadForm token={token} initialDocuments={requestDocuments ?? []} />
      </div>
    </div>
  );
}

function Message({
  title,
  clinicName,
  children,
}: {
  title: string;
  clinicName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-8 text-center">
        <BrandMark />
        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">{children}</p>
          {clinicName && <p className="text-xs text-slate-400">Requesting clinic: {clinicName}</p>}
        </div>
      </div>
    </div>
  );
}
