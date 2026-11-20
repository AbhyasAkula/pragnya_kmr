import "server-only";
import { createHmac } from "node:crypto";
import { getDb } from "./db";

/**
 * Database-backed fixed-window rate limiting. Counters live in Postgres, so
 * limits hold across serverless instances and cold starts (an in-memory map
 * would reset per instance). Keys are salted HMACs: no raw IPs or phone
 * numbers are stored.
 */

export class RateLimitConfigError extends Error {
  name = "RateLimitConfigError";
}

export type RateLimitRule = { name: string; limit: number; windowSeconds: number };

/** Salted, non-reversible key for a visitor attribute (IP, phone…). */
export function hashKey(value: string): string {
  const secret = process.env.LEAD_HASH_SECRET;
  if (!secret || secret.length < 32) {
    throw new RateLimitConfigError("LEAD_HASH_SECRET must be set (32+ characters)");
  }
  return createHmac("sha256", secret).update(value).digest("base64url").slice(0, 32);
}

/**
 * Counts one hit against each rule — atomically, in a single upsert
 * round-trip — and reports whether every rule is still within its limit.
 * `subjects` maps a rule name to its (hashed) subject; rules without an
 * entry use `"all"` (site-wide counters).
 */
export async function consume(
  rules: readonly RateLimitRule[],
  subjects: Record<string, string>,
): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  const now = Date.now();
  const buckets = rules.map((rule) => {
    const windowMs = rule.windowSeconds * 1000;
    const windowStart = Math.floor(now / windowMs) * windowMs;
    return {
      rule,
      key: `${rule.name}:${subjects[rule.name] ?? "all"}`,
      windowStart: new Date(windowStart),
      resetSeconds: Math.ceil((windowStart + windowMs - now) / 1000),
    };
  });

  const rows = await getDb().$queryRaw<{ key: string; hits: number }[]>`
    INSERT INTO "aurelia"."rate_limit_buckets" ("key", "window_start", "hits")
    SELECT k, w, 1 FROM unnest(${buckets.map((b) => b.key)}::text[], ${buckets.map((b) => b.windowStart)}::timestamptz[]) AS t(k, w)
    ON CONFLICT ("key", "window_start")
    DO UPDATE SET "hits" = "rate_limit_buckets"."hits" + 1
    RETURNING "key", "hits"`;

  const hits = new Map(rows.map((r) => [r.key, Number(r.hits)]));
  const exceeded = buckets.filter((b) => (hits.get(b.key) ?? 0) > b.rule.limit);
  return exceeded.length > 0
    ? { ok: false, retryAfterSeconds: Math.max(...exceeded.map((b) => b.resetSeconds)) }
    : { ok: true };
}

/** Deletes expired counters. Cheap; run occasionally after a response. */
export async function pruneRateLimits() {
  await getDb().rateLimitBucket.deleteMany({
    where: { windowStart: { lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } },
  });
}
