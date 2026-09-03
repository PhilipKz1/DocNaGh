import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthHashRedirect } from "./AuthHashRedirect";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Healthcare Document Exchange",
  description: "Provider-initiated healthcare document requests",
};

/**
 * Forces every page to render per-request instead of being statically
 * cached at build time. Required for the CSP nonce in src/middleware.ts to
 * actually reach Next's inline hydration scripts - a statically prerendered
 * page's HTML is fixed at build time and can't carry a fresh per-request
 * nonce, which would leave those scripts nonce-less and silently blocked by
 * the browser under a strict script-src.
 */
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthHashRedirect />
        {children}
      </body>
    </html>
  );
}
