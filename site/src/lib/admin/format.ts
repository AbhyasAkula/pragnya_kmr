/** Display helpers for the dashboard. All dates are shown in India time. */
import type { Tone } from "@/components/admin/ui";

export const TZ = "Asia/Kolkata";

/** Current time. Admin pages render per request, so reading the clock is intended. */
export function nowMs() {
  return Date.now();
}

export const BOOKING_STATUSES = ["NEW", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export const OPEN_STATUSES: BookingStatus[] = ["NEW", "CONTACTED", "CONFIRMED"];

export const bookingStatus: Record<BookingStatus, { label: string; tone: Tone; help: string }> = {
  NEW: { label: "New", tone: "gold", help: "Not contacted yet" },
  CONTACTED: { label: "Contacted", tone: "info", help: "Spoke to the customer; visit not fixed" },
  CONFIRMED: { label: "Confirmed", tone: "success", help: "Visit date and time agreed" },
  COMPLETED: { label: "Completed", tone: "neutral", help: "Visit took place" },
  CANCELLED: { label: "Cancelled", tone: "danger", help: "Not going ahead" },
};

export function bookingReference(id: string) {
  return id.replace(/-/g, "").slice(-8).toUpperCase();
}

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  const date = typeof d === "string" ? new Date(d.length === 10 ? `${d}T00:00:00Z` : d) : d;
  const isDateOnly = typeof d === "string" && d.length === 10;
  return new Intl.DateTimeFormat("en-IN", { ...opts, timeZone: isDateOnly ? "UTC" : TZ }).format(date);
}

/** Calendar date stored as DATE (UTC midnight) → "Sat, 21 Nov 2026". */
export function formatVisitDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(d);
}

export function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: TZ }).format(d);
}

export function relativeDays(from: Date, to = new Date()) {
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days === -1) return "tomorrow";
  return days > 0 ? `${days} days ago` : `in ${-days} days`;
}

/** Start of a calendar day in India time, as an absolute instant. */
export function istDayStart(isoDate: string) {
  return new Date(`${isoDate}T00:00:00+05:30`);
}

/** Phone for display: "+91 98765 43210" when it is an Indian number. */
export function formatPhone(phone: string) {
  const m = /^\+?91(\d{5})(\d{5})$/.exec(phone);
  return m ? `+91 ${m[1]} ${m[2]}` : phone;
}
