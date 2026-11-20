import type { SiteContact } from "@/types/content";

/**
 * Contact links built only from the managed contact details (admin
 * dashboard → Content → Contact details) — never hardcode numbers in components.
 */

/** Strips formatting; keeps a leading "+". */
export function phoneHref(contact: Pick<SiteContact, "phone">) {
  const digits = contact.phone.replace(/\D/g, "");
  return `tel:${contact.phone.trim().startsWith("+") ? "+" : ""}${digits}`;
}

/** WhatsApp click-to-chat link with a prefilled message. */
export function whatsappHref(contact: Pick<SiteContact, "whatsapp" | "whatsappMessage">, message = contact.whatsappMessage) {
  return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function emailHref(contact: Pick<SiteContact, "email">) {
  return `mailto:${contact.email}`;
}

/** Contact page URL for booking a visit, optionally pre-selecting a villa. */
export function contactHref(villaSlug?: string) {
  const params = new URLSearchParams({ type: "visit" });
  if (villaSlug) params.set("villa", villaSlug);
  return `/contact?${params.toString()}`;
}
