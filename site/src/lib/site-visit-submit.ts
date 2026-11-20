/**
 * Browser-side submission of the "Book a Site Visit" form to /api/site-visit.
 * Validates locally first (instant feedback); the server validates again and
 * is the source of truth. Success is reported only when the API confirms the
 * request was saved.
 */
import { siteConfig } from "@/config/site";
import { todayInTimeZone } from "@/lib/dates";
import {
  siteVisitFields,
  validateSiteVisit,
  type SiteVisitField,
  type SiteVisitPayload,
  type SiteVisitResponse,
  type SiteVisitState,
} from "@/lib/validation/site-visit";

const callUs = `please call ${siteConfig.contact.phone} or message us on WhatsApp`;

/** RFC 4122 v4 UUID; falls back to getRandomValues where randomUUID is unavailable (non-HTTPS). */
export function newIdempotencyKey(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export async function submitSiteVisit(
  formData: FormData,
  { idempotencyKey, villaOptions }: { idempotencyKey: string; villaOptions: readonly string[] },
): Promise<SiteVisitState> {
  const values = Object.fromEntries(
    siteVisitFields.map((f) => [f, String(formData.get(f) ?? "")]),
  ) as Record<SiteVisitField, string>;

  if (!siteConfig.features.leadStorageConnected) {
    return {
      status: "error",
      message: `Online booking isn't available yet, so this request was not sent. To book a visit, ${callUs}.`,
      values,
      fallback: true,
    };
  }

  const local = validateSiteVisit(values, {
    today: todayInTimeZone(siteConfig.timeZone),
    villaOptions,
  });
  if ("errors" in local) {
    return { status: "error", message: "Please check the highlighted fields.", errors: local.errors, values };
  }

  const payload: SiteVisitPayload = {
    name: values.name,
    phone: values.phone,
    date: values.date,
    villa: values.villa,
    message: values.message,
    consent: values.consent === "on",
    company: String(formData.get("company") ?? ""),
    idempotencyKey,
    sourcePath: window.location.pathname,
  };

  let response: Response;
  try {
    response = await fetch("/api/site-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return {
      status: "error",
      message: `We couldn't reach our server, so your request may not have been sent. Check your connection and try again, or ${callUs}.`,
      values,
      fallback: true,
    };
  }

  const data = (await response.json().catch(() => null)) as SiteVisitResponse | null;
  if (response.ok && data?.status === "success") {
    return { status: "success", message: data.message, reference: data.reference };
  }
  if (data?.status === "error") {
    return { status: "error", message: data.message, errors: data.errors, values, fallback: data.fallback };
  }
  return {
    status: "error",
    message: `Something went wrong and your request was not saved. Please try again, or ${callUs}.`,
    values,
    fallback: true,
  };
}
