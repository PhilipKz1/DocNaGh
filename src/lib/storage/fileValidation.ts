export const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export function validateFile(file: { mimeType: string; sizeBytes: number }): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.mimeType as AllowedMimeType)) {
    return `Unsupported file type "${file.mimeType}". Allowed: PDF, JPG, PNG.`;
  }
  if (file.sizeBytes <= 0 || file.sizeBytes > MAX_FILE_SIZE_BYTES) {
    return `File exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB limit.`;
  }
  return null;
}
