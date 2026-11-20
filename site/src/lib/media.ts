/**
 * Image URL rules shared by the admin forms, server validation and
 * next.config (images.remotePatterns). An image may only point at:
 *  - files uploaded through the dashboard (Supabase Storage, public bucket),
 *  - the original placeholder imagery already on the site, or
 *  - a local file in /public.
 * Anything else would fail in next/image, so it is rejected up front.
 */
export const MEDIA_BUCKET = "site-media";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "") ?? "";

/** Public URL prefix for uploaded files, e.g. https://<ref>.supabase.co/storage/v1/object/public/site-media/ */
export const mediaPublicPrefix = supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/` : null;

const UNSPLASH = /^https:\/\/images\.unsplash\.com\/photo-[\w-]+\?auto=format&fit=crop&w=2400&q=80$/;

export function isAllowedImageSrc(src: string): boolean {
  if (src.startsWith("/") && !src.startsWith("//") && !src.includes("..")) return true;
  if (mediaPublicPrefix && src.startsWith(mediaPublicPrefix) && !src.includes("..")) return true;
  return UNSPLASH.test(src);
}

/** True for images that are still the original stock placeholders. */
export function isPlaceholderImage(src: string) {
  return src.startsWith("https://images.unsplash.com/");
}
