import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Throws/redirects to /login if there's no session at all. */
async function requireUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

/** Current signed-in provider, or redirects to /login if not a provider. */
export async function requireProvider() {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data: provider } = await supabase
    .from("providers")
    .select("id, clinic_id, full_name, email, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!provider) redirect("/login");
  return { supabase, provider, user };
}

/** Current signed-in provider, and redirects to /dashboard if they aren't a clinic admin. */
export async function requireClinicAdmin() {
  const { supabase, provider, user } = await requireProvider();
  if (provider.role !== "admin") redirect("/dashboard");
  return { supabase, provider, user };
}

/** Current signed-in platform admin, or redirects if the user isn't one. */
export async function requirePlatformAdmin() {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) redirect("/dashboard");

  return { supabase, user };
}
