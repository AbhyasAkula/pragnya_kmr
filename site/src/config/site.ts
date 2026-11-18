import { company } from "@/content/company";

/**
 * Central brand & business configuration.
 *
 * PLACEHOLDER CONTENT — every value marked below is fictional and must be
 * replaced with the client's verified details before launch. Run
 * `npm run check:placeholders` to list what is still outstanding.
 */
const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+91 90000 00000"; // PLACEHOLDER

/** Strips formatting; keeps a leading "+" when `keepPlus` is set. */
function digitsOnly(value: string, keepPlus: boolean) {
  const digits = value.replace(/\D/g, "");
  return keepPlus && value.trim().startsWith("+") ? `+${digits}` : digits;
}

export const siteConfig = {
  name: "Aurelia Enclave",
  shortName: "Aurelia",
  /** Company details live in src/content/company.ts (kept separate from project data). */
  developer: company.name,
  tagline: "A gated villa community",
  /** Wordmark text shown next to the monogram. Replace with the real logo asset. */
  logo: { wordmark: "Aurelia", subline: "Enclave" },
  /** Short "about" paragraph used in the footer. */
  summary:
    "A gated community of private villas, designed for families who value space, privacy and craftsmanship.",
  keywords: [
    "gated community villas",
    "luxury villas",
    "3 BHK villa",
    "4 BHK villa",
    "villa community Hyderabad",
    "premium real estate",
  ],
  locale: "en_IN",
  htmlLang: "en-IN",
  /** IANA zone used for business-day logic such as "earliest visit date". */
  timeZone: "Asia/Kolkata",
  location: {
    street: "Survey No. 000, Serene Hills Road", // PLACEHOLDER
    city: "Hyderabad",
    region: "Telangana",
    postalCode: "500000", // PLACEHOLDER
    country: "IN",
    mapUrl: "https://maps.google.com/?q=Hyderabad", // PLACEHOLDER
  },
  /**
   * PLACEHOLDER contact details — fictional. Override per deployment with the
   * NEXT_PUBLIC_CONTACT_* env vars (see .env.example) or edit the fallbacks.
   * `phoneHref` and the WhatsApp link are derived, never typed separately.
   */
  contact: {
    phone: CONTACT_PHONE,
    phoneHref: `tel:${digitsOnly(CONTACT_PHONE, true)}`,
    /** International number for wa.me, digits only (country code first, no "+"). */
    whatsapp: digitsOnly(process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? CONTACT_PHONE, false),
    whatsappMessage: "Hello, I'm interested in Aurelia Enclave villas. Please share more details.",
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "sales@example.com", // PLACEHOLDER
    hours: "Site office open daily, 10 AM – 6 PM", // PLACEHOLDER
  },
  rera: "P02400000000", // PLACEHOLDER — must be the real registration number
  /** PLACEHOLDER profile URLs. Not emitted in structured data until real. */
  social: [
    { label: "Instagram", href: "https://instagram.com/", icon: "instagram" },
    { label: "Facebook", href: "https://facebook.com/", icon: "facebook" },
    { label: "YouTube", href: "https://youtube.com/", icon: "youtube" },
    { label: "LinkedIn", href: "https://linkedin.com/", icon: "linkedin" },
  ],
  features: {
    /**
     * false = the enquiry form runs in clearly-labelled DEMO mode: input is
     * validated but nothing is stored or sent. Flip to true only once
     * `src/actions/site-visit.ts` persists leads.
     */
    leadStorageConnected: false,
  },
  /** Static so pages stay fully prerenderable under Cache Components. */
  copyrightYear: 2026,
} as const;

export type SiteConfig = typeof siteConfig;
export type SocialIconName = SiteConfig["social"][number]["icon"];

/**
 * Canonical origin of the deployed site, from NEXT_PUBLIC_SITE_URL.
 * `null` when unset: the site then emits no canonical URLs and asks search
 * engines not to index it, rather than advertising a made-up domain.
 */
export const siteUrl: URL | null = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

function resolveSiteUrl(raw: string | undefined): URL | null {
  const value = raw?.trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`NEXT_PUBLIC_SITE_URL must be an absolute URL, received "${value}".`);
  }
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error(`NEXT_PUBLIC_SITE_URL must use https, received "${value}".`);
  }
  return new URL(url.origin);
}
