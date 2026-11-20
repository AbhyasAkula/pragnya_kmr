import "server-only";
import { randomUUID } from "node:crypto";
import sharp, { type OutputInfo } from "sharp";
import { MEDIA_BUCKET } from "@/lib/media";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getDb } from "./db";
import { logServerEvent } from "./log";

/**
 * Image uploads for the admin dashboard.
 * - Only JPEG / PNG / WebP / AVIF, detected from the file's bytes (the
 *   browser-supplied type and name are not trusted).
 * - Every image is decoded and re-encoded with sharp: this strips EXIF/GPS
 *   metadata (site photos often carry location), neutralises malformed or
 *   polyglot files, applies orientation and caps the size at 2560 px.
 * - Stored in Supabase Storage under a random name; only the server (secret
 *   key) can write to the bucket.
 */

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export class MediaError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "MediaError";
  }
}

function sniffImageType(buf: Buffer): "jpeg" | "png" | "webp" | "avif" | null {
  if (buf.length < 16) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  if (buf.subarray(4, 8).toString("ascii") === "ftyp" && /avi[fs]/.test(buf.subarray(8, 12).toString("ascii"))) return "avif";
  return null;
}

let bucketReady = false;
export async function ensureBucket() {
  if (bucketReady) return;
  const storage = getSupabaseAdmin().storage;
  const { data } = await storage.getBucket(MEDIA_BUCKET);
  if (!data) {
    const { error } = await storage.createBucket(MEDIA_BUCKET, {
      public: true, // website images are public once used on the site; names are unguessable
      fileSizeLimit: MAX_UPLOAD_BYTES,
      allowedMimeTypes: ["image/webp"],
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
  bucketReady = true;
}

function cleanName(name: string) {
  return name.replace(/[^\w.\- ]+/g, "").trim().slice(0, 160) || "image";
}

export async function storeImage(file: File, uploadedById: string) {
  if (file.size === 0) throw new MediaError("That file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new MediaError("Images must be under 15 MB.", 413);
  const input = Buffer.from(await file.arrayBuffer());
  if (!sniffImageType(input)) throw new MediaError("Only JPEG, PNG, WebP or AVIF images can be uploaded.", 415);

  let output: { data: Buffer; info: OutputInfo };
  try {
    output = await sharp(input, { limitInputPixels: 50_000_000, failOn: "error" })
      .rotate()
      .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new MediaError("That image couldn't be read. Try exporting it again as JPEG or PNG.", 422);
  }

  await ensureBucket();
  const now = new Date();
  const path = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.webp`;
  const storage = getSupabaseAdmin().storage.from(MEDIA_BUCKET);
  const { error } = await storage.upload(path, output.data, {
    contentType: "image/webp",
    // Short CDN cache so a deleted image stops being served within the hour.
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    logServerEvent("media.storage_upload_failed", error);
    throw new MediaError("The image couldn't be stored. Please try again.", 503);
  }
  const url = storage.getPublicUrl(path).data.publicUrl;

  try {
    return await getDb().mediaAsset.create({
      data: {
        storagePath: path,
        url,
        mimeType: "image/webp",
        bytes: output.info.size,
        width: output.info.width,
        height: output.info.height,
        originalName: cleanName(file.name),
        uploadedById,
      },
      select: { id: true, url: true, width: true, height: true, originalName: true },
    });
  } catch (e) {
    await storage.remove([path]).catch(() => undefined); // don't leave orphans
    throw e;
  }
}

/** True when any content still points at this URL. */
export async function isMediaReferenced(url: string) {
  const pattern = `%${url.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = await getDb().$queryRaw<{ n: number }[]>`
    SELECT (
      (SELECT count(*) FROM "aurelia"."gallery_items" WHERE "src" = ${url}) +
      (SELECT count(*) FROM "aurelia"."villas" WHERE ("image"::text || "gallery"::text || "floor_plans"::text) LIKE ${pattern}) +
      (SELECT count(*) FROM "aurelia"."construction_updates" WHERE "media"::text LIKE ${pattern}) +
      (SELECT count(*) FROM "aurelia"."content_entries" WHERE "data"::text LIKE ${pattern})
    )::int AS n`;
  return (rows[0]?.n ?? 0) > 0;
}

/** Deletes an uploaded image (file + record) if nothing uses it any more. */
export async function deleteMediaIfUnused(url: string): Promise<boolean> {
  const asset = await getDb().mediaAsset.findFirst({ where: { url }, select: { id: true, storagePath: true } });
  if (!asset || (await isMediaReferenced(url))) return false;
  const { error } = await getSupabaseAdmin().storage.from(MEDIA_BUCKET).remove([asset.storagePath]);
  if (error) {
    logServerEvent("media.storage_delete_failed", error);
    return false;
  }
  await getDb().mediaAsset.delete({ where: { id: asset.id } });
  return true;
}
