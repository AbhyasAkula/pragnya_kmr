/** Shared between the API route, the form UI and (future) admin/API consumers. */
import { addDays, isValidIsoDate } from "@/lib/dates";

/** Site-visit booking fields. Order = focus order for the first invalid field. */
export const siteVisitFields = ["name", "phone", "date", "villa", "message", "consent"] as const;
export type SiteVisitField = (typeof siteVisitFields)[number];

/** Limits mirrored as `maxLength` on the inputs and as DB column sizes. */
export const siteVisitLimits = {
  name: 80,
  phone: 20,
  message: 1000,
  /** How far ahead a visit can be requested. */
  maxDaysAhead: 180,
} as const;

export type SiteVisitRequest = {
  name: string;
  /** Digits only, with a leading "+" when the visitor supplied a country code. */
  phone: string;
  date: string; // YYYY-MM-DD
  villa: string | null;
  message: string | null;
};

export type SiteVisitState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<SiteVisitField, string>>;
  values?: Partial<Record<SiteVisitField, string>>;
  /** Show the call / WhatsApp alternatives (the request was not saved). */
  fallback?: boolean;
  /** Short booking reference, only once the database has saved the request. */
  reference?: string;
};

/**
 * JSON body of POST /api/site-visit. `company` is the honeypot; the
 * idempotency key is generated once per form, so retries are not duplicated.
 */
export type SiteVisitPayload = Record<Exclude<SiteVisitField, "consent">, string> & {
  consent: boolean;
  company?: string;
  idempotencyKey: string;
  sourcePath?: string;
};

/** JSON response of POST /api/site-visit. Never contains other customers' data. */
export type SiteVisitResponse =
  | { status: "success"; message: string; reference: string }
  | {
      status: "error";
      code: "invalid" | "duplicate" | "rate_limited" | "rejected" | "unavailable" | "bad_request";
      message: string;
      errors?: Partial<Record<SiteVisitField, string>>;
      fallback?: boolean;
    };

/** Strips spaces, dashes, dots and brackets; keeps a leading "+". */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

/** Accepts only a plain site path like "/contact" or "/villas/x"; anything else → null. */
export function sanitizeSourcePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.trim();
  if (path.length === 0 || path.length > 200) return null;
  return /^\/[a-z0-9\-/]*$/i.test(path) && !path.startsWith("//") ? path : null;
}

type ValidationContext = {
  /** Today's date in the business time zone (YYYY-MM-DD). */
  today: string;
  /** Villa names the visitor may choose; anything else is rejected. */
  villaOptions: readonly string[];
};

export function validateSiteVisit(
  input: Record<SiteVisitField, string>,
  { today, villaOptions }: ValidationContext,
): { data: SiteVisitRequest } | { errors: Partial<Record<SiteVisitField, string>> } {
  const errors: Partial<Record<SiteVisitField, string>> = {};
  // Collapse whitespace and drop control characters (keeps line breaks in the message).
  const name = input.name.replace(/\p{Cc}/gu, " ").trim().replace(/\s+/g, " ");
  const rawPhone = input.phone.trim();
  const phone = normalizePhone(rawPhone);
  const date = input.date.trim();
  const villa = input.villa.trim();
  const message = input.message
    .replace(/\r\n?/g, "\n")
    .replace(/[^\P{Cc}\n\t]/gu, "")
    .trim();
  const latest = addDays(today, siteVisitLimits.maxDaysAhead);

  if (name.length < 2 || name.length > siteVisitLimits.name || !/\p{L}/u.test(name)) {
    errors.name = "Please enter your full name.";
  }

  const digitCount = phone.replace("+", "").length;
  if (
    rawPhone.length > siteVisitLimits.phone ||
    !/^\+?[\d\s().-]+$/.test(rawPhone) ||
    digitCount < 10 ||
    digitCount > 15
  ) {
    errors.phone = "Enter a valid phone number, e.g. +91 98765 43210.";
  }

  if (!date) errors.date = "Choose a preferred visit date.";
  else if (!isValidIsoDate(date)) errors.date = "Enter a valid date.";
  else if (date < today) errors.date = "Please pick today or a future date.";
  else if (date > latest) {
    errors.date = `Please pick a date within the next ${siteVisitLimits.maxDaysAhead} days.`;
  }

  if (message.length > siteVisitLimits.message) {
    errors.message = `Please keep your message under ${siteVisitLimits.message} characters.`;
  }

  if (villa && !villaOptions.includes(villa)) {
    errors.villa = "Please choose a villa from the list.";
  }

  if (input.consent !== "on") {
    errors.consent = "Please tick this box so we can contact you about your visit.";
  }

  if (Object.keys(errors).length > 0) return { errors };
  return {
    data: { name, phone, date, villa: villa || null, message: message || null },
  };
}
