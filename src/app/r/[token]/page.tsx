import { getRequestByToken } from "@/lib/requestAccess";
import { RETENTION_DAYS } from "@/lib/retention";
import { PatientUploadForm } from "./PatientUploadForm";

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
        This link doesn&apos;t match any active document request.
      </Message>
    );
  }

  // Unlike "expired"/"cancelled", "completed" is not a hard wall: a patient
  // may reopen this link after finishing to realize they uploaded the wrong
  // file and need to pull it back (see PatientUploadForm's remove action),
  // so it still falls through to render the form below.

  if (access.deniedReason === "cancelled") {
    return (
      <Message title="Link cancelled">
        This link has been cancelled by the clinic. Please contact them for a
        new one.
      </Message>
    );
  }

  if (access.deniedReason === "expired") {
    return (
      <Message title="Link expired">
        This link has expired. Please contact the clinic for a new one.
      </Message>
    );
  }

  const { data: requestDocuments } = await access.supabase
    .from("request_documents")
    .select("id, label, notes, status")
    .eq("request_id", access.request.id)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Document request</h1>
        <p className="text-sm text-gray-500">
          For {access.request.patient_display_name}. Upload each document below from your phone.
        </p>
        <p className="text-xs text-gray-400">
          For your privacy, uploaded documents are automatically and
          permanently deleted {RETENTION_DAYS} days after you upload them.
          If you upload something by mistake, you can remove it yourself
          below, any time before then.
        </p>
      </div>

      <PatientUploadForm token={token} initialDocuments={requestDocuments ?? []} />
    </div>
  );
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto p-8 text-center space-y-2">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-sm text-gray-500">{children}</p>
    </div>
  );
}
