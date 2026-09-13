import { describe, expect, it } from "vitest";
import { canStripMetadata } from "./stripImageMetadata";

describe("canStripMetadata", () => {
  it("strips JPEG and PNG, where canvas decode/re-encode is universally supported", () => {
    expect(canStripMetadata("image/jpeg")).toBe(true);
    expect(canStripMetadata("image/png")).toBe(true);
  });

  it("does not attempt HEIC - most non-Apple browsers can't decode it into a canvas", () => {
    expect(canStripMetadata("image/heic")).toBe(false);
    expect(canStripMetadata("image/heif")).toBe(false);
  });

  it("does not attempt PDF - not image data, canvas can't touch its metadata", () => {
    expect(canStripMetadata("application/pdf")).toBe(false);
  });
});
