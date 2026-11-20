import { siteUrl } from "@/config/site";
import { audit } from "@/lib/admin/audit";
import { canUseMedia } from "@/lib/admin/permissions";
import { authorize } from "@/lib/admin/session";
import { getDb } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/log";
import { MAX_UPLOAD_BYTES, MediaError, storeImage } from "@/lib/server/media";
import { consume, hashKey } from "@/lib/server/rate-limit";

/**
 * Admin media library.
 * GET  /api/admin/media?cursor=…  → uploaded images (newest first)
 * POST /api/admin/media (multipart "file") → upload one image
 * Requires a signed-in staff member with a content permission; never public.
 */

const json = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

async function authorizeMedia() {
  const auth = await authorize();
  if (!auth.ok) return { ok: false as const, res: json(auth.status, { error: auth.error }) };
  if (!canUseMedia(auth.user)) return { ok: false as const, res: json(403, { error: "You don't have permission to manage images." }) };
  return { ok: true as const, user: auth.user };
}

export async function GET(request: Request) {
  const auth = await authorizeMedia();
  if (!auth.ok) return auth.res;
  const cursor = new URL(request.url).searchParams.get("cursor");
  const pageSize = 24;
  const rows = await getDb().mediaAsset.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: pageSize + 1,
    ...(cursor && /^[0-9a-f-]{36}$/i.test(cursor) ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, url: true, width: true, height: true, originalName: true },
  });
  return json(200, { assets: rows.slice(0, pageSize), nextCursor: rows.length > pageSize ? rows[pageSize - 1].id : null });
}

function isCrossSite(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return true;
  const origin = request.headers.get("origin");
  if (!origin) return true; // uploads come from our own pages, which always send Origin
  try {
    const host = new URL(origin).host;
    return host !== (request.headers.get("x-forwarded-host") ?? request.headers.get("host")) && host !== siteUrl?.host;
  } catch {
    return true;
  }
}

export async function POST(request: Request) {
  if (isCrossSite(request)) return json(403, { error: "This request was blocked." });
  const auth = await authorizeMedia();
  if (!auth.ok) return auth.res;

  // Reject oversized bodies before reading them.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (!declared || declared > MAX_UPLOAD_BYTES + 64 * 1024) return json(413, { error: "Images must be under 15 MB." });

  try {
    const limited = await consume([{ name: "upload-1h", limit: 120, windowSeconds: 3600 }], { "upload-1h": hashKey(`staff:${auth.user.id}`) });
    if (!limited.ok) return json(429, { error: "Upload limit reached. Please wait a little and try again." });

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json(400, { error: "Choose an image to upload." });

    const asset = await storeImage(file, auth.user.id);
    await audit(auth.user, {
      action: "media.upload",
      entityType: "media",
      entityId: asset.id,
      summary: `Uploaded image “${asset.originalName}” (${asset.width}×${asset.height})`,
    });
    return json(201, { asset });
  } catch (error) {
    if (error instanceof MediaError) return json(error.status, { error: error.message });
    logServerEvent("media.upload_failed", error);
    return json(503, { error: "The upload couldn't be completed. Please try again." });
  }
}
