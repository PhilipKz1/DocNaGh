"use server";

import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/adminAuth";
import { createServiceRoleClient } from "@/lib/supabase/server";

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

  const supabase = createServiceRoleClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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

  redirect("/admin");
}
