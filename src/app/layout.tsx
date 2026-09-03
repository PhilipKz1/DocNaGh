import type { Metadata } from "next";
import { headers } from "next/headers";
import localFont from "next/font/local";
import "./globals.css";

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

/**
 * Supabase resolves an invite/recovery redirect against its own Site URL /
 * Redirect URLs config at send time, and any mismatch there can dump the
 * session token on the wrong page instead of /reset-password. This catches
 * that and forwards it - as an inline script in <head> rather than a React
 * effect, so it runs before the page paints anything instead of after a
 * full hydration cycle (which would flash the wrong page first).
 */
const authHashRedirectScript = `(function(){
  var h = window.location.hash;
  if (!h || window.location.pathname === "/reset-password") return;
  var p = new URLSearchParams(h.slice(1));
  var t = p.get("type");
  if (p.get("access_token") && (t === "invite" || t === "recovery")) {
    window.location.replace("/reset-password?next=/dashboard" + h);
  }
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en">
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: authHashRedirectScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
