"use server";

import { revalidatePath } from "next/cache";
import { requireClinicAdmin } from "@/lib/adminAuth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

export async function inviteProvider(_prevState: { error: string | null }, formData: FormData) {
  const { supabase, provider: admin } = await requireClinicAdmin();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "staff");

  if (!fullName) return { error: "Name is required" };
  if (!email) return { error: "Email is required" };
  if (role !== "admin" && role !== "staff") return { error: "Invalid role" };

  const serviceClient = createServiceRoleClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data: invited, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${appUrl}/reset-password?next=/dashboard` }
  );
  if (inviteError) return { error: inviteError.message };

  const { error: providerError } = await serviceClient.from("providers").insert({
    clinic_id: admin.clinic_id,
    user_id: invited.user.id,
    full_name: fullName,
    email,
    role,
  });
  if (providerError) return { error: providerError.message };

  await logAuditEvent(supabase, {
    actorType: "provider",
    actorId: admin.id,
    eventType: "teammate_invited",
    metadata: { email, role },
  });

  revalidatePath("/dashboard/team");
  return { error: null };
}

export async function removeProvider(providerId: string) {
  const { supabase, provider: admin } = await requireClinicAdmin();

  if (providerId === admin.id) {
    return { error: "You can't remove your own account." };
  }

  const { error } = await supabase
    .from("providers")
    .delete()
    .eq("id", providerId)
    .eq("clinic_id", admin.clinic_id);

  if (error) return { error: error.message };

  await logAuditEvent(supabase, {
    actorType: "provider",
    actorId: admin.id,
    eventType: "teammate_removed",
    metadata: { removedProviderId: providerId },
  });

  revalidatePath("/dashboard/team");
  return { error: null };
}
