"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/admin/action-result";
import { audit } from "@/lib/admin/audit";
import { parsePayload } from "@/lib/admin/cms";
import { authorize } from "@/lib/admin/session";
import { TAGS } from "@/lib/cache-tags";
import { getDb } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/log";
import { deleteMediaIfUnused } from "@/lib/server/media";
import { galleryItemSchema, optionalText, text } from "@/lib/validation/cms";

const idSchema = z.uuid();
const categories = ["VILLAS", "INTERIORS", "AMENITIES", "COMMUNITY"] as const;

const newItemsSchema = z.object({
  category: z.enum(categories),
  source: z.enum(["RENDER", "PHOTO"]),
  publish: z.boolean(),
  items: z
    .array(z.object({ mediaId: z.uuid(), caption: text(120), alt: optionalText(200) }))
    .min(1, "Upload at least one image")
    .max(30, "Upload at most 30 images at a time"),
});

/** Adds uploaded images (already stored via /api/admin/media) to the gallery. */
export async function addGalleryItems(input: unknown): Promise<ActionResult> {
  const auth = await authorize("GALLERY");
  if (!auth.ok) return fail(auth.error);
  const parsed = newItemsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { category, source, publish, items } = parsed.data;

  const db = getDb();
  const assets = await db.mediaAsset.findMany({ where: { id: { in: items.map((i) => i.mediaId) } }, select: { id: true, url: true } });
  const urlById = new Map(assets.map((a) => [a.id, a.url]));
  if (urlById.size !== new Set(items.map((i) => i.mediaId)).size) return fail("Some uploads could not be found. Please upload them again.");

  try {
    const last = await db.galleryItem.aggregate({ _max: { sortOrder: true } });
    let order = (last._max.sortOrder ?? -1) + 1;
    await db.galleryItem.createMany({
      data: items.map((i) => ({
        kind: "IMAGE" as const,
        src: urlById.get(i.mediaId)!,
        mediaId: i.mediaId,
        alt: i.alt || i.caption,
        caption: i.caption,
        category,
        source,
        sortOrder: order++,
        status: publish ? ("PUBLISHED" as const) : ("DRAFT" as const),
      })),
    });
  } catch (e) {
    logServerEvent("admin.gallery.add_failed", e);
    return fail("The images couldn't be added. Please try again.");
  }
  await audit(auth.user, {
    action: "gallery.items_added",
    entityType: "gallery",
    summary: `Added ${items.length} image${items.length === 1 ? "" : "s"} to the gallery (${publish ? "published" : "draft"})`,
  });
  if (publish) updateTag(TAGS.gallery);
  refresh();
  return ok(`${items.length} image${items.length === 1 ? "" : "s"} added${publish ? " and published" : " as drafts"}.`);
}

export async function saveGalleryItem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("GALLERY");
  if (!auth.ok) return fail(auth.error);
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("This item no longer exists.");
  const parsed = parsePayload(formData, galleryItemSchema, (raw) => {
    const image = raw.image as { src?: string; alt?: string } | undefined;
    return { ...raw, src: image?.src ?? "", alt: image?.alt ?? "" };
  });
  if (!parsed.ok) {
    const errors = Object.fromEntries(Object.entries(parsed.errors).map(([k, v]) => [k === "src" ? "image.src" : k === "alt" ? "image.alt" : k, v]));
    return fail("Please fix the highlighted fields.", errors);
  }
  const g = parsed.data;
  if (g.kind === "IMAGE" && g.videoUrl) return fail("Please fix the highlighted fields.", { videoUrl: "Only videos have a video link" });

  const db = getDb();
  const existing = await db.galleryItem.findUnique({ where: { id: id.data }, select: { src: true, status: true } });
  if (!existing) return fail("This item no longer exists.");
  const asset = await db.mediaAsset.findFirst({ where: { url: g.src }, select: { id: true } });
  try {
    await db.galleryItem.update({
      where: { id: id.data },
      data: {
        kind: g.kind,
        src: g.src,
        alt: g.alt,
        caption: g.caption,
        category: g.category,
        source: g.source,
        featured: g.featured,
        videoUrl: g.kind === "VIDEO" ? g.videoUrl : null,
        videoDuration: g.kind === "VIDEO" ? g.videoDuration : null,
        mediaId: asset?.id ?? null,
      },
    });
  } catch (e) {
    logServerEvent("admin.gallery.save_failed", e);
    return fail("Your changes couldn't be saved. Please try again.");
  }
  if (existing.src !== g.src) await deleteMediaIfUnused(existing.src).catch(() => false);
  await audit(auth.user, { action: "gallery.item_updated", entityType: "gallery", entityId: id.data, summary: `Updated gallery item “${g.caption}”` });
  if (existing.status === "PUBLISHED") updateTag(TAGS.gallery);
  refresh();
  return ok(existing.status === "PUBLISHED" ? "Saved and published to the website." : "Saved. Publish it to show it on the website.");
}

export async function setGalleryStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("GALLERY");
  if (!auth.ok) return fail(auth.error);
  const id = idSchema.safeParse(formData.get("id"));
  const status = z.enum(["DRAFT", "PUBLISHED"]).safeParse(formData.get("status"));
  if (!id.success || !status.success) return fail("Invalid request.");
  const item = await getDb().galleryItem.findUnique({ where: { id: id.data }, select: { caption: true } });
  if (!item) return fail("This item no longer exists.");
  try {
    await getDb().galleryItem.update({ where: { id: id.data }, data: { status: status.data } });
  } catch (e) {
    logServerEvent("admin.gallery.status_failed", e);
    return fail("The change couldn't be saved.");
  }
  await audit(auth.user, {
    action: status.data === "PUBLISHED" ? "gallery.item_published" : "gallery.item_unpublished",
    entityType: "gallery",
    entityId: id.data,
    summary: `${status.data === "PUBLISHED" ? "Published" : "Unpublished"} gallery item “${item.caption}”`,
  });
  updateTag(TAGS.gallery);
  refresh();
  return ok(status.data === "PUBLISHED" ? "Published." : "Unpublished.");
}

export async function moveGalleryItem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("GALLERY");
  if (!auth.ok) return fail(auth.error);
  const id = idSchema.safeParse(formData.get("id"));
  const dir = formData.get("dir") === "up" ? -1 : 1;
  if (!id.success) return fail("Invalid request.");
  const db = getDb();
  const all = await db.galleryItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, caption: true } });
  const i = all.findIndex((g) => g.id === id.data);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= all.length) return ok("Order unchanged.");
  [all[i], all[j]] = [all[j], all[i]];
  try {
    await db.$transaction(all.map((g, idx) => db.galleryItem.update({ where: { id: g.id }, data: { sortOrder: idx } })));
  } catch (e) {
    logServerEvent("admin.gallery.reorder_failed", e);
    return fail("The order couldn't be saved.");
  }
  await audit(auth.user, { action: "gallery.reordered", entityType: "gallery", entityId: id.data, summary: `Moved gallery item “${all[j].caption}” ${dir < 0 ? "earlier" : "later"}` });
  updateTag(TAGS.gallery);
  refresh();
  return ok("Order updated.");
}

export async function deleteGalleryItem(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const auth = await authorize("GALLERY");
  if (!auth.ok) return fail(auth.error);
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Invalid request.");
  const item = await getDb().galleryItem.findUnique({ where: { id: id.data }, select: { caption: true, src: true, status: true } });
  if (!item) return fail("This item no longer exists.");
  try {
    await getDb().galleryItem.delete({ where: { id: id.data } });
  } catch (e) {
    logServerEvent("admin.gallery.delete_failed", e);
    return fail("The item couldn't be deleted. Please try again.");
  }
  // Remove the stored file too, unless another page still uses it.
  const fileRemoved = await deleteMediaIfUnused(item.src).catch(() => false);
  await audit(auth.user, {
    action: "gallery.item_deleted",
    entityType: "gallery",
    entityId: id.data,
    summary: `Deleted gallery item “${item.caption}”${fileRemoved ? " and its image file" : ""}`,
  });
  if (item.status === "PUBLISHED") updateTag(TAGS.gallery);
  redirect("/admin/gallery?deleted=1");
}
