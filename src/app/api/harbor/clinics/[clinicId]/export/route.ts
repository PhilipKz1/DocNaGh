import { requirePlatformAdmin } from "@/lib/adminAuth";
import { buildDataExport } from "@/lib/dataExport";
import { logAuditEvent } from "@/lib/audit";

/**
 * Full export of one clinic's data (ZIP), so it can be handed back to the
 * clinic - the data controller - before the clinic is deleted.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params;
  const { user } = await requirePlatformAdmin();

  let stream: ReadableStream<Uint8Array>;
  try {
    stream = await buildDataExport({ clinicId });
  } catch (err) {
    console.error(`[clinicExport] failed for ${clinicId}`, err);
    return new Response("Export failed", { status: 500 });
  }

  await logAuditEvent({
    clinicId,
    actorType: "system",
    actorId: user.id,
    eventType: "clinic_data_exported",
  });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="clinic-export-${date}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
