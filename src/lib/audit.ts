import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Appends to the audit trail. Always written with the service role:
 * audit_events has no insert policy, so providers can't add (or forge)
 * entries through their own session. clinicId is only needed for events
 * with no request - a DB trigger fills it from request_id otherwise.
 *
 * Never throws - a failed audit write shouldn't undo the action it records -
 * but failures are logged so they don't vanish silently.
 */
export async function logAuditEvent(event: {
  requestId?: string | null;
  clinicId?: string | null;
  actorType: "provider" | "patient" | "system";
  actorId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await createServiceRoleClient().from("audit_events").insert({
    request_id: event.requestId ?? null,
    clinic_id: event.clinicId ?? null,
    actor_type: event.actorType,
    actor_id: event.actorId ?? null,
    event_type: event.eventType,
    metadata: event.metadata ?? {},
  });
  if (error) {
    console.error(`[audit] failed to record ${event.eventType}`, error);
  }
}
