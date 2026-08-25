"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

const LINK_TTL_HOURS = Number(process.env.DOCUMENT_REQUEST_LINK_TTL_HOURS ?? 72);

async function getCurrentProvider(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: provider, error } = await supabase
    .from("providers")
    .select("id, clinic_id")
    .eq("user_id", user.id)
    .single();

  if (error || !provider) throw new Error("No provider profile for this account");
  return provider;
}

export async function createRequest(_prevState: { error: string | null }, formData: FormData) {
  const patientName = String(formData.get("patientName") ?? "").trim();
  const patientPhone = String(formData.get("patientPhone") ?? "").trim() || null;
  const patientEmail = String(formData.get("patientEmail") ?? "").trim() || null;
  const labels = formData
    .getAll("documentLabel")
    .map((v) => String(v).trim())
    .filter(Boolean);

  if (!patientName) return { error: "Patient name is required" };
  if (labels.length === 0) return { error: "Add at least one requested document" };

  const supabase = await createClient();
  const provider = await getCurrentProvider(supabase);

  let patientId: string | null = null;
  if (patientPhone) {
    const { data: existing } = await supabase
      .from("patients")
      .select("id")
      .eq("clinic_id", provider.clinic_id)
      .eq("phone", patientPhone)
      .maybeSingle();
    patientId = existing?.id ?? null;
  }

  if (!patientId) {
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .insert({
        clinic_id: provider.clinic_id,
        full_name: patientName,
        phone: patientPhone,
        email: patientEmail,
      })
      .select("id")
      .single();

    if (patientError) return { error: patientError.message };
    patientId = patient.id;
  }

  const expiresAt = new Date(Date.now() + LINK_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { data: request, error: requestError } = await supabase
    .from("requests")
    .insert({
      clinic_id: provider.clinic_id,
      provider_id: provider.id,
      patient_id: patientId,
      patient_display_name: patientName,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (requestError) return { error: requestError.message };

  const { error: docsError } = await supabase.from("request_documents").insert(
    labels.map((label) => ({ request_id: request.id, label }))
  );

  if (docsError) return { error: docsError.message };

  await logAuditEvent(supabase, {
    requestId: request.id,
    actorType: "provider",
    actorId: provider.id,
    eventType: "request_created",
    metadata: { documentCount: labels.length },
  });

  redirect(`/requests/${request.id}`);
}

/**
 * Revokes a request's access token immediately, before its normal expiry.
 * The token is the only credential a patient link/QR code carries, so this
 * is how a provider kills a link that's been sent to the wrong person, is
 * no longer needed, or is suspected of being leaked.
 */
export async function cancelRequest(requestId: string) {
  const supabase = await createClient();
  const provider = await getCurrentProvider(supabase);

  const { data: request, error } = await supabase
    .from("requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
    .in("status", ["pending", "partially_received"])
    .select("id")
    .single();

  if (error || !request) return { error: "Unable to cancel this request." };

  await logAuditEvent(supabase, {
    requestId,
    actorType: "provider",
    actorId: provider.id,
    eventType: "request_cancelled",
  });

  revalidatePath(`/requests/${requestId}`);
  return { error: null };
}
