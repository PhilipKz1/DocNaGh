"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Live-refreshes this page when something happens on the request - a
 * document upload, removal, or any other logged event - so a provider
 * watching it sees what a patient just sent without hitting refresh.
 * audit_events is used as the change signal rather than documents/
 * request_documents directly since every upload already writes one, and
 * it (unlike documents) carries request_id directly for filtering.
 *
 * This is a nicety, not core functionality - a failure here (blocked
 * WebSocket, network issue, realtime not enabled for the table) must
 * never crash the page. It already has once: a CSP that permitted
 * https://*.supabase.co but not wss://*.supabase.co refused the
 * connection, and the resulting error was uncaught, taking down the
 * whole page with it. Wrapped defensively so any future failure mode
 * just logs instead.
 */
export function RealtimeRequestWatcher({ requestId }: { requestId: string }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const supabase = createClient();
        // Realtime evaluates RLS against the token sent when joining the
        // channel. The publishable key isn't a JWT, so without the user's
        // own access token the join is anonymous and RLS silently filters
        // out every event - the page simply never updates.
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session) await supabase.realtime.setAuth(session.access_token);

        const channel = supabase
          .channel(`request-${requestId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "audit_events",
              filter: `request_id=eq.${requestId}`,
            },
            () => router.refresh()
          )
          .subscribe((status, err) => {
            // Anything that happened between this page rendering and the
            // subscription going live would otherwise be missed until the
            // next event - catch up once now that we're listening.
            if (status === "SUBSCRIBED") router.refresh();
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              console.warn(`[RealtimeRequestWatcher] ${status}`, err);
            }
          });

        cleanup = () => {
          try {
            supabase.removeChannel(channel);
          } catch (err) {
            console.warn("[RealtimeRequestWatcher] cleanup failed", err);
          }
        };
        if (cancelled) cleanup();
      } catch (err) {
        console.warn("[RealtimeRequestWatcher] setup failed - live updates disabled", err);
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [requestId, router]);

  return null;
}
