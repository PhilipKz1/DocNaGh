import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Recomputes a request's aggregate status from its request_documents rows.
 * Shared by upload confirmation and both document-removal paths (patient
 * self-undo, provider delete) so "complete" always accurately reflects
 * what's currently on file, not just what was ever uploaded.
 */
export async function recomputeRequestStatus(
  supabase: SupabaseClient<Database>,
  requestId: string
) {
  // A cancelled request stays cancelled - a provider deleting a document on
  // an already-cancelled request must not accidentally resurrect it into
  // "pending".
  const { data: current } = await supabase
    .from("requests")
    .select("status")
    .eq("id", requestId)
    .single();
  if (current?.status === "cancelled") return "cancelled";

  const { data: allDocs } = await supabase
    .from("request_documents")
    .select("status")
    .eq("request_id", requestId);

  const allUploaded = !!allDocs?.length && allDocs.every((d) => d.status === "uploaded");
  const anyUploaded = allDocs?.some((d) => d.status === "uploaded");
  const nextStatus = allUploaded ? "under_review" : anyUploaded ? "partially_received" : "pending";

  await supabase.from("requests").update({ status: nextStatus }).eq("id", requestId);
  return nextStatus;
}
