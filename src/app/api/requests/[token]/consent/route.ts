import { NextResponse } from "next/server";
import { getRequestByToken } from "@/lib/requestAccess";
import { logAuditEvent } from "@/lib/audit";
import { CONSENT_VERSION } from "@/lib/consent";

/**
 * Records the patient's explicit consent server-side. Health data is
 * "special personal data" under Ghana's Data Protection Act, 2012, so the
 * clinic needs evidence consent was given - upload-target refuses to issue
 * an upload URL until this has run for the request.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const access = await getRequestByToken(token);
  if (!access || access.deniedReason) {
    return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 404 });
  }

  // Already recorded - keep the original timestamp rather than overwriting it.
  if (access.request.consented_at) return NextResponse.json({ ok: true });

  const consentedAt = new Date().toISOString();
  const { error } = await access.supabase
    .from("requests")
    .update({ consented_at: consentedAt, consent_version: CONSENT_VERSION })
    .eq("id", access.request.id)
    .is("consented_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent({
    requestId: access.request.id,
    actorType: "patient",
    eventType: "consent_given",
    metadata: { consentVersion: CONSENT_VERSION },
  });

  return NextResponse.json({ ok: true });
}
