import { describe, expect, it } from "vitest";
import { validateFile, MAX_FILE_SIZE_BYTES } from "./fileValidation";

describe("validateFile", () => {
  it("accepts an allowed type within the size limit", () => {
    expect(validateFile({ mimeType: "application/pdf", sizeBytes: 1024 })).toBeNull();
  });

  it("accepts HEIC/HEIF (iPhone camera photos)", () => {
    expect(validateFile({ mimeType: "image/heic", sizeBytes: 1024 })).toBeNull();
    expect(validateFile({ mimeType: "image/heif", sizeBytes: 1024 })).toBeNull();
  });

  it("rejects a disallowed mime type", () => {
    expect(validateFile({ mimeType: "application/x-msdownload", sizeBytes: 1024 })?.length).toBeGreaterThan(0);
  });

  it("rejects a file over the size cap", () => {
    expect(validateFile({ mimeType: "image/png", sizeBytes: MAX_FILE_SIZE_BYTES + 1 })).not.toBeNull();
  });

  it("accepts a file exactly at the size cap", () => {
    expect(validateFile({ mimeType: "image/png", sizeBytes: MAX_FILE_SIZE_BYTES })).toBeNull();
  });

  it("rejects a zero-byte file", () => {
    expect(validateFile({ mimeType: "image/jpeg", sizeBytes: 0 })).not.toBeNull();
  });

  it("rejects a negative size", () => {
    expect(validateFile({ mimeType: "image/jpeg", sizeBytes: -1 })).not.toBeNull();
  });
});
