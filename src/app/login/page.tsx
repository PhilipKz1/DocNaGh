import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

/**
 * Redirects an already-authenticated provider straight to the dashboard
 * instead of rendering the sign-in form. Without this, pressing the
 * browser's Back button after logging in lands back on /login (Next.js
 * re-invokes the route on history navigation) - the empty-looking form is
 * also then filled in by the browser's own saved-credential autofill,
 * making it look like a broken/insecure logout.
 */
export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return <LoginForm />;
}
