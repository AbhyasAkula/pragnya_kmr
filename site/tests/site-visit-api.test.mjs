/**
 * Integration tests for POST /api/site-visit against a RUNNING server and the
 * REAL database. Synthetic data only; every row and rate-limit counter the
 * tests create is deleted afterwards.
 *
 *   npm run build && npx next start -p 3100      # in one terminal
 *   BASE_URL=http://localhost:3100 npm run test:api
 *
 * Optional: FAILING_BASE_URL points at a second server started with an
 * unreachable DATABASE_URL, to test the storage-failure path.
 *
 * Reads DIRECT_URL / LEAD_HASH_SECRET from the environment or .env.local.
 * Never run against production data you cannot clean up.
 */
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { after, before, describe, test } from "node:test";
import pg from "pg";

const env = { ...loadEnvFile(".env.local"), ...process.env };
const BASE_URL = env.BASE_URL ?? "http://localhost:3100";
const FAILING_BASE_URL = env.FAILING_BASE_URL;
const ENDPOINT = `${BASE_URL}/api/site-visit`;

function loadEnvFile(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, "utf8")
        .split(/\r?\n/)
        .filter((l) => /^[A-Z_]+=/.test(l))
        .map((l) => {
          const i = l.indexOf("=");
          return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
        }),
    );
  } catch {
    return {};
  }
}

/* ------------------------------ helpers ------------------------------ */

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const addDays = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

// Synthetic test identities: TEST-NET IPs (RFC 5737) and an obviously fake number range.
const RUN = Math.floor(Math.random() * 9000 + 1000);
let ipCounter = 0;
const nextIp = () => `203.0.113.${(RUN + ipCounter++) % 250}`;
let phoneCounter = 0;
const nextPhone = () => `+91 99999 ${String(RUN).slice(0, 1)}${String(phoneCounter++).padStart(4, "0")}`;
const normalize = (p) => `+${p.replace(/\D/g, "")}`;

const usedIps = new Set();
const usedPhones = new Set();
const usedKeys = new Set();

function validPayload(overrides = {}) {
  const phone = overrides.phone ?? nextPhone();
  const body = {
    name: "  Synthetic   Test  Visitor ",
    phone,
    date: addDays(today, 7),
    villa: "",
    message: "Synthetic integration test — safe to delete.",
    consent: true,
    company: "",
    idempotencyKey: randomUUID(),
    sourcePath: "/contact",
    ...overrides,
  };
  if (typeof body.phone === "string") usedPhones.add(normalize(body.phone));
  if (typeof body.idempotencyKey === "string") usedKeys.add(body.idempotencyKey);
  return body;
}

async function post(body, { ip = nextIp(), headers = {}, raw, base = ENDPOINT } = {}) {
  usedIps.add(ip);
  const res = await fetch(base, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip, ...headers },
    body: raw ?? JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, headers: res.headers, json, text };
}

/* ------------------------------ database ------------------------------ */

let db;
const dbUrl = new URL(env.DIRECT_URL);
for (const p of ["sslmode", "schema"]) dbUrl.searchParams.delete(p);

before(async () => {
  db = new pg.Client({ connectionString: dbUrl.toString(), ssl: { rejectUnauthorized: false } });
  await db.connect();
  // Fail fast if the server is not running.
  await fetch(BASE_URL, { method: "HEAD" }).catch(() => {
    throw new Error(`No server at ${BASE_URL}. Start one with: npx next start -p 3100`);
  });
});

after(async () => {
  if (!db) return;
  const phones = [...usedPhones];
  const keys = [...usedKeys];
  const deleted = await db.query(
    `DELETE FROM aurelia.site_visit_requests WHERE phone = ANY($1) OR idempotency_key::text = ANY($2)`,
    [phones, keys],
  );
  const hash = (v) => createHmac("sha256", env.LEAD_HASH_SECRET).update(v).digest("base64url").slice(0, 32);
  const subjects = [...[...usedIps].map((ip) => hash(`ip:${ip}`)), ...phones.map((p) => hash(`phone:${p}`))];
  const buckets = await db.query(
    `DELETE FROM aurelia.rate_limit_buckets WHERE split_part(key, ':', 2) = ANY($1)`,
    [subjects],
  );
  // The site-wide counter was bumped by every test request; give those hits back.
  await db.query(
    `UPDATE aurelia.rate_limit_buckets SET hits = GREATEST(hits - $1, 0) WHERE key = 'global-1h:all' AND window_start > now() - interval '2 hours'`,
    [requestCount],
  );
  const left = await db.query(`SELECT count(*)::int AS n FROM aurelia.site_visit_requests WHERE phone = ANY($1)`, [phones]);
  console.log(`cleanup: removed ${deleted.rowCount} test booking(s), ${buckets.rowCount} rate-limit counter(s); remaining test rows: ${left.rows[0].n}`);
  await db.end();
});

let requestCount = 0;
const counted = async (...args) => {
  requestCount++;
  return post(...args);
};

/* -------------------------------- tests -------------------------------- */

describe("successful booking", () => {
  const body = validPayload({ villa: "The Magnolia" });
  let first;

  test("returns 201 with a reference and an honest confirmation", async () => {
    const started = new Date();
    first = await counted(body);
    assert.equal(first.status, 201, first.text);
    assert.equal(first.json.status, "success");
    assert.match(first.json.reference, /^[0-9A-F]{8}$/);
    assert.match(first.json.message, /Synthetic/);
    assert.equal(first.headers.get("cache-control"), "no-store");
    first.started = started;
  });

  test("row is stored in Supabase with NEW status, normalised fields and timestamps", async () => {
    const { rows } = await db.query(
      `SELECT id, name, phone, to_char(visit_date, 'YYYY-MM-DD') AS visit_date, villa, message, status,
              source_path, consent_version, consent_at, created_at, updated_at
         FROM aurelia.site_visit_requests WHERE idempotency_key = $1`,
      [body.idempotencyKey],
    );
    assert.equal(rows.length, 1);
    const r = rows[0];
    assert.equal(r.status, "NEW");
    assert.equal(r.name, "Synthetic Test Visitor", "whitespace collapsed");
    assert.equal(r.phone, normalize(body.phone), "phone normalised");
    assert.equal(r.visit_date, body.date);
    assert.equal(r.villa, "The Magnolia");
    assert.equal(r.source_path, "/contact");
    assert.match(r.consent_version, /^site-visit-/);
    assert.ok(r.id.replace(/-/g, "").toUpperCase().endsWith(first.json.reference));
    const now = Date.now();
    for (const t of [r.created_at, r.updated_at, r.consent_at]) {
      assert.ok(Math.abs(now - t.getTime()) < 120_000, "timestamp is current");
    }
    assert.equal(r.created_at.getTime(), r.updated_at.getTime(), "updated_at = created_at on insert");
  });

  test("retrying the same submission (same idempotency key) does not create a second row", async () => {
    const replay = await counted(body);
    assert.equal(replay.status, 200, replay.text);
    assert.equal(replay.json.reference, first.json.reference);
    const { rows } = await db.query(`SELECT count(*)::int AS n FROM aurelia.site_visit_requests WHERE phone = $1`, [
      normalize(body.phone),
    ]);
    assert.equal(rows[0].n, 1);
  });

  test("a new submission for the same phone and date is rejected as a duplicate (409)", async () => {
    const dup = await counted(validPayload({ phone: body.phone, date: body.date }));
    assert.equal(dup.status, 409, dup.text);
    assert.equal(dup.json.code, "duplicate");
    assert.equal(dup.json.fallback, true);
    const { rows } = await db.query(`SELECT count(*)::int AS n FROM aurelia.site_visit_requests WHERE phone = $1`, [
      normalize(body.phone),
    ]);
    assert.equal(rows[0].n, 1);
  });

  test("once the earlier request is cancelled, the same phone and date can book again", async () => {
    await db.query(`UPDATE aurelia.site_visit_requests SET status = 'CANCELLED' WHERE idempotency_key = $1`, [
      body.idempotencyKey,
    ]);
    const again = await counted(validPayload({ phone: body.phone, date: body.date }));
    assert.equal(again.status, 201, again.text);
  });

  test("the database itself refuses two open requests for one phone and date", async () => {
    // Re-opening the cancelled request while a newer open one exists must fail.
    await assert.rejects(
      db.query(`UPDATE aurelia.site_visit_requests SET status = 'CONTACTED' WHERE idempotency_key = $1`, [
        body.idempotencyKey,
      ]),
      /site_visit_requests_open_phone_date_key/,
    );
  });

  test("updated_at changes on update (trigger); created_at does not", async () => {
    const before = await db.query(
      `SELECT created_at, updated_at FROM aurelia.site_visit_requests WHERE idempotency_key = $1`,
      [body.idempotencyKey],
    );
    await new Promise((r) => setTimeout(r, 50));
    await db.query(`UPDATE aurelia.site_visit_requests SET status = 'COMPLETED' WHERE idempotency_key = $1`, [
      body.idempotencyKey,
    ]);
    const afterRow = await db.query(
      `SELECT created_at, updated_at, status FROM aurelia.site_visit_requests WHERE idempotency_key = $1`,
      [body.idempotencyKey],
    );
    assert.equal(afterRow.rows[0].status, "COMPLETED");
    assert.equal(afterRow.rows[0].created_at.getTime(), before.rows[0].created_at.getTime());
    assert.ok(afterRow.rows[0].updated_at > before.rows[0].updated_at);
  });
});

describe("validation (422, nothing saved)", () => {
  const expectInvalid = async (overrides, field) => {
    const body = validPayload(overrides);
    const res = await counted(body);
    assert.equal(res.status, 422, res.text);
    assert.equal(res.json.code, "invalid");
    assert.ok(res.json.errors?.[field], `expected an error for ${field}: ${res.text}`);
    const { rows } = await db.query(
      `SELECT count(*)::int AS n FROM aurelia.site_visit_requests WHERE idempotency_key::text = $1`,
      [String(body.idempotencyKey)],
    );
    assert.equal(rows[0].n, 0);
    return res;
  };

  test("missing required fields", async () => {
    const res = await counted({ idempotencyKey: randomUUID() });
    assert.equal(res.status, 422, res.text);
    for (const f of ["name", "phone", "date", "consent"]) assert.ok(res.json.errors[f], `missing ${f} error`);
    assert.equal(res.json.errors.villa, undefined, "villa is optional");
    assert.equal(res.json.errors.message, undefined, "message is optional");
  });
  test("name too short / no letters", () => expectInvalid({ name: "1" }, "name"));
  test("name too long", () => expectInvalid({ name: "A".repeat(81) }, "name"));
  test("phone too short", () => expectInvalid({ phone: "12345" }, "phone"));
  test("phone with letters", () => expectInvalid({ phone: "+91 98ABC 43210" }, "phone"));
  test("phone too long", () => expectInvalid({ phone: "+1234567890123456" }, "phone"));
  test("impossible date", () => expectInvalid({ date: "2026-02-31" }, "date"));
  test("malformed date", () => expectInvalid({ date: "tomorrow" }, "date"));
  test("past date", () => expectInvalid({ date: addDays(today, -1) }, "date"));
  test("date beyond 180 days", () => expectInvalid({ date: addDays(today, 181) }, "date"));
  test("unknown villa", () => expectInvalid({ villa: "The Penthouse" }, "villa"));
  test("message over 1000 characters", () => expectInvalid({ message: "x".repeat(1001) }, "message"));
  test("consent not given", () => expectInvalid({ consent: false }, "consent"));
});

describe("malformed and hostile requests", () => {
  test("non-JSON content type → 415", async () => {
    const res = await counted(null, { raw: "name=x", headers: { "content-type": "application/x-www-form-urlencoded" } });
    assert.equal(res.status, 415);
  });
  test("malformed JSON → 400", async () => {
    const res = await counted(null, { raw: "{not json" });
    assert.equal(res.status, 400);
  });
  test("non-string field → 400", async () => {
    const res = await counted(validPayload({ name: ["array"] }));
    assert.equal(res.status, 400);
  });
  test("missing / invalid idempotency key → 400", async () => {
    const res = await counted(validPayload({ idempotencyKey: "not-a-uuid" }));
    assert.equal(res.status, 400);
  });
  test("oversized body → 413", async () => {
    const res = await counted(null, { raw: JSON.stringify(validPayload({ message: "x".repeat(9000) })) });
    assert.equal(res.status, 413);
  });
  test("cross-site Origin → 403", async () => {
    const res = await counted(validPayload(), { headers: { origin: "https://evil.example" } });
    assert.equal(res.status, 403);
  });
  test("honeypot filled → rejected (400), not saved, no fake success", async () => {
    const body = validPayload({ company: "Spam Co" });
    const res = await counted(body);
    assert.equal(res.status, 400);
    assert.equal(res.json.code, "rejected");
    assert.notEqual(res.json.status, "success");
    const { rows } = await db.query(`SELECT count(*)::int AS n FROM aurelia.site_visit_requests WHERE phone = $1`, [
      normalize(body.phone),
    ]);
    assert.equal(rows[0].n, 0);
  });
  test("unsafe sourcePath is dropped, booking still saved", async () => {
    const body = validPayload({ sourcePath: "javascript:alert(1)" });
    const res = await counted(body);
    assert.equal(res.status, 201, res.text);
    const { rows } = await db.query(`SELECT source_path FROM aurelia.site_visit_requests WHERE idempotency_key = $1`, [
      body.idempotencyKey,
    ]);
    assert.equal(rows[0].source_path, null);
  });
  test("there is no endpoint that lists bookings (GET → 405)", async () => {
    const res = await fetch(ENDPOINT);
    assert.equal(res.status, 405);
    assert.doesNotMatch(await res.text(), /Synthetic/);
  });
});

describe("rate limiting (database-backed)", () => {
  test("9th request from one IP within 10 minutes → 429 with Retry-After", async () => {
    const ip = nextIp();
    const statuses = [];
    for (let i = 0; i < 9; i++) {
      // Invalid payloads: they count toward the IP limit without creating rows.
      statuses.push((await counted({ idempotencyKey: randomUUID() }, { ip })).status);
    }
    assert.deepEqual(statuses.slice(0, 8), Array(8).fill(422));
    assert.equal(statuses[8], 429);
    const res = await counted({ idempotencyKey: randomUUID() }, { ip });
    assert.equal(res.status, 429);
    assert.equal(res.json.code, "rate_limited");
    assert.ok(Number(res.headers.get("retry-after")) > 0);
  });

  test("6th valid request for one phone number in a day → 429 (even from different IPs)", async () => {
    const phone = nextPhone();
    const statuses = [];
    for (let i = 1; i <= 6; i++) {
      statuses.push((await counted(validPayload({ phone, date: addDays(today, i) }))).status);
    }
    assert.deepEqual(statuses, [201, 201, 201, 201, 201, 429]);
  });
});

describe("database protections", () => {
  test("CHECK constraints reject bad data written directly to the table", async () => {
    await assert.rejects(
      db.query(
        `INSERT INTO aurelia.site_visit_requests (id, name, phone, visit_date, consent_at, consent_version, idempotency_key)
         VALUES (gen_random_uuid(), 'Synthetic', 'not-a-phone', current_date, now(), 'test', gen_random_uuid())`,
      ),
      /site_visit_requests_phone_check/,
    );
  });
  test("Supabase API roles (anon, authenticated) cannot read bookings", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.query(`SET ROLE ${role}`);
      await assert.rejects(db.query(`SELECT * FROM aurelia.site_visit_requests LIMIT 1`), /permission denied/);
      await db.query(`RESET ROLE`);
    }
  });
});

describe("storage failure", { skip: !FAILING_BASE_URL && "set FAILING_BASE_URL to run" }, () => {
  test("database unreachable → 503 with a safe message and phone/WhatsApp fallback", async () => {
    const res = await post(validPayload(), { base: `${FAILING_BASE_URL}/api/site-visit` });
    assert.equal(res.status, 503, res.text);
    assert.equal(res.json.status, "error");
    assert.equal(res.json.code, "unavailable");
    assert.equal(res.json.fallback, true);
    assert.match(res.json.message, /nothing was booked/);
    assert.doesNotMatch(res.text, /prisma|postgres|ECONNREFUSED|stack|127\.0\.0\.1/i, "no internal details leaked");
  });
});
