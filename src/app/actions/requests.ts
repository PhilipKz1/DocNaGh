"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail, renderBrandedEmail, escapeHtml } from "@/lib/email";
import { getAppUrl } from "@/lib/appUrl";

const LINK_TTL_HOURS = Number(process.env.DOCUMENT_REQUEST_LINK_TTL_HOURS ?? 72);

async function getCurrentProvider(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: provider, error } = await supabase
    .from("providers")
    .select("id, clinic_id, full_name")
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

/**
 * Provider-confirmed close-out: everything requested has been uploaded
 * (status is "under_review"), and the provider has actually looked at it
 * and is satisfied nothing more is needed. Kept as a deliberate manual step
 * rather than auto-completing the moment every document lands, so a
 * provider can't miss a document that looks right by filename but is
 * actually wrong/incomplete - use "Request more documents" instead if so.
 */
export async function markRequestComplete(requestId: string) {
  const supabase = await createClient();
  const provider = await getCurrentProvider(supabase);

  const { data: request, error } = await supabase
    .from("requests")
    .update({ status: "complete" })
    .eq("id", requestId)
    .eq("status", "under_review")
    .select("id")
    .single();

  if (error || !request) return { error: "Unable to mark this request complete." };

  await logAuditEvent(supabase, {
    requestId,
    actorType: "provider",
    actorId: provider.id,
    eventType: "request_marked_complete",
  });

  revalidatePath(`/requests/${requestId}`);
  return { error: null };
}

const MAX_REQUEST_LIFETIME_DAYS = 14;

/**
 * Pushes a request's expiry further out - e.g. a patient needs more time
 * to gather documents. Capped at 14 days from when the request was
 * originally created, not 14 days from now each time, so this can't be
 * used to keep a single link alive indefinitely.
 */
export async function extendRequestExpiry(requestId: string, newExpiresAt: string) {
  const supabase = await createClient();
  const provider = await getCurrentProvider(supabase);

  const { data: request } = await supabase
    .from("requests")
    .select("created_at")
    .eq("id", requestId)
    .single();
  if (!request) return { error: "Request not found" };

  const requested = new Date(newExpiresAt).getTime();
  if (Number.isNaN(requested)) return { error: "Invalid date" };

  const maxAllowed =
    new Date(request.created_at).getTime() + MAX_REQUEST_LIFETIME_DAYS * 24 * 60 * 60 * 1000;
  if (requested > maxAllowed) {
    return { error: `Can't extend past ${MAX_REQUEST_LIFETIME_DAYS} days from when this request was created.` };
  }
  if (requested <= Date.now()) {
    return { error: "New expiry must be in the future." };
  }

  const { error } = await supabase
    .from("requests")
    .update({ expires_at: new Date(requested).toISOString() })
    .eq("id", requestId)
    .in("status", ["pending", "partially_received", "under_review"]);
  if (error) return { error: error.message };

  await logAuditEvent(supabase, {
    requestId,
    actorType: "provider",
    actorId: provider.id,
    eventType: "expiry_extended",
    metadata: { newExpiresAt: new Date(requested).toISOString() },
  });

  revalidatePath(`/requests/${requestId}`);
  return { error: null };
}

/**
 * Emails the patient a message the provider writes themselves - e.g. what's
 * been sent so far isn't enough and something specific is still needed.
 * RLS on `requests` here (the session-bound client, not service role)
 * already scopes this to the caller's own clinic, so a requestId for
 * another clinic just matches zero rows below.
 */
export async function requestAdditionalDocuments(
  requestId: string,
  patientEmail: string,
  message: string
) {
  const supabase = await createClient();
  const provider = await getCurrentProvider(supabase);

  const trimmedEmail = patientEmail.trim();
  const trimmedMessage = message.trim();
  if (!trimmedEmail) return { error: "Patient email is required" };
  if (!trimmedMessage) return { error: "Add a message describing what's needed" };

  const { data: request, error } = await supabase
    .from("requests")
    .select("id, patient_display_name, access_token")
    .eq("id", requestId)
    .single();
  if (error || !request) return { error: "Request not found" };

  let appUrl: string;
  try {
    appUrl = getAppUrl();
  } catch (err) {
    console.error(err);
    return { error: "Server misconfiguration: the app's URL isn't set correctly. Contact support." };
  }
  const link = `${appUrl}/r/${request.access_token}`;

  const bodyHtml = `
    <p>Hi ${escapeHtml(request.patient_display_name)},</p>
    <p>${escapeHtml(trimmedMessage).replace(/\n/g, "<br />")}</p>
  `;

  await sendEmail({
    to: trimmedEmail,
    subject: `Additional documents needed - ${request.patient_display_name}`,
    html: renderBrandedEmail({
      heading: "A few more documents are needed",
      bodyHtml,
      ctaText: "Upload documents",
      ctaUrl: link,
    }),
  });

  await logAuditEvent(supabase, {
    requestId,
    actorType: "provider",
    actorId: provider.id,
    eventType: "additional_documents_requested",
    metadata: { patientEmail: trimmedEmail },
  });

  revalidatePath(`/requests/${requestId}`);
  return { error: null };
}

/**
 * Internal note staff leave on a request - "called patient, uploading
 * tomorrow" and the like. Piggybacks on audit_events (note_added) instead
 * of a new table: it's already timestamped, attributed, RLS-scoped to the
 * clinic, and rendered in the same activity timeline, so a note just shows
 * up inline with everything else that happened on the request.
 */
export async function addRequestNote(requestId: string, text: string) {
  const supabase = await createClient();
  const provider = await getCurrentProvider(supabase);

  const trimmed = text.trim();
  if (!trimmed) return { error: "Note can't be empty" };
  if (trimmed.length > 1000) return { error: "Note is too long (max 1000 characters)" };

  await logAuditEvent(supabase, {
    requestId,
    actorType: "provider",
    actorId: provider.id,
    eventType: "note_added",
    metadata: { text: trimmed, authorName: provider.full_name },
  });

  revalidatePath(`/requests/${requestId}`);
  return { error: null };
}
