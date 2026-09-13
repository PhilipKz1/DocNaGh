"use client";

import { useState } from "react";
import { getDownloadUrl } from "@/app/actions/documents";

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/heic", "image/heif"]);

export function DownloadButton({
  documentId,
  fileName,
  mimeType,
}: {
  documentId: string;
  fileName: string;
  mimeType: string;
}) {
  const [loadingAction, setLoadingAction] = useState<"preview" | "download" | null>(null);
  const isImage = IMAGE_MIME_TYPES.has(mimeType);

  async function open(forceDownload: boolean, action: "preview" | "download") {
    setLoadingAction(action);
    try {
      const url = await getDownloadUrl(documentId, forceDownload);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setLoadingAction(null);
    }
  }

  if (isImage) {
    return (
      <span className="flex items-center gap-3">
        <button
          onClick={() => open(false, "preview")}
          disabled={loadingAction !== null}
          className="text-sm text-teal-700 hover:underline disabled:opacity-50"
        >
          {loadingAction === "preview" ? "Preparing..." : "Preview"}
        </button>
        <button
          onClick={() => open(true, "download")}
          disabled={loadingAction !== null}
          className="text-sm text-slate-500 hover:underline disabled:opacity-50"
        >
          {loadingAction === "download" ? "Preparing..." : "Download"}
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => open(true, "download")}
      disabled={loadingAction !== null}
      className="text-sm text-teal-700 hover:underline disabled:opacity-50"
    >
      {loadingAction === "download" ? "Preparing..." : `Download ${fileName}`}
    </button>
  );
}
