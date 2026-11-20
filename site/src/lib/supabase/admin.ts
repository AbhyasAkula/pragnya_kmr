import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

/**
 * Privileged Supabase client (secret / service_role key). Server-only: used
 * for invitations, account disabling, password-reset links and Storage
 * uploads. Never import this from client code.
 */
export class SupabaseAdminNotConfiguredError extends Error {
  name = "SupabaseAdminNotConfiguredError";
}

const globalForAdmin = globalThis as typeof globalThis & { __aureliaSupabaseAdmin?: SupabaseClient };

export function getSupabaseAdmin(): SupabaseClient {
  const key = (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!supabaseUrl || !key) {
    throw new SupabaseAdminNotConfiguredError("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set");
  }
  globalForAdmin.__aureliaSupabaseAdmin ??= createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  return globalForAdmin.__aureliaSupabaseAdmin;
}
