"use client";

import { useState } from "react";
import { getDownloadUrl } from "@/app/actions/documents";

export function DownloadButton({ documentId, fileName }: { documentId: string; fileName: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const url = await getDownloadUrl(documentId);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="text-sm text-teal-700 hover:underline disabled:opacity-50"
    >
      {loading ? "Preparing..." : `Download ${fileName}`}
    </button>
  );
}
