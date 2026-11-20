import { after } from "next/server";
import { siteConfig, siteUrl } from "@/config/site";
import { getContactDetails, getEnquiryVillaOptions } from "@/lib/data";
import { readContentNow } from "@/lib/server/site-data";
import { todayInTimeZone } from "@/lib/dates";
import { logServerEvent } from "@/lib/server/log";
import { consume, hashKey, pruneRateLimits, type RateLimitRule } from "@/lib/server/rate-limit";
import { createSiteVisit, findReplay } from "@/lib/server/site-visits";
import {
  isUuid,
  sanitizeSourcePath,
  siteVisitFields,
  validateSiteVisit,
  type SiteVisitField,
  type SiteVisitResponse,
} from "@/lib/validation/site-visit";

/**
 * POST /api/site-visit — stores a "Book a Site Visit" request.
 *
 * Write-only: there is deliberately no GET/list endpoint. Bookings are read
 * only by server-side code (the Phase 3 admin dashboard).
 *
 * 201 created · 200 idempotent replay · 400 bad request · 403 cross-site
 * 409 duplicate · 413 too large · 415 not JSON · 422 invalid fields
 * 429 rate limited · 503 storage unavailable
 */

const MAX_BODY_BYTES = 8 * 1024;

/** Per-IP limits apply to every attempt; per-phone limits to valid ones. */
const IP_RULES: RateLimitRule[] = [
  { name: "ip-10m", limit: 8, windowSeconds: 10 * 60 },
  { name: "ip-1d", limit: 30, windowSeconds: 24 * 60 * 60 },
];
const PHONE_RULES: RateLimitRule[] = [{ name: "phone-1d", limit: 5, windowSeconds: 24 * 60 * 60 }];
/** Site-wide safety valve against distributed floods. */
const GLOBAL_RULES: RateLimitRule[] = [{ name: "global-1h", limit: 300, windowSeconds: 60 * 60 }];

/** Fallback wording; the phone number comes from the managed contact details. */
const callUs = (phone: string) => `please call ${phone} or message us on WhatsApp`;

function respond(status: number, body: SiteVisitResponse, headers: Record<string, string> = {}) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers },
  });
}

const unavailable = (phone: string) =>
  respond(503, {
    status: "error",
    code: "unavailable",
    message: `Sorry — we couldn't save your request just now and nothing was booked. Please try again in a few minutes, or ${callUs(phone)}.`,
    fallback: true,
  });

const badRequest = (status = 400, message = "We couldn't read that request. Please refresh the page and try again.") =>
  respond(status, { status: "error", code: "bad_request", message, fallback: true });

/** Browsers send Origin on POST; reject cross-site posts (CSRF). */
function isCrossSite(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return true;
  const origin = request.headers.get("origin");
  if (!origin) return false; // non-browser client; still validated and rate limited
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return true;
  }
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  return originHost !== host && originHost !== siteUrl?.host;
}

function clientIp(request: Request) {
  // Set by the hosting platform's proxy (e.g. Vercel overwrites it).
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

async function readJson(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; status: number }> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return { ok: false, status: 413 };
  if (!request.body) return { ok: false, status: 400 };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return { ok: false, status: 413 };
    }
    chunks.push(value);
  }
  try {
    return { ok: true, value: JSON.parse(Buffer.concat(chunks).toString("utf8")) };
  } catch {
    return { ok: false, status: 400 };
  }
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

function successBody(reference: string, name?: string): SiteVisitResponse {
  const firstName = name?.split(" ")[0];
  return {
    status: "success",
    reference,
    message: `Thank you${firstName ? `, ${firstName}` : ""}. Your request has been received (reference ${reference}). A relationship manager will call you to confirm your visit.`,
  };
}

export async function POST(request: Request) {
  // Managed contact details and the online-booking switch (cached reads).
  // The booking switch is read uncached so turning it off/on takes effect immediately.
  const [contact, settings] = await Promise.all([getContactDetails().catch(() => null), readContentNow("settings").catch(() => null)]);
  const phone = contact?.phone ?? siteConfig.contact.phone;
  if (!siteConfig.features.leadStorageConnected || !settings?.acceptingOnlineBookings) return unavailable(phone);

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return badRequest(415, "Unsupported request format.");
  }
  if (isCrossSite(request)) return badRequest(403, "This request was blocked.");

  const body = await readJson(request);
  if (!body.ok) {
    return body.status === 413 ? badRequest(413, "That request is too large. Please shorten your message.") : badRequest();
  }
  const payload = body.value;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return badRequest();
  const p = payload as Record<string, unknown>;

  // Every text field must be a string (or absent); consent must be boolean true.
  const values = {} as Record<SiteVisitField, string>;
  for (const field of siteVisitFields) {
    const v = p[field];
    if (field === "consent") {
      if (v !== undefined && typeof v !== "boolean") return badRequest();
      values.consent = v === true ? "on" : "";
    } else {
      if (v !== undefined && typeof v !== "string") return badRequest();
      values[field] = v ?? "";
    }
  }
  if (p.company !== undefined && typeof p.company !== "string") return badRequest();

  try {
    // Rate limits first, so probing with invalid data is throttled too.
    const ipHash = hashKey(`ip:${clientIp(request)}`);
    const ipLimit = await consume(
      [...IP_RULES, ...GLOBAL_RULES],
      Object.fromEntries(IP_RULES.map((r) => [r.name, ipHash])),
    );
    if (Math.random() < 0.05) after(() => pruneRateLimits().catch((e) => logServerEvent("ratelimit.prune_failed", e)));
    if (!ipLimit.ok) {
      logServerEvent("site_visit.rate_limited_ip");
      return respond(
        429,
        {
          status: "error",
          code: "rate_limited",
          message: `Too many requests from this connection. Please wait a few minutes, or ${callUs(phone)}.`,
          fallback: true,
        },
        { "Retry-After": String(ipLimit.retryAfterSeconds) },
      );
    }

    // Honeypot: hidden from people, so only bots fill it. Not saved — and,
    // unlike before, never answered with a fake success.
    if (typeof p.company === "string" && p.company.trim() !== "") {
      logServerEvent("site_visit.honeypot");
      return respond(400, {
        status: "error",
        code: "rejected",
        message: `We couldn't accept this request. Please ${callUs(phone)}.`,
        fallback: true,
      });
    }

    const result = validateSiteVisit(values, {
      today: todayInTimeZone(siteConfig.timeZone),
      villaOptions: await getEnquiryVillaOptions(),
    });
    if ("errors" in result) {
      return respond(422, {
        status: "error",
        code: "invalid",
        message: "Please check the highlighted fields.",
        errors: result.errors,
      });
    }

    if (!isUuid(p.idempotencyKey)) return badRequest();
    const idempotencyKey = p.idempotencyKey.toLowerCase();

    // A retry of an already-saved submission (double click, flaky network).
    const replay = await findReplay(idempotencyKey);
    if (replay?.kind === "replayed") return respond(200, successBody(replay.receipt.reference, result.data.name));

    const phoneHash = hashKey(`phone:${result.data.phone}`);
    const phoneLimit = await consume(PHONE_RULES, Object.fromEntries(PHONE_RULES.map((r) => [r.name, phoneHash])));
    if (!phoneLimit.ok) {
      logServerEvent("site_visit.rate_limited_phone");
      return respond(
        429,
        {
          status: "error",
          code: "rate_limited",
          message: `We've received several requests from this number today. Our team will be in touch — or ${callUs(phone)}.`,
          fallback: true,
        },
        { "Retry-After": String(phoneLimit.retryAfterSeconds) },
      );
    }

    const saved = await createSiteVisit({
      ...result.data,
      sourcePath: sanitizeSourcePath(p.sourcePath),
      consentVersion: siteConfig.privacy.consentVersion,
      idempotencyKey,
    });

    if (saved.kind === "duplicate") {
      return respond(409, {
        status: "error",
        code: "duplicate",
        message: `We already have a site-visit request from this number for ${formatDate(saved.visitDate)}, so we haven't created another. Our team will call you to confirm it. To change it, ${callUs(phone)}.`,
        fallback: true,
      });
    }

    logServerEvent(saved.kind === "created" ? "site_visit.created" : "site_visit.replayed");
    return respond(saved.kind === "created" ? 201 : 200, successBody(saved.receipt.reference, result.data.name));
  } catch (error) {
    // Database/config failure: nothing was saved. Log the class/code only.
    logServerEvent("site_visit.storage_failed", error);
    return unavailable(phone);
  }
}
