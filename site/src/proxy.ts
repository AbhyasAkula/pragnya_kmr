import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authCookieOptions, isAuthConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

/**
 * Runs only for /admin and /api/admin. Refreshes the Supabase session
 * cookies (Server Components cannot write cookies) and sends signed-out
 * visitors to the login page early. This is an optimisation, NOT the
 * security boundary: every admin page, action and route re-checks the
 * session and permissions on the server (src/lib/admin/session.ts).
 */
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/auth/confirm"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isAuthConfigured()) return response;

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, { ...options, ...authCookieOptions });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  if (!signedIn && pathname.startsWith("/admin") && !PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    const redirect = NextResponse.redirect(login);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
