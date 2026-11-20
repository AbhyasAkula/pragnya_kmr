"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/admin/action-result";
import { audit } from "@/lib/admin/audit";
import { flattenPhotos, nestPhotoErrors, parsePayload } from "@/lib/admin/cms";
import { authorize } from "@/lib/admin/session";
import { TAGS } from "@/lib/cache-tags";
import { getDb } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/log";
import { constructionUpdateSchema, milestonesSchema } from "@/lib/validation/cms";

const idSchema = z.uuid();

export async function saveUpdate(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("CONSTRUCTION");
  if (!auth.ok) return fail(auth.error);
  const rawId = String(formData.get("id") ?? "");
  const id = rawId ? idSchema.safeParse(rawId) : null;
  if (id && !id.success) return fail("This update no longer exists.");

  const parsed = parsePayload(formData, constructionUpdateSchema, (raw) => ({ ...raw, media: flattenPhotos(raw.media) }));
  if (!parsed.ok) return fail("Please fix the highlighted fields.", nestPhotoErrors(parsed.errors, ["media"]));
  const u = parsed.data;
  const data = {
    date: new Date(`${u.date}T00:00:00.000Z`),
    title: u.title,
    summary: u.summary,
    overallProgress: u.overallProgress,
    areas: u.areas,
    media: u.media.map((m) => (m.kind === "video" ? { ...m, video: {} } : m)),
    isSample: u.isSample,
  };

  let updateId: string;
  let wasPublished = false;
  try {
    if (id?.success) {
      const existing = await getDb().constructionUpdate.findUnique({ where: { id: id.data }, select: { status: true } });
      if (!existing) return fail("This update no longer exists.");
      wasPublished = existing.status === "PUBLISHED";
      await getDb().constructionUpdate.update({ where: { id: id.data }, data });
      updateId = id.data;
    } else {
      updateId = (await getDb().constructionUpdate.create({ data: { ...data, status: "DRAFT" }, select: { id: true } })).id;
    }
  } catch (e) {
    logServerEvent("admin.construction.save_failed", e);
    return fail("The update couldn't be saved. Please try again.");
  }
  await audit(auth.user, {
    action: id?.success ? "construction_update.updated" : "construction_update.created",
    entityType: "construction_update",
    entityId: updateId,
    summary: `${id?.success ? "Updated" : "Created draft"} construction update “${u.title}” (${u.date})`,
  });
  if (wasPublished) updateTag(TAGS.construction);
  if (!id?.success) redirect(`/admin/construction/updates/${updateId}?created=1`);
  refresh();
  return ok(wasPublished ? "Saved and published to the website." : "Saved as a draft. Publish it when it's ready.");
}

export async function setUpdateStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("CONSTRUCTION");
  if (!auth.ok) return fail(auth.error);
  const id = idSchema.safeParse(formData.get("id"));
  const status = z.enum(["DRAFT", "PUBLISHED"]).safeParse(formData.get("status"));
  if (!id.success || !status.success) return fail("Invalid request.");
  const u = await getDb().constructionUpdate.findUnique({ where: { id: id.data }, select: { title: true } });
  if (!u) return fail("This update no longer exists.");
  try {
    await getDb().constructionUpdate.update({
      where: { id: id.data },
      data: { status: status.data, ...(status.data === "PUBLISHED" ? { publishedAt: new Date() } : {}) },
    });
  } catch (e) {
    logServerEvent("admin.construction.status_failed", e);
    return fail("The change couldn't be saved. Please try again.");
  }
  await audit(auth.user, {
    action: status.data === "PUBLISHED" ? "construction_update.published" : "construction_update.unpublished",
    entityType: "construction_update",
    entityId: id.data,
    summary: `${status.data === "PUBLISHED" ? "Published" : "Unpublished"} construction update “${u.title}”`,
  });
  updateTag(TAGS.construction);
  refresh();
  return ok(status.data === "PUBLISHED" ? "Published — it's now on the website." : "Unpublished.");
}

export async function deleteUpdate(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("CONSTRUCTION");
  if (!auth.ok) return fail(auth.error);
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Invalid request.");
  const u = await getDb().constructionUpdate.findUnique({ where: { id: id.data }, select: { title: true, status: true } });
  if (!u) return fail("This update no longer exists.");
  try {
    await getDb().constructionUpdate.delete({ where: { id: id.data } });
  } catch (e) {
    logServerEvent("admin.construction.delete_failed", e);
    return fail("The update couldn't be deleted. Please try again.");
  }
  await audit(auth.user, { action: "construction_update.deleted", entityType: "construction_update", entityId: id.data, summary: `Deleted construction update “${u.title}”` });
  if (u.status === "PUBLISHED") updateTag(TAGS.construction);
  redirect("/admin/construction?deleted=1");
}

/** Replaces the milestone list: updates existing rows, adds new ones, removes deleted ones. */
export async function saveMilestones(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("CONSTRUCTION");
  if (!auth.ok) return fail(auth.error);
  const parsed = parsePayload(formData, milestonesSchema);
  if (!parsed.ok) return fail("Please fix the highlighted fields.", parsed.errors);
  const db = getDb();
  const existing = new Set((await db.constructionMilestone.findMany({ select: { id: true } })).map((m) => m.id));
  const keep = new Set<string>();
  try {
    await db.$transaction(async (tx) => {
      for (const [i, m] of parsed.data.milestones.entries()) {
        const data = { title: m.title, status: m.status, dateLabel: m.dateLabel, visible: m.visible, sortOrder: i };
        if (m.id && existing.has(m.id)) {
          keep.add(m.id);
          await tx.constructionMilestone.update({ where: { id: m.id }, data });
        } else {
          await tx.constructionMilestone.create({ data });
        }
      }
      await tx.constructionMilestone.deleteMany({ where: { id: { in: [...existing].filter((x) => !keep.has(x)) } } });
    });
  } catch (e) {
    logServerEvent("admin.construction.milestones_failed", e);
    return fail("Milestones couldn't be saved. Please try again.");
  }
  await audit(auth.user, {
    action: "construction_milestones.updated",
    entityType: "construction_milestone",
    summary: `Updated construction milestones (${parsed.data.milestones.length} total)`,
  });
  updateTag(TAGS.construction);
  refresh();
  return ok("Milestones saved and published.");
}
