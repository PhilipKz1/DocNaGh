import { createServiceRoleClient } from "@/lib/supabase/server";
import { getDocumentStorageService } from "@/lib/storage";
import { logAuditEvent } from "@/lib/audit";

/**
 * Days a document is kept after upload before being permanently deleted.
 * This app is a relay to get documents from patient to provider, not the
 * clinic's system of record - the provider is expected to have downloaded
 * and filed anything they need well before this window closes. Keeping the
 * window short bounds how much PHI sits here at any given time (Ghana's
 * Data Protection Act 2012 retention-limitation principle: don't keep
 * personal data longer than necessary for the purpose it was collected for).
 */
export const RETENTION_DAYS = Number(process.env.DOCUMENT_RETENTION_DAYS ?? 30);

/**
 * Deletes the storage object and DB row for every document past its
 * retention window. Intended to run on a schedule (see
 * /api/cron/purge-documents) - safe to re-run if a previous run partially
 * failed, since already-deleted rows simply won't be selected again.
 */
export async function purgeExpiredDocuments() {
  const supabase = createServiceRoleClient();
  const storage = getDocumentStorageService();

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: expired, error } = await supabase
    .from("documents")
    .select("id, storage_path, request_documents(request_id)")
    .lt("uploaded_at", cutoff);

  if (error) throw error;
  if (!expired || expired.length === 0) return { purged: 0, failed: 0 };

  let purged = 0;
  let failed = 0;

  for (const doc of expired) {
    try {
      await storage.deleteObject(doc.storage_path);
    } catch (err) {
      // Object may already be gone from a previous partial run - don't let
      // that block removing the DB row too.
      console.error(`[retention] failed to delete storage object ${doc.storage_path}`, err);
    }

    const { error: deleteError } = await supabase.from("documents").delete().eq("id", doc.id);
    if (deleteError) {
      console.error(`[retention] failed to delete document row ${doc.id}`, deleteError);
      failed++;
      continue;
    }

    await logAuditEvent(supabase, {
      requestId: doc.request_documents?.request_id ?? null,
      actorType: "system",
      eventType: "document_purged",
      metadata: { documentId: doc.id, retentionDays: RETENTION_DAYS },
    });

    purged++;
  }

  return { purged, failed };
}
