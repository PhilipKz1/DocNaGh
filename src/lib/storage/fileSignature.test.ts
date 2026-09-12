import { describe, expect, it } from "vitest";
import { matchesFileSignature, SIGNATURE_CHECK_BYTES } from "./fileSignature";

describe("matchesFileSignature", () => {
  it("accepts a real PDF header", () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
    expect(matchesFileSignature(bytes, "application/pdf")).toBe(true);
  });

  it("accepts a real PNG header", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(matchesFileSignature(bytes, "image/png")).toBe(true);
  });

  it("accepts a real JPEG header", () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
    expect(matchesFileSignature(bytes, "image/jpeg")).toBe(true);
  });

  it("rejects a PNG renamed to claim it's a PDF (the mislabeled-file attack this exists to catch)", () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(matchesFileSignature(pngBytes, "application/pdf")).toBe(false);
  });

  it("rejects an empty/truncated buffer instead of throwing", () => {
    expect(matchesFileSignature(new Uint8Array([]), "application/pdf")).toBe(false);
  });

  it("exposes enough header bytes to check the longest signature (PNG's 8 bytes)", () => {
    expect(SIGNATURE_CHECK_BYTES).toBeGreaterThanOrEqual(8);
  });
});
