import type { SupabaseClient } from "@supabase/supabase-js";

export async function logAuditEvent(
  client: SupabaseClient,
  event: {
    requestId?: string | null;
    actorType: "provider" | "patient" | "system";
    actorId?: string | null;
    eventType: string;
    metadata?: Record<string, unknown>;
  }
) {
  await client.from("audit_events").insert({
    request_id: event.requestId ?? null,
    actor_type: event.actorType,
    actor_id: event.actorId ?? null,
    event_type: event.eventType,
    metadata: event.metadata ?? {},
  });
}
