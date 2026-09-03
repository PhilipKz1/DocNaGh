import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs on nearly every page request for two independent reasons:
 *
 * 1. CSP nonce: Next.js injects its own inline hydration <script> tags on
 *    every page, so a strict script-src needs a per-request nonce (static
 *    headers in next.config.mjs can't generate one) - see
 *    https://nextjs.org/docs/app/guides/content-security-policy. This part
 *    runs for every matched route, including public/patient-facing ones.
 *
 * 2. Auth gating: refreshes the Supabase session and blocks unauthenticated
 *    or under-privileged access to /harbor (platform admin), /dashboard and
 *    /requests (any signed-in provider), /account (any session). This part
 *    only touches Supabase for those route prefixes - patient upload routes
 *    (/r/*) are token-authenticated and never need a session.
 */
export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = [
    "default-src 'self'",
    // unsafe-eval: something in our own bundled JS (most likely inside the
    // Supabase SDK - a JWT/crypto helper or its cross-tab session lock
    // polyfill) calls Function()/eval() internally, which strict-dynamic
    // does NOT cover (it only governs which <script> tags are trusted, not
    // string-to-code evaluation). nonce + strict-dynamic remain the actual
    // defense against injected/external scripts; this only permits our own
    // already-trusted bundle to do what it already needs to do.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/harbor");
  const isProviderRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/requests");
  const isAccountRoute = pathname.startsWith("/account");
  const needsAuth = isAdminRoute || isProviderRoute || isAccountRoute;

  if (!needsAuth) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          response.headers.set("Content-Security-Policy", csp);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute) {
    const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");
    if (!isPlatformAdmin) return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel) {
    const mfaUrl = new URL("/login/mfa", request.url);
    mfaUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(mfaUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)",
  ],
};
