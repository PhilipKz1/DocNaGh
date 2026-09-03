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
 */
export function RealtimeRequestWatcher({ requestId }: { requestId: string }) {
  const router = useRouter();

  useEffect(() => {
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, router]);

  return null;
}
