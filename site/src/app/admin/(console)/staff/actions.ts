"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { fail, ok, type ActionResult } from "@/lib/admin/action-result";
import { audit } from "@/lib/admin/audit";
import { authLink } from "@/lib/admin/origin";
import { PERMISSIONS, PERMISSION_INFO, type Permission } from "@/lib/admin/permissions";
import { authorize } from "@/lib/admin/session";
import { getDb } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/log";
import { consume, hashKey } from "@/lib/server/rate-limit";
import { getSupabaseAdmin, SupabaseAdminNotConfiguredError } from "@/lib/supabase/admin";
import { staffInviteSchema, staffUpdateSchema } from "@/lib/validation/admin";

/**
 * Staff management — OWNER only. Guards against lock-out and escalation:
 * owners can't demote or disable themselves, the last active owner can't be
 * removed, and staff-management rights are never grantable to STAFF.
 */

const idSchema = z.uuid();

function formToStaff(formData: FormData) {
  return {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    role: formData.get("role"),
    permissions: formData.getAll("permissions").map(String),
  };
}

function permsFor(role: "OWNER" | "STAFF", permissions: Permission[]) {
  // Owners implicitly have everything; store the full list for clarity.
  return role === "OWNER" ? [...PERMISSIONS] : permissions;
}

async function activeOwnerCount(excludeId?: string) {
  return getDb().staffMember.count({ where: { role: "OWNER", status: "ACTIVE", ...(excludeId ? { id: { not: excludeId } } : {}) } });
}

/** One-time sign-in link: invite (password not set yet) or password recovery. */
async function generateAccessLink(email: string, preferInvite: boolean) {
  const admin = getSupabaseAdmin().auth.admin;
  if (preferInvite) {
    const invite = await admin.generateLink({ type: "invite", email });
    if (!invite.error && invite.data.properties?.hashed_token) {
      return { userId: invite.data.user.id, link: await authLink(invite.data.properties.hashed_token, "invite") };
    }
  }
  const recovery = await admin.generateLink({ type: "recovery", email });
  if (recovery.error || !recovery.data.properties?.hashed_token) throw recovery.error ?? new Error("No link returned");
  return { userId: recovery.data.user.id, link: await authLink(recovery.data.properties.hashed_token, "recovery") };
}

function adminError(e: unknown): ActionResult {
  if (e instanceof SupabaseAdminNotConfiguredError) return fail("Invitations need the Supabase secret key in the server environment (see setup guide).");
  logServerEvent("admin.staff.supabase_failed", e);
  return fail("The account service didn't respond. Please try again.");
}

export async function inviteStaff(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("OWNER");
  if (!auth.ok) return fail(auth.error);
  const parsed = staffInviteSchema.safeParse(formToStaff(formData));
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
  }
  const { fullName, email, role, permissions } = parsed.data;
  if (role === "STAFF" && permissions.length === 0) return fail("Choose at least one area this person can work on.", { permissions: "Choose at least one" });

  const limit = await consume([{ name: "invite-1h", limit: 20, windowSeconds: 3600 }], { "invite-1h": hashKey(`staff:${auth.user.id}`) });
  if (!limit.ok) return fail("Too many invitations in a short time. Please wait a while.");
  if (await getDb().staffMember.findUnique({ where: { email } })) return fail("Please fix the highlighted fields.", { email: "This person already has an account" });

  let access: { userId: string; link: string };
  try {
    access = await generateAccessLink(email, true);
  } catch (e) {
    return adminError(e);
  }
  try {
    await getDb().staffMember.create({
      data: { id: access.userId, email, fullName, role, permissions: permsFor(role, permissions), status: "INVITED", invitedById: auth.user.id },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return fail("This person already has an account.");
    logServerEvent("admin.staff.create_failed", e);
    return fail("The invitation couldn't be saved. Please try again.");
  }
  await audit(auth.user, {
    action: "staff.invited",
    entityType: "staff",
    entityId: access.userId,
    summary: `Invited ${fullName} (${email}) as ${role === "OWNER" ? "owner" : "staff"}`,
    metadata: { role, permissions: permsFor(role, permissions) },
  });
  refresh();
  return ok(`Invitation created for ${fullName}. Copy the link below and send it to them privately.`, { secret: access.link });
}

export async function updateStaff(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("OWNER");
  if (!auth.ok) return fail(auth.error);
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("This account no longer exists.");
  const parsed = staffUpdateSchema.safeParse(formToStaff(formData));
  if (!parsed.success) return fail("Please fix the highlighted fields.", Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
  const target = await getDb().staffMember.findUnique({ where: { id: id.data } });
  if (!target) return fail("This account no longer exists.");
  const { fullName, role, permissions } = parsed.data;

  if (target.id === auth.user.id && role !== target.role) return fail("You can't change your own role. Ask another owner.");
  if (target.role === "OWNER" && role === "STAFF" && target.status === "ACTIVE" && (await activeOwnerCount(target.id)) === 0) {
    return fail("There must always be at least one active owner.");
  }
  if (role === "STAFF" && permissions.length === 0) return fail("Choose at least one area, or disable the account instead.", { permissions: "Choose at least one" });

  const next = permsFor(role, permissions);
  try {
    await getDb().staffMember.update({ where: { id: target.id }, data: { fullName, role, permissions: next } });
  } catch (e) {
    logServerEvent("admin.staff.update_failed", e);
    return fail("The changes couldn't be saved. Please try again.");
  }
  const added = next.filter((p) => !target.permissions.includes(p)).map((p) => PERMISSION_INFO[p].label);
  const removed = target.permissions.filter((p) => !next.includes(p)).map((p) => PERMISSION_INFO[p].label);
  await audit(auth.user, {
    action: "staff.updated",
    entityType: "staff",
    entityId: target.id,
    summary:
      `Updated ${fullName}` +
      (role !== target.role ? `: role ${target.role.toLowerCase()} → ${role.toLowerCase()}` : "") +
      (added.length ? `; granted ${added.join(", ")}` : "") +
      (removed.length ? `; removed ${removed.join(", ")}` : ""),
    metadata: { role, permissions: next },
  });
  refresh();
  return ok("Changes saved. They apply immediately, even if this person is signed in.");
}

export async function setStaffStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("OWNER");
  if (!auth.ok) return fail(auth.error);
  const id = idSchema.safeParse(formData.get("id"));
  const action = z.enum(["disable", "enable"]).safeParse(formData.get("action"));
  if (!id.success || !action.success) return fail("Invalid request.");
  const target = await getDb().staffMember.findUnique({ where: { id: id.data } });
  if (!target) return fail("This account no longer exists.");
  if (target.id === auth.user.id) return fail("You can't disable your own account.");
  if (action.data === "disable" && target.role === "OWNER" && (await activeOwnerCount(target.id)) === 0) {
    return fail("There must always be at least one active owner.");
  }

  // Blocks future sign-ins and token refreshes in Supabase Auth. Our own
  // per-request status check (src/lib/admin/session.ts) cuts off any session
  // that is already open, immediately.
  try {
    const { error } = await getSupabaseAdmin().auth.admin.updateUserById(target.id, {
      ban_duration: action.data === "disable" ? "876000h" : "none",
    });
    if (error) throw error;
  } catch (e) {
    if (!(e instanceof SupabaseAdminNotConfiguredError)) logServerEvent("admin.staff.ban_failed", e);
    // Continue: the database status alone already blocks access.
  }
  try {
    await getDb().staffMember.update({
      where: { id: target.id },
      data:
        action.data === "disable"
          ? { status: "DISABLED", disabledAt: new Date() }
          : { status: target.lastSignInAt ? "ACTIVE" : "INVITED", disabledAt: null },
    });
  } catch (e) {
    logServerEvent("admin.staff.status_failed", e);
    return fail("The change couldn't be saved. Please try again.");
  }
  await audit(auth.user, {
    action: action.data === "disable" ? "staff.disabled" : "staff.enabled",
    entityType: "staff",
    entityId: target.id,
    summary: `${action.data === "disable" ? "Disabled" : "Re-enabled"} the account of ${target.fullName}`,
  });
  refresh();
  return ok(action.data === "disable" ? `${target.fullName} can no longer sign in.` : `${target.fullName}'s account is enabled again.`);
}

/** Owner-generated one-time link: finish invitation, or reset a forgotten password. */
export async function createAccessLink(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("OWNER");
  if (!auth.ok) return fail(auth.error);
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Invalid request.");
  const target = await getDb().staffMember.findUnique({ where: { id: id.data } });
  if (!target) return fail("This account no longer exists.");
  if (target.status === "DISABLED") return fail("Re-enable this account first.");
  const limit = await consume([{ name: "link-1h", limit: 20, windowSeconds: 3600 }], { "link-1h": hashKey(`staff:${auth.user.id}`) });
  if (!limit.ok) return fail("Too many links in a short time. Please wait a while.");

  let access: { userId: string; link: string };
  try {
    access = await generateAccessLink(target.email, target.status === "INVITED");
  } catch (e) {
    return adminError(e);
  }
  if (access.userId !== target.id) {
    logServerEvent("admin.staff.link_user_mismatch");
    return fail("This account is out of sync with the sign-in service. Contact support.");
  }
  await audit(auth.user, {
    action: target.status === "INVITED" ? "staff.invite_link_created" : "staff.reset_link_created",
    entityType: "staff",
    entityId: target.id,
    summary: `Created a ${target.status === "INVITED" ? "new invitation" : "password reset"} link for ${target.fullName}`,
  });
  return ok(`Link created for ${target.fullName}. Send it to them privately; it works once.`, { secret: access.link });
}

