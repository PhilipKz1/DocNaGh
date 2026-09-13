export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

// 10 MB/file: comfortably fits a high-quality phone photo or scanned
// document while keeping storage costs predictable. Paired with
// MAX_REQUEST_TOTAL_BYTES below so one request can't accumulate an
// unbounded number of large files even if each stays under the per-file cap.
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_REQUEST_TOTAL_BYTES = 25 * 1024 * 1024; // 25 MB

export function validateFile(file: { mimeType: string; sizeBytes: number }): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.mimeType as AllowedMimeType)) {
    return `Unsupported file type "${file.mimeType}". Allowed: PDF, JPG, PNG, or HEIC.`;
  }
  if (file.sizeBytes <= 0 || file.sizeBytes > MAX_FILE_SIZE_BYTES) {
    return `File exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB limit.`;
  }
  return null;
}

const EXTENSIONS_BY_MIME_TYPE: Record<AllowedMimeType, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "image/heif": "heif",
};

/**
 * Server-trusted extension for a storage key, derived from the validated
 * mimeType - never from the client-supplied filename. Used so the storage
 * path can be a bare UUID with no trace of the original name, rather than
 * sanitizing and keeping a version of it.
 */
export function extensionForMimeType(mimeType: AllowedMimeType): string {
  return EXTENSIONS_BY_MIME_TYPE[mimeType];
}
