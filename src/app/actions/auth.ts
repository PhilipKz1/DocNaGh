"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prevState: { error: string | null }, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return { error: signInError.message };

  const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");

  let target = "/harbor";
  if (!isPlatformAdmin) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (!provider) {
      await supabase.auth.signOut();
      return { error: "This account isn't set up yet. Contact your administrator." };
    }
    target = "/dashboard";
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel) {
    redirect(`/login/mfa?next=${encodeURIComponent(target)}`);
  }

  redirect(target);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Runs server-side (unlike the browser client) so a failed send - bad SMTP
 * credentials, Supabase/Resend outage, etc. - shows up in Vercel's runtime
 * logs instead of only a visitor's browser console. Always reports success
 * to the caller regardless of outcome, so this can't be used to test which
 * emails have an account.
 */
export async function requestPasswordReset(email: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/reset-password?next=/dashboard`,
  });
  if (error) {
    console.error(`[requestPasswordReset] failed for ${email}: ${error.message}`);
  }
  return { ok: true };
}
