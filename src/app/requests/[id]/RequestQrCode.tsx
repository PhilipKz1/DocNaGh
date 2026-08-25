"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

export function RequestQrCode({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-4 rounded-md border p-4">
      <QRCodeSVG value={link} size={112} />
      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          Patient scans this QR code or opens the link below on their phone.
        </p>
        <code className="block text-xs break-all bg-gray-50 rounded p-2">{link}</code>
        <button onClick={copyLink} className="text-sm text-blue-600 hover:underline">
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
