"use server";

import { revalidatePath } from "next/cache";
import { requireClinicAdmin } from "@/lib/adminAuth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { deleteRequestsWithFiles } from "@/lib/dataExport";
import { logAuditEvent } from "@/lib/audit";

/**
 * Permanently erases one patient: their record, every request linked to
 * them, and every uploaded file - for a patient's erasure request under
 * Ghana's Data Protection Act, 2012. Requests created without a linked
 * patient record (display name only) aren't reachable from here and must
 * be cleaned up per request.
 */
export async function erasePatientData(patientId: string) {
  const { supabase, provider } = await requireClinicAdmin();

  // RLS-scoped lookup: only resolves if the patient belongs to this clinic.
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .maybeSingle();
  if (!patient) return { error: "Patient not found" };

  const serviceClient = createServiceRoleClient();
  const { data: requestRows, error: requestsError } = await serviceClient
    .from("requests")
    .select("id")
    .eq("clinic_id", provider.clinic_id)
    .eq("patient_id", patientId);
  if (requestsError) return { error: requestsError.message };

  let filesDeleted = 0;
  try {
    ({ filesDeleted } = await deleteRequestsWithFiles(
      serviceClient,
      (requestRows ?? []).map((r) => r.id)
    ));
  } catch (err) {
    console.error(`[erasePatientData] failed for ${patientId}`, err);
    return { error: "Failed to delete this patient's requests and files" };
  }

  const { error: patientError } = await serviceClient
    .from("patients")
    .delete()
    .eq("id", patientId)
    .eq("clinic_id", provider.clinic_id);
  if (patientError) return { error: patientError.message };

  await logAuditEvent({
    clinicId: provider.clinic_id,
    actorType: "provider",
    actorId: provider.id,
    eventType: "patient_data_erased",
    metadata: { patientId, requestsDeleted: requestRows?.length ?? 0, filesDeleted },
  });

  revalidatePath("/dashboard");
  return { error: null };
}
