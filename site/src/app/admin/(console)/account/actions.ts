"use server";

import { createClient } from "@supabase/supabase-js";
import { refresh } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/admin/action-result";
import { audit } from "@/lib/admin/audit";
import { authorize } from "@/lib/admin/session";
import { getDb } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/log";
import { consume, hashKey } from "@/lib/server/rate-limit";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { newPassword } from "@/lib/validation/admin";

export async function updateMyName(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return fail(auth.error);
  const name = z.string().trim().min(1, "Required").max(80).safeParse(formData.get("fullName"));
  if (!name.success) return fail(name.error.issues[0].message, { fullName: name.error.issues[0].message });
  await getDb().staffMember.update({ where: { id: auth.user.id }, data: { fullName: name.data } });
  await audit(auth.user, { action: "staff.self_renamed", entityType: "staff", entityId: auth.user.id, summary: `Changed own display name to ${name.data}` });
  refresh();
  return ok("Name updated.");
}

export async function changeMyPassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize();
  if (!auth.ok) return fail(auth.error);
  const limit = await consume([{ name: "pwchange-1h", limit: 6, windowSeconds: 3600 }], { "pwchange-1h": hashKey(`staff:${auth.user.id}`) });
  if (!limit.ok) return fail("Too many attempts. Please wait a while.");

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const parsed = newPassword.safeParse(next);
  if (!parsed.success) return fail("Choose a stronger password.", { password: parsed.error.issues[0].message });
  if (next !== confirm) return fail("The new passwords don't match.", { confirm: "The passwords don't match" });

  // Re-authenticate with the current password using a throwaway client that
  // never touches this browser's session cookies.
  const verifier = createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: wrong } = await verifier.auth.signInWithPassword({ email: auth.user.email, password: current });
  if (wrong) return fail("Your current password is incorrect.", { current: "Incorrect password" });
  await verifier.auth.signOut({ scope: "local" }).catch(() => undefined);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    logServerEvent("auth.change_password_failed", error);
    return fail("Your password couldn't be changed. Please try again.");
  }
  await audit(auth.user, { action: "auth.password_changed", entityType: "staff", entityId: auth.user.id, summary: "Changed own password" });
  return ok("Password changed.");
}
