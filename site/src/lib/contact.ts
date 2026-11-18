import { siteConfig } from "@/config/site";

/**
 * Contact links built only from centralised config (src/config/site.ts /
 * NEXT_PUBLIC_CONTACT_* env vars) — never hardcode numbers in components.
 */

/** WhatsApp click-to-chat link with a prefilled message. */
export function whatsappHref(message: string = siteConfig.contact.whatsappMessage) {
  return `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const phoneHref = siteConfig.contact.phoneHref;
export const emailHref = `mailto:${siteConfig.contact.email}`;

/** Contact page URL for booking a visit, optionally pre-selecting a villa. */
export function contactHref(villaSlug?: string) {
  const params = new URLSearchParams({ type: "visit" });
  if (villaSlug) params.set("villa", villaSlug);
  return `/contact?${params.toString()}`;
}
