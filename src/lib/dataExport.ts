import { Zip, ZipDeflate, ZipPassThrough } from "fflate";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getDocumentStorageService } from "@/lib/storage";

type ServiceClient = SupabaseClient<Database>;

// PostgREST puts .in() filters in the URL, so long id lists are split up.
const IN_CHUNK = 100;

async function selectIn<T>(
  ids: string[],
  query: (chunk: string[]) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const rows: T[] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK) {
    const { data, error } = await query(ids.slice(i, i + IN_CHUNK));
    if (error) throw error;
    rows.push(...(data ?? []));
  }
  return rows;
}

function safeName(name: string) {
  return name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "file";
}

/**
 * Builds a ZIP of everything held for a clinic - or, with patientId, for one
 * of its patients: a data.json of the database rows plus every uploaded
 * file. Serves both the "return data to the controller on termination"
 * obligation (whole clinic) and patient access requests under Ghana's Data
 * Protection Act (one patient). Callers must have already authorized access
 * to clinicId/patientId - this uses the service role.
 *
 * Files are fetched one at a time and streamed out as they're read. There's
 * no backpressure, so a slow client can make chunks queue up in memory -
 * fine at current clinic sizes, worth revisiting for very large exports.
 */
export async function buildDataExport({
  clinicId,
  patientId,
}: {
  clinicId: string;
  patientId?: string;
}): Promise<ReadableStream<Uint8Array>> {
  const supabase = createServiceRoleClient();
  const storage = getDocumentStorageService();

  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .select("id, name, created_at")
    .eq("id", clinicId)
    .single();
  if (clinicError) throw clinicError;

  let patientsQuery = supabase
    .from("patients")
    .select("id, full_name, phone, email, created_at")
    .eq("clinic_id", clinicId);
  if (patientId) patientsQuery = patientsQuery.eq("id", patientId);
  const { data: patients, error: patientsError } = await patientsQuery;
  if (patientsError) throw patientsError;

  // access_token is deliberately left out - it's a live bearer credential.
  let requestsQuery = supabase
    .from("requests")
    .select(
      "id, patient_id, patient_display_name, status, expires_at, consented_at, consent_version, created_at"
    )
    .eq("clinic_id", clinicId);
  if (patientId) requestsQuery = requestsQuery.eq("patient_id", patientId);
  const { data: requests, error: requestsError } = await requestsQuery;
  if (requestsError) throw requestsError;
  const requestIds = (requests ?? []).map((r) => r.id);

  const requestDocuments = await selectIn(requestIds, (chunk) =>
    supabase
      .from("request_documents")
      .select("id, request_id, label, notes, status, created_at")
      .in("request_id", chunk)
  );
  const documents = await selectIn(
    requestDocuments.map((rd) => rd.id),
    (chunk) =>
      supabase
        .from("documents")
        .select("id, request_document_id, storage_path, file_name, mime_type, size_bytes, uploaded_at")
        .in("request_document_id", chunk)
  );

  const auditEvents = patientId
    ? await selectIn(requestIds, (chunk) =>
        supabase
          .from("audit_events")
          .select("id, request_id, actor_type, actor_id, event_type, metadata, created_at")
          .in("request_id", chunk)
      )
    : (
        await supabase
          .from("audit_events")
          .select("id, request_id, actor_type, actor_id, event_type, metadata, created_at")
          .eq("clinic_id", clinicId)
      ).data ?? [];

  const providers = patientId
    ? []
    : (
        await supabase
          .from("providers")
          .select("id, full_name, email, role, created_at")
          .eq("clinic_id", clinicId)
      ).data ?? [];

  const requestIdByRequestDocument = new Map(requestDocuments.map((rd) => [rd.id, rd.request_id]));
  const files = documents.map((doc) => ({
    storagePath: doc.storage_path,
    zipPath: `files/${requestIdByRequestDocument.get(doc.request_document_id)}/${doc.id.slice(0, 8)}-${safeName(doc.file_name)}`,
  }));

  const manifest = {
    exportedAt: new Date().toISOString(),
    scope: patientId ? "patient" : "clinic",
    clinic,
    providers,
    patients: patients ?? [],
    requests: requests ?? [],
    requestDocuments,
    // storage_path is an internal object key - exportPath is what's useful here.
    documents: documents.map((doc, i) => ({
      id: doc.id,
      request_document_id: doc.request_document_id,
      file_name: doc.file_name,
      mime_type: doc.mime_type,
      size_bytes: doc.size_bytes,
      uploaded_at: doc.uploaded_at,
      exportPath: files[i].zipPath,
    })),
    auditEvents,
  };

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const zip = new Zip((err, chunk, final) => {
        if (err) return controller.error(err);
        controller.enqueue(chunk);
        if (final) controller.close();
      });

      const json = new ZipDeflate("data.json", { level: 6 });
      zip.add(json);
      json.push(new TextEncoder().encode(JSON.stringify(manifest, null, 2)), true);

      const failed: string[] = [];
      for (const file of files) {
        try {
          const url = await storage.createDownloadUrl(file.storagePath, undefined, 300);
          const res = await fetch(url);
          if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
          // PDFs/JPEGs/PNGs are already compressed - store them as-is.
          const entry = new ZipPassThrough(file.zipPath);
          zip.add(entry);
          const reader = res.body.getReader();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            entry.push(value);
          }
          entry.push(new Uint8Array(0), true);
        } catch (err) {
          console.error(`[dataExport] failed to include ${file.storagePath}`, err);
          failed.push(file.zipPath);
        }
      }

      if (failed.length > 0) {
        const note = new ZipDeflate("MISSING_FILES.txt");
        zip.add(note);
        note.push(
          new TextEncoder().encode(
            `These files could not be read from storage and are missing from this export:\n${failed.join("\n")}\n`
          ),
          true
        );
      }

      zip.end();
    },
  });
}

/**
 * Deletes the given requests and everything under them, files included.
 * Storage objects have no DB-level cascade, so they're removed explicitly
 * first; the request delete then cascades request_documents and documents
 * (whose delete trigger scrubs file names from audit metadata).
 */
export async function deleteRequestsWithFiles(supabase: ServiceClient, requestIds: string[]) {
  const storage = getDocumentStorageService();

  const requestDocuments = await selectIn(requestIds, (chunk) =>
    supabase.from("request_documents").select("id").in("request_id", chunk)
  );
  const documents = await selectIn(
    requestDocuments.map((rd) => rd.id),
    (chunk) => supabase.from("documents").select("storage_path").in("request_document_id", chunk)
  );

  for (const doc of documents) {
    try {
      await storage.deleteObject(doc.storage_path);
    } catch (err) {
      // Object may already be gone - don't let that block the rest.
      console.error(`[deleteRequestsWithFiles] failed to delete storage object ${doc.storage_path}`, err);
    }
  }

  for (let i = 0; i < requestIds.length; i += IN_CHUNK) {
    const { error } = await supabase
      .from("requests")
      .delete()
      .in("id", requestIds.slice(i, i + IN_CHUNK));
    if (error) throw error;
  }

  return { filesDeleted: documents.length };
}
