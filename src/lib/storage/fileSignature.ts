import type { AllowedMimeType } from "@/lib/storage/fileValidation";

/** Magic-number signatures for each allowed type. JPEG's is a 3-byte prefix; the rest are exact. */
const SIGNATURES: Record<AllowedMimeType, number[]> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46], // %PDF
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
};

/** Longest signature across all allowed types - how many header bytes callers need to read. */
export const SIGNATURE_CHECK_BYTES = Math.max(...Object.values(SIGNATURES).map((s) => s.length));

/**
 * Checks a file's real bytes against its claimed mimeType. The client
 * reports mimeType itself when requesting an upload target - this is what
 * catches a mislabeled or renamed file rather than trusting that claim.
 */
export function matchesFileSignature(bytes: Uint8Array, mimeType: AllowedMimeType): boolean {
  const signature = SIGNATURES[mimeType];
  return signature.every((byte, i) => bytes[i] === byte);
}
