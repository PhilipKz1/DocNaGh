"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDocumentStorageService } from "@/lib/storage";
import { logAuditEvent } from "@/lib/audit";
import { recomputeRequestStatus } from "@/lib/requestStatus";

/** The signed-in provider, for attributing audit events to them and their clinic. */
async function getCurrentProvider(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: provider } = await supabase
    .from("providers")
    .select("id, clinic_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return provider;
}

/**
 * Verifies the caller's clinic can see this document (via RLS), then mints
 * a signed URL. forceDownload=true (the default, used by the "Download"
 * action) sets Content-Disposition: attachment so the browser saves the
 * file. Pass false (used by "Preview" on images) to get a URL the browser
 * renders inline instead - forcing attachment on an image would defeat the
 * point of previewing it.
 */
export async function getDownloadUrl(documentId: string, forceDownload = true): Promise<string> {
  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from("documents")
    .select("storage_path, file_name, request_document_id")
    .eq("id", documentId)
    .single();

  if (error || !document) throw new Error("Document not found or access denied");

  const storage = getDocumentStorageService();
  const url = await storage.createDownloadUrl(
    document.storage_path,
    forceDownload ? document.file_name : undefined
  );

  const { data: requestDoc } = await supabase
    .from("request_documents")
    .select("request_id")
    .eq("id", document.request_document_id)
    .single();

  const provider = await getCurrentProvider(supabase);

  // No fileName here: the name lives on the documents row (and its upload
  // event) and is removed with it - copying it into other events would
  // keep it around after the document is deleted.
  await logAuditEvent({
    requestId: requestDoc?.request_id ?? null,
    clinicId: provider?.clinic_id ?? null,
    actorType: "provider",
    actorId: provider?.id ?? null,
    eventType: "document_downloaded",
    metadata: { documentId },
  });

  return url;
}

/**
 * Permanently deletes an uploaded document - for content that should never
 * have been sent (wrong file, unexpectedly sensitive) and where the
 * patient's own link is no longer usable (expired, or they already closed
 * it) so /api/requests/[token]/remove-upload can't reach it anymore.
 * RLS (the "providers can delete own clinic documents" policy) is the real
 * enforcement here - a provider from another clinic simply won't find the
 * row to delete.
 */
export async function deleteDocument(documentId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from("documents")
    .select("storage_path, file_name, request_document_id")
    .eq("id", documentId)
    .single();
  if (error || !document) return { error: "Document not found or access denied" };

  const { data: requestDoc } = await supabase
    .from("request_documents")
    .select("request_id")
    .eq("id", document.request_document_id)
    .single();

  const storage = getDocumentStorageService();
  await storage.deleteObject(document.storage_path);

  const { error: deleteError } = await supabase.from("documents").delete().eq("id", documentId);
  if (deleteError) return { error: deleteError.message };

  await supabase
    .from("request_documents")
    .update({ status: "requested" })
    .eq("id", document.request_document_id);

  if (requestDoc?.request_id) {
    await recomputeRequestStatus(supabase, requestDoc.request_id);
  }

  const provider = await getCurrentProvider(supabase);

  await logAuditEvent({
    requestId: requestDoc?.request_id ?? null,
    clinicId: provider?.clinic_id ?? null,
    actorType: "provider",
    actorId: provider?.id ?? null,
    eventType: "document_deleted_by_provider",
    metadata: { documentId },
  });

  if (requestDoc?.request_id) {
    revalidatePath(`/requests/${requestDoc.request_id}`);
  }

  return { error: null };
}
