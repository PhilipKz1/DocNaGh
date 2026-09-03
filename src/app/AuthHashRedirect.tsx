"use client";

import { useEffect } from "react";

/**
 * Safety net for Supabase invite/recovery links landing on the wrong page.
 * Supabase resolves the redirect target against its own Site URL /
 * Redirect URLs allow-list at send time, and any mismatch there (www vs.
 * bare domain, an unsaved allow-list entry, etc.) makes it silently fall
 * back to dumping the session token on the bare Site URL instead of the
 * /reset-password path the app actually asked for - which is exactly what
 * kept happening while getting that config right. Rather than depend on
 * that config being perfect forever, catch a stray auth token on any page
 * and forward it to where it's actually usable.
 */
export function AuthHashRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || window.location.pathname === "/reset-password") return;

    const params = new URLSearchParams(hash.slice(1));
    const type = params.get("type");
    if (params.get("access_token") && (type === "invite" || type === "recovery")) {
      window.location.replace(`/reset-password?next=/dashboard${hash}`);
    }
  }, []);

  return null;
}
