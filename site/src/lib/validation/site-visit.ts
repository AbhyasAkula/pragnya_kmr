/** Shared between the server action, the form UI and (future) admin/API consumers. */
import { addDays, isValidIsoDate } from "@/lib/dates";

/** Site-visit booking fields. Order = focus order for the first invalid field. */
export const siteVisitFields = ["name", "phone", "date", "villa", "message"] as const;
export type SiteVisitField = (typeof siteVisitFields)[number];

/** Limits mirrored as `maxLength` on the inputs. */
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
  /** true when the form ran without lead storage (nothing was sent or saved). */
  demo?: boolean;
  message?: string;
  errors?: Partial<Record<SiteVisitField, string>>;
  values?: Partial<Record<SiteVisitField, string>>;
};

/** Strips spaces, dashes, dots and brackets; keeps a leading "+". */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
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
  const name = input.name.trim().replace(/\s+/g, " ");
  const rawPhone = input.phone.trim();
  const phone = normalizePhone(rawPhone);
  const date = input.date.trim();
  const villa = input.villa.trim();
  const message = input.message.trim();
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

  if (Object.keys(errors).length > 0) return { errors };
  return {
    data: { name, phone, date, villa: villa || null, message: message || null },
  };
}
