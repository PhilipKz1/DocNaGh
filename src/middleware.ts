import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every provider-facing request and
 * gates access: /admin needs platform-admin membership, /dashboard and
 * /requests need any signed-in provider, /account just needs a session.
 * Patient upload routes (/r/*) are token-authenticated and bypass this
 * entirely - they're not in the matcher below.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
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

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isProviderRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/requests");
  const isAccountRoute = pathname.startsWith("/account");
  const needsAuth = isAdminRoute || isProviderRoute || isAccountRoute;

  if (needsAuth && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user) return response;

  if (isAdminRoute) {
    const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");
    if (!isPlatformAdmin) return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (needsAuth) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel) {
      const mfaUrl = new URL("/login/mfa", request.url);
      mfaUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(mfaUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/requests/:path*", "/admin/:path*", "/account/:path*"],
};
