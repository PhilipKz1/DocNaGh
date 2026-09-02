"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/adminAuth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getDocumentStorageService } from "@/lib/storage";
import { getAppUrl } from "@/lib/appUrl";

/**
 * Onboards a clinic and its first admin. We never set or see the admin's
 * password: Supabase emails them an invite link that lets them choose one
 * themselves the first time they sign in.
 */
export async function createClinic(_prevState: { error: string | null }, formData: FormData) {
  await requirePlatformAdmin();

  const clinicName = String(formData.get("clinicName") ?? "").trim();
  const adminName = String(formData.get("adminName") ?? "").trim();
  const adminEmail = String(formData.get("adminEmail") ?? "").trim().toLowerCase();

  if (!clinicName) return { error: "Clinic name is required" };
  if (!adminName) return { error: "Admin name is required" };
  if (!adminEmail) return { error: "Admin email is required" };

  let appUrl: string;
  try {
    appUrl = getAppUrl();
  } catch (err) {
    console.error(err);
    return { error: "Server misconfiguration: the app's URL isn't set correctly. Contact support before inviting anyone." };
  }

  const supabase = createServiceRoleClient();

  const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    adminEmail,
    { redirectTo: `${appUrl}/reset-password?next=/dashboard` }
  );
  if (inviteError) {
    console.error(`[createClinic] invite failed for ${adminEmail}: ${inviteError.message}`);
    return { error: inviteError.message };
  }

  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .insert({ name: clinicName })
    .select("id")
    .single();
  if (clinicError) return { error: clinicError.message };

  const { error: providerError } = await supabase.from("providers").insert({
    clinic_id: clinic.id,
    user_id: invited.user.id,
    full_name: adminName,
    email: adminEmail,
    role: "admin",
  });
  if (providerError) return { error: providerError.message };

  await supabase.from("audit_events").insert({
    actor_type: "system",
    event_type: "clinic_created",
    metadata: { clinicName, adminEmail },
  });

  redirect("/harbor");
}

/**
 * Deletes a clinic and everything under it: uploaded files, documents,
 * requests, patients, staff accounts, and their Supabase Auth logins.
 * Deletion order matters here - requests.provider_id is ON DELETE RESTRICT,
 * so requests must be gone before providers (and the clinic row itself,
 * which cascades to providers) can be deleted, or Postgres rejects it.
 * Storage objects have no DB-level cascade at all, so they're removed
 * explicitly before their rows disappear.
 */
export async function deleteClinic(clinicId: string) {
  await requirePlatformAdmin();

  const supabase = createServiceRoleClient();
  const storage = getDocumentStorageService();

  const { data: clinic } = await supabase
    .from("clinics")
    .select("name")
    .eq("id", clinicId)
    .maybeSingle();
  if (!clinic) return { error: "Clinic not found" };

  const { data: requestRows } = await supabase
    .from("requests")
    .select("id")
    .eq("clinic_id", clinicId);
  const requestIds = (requestRows ?? []).map((r) => r.id);

  let storagePaths: string[] = [];
  if (requestIds.length > 0) {
    const { data: reqDocRows } = await supabase
      .from("request_documents")
      .select("id")
      .in("request_id", requestIds);
    const reqDocIds = (reqDocRows ?? []).map((rd) => rd.id);

    if (reqDocIds.length > 0) {
      const { data: docRows } = await supabase
        .from("documents")
        .select("storage_path")
        .in("request_document_id", reqDocIds);
      storagePaths = (docRows ?? []).map((d) => d.storage_path);
    }
  }

  for (const path of storagePaths) {
    try {
      await storage.deleteObject(path);
    } catch (err) {
      // Object may already be gone - don't let that block the rest.
      console.error(`[deleteClinic] failed to delete storage object ${path}`, err);
    }
  }

  // Cascades request_documents and documents rows in the DB.
  const { error: requestsError } = await supabase
    .from("requests")
    .delete()
    .eq("clinic_id", clinicId);
  if (requestsError) return { error: requestsError.message };

  const { data: providerRows } = await supabase
    .from("providers")
    .select("user_id")
    .eq("clinic_id", clinicId);

  const { error: providersError } = await supabase
    .from("providers")
    .delete()
    .eq("clinic_id", clinicId);
  if (providersError) return { error: providersError.message };

  for (const provider of providerRows ?? []) {
    const { error: userError } = await supabase.auth.admin.deleteUser(provider.user_id);
    if (userError) {
      console.error(`[deleteClinic] failed to delete auth user ${provider.user_id}`, userError);
    }
  }

  // Cascades any remaining patients rows.
  const { error: clinicError } = await supabase.from("clinics").delete().eq("id", clinicId);
  if (clinicError) return { error: clinicError.message };

  await supabase.from("audit_events").insert({
    actor_type: "system",
    event_type: "clinic_deleted",
    metadata: { clinicId, clinicName: clinic.name },
  });

  revalidatePath("/harbor");
  return { error: null };
}

/**
 * Re-sends the invite email to a clinic's admin(s) - e.g. the original
 * link was sent before NEXT_PUBLIC_APP_URL was configured correctly, or
 * simply expired. Supabase itself rejects this harmlessly (an
 * "already registered" error) if the invite was already accepted.
 */
export async function resendClinicInvite(clinicId: string) {
  await requirePlatformAdmin();

  let appUrl: string;
  try {
    appUrl = getAppUrl();
  } catch (err) {
    console.error(err);
    return { error: "Server misconfiguration: the app's URL isn't set correctly. Contact support." };
  }

  const supabase = createServiceRoleClient();

  const { data: admins } = await supabase
    .from("providers")
    .select("email")
    .eq("clinic_id", clinicId)
    .eq("role", "admin");

  if (!admins || admins.length === 0) return { error: "No admin found for this clinic" };

  const failed: string[] = [];
  for (const admin of admins) {
    const { error } = await supabase.auth.admin.inviteUserByEmail(admin.email, {
      redirectTo: `${appUrl}/reset-password?next=/dashboard`,
    });
    if (error) {
      console.error(`[resendClinicInvite] failed for ${admin.email}: ${error.message}`);
      failed.push(admin.email);
    }
  }

  if (failed.length > 0) return { error: `Failed to resend for: ${failed.join(", ")}` };
  return { error: null };
}
