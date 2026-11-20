import "server-only";
import { contentDefaults } from "@/lib/content/defaults";
import { getDb } from "@/lib/server/db";
import { contentSchemas, type ContentKey, type ContentValue } from "@/lib/validation/cms";

/** Current saved value of a content section for editing (uncached), plus who changed it last. */
export async function getContentForEdit<K extends ContentKey>(key: K) {
  const row = await getDb().contentEntry.findUnique({ where: { key } });
  const parsed = row ? contentSchemas[key].safeParse(row.data) : null;
  const editor = row?.updatedById
    ? await getDb().staffMember.findUnique({ where: { id: row.updatedById }, select: { fullName: true } })
    : null;
  return {
    value: (parsed?.success ? parsed.data : contentDefaults[key]) as ContentValue<K>,
    updatedAt: row?.updatedAt ?? null,
    updatedBy: editor?.fullName ?? null,
  };
}
