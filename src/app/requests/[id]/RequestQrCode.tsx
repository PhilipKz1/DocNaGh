"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

export function RequestQrCode({ link, patientName }: { link: string; patientName: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // No phone number needed here - this opens WhatsApp's own contact
  // picker, so the provider just chooses who to send it to from their own
  // WhatsApp, exactly like any other share button. Free, no setup.
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `Hi ${patientName}, please use this secure link to send the documents we requested: ${link}`
  )}`;

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
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-start">
          <button
            onClick={copyLink}
            className="rounded text-sm font-medium text-teal-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
          >
            {copied ? "Copied ✓" : "Copy link"}
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="rounded text-sm font-medium text-teal-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
          >
            Share via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
