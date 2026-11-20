"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { fail, ok, type ActionResult } from "@/lib/admin/action-result";
import { audit } from "@/lib/admin/audit";
import { BOOKING_STATUSES, bookingReference, bookingStatus } from "@/lib/admin/format";
import { authorize } from "@/lib/admin/session";
import { getDb } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/log";

/**
 * Booking (lead) management. Every action re-checks the session and the
 * BOOKINGS permission on the server; audit entries refer to bookings by
 * reference only (no customer names, phone numbers or messages).
 */

const id = z.uuid();

async function loadBooking(bookingId: unknown) {
  const parsed = id.safeParse(bookingId);
  if (!parsed.success) return null;
  return getDb().siteVisitRequest.findUnique({
    where: { id: parsed.data },
    select: { id: true, status: true, assignedToId: true, followUpAt: true },
  });
}

function storageError(e: unknown): ActionResult {
  logServerEvent("admin.bookings.write_failed", e);
  return fail("The change couldn't be saved. Please try again.");
}

export async function updateBookingStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("BOOKINGS");
  if (!auth.ok) return fail(auth.error);
  const booking = await loadBooking(formData.get("id"));
  if (!booking) return fail("This booking no longer exists.");
  const status = z.enum(BOOKING_STATUSES).safeParse(formData.get("status"));
  if (!status.success) return fail("Choose a status.");
  if (status.data === booking.status) return ok("Status unchanged.");
  const ref = bookingReference(booking.id);

  try {
    await getDb().$transaction([
      getDb().siteVisitRequest.update({ where: { id: booking.id }, data: { status: status.data } }),
      getDb().siteVisitActivity.create({
        data: { requestId: booking.id, actorId: auth.user.id, type: "STATUS_CHANGED", fromValue: booking.status, toValue: status.data },
      }),
    ]);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("This customer already has another open request for the same visit date. Close that one first.");
    }
    return storageError(e);
  }
  await audit(auth.user, {
    action: "booking.status_changed",
    entityType: "booking",
    entityId: booking.id,
    summary: `Booking ${ref}: status ${bookingStatus[booking.status].label} → ${bookingStatus[status.data].label}`,
  });
  refresh();
  return ok(`Status changed to ${bookingStatus[status.data].label}.`);
}

export async function assignBooking(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("BOOKINGS");
  if (!auth.ok) return fail(auth.error);
  const booking = await loadBooking(formData.get("id"));
  if (!booking) return fail("This booking no longer exists.");
  const raw = String(formData.get("assignee") ?? "");
  const assigneeId = raw === "" ? null : id.safeParse(raw).success ? raw : undefined;
  if (assigneeId === undefined) return fail("Choose a team member.");
  if (assigneeId === booking.assignedToId) return ok("Assignment unchanged.");

  let assigneeName: string | null = null;
  if (assigneeId) {
    const staff = await getDb().staffMember.findUnique({ where: { id: assigneeId }, select: { fullName: true, status: true } });
    if (!staff || staff.status !== "ACTIVE") return fail("That team member isn't active.");
    assigneeName = staff.fullName;
  }
  try {
    await getDb().$transaction([
      getDb().siteVisitRequest.update({ where: { id: booking.id }, data: { assignedToId: assigneeId } }),
      getDb().siteVisitActivity.create({
        data: { requestId: booking.id, actorId: auth.user.id, type: "ASSIGNED", toValue: assigneeName ?? "Unassigned" },
      }),
    ]);
  } catch (e) {
    return storageError(e);
  }
  await audit(auth.user, {
    action: "booking.assigned",
    entityType: "booking",
    entityId: booking.id,
    summary: `Booking ${bookingReference(booking.id)}: assigned to ${assigneeName ?? "nobody"}`,
  });
  refresh();
  return ok(assigneeName ? `Assigned to ${assigneeName}.` : "Booking is now unassigned.");
}

export async function setFollowUp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("BOOKINGS");
  if (!auth.ok) return fail(auth.error);
  const booking = await loadBooking(formData.get("id"));
  if (!booking) return fail("This booking no longer exists.");
  const clear = formData.get("clear") === "1";
  const raw = String(formData.get("followUpAt") ?? "");
  let when: Date | null = null;
  if (!clear) {
    // <input type="datetime-local"> gives local India time without an offset.
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return fail("Choose a date and time.", { followUpAt: "Choose a date and time" });
    when = new Date(`${raw}:00+05:30`);
    if (Number.isNaN(when.getTime())) return fail("Choose a valid date and time.", { followUpAt: "Invalid date" });
    const oneYear = Date.now() + 366 * 86_400_000;
    if (when.getTime() > oneYear) return fail("Pick a date within the next year.", { followUpAt: "Too far ahead" });
  }
  try {
    await getDb().$transaction([
      getDb().siteVisitRequest.update({ where: { id: booking.id }, data: { followUpAt: when } }),
      getDb().siteVisitActivity.create({
        data: {
          requestId: booking.id,
          actorId: auth.user.id,
          type: when ? "FOLLOW_UP_SET" : "FOLLOW_UP_CLEARED",
          toValue: when ? when.toISOString() : null,
        },
      }),
    ]);
  } catch (e) {
    return storageError(e);
  }
  await audit(auth.user, {
    action: when ? "booking.follow_up_set" : "booking.follow_up_cleared",
    entityType: "booking",
    entityId: booking.id,
    summary: `Booking ${bookingReference(booking.id)}: follow-up ${when ? "scheduled" : "cleared"}`,
  });
  refresh();
  return ok(when ? "Follow-up scheduled." : "Follow-up cleared.");
}

export async function addBookingNote(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("BOOKINGS");
  if (!auth.ok) return fail(auth.error);
  const booking = await loadBooking(formData.get("id"));
  if (!booking) return fail("This booking no longer exists.");
  const body = z.string().trim().min(1, "Write a note first").max(2000, "Keep notes under 2000 characters").safeParse(formData.get("note") ?? "");
  if (!body.success) return fail(body.error.issues[0].message, { note: body.error.issues[0].message });
  try {
    await getDb().siteVisitActivity.create({ data: { requestId: booking.id, actorId: auth.user.id, type: "NOTE", body: body.data } });
  } catch (e) {
    return storageError(e);
  }
  await audit(auth.user, {
    action: "booking.note_added",
    entityType: "booking",
    entityId: booking.id,
    summary: `Booking ${bookingReference(booking.id)}: note added`,
  });
  refresh();
  return ok("Note added.");
}

/**
 * Permanently deletes a booking (e.g. a customer's data-deletion request).
 * OWNER only. The audit entry keeps the reference, never the personal data.
 */
export async function deleteBooking(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("OWNER");
  if (!auth.ok) return fail(auth.error);
  const booking = await loadBooking(formData.get("id"));
  if (!booking) return fail("This booking no longer exists.");
  try {
    await getDb().siteVisitRequest.delete({ where: { id: booking.id } });
  } catch (e) {
    return storageError(e);
  }
  await audit(auth.user, {
    action: "booking.deleted",
    entityType: "booking",
    entityId: booking.id,
    summary: `Booking ${bookingReference(booking.id)} permanently deleted (customer data removed)`,
  });
  redirect("/admin/bookings?deleted=1");
}
