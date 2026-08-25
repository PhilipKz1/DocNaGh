import { createServiceRoleClient } from "@/lib/supabase/server";

export type RequestAccessDenialReason = "expired" | "completed" | "cancelled";

/**
 * Patient-facing requests are looked up by their unguessable access_token,
 * not by session - this is the only place patient identity is established.
 *
 * The token is a bearer credential, so it must not stay usable forever: it
 * stops working once the request's time-to-live elapses, and - so an
 * intercepted link can't be replayed later - the moment every document has
 * been submitted or a provider cancels the request, well before that
 * deadline. Callers must check `deniedReason` before allowing any read/write.
 */
export async function getRequestByToken(token: string) {
  const supabase = createServiceRoleClient();

  const { data: request, error } = await supabase
    .from("requests")
    .select("id, clinic_id, provider_id, patient_id, patient_display_name, status, expires_at, access_token")
    .eq("access_token", token)
    .maybeSingle();

  if (error || !request) return null;

  const timeExpired = new Date(request.expires_at).getTime() < Date.now();

  let deniedReason: RequestAccessDenialReason | null = null;
  if (timeExpired) deniedReason = "expired";
  else if (request.status === "cancelled") deniedReason = "cancelled";
  else if (request.status === "complete") deniedReason = "completed";

  return { request, deniedReason, supabase };
}
