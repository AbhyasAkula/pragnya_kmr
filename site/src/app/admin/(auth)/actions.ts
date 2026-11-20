"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { fail, ok, type ActionResult } from "@/lib/admin/action-result";
import { audit } from "@/lib/admin/audit";
import { appOrigin, safeAdminPath } from "@/lib/admin/origin";
import { getStaffForSession } from "@/lib/admin/session";
import { getDb } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/log";
import { consume, hashKey } from "@/lib/server/rate-limit";
import { isAuthConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { email as emailSchema, newPassword } from "@/lib/validation/admin";

async function ipKey() {
  const h = await headers();
  return hashKey(`ip:${h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"}`);
}

const NOT_CONFIGURED = "Sign-in isn't set up yet. The site owner must add the Supabase keys (see the setup guide).";

/* --------------------------------- sign in -------------------------------- */

export async function signIn(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!isAuthConfigured()) return fail(NOT_CONFIGURED);
  const parsedEmail = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!parsedEmail.success || !password || password.length > 200) return fail("Enter your email and password.");
  const email = parsedEmail.data;

  try {
    const ip = await ipKey();
    const limit = await consume(
      [
        { name: "login-ip-15m", limit: 20, windowSeconds: 900 },
        { name: "login-email-15m", limit: 8, windowSeconds: 900 },
      ],
      { "login-ip-15m": ip, "login-email-15m": hashKey(`email:${email}`) },
    );
    if (!limit.ok) {
      await audit(null, { action: "auth.sign_in_throttled", entityType: "auth", summary: "Sign-in attempts throttled" });
      return fail(`Too many sign-in attempts. Please wait ${Math.ceil(limit.retryAfterSeconds / 60)} minutes and try again.`);
    }
  } catch (e) {
    logServerEvent("auth.rate_limit_failed", e);
    return fail("Sign-in is temporarily unavailable. Please try again shortly.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    await audit(null, { action: "auth.sign_in_failed", entityType: "auth", summary: "Failed sign-in attempt", metadata: { emailHash: hashKey(`email:${email}`) } });
    return fail("That email and password don't match an account.");
  }

  const staff = await getDb().staffMember.findUnique({ where: { id: data.user.id } });
  if (!staff || staff.status !== "ACTIVE") {
    await supabase.auth.signOut();
    await audit(null, {
      action: "auth.sign_in_denied",
      entityType: "staff",
      entityId: data.user.id,
      summary: staff?.status === "DISABLED" ? "Sign-in refused: account disabled" : "Sign-in refused: not an active staff account",
    });
    return fail(
      staff?.status === "DISABLED"
        ? "This account has been disabled. Contact the owner if you need access."
        : staff?.status === "INVITED"
          ? "Finish setting up your account using the invitation link first."
          : "This account doesn't have dashboard access.",
    );
  }

  await getDb().staffMember.update({ where: { id: staff.id }, data: { lastSignInAt: new Date() } });
  await audit(staff, { action: "auth.sign_in", entityType: "staff", entityId: staff.id, summary: "Signed in" });
  redirect(safeAdminPath(formData.get("next")));
}

/* ----------------------------- password reset ----------------------------- */

export async function requestPasswordReset(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!isAuthConfigured()) return fail(NOT_CONFIGURED);
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return fail("Enter a valid email address.", { email: "Enter a valid email address." });
  const email = parsed.data;
  const generic = ok("If that email belongs to an active staff account, a reset link is on its way. Check your inbox (and spam).");

  try {
    const limit = await consume(
      [
        { name: "reset-ip-1h", limit: 6, windowSeconds: 3600 },
        { name: "reset-email-1h", limit: 3, windowSeconds: 3600 },
      ],
      { "reset-ip-1h": await ipKey(), "reset-email-1h": hashKey(`email:${email}`) },
    );
    if (!limit.ok) return generic; // same answer: never reveal anything

    const staff = await getDb().staffMember.findUnique({ where: { email } });
    if (staff?.status === "ACTIVE") {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${await appOrigin()}/admin/auth/confirm` });
      if (error) logServerEvent("auth.reset_email_failed", error);
      await audit(null, { action: "auth.password_reset_requested", entityType: "staff", entityId: staff.id, summary: "Password reset email requested" });
    }
  } catch (e) {
    logServerEvent("auth.reset_failed", e);
  }
  return generic;
}

/* ------------------------- invitation / reset links ------------------------ */

/**
 * Exchanges a one-time link for a session. Runs on an explicit button press
 * (POST), not on page load, so email link scanners can't consume the token.
 */
export async function confirmAuthLink(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!isAuthConfigured()) return fail(NOT_CONFIGURED);
  try {
    const limit = await consume([{ name: "confirm-ip-15m", limit: 20, windowSeconds: 900 }], { "confirm-ip-15m": await ipKey() });
    if (!limit.ok) return fail("Too many attempts. Please wait a few minutes.");
  } catch {
    return fail("This is temporarily unavailable. Please try again shortly.");
  }

  const supabase = await createSupabaseServerClient();
  const tokenHash = String(formData.get("token_hash") ?? "");
  const type = String(formData.get("type") ?? "");
  const code = String(formData.get("code") ?? "");

  let error: unknown = null;
  if (tokenHash && (type === "invite" || type === "recovery")) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash.slice(0, 200), type }));
  } else if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code.slice(0, 200)));
  } else {
    return fail("This link is incomplete. Ask the owner for a new one.");
  }
  if (error) {
    return fail("This link has expired or was already used. Ask the owner for a new link, or request a password reset.");
  }

  const staff = await getStaffForSession();
  if (!staff || staff.status === "DISABLED") {
    await supabase.auth.signOut();
    return fail(staff ? "This account has been disabled." : "This account doesn't have dashboard access.");
  }
  redirect("/admin/set-password");
}

export async function setPassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await getStaffForSession();
  if (!staff || staff.status === "DISABLED") return fail("Your link has expired. Ask the owner for a new one.");

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const parsed = newPassword.safeParse(password);
  if (!parsed.success) return fail("Choose a stronger password.", { password: parsed.error.issues[0].message });
  if (password.toLowerCase().includes(staff.email.split("@")[0].toLowerCase())) {
    return fail("Choose a stronger password.", { password: "Don't include your email name in the password" });
  }
  if (password !== confirm) return fail("The passwords don't match.", { confirm: "The passwords don't match" });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    logServerEvent("auth.set_password_failed", error);
    return fail(/same/i.test(error.message) ? "Choose a password you haven't used before." : "Your password couldn't be saved. Please try again.");
  }
  const wasInvited = staff.status === "INVITED";
  await getDb().staffMember.update({
    where: { id: staff.id },
    data: { status: "ACTIVE", lastSignInAt: new Date() },
  });
  await audit(staff, {
    action: wasInvited ? "auth.invite_accepted" : "auth.password_changed",
    entityType: "staff",
    entityId: staff.id,
    summary: wasInvited ? "Accepted invitation and set a password" : "Set a new password",
  });
  redirect("/admin?welcome=1");
}

/* --------------------------------- sign out ------------------------------- */

export async function signOut(formData?: FormData) {
  const staff = await getStaffForSession();
  if (isAuthConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut({ scope: formData?.get("everywhere") === "1" ? "global" : "local" });
  }
  if (staff) {
    await audit(staff, {
      action: formData?.get("everywhere") === "1" ? "auth.sign_out_everywhere" : "auth.sign_out",
      entityType: "staff",
      entityId: staff.id,
      summary: formData?.get("everywhere") === "1" ? "Signed out on all devices" : "Signed out",
    });
  }
  redirect("/admin/login?signed_out=1");
}
