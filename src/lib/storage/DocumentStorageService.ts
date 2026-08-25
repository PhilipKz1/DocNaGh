/**
 * Storage abstraction so the app can move off Supabase Storage (to Azure
 * Blob / S3 / R2) later without touching call sites. Implementations must
 * never accept a raw file body server-side for large uploads - hand the
 * client a signed URL and let it upload directly to the object store.
 */
export interface DocumentStorageService {
  /**
   * Mints a one-time signed upload target for a specific object path.
   * The caller (patient's browser) PUTs/POSTs the file directly to
   * `uploadUrl` - the file body never transits our server.
   */
  createUploadTarget(params: CreateUploadTargetParams): Promise<UploadTarget>;

  /** Mints a time-limited signed URL a provider's browser can fetch/download. */
  createDownloadUrl(storagePath: string, ttlSeconds?: number): Promise<string>;

  /** Permanently removes an object, e.g. on request expiry/retention cleanup. */
  deleteObject(storagePath: string): Promise<void>;

  /**
   * Reads just the first `numBytes` of an already-uploaded object - used to
   * verify a file's real content (magic-number signature) matches what the
   * client claimed at upload time, since the client's declared mimeType is
   * otherwise trusted with no server-side check on the actual bytes.
   */
  readHeaderBytes(storagePath: string, numBytes: number): Promise<Uint8Array>;
}

export interface CreateUploadTargetParams {
  clinicId: string;
  requestId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UploadTarget {
  /** Object key the file will live at once uploaded. Persist this in `documents.storage_path`. */
  storagePath: string;
  /** URL the browser uploads the file bytes to. */
  uploadUrl: string;
  /** Opaque token some providers (e.g. Supabase) require alongside the upload URL. */
  uploadToken?: string;
}
