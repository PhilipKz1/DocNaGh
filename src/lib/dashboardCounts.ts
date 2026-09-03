import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Count of this clinic's requests sitting in "under_review" - RLS already
 * scopes `requests` to the caller's own clinic, so no explicit clinic_id
 * filter is needed here.
 */
export async function getUnderReviewCount(supabase: SupabaseClient): Promise<number> {
  const { count } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "under_review");
  return count ?? 0;
}
