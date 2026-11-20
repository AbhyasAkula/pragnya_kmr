import "server-only";
import { headers } from "next/headers";
import { siteUrl } from "@/config/site";

/**
 * Origin used in links we generate (invites, password resets). Prefers the
 * configured production URL so a spoofed Host header can't redirect links.
 */
export async function appOrigin() {
  if (siteUrl) return siteUrl.origin;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Only same-site admin paths are allowed as post-login destinations. */
export function safeAdminPath(next: unknown, fallback = "/admin") {
  return typeof next === "string" && /^\/admin(\/[\w\-/?=&%.]*)?$/.test(next) && !next.startsWith("//") ? next : fallback;
}

/** Builds a one-time link that lands on our confirm page (bypasses Supabase email templates). */
export async function authLink(hashedToken: string, type: "invite" | "recovery") {
  const params = new URLSearchParams({ token_hash: hashedToken, type });
  return `${await appOrigin()}/admin/auth/confirm?${params.toString()}`;
}
