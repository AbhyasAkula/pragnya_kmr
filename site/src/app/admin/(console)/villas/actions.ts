"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { fail, ok, type ActionResult } from "@/lib/admin/action-result";
import { audit } from "@/lib/admin/audit";
import { flattenPhotos, nestPhotoErrors, parsePayload } from "@/lib/admin/cms";
import { authorize } from "@/lib/admin/session";
import { TAGS } from "@/lib/cache-tags";
import { getDb } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/log";
import { villaSchema } from "@/lib/validation/cms";

const idSchema = z.uuid();

function publishSite() {
  // Villa data feeds many pages (cards, counts, master plan, booking form options).
  updateTag(TAGS.villas);
}

export async function saveVilla(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("VILLAS");
  if (!auth.ok) return fail(auth.error);
  const rawId = String(formData.get("id") ?? "");
  const id = rawId ? idSchema.safeParse(rawId) : null;
  if (id && !id.success) return fail("This villa no longer exists.");

  const parsed = parsePayload(formData, villaSchema, (raw) => ({ ...raw, gallery: flattenPhotos(raw.gallery) }));
  if (!parsed.ok) return fail("Please fix the highlighted fields.", nestPhotoErrors(parsed.errors, ["gallery"]));
  const v = parsed.data;
  const data = { ...v, image: v.image, gallery: v.gallery, floorPlans: v.floorPlans };

  let villaId: string;
  let wasPublished = false;
  try {
    if (id?.success) {
      const existing = await getDb().villa.findUnique({ where: { id: id.data }, select: { status: true } });
      if (!existing) return fail("This villa no longer exists.");
      wasPublished = existing.status === "PUBLISHED";
      await getDb().villa.update({ where: { id: id.data }, data });
      villaId = id.data;
    } else {
      const last = await getDb().villa.aggregate({ _max: { sortOrder: true } });
      const created = await getDb().villa.create({ data: { ...data, status: "DRAFT", sortOrder: (last._max.sortOrder ?? -1) + 1 }, select: { id: true } });
      villaId = created.id;
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("Please fix the highlighted fields.", { slug: "Another villa already uses this web address" });
    }
    logServerEvent("admin.villas.save_failed", e);
    return fail("The villa couldn't be saved. Please try again.");
  }

  await audit(auth.user, {
    action: id?.success ? "villa.updated" : "villa.created",
    entityType: "villa",
    entityId: villaId,
    summary: `${id?.success ? "Updated" : "Created draft"} villa “${v.name}”`,
  });
  if (wasPublished) publishSite();
  if (!id?.success) redirect(`/admin/villas/${villaId}?created=1`);
  refresh();
  return ok(wasPublished ? "Saved and published to the website." : "Saved as a draft. Publish it when it's ready.");
}

export async function setVillaStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("VILLAS");
  if (!auth.ok) return fail(auth.error);
  const id = idSchema.safeParse(formData.get("id"));
  const status = z.enum(["DRAFT", "PUBLISHED"]).safeParse(formData.get("status"));
  if (!id.success || !status.success) return fail("Invalid request.");
  const villa = await getDb().villa.findUnique({ where: { id: id.data }, select: { name: true, status: true } });
  if (!villa) return fail("This villa no longer exists.");
  try {
    await getDb().villa.update({
      where: { id: id.data },
      data: { status: status.data, ...(status.data === "PUBLISHED" ? { publishedAt: new Date() } : {}) },
    });
  } catch (e) {
    logServerEvent("admin.villas.status_failed", e);
    return fail("The change couldn't be saved. Please try again.");
  }
  await audit(auth.user, {
    action: status.data === "PUBLISHED" ? "villa.published" : "villa.unpublished",
    entityType: "villa",
    entityId: id.data,
    summary: `${status.data === "PUBLISHED" ? "Published" : "Unpublished"} villa “${villa.name}”`,
  });
  publishSite();
  refresh();
  return ok(status.data === "PUBLISHED" ? "Published — it's now on the website." : "Unpublished — it's no longer on the website.");
}

export async function moveVilla(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("VILLAS");
  if (!auth.ok) return fail(auth.error);
  const id = idSchema.safeParse(formData.get("id"));
  const dir = formData.get("dir") === "up" ? -1 : 1;
  if (!id.success) return fail("Invalid request.");
  const all = await getDb().villa.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, name: true } });
  const i = all.findIndex((v) => v.id === id.data);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= all.length) return ok("Order unchanged.");
  [all[i], all[j]] = [all[j], all[i]];
  try {
    await getDb().$transaction(all.map((v, idx) => getDb().villa.update({ where: { id: v.id }, data: { sortOrder: idx } })));
  } catch (e) {
    logServerEvent("admin.villas.reorder_failed", e);
    return fail("The order couldn't be saved.");
  }
  await audit(auth.user, { action: "villa.reordered", entityType: "villa", entityId: id.data, summary: `Moved villa “${all[j].name}” ${dir < 0 ? "up" : "down"}` });
  publishSite();
  refresh();
  return ok("Order updated.");
}

export async function deleteVilla(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("VILLAS");
  if (!auth.ok) return fail(auth.error);
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Invalid request.");
  const villa = await getDb().villa.findUnique({ where: { id: id.data }, select: { name: true, status: true } });
  if (!villa) return fail("This villa no longer exists.");
  try {
    await getDb().villa.delete({ where: { id: id.data } });
  } catch (e) {
    logServerEvent("admin.villas.delete_failed", e);
    return fail("The villa couldn't be deleted. Please try again.");
  }
  await audit(auth.user, { action: "villa.deleted", entityType: "villa", entityId: id.data, summary: `Deleted villa “${villa.name}”` });
  if (villa.status === "PUBLISHED") publishSite();
  redirect("/admin/villas?deleted=1");
}
