/**
 * Supabase project settings (Auth + Storage). URL and publishable key are
 * public by design; the secret key is server-only and never sent to browsers.
 * Accepts both the current key names and the legacy anon/service_role names.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "") ?? "";

export const supabasePublishableKey = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ""
).trim();

export function isAuthConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

/** Auth cookies: httpOnly (no browser Supabase client is used), Secure in production. */
export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
