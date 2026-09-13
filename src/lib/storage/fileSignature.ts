import type { AllowedMimeType } from "@/lib/storage/fileValidation";

/** Magic-number signatures for the types with a fixed byte prefix. JPEG's is a 3-byte prefix; the rest are exact. */
const SIGNATURES: Record<Exclude<AllowedMimeType, "image/heic" | "image/heif">, number[]> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46], // %PDF
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
};

/**
 * HEIC/HEIF files are ISOBMFF containers: a 4-byte box-size field (which
 * varies per file, so it can't be a fixed prefix), then "ftyp" at bytes
 * 4-7, then a 4-byte "major brand" at bytes 8-11 identifying the format.
 */
const HEIC_BRANDS = ["heic", "heix", "heim", "heis", "hevc", "hevm", "hevs", "mif1", "msf1"];

function isHeicOrHeif(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
  if (ftyp !== "ftyp") return false;
  const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  return HEIC_BRANDS.includes(brand);
}

/** Longest header check needed across all allowed types (HEIC's brand sits at bytes 8-11). */
export const SIGNATURE_CHECK_BYTES = Math.max(
  12,
  ...Object.values(SIGNATURES).map((s) => s.length)
);

/**
 * Checks a file's real bytes against its claimed mimeType. The client
 * reports mimeType itself when requesting an upload target - this is what
 * catches a mislabeled or renamed file rather than trusting that claim.
 */
export function matchesFileSignature(bytes: Uint8Array, mimeType: AllowedMimeType): boolean {
  if (mimeType === "image/heic" || mimeType === "image/heif") return isHeicOrHeif(bytes);
  const signature = SIGNATURES[mimeType];
  return signature.every((byte, i) => bytes[i] === byte);
}
