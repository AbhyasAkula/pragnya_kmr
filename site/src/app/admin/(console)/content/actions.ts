"use server";

import { refresh, updateTag } from "next/cache";
import { fail, ok, type ActionResult } from "@/lib/admin/action-result";
import { audit } from "@/lib/admin/audit";
import { parsePayload } from "@/lib/admin/cms";
import { contentPermission, contentTitles } from "@/lib/admin/content-sections";
import { authorize } from "@/lib/admin/session";
import { TAGS, contentTag } from "@/lib/cache-tags";
import { getDb } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/log";
import { contentKeys, contentSchemas, type ContentKey } from "@/lib/validation/cms";

/**
 * Saves one content section. The permission depends on the section (Settings
 * → SETTINGS, specifications → VILLAS, gallery notice → GALLERY, everything
 * else → CONTENT). Published immediately; the site refreshes via cache tags.
 */
export async function saveContent(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const key = String(formData.get("key") ?? "") as ContentKey;
  if (!contentKeys.includes(key)) return fail("Unknown section.");
  const auth = await authorize(contentPermission[key]);
  if (!auth.ok) return fail(auth.error);

  const parsed = parsePayload(formData, contentSchemas[key]);
  if (!parsed.ok) return fail("Please fix the highlighted fields.", parsed.errors);

  let data = parsed.data as Record<string, unknown>;
  if (key === "masterPlan") {
    // Zone geometry belongs to the diagram: keep the stored shapes/tones, accept text only.
    const current = await getDb().contentEntry.findUnique({ where: { key } });
    const stored = contentSchemas.masterPlan.safeParse(current?.data);
    if (stored.success) {
      const byId = new Map(stored.data.zones.map((z) => [z.id, z]));
      const zones = (data.zones as typeof stored.data.zones).map((z) => {
        const orig = byId.get(z.id);
        return orig ? { ...orig, label: z.label, description: z.description, villaSlug: z.villaSlug } : z;
      });
      data = { ...data, canvas: stored.data.canvas, zones };
    }
  }

  try {
    await getDb().contentEntry.upsert({
      where: { key },
      create: { key, data: data as object, updatedById: auth.user.id },
      update: { data: data as object, updatedById: auth.user.id },
    });
  } catch (e) {
    logServerEvent("admin.content.save_failed", e);
    return fail("Your changes couldn't be saved. Please try again.");
  }

  await audit(auth.user, { action: "content.updated", entityType: "content", entityId: key, summary: `Updated ${contentTitles[key]}` });
  updateTag(contentTag(key));
  updateTag(TAGS.content);
  refresh();
  return ok("Saved and published to the website.");
}
