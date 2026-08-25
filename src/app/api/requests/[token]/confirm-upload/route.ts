import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getRequestByToken } from "@/lib/requestAccess";
import { logAuditEvent } from "@/lib/audit";
import { recomputeRequestStatus } from "@/lib/requestStatus";
import { sendEmail } from "@/lib/email";
import { getDocumentStorageService } from "@/lib/storage";
import { validateFile, type AllowedMimeType } from "@/lib/storage/fileValidation";
import { matchesFileSignature, SIGNATURE_CHECK_BYTES } from "@/lib/storage/fileSignature";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const access = await getRequestByToken(token);
  if (!access || access.deniedReason) {
    return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 404 });
  }

  const body = await request.json();
  const { requestDocumentId, storagePath, fileName, mimeType, sizeBytes } = body as {
    requestDocumentId: string;
    storagePath: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  };

  const { data: requestDocument } = await access.supabase
    .from("request_documents")
    .select("id, label")
    .eq("id", requestDocumentId)
    .eq("request_id", access.request.id)
    .maybeSingle();

  if (!requestDocument) {
    return NextResponse.json({ error: "Unknown document for this request." }, { status: 400 });
  }

  // Re-validate here, not just at upload-target time: this call's mimeType
  // is separately client-supplied and could disagree with what was checked
  // earlier, and this is also the first point we can inspect real bytes.
  const validationError = validateFile({ mimeType, sizeBytes });
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const storage = getDocumentStorageService();
  const header = await storage.readHeaderBytes(storagePath, SIGNATURE_CHECK_BYTES);
  if (!matchesFileSignature(header, mimeType as AllowedMimeType)) {
    await storage.deleteObject(storagePath);
    return NextResponse.json(
      { error: "This file's content doesn't match its type. Please re-upload the correct file." },
      { status: 400 }
    );
  }

  const { error: insertError } = await access.supabase.from("documents").insert({
    request_document_id: requestDocumentId,
    storage_path: storagePath,
    file_name: fileName,
    mime_type: mimeType,
    size_bytes: sizeBytes,
  });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await access.supabase
    .from("request_documents")
    .update({ status: "uploaded" })
    .eq("id", requestDocumentId);

  const nextStatus = await recomputeRequestStatus(access.supabase, access.request.id);

  await logAuditEvent(access.supabase, {
    requestId: access.request.id,
    actorType: "patient",
    eventType: "document_uploaded",
    metadata: { fileName, requestDocumentId },
  });

  await notifyUploadReceived({
    supabase: access.supabase,
    requestId: access.request.id,
    providerId: access.request.provider_id,
    patientId: access.request.patient_id,
    patientDisplayName: access.request.patient_display_name,
    documentLabel: requestDocument.label,
  });

  return NextResponse.json({ ok: true, requestStatus: nextStatus });
}

/**
 * Confirms to both sides that an upload "went through": the provider gets
 * told a document arrived (they'd otherwise have to keep refreshing the
 * dashboard to find out), and the patient - if we have their email - gets a
 * receipt for what they just sent. Best-effort; sendEmail() never throws,
 * so a delivery failure here can't fail the upload it's reporting on.
 */
async function notifyUploadReceived(params: {
  supabase: SupabaseClient<Database>;
  requestId: string;
  providerId: string;
  patientId: string | null;
  patientDisplayName: string;
  documentLabel: string;
}) {
  const { supabase, requestId, providerId, patientId, patientDisplayName, documentLabel } = params;

  const { data: provider } = await supabase
    .from("providers")
    .select("email")
    .eq("id", providerId)
    .maybeSingle();

  let patientEmail: string | null = null;
  if (patientId) {
    const { data: patient } = await supabase
      .from("patients")
      .select("email")
      .eq("id", patientId)
      .maybeSingle();
    patientEmail = patient?.email ?? null;
  }

  const sends: Promise<void>[] = [];

  if (provider?.email) {
    sends.push(
      sendEmail({
        to: provider.email,
        subject: `New document received: ${patientDisplayName}`,
        html: `<p><strong>${documentLabel}</strong> was just uploaded for ${patientDisplayName}'s document request.</p><p><a href="${appUrl}/requests/${requestId}">View in dashboard</a></p>`,
      })
    );
  }

  if (patientEmail) {
    sends.push(
      sendEmail({
        to: patientEmail,
        subject: "Document received",
        html: `<p>We received your <strong>${documentLabel}</strong>. Thanks for sending it over.</p>`,
      })
    );
  }

  await Promise.allSettled(sends);
}
