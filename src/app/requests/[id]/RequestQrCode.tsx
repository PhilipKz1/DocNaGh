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
    <div className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:flex-row">
      <div className="rounded-md border border-slate-200 bg-white p-3">
        <QRCodeSVG value={link} size={176} bgColor="#ffffff" fgColor="#0f172a" level="M" />
      </div>
      <div className="w-full space-y-2 text-center sm:text-left">
        <p className="text-sm font-medium text-slate-700">
          Patient scans this QR code or opens the link below on their phone.
        </p>
        <code className="block break-all rounded-md bg-slate-50 p-2 text-xs text-slate-600">
          {link}
        </code>
        <button
          onClick={copyLink}
          title="Copy this link to send another way - text, WhatsApp, email"
          className="rounded text-sm font-medium text-teal-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
