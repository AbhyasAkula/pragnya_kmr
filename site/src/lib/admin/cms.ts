import "server-only";
import type { z } from "zod";
import { fieldErrors } from "@/lib/validation/cms";

/** Parses the JSON `payload` field posted by <StructuredForm> and validates it. */
export function parsePayload<T extends z.ZodType>(
  formData: FormData,
  schema: T,
  transform: (raw: Record<string, unknown>) => unknown = (r) => r,
): { ok: true; data: z.output<T> } | { ok: false; errors: Record<string, string> } {
  const raw = formData.get("payload");
  if (typeof raw !== "string" || raw.length > 400_000) return { ok: false, errors: { _form: "The form couldn't be read." } };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, errors: { _form: "The form couldn't be read." } };
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) return { ok: false, errors: { _form: "The form couldn't be read." } };
  const parsed = schema.safeParse(transform(json as Record<string, unknown>));
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, errors: fieldErrors(parsed.error) };
}

type FlatImage = { id?: string; photo?: { src?: string; alt?: string } } & Record<string, unknown>;

/** The forms nest list images as { photo: {src, alt} }; storage keeps them flat. Errors map back to `photo.*`. */
export function flattenPhotos(items: unknown) {
  if (!Array.isArray(items)) return items;
  return (items as FlatImage[]).map(({ photo, ...rest }) => ({ ...rest, src: photo?.src ?? "", alt: photo?.alt ?? "" }));
}

/** Rewrites "gallery.2.src" → "gallery.2.photo.src" so errors land on the image field. */
export function nestPhotoErrors(errors: Record<string, string>, listNames: string[]) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(errors)) {
    const m = /^(\w+)\.(\d+)\.(src|alt)$/.exec(k);
    out[m && listNames.includes(m[1]) ? `${m[1]}.${m[2]}.photo.${m[3]}` : k] = v;
  }
  return out;
}
