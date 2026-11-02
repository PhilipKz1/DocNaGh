import { requireClinicAdmin } from "@/lib/adminAuth";
import { buildDataExport } from "@/lib/dataExport";
import { logAuditEvent } from "@/lib/audit";

/**
 * Everything the clinic holds for one patient (ZIP) - for answering a
 * patient's access request under Ghana's Data Protection Act, 2012.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const { supabase, provider } = await requireClinicAdmin();

  // RLS-scoped lookup: only resolves if the patient belongs to this clinic.
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .maybeSingle();
  if (!patient) return new Response("Not found", { status: 404 });

  let stream: ReadableStream<Uint8Array>;
  try {
    stream = await buildDataExport({ clinicId: provider.clinic_id, patientId });
  } catch (err) {
    console.error(`[patientExport] failed for ${patientId}`, err);
    return new Response("Export failed", { status: 500 });
  }

  await logAuditEvent({
    clinicId: provider.clinic_id,
    actorType: "provider",
    actorId: provider.id,
    eventType: "patient_data_exported",
    metadata: { patientId },
  });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="patient-export-${date}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
