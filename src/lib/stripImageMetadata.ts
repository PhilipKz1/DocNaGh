/**
 * Types this can actually strip metadata from: canvas decode/re-encode is
 * universally supported for these. HEIC isn't included - most non-Apple
 * browsers can't decode it into a canvas at all, so attempting this would
 * either throw or silently produce a blank image. PDFs aren't image data
 * and need a different tool entirely (e.g. pdf-lib) to touch metadata.
 */
const STRIPPABLE_TYPES = new Set(["image/jpeg", "image/png"]);

export function canStripMetadata(mimeType: string): boolean {
  return STRIPPABLE_TYPES.has(mimeType);
}

/**
 * Strips EXIF/GPS/device metadata from a JPEG or PNG by redrawing it onto a
 * canvas and re-exporting - canvas pixel data carries no metadata, so this
 * drops it as a side effect without needing a dedicated EXIF-parsing
 * library. `imageOrientation: "from-image"` makes the browser apply the
 * original EXIF rotation before drawing, so a portrait phone photo doesn't
 * come out sideways just because its orientation tag is gone afterward.
 *
 * Fails open: if decoding ever throws (corrupt/unusual file), returns the
 * original file rather than blocking the upload over a best-effort privacy
 * enhancement - the magic-number/size checks that actually gate what's
 * accepted still run on whatever this returns.
 */
export async function stripImageMetadata(file: File): Promise<File> {
  if (!canStripMetadata(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const blob = await canvas.convertToBlob({ type: file.type, quality: 0.92 });
    return new File([blob], file.name, { type: file.type, lastModified: file.lastModified });
  } catch (err) {
    console.error("[stripImageMetadata] falling back to original file", err);
    return file;
  }
}
