import { NextResponse } from "next/server";
import { getRequestByToken } from "@/lib/requestAccess";
import { getDocumentStorageService } from "@/lib/storage";
import { validateFile } from "@/lib/storage/fileValidation";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const access = await getRequestByToken(token);
  if (!access || access.deniedReason) {
    return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 404 });
  }

  const body = await request.json();
  const { requestDocumentId, fileName, mimeType, sizeBytes } = body as {
    requestDocumentId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  };

  const validationError = validateFile({ mimeType, sizeBytes });
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data: requestDocument } = await access.supabase
    .from("request_documents")
    .select("id")
    .eq("id", requestDocumentId)
    .eq("request_id", access.request.id)
    .maybeSingle();

  if (!requestDocument) {
    return NextResponse.json({ error: "Unknown document for this request." }, { status: 400 });
  }

  const storage = getDocumentStorageService();
  const target = await storage.createUploadTarget({
    clinicId: access.request.clinic_id,
    requestId: access.request.id,
    fileName,
    mimeType,
    sizeBytes,
  });

  return NextResponse.json(target);
}
