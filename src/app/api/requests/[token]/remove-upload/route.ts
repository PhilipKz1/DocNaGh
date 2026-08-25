import { NextResponse } from "next/server";
import { getRequestByToken } from "@/lib/requestAccess";
import { getDocumentStorageService } from "@/lib/storage";
import { logAuditEvent } from "@/lib/audit";
import { recomputeRequestStatus } from "@/lib/requestStatus";

/**
 * Lets a patient pull back something they just uploaded - e.g. the wrong
 * file, or one that turned out to contain more than intended - while their
 * link is still theirs to use. Deliberately allowed even once the request
 * has reached "complete" (undoing the very last upload is exactly the case
 * this exists for); only a truly dead link (expired or provider-cancelled)
 * is refused.
 */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const access = await getRequestByToken(token);
  if (!access || access.deniedReason === "expired" || access.deniedReason === "cancelled") {
    return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 404 });
  }

  const { requestDocumentId } = (await request.json()) as { requestDocumentId: string };

  const { data: requestDocument } = await access.supabase
    .from("request_documents")
    .select("id")
    .eq("id", requestDocumentId)
    .eq("request_id", access.request.id)
    .maybeSingle();
  if (!requestDocument) {
    return NextResponse.json({ error: "Unknown document for this request." }, { status: 400 });
  }

  const { data: document } = await access.supabase
    .from("documents")
    .select("id, storage_path, file_name")
    .eq("request_document_id", requestDocumentId)
    .maybeSingle();
  if (!document) {
    return NextResponse.json({ error: "Nothing uploaded for this document yet." }, { status: 400 });
  }

  await getDocumentStorageService().deleteObject(document.storage_path);
  await access.supabase.from("documents").delete().eq("id", document.id);
  await access.supabase
    .from("request_documents")
    .update({ status: "requested" })
    .eq("id", requestDocumentId);

  const nextStatus = await recomputeRequestStatus(access.supabase, access.request.id);

  await logAuditEvent(access.supabase, {
    requestId: access.request.id,
    actorType: "patient",
    eventType: "document_removed_by_patient",
    metadata: { requestDocumentId, fileName: document.file_name },
  });

  return NextResponse.json({ ok: true, requestStatus: nextStatus });
}
