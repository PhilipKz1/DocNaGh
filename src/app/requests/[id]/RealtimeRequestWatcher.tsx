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
    try {
      const supabase = createClient();
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
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn(`[RealtimeRequestWatcher] ${status}`, err);
          }
        });

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.warn("[RealtimeRequestWatcher] cleanup failed", err);
        }
      };
    } catch (err) {
      console.warn("[RealtimeRequestWatcher] setup failed - live updates disabled", err);
    }
  }, [requestId, router]);

  return null;
}
