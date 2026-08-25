import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateUploadTargetParams,
  DocumentStorageService,
  UploadTarget,
} from "@/lib/storage/DocumentStorageService";
import { validateFile } from "@/lib/storage/fileValidation";

const BUCKET = process.env.SUPABASE_DOCUMENTS_BUCKET ?? "patient-documents";
const DEFAULT_DOWNLOAD_TTL_SECONDS = Number(process.env.SIGNED_URL_TTL_SECONDS ?? 300);

/**
 * Supabase Storage-backed implementation. Requires a service-role client
 * (signed upload/download URLs are minted server-side; the object body
 * never passes through our server for uploads).
 *
 * Note: for files well under the 100 MB cap a single signed upload URL is
 * sufficient. If larger files are supported later, switch to Supabase's
 * resumable (TUS) upload endpoint instead of adding a second service.
 */
export class SupabaseDocumentStorageService implements DocumentStorageService {
  constructor(private readonly client: SupabaseClient) {}

  async createUploadTarget(params: CreateUploadTargetParams): Promise<UploadTarget> {
    const validationError = validateFile(params);
    if (validationError) throw new Error(validationError);

    const safeName = params.fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const storagePath = `${params.clinicId}/${params.requestId}/${randomUUID()}-${safeName}`;

    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath);

    if (error) throw error;

    return {
      storagePath,
      uploadUrl: data.signedUrl,
      uploadToken: data.token,
    };
  }

  async createDownloadUrl(
    storagePath: string,
    ttlSeconds: number = DEFAULT_DOWNLOAD_TTL_SECONDS
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, ttlSeconds);

    if (error) throw error;
    return data.signedUrl;
  }

  async deleteObject(storagePath: string): Promise<void> {
    const { error } = await this.client.storage.from(BUCKET).remove([storagePath]);
    if (error) throw error;
  }

  async readHeaderBytes(storagePath: string, numBytes: number): Promise<Uint8Array> {
    // The JS SDK's storage.download() has no partial-range option, and
    // fetching a whole (possibly ~100MB) object just to check its first few
    // bytes would be wasteful - go straight to the REST endpoint with a
    // Range header instead.
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const res = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Range: `bytes=0-${numBytes - 1}`,
      },
    });
    if (!res.ok && res.status !== 206) {
      throw new Error(`Failed to read object header (${res.status})`);
    }
    return new Uint8Array(await res.arrayBuffer());
  }
}
