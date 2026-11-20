import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authCookieOptions, supabasePublishableKey, supabaseUrl } from "./config";

/**
 * Supabase client bound to the current request's auth cookies. Used only on
 * the server (Server Components, Server Actions, Route Handlers).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, { ...options, ...authCookieOptions });
          }
        } catch {
          // Called from a Server Component, where cookies are read-only. The
          // proxy (src/proxy.ts) refreshes the session cookies instead.
        }
      },
    },
  });
}
