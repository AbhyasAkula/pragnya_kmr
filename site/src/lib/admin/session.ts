import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { getDb } from "@/lib/server/db";
import { isAuthConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { can, type Permission, type Role } from "./permissions";

/**
 * Data Access Layer for admin authentication. Every protected page, Server
 * Action and Route Handler goes through these functions:
 *  1. the Supabase session JWT is verified (getClaims), then
 *  2. the staff record is loaded from Postgres on EVERY request, so role,
 *     permission and disable changes take effect immediately.
 */

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  permissions: Permission[];
  status: "INVITED" | "ACTIVE" | "DISABLED";
};

/** Verified auth user id from the session cookie, or null. */
export const getSessionUserId = cache(async (): Promise<string | null> => {
  // Always wait for the real request first: admin pages must render per
  // request and never be prerendered or runtime-prefetched (even when auth
  // isn't configured at build time). connection() stops prerendering here.
  await connection();
  await cookies();
  if (!isAuthConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
});

/** The signed-in staff member (any status), or null. */
export const getStaffForSession = cache(async (): Promise<AdminUser | null> => {
  const id = await getSessionUserId();
  if (!id) return null;
  const staff = await getDb().staffMember.findUnique({
    where: { id },
    select: { id: true, email: true, fullName: true, role: true, permissions: true, status: true },
  });
  return staff ?? null;
});

/** The signed-in, ACTIVE staff member, or null. */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const staff = await getStaffForSession();
  return staff?.status === "ACTIVE" ? staff : null;
});

/** For pages: redirects to the login page when not signed in as active staff. */
export async function requireAdminPage(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) {
    const staff = await getStaffForSession();
    if (staff?.status === "INVITED") redirect("/admin/set-password");
    redirect(staff?.status === "DISABLED" ? "/admin/login?error=disabled" : "/admin/login");
  }
  return user;
}

/**
 * For Server Actions and Route Handlers. Returns the user only when signed
 * in AND holding the permission; never trusts anything sent by the browser.
 */
export async function authorize(
  permission?: Permission | "OWNER",
): Promise<{ ok: true; user: AdminUser } | { ok: false; error: string; status: 401 | 403 }> {
  const user = await getAdminUser();
  if (!user) return { ok: false, status: 401, error: "Your session has ended. Please sign in again." };
  if (permission && !can(user, permission)) {
    return { ok: false, status: 403, error: "You don't have permission to do this. Ask the owner for access." };
  }
  return { ok: true, user };
}
